var should = require('should'),
    _ = require('underscore'),
    fs = require('fs'),
    gd = require('../index.js'),
    samples = require('./samples.js'),
    h = require('./helpers.js')


describe('gd', function () {
    describe('open()', function () {
        it('should return gd.UnknownSourceTypeError error on unsupported source type', function (done) {
            h.testErrorAsync(gd.UnknownSourceTypeError, done, function (callback) {
                gd.open({some: 'object'}, callback)
            })
        })
        it('should throw gd.UnknownSourceTypeError exception on unsupported source type', function () {
            h.testErrorSync(gd.UnknownSourceTypeError, function () {
                gd.open({some: 'object'})
            })
        })

        it('should return gd.FileDoesNotExistError error on open of not existing file', function (done) {
            h.testErrorAsync(gd.FileDoesNotExistError, done, function (callback) {
                gd.open(samples.notExistingFile, callback)
            })
        })
        it('should throw gd.FileDoesNotExistError exception on open of not existing file', function () {
            h.testErrorSync(gd.FileDoesNotExistError, function () {
                gd.open(samples.notExistingFile)
            })
        })

        it('should return gd.FileOpenError error on reading directory instead of file', function (done) {
            h.testErrorAsync(gd.FileOpenError, done, function (callback) {
                gd.open('.', callback)
            })
        })
        it('should throw gd.FileOpenError exception when reading directory instead of file', function () {
            h.testErrorSync(gd.FileOpenError, function () {
                gd.open('.')
            })
        })

        it('should return gd.EmptySourceError error on open of empty file', function (done) {
            h.testErrorAsync(gd.EmptySourceError, done, function (callback) {
                gd.open(samples.emptyFile, callback)
            })
        })
        it('should throw gd.EmptySourceError exception on open of empty file', function () {
            h.testErrorSync(gd.EmptySourceError, function () {
                gd.open(samples.emptyFile)
            })
        })

        it('should return gd.EmptySourceError error on open of empty buffer', function (done) {
            h.testErrorAsync(gd.EmptySourceError, done, function (callback) {
                gd.open(new Buffer(0), callback)
            })
        })
        it('should throw gd.EmptySourceError exception on open of empty buffer', function () {
            h.testErrorSync(gd.EmptySourceError, function () {
                gd.open(new Buffer(0))
            })
        })

        it('should return gd.UnknownImageFormatError error on open of non-image file', function (done) {
            h.testErrorAsync(gd.UnknownImageFormatError, done, function (callback) {
                gd.open(samples.nonImageFile, callback)
            })
        })
        it('should throw gd.UnknownImageFormatError exception on open of non-image file', function () {
            h.testErrorSync(gd.UnknownImageFormatError, function () {
                gd.open(samples.nonImageFile)
            })
        })

        it('should return gd.UnknownImageFormatError error on open of non-image buffer', function (done) {
            h.testErrorAsync(gd.UnknownImageFormatError, done, function (callback) {
                gd.open(new Buffer('NO IMAGE HERE'), callback)
            })
        })
        it('should throw gd.UnknownImageFormatError exception on open of non-image buffer', function () {
            h.testErrorSync(gd.UnknownImageFormatError, function () {
                gd.open(new Buffer('NO IMAGE HERE'))
            })
        })

        _.each(samples.incompleteFilesByType, function (filename, type) {
            it('should return gd.IncompleteImageError error on open of incomplete ' + type + ' file', function (done) {
                h.testErrorAsync(gd.IncompleteImageError, done, function (callback) {
                    gd.open(filename, callback)
                })
            })
            it('should throw gd.IncompleteImageError exception on open of incomplete ' + type + ' file', function () {
                h.testErrorSync(gd.IncompleteImageError, function () {
                    gd.open(filename)
                })
            })
        })

        _.each(samples.incompleteBuffersByType, function (buffer, type) {
            it('should return gd.IncompleteImageError error on open of incomplete ' + type + ' buffer', function (done) {
                h.testErrorAsync(gd.IncompleteImageError, done, function (callback) {
                    gd.open(buffer, callback)
                })
            })
            it('should throw gd.IncompleteImageError exception on open of incomplete ' + type + ' buffer', function () {
                h.testErrorSync(gd.IncompleteImageError, function () {
                    gd.open(buffer)
                })
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
                gd.open(buffer, function (err, image) {
                    validateImage(image, type)
                    done()
                })
            })
        })

        _.each(samples.filesByType, function (filename, type) {
            it('should async open ' + type + ' stream', function (done) {
                var stream = fs.createReadStream(filename)
                gd.open(stream, function (err, image) {
                    validateImage(image, type)
                    done()
                })
            })
        })

        it('should throw gd.SynchronousStreamAccessError exception on sync open of a stream', function () {
            var stream = fs.createReadStream(samples.emptyFile)
            h.testErrorSync(gd.SynchronousStreamAccessError, function () {
                gd.open(stream)
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
