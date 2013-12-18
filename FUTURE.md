# Future interfaces of easy-gd library

Node-gd has miserable C-style interface which should be fixed.

## Open any source containing an image

```js
gd.open('file.jpg', callback)

gd.open(stream, callback)

gd.open(buffer, callback)
```

## Synchronous open not to mess with async stuff

```js
var image = gd.open('file.jpg')

var image = gd.open(buffer)
```

## Image properties and methods

```js
image.exif.GPSLatitude

image.resize({width:500})

image.crop({width: 120, height: 120})

image.watermark('awsum_logo.png')

image.autoOrient()
```

## Saving [a]synchronously

```js
image.save('kitten-thumb.jpg', callback)

image.save(stream, callback)

image.save(buffer, callback)

var buffer = image.save()

image.save('resized.jpg')
```

## Synchronous chaining

```js
gd.open('kitten.jpg')
  .crop({width: 100, height: 100})
  .save('{name}-thumb.{ext}')
```


