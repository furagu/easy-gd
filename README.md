# easy-gd [![Build Status](https://travis-ci.org/furagu/easy-gd.png?branch=master)](https://travis-ci.org/furagu/easy-gd)

A Node.js wrapper around [GD image manipulation library](http://libgd.bitbucket.org) with extra features:

* A drop-in replacement for [node-gd](https://www.npmjs.org/package/node-gd). You can just ```require('easy-gd')``` instead of ```require('node-gd')``` and everything will be working as before.
* Image format autodetection: just ```gd.open(file)``` instead of choosing between ```gd.createFromJpeg(file)``` or  ```gd.createFromPng(file)``` or whatever.
* Handy [resizing](#resizing-images) and [watermarking](#TODO) shortcuts: ```gd.open('image.png').resize({width: 100, height:100}).save('small-image.png')```.
* Reads/writes [files](#TODO), [buffers](#TODO) and [streams](#TODO).
* [Synchronous](#TODO), [asynchronous](#TODO) and [stream](#TODO) interfaces.
* [Exif parsing](#TODO) and [automatic image orientation](#TODO) support.

## Recipes


### Reading/writing image files

```js
var gd = require('easy-gd')

var image = gd.open('image.png')

// Do something to the image

image.save('processed.jpg', {quality: 80})
```

See also: [asynchronous processing](#TODO), [controlling the output format](#TODO).


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
