var should = require('should'),
    gd = require('../index.js'),
    fs = require('fs'),
    testData = require('./data.js')

describe('gd', function () {
    before(function () {
        testData.forFileData(fs.writeFileSync)
    })

    describe('createFrom', function () {
        testData.forFileType(function (filename, type) {
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

    after(function () {
        testData.forFileData(fs.unlinkSync)
    })
})
