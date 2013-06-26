var gd = module.exports = Object.create(require("node-gd")),
    fs = require("fs"),
    buffertools = require('buffertools')


var formats = {
    jpeg: {
        ext: '.jpg',
        signature: new Buffer([0xff, 0xd8, 0xff]),
        createFromPtr: gd.createFromJpegPtr,
        ptr: namedArgs(gd.jpegPtr, 'jpegquality', -1),
        save: namedArgs(gd.Image.prototype.saveJpeg, 'jpegquality', -1),
    },
    png: {
        ext: '.png',
        signature: new Buffer([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        createFromPtr: gd.createFromPngPtr,
        ptr: namedArgs(gd.pngPtr, 'pnglevel', -1),
        save: namedArgs(gd.Image.prototype.savePng, 'pnglevel', -1),
    },
    gif: {
        ext: '.gif',
        signature: new Buffer('GIF'),
        createFromPtr: gd.createFromGifPtr,
        ptr: gd.gifPtr,
        save: gd.Image.prototype.saveGif,
    },
}

gd.getFormatPtr = function (buffer) {
    var name, signature
    for (name in formats) {
        signature = formats[name].signature
        if (buffer.slice(0, signature.length).equals(signature))
            return name
    }
    throw gdError('unknown_format', 'Unknown image format')
}

gd.createFromPtr = function (buffer) {
    var format, image
    format = gd.getFormatPtr(buffer)
    image = formats[format].createFromPtr.call(this, buffer)
    if (!image) throw gdError('open', 'Failed to create image from buffer')
    image.format = format
    return image
}

gd.createFrom = function (filename, callback) {
    fs.readFile(filename, function(e, data) {
        if (e) return callback(gdError('read', e))
        try {
            var image = gd.createFromPtr(data)
        } catch (e) {
            return callback(e)
        }
        callback(null, image)
    })
}

gd.Image.prototype.save = function (filename, options, callback) {
    try {
        var format = this.targetFormat(options)
    } catch (err) {
        return callback(err)
    }
    return formats[format].save.call(this, filename, options, callback)
}

gd.Image.prototype.ptr = function (options) {
    var format, data
    format = this.targetFormat(options)
    data = formats[format].ptr.call(this, options)
    return new Buffer(data, 'binary')
}

gd.Image.prototype.targetFormat = function (options) {
    var format
    options = options || {}
    format = options.format || this.format || options.defaultFormat
    if (!format) throw gdError('format_required', 'Image format required')
    if (!format in formats) throw gdError('unknown_format', 'Unknown format ' + format)
    return format
}

gd.Image.prototype.resized = function (options) {
    var rw, rh, rr,
        sw, sh, sr, sx, sy,
        tw, th, tr,
        target

    if (rw > this.width && rh > this.height)
        return this

    rw = options.width || 10000
    rh = options.height || 10000
    rr = rw / rh
    sr = this.width / this.height

    if (options['method'] === 'crop') {
        tw = Math.min(rw, this.width)
        th = Math.min(rh, this.height)
        tr = tw / th
        if (sr >= rr) {
            sh = this.height
            sw = Math.floor(sh * tScale)
            sy = 0
            sx = Math.floor((this.width - sw) / 2)
        } else {
            sw = this.width
            sh = Math.floor(sw / tScale)
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
    target.format = this.targetFormat(options)

    target.saveAlpha(1)
    target.alphaBlending(target.format === 'jpeg' ? 1 : 0)
    this.copyResampled(target, 0, 0, sx, sy, tw, th, sw, sh)

    return target
}

gd.Image.prototype.resizedPtr = function (options) {
    return this.resized(options).ptr(options)
}

gd.Image.prototype.watermark = function (wm, pos) {
    var x = (this.width - wm.width) * pos.x,
        y = (this.height - wm.height) * pos.y
    wm.copy(this, x, y, 0, 0, wm.width, wm.height)
    return this
}

function gdError(error, message) {
    var e = new Error(message)
    e.error = error
    return e
}

function namedArgs (fn) {
    var slice = Array.prototype.slice,
        pop = Array.prototype.pop,
        argSpec = chunk(slice.call(arguments, 1), 2)
    return function () {
        var callback = arguments[arguments.length - 1] instanceof Function ? pop.apply(arguments) : null,
            namedArgs = pop.apply(arguments),
            args = slice.call(arguments)
        args = args.concat(argSpec.map(function (s) {return namedArgs[ s[0] ] || s[1]}))
        if (callback) args.push(callback)
        return fn.apply(this, args)
    }
}

function chunk (arr, len) {
    var chunks = [],
        i = 0,
        n = arr.length
    while (i < n)
        chunks.push(arr.slice(i, i += len))
    return chunks
}
