var Benchmark = require('benchmark')
    fs = require('fs'),
    _ = require('underscore'),
    async = require('async'),
    devnull = require('dev-null'),

    gd = require('../index.js'),
    resize = require('resize'),
    rsz = require('rsz'),
    im = require('im'),

    stream = require('stream'),
    util = require('util')

/*
In orger to run the benchmark please install the following libraries into your system:
    GraphicsMagick
    ImageMagick
    cairo

Mac OS X ports installation:
    port install GraphicsMagick +universal
    port install ImageMagick +universal
    port install cairo +universal
*/


util.inherits(BufferStream, stream.Readable);
function BufferStream(buffer, opt) {
    stream.Readable.call(this, opt)
    this.buffer = buffer
}
BufferStream.prototype._read = function() {
    this.push(this.buffer)
    this.push(null)
}


var samplePath = __dirname + '/samples/',
    samples = _.filter(fs.readdirSync(samplePath), function (file) {return /\.(png|jpg)$/.test(file)}).sort()

// TODO: im and rsz seem to leak a lot of memory. It would be nice to log the memory footprint.

async.eachSeries(samples, function (sample, done) {
    var imageData = fs.readFileSync(samplePath + sample)

    ;(new Benchmark.Suite)

    .add('easy-gd',
        function (deferred) {
            var stream = new BufferStream(imageData)
            gd.createFromPtr(stream.read(), function (err, image) {
                image.resized({width:100, height:100}).ptr()
                deferred.resolve()
            })
        },
        {defer: true}
    )

    .add('resize',
        function (deferred) {
            var stream = new BufferStream(imageData)
            resize(stream.read(), 100, 100, {}, function (err, buf) {
                deferred.resolve()
            })
        },
        {defer: true}
    )

    .add('rsz',
        function (deferred) {
            var stream = new BufferStream(imageData)
            rsz(stream.read(), {width: 100, height: 100}, function (err, buf) {
                deferred.resolve()
            })
        },
        {defer: true}
    )

    .add('im',
        function (deferred) {
            var stream = new BufferStream(imageData)
            im(stream).resize('100x100').convert(devnull())
            deferred.resolve()
        },
        {defer: true}
    )

    .on('start', function (event) {
        console.log('Testing %s (%d bytes)', sample, imageData.length)
    })
    .on('cycle', function (event) {
        console.log(String(event.target))
    })
    .on('complete', function () {
        console.log('The fastest is ' + this.filter('fastest').pluck('name') + '\n')
        done()
    })
    .run({async: false})
})
