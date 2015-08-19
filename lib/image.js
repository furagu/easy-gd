var fs = require('fs'),
    stream = require('readable-stream'),
    vargs = require('vargs-callback'),
    _ = require('underscore'),
    formats = require('./formats.js'),
    errors = require('./errors.js'),
    gd = require('../index.js')


exports.save = vargs(function save(target, options, callback) {
    if (typeof target === 'object' && !target.end && typeof options === 'undefined') {
        options = target
        target = undefined
    }
    options = options || {}

    var async = !!callback

    try {
        var format = formats.getDestinationFormat(this, options, typeof target === 'string' ? target : '')
    } catch (e) {
        return errors.routeError(e, callback)
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
        target = target.replace('{ext}', format.ext)
        if (async) {
            fs.writeFile(target, imageData, wrapError(callback, errors.FileWriteError))
            return this
        }
        try {
            fs.writeFileSync(target, imageData)
        } catch (e) {
            throw errors.FileWriteError(e.message)
        }
        return this
    }

    if (target.end) {
        if (!async) throw errors.SynchronousStreamAccessError()
        target.end(imageData)
        callback(null)
        return this
    }

    return errors.routeError(errors.UnknownDestinationTypeError(), callback)
})

exports.autoOrient = function autoOrient() {
    var orientations = {
            3: -180,
            6: -90,
            8: -270,
        }

    var exif = this.exif
    if (!exif) return this

    if (exif.Orientation && exif.Orientation !== 1) {
        if (!(exif.Orientation in orientations)) throw errors.UnsupportedOrientationError()
        var angle = orientations[exif.Orientation]
        var rotated = gd.createTrueColor(angle % 180 ? this.height : this.width, angle % 180 ? this.width : this.height)
        this.copyRotated(rotated, rotated.width / 2, rotated.height / 2, 0, 0, this.width, this.height, angle)
        rotated.format = this.format
        rotated.exif = _.clone(this.exif)
        rotated.exif.Orientation = 1
        return rotated
    }

    return this
}

exports.resize = vargs(function resize(options, callback) {
    if (typeof options === 'undefined') return errors.routeError(errors.OptionsRequiredError(), callback)
    options = _.defaults(options, {resample: true})

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
    target.exif = _.clone(this.exif)

    target.saveAlpha(1)
    target.alphaBlending(1)

    var resizeMethod = options.resample ? 'copyResampled' : 'copyResized'
    this[resizeMethod](target, 0, 0, sx, sy, tw, th, sw, sh)

    if (callback) return callback(null, target)
    return target
})

exports.crop = function crop(options, callback) {
    var cropOptions = _.clone(options)
    cropOptions.method = 'crop'
    return this.resize(cropOptions, callback)
}

exports.rectBrightness = function (rect) {
    rect = rect || {x1: 0, y1: 0, x2: this.width, y2: this.height}
    var x, y, b,
        brightness = 0,
        opaque_pixels = 0
    for (x = rect.x1; x < rect.x2; x++)
        for (y = rect.y1; y < rect.y2; y++) {
            b = colorBrightness(this.getPixel(x, y))
            if (b >= 0) {
                brightness += b
                opaque_pixels += 1
            }
        }
    return brightness / opaque_pixels
}

exports.watermarkRect = function watermarkRect(wm, pos) {
    var wmx = (this.width - wm.width) * pos.x;
    var wmy = (this.height - wm.height) * pos.y;
    return {x1: wmx, y1: wmy, x2: wmx + wm.width, y2: wmy + wm.height};
}

var watermarkDefaults = {x: 0.5, y: 0.5}

exports.watermark = vargs(function watermark(source, pos, callback) {
    pos = _.defaults(pos || {}, watermarkDefaults)
    var async = !!callback
    var image = this

    return readImage(source, async, function applyWatermark(err, wm) {
        if (err) return errors.routeError(err, callback)
        if (pos instanceof Array) {
            var wmBrightness = wm.rectBrightness()
            var posBrightnessDelta = pos.map(function (p) {
                return Math.abs(image.rectBrightness(image.watermarkRect(wm, p)) - wmBrightness)
            }, image)
            pos = pos[posBrightnessDelta.indexOf(Math.max.apply(Math,posBrightnessDelta))]
        }
        var x = Math.round((image.width - wm.width) * pos.x)
        var y = Math.round((image.height - wm.height) * pos.y)

        var watermarked = gd.createTrueColor(image.width, image.height)
        watermarked.format = image.format
        watermarked.exif = _.clone(image.exif)

        watermarked.saveAlpha(1)
        watermarked.alphaBlending(1)

        image.copy(watermarked, 0, 0, 0, 0, image.width, image.height)
        wm.copy(watermarked, x, y, 0, 0, wm.width, wm.height)

        if (async) return callback(null, watermarked)
        return watermarked
    })
})

function readImage(source, async, callback) {
    if (source instanceof gd.Image) return callback(null, source)
    if (async) return gd.open(source, callback)
    try {
        var image = gd.open(source)
    } catch (e) {
        return callback(e)
    }
    return callback(null, image)
}


function colorBrightness(color) {
    if ((color & 0x7F000000) >> 24) return -1; // transparent color, won't count it at all
    var r = (color & 0xFF0000) >> 16,
        g = (color & 0x00FF00) >> 8,
        b = (color & 0x0000FF)
    return r * 0.299 + g * 0.587 + b * 0.114
}

function wrapError(callback, errorConstructor) {
    return function (err) {
        if (err) err = errorConstructor(err.message)
        return callback.apply(this, [err].concat(Array.prototype.slice.call(arguments, 1)))
    }
}
