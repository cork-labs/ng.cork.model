/**
 * ng.cork.models - v0.0.1 - 2015-03-31
 * https://github.com/cork-labs/ng.cork.models
 *
 * Copyright (c) 2015 Cork Labs <http://cork-labs.org>
 * License: MIT <http://cork-labs.mit-license.org/2015>
 */
(function (angular) {
    'use strict';

    var module = angular.module('ng.cork.models.model', ['ng.cork.util']);

    var copy = angular.copy;

    var isString = angular.isString;
    var isDate = angular.isDate;
    var isFunction = angular.isFunction;
    var isObject = angular.isObject;
    var isArray = angular.isArray;

    /**
     * @ngdoc object
     * @name ng.cork.models.model.CorkModel
     *
     * @description
     * Abstract class for models, provides data encapuslation.
     */
    module.factory('CorkModel', [
        'corkUtil',
        function CorkModelFactory(corkUtil) {

            var extend = corkUtil.extend;

            /**
             * @ngdoc method
             * @name CorkModel
             * @methodOf ng.cork.models.model.CorkModel
             * @description
             * Constructor.
             * @param {object} data Instance data.
             */
            var CorkModel = function (data) {
                var self = this;

                // extends model with with  initialization data
                // and triggers the `$decorate()` method.
                // Override in subclasses to act on populated data.
                if (data) {
                    self.$merge(data);
                }

            };

            /**
             * @ngdoc method
             * @name $empty
             * @methodOf ng.cork.models.model.CorkModel
             *
             * @description
             * Deletes all instance data.
             */
            Object.defineProperty(CorkModel.prototype, '$empty', {
                value: function () {
                    for (var prop in this) {
                        if (this.hasOwnProperty(prop)) {
                            delete this[prop];
                        }
                    }
                }
            });

            /**
             * @ngdoc method
             * @name $replace
             * @methodOf ng.cork.models.model.CorkModel
             *
             * @description
             * Replaces all instance data.
             *
             * @param {object} data Data to replace with.
             */
            Object.defineProperty(CorkModel.prototype, '$replace', {
                configurable: true,
                value: function (data) {
                    this.$empty();
                    extend(this, data);
                    this.$decorate(data);
                }
            });

            /**
             * @ngdoc method
             * @name $merge
             * @methodOf ng.cork.models.model.CorkModel
             *
             * @description
             * Merges existing instance data.
             *
             * @param {object} data Data to replace with.
             */
            Object.defineProperty(CorkModel.prototype, '$merge', {
                value: function (data) {
                    extend(this, data);
                    this.$decorate(data);
                }
            });

            /**
             * @ngdoc method
             * @name $decorate
             * @methodOf ng.cork.models.model.CorkModel
             *
             * @description
             * Invoked on initialization, and when {@link ng.cork.models.model.CorkModel#$merge $merge()} or
             * {@link ng.cork.models.model.CorkModel#replace replace()} are invoked.
             * Override this method in subclasses to act on populated data, for instance, replacing POJO with instances
             * of the appropriate classes.
             */
            Object.defineProperty(CorkModel.prototype, '$decorate', {
                configurable: true,
                value: function () {}
            });

            return CorkModel;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    var module = angular.module('ng.cork.models.models', ['ng.cork.util']);

    var copy = angular.copy;

    var isString = angular.isString;
    var isDate = angular.isDate;
    var isFunction = angular.isFunction;
    var isObject = angular.isObject;
    var isArray = angular.isArray;

    /**
     * @ngdoc object
     * @name ng.cork.models.models.CorkModels
     *
     * @description
     * Base class for storing model factories.
     *
     * @property {string} baseUrl Prepended to all requests. Configurable via constructor, defaults to '/'.
     */
    module.factory('CorkModels', [
        '$injector',
        'corkUtil',
        function CorkModelsFactory($injector, corkUtil) {

            /**
             * @type {object} default configuration
             */
            var defaults = {};

            var CorkModels = function (config) {
                var self = this;

                config = corkUtil.extend(copy(defaults), config || {});

                /**
                 * @type {object} stores model factories
                 */
                var factories = {};

                /**
                 * @ngdoc function
                 * @name model
                 * @methodOf ng.cork.models.models.CorkModels
                 *
                 * @description
                 * Registers or retrieves a model factory.
                 *
                 * If no factory is provided it will retrieve the factory for that model or throw an error if the
                 * model is unkonwn.
                 *
                 * When provided with a model factory, will validate and store it or throw an
                 * error if a factory with this name was registered before.
                 *
                 * @param {string} name The model name to register or retrieve.
                 * @param {function=} factory The model factory to register.
                 * @returns {object} The factory function wrapped in an object in the form
                 *
                 *     {
                 *       name: <string>,
                 *       $new: <function>
                 *     }
                 */
                self.model = function (name, factory) {
                    if (!isString(name)) {
                        throw new Error('Invalid model name.');
                    }
                    if (arguments.length > 1) {
                        if (factories[name]) {
                            throw new Error('A factory for model "' + name + '" is already registered.');
                        }
                        if (isString(factory)) {
                            factories[name] = {
                                name: name,
                                $constructor: factory,
                                $new: function (data) {
                                    var Constructor = $injector.get(factory);
                                    return new Constructor(data);
                                }
                            };
                        } else if (isFunction(factory)) {
                            factories[name] = {
                                name: name,
                                $factory: factory.name,
                                $new: factory
                            };
                        } else {
                            throw new Error('Invalid factory for model "' + name + '".');
                        }
                        return this;
                    } else {
                        if (!factories[name]) {
                            throw new Error('Unknown model "' + name + '".');
                        }
                        return factories[name];
                    }
                };
            };

            return CorkModels;
        }
    ]);

})(angular);

(function (angular) {
    'use strict';

    var module = angular.module('ng.cork.models.factory', ['ng.cork.util']);

    var copy = angular.copy;

    var isString = angular.isString;
    var isFunction = angular.isFunction;
    var isObject = angular.isObject;
    var isArray = angular.isArray;

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
