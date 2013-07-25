# easy-gd

Original [node-gd](https://github.com/mikesmullin/node-gd) extended with a number of handy functions one would use an image manipulation library for:
* open images of any supported format
* resize or crop images doing no boring math
* put watermarks

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

### Watermarking
* [gd.Image.watermark](#watermark)

## Reading

<a name="createFrom" />
### gd.createFrom(filename, callback)
Open image file with GD library, auto-detecting image format (only GIF, JPEG and PNG are supported). Automatically rotates image if EXIF Orientation tag presets (mirrored images are not supported, rotated only).

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
Open a buffer with GD library, auto-detecting image format (only GIF, JPEG and PNG are supported). Automatically rotates image if EXIF Orientation tag presets (mirrored images are not supported, rotated only).

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

* buffer – A _buffer_ with an image to parse the format of.

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
    * format – A string with target file format, 'jpeg', 'png' or 'gif' in any letter case.
    * jpegquality (JPEG format only) – A number from 0 to 100, controlling generated JPEG quality.
    * pnglevel (PNG fornat only) – A number from 0 to 9, controlling generated PNG compression level.
    * defaultFormat – same as _format_, but is used only if no _format_ option provided and the image.format is undefined.
* callback(err) – A callback which is called when the image is saved or error occured.


```js
// Convert the image to lossy, but lighter format
gd.createFrom('theimage.png', function (err, image) {
    image.save('theimage.{ext}', {format: 'jpeg', jpegquality: 80}, function (err) {
        console.log(err || 'Success!')
    })
})

```


__TO BE CONTINUED__
