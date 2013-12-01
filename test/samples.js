var _ = require('underscore'),
    fs = require('fs'),
    types = ['jpeg', 'gif', 'png'],

    files = types.map(function (type) {return __dirname + '/samples/1x1.' + type}),
    buffers = files.map(function (file) {return fs.readFileSync(file)}),

    orientations = [3, 6, 9],
    exifFiles = orientations.map(function (orientation) {return __dirname + '/samples/exif-orientation-' + orientation + '.jpg'}),
    exifBuffers = exifFiles.map(function (file) {return fs.readFileSync(file)}),

    incompleteFiles = types.map(function (type) {return __dirname + '/samples/incomplete.' + type})

module.exports = {
    types: types,
    filesByType: _.object(types, files),
    buffersByType: _.object(types, buffers),

    filesByExifOrientation: _.object(orientations, exifFiles),
    buffersByExifOrientation: _.object(orientations, exifBuffers),

    notExistingFile: __dirname + '/samples/none.jpg',
    emptyFile:       __dirname + '/samples/empty.jpg',
    nonImageFile:    __dirname + '/samples/non-image.txt',

    incompleteFilesByType:  _.object(types, incompleteFiles),
}
