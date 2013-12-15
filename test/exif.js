var should = require('should'),
    gd = require('../index.js'),
    _ = require('underscore'),
    samples = require('./samples.js')

describe('gd', function () {
    // TODO: test for exif property in image
    // TODO: test for rotated exif.Orientation to be equal 1

    _.each(samples.filesByExifOrientation, function (filename, orientation) {
        it('should automatically orientate image containing Exif Orientation = '  + orientation, function () {
            var image = gd.open(filename)
            image.getPixel(1, 0).should.be.equal(0)
        })
        it('should automatically orientate image containing Exif Orientation = ' + orientation + ' with autoOrient option set to true', function () {
            var image = gd.open(filename, {autoOrient: true})
            image.getPixel(1, 0).should.be.equal(0)
        })
        it('should not automatically orientate image containing Exif Orientation = ' + orientation + ' with autoOrient option set to false', function () {
            var image = gd.open(filename, {autoOrient: false})
            image.getPixel(1, 0).should.be.above(parseInt('0xf0f0f0', 16))
        })
    })
})
