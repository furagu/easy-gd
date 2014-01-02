var should = require('should'),
    stream = require('stream'),
    util = require('util'),
    gd = require('../index.js')

// TODO: bring all the test helpers here

exports.CollectorStream = function CollectorStream(options) {
    if (!(this instanceof CollectorStream)) return new CollectorStream(options)
    stream.Writable.call(this, options)
    this.collected = Buffer(0)
}
util.inherits(exports.CollectorStream, stream.Writable)

exports.CollectorStream.prototype._write = function _write(chunk, encoding, callback) {
    this.collected = this.collected.concat(chunk)
    callback()
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
