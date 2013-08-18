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

            testData.forType(function (type) {
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
            function create_gradient_image (width, height) {
                var img = gd.createTrueColor(width, height)
                return grey_gradient_fill(img, Math.PI/8)
            }

            function grey_gradient_fill (image, angle) {
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

            var watermark = gd.createTrueColor(5, 5),
                watermark_color = watermark.colorAllocate(255, 255, 255)
            watermark.fill(0, 0, watermark_color)

            function watermark_should_be_at(image, x, y) {
                var real_x = Math.round((image.width - watermark.width) * x + watermark.width / 2),
                    real_y = Math.round((image.height - watermark.height) * y + watermark.height / 2)
                image.getPixel(real_x, real_y).should.equal(watermark_color)
            }

            it('should return original image', function () {
                var image = create_gradient_image(100, 100)
                image.watermark(watermark, {x:0, y:0}).should.equal(image)
            })

            it('should put watermark on a given single position', function () {
                var x, y, image
                for (x = 0; x <= 1; x += 0.2) {
                    for (y = 0; y <= 1; y += 0.2) {
                        image = create_gradient_image(50, 50)
                        image.watermark(watermark, {x:x, y:y})
                        watermark_should_be_at(image, x, y)
                    }
                }
            })

            it('should choose watermark position by brightness', function () {
                var image
                image = create_gradient_image(50, 50)
                image.watermark(watermark, [
                    {x: 0, y: 0},
                    {x: 0, y: 1},
                    {x: 1, y: 0},
                    {x: 1, y: 1},
                ])
                watermark_should_be_at(image, 0, 0)

                image = create_gradient_image(50, 50)
                image.watermark(watermark, [
                    {x: 0, y: 1},
                    {x: 1, y: 0},
                    {x: 1, y: 1},
                ])
                watermark_should_be_at(image, 1, 0)

                image = create_gradient_image(50, 50)
                image.watermark(watermark, [
                    {x: 0, y: 1},
                    {x: 1, y: 1},
                ])
                watermark_should_be_at(image, 0, 1)

                image = create_gradient_image(50, 50)
                image.watermark(watermark, [
                    {x: 1, y: 1},
                ])
                watermark_should_be_at(image, 1, 1)
            })
        })
    })
})
