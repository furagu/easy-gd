var gd = require('../index.js'),
    stream = require('stream'),
    util = require('util'),
    async = require('async'),
    _ = require('underscore')


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
    // if (method in gd) throw Error('gd and GdTransform method name clash!')
    exports[method] = function () {
        var transform = GdTransform()
        return transform[method].apply(transform, arguments)
    }
})
