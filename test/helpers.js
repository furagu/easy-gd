var should = require('should'),
    stream = require('stream'),
    util = require('util'),
    gd = require('node-gd')

// TODO: bring all the test helpers here

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


exports.generateImage = function generateImage() {
    var image = gd.createTrueColor(100, 100)
    image.filledEllipse(50, 50, 25, 25, image.colorAllocate(255, 0, 0))
    return image
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
