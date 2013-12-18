# Future interfaces of easy-gd library

Node-gd has a miserable C-style interface which should be fixed.

## Open an image synchronously

```js
var image = gd.open(buffer)
var image = gd.open(filename)
```

gd.open('kitten.jpg').resize({width: 100, height: 100}).save('{name}-thumb.{ext}')
