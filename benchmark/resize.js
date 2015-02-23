var Benchmark = require('benchmark')
    fs = require('fs'),
    _ = require('underscore'),
    async = require('async'),
    h = require('../test/helpers.js'),

    gd = require('../index.js'),
    rsz = require('rsz'),
    im = require('im'),
    gm = require('gm')


/*
To run the benchmark:
    1. Install the system libraries
        Mac OS X with MacPorts:
            sudo port install GraphicsMagick +universal
            sudo port install ImageMagick +universal
            sudo port install cairo +universal
        Ubuntu with apt-get:
            sudo apt-get install libgd2-xpm-dev graphicsmagick imagemagick libcairo2-dev libgraphicsmagick1-dev libgif-dev

    2. Install node modules
        npm install rsz im gm benchmark

    3. Run it
        make benchmark
*/

var suites = [
    function (imageData) {
        return (new Benchmark.Suite('Resize with resampling'))
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
    },

    function (imageData) {
        return (new Benchmark.Suite('Resize without resampling'))
            .add('easy-gd',
                function (deferred) {
                    var sample = new SampleStreams(imageData, deferred)
                    sample.input
                        .pipe(gd.resize({width:100, height:100, resample: false}))
                        .pipe(sample.output)
                },
                {defer: true}
            )
            .add('rsz',
                function (deferred) {
                    var sample = new SampleStreams(imageData, deferred)
                    rsz(sample.input.read(), {width: 100, height: 100, aspectRatio: true}, function (err, buf) {
                        sample.output.end(buf)
                    })
                },
                {defer: true}
            )
    },
]


var samplePath = __dirname + '/samples/',
    samples = _.filter(fs.readdirSync(samplePath), function (file) {return /\.jpg$/.test(file)}).sort(function (a, b) {return parseInt(a, 10) > parseInt(b, 10)})

async.eachSeries(suites, function (suite, doneSuite) {
    async.eachSeries(samples, function (sample, doneSample) {
        var imageData = fs.readFileSync(samplePath + sample)

        suite(imageData)
            .on('start', function (event) {
                console.log('%s %s (%d bytes)', this.name, sample, imageData.length)
            })
            .on('cycle', function (event) {
                console.log(String(event.target))
            })
            .on('complete', function () {
                console.log('The fastest is ' + this.filter('fastest').pluck('name') + '\n')
                doneSample()
            })
            .run({async: false})
    }, doneSuite)
})


function SampleStreams(imageData, deferred) {
    this.input = new h.ReadableStream(imageData)
    this.output = new h.WritableStream()
    this.output.on('finish', function () {
        if (this.written.length < 100) throw Error('Broken output')
        deferred.resolve()
    })
}
