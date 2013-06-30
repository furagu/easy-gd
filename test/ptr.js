var should = require('should'),
    gd = require('../index.js'),
    _ = require('underscore'),
    testData = require('./data.js')

describe('gd', function () {
    describe('getFormatPtr()', function () {
        testData.forBufferType(function (buffer, type) {
            it('should detect ' + type, function () {
                gd.getFormatPtr(buffer).should.equal(type)
            })
        })
        it('should throw unknown_format error on bad data', function () {
            _.partial(gd.getFormatPtr, new Buffer('BADDATA')).should.throw('Unknown image format')
        })
    })

    describe('createFromPtr()', function () {
        testData.forBufferType(function (buffer, type) {
            it('should open ' + type + ' buffer', function () {
                var image = gd.createFromPtr(buffer)
                image.should.be.an.instanceof(gd.Image)
                image.width.should.equal(1)
                image.height.should.equal(1)
                image.format.should.equal(type)
            })
        })
        it('should throw unknown_format error on bad data', function () {
            _.partial(gd.getFormatPtr, new Buffer('BADDATA')).should.throw('Unknown image format')
        })
    })

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
    })
})
