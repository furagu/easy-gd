var should = require('should'),
    gd = require('../index.js'),
    _ = require('underscore'),
    fs = require('fs'),
    util = require('util'),
    stream = require('stream'),
    samples = require('./samples.js'),
    h = require('./helpers.js')

describe('gd', function () {
    describe('Image.prototype', function () {
        var testImage = gd.createTrueColor(100, 100)
        testImage.filledEllipse(50, 50, 25, 25, testImage.colorAllocate(255, 0, 0))

        describe('save()', function () {
            var testImage = gd.createTrueColor(100, 100)
            testImage.filledEllipse(50, 50, 25, 25, testImage.colorAllocate(255, 0, 0))

            it('should syncronously return a buffer when called with empty target argument', function () {
                _.each(samples.types, function (type) {
                    var buffer = testImage.save({format: type})
                    checkGeneratedImage(testImage, buffer, type)
                })
            })

            _.each(samples.types, function (type) {
                it('should asyncronously return a ' + type + ' buffer when called with empty target argument and a callback', function (done) {
                    var buffer = testImage.save({format: type}, function (err, buffer) {
                        checkGeneratedImage(testImage, buffer, type)
                        done()
                    })
                })
            })

            _.each(samples.types, function (type) {
                it('should synchronously write a ' + type + ' file', function () {
                    var tmpFilename = __dirname + '/save_sync_test.' + type
                    after(_.partial(fs.unlinkSync, tmpFilename))

                    testImage.save(tmpFilename)

                    var buffer = fs.readFileSync(tmpFilename)
                    checkGeneratedImage(testImage, buffer, type)
                })
            })

            _.each(samples.types, function (type) {
                it('should asynchronously write a ' + type + ' to a file', function (done) {
                    var tmpFilename = __dirname + '/save_async_test.' + type
                    testImage.save(tmpFilename, {format: type}, function (err) {
                        var buffer = fs.readFileSync(tmpFilename)
                        fs.unlinkSync(tmpFilename)
                        checkGeneratedImage(testImage, buffer, type)
                        done()
                    })
                })
            })

            _.each(samples.types, function (type) {
                it('should asycnronously write a ' + type + ' to a stream', function (done) {
                    var stream = h.CollectorStream()
                    stream.on('finish', function () {
                        checkGeneratedImage(testImage, this.collected, type)
                        done()
                    })
                    testImage.save(stream, {format: type}, function (err) {
                        should(err).equal(null)
                    })
                })
            })

            it('should throw gd.NOSYNCSTREAM exception on sync save to a stream', function () {
                h.testErrorSync('NOSYNCSTREAM', function () {
                    testImage.save(h.CollectorStream(), {format: 'jpeg'})
                })
            })

            it('should throw gd.FILEWRITE exception when failed to synchronously save to a file', function () {
                h.testErrorSync('FILEWRITE', function () {
                    testImage.save('nosuchdir/some.jpg')
                })
            })

            it('should return gd.FILEWRITE error when failed to asynchronously save to a file', function (done) {
                h.testErrorAsync('FILEWRITE', done, function (callback) {
                    testImage.save('nosuchdir/some.jpg', callback)
                })
            })

            _.each({'.jpeg': 'jpeg', '.jpg': 'jpeg', '.gif': 'gif', '.png': 'png'}, function (format, extname) {
                it('should detect ' + format + ' destination format by ' + extname + ' filename extension', function () {
                    _.each([extname, extname.toUpperCase()], function (extname) {
                        var tmpFilename = __dirname + '/format_detection_test' + extname
                        testImage.save(tmpFilename)
                        gd.open(tmpFilename).format.should.be.equal(format)
                        fs.unlinkSync(tmpFilename)
                    })
                })
            })

            it('should throw gd.FORMATREQUIRED exception when no target format set', function () {
                h.testErrorSync('FORMATREQUIRED', function () {
                    var buffer = testImage.save()
                })
            })

            it('should return gd.FORMATREQUIRED error when no target format set', function (done) {
                h.testErrorAsync('FORMATREQUIRED', done, function (callback) {
                    testImage.save(h.CollectorStream(), callback)
                })
            })

            it('should throw gd.BADFORMAT exception when unknown target format set', function () {
                h.testErrorSync('BADFORMAT', function () {
                    var buffer = testImage.save({format: 'tiff'})
                })
            })

            it('should return gd.BADFORMAT error when unknown target format set', function (done) {
                h.testErrorAsync('BADFORMAT', done, function (callback) {
                    testImage.save({format: 'tiff'}, callback)
                })
            })

            it('should throw gd.BADTARGET exception when target is not a file, a buffer or a writable stream', function () {
                h.testErrorSync('BADTARGET', function () {
                    var buffer = testImage.save(0xDEADBEEF, {format: 'jpeg'})
                })
            })

            it('should asynchronously return gd.BADTARGET error when target is not a file, a buffer or a writable stream', function (done) {
                h.testErrorAsync('BADTARGET', done, function (callback) {
                    testImage.save(0xDEADBEEF, {format: 'jpeg'}, callback)
                })
            })

            it('should return the image object when synchronously saving to file', function () {
                var tmpFilename = './return_value_test.jpg'
                var image = testImage.save(tmpFilename)
                image.should.be.equal(testImage)
                fs.unlinkSync(tmpFilename)
            })

            it('should return the image object when asynchronously saving to file', function () {
                var tmpFilename = './return_value_test.jpg'
                var image = testImage.save(tmpFilename, function () {
                    fs.unlinkSync(tmpFilename)
                })
                image.should.be.equal(testImage)
            })

            it('should return the image object when saving to stream', function () {
                var stream = h.CollectorStream()
                var image = testImage.save(stream, {format: 'jpeg'}, function () {})
                image.should.be.equal(testImage)
            })

            it('should return the image object when asynchronously saving to buffer', function () {
                var image = testImage.save({format: 'jpeg'}, function (err, buffer) {})
                image.should.be.equal(testImage)
            })

            it('should choose the format in this order: file extension, options.format, image.format', function () {
                var image = h.generateImage(),
                    jpegFilename = 'choose_format.jpg',
                    tmpFilename = 'choose_format.tmp'
                image.format = 'gif'
                after(_.partial(fs.unlinkSync, jpegFilename))
                after(_.partial(fs.unlinkSync, tmpFilename))

                image.save(jpegFilename, {format: 'png'})
                gd.open(jpegFilename).format.should.be.equal('jpeg')

                image.save(tmpFilename, {format: 'png'})
                gd.open(tmpFilename).format.should.be.equal('png')

                image.save(tmpFilename)
                gd.open(tmpFilename).format.should.be.equal('gif')
            })

            it('should set jpeg quality with `quality` option'/*, function () {
                var image = h.generateImage()
                    highQualityJpeg = image.save({format: 'jpeg', quality: 99}),
                    lowQualityJpeg  = image.save({format: 'jpeg', quality: 1})
                lowQualityJpeg.length.should.be.below(highQualityJpeg.length)
            }*/)

            it('should set png compression level with `compression` option')
        })

        describe('resize()', function () {
            function Image (width, height) {
                return gd.createTrueColor(width, height)
            }
            function Ratio (image) {
                return image.width / image.height
            }
            var target = {width: 50, height: 50}

            it('should save image ratio on resize', function () {
                var image = Image(200, 100),
                    resized = image.resize(target)
                Ratio(resized).should.equal(Ratio(image))
            })
            it('should scale the image by height if image ratio is less than target size ratio', function () {
                Image(100, 200).resize(target).height.should.equal(target.height)
            })
            it('should scale the image by width if image ratio is greater than target size ratio', function () {
                Image(200, 100).resize(target).width.should.equal(target.width)
            })
            it('should resize by width option only and save image ratio', function () {
                var target = {width:50, format: 'png'},
                    image = Image(200, 100),
                    resized = image.resize(target)
                resized.width.should.equal(target.width)
                Ratio(resized).should.equal(Ratio(image))
            })
            it('should resize by height option only and save image ratio', function () {
                var target = {height:50, format: 'png'},
                    image = Image(200, 100),
                    resized = image.resize(target)
                resized.height.should.equal(target.height)
                Ratio(resized).should.equal(Ratio(image))
            })
            it('should crop the image if "method" option is set to "crop"', function () {
                var image = Image(200, 100),
                    target = {width: 30, height: 20, method: 'crop', format: 'png'},
                    cropped = image.resize(target)
                cropped.width.should.equal(target.width)
                cropped.height.should.equal(target.height)
            })
        })

        describe('watermark()', function () {
            var watermark = gd.open(samples.watermark)

            // TODO: is this really supposed to be so? Generally, mutators are evil.
            it('should return original image', function () {
                var image = createGradientImage(100, 100)
                image.watermark(watermark, {x:0, y:0}).should.equal(image)
            })

            it('should put the watermark at the center of the image by default', function () {
                var image = createGradientImage(100, 100)
                image.watermark(watermark)
                watermarkShouldBeAt(image, watermark, 0.5, 0.5)
            })

            it('should put watermark on a given single position', function () {
                var x, y, image
                for (x = 0; x <= 1; x += 0.2) {
                    for (y = 0; y <= 1; y += 0.2) {
                        image = createGradientImage(50, 50)
                        image.watermark(watermark, {x:x, y:y})
                        watermarkShouldBeAt(image, watermark, x, y)
                    }
                }
            })

            it('should choose watermark position by brightness', function () {
                var image
                image = createGradientImage(50, 50)
                image.watermark(watermark, [
                    {x: 0, y: 0},
                    {x: 0, y: 1},
                    {x: 1, y: 0},
                    {x: 1, y: 1},
                ])
                watermarkShouldBeAt(image, watermark, 0, 0)

                image = createGradientImage(50, 50)
                image.watermark(watermark, [
                    {x: 0, y: 1},
                    {x: 1, y: 0},
                    {x: 1, y: 1},
                ])
                watermarkShouldBeAt(image, watermark, 1, 0)

                image = createGradientImage(50, 50)
                image.watermark(watermark, [
                    {x: 0, y: 1},
                    {x: 1, y: 1},
                ])
                watermarkShouldBeAt(image, watermark, 0, 1)

                image = createGradientImage(50, 50)
                image.watermark(watermark, [
                    {x: 1, y: 1},
                ])
                watermarkShouldBeAt(image, watermark, 1, 1)
            })

            it('should accept stream as an async watermark source', function (done) {
                var source = fs.createReadStream(samples.watermark)
                source.LE_DEBUG = samples.watermark
                testWatermarkSourceAsync(done, source, watermark)
            })

            it('should accept filename as a sync watermark source', function () {
                var source = samples.watermark
                testWatermarkSourceSync(source)
            })

            it('should accept buffer as a sync watermark source', function () {
                var source = fs.readFileSync(samples.watermark)
                testWatermarkSourceSync(source)
            })

            it('should accept filename as an async watermark source', function (done) {
                var source = samples.watermark
                testWatermarkSourceAsync(done, source, watermark)
            })

            it('should accept buffer as an async watermark source', function (done) {
                var source = fs.readFileSync(samples.watermark)
                testWatermarkSourceAsync(done, source, watermark)
            })

        })

        describe('autoOrient()', function () {
            _.each(samples.filesByExifOrientation, function (filename, orientation) {
                it('should orient image containing Exif Orientation = '  + orientation, function () {
                    var image = gd.open(filename, {autoOrient: false})
                    var rotated = image.autoOrient()
                    rotated.getPixel(1, 0).should.be.equal(0)
                    rotated.exif.Orientation.should.be.equal(1)
                })

                it('should not modify original image', function () {
                    var image = gd.open(filename, {autoOrient: false})
                    var rotated = image.autoOrient()
                    image.getPixel(1, 0).should.not.be.equal(0)
                    image.exif.Orientation.should.be.eql(orientation)
                })

                it('should throw gd.NOEXIF on image containing no Exif data', function () {
                    h.testErrorSync('NOEXIF', function () {
                        gd.open(samples.filesByType['png']).autoOrient()
                    })
                })

                it('should not throw on image containing no Exif Orientation tag', function () {
                    ;(function () {
                        var image = gd.open(samples.filesByExifOrientation[3])
                        delete image.exif.Orientation
                        image.autoOrient()
                    }).should.not.throw
                })

                it('should throw gd.BADORIENT on image containing Exif Orientation of [2, 4, 5, 7]', function () {
                    var image = gd.open(samples.filesByExifOrientation[3])
                    _.each([2, 4, 5, 7], function (orientation) {
                        image.exif.Orientation = orientation
                        h.testErrorSync('BADORIENT', function () {
                            image.autoOrient()
                        })
                    })
                })
            })
        })
    })
})


function testWatermarkSourceAsync(done, source, watermark) {
    var x = 0,
        y = 0
    createGradientImage(50, 50).watermark(source, {x:x, y:y}, function (err, image) {
        watermarkShouldBeAt(image, watermark, x, y)
        done()
    })
}

function testWatermarkSourceSync(source) {
    var x = 0,
        y = 0,
        watermark = gd.open(source),
        image = createGradientImage(50, 50)
    image.watermark(source, {x:x, y:y})
    watermarkShouldBeAt(image, watermark, x, y)
}

function createGradientImage (width, height) {
    var img = gd.createTrueColor(width, height)
    return greyGradientFill(img, Math.PI/8)
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

function watermarkShouldBeAt(image, watermark, x, y) {
    var real_x = Math.round((image.width - watermark.width) * x + watermark.width / 2),
        real_y = Math.round((image.height - watermark.height) * y + watermark.height / 2)
    image.getPixel(real_x, real_y).should.equal(watermark.getPixel(Math.round(watermark.width / 2), Math.round(watermark.height / 2)))
}

function checkGeneratedImage(originalImage, generatedBuffer, imageType) {
    var image = gdImageFromBuffer(generatedBuffer, imageType)
    image.should.be.an.instanceof(gd.Image)
    image.width.should.equal(originalImage.width)
    image.height.should.equal(originalImage.height)
}

function gdImageFromBuffer(buffer, type) {
    var openers = {
            'jpeg': gd.createFromJpegPtr,
            'png':  gd.createFromPngPtr,
            'gif':  gd.createFromGifPtr,
        }
    return openers[type](buffer)
}
