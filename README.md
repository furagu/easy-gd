# easy-gd [![Build Status](https://travis-ci.org/furagu/easy-gd.png?branch=master)](https://travis-ci.org/furagu/easy-gd)

A simplified Node.js wrapper around [GD image manipulation library](http://libgd.bitbucket.org) with extra features:

* Image [format autodetection](#readingwriting-image-files): just `gd.open(file)` instead of choosing between gd.createFromJpeg() or gd.createFromPng() or whatever.
* Handy [resizing](#resizing-images) and [watermarking](#placing-a-watermark) shortcuts: `image.resize({width: 100, height:100})` and `image.watermark('logo.png')`.
* Reads/writes [files](#readingwriting-image-files), [buffers](#readingwriting-buffers) and [streams](#readingwriting-streams).
* Provides [synchronous](#synchronous-image-processing), [asynchronous](#asynchronous-image-processing) and [transform stream](#image-transform-streams) interfaces.
* Has built-in [Exif parsing](#reading-exif-data) and supports [automatic image orientation](#automatic-image-orientation).
* A drop-in replacement for [node-gd](https://www.npmjs.org/package/node-gd). You can just `require('easy-gd')` instead of `require('node-gd')` and everything will be working as before.

## Usage recipes

* [Resizing images](#resizing-images)
* [Placing a watermark](#placing-a-watermark)
* [Reading/writing image files](#readingwriting-image-files)
* [Reading/writing buffers](#readingwriting-buffers)
* [Reading/writing streams](#readingwriting-streams)
* [Image transform streams](#image-transform-streams)
* [Synchronous image processing](#synchronous-image-processing)
* [Asynchronous image processing](#asynchronous-image-processing)
* [Controlling the output format](#controlling-the-output-format)
* [Controlling image quality/compression](#controlling-image-qualitycompression)
* [Automatic filename extensions](#automatic-filename-extensions)
* [Reading Exif data](#reading-exif-data)
* [Automatic image orientation](#automatic-image-orientation)
* [Error handling](#error-handling)


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

// Save the resized image
resized.save('resized.jpg')
```

See also: [Reading/writing files](#readingwriting-image-files), [Asynchronous processing](#asynchronous-image-processing), [Image transform streams](#image-transform-streams).


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

// Save the watermarked image
watermarked.save('watermarked.jpg')
```

See also: [Reading/writing files](#readingwriting-image-files), [Reading/writing buffers](#readingwriting-buffers), [Reading/writing streams](#readingwriting-streams), [Asynchronous processing](#asynchronous-image-processing), [Error handling](#error-handling).


### Reading/writing image files

```js
var gd = require('easy-gd')

var image = gd.open('image.png')

// Do something to the image

image.save('processed.jpg', {quality: 90})
```

See also: [Reading/writing buffers](#readingwriting-buffers), [Reading/writing streams](#readingwriting-streams), [Asynchronous processing](#asynchronous-image-processing), [Controlling the output format](#controlling-the-output-format), [Error handling](#error-handling).


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

See also: [Reading/writing files](#readingwriting-image-files), [Reading/writing streams](#readingwriting-streams), [Asynchronous processing](#asynchronous-image-processing), [Controlling the output format](#controlling-the-output-format), [Error handling](#error-handling).


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

See also: [Image transform streams](#image-transform-streams), [Reading/writing files](#readingwriting-image-files), [Reading/writing buffers](#readingwriting-buffers), [Controlling the output format](#controlling-the-output-format), [Error handling](#error-handling).


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

See also: [Reading/writing files](#readingwriting-image-files), [Reading/writing buffers](#readingwriting-buffers), [Reading/writing streams](#readingwriting-streams), [Controlling the output format](#controlling-the-output-format), [Error handling](#error-handling).


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

See also: [Asynchronous processing](#asynchronous-image-processing), [Error handling](#error-handling).


### Asynchronous image processing

You can asynchronously process files, buffers and streams by passing additional `callback` argument:

```js
var gd = require('easy-gd')

// Processing files
gd.open('input.png', function (error, image) {
  if (error) throw error
  image.resize({width: 800, height: 600}, function (error, resized) {
    if (error) throw error
    resized.save('output.jpg', {quality: 90}, function (error) {
      if (error) throw error
    })
  })
})

// Processing buffers
gd.open(inputData, function (error, image) {
  if (error) throw error
  image.resize({width: 800, height: 600}, function (error, resized) {
    if (error) throw error
    resized.save({format: 'jpeg', quality: 90}, function (error, outputData) {
      if (error) throw error
      // Process outputData buffer
    })
  })
})

// Processing streams
gd.open(inputStream, function (error, image) {
  if (error) throw error
  image.resize({width: 800, height: 600}, function (error, resized) {
    if (error) throw error
    resized.save(outputStream, {format: 'jpeg', quality: 90}, function (error) {
      if (error) throw error
    })
  })
})
```

See also: [Image transform streams](#image-transform-streams), [Synchronous processing](#synchronous-image-processing), [Error handling](#error-handling).


### Controlling the output format

```js
var gd = require('easy-gd')

// Format is inherited from the source image
var image = gd.open('input.jpg')
var resizedBuffer = image.resize({width: 100}).save() // Saved in JPEG

// Format can be specified explicitly with target filename extension
var image = gd.open('input.jpg')
image.save('output.png') // Saved in PNG

// Format can be specified explicitly with save({format: 'format_name'})
var image = gd.open('input.jpg')
var pngBuffer = image.save({format: 'png'}) // Saved in PNG

// Target file extension has higher priority
var image = gd.open('input.png')
image.save('output.jpg') // Saved in JPEG
```

Format specification priority: filename extension > save 'format' option > inherited format.

See also: [Controlling image quality/compression](#controlling-image-qualitycompression), [Automatic filename extensions](#automatic-filename-extensions), [Error handling](#error-handling).


### Controlling image quality/compression

```js
var gd = require('easy-gd')
var image = gd.open('input.jpg')

// Setting JPEG file quality, 0-100
image.save('output.jpg', {quality: 90})

// Setting PNG file compression level, 0-9
image.save('ouput.png', {compression: 6})

// Transform stream options
inputStream.pipe(gd.format('png').compression(6)).pipe(outputStream)
inputStream.pipe(gd.format('jpeg').quality(90)).pipe(outputStream)
inputStream.pipe(gd.options({format: 'jpeg', quality: 90}).pipe(outputStream)

// Buffer saving options
var outputBuffer = image.save({format: 'jpeg', quality: 90})
var outputBuffer = image.save({format: 'png', compression: 6})
```

See also: [Controlling the output format](#controlling-the-output-format), [Automatic filename extensions](#automatic-filename-extensions).


### Automatic filename extensions

```js
var gd = require('easy-gd')

var image = gd.open('input.jpg')
image.save('output.{ext}', {format: 'png'}) // Writes ouput.png


var image = gd.open('input.jpg')
image
  .resize({width: 100})
  .save('output.{ext}') // Writes output.jpg since format was inherited
```

See also: [Controlling the output format](#controlling-the-output-format), [Controlling image quality/compression](#controlling-image-qualitycompression).


### Reading Exif data

Exif data are being parsed automatically for JPEG images.

```js
var gd = require('easy-gd')

var image = gd.open('input.jpg')

// Accessing Exif tags
if (image.exif) {
  console.log('%s %s', image.exif.GPSLongitude, image.exif.GPSLatitude)
} else {
  console.log('No Exif data')
}
```

Note: image.exif property will be copied by resize() and other methods, but will not be written to the destination image.

See also: [Automatic image orientation](#automatic-image-orientation).


### Automatic image orientation

GD does not process Exif data, resulting rotated images in the output. Easy-gd fixes this by automatically orienting the image.

```js
var gd = require('easy-gd')

// The image gets automatically oriented by Exif data
var image = gd.open('photo.jpg')

// Turn automatic orientation off
var original = gd.open('photo.jpg', {autoOrient: false})

// Automatically orient existing image
var rotated = original.autoOrient()
```

See also: [Reading Exif data](#reading-exif-data).


### Error handling

```js
var gd = require('easy-gd')

// Synchronous methods throw exceptions
try {
  var image = gd.open('non-existent.png')
} catch (error) {
  console.log('Failed to open the image: %s', error)
}

// Asynchronous methods return errors as the first callback argument;
// null means there was no error
gd.open('non-existent.png', function (error, image) {
  if (error) {
    console.log('Failed to open the image: %s', error)
    return
  }
  // ...
})

// Every error raised or returned by easy-gd is a descendant or gd.Error
try {
  doImageRelatedStuff()
} catch (error) {
  if (error instanceof gd.Error) {
    console.log('Image processing error: %s', error)
  } else {
    // Some other error happened
  }
}
```

There are some subclasses you can use to catch specific errors:

* __gd.UnknownSourceType__ - unknown source type.
* __gd.EmptySource__ - empty source file or buffer.
* __gd.UnknownImageFormat__ - unknown image format (or not an image at all).
* __gd.IncompleteImage__ - corrupted or incomplete image.
* __gd.UnsupportedOrientation__ - unsupported image Exif orientation tag value.
* __gd.DestinationFormatRequired__ - destination image format required.
* __gd.UnknownDestinationType__ - unknown destination type.
* __gd.FileOpen__ - file opening error.
* __gd.FileDoesNotExist__ - file does not exist.
* __gd.FileWrite__ - file writing error.
* __gd.SynchronousStreamAccess__ - a stream cannot be read or written synchronously.
* __gd.OptionsRequired__ - options argument should be passed in.
