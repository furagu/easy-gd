var should = require('should'),
    _ = require('underscore'),
    gd = require('../index.js'),
    errors = require('../lib/errors.js')

describe('gd', function () {
    _.each(errors.classes, function (errorConstructor, errorName) {
        describe(errorName + '()', function () {
            it('should be defined as a library top-level property', function () {
                gd.should.have.property(errorName)
            })
            it('should create instances of Error', function () {
                ;(new errorConstructor()).should.be.instanceof(Error)
            })
            it('should create instances of gd.Error', function () {
                ;(new errorConstructor()).should.be.instanceof(gd.Error)
            })
            it('should return an instance when called directly with no new keyword', function () {
                errorConstructor().should.be.instanceof(errorConstructor)
            })
            it('should have a stack trace', function () {
                errorConstructor().should.have.property('stack')
            })
            if (errorName !== 'Error') {
                it('should have default message', function () {
                    errorConstructor().should.have.property('message')
                    errorConstructor().message.should.be.ok
                })
            }
            it('should store a message passed to constructor', function () {
                errorConstructor('hey').should.have.property('message', 'hey')
            })
        })
    })
})
