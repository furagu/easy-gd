var should = require('should'),
    gd = require('../index.js'),
    _ = require('underscore'),
    fs = require('fs'),
    stream = require('stream'),
    samples = require('./samples.js'),
    h = require('./helpers.js')

describe('gd', function () {
    it('should .resize() images piped in', function (done) {
        testTransform(
            gd.resize({width:50, height:40}),
            function (image) {
                image.width.should.be.equal(40)
                image.height.should.be.equal(40)
                done()
            }
        )
    })

    it('should .crop() images piped in', function (done) {
        testTransform(
            gd.crop({width:20, height:30}),
            function (image) {
                image.width.should.be.equal(20)
                image.height.should.be.equal(30)
                done()
            }
        )
    })

    // TODO: accurate tests for .watermark, .format, .quality, .compression .options
})

function testTransform(transform, callback) {
    var dst = h.WritableStream()
    dst.on('finish', function () {
        var image = gd.open(this.written)
        callback(image)
    })
    var imageData = h.createImage().save({format: 'png'})
    var src = new h.ReadableStream(imageData)
    src.pipe(transform).pipe(dst)
}
