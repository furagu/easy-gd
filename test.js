var gd = require('./index.js')

gd.createTrueColor(100, 100).saveJpeg('test.jpg')

gd.createFrom('test.jpg', function (err, image) {
    console.log(err, image.width, image.height)
})
