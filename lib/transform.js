var gd = require('../index.js'),
    stream = require('stream'),
    util = require('util'),
    async = require('async'),
    _ = require('underscore')


function ImageTransformStream(options) {
    if (!(this instanceof ImageTransformStream)) return new ImageTransformStream(options)
    stream.Transform.call(this, options)
    this.imageData = Buffer(0)
    this.imageOptions = {}
    this.actions = []
}
util.inherits(ImageTransformStream, stream.Transform)

ImageTransformStream.prototype._transform = function collectImageData(chunk, encoding, done) {
    this.imageData = this.imageData.concat(chunk)
    done()
}

ImageTransformStream.prototype._flush = function processImage(done) {
    this.actions.unshift(_.partial(gd.open, this.imageData))
    this.actions.push(function saveImage(image, callback) {
        var processedImageData = image.save(this.imageOptions)
        this.push(processedImageData)
        callback()
    }.bind(this))
    async.waterfall(this.actions, done)
}

var methods = {}

methods.options = function options(options) {
    _.extend(this.imageOptions, options)
    return this
}

_.each(['format', 'quality', 'compression'], function (option) {
    methods[option] = function (optionValue) {
        this.imageOptions[option] = optionValue
        return this
    }
})

_.each(['resize', 'watermark', 'crop'], function (action) {
    methods[action] = function () {
        var args = Array.prototype.slice.apply(arguments)
        this.actions.push(function (image, callback) {
            image[action].apply(image, args.concat([callback]))
        })
        return this
    }
})

_.extend(ImageTransformStream.prototype, methods)

_.each(methods, function (method, name) {
    exports[name] = function () {
        return method.apply(ImageTransformStream(), arguments)
    }
})
