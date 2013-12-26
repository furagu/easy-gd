var should = require('should'),
    gd = require('../index.js'),
    _ = require('underscore'),
    fs = require('fs'),
    stream = require('stream'),
    samples = require('./samples.js'),
    h = require('./helpers.js')

describe('gd', function () {
    describe('resize()', function () {
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
                .pipe(gd.resize({width: 200})
                        .resize({height: 200})
                        .crop({width:100, height: 100})
                        .watermark(__dirname + '/samples/watermark.png')
                        .format('jpeg')
                        .quality(100)
                )
                .pipe(resized)
        })

        // TODO: accurate watermark test
    })
})

