describe('ng.cork.models', function () {
    'use strict';

    beforeEach(module('ng.cork.models.factory'));

    describe('corkModelFactory', function () {

        describe('generate factory', function () {

            it('should throw an error if argument is not an object.', inject(function (corkModelFactory)  {

                expect(function () {
                    corkModelFactory('foo', false);
                }).toThrow(new Error('Invalid options for model "foo".'));
            }));

            it('should throw an error if "$constructor" is not provided.', inject(function (corkModelFactory)  {

                var options = {};

                expect(function () {
                    corkModelFactory('foo', options);
                }).toThrow(new Error('Invalid "constructor" in options for model "foo".'));
            }));

            it('should throw an error if "$constructor" is not string or function.', inject(function (corkModelFactory)  {

                var options = {
                    $constructor: []
                };

                expect(function () {
                    corkModelFactory('foo', options);
                }).toThrow(new Error('Invalid "constructor" in options for model "foo".'));
            }));

            it('should store the provided "name" and "$constructor" and initialize the "service" and "methods" properties.', inject(function (corkModelFactory)  {

                var options = {
                    $constructor: function () {}
                };

                var factory = corkModelFactory('foo', options);

                expect(typeof factory).toBe('function');
                expect(factory.model.name).toBe('foo');
                expect(factory.model.$constructor).toBe(options.$constructor);
                expect(factory.model.service).toBe(null);
                expect(typeof factory.model.methods).toBe('object');
                expect(factory.model.methods.length).toBe(0);
            }));

            describe('and options contains a "methods" property', function () {

                it('should throw an error if "methods" is not an array.', inject(function (corkModelFactory)  {

                    var options = {
                        $constructor: 'Foo',
                        methods: 'bar'
                    };

                    expect(function () {
                        corkModelFactory('foo', options);
                    }).toThrow(new Error('Invalid "methods" in options for model "foo".'));
                }));

                it('should throw an error if "methods" contains elements that are neither strings or objects or functions.', inject(function (corkModelFactory)  {

                    var options = {
                        $constructor: 'Foo',
                        methods: [false]
                    };

                    expect(function () {
                        corkModelFactory('foo', options);
                    }).toThrow(new Error('Invalid options for method of model "foo".'));
                }));

                describe('and "methods" contains a string element', function () {

                    it('should store the method "name", "service" and "method" properties.', inject(function (corkModelFactory)  {

                        var options = {
                            $constructor: 'Foo',
                            methods: ['bar'],
                            service: 'baz'
                        };

                        var factory = corkModelFactory('foo', options);

                        expect(factory.model.methods.length).toBe(1);
                        expect(factory.model.methods[0].name).toBe('bar');
                        expect(factory.model.methods[0].method).toBe('bar');
                        expect(factory.model.methods[0].service).toBe('baz');
                        expect(factory.model.methods[0].xyz).toBe(null);
                    }));
                });

                describe('and "methods" contains an object element', function () {

                    it('should throw an error if method does not contain a "name" property.', inject(function (corkModelFactory)  {

                        var options = {
                            $constructor: 'Foo',
                            methods: [{
                                bar: 'qux'
                            }],
                            service: 'baz'
                        };

                        expect(function () {
                            corkModelFactory('foo', options);
                        }).toThrow(new Error('Invalid "name" in options for method "undefined" of model "foo".'));
                    }));

                    it('should throw an error if method does not contain a "name" property.', inject(function (corkModelFactory)  {

                        var options = {
                            $constructor: 'Foo',
                            methods: [{}],
                            service: 'baz'
                        };

                        expect(function () {
                            corkModelFactory('foo', options);
                        }).toThrow(new Error('Invalid "name" in options for method "undefined" of model "foo".'));
                    }));

                    it('should throw an error if method contains a "name" property that is not a string.', inject(function (corkModelFactory)  {

                        var options = {
                            $constructor: 'Foo',
                            methods: [{
                                name: false
                            }],
                            service: 'baz'
                        };

                        expect(function () {
                            corkModelFactory('foo', options);
                        }).toThrow(new Error('Invalid "name" in options for method "undefined" of model "foo".'));
                    }));

                    it('should throw an error if method contains a "name" property that is an empty string.', inject(function (corkModelFactory)  {

                        var options = {
                            $constructor: 'Foo',
                            methods: [{
                                name: ''
                            }],
                            service: 'baz'
                        };

                        expect(function () {
                            corkModelFactory('foo', options);
                        }).toThrow(new Error('Invalid "name" in options for method "undefined" of model "foo".'));
                    }));

                    it('should throw an error if method contains a "method" property that is neither a string or a function.', inject(function (corkModelFactory)  {

                        var options = {
                            $constructor: 'Foo',
                            methods: [{
                                name: 'bar',
                                method: false
                            }],
                            service: 'baz'
                        };

                        expect(function () {
                            corkModelFactory('foo', options);
                        }).toThrow(new Error('Invalid "method" in options for method "bar" of model "foo".'));
                    }));

                    it('should throw an error if both the method and the model do not contain a "service" property.', inject(function (corkModelFactory)  {

                        var options = {
                            $constructor: 'Foo',
                            methods: [{
                                name: 'bar'
                            }]
                        };

                        expect(function () {
                            corkModelFactory('foo', options);
                        }).toThrow(new Error('Invalid "service" in options for method "bar" of model "foo".'));
                    }));

                    it('should store the method`s "name" and "method" properties and take the "service" property from the model.', inject(function (corkModelFactory)  {

                        var options = {
                            $constructor: 'Foo',
                            methods: [{
                                name: 'bar'
                            }],
                            service: 'baz'
                        };

                        var factory = corkModelFactory('foo', options);

                        expect(factory.model.methods.length).toBe(1);
                        expect(factory.model.methods[0].name).toBe('bar');
                        expect(factory.model.methods[0].service).toBe('baz');
                        expect(factory.model.methods[0].method).toBe('bar');
                        expect(factory.model.methods[0].xyz).toBe(null);
                    }));

                    it('should store the method "name" and "service" properties and ignore the "service" property from the model.', inject(function (corkModelFactory)  {

                        var options = {
                            $constructor: 'Foo',
                            methods: [{
                                name: 'bar',
                                service: 'qux'
                            }],
                            service: 'baz'
                        };

                        var factory = corkModelFactory('foo', options);

                        expect(factory.model.methods.length).toBe(1);
                        expect(factory.model.methods[0].name).toBe('bar');
                        expect(factory.model.methods[0].service).toBe('qux');
                        expect(factory.model.methods[0].method).toBe('bar');
                        expect(factory.model.methods[0].xyz).toBe(null);
                    }));

                    it('should store the method "name", "service", "method" and "xyz" properties.', inject(function (corkModelFactory)  {

                        var options = {
                            $constructor: 'Foo',
                            methods: [{
                                name: 'bar',
                                service: 'baz',
                                method: 'qux',
                                xyz: 'quux'
                            }]
                        };

                        var factory = corkModelFactory('foo', options);

                        expect(factory.model.methods.length).toBe(1);
                        expect(factory.model.methods[0].name).toBe('bar');
                        expect(factory.model.methods[0].service).toBe('baz');
                        expect(factory.model.methods[0].method).toBe('qux');
                        expect(factory.model.methods[0].xyz).toBe('quux');
                    }));
                });
            });
        });
    });

    describe('invoke factories', function () {

        describe('generated from $constructor', function () {

            var factory;
            var MockFoo;
            var options = {
                $constructor: 'Foo'
            };
            beforeEach(module(function ($provide) {
                MockFoo = function (data) {
                    this.data = data;
                };
                $provide.value('Foo', MockFoo);
            }));
            beforeEach(inject(function (corkModelFactory) {
                factory = corkModelFactory('foo', options);
            }));

            it('should invoke the injector and set the "constructor" to the actual constructor.', function ()  {

                expect(factory.model.$constructor).toBe('Foo');

                var instance = factory();

                expect(factory.model.$constructor).toBe(MockFoo);
            });

            it('should return instances of the configured constructor.', function ()  {

                var instance1 = factory();

                expect(instance1 instanceof MockFoo).toBe(true);

                // forces the code coverage of else path
                // and makes sure this you get a new instance for every call
                var instance2 = factory();
                expect(instance1).not.toBe(instance2);
            });

            it('should pass instantination data to the constructor.', function ()  {

                var data = {};

                var instance = factory(data);

                expect(instance.data).toBe(data);
            });
        });

        describe('with function methods to attach', function () {

            var factory;
            var MockFoo;
            var options = {
                $constructor: 'Foo',
                methods: [{
                    name: 'bar',
                    method: function () {
                        return this.baz;
                    }
                }]
            };
            beforeEach(module(function ($provide) {
                MockFoo = function (data) {
                    this.data = data;
                };
                $provide.value('Foo', MockFoo);
            }));
            beforeEach(inject(function (corkModelFactory) {
                factory = corkModelFactory('foo', options);
            }));

            it('should attach the provided function to the instance.', function ()  {

                var instance = factory();

                expect(typeof instance.bar).toBe('function');
            });

            it('should bind the function to the instance.', function ()  {

                var instance = factory();
                instance.baz = 'qux';

                expect(instance.bar()).toBe(instance.baz);
            });
        });

        describe('and a known model with a service method is requested and $new is invoked', function () {

            var $inj;
            var factory;
            var MockFoo;
            var options = {
                $constructor: 'Foo',
                methods: [{
                    name: 'bar',
                    service: 'baz',
                    method: 'qux'
                }]
            };
            var mockService;
            beforeEach(module(function ($provide) {
                MockFoo = function (data) {
                    this.data = data;
                };
                $provide.value('Foo', MockFoo);
            }));
            beforeEach(module(function ($provide) {
                // mock the service
                mockService = {
                    qux: jasmine.createSpy('qux')
                };
                $provide.value('baz', mockService);
            }));
            beforeEach(inject(function (corkModelFactory, $injector) {
                factory = corkModelFactory('foo', options);
                // spy on the injector
                spyOn($injector, 'get').and.callThrough();
                $inj = $injector;
                // mock the service method response
                mockService.qux.and.returnValue(123);
            }));

            it('should resolve the service from "string" to actual instance.', function ()  {

                var instance = factory();

                expect($inj.get).toHaveBeenCalledWith('baz');
            });

            it('should update the method definition with the resolved service and not resolve again.', function ()  {

                var instance1 = factory();

                expect(factory.model.methods[0].service).toBe(mockService);

                // cache number of calls to $injector
                var countInjectorCalls = $inj.get.calls.count();

                var instance2 = factory();

                expect($inj.get.calls.count()).toBe(countInjectorCalls);
            });

            it('should attach a method to the instance.', function ()  {

                var instance = factory();

                expect(typeof instance.bar).toBe('function');
            });

            describe('invoking the attached method', function () {

                it('should invoke the service method with the instance.', function ()  {

                    var instance = factory();

                    instance.bar();

                    expect(mockService.qux).toHaveBeenCalledWith(instance);
                });

                it('should invoke the service method with the remaining params.', function ()  {

                    var instance = factory();

                    instance.bar(42, 99);

                    expect(mockService.qux).toHaveBeenCalledWith(instance, 42, 99);
                });

                it('should return the service method`s return value.', function ()  {

                    var instance = factory();

                    var res = instance.bar();

                    expect(res).toBe(123);
                });
            });
        });

        describe('with a service method that returns a promise but has no xyz to apply', function () {

            var factory;
            var MockFoo;
            var options = {
                $constructor: 'Foo',
                methods: [{
                    name: 'bar',
                    service: 'baz',
                    method: 'qux'
                }]
            };
            var mockPromise;
            var mockService;
            beforeEach(module(function ($provide) {
                MockFoo = function (data) {
                    this.data = data;
                };
                $provide.value('Foo', MockFoo);
            }));
            beforeEach(module(function ($provide) {
                // mock the service
                mockService = {
                    qux: jasmine.createSpy('qux')
                };
                $provide.value('baz', mockService);
            }));
            beforeEach(inject(function (corkModelFactory) {
                factory = corkModelFactory('foo', options);
                // mock the service method response
                mockPromise = jasmine.createSpyObj('promise', ['then']);
                mockService.qux.and.returnValue(mockPromise);
            }));

            describe('invoking the attached method', function () {

                it('should return the service method`s promise.', function ()  {

                    var instance = factory();

                    var res = instance.bar();

                    expect(res).toBe(mockPromise);
                });

                it('should NOT bind the promise.', function ()  {

                    var instance = factory();

                    instance.bar();

                    expect(mockPromise.then).not.toHaveBeenCalled();
                });
            });
        });

        describe('with a service method that returns a promise and applies an xyz to the model', function () {

            var factory;
            var MockFoo;
            var options = {
                $constructor: 'Foo',
                methods: [{
                    name: 'bar',
                    service: 'baz',
                    method: 'qux',
                    xyz: 'quux'
                }]
            };
            var mockDefer;
            var mockPromise;
            var mockService;
            beforeEach(module(function ($provide) {
                MockFoo = function (data) {
                    this.data = data;
                    this.quux = jasmine.createSpy('quux');
                };
                $provide.value('Foo', MockFoo);
            }));
            beforeEach(module(function ($provide) {
                // mock the service
                mockService = {
                    qux: jasmine.createSpy('qux')
                };
                $provide.value('baz', mockService);
            }));
            beforeEach(inject(function (corkModelFactory, $q) {
                factory = corkModelFactory('foo', options);
                // mock the service method response (promise)
                mockDefer = $q.defer();
                mockPromise = mockDefer.promise;
                mockService.qux.and.returnValue(mockPromise);
            }));

            describe('invoking the attached method and resolving the service promise', function () {

                it('should bind the promise and apply the xyz to the model.', inject(function ($rootScope)  {

                    var instance = factory();

                    instance.bar();

                    var res = {
                        foo: 'bar'
                    };

                    mockDefer.resolve(res);
                    $rootScope.$apply();

                    expect(instance.quux).toHaveBeenCalledWith(res);
                }));

                it('should resolve with the service return value.', inject(function ($rootScope)  {

                    var instance = factory();

                    var resolveSpy = jasmine.createSpy('resolveSpy');

                    var promise = instance.bar();
                    promise.then(resolveSpy);

                    var res = {
                        foo: 'bar'
                    };

                    mockDefer.resolve(res);
                    $rootScope.$apply();

                    expect(resolveSpy).toHaveBeenCalledWith(res);
                }));
            });
        });
    });
});
