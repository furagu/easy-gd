
var fs = require('fs'),
    buffertools = require('buffertools'),
    stream = require('readable-stream'),
    vargs = require('vargs-callback'),
    _ = require('underscore'),
    formats = require('./formats.js'),
    errors = require('./errors.js')

var openDefaults = {
    autoOrient: true,
}

exports.open = vargs(function open(source, options, callback) {
    var async = !!callback
    return readSource(source, async, function (err, imageData) {
        if (err) return errors.routeError(err, callback)
        try {
            var image = openImage(imageData, options)
            if (async) return callback(null, image)
            return image
        } catch (e) {
            return errors.routeError(e, callback)
        }
    })
})

function readSource(source, async, callback) {
    if (source instanceof Buffer) return callback(null, source)

    if (typeof source === 'string') {
        if (async) return readStream(fs.createReadStream(source), callback)
        try {
            var data = fs.readFileSync(source)
        } catch (e) {
            return wrapFileReadingError(e, callback)
        }
        return callback(null, data)
    }

    if (source.on) {
        if (!async) throw errors.SynchronousStreamAccessError()
        return readStream(source, callback)
    }

    return callback(errors.UnknownSourceTypeError())
}

function openImage(imageData, options) {
    options = _(options || {}).defaults(openDefaults)

    if (!imageData.length) throw errors.EmptySourceError()

    var format = formats.getImageFormat(imageData)
    var image
    try {
        image = format.open(imageData)
    } catch(e) {
        throw errors.IncompleteImageError()
    }
    if (!image) throw errors.IncompleteImageError()
    image.format = format.label

    if (options.autoOrient && image.exif) {
        try {
            return image.autoOrient()
        } catch (e) {
            // ignore auto orientation errors
        }
    }

    return image
}

function readStream(stream, callback) {
    var dataRead = Buffer(0)

    stream.on('data', function (chunk) {
        dataRead = buffertools.concat(dataRead, chunk)
    })

    stream.on('end', function () {
        return callback(null, dataRead)
    })

    stream.on('error', function (error) {
        return wrapFileReadingError(error, callback)
    })
}

function wrapFileReadingError(error, callback) {
    if (error.code === 'ENOENT') return callback(errors.FileDoesNotExistError())
    return callback(errors.FileOpenError(error.message))
}
