var gd = module.exports = Object.create(require('node-gd')),
    fs = require('fs'),
    stream = require('stream'),
    vargs = require('vargs-callback'),
    _ = require('underscore'),
    formats = require('./lib/formats.js'),
    errors = require('./lib/errors.js')


_.extend(gd,
    errors.classes,
    require('./lib/transform.js')
)

_.extend(gd.Image.prototype,
    require('./lib/image.js')
)

var openDefaults = {
    autoOrient: true,
}

gd.open = vargs(function open(source, options, callback) {
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

    if (source instanceof stream.Readable) {
        if (!async) throw gd.SynchronousStreamAccessError()
        return readStream(source, callback)
    }

    return callback(gd.UnknownSourceTypeError())
}

function openImage(imageData, options) {
    options = _(options || {}).defaults(openDefaults)

    if (!imageData.length) throw gd.EmptySourceError()

    var format = formats.getImageFormat(imageData)
    var image = format.open(imageData)
    if (!image) throw gd.IncompleteImageError()
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
        dataRead = dataRead.concat(chunk)
    })

    stream.on('end', function () {
        return callback(null, dataRead)
    })

    stream.on('error', function (error) {
        return wrapFileReadingError(error, callback)
    })
}

function wrapFileReadingError(error, callback) {
    if (error.code === 'ENOENT') return callback(gd.FileDoesNotExistError())
    return callback(gd.FileOpenError(error.message))
}
