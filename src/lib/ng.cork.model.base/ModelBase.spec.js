describe('ng.cork.model.base', function () {
    'use strict';

    beforeEach(module('ng.cork.model.base'));

    describe('CorkModelBase', function () {

        describe('constructor', function () {

            it('should return an instance populated with the provided data.', inject(function (CorkModelBase) {

                var data = {
                    id: 42,
                    foo: 'bar'
                };

                var instance = new CorkModelBase(data);

                expect(instance.id).toBe(42);
                expect(instance.foo).toBe('bar');
            }));

            it('should deep copy the provided data to populate the instance.', inject(function (CorkModelBase) {

                var data = {
                    id: 42,
                    foo: {
                        bar: 'baz'
                    },
                    qux: [
                        'quux'
                    ]
                };

                var instance = new CorkModelBase(data);

                expect(instance.id).toBe(42);
                expect(angular.isObject(instance.foo)).toBeTruthy();
                expect(instance.foo.bar).toBe('baz');
                expect(angular.isArray(instance.qux)).toBeTruthy();
                expect(instance.qux).toEqual(['quux']);
            }));

            it('functions should NOT be enumerable.', inject(function (CorkModelBase) {

                var data = {
                    id: 42
                };

                var instance = new CorkModelBase(data);
                var key;

                expect(instance.id).toBe(42);

                for (key in instance) {
                    delete instance[key];
                }

                expect(typeof instance.id).toBe('undefined');
                expect(typeof instance.$empty).toBe('function');
                expect(typeof instance.$replace).toBe('function');
                expect(typeof instance.$merge).toBe('function');
                expect(typeof instance.$decorate).toBe('function');
            }));

            it('modifying the provided data after instantiation should NOT affect the instance.', inject(function (CorkModelBase) {

                var data = {
                    id: 42,
                    foo: 'bar',
                    baz: {
                        qux: 'quux' // makes sure it is a deep copy
                    }
                };

                var instance = new CorkModelBase(data);

                data.id++;
                data.foo = 'baz';
                data.baz.qux = 'corge';

                expect(instance.id).toBe(42);
                expect(instance.foo).toBe('bar');
                expect(instance.baz.qux).toBe('quux');
            }));

            describe('inherited constructor', function () {

                it('should extend/override the instance data with provided data.', inject(function (CorkModelBase) {

                    var data = {
                        id: 42,
                        foo: {
                            bar: 'baz'
                        }
                    };

                    var SubClass = function (data) {
                        this.foo = '';
                        CorkModelBase.call(this, data);
                    };
                    SubClass.prototype = Object.create(CorkModelBase.prototype);

                    var instance = new SubClass(data);

                    expect(instance.id).toBe(42);
                    expect(angular.isObject(instance.foo)).toBeTruthy();
                    expect(angular.isArray(instance.foo)).toBeFalsy();
                    expect(instance.foo.bar).toBe('baz');
                }));
            });
        });

        describe('$empty()', function () {

            it('should delete all properties.', inject(function (CorkModelBase)  {

                var data = {
                    foo: 'bar'
                };

                var instance = new CorkModelBase(data);
                instance.baz = 'qux';

                // sanity check
                expect(instance.foo).toBe('bar');
                expect(instance.baz).toBe('qux');

                instance.$empty();

                expect(typeof instance.foo).toBe('undefined');
                expect(typeof instance.baz).toBe('undefined');
            }));

            it('modifying the provided data after replacing should NOT affect the instance.', inject(function (CorkModelBase) {

                var data = {
                    id: 42,
                    foo: 'bar',
                    baz: {
                        qux: 'quux' // makes sure it is a deep copy
                    }
                };

                var instance = new CorkModelBase();
                instance.$replace(data);

                data.id++;
                data.foo = 'baz';
                data.baz = 'quux';

                expect(instance.id).toBe(42);
                expect(instance.foo).toBe('bar');
                expect(instance.baz.qux).toBe('quux');
            }));
        });

        describe('$replace()', function () {

            it('should replace the instance data with the provided properties.', inject(function (CorkModelBase)  {

                var data = {
                    foo: 'bar'
                };
                var replaceData = {
                    baz: 'qux'
                };

                var instance = new CorkModelBase(data);
                instance.$replace(replaceData);

                expect(typeof instance.foo).toBe('undefined');
                expect(instance.baz).toBe('qux');
            }));

            it('modifying the provided data after replacing should NOT affect the instance.', inject(function (CorkModelBase) {

                var data = {
                    id: 42,
                    foo: 'bar',
                    baz: {
                        qux: 'quux' // makes sure it is a deep copy
                    }
                };

                var instance = new CorkModelBase();
                instance.$replace(data);

                data.id++;
                data.foo = 'baz';
                data.baz = 'quux';

                expect(instance.id).toBe(42);
                expect(instance.foo).toBe('bar');
                expect(instance.baz.qux).toBe('quux');
            }));
        });

        describe('$merge()', function () {

            it('should merge the instance data with the provided properties.', inject(function (CorkModelBase)  {

                var data = {
                    foo: 'bar'
                };
                var mergeData = {
                    baz: 'qux'
                };

                var instance = new CorkModelBase(data);
                instance.$merge(mergeData);

                expect(instance.foo).toBe('bar');
                expect(instance.baz).toBe('qux');
            }));

            it('modifying the provided data after replacing should NOT affect the instance.', inject(function (CorkModelBase) {

                var mergeData = {
                    id: 42,
                    foo: 'bar',
                    baz: {
                        qux: 'quux' // makes sure it is a deep copy
                    }
                };

                var instance = new CorkModelBase();
                instance.$merge(mergeData);

                mergeData.id++;
                mergeData.foo = 'baz';
                mergeData.baz = 'quux';

                expect(instance.id).toBe(42);
                expect(instance.foo).toBe('bar');
                expect(instance.baz.qux).toBe('quux');
            }));
        });

        describe('$decorate()', function () {

            it('should be invoked on instantiation after populating data.', inject(function (CorkModelBase) {

                var decorateSpy = jasmine.createSpy('$decorate');
                var data = {};

                var SubClass = function (data) {
                    CorkModelBase.call(this, data);
                };
                SubClass.prototype = Object.create(CorkModelBase.prototype);
                Object.defineProperty(SubClass.prototype, '$decorate', {
                    value: decorateSpy
                });

                var instance = new SubClass(data);

                expect(decorateSpy).toHaveBeenCalled();
            }));

            it('should NOT be invoked on instantiation if no data provided for population.', inject(function (CorkModelBase) {

                var decorateSpy = jasmine.createSpy('$decorate');

                var SubClass = function () {
                    CorkModelBase.call(this);
                };
                SubClass.prototype = Object.create(CorkModelBase.prototype);
                Object.defineProperty(SubClass.prototype, '$decorate', {
                    value: decorateSpy
                });

                var instance = new SubClass({});

                expect(decorateSpy).not.toHaveBeenCalled();
            }));

            it('should be invoked after a call to "$replace()".', inject(function (CorkModelBase) {

                var decorateSpy = jasmine.createSpy('$decorate');

                var SubClass = function () {
                    CorkModelBase.call(this);
                };
                SubClass.prototype = Object.create(CorkModelBase.prototype);
                Object.defineProperty(SubClass.prototype, '$decorate', {
                    value: decorateSpy
                });

                var instance = new SubClass();
                instance.$replace();

                expect(decorateSpy).toHaveBeenCalled();
            }));

            it('should be invoked after a call to "$merge()".', inject(function (CorkModelBase) {

                var decorateSpy = jasmine.createSpy('$decorate');

                var SubClass = function () {
                    CorkModelBase.call(this);
                };
                SubClass.prototype = Object.create(CorkModelBase.prototype);
                Object.defineProperty(SubClass.prototype, '$decorate', {
                    value: decorateSpy
                });

                var instance = new SubClass();
                instance.$merge();

                expect(decorateSpy).toHaveBeenCalled();
            }));
        });
    });
});
