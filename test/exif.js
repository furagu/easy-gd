var should = require('should'),
    gd = require('../index.js'),
    _ = require('underscore'),
    samples = require('./samples.js')

describe('gd', function () {
    describe('open()', function () {
        _.each(samples.filesByType, function (filename, type) {
            it('should not set exif property on images with no Exif data', function () {
                gd.open(filename).should.not.have.property('exif')
            })
        })

        _.each(samples.filesByExifOrientation, function (filename) {
            it('should set exif property on images with Exif data', function () {
                var image = gd.open(filename)
                image.should.have.property('exif')
                image.exif.should.be.type('object')
                image.exif.should.have.property('GPSLatitude')
                image.exif.GPSLatitude.should.be.approximately(55.9, 0.1)
                image.exif.should.have.property('GPSLongitude')
                image.exif.GPSLongitude.should.be.approximately(92.8, 0.1)
            })
        })

        _.each(samples.filesByExifOrientation, function (filename, orientation) {
            it('should automatically orientate image containing Exif Orientation = '  + orientation, function () {
                var image = gd.open(filename)
                image.getPixel(1, 0).should.be.equal(0)
                image.exif.Orientation.should.be.equal(1)
            })
            it('should automatically orientate image containing Exif Orientation = ' + orientation + ' with autoOrient option set to true', function () {
                var image = gd.open(filename, {autoOrient: true})
                image.getPixel(1, 0).should.be.equal(0)
                image.exif.Orientation.should.be.equal(1)
            })
            it('should not automatically orientate image containing Exif Orientation = ' + orientation + ' with autoOrient option set to false', function () {
                var image = gd.open(filename, {autoOrient: false})
                image.getPixel(1, 0).should.be.above(parseInt('0xf0f0f0', 16))
                image.exif.Orientation.should.not.be.equal(1)
            })
        })
    })
})
