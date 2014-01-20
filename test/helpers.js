var should = require('should'),
    stream = require('readable-stream'),
    util = require('util'),
    gd = require('node-gd')

exports.WritableStream = function WritableStream(options) {
    if (!(this instanceof WritableStream)) return new WritableStream(options)
    stream.Writable.call(this, options)
    this.written = Buffer(0)
}
util.inherits(exports.WritableStream, stream.Writable)
exports.WritableStream.prototype._write = function _write(chunk, encoding, callback) {
    this.written = this.written.concat(chunk)
    callback()
}

exports.ReadableStream = function ReadableStream(buffer, opt) {
    stream.Readable.call(this, opt)
    this.buffer = buffer
}
util.inherits(exports.ReadableStream, stream.Readable);
exports.ReadableStream.prototype._read = function() {
    this.push(this.buffer)
    this.push(null)
}


exports.createImage = function createImage(width, height) {
    var image = gd.createTrueColor(width || 100, height || 100)
    greyGradientFill(image, Math.PI/8)
    // image.filledEllipse(50, 50, 25, 25, image.colorAllocate(255, 0, 0))
    return image
}

exports.aspectRatio = function aspectRatio(image) {
    return image.width / image.height
}


exports.testErrorSync = function testErrorSync(errorClass, testFn) {
    testFn.should.throw()
    try {
        testFn()
    } catch (e) {
        e.should.be.instanceof(errorClass)
    }
}

exports.testErrorAsync = function testErrorAsync(errorClass, done, testFn) {
    testFn(function testErrorAsyncCallback(err) {
        err.should.be.an.instanceof(errorClass)
        done()
    })
}

function greyGradientFill (image, angle) {
    var width = image.width,
        height = image.height,
        sin_a = Math.sin(angle),
        cos_a = Math.cos(angle),
        step  = 255 / (width * cos_a + height * sin_a),
        x,
        y,
        component,
        color

    for (x = 0; x < width; x++) {
        for (y = 0; y < height; y++) {
            component = Math.round(step * (x * sin_a + y * cos_a))
            color = image.colorAllocate(component, component, component)
            image.setPixel(x, y, color)
       }
    }
    return image
}
