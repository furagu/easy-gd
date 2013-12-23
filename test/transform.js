var should = require('should'),
    gd = require('../index.js'),
    _ = require('underscore'),
    fs = require('fs'),
    stream = require('stream'),
    samples = require('./samples.js'),
    h = require('./helpers.js')

describe('gd', function () {
    describe('resize()', function () {
        it('should return an instance of stream.Transform', function () {
            gd.transformer().should.be.instanceof(stream.Transform)
        })

        it('should resize images piped in', function (done) {
            var resized = h.CollectorStream()
            resized.on('finish', function () {
                var image = gd.open(this.collected)
                image.width.should.be.below(101)
                image.height.should.be.below(101)
                done()
            })

            var source = fs.createReadStream(__dirname + '/samples/lemongrab.jpg')

            source
                .pipe(gd.transformer().resize({width: 100}).resize({height: 100}))
                .pipe(resized)
        })
    })
})

