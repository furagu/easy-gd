var gd = module.exports = Object.create(require('node-gd')),
    fs = require('fs'),
    path = require('path'),
    stream = require('stream'),
    util = require('util'),
    buffertools = require('buffertools'),
    exifParser = require('exif-parser'),
    vargs = require('vargs-callback'),
    clone = require('clone'),
    async = require('async'),
    _ = require('underscore')


var formats = {
    jpeg: {
        ext: 'jpg',
        signature: Buffer([0xff, 0xd8, 0xff]),
        createFromPtr: gd.createFromJpegPtr,
        ptr: function jpegPtr(options) {
            return gd.Image.prototype.jpegPtr.call(this, options.quality || -1)
        },
    },
    png: {
        ext: 'png',
        signature: Buffer([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        createFromPtr: gd.createFromPngPtr,
        ptr: function pngPtr(options) {
            return gd.Image.prototype.pngPtr.call(this, options.compression || -1)
        },
    },
    gif: {
        ext: 'gif',
        signature: Buffer('GIF'),
        createFromPtr: gd.createFromGifPtr,
        ptr: gd.Image.prototype.gifPtr,
    },
}

var formatsByExtname = _.object(_.map(formats, function (format, name) {return ['.' + format.ext, format]}))
formatsByExtname['.jpeg'] = formatsByExtname['.jpg']

var openDefaults = {
    autoOrient: true,
}


function GdTransform(options) {
    if (!(this instanceof GdTransform)) return new GdTransform(options)
    stream.Transform.call(this, options)
    this.buffer = Buffer(0)
    this.actions = [function open(callback) {
            gd.open(this.buffer, callback)
        }.bind(this)
    ]
}
util.inherits(GdTransform, stream.Transform)

GdTransform.prototype._transform = function _transform(chunk, encoding, done) {
    if (!(chunk instanceof Buffer)) chunk = Buffer(chunk, encoding)
    this.buffer = this.buffer.concat(chunk)
    done()
}

GdTransform.prototype._flush = function _flush(done) {
    this.actions.push(function save(image, callback) {
        this.push(image.save({format: 'jpeg'}))
        callback()
    }.bind(this))
    async.waterfall(this.actions, done)
}

GdTransform.prototype.resize = function (options) {
    this.actions.push(function (image, callback) {
        image.resize(options, callback)
    })
    return this
}

GdTransform.prototype.watermark = function (source, pos) {
    this.actions.push(function (image, callback) {
        image.watermark(source, pos, callback)
    })
    return this
}

gd.transformer = GdTransform


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
        if (!async) throw GdError(gd.NOSYNCSTREAM)
        return readStream(source, callback)
    }

    return callback(GdError(gd.BADSOURCE))
}

function openImage(imageData, options) {
    options = _(options || {}).defaults(openDefaults)

    if (!imageData.length) throw GdError(gd.NODATA)

    var format = detectFormat(imageData)
    var image = formats[format].createFromPtr.call(gd, imageData)
    if (!image) throw GdError(gd.BADIMAGE)
    image.format = format

    if (format === 'jpeg') {
        try {
            var exif = exifParser.create(imageData).parse()
        } catch (e) {
            // ignore exif parsing errors
        }
        if (!_.isEmpty(exif.tags)) image.exif = exif.tags
    }

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
    if (error.code === 'ENOENT') return callback(GdError(gd.DOESNOTEXIST))
    return callback(GdError(gd.BADFILE, error.message))
}

function detectFormat(buffer) {
    for (var name in formats) {
        var signature = formats[name].signature
        if (buffer.slice(0, signature.length).equals(signature))
            return name
    }
    throw GdError(gd.BADFORMAT)
}

gd.Image.prototype.save = vargs(function save(target, options, callback) {
    if (typeof target === 'object' && !(target instanceof stream.Writable) && typeof options === 'undefined') {
        options = target
        target = undefined
    }
    options = options || {}

    var async = !!callback

    try {
        var format = getSaveFormat(this, options, typeof target === 'string' ? target : '')
    } catch (e) {
        return error(e, callback)
    }

    var imageData = Buffer(format.ptr.call(this, options), 'binary')

    if (typeof target === 'undefined') {
        if (async) {
            callback(null, imageData)
            return this
        }
        return imageData
    }

    if (typeof target === 'string') {
        if (async) {
            fs.writeFile(target, imageData, wrapError(callback, gd.FILEWRITE))
            return this
        }
        try {
            fs.writeFileSync(target, imageData)
        } catch (e) {
            throw GdError(gd.FILEWRITE, e.message)
        }
        return this
    }

    if (target instanceof stream.Writable) {
        if (!async) throw GdError(gd.NOSYNCSTREAM)
        target.end(imageData)
        callback(null)
        return this
    }

    return error(GdError(gd.BADTARGET), callback)
})

function wrapError(callback, errorCode) {
    return function (err) {
        if (err) err = GdError(errorCode, err.message)
        return callback.apply(this, [err].concat(Array.prototype.slice.call(arguments, 1)))
    }
}

function getSaveFormat(image, options, filename) {
    if (filename) {
        var extname = path.extname(filename).toLowerCase()
        if (extname in formatsByExtname) return formatsByExtname[extname]
    }

    var format = options.format || image.format
    if (format) {
        if (format in formats) return formats[format]
        throw GdError(gd.BADFORMAT, 'Unknown format ' + format)
    }

    throw GdError(gd.FORMATREQUIRED)
}

gd.Image.prototype.resize = vargs(function resize(options, callback) {
    var rw, rh, rr,
        sw, sh, sr, sx, sy,
        tw, th, tr,
        target

    rw = options.width || +Infinity
    rh = options.height || +Infinity
    rr = rw / rh
    sr = this.width / this.height

    if (options['method'] === 'crop') {
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
    this.copyResampled(target, 0, 0, sx, sy, tw, th, sw, sh)

    if (callback) return callback(null, target)
    return target
})

gd.Image.prototype.crop = function crop(options) {
    var cropOptions = _.clone(options)
    cropOptions.method = 'crop'
    return this.resize(cropOptions)
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
        if (!(exif.Orientation in orientations)) throw GdError(gd.BADORIENT)
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

var errorsDefinition = [
    ['BADSOURCE',       'Unknown source type.'],
    ['DOESNOTEXIST',    'File does not exist.'],
    ['NODATA',          'Empty source file or buffer.'],
    ['BADFILE',         'Open error.'],
    ['BADFORMAT',       'Unsupported image format (or not an image at all).'],
    ['BADIMAGE',        'Corrupted or incomplete image.'],
    ['BADORIENT',       'Unsupported image Exif orientation tag.'],
    ['NOSYNCSTREAM',    'Stream cannot be read or written synchronously.'],
    ['FILEWRITE',       'File writing error.'],
    ['FORMATREQUIRED',  'Output image format required.'],
    ['BADTARGET',       'Unknown target type.']
]

var errorMessages = {},
    errorNames = {}

errorsDefinition.forEach(function (error, index) {
    var code = index + 1,
        name = error[0],
        message = error[1]
    errorMessages[code] = name + ', ' + message
    errorNames[code] = name
    gd[name] = code
})

function GdError(code, message) {
    if (!(this instanceof GdError)) return new GdError(code, message)
    this.message = message ? errorNames[code] + ', ' + message : errorMessages[code]
    this.code = code
}
util.inherits(GdError, Error)

function error(error, callback) {
    if (callback) return callback(error)
    throw error
}
