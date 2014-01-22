_The documentation on 0.0.7 version (which is installed when you do ``npm install easy-gd``) could be found at [npmjs.org/package/easy-gd](https://npmjs.org/package/easy-gd)._

_The master branch has been heavily rewritten, the documentation will follow._

# easy-gd [![Build Status](https://travis-ci.org/furagu/easy-gd.png?branch=master)](https://travis-ci.org/furagu/easy-gd)

Easy-gd is a node.js wrapper of the [GD image manipulation library](http://libgd.bitbucket.org) designed with the following goals in mind:

1. Provide an organic node.js interface to the libgd library having C-style interface itself.
2. Automate the routine image manipulation tasks like resizing, cropping, watermarking, etc.

## Quickstart

### Resize an Image

Say, you have a nice photo of a kitten and you want to make a thumbnail of it. Begin by loading the easy-gd module:

```js
var gd = require('easy-gd')
```

Then, open the image:

```js
var image = gd.open('kitten.jpg')
```

The image is now loaded into memory. It has properties and methods, __resize__ and __save__ being two of them. Most of the methods are chainable, making image manipulation easy indeed:

```js
image.resize({width: 100, height: 100}).save('kitten-thumbnail.jpg')
```

That's it! Your image was shrunk to feat into 100x100 pixels and saved into kitten-thumbnail.jpg file.

### Add a Watermark

_DESCRIPTION HERE_

```js
var gd = require('easy-gd')

gd.open('kitten.jpg')
  .resize({width: 800, height: 600})
  .watermark('logo.png')
  .save('kitten-large.jpg')
```

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
