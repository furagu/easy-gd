var should = require('should'),
    gd = require('../index.js'),
    _ = require('underscore'),
    samples = require('./samples.js')

describe('gd', function () {
    describe('createFrom()', function () {
        _.each(samples.filesByType, function (filename, type) {
            it('should open ' + type + ' file', function (done) {
                gd.createFrom(filename, function (err, image) {
                    if (err) return done(err)
                    image.should.be.an.instanceof(gd.Image)
                    image.width.should.equal(1)
                    image.height.should.equal(1)
                    image.format.should.equal(type)
                    done()
                })
            })
        })
    })
})
