# easy-gd [![Build Status](https://travis-ci.org/furagu/easy-gd.png?branch=master)](https://travis-ci.org/furagu/easy-gd)

A Node.js wrapper around [GD image manipulation library](http://libgd.bitbucket.org) with extra features:

* A drop-in replacement for [node-gd](https://www.npmjs.org/package/node-gd). You can just ```require('easy-gd')``` instead of ```require('node-gd')``` and everything will be working as before.
* Image format autodetection: just ```gd.open(file)``` instead of choosing between ```gd.createFromJpeg(file)``` or  ```gd.createFromPng(file)``` or whatever.
* Handy [resizing](#TODO) and [watermarking](#TODO) shortcuts: ```gd.open('image.png').resize({width: 100, height:100}).save('small-image.png')```.
* Reads/writes [files](#TODO), [buffers](#TODO) and [streams](#TODO).
* [Synchronous](#TODO), [asynchronous](#TODO) and [stream](#TODO) interfaces.
* [Exif parsing](#TODO) and [automatic image orientation](#TODO) support.
