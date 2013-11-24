var should = require('should'),
    gd = require('../index.js'),
    _ = require('underscore'),
    samples = require('./samples.js')

describe('gd', function () {
    var black = false,
        white = true

    describe('createFrom()', function () {
        _.each(samples.filesByExifOrientation, function (filename, orientation) {
            it('should automatically orientate image containing Exif Orientation = ' + orientation, function (done) {
                gd.createFrom(filename, _.partial(checkPixelColor, done, 1, 0, black))
            })
            it('should automatically orientate image containing Exif Orientation = ' + orientation + ' with autorotate option set to true', function (done) {
                gd.createFrom(filename, {autorotate: true}, _.partial(checkPixelColor, done, 1, 0, black))
            })
            it('should not automatically orientate image containing Exif Orientation = ' + orientation + ' with autorotate option set to false', function (done) {
                gd.createFrom(filename, {autorotate: false}, _.partial(checkPixelColor, done, 1, 0, white))
            })
        })
    })
    describe('createFromPtr()', function () {
        _.each(samples.buffersByExifOrientation, function (buffer, orientation) {
            it('should automatically orientate image containing Exif Orientation = ' + orientation, function (done) {
                gd.createFromPtr(buffer, _.partial(checkPixelColor, done, 1, 0, black))
            })
            it('should automatically orientate image containing Exif Orientation = ' + orientation + ' with autorotate option set to true', function (done) {
                gd.createFromPtr(buffer, {autorotate: true}, _.partial(checkPixelColor, done, 1, 0, black))
            })
            it('should not automatically orientate image containing Exif Orientation = ' + orientation + ' with autorotate option set to false', function (done) {
                gd.createFromPtr(buffer, {autorotate: false}, _.partial(checkPixelColor, done, 1, 0, white))
            })
        })
    })

    function checkPixelColor(done, x, y, lightColor, err, image) {
        if (err) return done(err)
        image.getPixel(x, y).should.be[lightColor ? 'above' : 'equal'](0)
        done()
    }
})
