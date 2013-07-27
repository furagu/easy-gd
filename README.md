# easy-gd

[node-gd](https://npmjs.org/package/node-gd) extended with features making image processing easier: open an image of any supported format; resize an image doing no math at all; put watermarks like a boss.

## Quick Example
```js
// Require library
gd = require('easy-gd')

// Open an image
gd.createFrom('photo.jpeg', function (err, image) {
    // Resize image to fit into 800x600
    var resized = image.resized({width: 800, height: 600})

    // Open watermark image
    gd.createFrom('watermark.png', function (err, watermark) {
        // Put the watermark at the bottom right corner
        resized.watermark(watermark, {x:1, y:1})

        // Save result with target format inherited from the source image
        // {ext} gets automatically replaced with 'jpg'
        resized.save('resized.{ext}', {jpegquality: 90}, function (err, watermark) {
            console.log('Done')
        })
    })
})
```

## Documentation

### Reading

* [gd.createFrom](#createFrom)
* [gd.createFromPtr](#createFromPtr)
* [gd.getFormatPtr](#getFormatPtr)

### Writing

* [gd.Image.save](#save)
* [gd.Image.ptr](#ptr)

### Resizing

* [gd.Image.resized](#resized)
* [gd.Image.resizedPtr](#resizedPtr)

### Watermarking
* [gd.Image.watermark](#watermark)

## Reading

<a name="createFrom" />
### gd.createFrom(filename, callback)
Open image file with GD library, auto-detecting image format (only GIF, JPEG and PNG are supported). Automatically rotates image if Exif Orientation tag presents (mirrored images are not supported, rotated only).

__Arguments__

* filename – A name of the file to open.
* callback(err, image) – A callback which is called when the image is loaded or error occured. Image is a conventional gd.Image object extended with _format_ property, being 'jpg', 'gif' or 'png'.

__Example__

```js
gd.createFrom('./picture.jpeg', function (err, image) {
    if (err) {
        console.log('Error loading image: ' + err)
    } else {
        console.log('%s %dx%d loaded', image.format, image.width, image.height)
    }
})
```

<a name="createFromPtr" />
### gd.createFromPtr(buffer, callback)
Open a buffer with GD library, auto-detecting image format (only GIF, JPEG and PNG are supported). Automatically rotates image if Exif Orientation tag presents (mirrored images are not supported, rotated only).

__Arguments__

* buffer – A _Buffer_ object to read the image from.
* callback(err, image) – A callback which is called when the image is loaded or error occured. Image is a conventional gd.Image object extended with _format_ property, being 'jpg', 'gif' or 'png'.

__Example__

```js
// A file came from somewhere
gd.createFromPtr(file.data, function (err, image) {
    if (err) {
        console.log('Error loading image: ' + err)
    } else {
        console.log('%s %dx%d loaded', image.format, image.width, image.height)
    }
})
```

<a name="getFormatPtr" />
### gd.getFormatPtr(buffer)
Get format of the image stored in buffer. Returns 'jpg', 'gif' or 'png'. Throws exception on parsing error.

__Arguments__

* buffer – A _Buffer_ object with an image to parse the format of.

__Example__

```js
// A file came from somewhere
try {
    var format = gd.getFormatPtr(buffer)
    console.log('Got ' + format)
} catch (err) {
    console.log('Error parsing image format: ' + err)
}
```

<a name="save" />
### gd.Image.save(filename, [options,] callback)
Write gd.Image to a file. All the GD image objects has this method.
Options are not necessary for the images created with [gd.createFrom](#createFrom) or [gd.createFromPtr](#createFromPtr), otherwise at least _format_ option is required.

__Arguments__

* filename – A file to save the image to. "{ext}" substring in the filename will be replaced with an actual file extention based on the chosen format.
* options – An object representing save() settings:
    * format (optional) – A string with target file format, 'jpeg', 'png' or 'gif' in any letter case.
    * jpegquality (optional, JPEG format only) – A number from 0 to 100, controlling generated JPEG quality.
    * pnglevel  (optional, PNG fornat only) – A number from 0 to 9, controlling generated PNG compression level.
    * defaultFormat (optional) – same as _format_, but is used only if no _format_ option provided and the image.format is undefined.
* callback(err) – A callback which is called when the image is saved or error occured.

__Example__

```js
// Convert the image to lossy, but lighter format
gd.createFrom('theimage.png', function (err, image) {
    image.save('theimage.{ext}', {format: 'jpeg', jpegquality: 80}, function (err) {
        console.log(err || 'Success!')
    })
})

```

<a name="ptr" />
### gd.Image.ptr([options])
Get a _Buffer_ with binary image data in given format. Throws on error.
Options are not necessary for the images created with [gd.createFrom](#createFrom) or [gd.createFromPtr](#createFromPtr), otherwise at least _format_ option is required.

__Arguments__

* options – An object representing save() settings:
    * format (optional) – A string with target file format, 'jpeg', 'png' or 'gif' in any letter case.
    * jpegquality (optional, JPEG format only) – A number from 0 to 100, controlling generated JPEG quality.
    * pnglevel  (optional, PNG fornat only) – A number from 0 to 9, controlling generated PNG compression level.
    * defaultFormat (optional) – same as _format_, but is used only if no _format_ option provided and the image.format is undefined.

__Example__

```js
gd.createFrom('theimage.png', function (err, image) {
    try {
        var buffer = image.ptr({format: 'jpeg', jpegquality: 80})
    } catch (err) {
        return console.log('Error: ' + err)
    }
    // Output the image from buffer
})
```

<a name="resized" />
### gd.Image.resized(options)
Get scaled or cropped copy of an image. Throws on error.

__Arguments__
* options – An objects representing rezied() settings:
    * width (optional) – An integer representing desired image width.
    * height (optional) – An integer representing desired image height.
    * method (optional) – resizing method, recognized values are 'crop' and any other for 'scale', including undefined.

resized() can handle only height or only width options alone, producing result as follows
* width given, height given, method not given or not equal to 'crop' – Scale the image proportionally to fit into width x height pixels.
* width given, height not given or zero, method not given or not equal to 'crop' – Scale the image proportionally to given width, height being computed automatically.
* width not given or zero, height given, method not given or not equal to 'crop' – Scale the image proportionally to given height, width being computed automatically.
* width given, height given, method equals to 'crop' – Scale the image proportionally and crop to make it width x height pixels exactly.
* width given, height not given or zero, method equals to 'crop' – Crop the image width to given, leaving initial height.
* width not given or zero, height given, method equals to 'crop' – Crop the image height to given, leaving initial width.

__Example__

```js
// Open a 100x50 pixels image
gd.createFrom('100x50.png', function (err, image) {
    try{
        // Scale to fit 50x50, gets image of 50x25
        var resized = image.resized({width: 50, height: 50})

        // Scale to fit 50 by width, gets image of 50x25
        var resized = image.resized({width: 50})

        // Scale to fit 30 by height, gets image of 60x30
        var resized = image.resized({height: 30})

        // Crop to 50x50
        var resized = image.resized({width: 50, height: 50, method: 'crop'})
    } catch (err) {
        console.log('Error: ' + err)
    }
})
```

<a name="resizedPtr" />
### gd.Image.resizedPtr(options)
Get a _Buffer_ with binary data of resized copy of the image. Equals to image.resized(options).ptr(options). Throws on error.

__Arguments__

* options – An objects representing resizedPtr() settings:
    * width (optional) – An integer representing desired image width.
    * height (optional) – An integer representing desired image height.
    * method (optional) – resizing method, recognized values are 'crop' and any other for 'scale', including undefined.
    * format (optional) – A string with target file format, 'jpeg', 'png' or 'gif' in any letter case.
    * jpegquality (optional, JPEG format only) – A number from 0 to 100, controlling generated JPEG quality.
    * pnglevel  (optional, PNG fornat only) – A number from 0 to 9, controlling generated PNG compression level.
    * defaultFormat (optional) – same as _format_, but is used only if no _format_ option provided and the image.format is undefined.

resizedPtr() can handle only height or only width options alone, producing result as follows
* width given, height given, method not given or not equal to 'crop' – Scale the image proportionally to fit into width x height pixels.
* width given, height not given or zero, method not given or not equal to 'crop' – Scale the image proportionally to given width, height being computed automatically.
* width not given or zero, height given, method not given or not equal to 'crop' – Scale the image proportionally to given height, width being computed automatically.
* width given, height given, method equals to 'crop' – Scale the image proportionally and crop to make it width x height pixels exactly.
* width given, height not given or zero, method equals to 'crop' – Crop the image width to given, leaving initial height.
* width not given or zero, height given, method equals to 'crop' – Crop the image height to given, leaving initial width.

__Example__

```js
gd.createFrom('theimage.png', function (err, image) {
    try {
        var buffer = image.resizedPtr({format: 'jpeg', jpegquality: 80, width: 800, height:600})
    } catch (err) {
        return console.log('Error: ' + err)
    }
    // Output the image from buffer
})
```

<a name="watermark" />
### gd.Image.watermark(watermark, position)
Put a watermark on the image. Modifies the image and returns it. Capable of automatic selection of the most conrast place to put a watermark at.

__Arguments__

* watermark – A gd.Image representing a watermark.
* position – An object representing watermark positon or an array of such objects. Position is defined by two properties, x and y, being floating point numbers from 0 to 1. {x: 0, y:0 } is the left top corner of the image, {x: 1, y: 1} is the right bottom. If an array of positions given, watermark() examines brightness of the watermark and the image and selects position with the biggest brightness difference.

__Example__

```js
// Open or create an image and the watermark

// Put the watermark at the bottom right corner
image.watermark(watermark, {x:1, y:1})

// Put the watermark at the center
image.watermark(watermark, {x:0.5, y:0.5})

// Put the watermark at one of the corners of the image where the watermark will be the most contrast
image.watermark(watermark, [{x:0, y:0}, {x:0, y:1}, {x:1, y:1}, {x:1, y:0}])

```

## Authors

* [Alexander Schepanovski](https://github.com/Suor)
* [Egor Balyshev](https://github.com/furagu)

## License

Copyright (C) 2013 Alexander Schepanovski, Egor Balyshev

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
