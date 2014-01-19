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

    it('should .watermark() images piped in')
    it('should set format setting for piped in images with .format()')
    it('should set quality setting for piped in images with .quality()')
    it('should set compression setting for piped in images with .compression()')
    it('should set saving options for piped in images with .options()')
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
