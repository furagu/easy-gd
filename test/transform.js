var should = require('should'),
    gd = require('../index.js'),
    _ = require('underscore'),
    async = require('async'),
    fs = require('fs'),
    stream = require('readable-stream'),
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

    it('should .watermark() images piped in', function (done) {
        testTransform(
            gd.watermark(samples.watermark, {x: 0, y: 0}),
            function (image) {
                image.getPixel(1, 1).should.equal(0xFFFFFF)
                done()
            }
        )
    })

    it('should set format setting for piped in images with .format()', function (done) {
        async.each(samples.types, function (type, doneType) {
            testTransform(
                gd.format(type),
                function (image) {
                    image.format.should.equal(type)
                    doneType()
                }
            )
        }, done)
    })

    it('should set quality setting for piped in images with .quality()', function (done) {
        async.parallel({
            highQualityImage: function (callback) {
                testTransform(
                    gd.format('jpeg').quality(100),
                    function (image, data) {callback(null, data)}
                )
            },
            lowQualityImage: function (callback) {
                testTransform(
                    gd.format('jpeg').quality(10),
                    function (image, data) {callback(null, data)}
                )
            }
        }, function (err, results) {
            results.highQualityImage.length.should.be.above(results.lowQualityImage.length)
            done()
        })
    })

    it('should set compression setting for piped in images with .compression()', function (done) {
        async.parallel({
            poorlyCompressedImage: function (callback) {
                testTransform(
                    gd.format('png').compression(1),
                    function (image, data) {callback(null, data)}
                )
            },
            heavilyCompressedImage: function (callback) {
                testTransform(
                    gd.format('png').compression(9),
                    function (image, data) {callback(null, data)}
                )
            }
        }, function (err, results) {
            results.poorlyCompressedImage.length.should.be.above(results.heavilyCompressedImage.length)
            done()
        })
    })

    it('should set saving options for piped in images with .options()', function (done) {
        async.each(samples.types, function (type, doneType) {
            testTransform(
                gd.options({format :type}),
                function (image) {
                    image.format.should.equal(type)
                    doneType()
                }
            )
        }, done)
    })

    it('should accept image data encoded in strings', function (done) {
        var dst = h.WritableStream()
        dst.on('finish', function () {
            var image = gd.open(this.written)
            image.should.have.property('format', 'png')
            image.should.have.property('width', 50)
            image.should.have.property('height', 50)
            done()
        })

        var transform = gd.crop({width: 50, height: 50})
        transform.pipe(dst)

        var imageData = h.createImage(100, 100).save({format: 'png'}).toString('base64')
        transform.write(imageData, 'base64')
        transform.end()

    })
})

function testTransform(transform, callback) {
    var dst = h.WritableStream()
    dst.on('finish', function () {
        var image = gd.open(this.written)
        callback(image, this.written)
    })
    var imageData = h.createImage(100, 100).save({format: 'png'})
    var src = new h.ReadableStream(imageData)
    src.pipe(transform).pipe(dst)
}
