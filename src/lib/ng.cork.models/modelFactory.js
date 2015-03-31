(function (angular) {
    'use strict';

    var module = angular.module('ng.cork.models.factory', ['ng.cork.util']);

    var copy = angular.copy;

    var isString = angular.isString;
    var isFunction = angular.isFunction;
    var isObject = angular.isObject;

    /**
     * @ngdoc service
     * @name ng.cork.models.factory.corkModelFactory
     *
     * @description
     * Provides a way to generates model factories from definition object
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
                        method.xyz = method.xyz || model.xyz || null;
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
                    if (isPromise(promise) && method.xyz) {
                        promise.then(function xyz(res) {
                            instance[method.xyz](res);
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
                 * @methodOf ng.cork.models.factory.corkModelFactory
                 *
                 * @description
                 * Returns a function that generates instances of a particlar model.
                 *
                 * It is capable of taking a
                 *
                 *
                 * @param {string} name The model's name, ex: 'user'
                 * @param {object} model The model definition.
                 *
                 *      {
                 *          $constructor: <string|function>,
                 *          service: <object|string>,
                 *          methods: {
                 *              save: function () { },
                 *              load: <string>,
                 *              update: {
                 *                  service: <object|string>
                 *                  method: <string>,
                 *                  xyz: <string>,
                 *              },
                 *              delete: null
                 *          },
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
