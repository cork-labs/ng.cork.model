(function (angular) {
    'use strict';

    var module = angular.module('ng.cork.models.factory', []);

    var copy = angular.copy;

    var isString = angular.isString;
    var isFunction = angular.isFunction;
    var isObject = angular.isObject;
    var isArray = angular.isArray;

    function isObjectObject(value) {
        return value !== null && angular.isObject(value) && !angular.isArray(value);
    }

    function isPromise(value) {
        return value && isFunction(value.then);
    }

    // model related

    function normalizeModel(name, model) {

        if (!isObjectObject(model)) {
            throw new Error('Invalid options for model "' + name + '".');
        } else {
            model = copy(model);
            model.name = name;
            if (!isString(model.$constructor) && !isFunction(model.$constructor)) {
                throw new Error('Invalid "constructor" in options for model "' + name + '".');
            }
        }
        model.service = model.service || null;
        model.methods = model.methods || [];
        if (!isArray(model.methods)) {
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
            if (isString(method)) {
                method = methods[key] = {
                    name: method
                };
            }
            if (!isObject(method)) {
                throw new Error('Invalid options for method of model "' + model.name + '".');
            }
            if (!method.name || !isString(method.name) || !method.name.length) {
                throw new Error('Invalid "name" in options for method "undefined" of model "' + model.name + '".');
            }
            if (method.hasOwnProperty('method') && !isFunction(method.method) && !isString(method.method)) {
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
        var factory = function $new(data) {
            if (isString(model.$constructor)) {
                model.$constructor = $injector.get(model.$constructor);
            }
            var Constructor = model.$constructor;
            var instance = new Constructor(data);
            attachModelMethods($injector, model, instance);
            return instance;
        };
        factory.model = model;
        return factory;
    }

    function attachModelMethods($injector, model, instance) {
        var methods = model.methods;
        var method;
        var ix;
        var boundFn;
        for (ix = 0; ix < methods.length; ix++) {
            method = methods[ix];
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

    /**
     * @ngdoc service
     * @name ng.cork.models.factory.corkModelFactory
     *
     * @description
     * Provides a way to generates model factories from definition object
     */
    module.service('corkModelFactory', [
        '$injector',
        function corkModelFactory($injector) {

            return function corkModelFactory(name, model) {
                model = normalizeModel(name, model);
                normalizeModelMethods(model);
                return makeModelFactory($injector, model);
            };
        }
    ]);

})(angular);
