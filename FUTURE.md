# The Future Interface of Easy-gd Library

Node-gd 0.0.7 has miserable C-style interface that should be fixed.<br/>
Here is what's on the way to easy-gd 1.0.0:

### A single method to open image sources of any kind [a]synchronously
```js
gd.open('file.jpg', function (err, image) {})
gd.open(stream, function (err, image) {})
gd.open(buffer, function (err, image) {})

var image = gd.open('file.jpg')
var image = gd.open(buffer)
```

### Image properties and methods have clean names

```js
image.exif.GPSLatitude
image.autoOrient()
image.resize({width:500})
image.watermark('awsum_logo.png')
```

### A single method to save images [a]synchronously

```js
image.save('file.jpg', function (err) {})
image.save(stream, function (err) {})
image.save(function (err, buffer) {})

var buffer = image.save()
image.save('resized.jpg')
```

### Chaining is nice for synchronous processing

```js
gd.open('kitten.jpg')
  .resize({width: 1000, height: 1000})
  .watermark('awsum_logo.png')
  .save('kitten-large.jpg')
```

### Pipes are nice for asynchronous processing

```js
fs.createReadStream('puppy.jpg')
  .pipe(gd.resize({width: 1000, height: 1000}).watermark('awsum_logo.png'))
  .pipe(fs.createWriteStream('puppy-large.jpg');
```

### Errors are determined by class

```js
try {
	gd.open('kitten.corrupted.jpg')
	  .resize({width: 100})
	  .save('kitten.thumb.jpg')
} catch (e) {
	if (e instanceof gd.IncompleteImageError) {
		console.log('Corrupted file')
	}
	if (e instanceof gd.Error) {
		console.log('Some other image reading error')
	}
	throw e
}
```
