var should = require('should'),
    gd = require('../index.js'),
    _ = require('underscore'),
    fs = require('fs'),
    samples = require('./samples.js')


describe('gd', function () {
    describe('Image.prototype', function () {
        var testImage = gd.createTrueColor(100, 100)
        testImage.filledEllipse(50, 50, 25, 25, testImage.colorAllocate(255, 0, 0))

        describe('targetFormat()', function () {
            it('should lowerace options.format', function () {
                testImage.targetFormat({format: 'JPEG'}).should.equal('jpeg')
            })
            it('should lowerace options.defaultFormat', function () {
                testImage.targetFormat({defaultFormat: 'GIF'}).should.equal('gif')
            })
            it('should take format from options.format', function () {
                testImage.targetFormat({format: 'jpeg'}).should.equal('jpeg')
            })
            it('should take format from options.defaultFormat', function () {
                testImage.targetFormat({defaultFormat: 'jpeg'}).should.equal('jpeg')
            })
            it('should lowercace this.format', function () {
                _.extend(testImage, {format: 'PNG'}).targetFormat().should.equal('png')
            })
            it('should take format from this.format', function () {
                _.extend(testImage, {format: 'jpeg'}).targetFormat().should.equal('jpeg')
            })
            it('should prefer options.format over this.format and options.defaultFormat', function () {
                _.extend(testImage, {format: 'GIF'})
                    .targetFormat({format: 'PNG', defaultFormat: 'JPEG'}).should.equal('png')
            })
            it('should prefer this.format over options.defaultFormat', function () {
                _.extend(testImage, {format: 'GIF'})
                    .targetFormat({defaultFormat: 'PNG'}).should.equal('gif')
            })
            delete testImage.format
        })

        describe('ptr()', function () {
            var gdOpeners = {
                    'jpeg': gd.createFromJpegPtr,
                    'png':  gd.createFromPngPtr,
                    'gif':  gd.createFromGifPtr,
                }

            _.each(samples.types, function (type) {
                it('should create a ' + type + ' image', function () {
                    var image = gdOpeners[type](testImage.ptr({format: type}))
                    image.should.be.an.instanceof(gd.Image)
                    image.width.should.equal(testImage.width)
                    image.height.should.equal(testImage.height)
                })
            })
            it('should set jpeg quality with jpegquality option', function () {
                var highQualityImage = testImage.ptr({format: 'jpeg', jpegquality: 99}),
                    lowQualityImage  = testImage.ptr({format: 'jpeg', jpegquality: 1})
                lowQualityImage.length.should.be.below(highQualityImage.length)
            })
            it('should set png compression level with pnglevel option', function () {
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

            _.each(samples.types, function (type) {
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

        describe('resized()', function () {
            function Image (width, height) {
                return gd.createTrueColor(width, height)
            }
            function Ratio (image) {
                return image.width / image.height
            }
            var target = {width: 50, height: 50, format: 'png'}

            it('should require a target image format', function () {
                ;(function () {
                    Image(100, 200).resized({width:10, height:10})
                }).should.throw('Image format required')
            })

            it('should save image ratio on resize', function () {
                var image = Image(200, 100),
                    resized = image.resized(target)
                Ratio(resized).should.equal(Ratio(image))
            })
            it('should scale the image by height if image ratio is less than target size ratio', function () {
                Image(100, 200).resized(target).height.should.equal(target.height)
            })
            it('should scale the image by width if image ratio is greater than target size ratio', function () {
                Image(200, 100).resized(target).width.should.equal(target.width)
            })
            it('should resize by width option only and save image ratio', function () {
                var target = {width:50, format: 'png'},
                    image = Image(200, 100),
                    resized = image.resized(target)
                resized.width.should.equal(target.width)
                Ratio(resized).should.equal(Ratio(image))
            })
            it('should resize by height option only and save image ratio', function () {
                var target = {height:50, format: 'png'},
                    image = Image(200, 100),
                    resized = image.resized(target)
                resized.height.should.equal(target.height)
                Ratio(resized).should.equal(Ratio(image))
            })
            it('should crop the image if "method" option is set to "crop"', function () {
                var image = Image(200, 100),
                    target = {width: 30, height: 20, method: 'crop', format: 'png'},
                    cropped = image.resized(target)
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
                    testErrorSync('NOEXIF', function () {
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
                        testErrorSync('BADORIENT', function () {
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

function testErrorSync(errorName, fn) {
    var args = Array.prototype.slice.call(arguments, 2)

    function syncRun() {
        fn.apply(gd, args)
    }

    syncRun.should.throw(new RegExp('^' + errorName))

    try {
        syncRun()
    } catch (e) {
        e.should.have.property('code')
        e.code.should.be.equal(gd[errorName])
    }
}
