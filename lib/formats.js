var path = require('path'),
    exifParser = require('exif-parser'),
    _ = require('underscore'),
    gd = require('node-gd'),
    errors = require('./errors.js')

var formats = [{
        label: 'jpeg',
        ext: 'jpg',
        signature: Buffer([0xff, 0xd8, 0xff]),
        open: function openJpeg(imageData) {
            var image = gd.createFromJpegPtr(imageData)
            try {
                var exif = exifParser.create(imageData).parse()
            } catch (e) {
                // ignore exif parsing errors
            }
            if (!_.isEmpty(exif.tags)) image.exif = exif.tags
            return image
        },
        save: function saveJpeg(image, options) {
            return image.jpegPtr(options.quality || -1)
        },
    }, {
        label: 'png',
        ext: 'png',
        signature: Buffer([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        open: gd.createFromPngPtr,
        save: function savePng(image, options) {
            return image.pngPtr(options.compression || -1)
        },
    }, {
        label: 'gif',
        ext: 'gif',
        signature: Buffer('GIF'),
        open: gd.createFromGifPtr,
        save: function saveGif(image, options) {
            return image.gifPtr()
        },
    }
]

exports.getImageFormat = function getImageFormat(imageData) {
    var format = _.find(formats, function (f) {
        return imageData.slice(0, f.signature.length).equals(f.signature)
    })
    if (format) return format
    throw errors.UnknownImageFormatError()
}

var formatsByLabel = _.object(_.map(formats, function (f) {return [f.label, f]}))
var formatsByExtname = _.object(_.map(formats, function (f) {return ['.' + f.ext, f]}))
formatsByExtname['.jpeg'] = formatsByExtname['.jpg']

exports.getDestinationFormat = function getDestinationFormat(image, options, filename) {
    if (filename) {
        var extname = path.extname(filename).toLowerCase()
        if (extname in formatsByExtname) return formatsByExtname[extname]
    }
    var label = options.format || image.format
    if (label) {
        if (label in formatsByLabel) return formatsByLabel[label]
        throw errors.UnknownImageFormatError('Unknown format ' + label)
    }
    throw errors.DestinationFormatRequiredError()
}
