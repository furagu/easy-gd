var should = require('should'),
    gd = require('../index.js'),
    _ = require('underscore'),
    fs = require('fs'),
    testData = require('./data.js')

describe('gd', function () {
    describe('Image.prototype', function () {
        var testImage = gd.createTrueColor(100, 100)
        testImage.filledEllipse(50, 50, 25, 25, testImage.colorAllocate(255, 0, 0))

        describe('targetFormat()', function () {
            it('should take format from options.format', function () {
                testImage.targetFormat({format: 'FORMAT'}).should.equal('FORMAT')
            })
            it('should take format from options.defaultFormat', function () {
                testImage.targetFormat({defaultFormat: 'FORMAT'}).should.equal('FORMAT')
            })
            it('should take format from this.format', function () {
                _.extend(testImage, {format: 'FORMAT'}).targetFormat().should.equal('FORMAT')
            })
            it('should prefer options.format over this.format and options.defaultFormat', function () {
                _.extend(testImage, {format: 'THISFORMAT'})
                    .targetFormat({format: 'FORMAT', defaultFormat: 'DEFAULTFORMAT'}).should.equal('FORMAT')
            })
            it('should prefer this.format over options.defaultFormat', function () {
                _.extend(testImage, {format: 'THISFORMAT'})
                    .targetFormat({defaultFormat: 'DEFAULTFORMAT'}).should.equal('THISFORMAT')
            })
            delete testImage.format
        })

        describe('ptr()', function () {
            var gdOpeners = {
                    'jpeg': gd.createFromJpegPtr,
                    'png':  gd.createFromPngPtr,
                    'gif':  gd.createFromGifPtr,
                }

            testData.forType(function (type) {
                it('should create a ' + type + ' image', function () {
                    var image = gdOpeners[type](testImage.ptr({format: type}))
                    image.should.be.an.instanceof(gd.Image)
                    image.width.should.equal(testImage.width)
                    image.height.should.equal(testImage.height)
                })
            })
            it('should set jpeg images quality with jpegquality option', function () {
                var highQualityImage = testImage.ptr({format: 'jpeg', jpegquality: 99}),
                    lowQualityImage  = testImage.ptr({format: 'jpeg', jpegquality: 1})
                lowQualityImage.length.should.be.below(highQualityImage.length)
            })
            it('should compress png images with pnglevel option', function () {
                var highlyCompressedImage = testImage.ptr({format: 'png', pnglevel: 9}),
                    littleCompressedImage = testImage.ptr({format: 'png', pnglevel: 1})
                highlyCompressedImage.length.should.be.below(littleCompressedImage.length)
            })
        })

        describe('save()', function () {
            var filename = __dirname + 'save_test.dat',
                gdOpeners = {
                    'jpeg': gd.createFromJpeg,
                    'png':  gd.createFromPng,
                    'gif':  gd.createFromGif,
                }
            after(_.partial(fs.unlinkSync, filename))

            testData.forType(function (type) {
                it('should write a ' + type + ' image', function (done) {
                    testImage.save(filename, {format: type}, function (err) {
                        if (err) return done(err)
                        var image = gdOpeners[type](filename)
                        image.should.be.an.instanceof(gd.Image)
                        image.width.should.equal(testImage.width)
                        image.height.should.equal(testImage.height)
                        done()
                    })
                })
            })
        })
    })
})
