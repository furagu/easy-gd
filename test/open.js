var should = require('should'),
    _ = require('underscore'),
    fs = require('fs'),
    gd = require('../index.js'),
    samples = require('./samples.js')


describe('gd', function () {
    describe('open()', function () {
        it('should return/throw gd.DOESNOTEXIST error/exception on open of not existing file', function (done) {
            testError(done, 'DOESNOTEXIST', gd.open, samples.notExistingFile)
        })

        it('should return/throw gd.NODATA error/exception on open of empty file', function (done) {
            testError(done, 'NODATA', gd.open, samples.emptyFile)
        })

        it('should return/throw gd.BADFORMAT error/exception on open of non-image file', function (done) {
            testError(done, 'BADFORMAT', gd.open, samples.nonImageFile)
        })

        _.each(samples.incompleteFilesByType, function (filename, type) {
            it('should return/throw gd.BADIMAGE error/exception on open of incomplete ' + type + ' file', function (done) {
                testError(done, 'BADIMAGE', gd.open, filename)
            })
        })

        _.each(samples.filesByType, function (filename, type) {
            it('should sync open ' + type + ' file', function () {
                var image = gd.open(filename)
                validateImage(image, type)
            })

            it('should async open ' + type + ' file', function (done) {
                var image = gd.open(filename, function (err, image) {
                    validateImage(image, type)
                    done()
                })
            })
        })

    })
})

function validateImage(image, type) {
    image.should.be.an.instanceof(gd.Image)
    image.width.should.equal(1)
    image.height.should.equal(1)
    image.should.have.property('format')
    image.format.should.equal(type)
}

function testError(done, errorName, fn) {
    var args = Array.prototype.slice.call(arguments, 3)

    function syncTest() {
        fn.apply(gd, args)
    }
    syncTest.should.throw(new RegExp('^' + errorName))
    try {
        syncTest()
    } catch (e) {
        e.code.should.be.equal(gd[errorName])
    }

    args.push(function asyncTestCallback (err, image) {
        err.should.be.an.instanceof(Error)
        err.should.have.property('code')
        err.code.should.be.equal(gd[errorName])
        done()
    })
    fn.apply(gd, args)
}
