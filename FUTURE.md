# Future interface of easy-gd library

Node-gd has miserable C-style interface which should be fixed.

## Open any source containing an image [a]synchronously

```js
gd.open('file.jpg', function (err, image) {})
gd.open(stream, function (err, image) {})
gd.open(buffer, function (err, image) {})

var image = gd.open('file.jpg')
var image = gd.open(buffer)
```

## Image properties and methods

```js
image.exif.GPSLatitude
image.autoOrient()
image.resize({width:500})
image.watermark('awsum_logo.png')
```

## Save [a]synchronously

```js
image.save('file.jpg', function (err) {})
image.save(stream, function (err) {})
image.save(function (err, buffer) {})

var buffer = image.save()
image.save('resized.jpg')
```

## Chain synchronous processing

```js
gd.open('kitten.jpg')
  .resize({width: 1000, height: 1000})
  .watermark('awsum_logo.png')
  .save('kitten-large.jpg')
```

## Pipe asynchronous processing

```js
fs.createReadStream('puppy.jpg')
  .pipe(gd.resize({width: 1000, height: 1000}).watermark('awsum_logo.png'))
  .pipe(fs.createWriteStream('puppy-large.jpg');
```
