var Benchmark = require('benchmark')
    fs = require('fs'),
    _ = require('underscore'),
    async = require('async'),
    h = require('../test/helpers.js'),

    gd = require('../index.js'),
    resize = require('resize'),
    rsz = require('rsz'),
    im = require('im'),
    gm = require('gm')


/*
These libraries are required to run the benchmark:
    GraphicsMagick
    ImageMagick
    cairo

Installation with MacPorts:
    port -v install GraphicsMagick +universal
    port -v install ImageMagick +universal
    port -v install cairo +universal
*/

function SampleStreams(imageData, deferred) {
    this.input = new h.ReadableStream(imageData)
    this.output = new h.WritableStream()
    this.output.on('finish', function () {
        if (this.written.length < 100) throw Error('Broken output')
        deferred.resolve()
    })
}


var samplePath = __dirname + '/samples/',
    samples = _.filter(fs.readdirSync(samplePath), function (file) {return /\.jpg$/.test(file)}).sort()


async.eachSeries(samples, function (sample, done) {
    var imageData = fs.readFileSync(samplePath + sample)
    ;(new Benchmark.Suite)

    .add('easy-gd',
        function (deferred) {
            var sample = new SampleStreams(imageData, deferred)
            sample.input
                .pipe(gd.resize({width:100, height:100}))
                .pipe(sample.output)
        },
        {defer: true}
    )

    .add('gm',
        function (deferred) {
            var sample = new SampleStreams(imageData, deferred)
            gm(sample.input)
                .resize(100, 100)
                .stream()
                .pipe(sample.output)
        },
        {defer: true}
    )

    .add('im',
        function (deferred) {
            var sample = new SampleStreams(imageData, deferred)
            im(sample.input)
                .resize('100x100')
                .convert(sample.output)
        },
        {defer: true}
    )

    .add('resize',
        function (deferred) {
            var sample = new SampleStreams(imageData, deferred)
            resize(sample.input.read(), 100, 100, {}, function (err, buf) {
                sample.output.end(buf)
            })
        },
        {defer: true}
    )

    // NOTE: rsz seems to leak a lot of memory and, furthermore, produces images with no resampling done (which addes some speed but causes rough edges on the image).
    // NOTE: Should be compared with gd.resize({width:100, height:100, resample: false})
    // .add('rsz',
    //     function (deferred) {
    //         var sample = new SampleStreams(imageData, deferred)
    //         rsz(sample.input.read(), {width: 100, height: 100, aspectRatio: true}, function (err, buf) {
    //             sample.output.end(buf)
    //         })
    //     },
    //     {defer: true}
    // )

    .on('start', function (event) {
        console.log('Resizing %s (%d bytes)', sample, imageData.length)
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
