var Benchmark = require('benchmark')
    fs = require('fs'),
    _ = require('underscore'),
    gd = require('../index.js'),
    resize = require('resize')

var sizes = ['small', 'large'],
    buffers = _.object(_.map(sizes, function (size) {return [size, fs.readFileSync(__dirname + '/samples/' + size +'.jpg')]}))

_.each(buffers, function (buffer, size) {
    console.log('Resizing ' + size + ' image')

    ;(new Benchmark.Suite)
    .add('easy-gd', function () {
        gd.createFromPtr(buffer, function (err, image) {
            image.resized({width:100, height:100})
        })
    })
    .add('resize', function () {
        resize(buffer, 100, 100, {}, function (err, buf){})
    })
    .on('cycle', function (event) {
        console.log(String(event.target))
    })
    .on('complete', function () {
        console.log('The fastest is ' + this.filter('fastest').pluck('name') + '\n')
    })
    .run({async: false})
})
