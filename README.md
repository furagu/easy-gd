# easy-gd

Original [node-gd](https://github.com/mikesmullin/node-gd) extended with a number of handy functions one would use an image manipulation library for:
* open images of any supported format
* resize or crop images doing no boring math
* put watermarks

# Usage
```javascript
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
