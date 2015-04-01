(function (angular) {
    'use strict';

    var module = angular.module('ng.cork.model.factory', ['ng.cork.util']);

    var copy = angular.copy;

    var isString = angular.isString;
    var isFunction = angular.isFunction;
    var isObject = angular.isObject;

    /**
     * @ngdoc service
     * @name ng.cork.model.factory.corkModelFactory
     *
     * @description
     * Provides a way to generates model factories from an options object.
     *
     * Generated factories can:
     * - create instances from a provided factory function or an injectable Constructor.
     * - decorate instances with ad-hoc functions or methods of one or more injectable services.
     *
     * # Model Options
     *
     * Object need to contain at least a `$new` or `$constructor` property.
     *
     * ```
     * {$constructor: 'MyUser'}
     * {$new: function (data) { return new MyUser(data); }}
     * ```
     *
     * > **options.$constructor** *function|string*
     *
     * If provided, factory will create instances via `instance = new $constructor(data)`.
     *
     * Provide a `function` to be used as constructor
     *
     * ```
     * var options = {
     *   $constructor: function MyUser() {}
     * }
     * ```
     *
     * Or a `string` that resolves to a function via AngularJS injection.
     *
     * ```
     * var options = {
     *   $constructor: 'MyUser'
     * }
     * ```
     *
     * > **options.$new** *function*
     *
     * If provided, `$constructor` is ignored and factor wil create instances via `instance = $new(data)`.
     *
     * Provide a `function` that returns new instances of the model.
     *
     * ```
     * var options = {
     *   $new: function (data) {
     *     return new MyUser(data);
     *   }
     * }
     * ```
     *
     * > **options.service** *object|string*
     *
     * If provided, all methods will be invoked on this service, except methods provided as `Function () {}` or methods that reference a service.
     *
     * Provide an `object` with the service instance or a `string` that resolves to a service via AngularJS injection.
     *
     * > **options.methods** *object*
     *
     * Provide an `object` map of methods to attach to the instances.
     *
     * ```
     * var options = {
     *   $constructor: 'MyUser',
     *   methods: {
     *      load: 'get',
     *      save: ...
     *   }
     * }
     * ```
     *
     * For each method the key will become the `methodName` attached to the model instances.
     *
     * ```
     * var factory = corkModelFactory('user', options); // function $new(data) {}
     * ```
     *
     * > **options.methods[methodName]** *null|string|function|object*
     *
     * If the value is `null`, the method in the provided `model.service` will be invoked by the same name.
     *
     *     // options.methods.foo = null;
     *     instance.foo(1, 2) => service.foo(instance, 1, 2)
     *
     * If method is a `string`, the method in the provided `options.service` will be invoked by this other name.
     *
     *     // options.methods.foo = bar;
     *     instance.foo(1, 2) => service.bar(instance, 1, 2)
     *
     * If method is a `fnction`, the method in the provided `options.service` will be invoked by this other name.
     *
     *     // options.methods.foo = function () {};
     *     instance.foo(1, 2) => fn(instance, 1, 2)
     *
     * If method is provided as an `object` it can have the following properties:
     *
     * **options.methods[methodName].method** *function|string*
     *
     * If provided with a `string`, it becomes the `targetName` and, as above:
     *
     *     // options.methods.foo = { method: 'bar' };
     *     instance.foo(1, 2) => service.bar(instance, 1, 2)
     *
     * If provided with a `function`, as above, its value is directly invoked:
     *
     *     // options.methods.foo = { method: function () {} };
     *     instance.foo(1, 2) => fn(instance, 1, 2)
     *
     * **options.methods[methodName].service** *object|string*
     *
     * Overrides the service for this method only, will result in:
     *
     *     // options.methods.foo = { service: 'otherService' };
     *     instance.foo(1, 2) => otherService.foo(instance, 1, 2)
     *
     * **options.methods[methodName].andThen** *function|string*
     *
     * If provided with a `function`, when service method is successful, that function is invoked with both the instance
     * and the service result.
     *
     *     // options.methods.foo = { andThen: function () {} };
     *     instance.foo(1, 2) => service.foo(instance, 1, 2) => andThenFn(instance, result)
     *
     * If provided with a `string`, when service method is successful, a method with that name is invoked in the instance
     * and provided with the service result.
     *
     *     // options.methods.foo = { andThen: '$replace' };
     *     instance.foo(1, 2) => service.foo(instance, 1, 2) => instance.$replace(result)
     *
     *
     * # Example:
     *
     * ```
     * var options = {
     *   $constructor: 'MyUser',
     *   service: 'myUserService',
     *   methods: {
     *     delete: null,
     *     load: 'get',
     *     save: function (instance) {
     *       if (instance.id) {
     *         return $http.post(instance).then(function (data) {
     *           return instance.$replace(data);
     *         });
     *       } else {
     *         return $http.put(instance).then(function (data) {
     *           return instance.$replace(data);
     *         });
     *       }
     *     },
     *     settings: {
     *       service: 'mySettingsService',
     *       method: 'get',
     *       xyz: function () {
     *
     *       }
     *     },
     *   },
     * };
     * var userFactory = corkModeluserFactory('user', options); // function $new(data) {}
     * ```
     *
     * You can now create instances of the user model.
     *
     * ```
     * // MyUser
     * var user = factory({id: 1, name: 'joe'});
     * // 1
     * user.id;
     * // joe
     * user.name;
     * ```
     *
     * And invoke the mdoel methods.
     *
     * ```
     * // myUserService.delete(instance);
     * user.delete().then(...)
     *
     * // myUserService.get(instance);
     * user.load().then(...)
     *
     * // $http promise
     * user.save().then(...)
     *
     * // mySettingsService.get(instance);
     * user.settings().then(...)
     * ```
     *
     */
    module.service('corkModelFactory', [
        '$injector',
        'corkUtil',
        function corkModelFactory($injector, corkUtil) {

            var isObjectObject = corkUtil.isObjectObject;
            var isPromise = corkUtil.isPromise;

            // -- private

            function normalizeModel(name, model) {

                var hasConstructor;
                var hasNew;
                var isValidConstructor;
                var isValidNew;

                if (!isObjectObject(model)) {
                    throw new Error('Invalid options for model "' + name + '".');
                } else {
                    model = copy(model);
                    model.name = name;

                    hasConstructor = model.hasOwnProperty('$constructor');
                    hasNew = model.hasOwnProperty('$new');
                    isValidConstructor = hasConstructor && (isString(model.$constructor) || isFunction(model.$constructor));
                    isValidNew = hasNew && isFunction(model.$new);
                    if (hasConstructor && !isValidConstructor || hasNew && !isValidNew || !hasNew && !hasConstructor) {
                        throw new Error('Invalid "$constructor" or "$new" in options for model "' + name + '".');
                    }
                }
                model.service = model.service || null;
                model.methods = model.methods || {};
                if (!isObjectObject(model.methods)) {
                    throw new Error('Invalid "methods" in options for model "' + name + '".');
                }
                return model;
            }

            function normalizeModelMethods(model) {
                var methods = model.methods;
                var method;
                var key;
                for (key in methods) {
                    method = methods[key];
                    if (method === null || isString(method) || isFunction(method)) {
                        method = methods[key] = {
                            method: method
                        };
                    } else if (!isObject(method)) {
                        throw new Error('Invalid options for method of model "' + model.name + '".');
                    }
                    method.name = key;
                    if (!isString(method.name) || !method.name.length) {
                        throw new Error('Invalid method name in options of model "' + model.name + '".');
                    }
                    if (method.hasOwnProperty('method') && method.method !== null && !isFunction(method.method) && !isString(method.method)) {
                        throw new Error('Invalid "method" in options for method "' + method.name + '" of model "' + model.name + '".');
                    }
                    if (!isFunction(method.method)) {
                        method.service = method.service || model.service;
                        method.method = method.method || method.name;
                        method.andThen = method.andThen || model.andThen || null;
                        if (!method.service || !isObjectObject(method.service) && !isString(method.service)) {
                            throw new Error('Invalid "service" in options for method "' + method.name + '" of model "' + model.name + '".');
                        }
                    }
                }
            }

            function makeModelFactory($injector, model) {
                var factory;
                if (model.$new) {
                    factory = function $new(data) {
                        var instance = model.$new(data);
                        attachModelMethods($injector, model, instance);
                        return instance;
                    };
                } else {
                    factory = function (data) {
                        if (isString(model.$constructor)) {
                            model.$constructor = $injector.get(model.$constructor);
                        }
                        var Constructor = model.$constructor;
                        var instance = new Constructor(data);
                        attachModelMethods($injector, model, instance);
                        return instance;
                    };
                }
                factory.model = model;
                return factory;
            }

            function attachModelMethods($injector, model, instance) {
                var methods = model.methods;
                var method;
                var key;
                var boundFn;
                for (key in methods) {
                    method = methods[key];
                    if (isFunction(method.method)) {
                        boundFn = angular.bind(instance, method.method);
                    } else {
                        boundFn = makeModelMethodFromServiceMethod($injector, instance, method);
                    }
                    Object.defineProperty(instance, method.name, {
                        enumerable: false,
                        configurable: false,
                        value: boundFn
                    });
                }
            }

            function makeModelMethodFromServiceMethod($injector, instance, method) {
                if (isString(method.service)) {
                    method.service = $injector.get(method.service);
                }
                return function modelMethod() {
                    var args = [].slice.call(arguments);
                    args.unshift(instance);
                    var promise = method.service[method.method].apply(method.service, args);
                    if (isPromise(promise) && method.andThen) {
                        promise.then(function xyz(res) {
                            instance[method.andThen](res);
                            return res;
                        });
                    }
                    return promise;
                };
            }

            return {

                /**
                 * @ngdoc function
                 * @name make
                 * @methodOf ng.cork.model.factory.corkModelFactory
                 *
                 * @description
                 * Returns a function that generates instances of a particular model.
                 *
                 * @param {string} name The model's name, ex: 'user'
                 * @param {object} model The model definition.
                 *
                 *      {
                 *          $constructor: <string|function>,
                 *          service: <object|string>,
                 *          methods: { ... }
                 *      }
                 */
                make: function make(name, model) {
                    model = normalizeModel(name, model);
                    normalizeModelMethods(model);
                    return makeModelFactory($injector, model);
                }
            };
        }
    ]);

})(angular);
