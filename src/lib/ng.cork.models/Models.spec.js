describe('ng.cork.models', function () {
    'use strict';

    beforeEach(module('ng.cork.models.models'));

    describe('CorkModels', function () {

        describe('model()', function () {

            describe('when an invalid model name is provided', function () {

                it('should throw an error.', inject(function (CorkModels)  {

                    var models = new CorkModels();

                    expect(function () {
                        models.model(null);
                    }).toThrow(new Error('Invalid model name.'));
                }));
            });

            describe('when a second argument is provided', function () {

                it('should return the models instance.', inject(function (CorkModels)  {

                    var models = new CorkModels();

                    expect(models.model('foo', 'Foo')).toBe(models);
                }));

                it('should throw an exception if the model was registered before.', inject(function (CorkModels)  {

                    var models = new CorkModels();

                    models.model('foo', 'Foo');

                    expect(function () {
                        models.model('foo', 'Foo');
                    }).toThrow(new Error('A factory for model "foo" is already registered.'));
                }));

                it('should throw an exception if argument is not an object.', inject(function (CorkModels)  {

                    var models = new CorkModels();

                    expect(function () {
                        models.model('foo', []);
                    }).toThrow(new Error('Invalid factory for model "foo".'));
                }));

                it('should throw an exception if argument is null.', inject(function (CorkModels)  {

                    var models = new CorkModels();

                    expect(function () {
                        models.model('foo', null);
                    }).toThrow(new Error('Invalid factory for model "foo".'));
                }));

                describe('and argument is a string', function () {

                    it('should store the "name", "$constructor" and "$new" properties.', inject(function (CorkModels)  {

                        var models = new CorkModels();
                        models.model('foo', 'Foo');

                        var model = models.model('foo');

                        expect(model.name).toBe('foo');
                        expect(model.$constructor).toBe('Foo');
                        expect(model.$factory).toBe(undefined);
                        expect(typeof model.$new).toBe('function');
                    }));
                });

                describe('and argument is a function', function () {

                    it('should store "name", "$factory" and "$new" properties.', inject(function (CorkModels)  {

                        var $newFoo = function $newFoo() {};

                        var models = new CorkModels();
                        models.model('foo', $newFoo);

                        var model = models.model('foo');

                        expect(model.name).toBe('foo');
                        expect(model.$constructor).toBe(undefined);
                        expect(model.$factory).toBe('$newFoo');
                        expect(typeof model.$new).toBe('function');
                        expect(model.$new).toBe($newFoo);
                    }));

                });
            });

            describe('when no options argument is provided', function () {

                describe('and an unknown model is requested', function () {

                    it('should throw an error.', inject(function (CorkModels)  {

                        var models = new CorkModels();

                        expect(function () {
                            models.model('foo');
                        }).toThrow(new Error('Unknown model "foo".'));
                    }));
                });

                describe('and a known model with a "factory" function is requested and $new is invoked', function () {

                    var models;
                    var MockFoo;
                    var factory;
                    var mockInstance = {};
                    beforeEach(inject(function (CorkModels) {
                        factory = jasmine.createSpy('factory');
                        factory.and.returnValue(mockInstance);
                        models = new CorkModels();
                        models.model('foo', factory);
                    }));

                    it('should invoke the "factory" function and return the instance.', function ()  {

                        var model = models.model('foo');

                        expect(model.$new).toBe(factory);

                        var instance = model.$new();

                        expect(instance).toBe(mockInstance);
                    });
                });
            });
        });
    });
});
