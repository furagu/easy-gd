_The documentation on 0.0.7 version (which is installed when you do ``npm install easy-gd``) could be found at [npmjs.org/package/easy-gd](https://npmjs.org/package/easy-gd)._

_The master branch has been heavily rewritten, the documentation will follow._

# easy-gd [![Build Status](https://travis-ci.org/furagu/easy-gd.png?branch=master)](https://travis-ci.org/furagu/easy-gd)

Easy-gd is a node.js wrapper of the [GD image manipulation library](http://libgd.bitbucket.org) designed with the following goals in mind:

1. Provide an organic node.js interface to the libgd library having C-style interface itself.
2. Automate the routine image manipulation tasks like resizing, cropping, watermarking, etc.

## Quickstart

### Making Thumbnails

Let's start with everyday basics. The most common thing to do with a graphics library on the web is to make a thumbnail of a user-uploaded image. Let's do it step by step with easy-gd. Begin by loading the library:

```js
var gd = require('easy-gd')
```

Open the image:

```js
var image = gd.open('uploaded-image.jpg')
```

The image is now loaded into memory and is represented by an object. It has properties and methods, __resize__ and __save__ being two of them. Most of the methods are chainable, making thumbnail generation this easy:

```js
image.resize({width: 100, height: 100}).save('image-thumbnail.jpg')
```

That's it! The image was shrunk to feat into 100x100 pixel square and was saved into image-thumbnail.jpg file.

The production-ready solution, though, should be made in a slightly different manner to take an advantage of asynchronous node.js nature. Read the section on [asynchronous processing](#TODO).

### Adding Watermarks

Adding a watermark is something that often goes hand by hand with image resizing. A watermark is a semi-transparent image to be put on top of the original image to represent a website or company attribution.

The common flow is something like this:

* User uploads an image.
* The image gets scaled down to some reasonable dimentions.
* A watermark gets applied to the image.
* The image gets saved and served.

This is how to do the resize-watermark-save part with easy-gd:

```js
var gd = require('easy-gd')

gd.open('uploaded.jpg')
  .resize({width: 1000, height: 1000})
  .watermark('logo.png')
  .save('large.jpg')
```

The default watermark position is the center of the image. To specify the position pass an additional __pos__ argument to the .watermark() call:

```js
image = image.watermark('logo', {x: 0, y: 0}) // the left top corner
image = image.watermark('logo', {x: 1, y: 1}) // the right bottom corner
```

Read the [advansed section](#TODO) how to make a watermarking process asynchronous.

### Read an Image from Buffer

_DESCRIPTION HERE_

```js
var gd = require('easy-gd')

gd.open(imageBuffer)
  .resize({width: 1500, height: 1500})
  .save(filename)
```

## License

Copyright (C) 2013-2014 Egor Balyshev<br>
Copyright (C) 2013 Alexander Schepanovski

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
