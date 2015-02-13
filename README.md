# easy-gd [![Build Status](https://travis-ci.org/furagu/easy-gd.png?branch=master)](https://travis-ci.org/furagu/easy-gd)

A Node.js wrapper around [GD image manipulation library](http://libgd.bitbucket.org) with extra features:

* A drop-in replacement for [node-gd](https://www.npmjs.org/package/node-gd). You can just ```require('easy-gd')``` instead of ```require('node-gd')``` and everything will be working as before.
* Image format autodetection: just [```gd.open(file)```](#readingwriting-image-files) instead of choosing between ```gd.createFromJpeg(file)``` or  ```gd.createFromPng(file)``` or whatever.
* Handy [resizing](#resizing-images) and [watermarking](#placing-a-watermark) shortcuts: ```gd.open('image.png').resize({width: 100, height:100}).save('small-image.png')```.
* Reads/writes [files](#readingwriting-image-files), [buffers](#readingwriting-buffers) and [streams](#readingwriting-streams).
* Provides [synchronous](#synchronous-image-processing), [asynchronous](#asynchronous-image-processing) and [transform stream](#image-transform-streams) interfaces.
* Has built-in [Exif parsing](#TODO) and supports [automatic image orientation](#TODO).

## Recipes


### Reading/writing image files

```js
var gd = require('easy-gd')

var image = gd.open('image.png')

// Do something to the image

image.save('processed.jpg', {quality: 80})
```

See also: [Reading/writing buffers](#readingwriting-buffers), [Reading/writing streams](#readingwriting-streams), [Asynchronous processing](#asynchronous-image-processing), [Controlling the output format](#TODO).


### Resizing images

```js
var gd = require('easy-gd')

var image, resized

image = gd.open('image-800x600.jpg') // Source image size is 800×600

// Resize to feat into 100×100 box, yields 100×75 image
resized = image.resize({width: 100, height: 100})

// Resize by width, yields 200×150 image
resized = image.resize({width: 200})

// Resize by height, yields 267×200 image
resized = image.resize({height: 200})

// Resize and crop to 100×100
resized = image.crop({width: 100, height: 100})
resized = image.resize({width: 100, height: 100, method: 'crop'})

// Resize without resampling; faster but lowers the quality
resized = image.resize({width: 100, height: 100, resample: false})
```

See also: [Asynchronous processing](#asynchronous-image-processing), [Image transform streams](#image-transform-streams).


### Placing a watermark

```js
var gd = require('easy-gd')

var image, watermarked

image = gd.open('source-image.jpg')

// Place a logo at the center of the image
watermarked = image.watermark('logo.png')
watermarked = image.watermark('logo.png', {x: 0.5, y: 0.5})

// At the left top corner
watermarked = image.watermark('logo.png', {x: 0, y: 0})

// At the right bottom corner
watermarked = image.watermark('logo.png', {x: 1, y: 1})

// Choose the most contrast position for a logo at the bottom
watermarked = image.watermark('logo.png', [{x: 0, y: 1}, {x: 0.5, y: 1}, {x: 1, y: 1}])

// Using gd.Image object as a watermark
var logo = gd.open('logo.png')
watermarked = image.watermark(logo)
```

See also: [Reading/writing buffers](#readingwriting-buffers), [Reading/writing streams](#readingwriting-streams), [Asynchronous processing](#asynchronous-image-processing).


### Reading/writing buffers

```js
var gd = require('easy-gd')

// Reading image from buffer
var image = gd.open(imageData)

// Saving image to a buffer
var imageData = image.save()

// Using buffer as a watermark source
var watermarked = image.watermark(imageData)
```

See also: [Reading/writing files](#readingwriting-image-files), [Reading/writing streams](#readingwriting-streams), [Asynchronous processing](#asynchronous-image-processing), [Controlling the output format](#TODO).


### Reading/writing streams

```js
var gd = require('easy-gd')

// Reading image from stream
gd.open(stream, function (error, image) {
  if (!error) {
    // Process the image
  }
})

// Saving image to a stream
image.save(stream, function (error) {
  if (!error) {
    // Some action
  }
})

// Using stream as a watermark source
image.watermark(stream, function (error, watermarked) {
  if (!error) {
    // Process the watermarked image
  }
})
```

See also: [Image transform streams](#image-transform-streams), [Reading/writing files](#readingwriting-image-files), [Reading/writing buffers](#readingwriting-buffers), [Controlling the output format](#TODO).


### Image transform streams

All the image manipulation methods called directly on the module object produce chainable [transform streams](http://nodejs.org/api/stream.html#stream_class_stream_transform_1):

```js
var gd = require('easy-gd')

// Making thumbnails
process.stdin
  .pipe(gd.crop({width: 100, height: 100}))
  .pipe(process.stdout)

// Watermarking
process.stdin
  .pipe(gd.watermark('logo.png'))
  .pipe(process.stdout)

// Changing image format
process.stdin
  .pipe(gd.format('jpeg').quality(90))
  .pipe(process.stdout)

// Combine everything
process.stdin
  .pipe(
    gd.resize({width: 800, height: 600})
      .watermark('logo.png', {x:1, y:1})
      .options({format: 'jpeg', quality: '90'})
  )
  .pipe(process.stdout)
```

See also: [Reading/writing files](#readingwriting-image-files), [Reading/writing buffers](#readingwriting-buffers), [Reading/writing streams](#readingwriting-streams), [Controlling the output format](#TODO).


### Synchronous image processing

With easy-gd you can synchronously process files and buffers:

```js
var gd = require('easy-gd')

// Processing files
gd.open('input.png')
  .resize({width: 800, height: 600})
  .save('output.jpg', {quality: 90})

// Processing buffers
var outputData = gd.open(inputData)
  .resize({width: 800, height: 600})
  .save({format: 'jpeg', quality: 90})
```

See also: [Asynchronous processing](#asynchronous-image-processing).


### Asynchronous image processing

You can asynchronously process files, buffers and streams by passing additional ```callback(error[, resultImageOrBuffer])``` argument:

```js
var gd = require('easy-gd')

// Processing files
gd.open('input.png', function (error, image) {
  if (error) throw error;
  image.resize({width: 800, height: 600}, function (error, resized) {
    if (error) throw error;
    resized.save('output.jpg', {quality: 90}, function (error) {
      if (error) throw error;
    })
  })
})

// Processing buffers
gd.open(inputData, function (error, image) {
  if (error) throw error;
  image.resize({width: 800, height: 600}, function (error, resized) {
    if (error) throw error;
    resized.save({format: 'jpeg', quality: 90}, function (error, outputData) {
      if (error) throw error;
      // Process outputData buffer
    })
  })
})

// Processing streams
gd.open(inputStream, function (error, image) {
  if (error) throw error;
  image.resize({width: 800, height: 600}, function (error, resized) {
    if (error) throw error;
    resized.save(outputStream, {format: 'jpeg', quality: 90}, function (error) {
      if (error) throw error;
    })
  })
})
```

See also: [Image transform streams](#image-transform-streams), [Synchronous processing](#synchronous-image-processing).


### Error handling
