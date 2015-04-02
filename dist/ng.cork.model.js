/**
 * ng.cork.model - v0.0.2 - 2015-04-02
 * https://github.com/cork-labs/ng.cork.model
 *
 * Copyright (c) 2015 Cork Labs <http://cork-labs.org>
 * License: MIT <http://cork-labs.mit-license.org/2015>
 */
(function (angular) {
    'use strict';

    var module = angular.module('ng.cork.model.base', ['ng.cork.util']);

    var isString = angular.isString;

    /**
     * @ngdoc object
     * @name ng.cork.model.base.CorkModelBase
     *
     * @description
     * Abstract class for models, provides data encapuslation.
     */
    module.factory('CorkModelBase', [
        'corkUtil',
        function CorkModelBaseFactory(corkUtil) {

            var extend = corkUtil.extend;

            /**
             * @ngdoc method
             * @name CorkModelBase
             * @methodOf ng.cork.model.base.CorkModelBase
             * @description
             * Constructor.
             * @param {object} data Instance data.
             */
            var CorkModelBase = function (data) {
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
             * @methodOf ng.cork.model.base.CorkModelBase
             *
             * @description
             * Deletes all instance data.
             */
            Object.defineProperty(CorkModelBase.prototype, '$empty', {
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
             * @methodOf ng.cork.model.base.CorkModelBase
             *
             * @description
             * Replaces all instance data.
             *
             * @param {object} data Data to replace with.
             */
            Object.defineProperty(CorkModelBase.prototype, '$replace', {
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
             * @methodOf ng.cork.model.base.CorkModelBase
             *
             * @description
             * Merges existing instance data.
             *
             * @param {object} data Data to replace with.
             */
            Object.defineProperty(CorkModelBase.prototype, '$merge', {
                value: function (data) {
                    extend(this, data);
                    this.$decorate(data);
                }
            });

            /**
             * @ngdoc method
             * @name $decorate
             * @methodOf ng.cork.model.base.CorkModelBase
             *
             * @description
             * Invoked on initialization, and when {@link ng.cork.model.base.CorkModelBase#$merge $merge()} or
             * {@link ng.cork.model.base.CorkModelBase#replace replace()} are invoked.
             * Override this method in subclasses to act on populated data, for instance, replacing POJO with instances
             * of the appropriate classes.
             */
            Object.defineProperty(CorkModelBase.prototype, '$decorate', {
                configurable: true,
                value: function () {}
            });

            return CorkModelBase;
        }
    ]);
})(angular);

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
     * Generates model factories from a definition object.
     *
     * Generated factories can:
     * - create instances from a provided factory function or an injectable Constructor.
     * - decorate instances with ad-hoc functions or methods of one or more injectable services.
     *
     * # $new(options)
     *
     * <pre>
     * var userFactory = corkModelFactory.$new('user', ... options ... );
     * </pre>
     *
     * Provide an *Object* with a valid `$constructor` property or a `$new` delegate.
     *
     * ```
     * // equivalent
     * {$constructor: 'MyUser'}
     * {$new: function (data) { return new MyUser(data); }}
     * ```
     *
     * ## **options.$constructor** - *Function|String*
     *
     * Create instance via `= new Constructor(data)`.
     *
     * If provided, factory will create instances via `instance = new $constructor(data)`.
     *
     * Provide a *Function* to be used as constructor
     *
     * <pre>
     * var options = {
     *   $constructor: function MyUser() {}
     * }
     * </pre>
     *
     * Or a *String* that resolves to a function via AngularJS injection.
     *
     * <pre>
     * var options = {
     *   $constructor: 'MyUser'
     * }
     * </pre>
     *
     * ## **options.$new** - *Function*
     *
     * Delegate creation of instances to this function: `instance = $new(data)`.
     *
     * If provided, `$constructor` is ignored.
     *
     * Provide a *Function* that returns new instances of the model.
     *
     * <pre>
     * var options = {
     *   $new: function (data) {
     *     return new MyUser(data);
     *   }
     * }
     * </pre>
     *
     * ## **options.service** - *Object|String*
     *
     * Decorate instances with some methods of this service.
     *
     * Provide an *Object* with the service instance or a *String* that resolves to a service via AngularJS injection.
     *
     * <pre>
     * var options = {
     *   $constructor: 'MyUser',
     *   service: 'myService'
     * }
     * </pre>
     *
     * ## **options.methods** - *Object*
     *
     * Provide an *Object* map of methods you wish to attach to the instances.
     *
     * <pre>
     * var options = {
     *   $constructor: 'MyUser',
     *   service: 'myService',
     *   methods: {
     *      load: 'get',
     *      save: function ...
     *      delete: { ... }
     *   }
     * }
     * var userFactory = corkModelFactory.$new('user', options);
     * </pre>
     *
     * The object keys will become the name of the method attached to the model instances.
     *
     * <pre>
     * var user = userFactory({id: 1});
     * user.load().then( ... );
     * user.save().then( ... );
     * </pre>
     *
     * ## **options.methods[name]** - *null|String|Function|Object*
     *
     * If the value is `null`, the method in the provided `model.service` will be invoked by the same name.
     *
     * <pre>
     * options.methods.foo = null;
     * instance.foo(1, 2); // => service.foo(instance, 1, 2)
     * </pre>
     *
     * If it is a *String*, the method in the provided `options.service` will be invoked by this other name.
     *
     * <pre>
     * options.methods.foo = bar;
     * instance.foo(1, 2); // => service.bar(instance, 1, 2)
     * </pre>
     *
     * If it is a *Function*, the method in the provided `options.service` will be invoked by this other name.
     *
     * <pre>
     * options.methods.foo = function () {};
     * instance.foo(1, 2); // => fn(instance, 1, 2)
     * </pre>
     *
     * If it is provided as an *Object* it can have the following properties:
     *
     * **options.methods[name].method** - *Function|String*
     *
     * If provided with a *String*, it becomes the `targetName` and, as above:
     *
     * <pre>
     * options.methods.foo = { method: 'bar' };
     * instance.foo(1, 2); // => service.bar(instance, 1, 2)
     * </pre>
     *
     * If provided with a *Function*, as above, its value is directly invoked:
     *
     * <pre>
     * options.methods.foo = { method: function () {} };
     * instance.foo(1, 2); // => fn(instance, 1, 2)
     * </pre>
     *
     * **options.methods[name].service** *Object|String*
     *
     * Overrides the service for this method only, will result in:
     *
     * <pre>
     * options.methods.foo = { service: 'otherService' };
     * instance.foo(1, 2); // => otherService.foo(instance, 1, 2)
     * </pre>
     *
     * **options.methods[name].andThen** *Function|String*
     *
     * If provided with a *Function*, when service method is successful, that function is invoked with both the instance
     * and the service result.
     *
     *     // options.methods.foo = { andThen: function () {} };
     *     instance.foo(1, 2) => service.foo(instance, 1, 2) => andThenFn(instance, result)
     *
     * If provided with a *String*, when service method is successful, a method with that name is invoked in the instance
     * and provided with the service result.
     *
     *     // options.methods.foo = { andThen: '$replace' };
     *     instance.foo(1, 2) => service.foo(instance, 1, 2) => instance.$replace(result)
     */
    module.service('corkModelFactory', [
        '$injector',
        'corkUtil',
        function corkModelFactory($injector, corkUtil) {

            var isObjectObject = corkUtil.isObjectObject;
            var isPromise = corkUtil.isPromise;

            // -- private

            function normalizeModelOptions(options) {

                var name;
                var hasConstructor;
                var hasNew;
                var isValidConstructor;
                var isValidNew;

                if (!isObjectObject(options)) {
                    throw new Error('Invalid model options.');
                } else {
                    name = options.name;
                    options = copy(options);
                    hasConstructor = options.hasOwnProperty('$constructor');
                    hasNew = options.hasOwnProperty('$new');
                    isValidConstructor = hasConstructor && (isString(options.$constructor) || isFunction(options.$constructor));
                    isValidNew = hasNew && isFunction(options.$new);
                    if (hasConstructor && !isValidConstructor || hasNew && !isValidNew || !hasNew && !hasConstructor) {
                        throw new Error('Invalid "$constructor" or "$new" in options for model "' + name + '".');
                    }
                }
                options.service = options.service || null;
                options.methods = options.methods || {};
                if (!isObjectObject(options.methods)) {
                    throw new Error('Invalid "methods" in options for model "' + name + '".');
                }
                return options;
            }

            function normalizeModelMethodOptions(options) {
                var name = options.name;
                var methods = options.methods;
                var method;
                var key;
                for (key in methods) {
                    method = methods[key];
                    if (method === null || isString(method) || isFunction(method)) {
                        method = methods[key] = {
                            method: method
                        };
                    } else if (!isObject(method)) {
                        throw new Error('Invalid options for method of model "' + name + '".');
                    }
                    method.name = key;
                    if (!isString(method.name) || !method.name.length) {
                        throw new Error('Invalid method name in options of model "' + name + '".');
                    }
                    if (method.hasOwnProperty('method') && method.method !== null && !isFunction(method.method) && !isString(method.method)) {
                        throw new Error('Invalid "method" in options for method "' + method.name + '" of model "' + name + '".');
                    }
                    if (!isFunction(method.method)) {
                        method.service = method.service || options.service;
                        method.method = method.method || method.name;
                        method.andThen = method.andThen || options.andThen || null;
                        if (!method.service || !isObjectObject(method.service) && !isString(method.service)) {
                            throw new Error('Invalid "service" in options for method "' + method.name + '" of model "' + name + '".');
                        }
                    }
                }
            }

            function newModelFactory($injector, options) {
                var factory;
                if (options.$new) {
                    factory = function $new(data) {
                        var instance = options.$new(data);
                        attachModelMethods($injector, options, instance);
                        return instance;
                    };
                } else {
                    factory = function (data) {
                        if (isString(options.$constructor)) {
                            options.$constructor = $injector.get(options.$constructor);
                        }
                        var Constructor = options.$constructor;
                        var instance = new Constructor(data);
                        attachModelMethods($injector, options, instance);
                        return instance;
                    };
                }
                factory.model = options;
                return factory;
            }

            function attachModelMethods($injector, options, instance) {
                var methods = options.methods;
                var method;
                var key;
                var boundFn;
                for (key in methods) {
                    method = methods[key];
                    if (isFunction(method.method)) {
                        boundFn = angular.bind(instance, method.method);
                    } else {
                        boundFn = newModelMethodFromServiceMethod($injector, instance, method);
                    }
                    Object.defineProperty(instance, method.name, {
                        enumerable: false,
                        configurable: false,
                        value: boundFn
                    });
                }
            }

            function newModelMethodFromServiceMethod($injector, instance, method) {
                if (isString(method.service)) {
                    method.service = $injector.get(method.service);
                }
                return function modelMethod() {
                    var args = [].slice.call(arguments);
                    args.unshift(instance);
                    var promise = method.service[method.method].apply(method.service, args);
                    if (isPromise(promise) && method.andThen) {
                        promise.then(function andThen(res) {
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
                 * @name $new
                 * @methodOf ng.cork.model.factory.corkModelFactory
                 *
                 * @description
                 * Returns a function that generates instances of a particular model.
                 *
                 * @param {object} options The model options. Ex:
                 *
                 *      {
                 *          name: user,
                 *          $constructor: 'MyUser',
                 *          service: 'myUserService',
                 *          methods: { ... }
                 *      }
                 */
                $new: function $new(options) {
                    options = normalizeModelOptions(options);
                    normalizeModelMethodOptions(options);
                    return newModelFactory($injector, options);
                }
            };
        }
    ]);

})(angular);

(function (angular) {
    'use strict';

    var module = angular.module('ng.cork.model.space', ['ng.cork.util']);

    var copy = angular.copy;

    var isString = angular.isString;
    var isFunction = angular.isFunction;

    /**
     * @ngdoc object
     * @name ng.cork.model.space.CorkModelSpace
     *
     * @description
     * Base class for storing model factories.
     *
     * @property {string} baseUrl Prepended to all requests. Configurable via constructor, defaults to '/'.
     */
    module.factory('CorkModelSpace', [
        '$injector',
        'corkUtil',
        function CorkModelSpaceFactory($injector, corkUtil) {

            /**
             * @type {object} default configuration
             */
            var defaults = {};

            var CorkModelSpace = function (config) {
                var self = this;

                config = corkUtil.extend(copy(defaults), config || {});

                /**
                 * @type {object} stores model factories
                 */
                var factories = {};

                /**
                 * @ngdoc function
                 * @name model
                 * @methodOf ng.cork.model.space.CorkModelSpace
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

            return CorkModelSpace;
        }
    ]);

})(angular);

(function (angular) {
    'use strict';

    var module = angular.module('ng.cork.model', [
        'ng.cork.model.base',
        'ng.cork.model.factory',
        'ng.cork.model.space'
    ]);

})(angular);
