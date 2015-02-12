# easy-gd [![Build Status](https://travis-ci.org/furagu/easy-gd.png?branch=master)](https://travis-ci.org/furagu/easy-gd)

A Node.js wrapper around [GD image manipulation library](http://libgd.bitbucket.org) with extra features:

* A drop-in replacement for [node-gd](https://www.npmjs.org/package/node-gd). You can just ```require('easy-gd')``` instead of ```require('node-gd')``` and everything will be working as before.
* Image format autodetection: just [```gd.open(file)```](#readingwriting-image-files) instead of choosing between ```gd.createFromJpeg(file)``` or  ```gd.createFromPng(file)``` or whatever.
* Handy [resizing](#resizing-images) and [watermarking](#placing-a-watermark) shortcuts: ```gd.open('image.png').resize({width: 100, height:100}).save('small-image.png')```.
* Reads/writes [files](#readingwriting-image-files), [buffers](#readingwriting-buffers) and [streams](#TODO).
* Provides [synchronous](#TODO), [asynchronous](#TODO) and [stream](#TODO) interfaces.
* Has built-in [Exif parsing](#TODO) and supports [automatic image orientation](#TODO).

## Recipes


### Reading/writing image files

```js
var gd = require('easy-gd')

var image = gd.open('image.png')

// Do something to the image

image.save('processed.jpg', {quality: 80})
```

See also: [Reading/writing buffers](#readingwriting-buffers), [Reading/writing streams](#TODO), [Asynchronous processing](#TODO), [Controlling the output format](#TODO).


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

See also: [Asynchronous processing](#TODO).


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

See also: [Reading/writing buffers](#readingwriting-buffers), [Reading/writing streams](#TODO), [Asynchronous processing](#TODO).


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

See also: [Reading/writing files](#readingwriting-image-files), [Reading/writing streams](#TODO), [Asynchronous processing](#TODO).


### Error handling
