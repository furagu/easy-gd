// Easy-gd should hide oldschool GD nature

var gd = require('easy-gd')

gd.open(buffer)
gd.open(filename)
gd.open(stream)

gd.open('kitten.jpg').resize({width: 100, height: 100}).save('{name}-thumb.{ext}')
