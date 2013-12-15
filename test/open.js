var should = require('should'),
    _ = require('underscore'),
    fs = require('fs'),
    gd = require('../index.js'),
    samples = require('./samples.js')


describe('gd', function () {
    describe('open()', function () {
        it('should return gd.BADSOURCE error on unsupported source type', function (done) {
            testErrorAsync(done, 'BADSOURCE', gd.open, {some: 'object'})
        })
        it('should throw gd.BADSOURCE exception on unsupported source type', function () {
            testErrorSync('BADSOURCE', gd.open, {some: 'object'})
        })

        it('should return gd.DOESNOTEXIST error on open of not existing file', function (done) {
            testErrorAsync(done, 'DOESNOTEXIST', gd.open, samples.notExistingFile)
        })
        it('should throw gd.DOESNOTEXIST exception on open of not existing file', function () {
            testErrorSync('DOESNOTEXIST', gd.open, samples.notExistingFile)
        })

        //TODO: tests for BADFILE error

        it('should return gd.NODATA error on open of empty file', function (done) {
            testErrorAsync(done, 'NODATA', gd.open, samples.emptyFile)
        })
        it('should throw gd.NODATA exception on open of empty file', function () {
            testErrorSync('NODATA', gd.open, samples.emptyFile)
        })

        it('should return gd.NODATA error on open of empty buffer', function (done) {
            testErrorAsync(done, 'NODATA', gd.open, new Buffer(0))
        })
        it('should throw gd.NODATA exception on open of empty buffer', function () {
            testErrorSync('NODATA', gd.open, new Buffer(0))
        })

        it('should return gd.BADFORMAT error on open of non-image file', function (done) {
            testErrorAsync(done, 'BADFORMAT', gd.open, samples.nonImageFile)
        })
        it('should throw gd.BADFORMAT exception on open of non-image file', function () {
            testErrorSync('BADFORMAT', gd.open, samples.nonImageFile)
        })

        it('should return gd.BADFORMAT error on open of non-image buffer', function (done) {
            testErrorAsync(done, 'BADFORMAT', gd.open, new Buffer('NO IMAGE HERE'))
        })
        it('should throw gd.BADFORMAT exception on open of non-image buffer', function () {
            testErrorSync('BADFORMAT', gd.open, new Buffer('NO IMAGE HERE'))
        })

        _.each(samples.incompleteFilesByType, function (filename, type) {
            it('should return gd.BADIMAGE error on open of incomplete ' + type + ' file', function (done) {
                testErrorAsync(done, 'BADIMAGE', gd.open, filename)
            })
            it('should throw gd.BADIMAGE exception on open of incomplete ' + type + ' file', function () {
                testErrorSync('BADIMAGE', gd.open, filename)
            })
        })

        _.each(samples.incompleteBuffersByType, function (buffer, type) {
            it('should return gd.BADIMAGE error on open of incomplete ' + type + ' buffer', function (done) {
                testErrorAsync(done, 'BADIMAGE', gd.open, buffer)
            })
            it('should throw gd.BADIMAGE exception on open of incomplete ' + type + ' buffer', function () {
                testErrorSync('BADIMAGE', gd.open, buffer)
            })
        })

        _.each(samples.filesByType, function (filename, type) {
            it('should sync open ' + type + ' file', function () {
                var image = gd.open(filename)
                validateImage(image, type)
            })

            it('should async open ' + type + ' file', function (done) {
                gd.open(filename, function (err, image) {
                    validateImage(image, type)
                    done()
                })
            })

            it('should be really async when open ' + type + ' file', function (done) {
                var changedLater = 'sync'
                gd.open(filename, function (err, image) {
                    changedLater.should.equal('async')
                    done()
                })
                changedLater = 'async'
            })
        })

        _.each(samples.buffersByType, function (buffer, type) {
            it('should sync open ' + type + ' buffer', function () {
                var image = gd.open(buffer)
                validateImage(image, type)
            })

            it('should async open ' + type + ' buffer', function (done) {
                var image = gd.open(buffer, function (err, image) {
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

function testErrorAsync(done, errorName, fn) {
    var args = Array.prototype.slice.call(arguments, 3)

    args.push(function asyncRunCallback (err, image) {
        err.should.be.an.instanceof(Error)
        err.should.have.property('code')
        err.code.should.be.equal(gd[errorName])
        done()
    })

    fn.apply(gd, args)
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
