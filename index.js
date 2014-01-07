var gd = module.exports = Object.create(require('node-gd')),
    fs = require('fs'),
    stream = require('stream'),
    util = require('util'),
    buffertools = require('buffertools'), // TODO: looks like buffertools are not needed anymore
    vargs = require('vargs-callback'),
    clone = require('clone'), // TODO: maybe _.clone would be sufficient?
    async = require('async'),
    assert = require('assert'),
    _ = require('underscore'),
    formats = require('./lib/formats.js')


_.extend(gd, require('./lib/errors.js'))

var openDefaults = {
    autoOrient: true,
}


function GdTransform(options) {
    if (!(this instanceof GdTransform)) return new GdTransform(options)
    stream.Transform.call(this, options)
    this.buffer = Buffer(0)
    this.actions = []
    this.imageOptions = {}
}
util.inherits(GdTransform, stream.Transform)

GdTransform.prototype._transform = function _transform(chunk, encoding, done) {
    if (!(chunk instanceof Buffer)) chunk = Buffer(chunk, encoding)
    this.buffer = this.buffer.concat(chunk)
    done()
}

GdTransform.prototype._flush = function _flush(done) {
    this.actions.unshift(_.partial(gd.open, this.buffer))
    this.actions.push(function (image, callback) {
        this.push(image.save(this.imageOptions))
        callback()
    }.bind(this))
    async.waterfall(this.actions, done)
}

GdTransform.prototype.options = function options(options) {
    _.extend(this.imageOptions, options)
    return this
}

_.each(['format', 'quality', 'compression'], function (option) {
    GdTransform.prototype[option] = function (optionValue) {
        this.imageOptions[option] = optionValue
        return this
    }
})

_.each(['resize', 'watermark', 'crop'], function (method) {
    GdTransform.prototype[method] = function () {
        var args = Array.prototype.slice.apply(arguments)
        this.actions.push(function (image, callback) {
            image[method].apply(image, args.concat([callback]))
        })
        return this
    }
})

_.each(_.filter(_.keys(GdTransform.prototype), function (name) {return name.indexOf('_') !== 0}), function (method) {
    assert(!(method in gd), 'gd and GdTransform method name clash!')
    gd[method] = function () {
        var transform = GdTransform()
        return transform[method].apply(transform, arguments)
    }
})

gd.open = vargs(function open(source, options, callback) {
    var async = !!callback
    return readSource(source, async, function (err, imageData) {
        if (err) return error(err, callback)
        try {
            var image = openImage(imageData, options)
            if (async) return callback(null, image)
            return image
        } catch (e) {
            return error(e, callback)
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

gd.Image.prototype.save = vargs(function save(target, options, callback) {
    if (typeof target === 'object' && !(target instanceof stream.Writable) && typeof options === 'undefined') {
        options = target
        target = undefined
    }
    options = options || {}

    var async = !!callback

    try {
        var format = formats.getDestinationFormat(this, options, typeof target === 'string' ? target : '')
    } catch (e) {
        return error(e, callback)
    }

    var imageData = Buffer(format.save(this, options), 'binary')

    if (typeof target === 'undefined') {
        if (async) {
            callback(null, imageData)
            return this
        }
        return imageData
    }

    if (typeof target === 'string') {
        if (async) {
            fs.writeFile(target, imageData, wrapError(callback, gd.FileWriteError))
            return this
        }
        try {
            fs.writeFileSync(target, imageData)
        } catch (e) {
            throw gd.FileWriteError(e.message)
        }
        return this
    }

    if (target instanceof stream.Writable) {
        if (!async) throw gd.SynchronousStreamAccessError()
        target.end(imageData)
        callback(null)
        return this
    }

    return error(gd.UnknownDestinationTypeError(), callback)
})

function wrapError(callback, errorConstructor) {
    return function (err) {
        if (err) err = errorConstructor(err.message)
        return callback.apply(this, [err].concat(Array.prototype.slice.call(arguments, 1)))
    }
}

// TODO: tests for callback version
gd.Image.prototype.resize = vargs(function resize(options, callback) {
    options = _(options || {}).defaults({resample: true})

    var rw, rh, rr,
        sw, sh, sr, sx, sy,
        tw, th, tr,
        target

    rw = options.width || +Infinity
    rh = options.height || +Infinity
    rr = rw / rh
    sr = this.width / this.height

    if (options.method === 'crop') {
        tw = Math.min(rw, this.width)
        th = Math.min(rh, this.height)
        tr = tw / th
        if (sr >= rr) {
            sh = this.height
            sw = Math.floor(sh * tr)
            sy = 0
            sx = Math.floor((this.width - sw) / 2)
        } else {
            sw = this.width
            sh = Math.floor(sw / tr)
            sx = 0
            sy = Math.floor((this.height - sh) / 2)
        }
    } else {
        sx = sy = 0
        sw = this.width
        sh = this.height
        if (sr >= rr) {
            tw = Math.min(rw, this.width)
            th = Math.floor(tw / sr)
        } else {
            th = Math.min(rh, this.height)
            tw = Math.floor(th * sr)
        }
    }

    target = gd.createTrueColor(tw, th)
    target.format = this.format

    target.saveAlpha(1)
    target.alphaBlending(1)

    var resizeMethod = options.resample ? 'copyResampled' : 'copyResized'
    this[resizeMethod](target, 0, 0, sx, sy, tw, th, sw, sh)

    if (callback) return callback(null, target)
    return target
})

// TODO: tests for callback version
gd.Image.prototype.crop = function crop(options, callback) {
    var cropOptions = _.clone(options)
    cropOptions.method = 'crop'
    return this.resize(cropOptions, callback)
}

gd.colorBrightness = function (color) {
    if ((color & 0x7F000000) >> 24) return -1; // transparent color, won't count it at all
    var r = (color & 0xFF0000) >> 16,
        g = (color & 0x00FF00) >> 8,
        b = (color & 0x0000FF)
    return r * 0.299 + g * 0.587 + b * 0.114
}

gd.Image.prototype.rectBrightness = function (rect) {
    rect = rect || {x1: 0, y1: 0, x2: this.width, y2: this.height}
    var x, y, b,
        brightness = 0,
        opaque_pixels = 0
    for (x = rect.x1; x < rect.x2; x++)
        for (y = rect.y1; y < rect.y2; y++) {
            b = gd.colorBrightness(this.getPixel(x, y))
            if (b >= 0) {
                brightness += b
                opaque_pixels += 1
            }
        }
    return brightness / opaque_pixels
}

gd.Image.prototype.watermarkRect = function watermarkRect(wm, pos) {
    var wmx = (this.width - wm.width) * pos.x;
    var wmy = (this.height - wm.height) * pos.y;
    return {x1: wmx, y1: wmy, x2: wmx + wm.width, y2: wmy + wm.height};
}

gd.Image.prototype.watermark = vargs(function watermark(source, pos, callback) {
    // TODO: separate defaults for x and y
    pos = pos || {x: 0.5, y:0.5}
    var async = !!callback
    var image = this

    return readImage(source, async, function applyWatermark(err, wm) {
        if (err) return error(err, callback)
        if (pos instanceof Array) {
            var wmBrightness = wm.rectBrightness()
            var posBrightnessDelta = pos.map(function (p) {
                return Math.abs(image.rectBrightness(image.watermarkRect(wm, p)) - wmBrightness)
            }, image)
            pos = pos[posBrightnessDelta.indexOf(Math.max.apply(Math,posBrightnessDelta))]
        }
        var x = Math.round((image.width - wm.width) * pos.x)
        var y = Math.round((image.height - wm.height) * pos.y)

        wm.copy(image, x, y, 0, 0, wm.width, wm.height)

        if (async) return callback(null, image)
        return image
    })
})

function readImage(source, async, callback) {
    if (source instanceof gd.Image) return callback(null, source)

    return readSource(source, async, function loadImage(err, sourceBuffer) {
        if (err) return callback(err)
        try {
            var image = gd.open(sourceBuffer)
        } catch (e) {
            return callback(e)
        }
        return callback(null, image)
    })
}

gd.Image.prototype.autoOrient = function autoOrient() {
    var orientations = {
            3: -180,
            6: -90,
            8: -270,
        }

    var exif = this.exif
    if (!exif) return this

    if (exif.Orientation && exif.Orientation !== 1) {
        if (!(exif.Orientation in orientations)) throw gd.UnsupportedOrientationError()
        var angle = orientations[exif.Orientation]
        var rotated = gd.createTrueColor(angle % 180 ? this.height : this.width, angle % 180 ? this.width : this.height)
        this.copyRotated(rotated, rotated.width / 2, rotated.height / 2, 0, 0, this.width, this.height, angle)
        rotated.format = this.format
        rotated.exif = clone(this.exif)
        rotated.exif.Orientation = 1
        return rotated
    }

    return this
}
function error(error, callback) {
    if (callback) return callback(error)
    throw error
}
