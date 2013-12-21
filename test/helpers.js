var should = require('should'),
    stream = require('stream'),
    util = require('util'),
    gd = require('../index.js')


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


exports.testErrorSync = function testErrorSync(errorName, testFn) {
    testFn.should.throw(RegExp('^' + errorName))
    try {
        testFn()
    } catch (e) {
        e.should.have.property('code')
        e.code.should.be.equal(gd[errorName])
    }
}

exports.testErrorAsync = function testErrorAsync(errorName, done, testFn) {
    testFn(function testErrorAsyncCallback(err) {
        err.should.be.an.instanceof(Error)
        err.message.should.match(RegExp('^' + errorName))
        err.should.have.property('code')
        err.code.should.be.equal(gd[errorName])
        done()
    })
}
