/**
 * ng.cl.api - v0.0.1 - 2015-03-25
 * https://github.com/cork-labs/ng.cl.api
 *
 * Copyright (c) 2015 Cork Labs <http://cork-labs.org>
 * License: MIT <http://cork-labs.mit-license.org/2015>
 */
(function (angular) {
    'use strict';

    var module = angular.module('ng.cl.api', []);

    var copy = angular.copy;

    var isString = angular.isString;
    var isDate = angular.isDate;
    var isFunction = angular.isFunction;
    var isObject = angular.isObject;
    var isArray = angular.isArray;

    function isObjectObject(value) {
        return value !== null && angular.isObject(value) && !angular.isArray(value);
    }

    function isRegExp(value) {
        return window.toString.call(value) === '[object RegExp]';
    }

    function isPromise(value) {
        return value && isFunction(value.then);
    }

    /**
     * makes sure baseUrl ends with a traling /
     * @param {string} url
     * @returns {string}
     */
    function trailingSlash(url) {
        url = url || '';
        return (!/\/$/.test(url)) ? url += '/' : url;
    }

    /**
     *
     */
    function extend(destination, source) {
        if (destination !== source) {
            //
            if (isDate(source)) {
                destination = new Date(source.getTime());
            } else if (isRegExp(source)) {
                destination = new RegExp(source.source, source.toString().match(/[^\/]*$/)[0]);
                destination.lastIndex = source.lastIndex;
            }
            // if source is object (or array) go recursive
            else if (isObject(source)) {
                // initialize as (or smash to) destination property to Array
                if (isArray(source)) {
                    if (!isArray(destination)) {
                        destination = [];
                    }
                }
                // initialize as (or smash to) destination property to Object
                else if (!isObject(destination) || isArray(destination)) {
                    destination = {};
                }
                for (var key in source) {
                    destination[key] = extend(destination[key], source[key]);
                }
            } else if (typeof source !== 'undefined') {
                destination = source;
            }
        }
        return destination;
    }

    // model related

    function normalizeModel(name, model) {
        if (isString(model)) {
            model = {
                name: name,
                $constructor: model
            };
        } else if (isFunction(model)) {
            model = {
                name: name,
                $new: model
            };
        } else if (!isObjectObject(model)) {
            throw new Error('Invalid options for model "' + name + '".');
        } else {
            model = copy(model);
            model.name = name;
            delete model.$new;
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
        var ix;
        for (ix = 0; ix < methods.length; ix++) {
            method = methods[ix];
            if (isString(method)) {
                method = methods[ix] = {
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

    function makeModelFactory(api, $injector, model) {
        return function $new(data) {
            if (isString(model.$constructor)) {
                model.$constructor = $injector.get(model.$constructor);
            }
            var method;
            var service;
            var instance = new model.$constructor(data);
            attachModelMethods(api, model, instance);
            return instance;
        };
    }

    function attachModelMethods(api, model, instance) {
        var methods = model.methods;
        var method;
        var ix;
        var boundFn;
        for (ix = 0; ix < methods.length; ix++) {
            method = methods[ix];
            if (isFunction(method.method)) {
                boundFn = angular.bind(instance, method.method);
            } else {
                boundFn = makeModelMethodFromServiceMethod(api, instance, method);
            }
            Object.defineProperty(instance, method.name, {
                enumerable: false,
                configurable: false,
                value: boundFn
            });
        }
    }

    function makeModelMethodFromServiceMethod(api, instance, method) {
        if (isString(method.service)) {
            method.service = api.service(method.service);
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

    // service related

    var configProperties = ['params', 'data', 'headers', 'xsrfHeaderName', 'xsrfCookieName', 'transformRequest', 'transformResponse', 'cache', 'timeout', 'withCredentials', 'responseType'];

    var Request = function Request(config) {
        extend(this, config);
    };

    Object.defineProperty(Request.prototype, 'config', {
        get: function () {
            var ret = {};
            for (var key in this) {
                if (configProperties.indexOf(key) !== -1) {
                    ret[key] = copy(this[key]);
                }
            }
            return ret;
        }
    });

    /**
     * @ngdoc object
     * @name ng.cl.api.ClRequest
     *
     * @description
     * Holds a request configuration.
     */
    module.factory('ClRequest', [

        function ClRequestFactory() {
            return Request;
        }
    ]);

    function compileURL(pattern, params) {
        var data = params || {};

        var hasParam;
        var regexp;
        var replace;

        var url = pattern.replace(/(\/)?:(\w+)(\?|\*)?/g, function matches(result, slash, key, flag) {
            hasParam = data.hasOwnProperty(key);
            // error on mandatory parameters
            if (flag !== '?' && !hasParam) {
                throw new Error('Missing parameter "' + key + '" when compiling URL for pattern "' + pattern + '".');
            }
            regexp = ':' + key;
            // optional parameters
            if (flag === '?') {
                regexp += '\\?';
                // replace preceeding / if optional parameter is not provided
                if (!hasParam || !data[key]) {
                    regexp = '\/' + regexp;
                }
            }
            // greedy parameters
            else if (flag === '*') {
                regexp += '\\*';
            }
            replace = (hasParam && data[key]) || '';
            return result.replace(new RegExp(regexp), replace);
        });

        return url;
    }

    /**
     * invokes a list of middlewares in series, waiting for each to return/resolve
     * REQUEST middlewares:
     *  - are provided with (req) only,
     *  - bails out if one returns/resolves
     * ERROR and SUCCESS middlewares:
     *  - are provided with both (req, res)
     *  - and if one returns/resolves that value replaces the current res
     */
    function execMiddlewares($q, method, mode, req, res) {
        var deferred = $q.defer();
        var index = 0;
        var middlewares = method[mode];
        var middlewareRetValue;

        function next(res) {
            if (index < middlewares.length) {
                if (mode !== 'request') {}
                // call middleware with (req) only if running REQUEST middlewares, invoke with (req, res) if SUCCESS or ERROR
                middlewareRetValue = (mode === 'request') ? middlewares[index](req) : middlewares[index](req, res);
                // use q.all to treat all middlewares alike, whether they returned a promise or not
                $q.all([middlewareRetValue]).then(function (replaceRes) {
                    // bail out and from REQUEST middlewares if one resolves
                    if (mode === 'request' && typeof replaceRes[0] !== 'undefined') {
                        deferred.resolve(replaceRes[0]);
                    } else if (mode === 'error' && isPromise(middlewareRetValue) && typeof replaceRes[0] !== 'undefined') {
                        deferred.resolve(replaceRes[0]);
                    } else {
                        // only replace the payload if previous middleware returned a promise or something NOT undefined
                        next('undefined' !== typeof replaceRes[0] ? replaceRes[0] : res);
                    }
                }, function (err) {
                    deferred.reject(err);
                });
                index++;
            } else {
                // reject if zero middlewares, or no middleware resolve/rejected
                if (mode === 'error') {
                    deferred.reject(res);
                } else {
                    deferred.resolve(res);
                }
            }
        }

        next(res);

        return deferred.promise;
    }

    /**
     * @param {string} name
     * @param {object} all
     * @param {object} method
     */
    function normalizeServiceMethod(name, method, all) {

        var base = all ? copy(all) : {};
        method.config = extend(base, method.config);

        if (!isObjectObject(method)) {
            throw new Error('Invalid options for service method "' + name + '".');
        }
        if (!isString(method.pattern)) {
            throw new Error('Invalid pattern for service method "' + name + '".');
        }
        if (!isString(method.verb)) {
            throw new Error('Invalid verb for service method "' + name + '".');
        }
    }

    /**
     * returns a service method that implements the args > request > execute > success|error flow
     * @param {object} $q
     * @param {function} execute
     * @returns {function}
     */
    function createServiceMethod($q, execute, method) {
        method.args = method.args || angular.noop;
        method.request = method.request || [];
        method.success = method.success || [];
        method.error = method.error || [];

        function executeAndProcess(req) {
            // acquired by copy
            var config = req.config;
            config.method = method.verb;
            // compile url if a pattern is provided as a string
            if (angular.isString(method.pattern)) {
                config.url = compileURL(method.pattern, req.urlParams);
            }

            return execute(config).then(function success(res) {
                return execMiddlewares($q, method, 'success', req, res);
            }, function error(res) {
                return execMiddlewares($q, method, 'error', req, res).then(function (err) {
                    return err;
                }, function (err) {
                    return $q.reject(err);
                });
            });
        }

        return function serviceMethod() {
            var args = Array.prototype.slice.call(arguments);
            var req = new Request(method.config);

            req.replay = function requestReplay(replayConfig) {
                extend(req, replayConfig);
                return executeAndProcess(req);
            };

            args.unshift(req);
            method.args.apply(null, args);

            return execMiddlewares($q, method, 'request', req).then(function (res) {
                if (res) {
                    return res;
                } else {
                    return executeAndProcess(req);
                }
            });
        };
    }

    /**
     * @ngdoc object
     * @name ng.cl.api.ClModel
     *
     * @description
     * Abstract class for models, provide data encapuslation.
     *
     * NOTE: subclasses of ClModel are not connected to a service and do not expose service methods (ex: load, save, delete).
     * For that purpose, use the {@link ng.cl.api.ClResourceModel} subclass.
     */
    module.factory('ClModel', [

        function ClModelFactory() {

            /**
             * @ngdoc method
             * @name ClModel
             * @methodOf ng.cl.api.ClModel
             * @description
             * Constructor.
             * @param {object} data Instance data.
             */
            var ClModel = function (data) {
                var self = this;

                // extends model with with  initialization data
                // and triggers the `$decorate()` method. Override in subclasses to act on populated data.
                if (data) {
                    self.$merge(data);
                }

            };

            /**
             * @ngdoc method
             * @name $empty
             * @methodOf ng.cl.api.ClModel
             *
             * @description
             * Deletes all instance data.
             */
            Object.defineProperty(ClModel.prototype, '$empty', {
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
             * @methodOf ng.cl.api.ClModel
             *
             * @description
             * Replaces all instance data.
             *
             * @param {object} data Data to replace with.
             */
            Object.defineProperty(ClModel.prototype, '$replace', {
                configurable: true,
                value: function (data) {
                    this.$empty();
                    extend(this, data);
                    this.$decorate();
                }
            });

            /**
             * @ngdoc method
             * @name $merge
             * @methodOf ng.cl.api.ClModel
             *
             * @description
             * Merges existing instance data.
             *
             * @param {object} data Data to replace with.
             */
            Object.defineProperty(ClModel.prototype, '$merge', {
                value: function (data) {
                    extend(this, data);
                    this.$decorate();
                }
            });

            /**
             * @ngdoc method
             * @name $decorate
             * @methodOf ng.cl.api.ClModel
             *
             * @description
             * Invoked on initialization, and when {@link ng.cl.api.ClModel#$merge $merge()} or
             * {@link ng.cl.api.ClModel#replace replace()} are invoked.
             * Override this method in subclasses to act on populated data, for instance, replacing POJO with instances
             * of the appropriate class.
             */
            Object.defineProperty(ClModel.prototype, '$decorate', {
                configurable: true,
                value: function () {}
            });

            return ClModel;
        }
    ]);

    /**
     * @ngdoc object
     * @name ng.cl.api.ClApiAbstractService
     *
     * @description
     * Base class for api services.
     */
    module.factory('ClApiAbstractService', [
        '$q',
        function ClApiAbstractServiceFactory($q) {

            var AbstractService = function (config) {
                var self = this;

                config = angular.copy(config);

                if (!isFunction(config.execute)) {
                    throw new Error('Invalid execute fn for service "' + self.name + '".');
                }

                // store methods
                var methods = config.methods || {};
                var name;
                for (name in methods) {
                    normalizeServiceMethod(name, methods[name], config.all);
                    Object.defineProperty(self, name, {
                        value: createServiceMethod($q, config.execute, methods[name])
                    });
                }

                Object.defineProperty(this, 'name', {
                    get: function () {
                        return config.name;
                    }
                });
            };

            return AbstractService;
        }
    ]);

    /**
     * @ngdoc object
     * @name ng.cl.api.ClApi
     *
     * @description
     * Base class for api.
     *
     * @property {string} baseUrl Prepended to all requests. Configurable via constructor, defaults to '/'.
     */
    module.factory('ClApi', [
        '$injector',
        '$http',
        'ClApiAbstractService',
        function ClApiFactory($injector, $http, ClApiAbstractService) {

            /**
             * @type {object} default api configuration
             */
            var defaults = {
                baseUrl: '/'
            };

            /**
             * @param {string} baseUrl
             * @param {string} url
             * @returns {string}
             */
            function prefixWithBaseUrl(baseUrl, url) {
                if (!(/^(http[s]?:)?\/\//.test(url))) {
                    // remove "/" from start of url
                    // since we already ensured at config time that baseUrl has a trailing "/"
                    if (/^\//.test(url)) {
                        url = url.substring(1);
                    }
                    url = baseUrl + url;
                }
                return url;
            }

            var ClApi = function (config) {
                var self = this;

                config = extend(copy(defaults), config || {});

                // makes sure baseUrl ends with a traling /
                config.baseUrl = trailingSlash(config.baseUrl);
                // @todo config.execute = config.execute || $injector('$http');

                // -- middlewares

                /**
                 * @type {object} stores middleawres
                 */
                var middlewares = {};

                /**
                 * @ngdoc function
                 * @name middleware
                 * @methodOf ng.cl.api.ClApi
                 *
                 * @description
                 * Registers or retrieves a middleware.
                 *
                 * If only a name is provided it will retrieve the middleware or throw an error
                 * if the middleware is unkonwn. If an implementation is provided it will store it or throw an
                 * error if the middleware is invalid or a middleware with this name was registered before.
                 *
                 * @param {string} name The middleware name.
                 * @param {function|Array} middleware A middleware function or an array defining an injectable function.
                 * @returns {boolean} Some result.
                 */
                self.middleware = function (name, middleware) {
                    if (!isString(name)) {
                        throw new Error('Invalid middleware name.');
                    }
                    if (arguments.length > 1) {
                        if (middleware[name]) {
                            throw new Error('middleware "' + name + '" is already registered.');
                        }
                        if (isFunction(middleware)) {
                            middlewares[name] = middleware;
                        }
                        if (isFunction(middleware)) {
                            middlewares[name] = middleware;
                        } else {
                            throw new Error('Invalid middleware "' + name + '".');
                        }
                        return this;
                    } else {
                        if (!middlewares[name]) {
                            throw new Error('Unknown middleware "' + name + '".');
                        }
                        return middlewares[name];
                    }
                };

                // -- models

                /**
                 * @type {object} stores model constructors
                 */
                var models = {};

                /**
                 * @ngdoc function
                 * @name model
                 * @methodOf ng.cl.api.ClApi
                 *
                 * @description
                 * Registers or retrieves a model definition.
                 *
                 * If no definition is provided it will retrieve the definition for that model or throw an error if the
                 * model is unkonwn. When provided with a model definition, will normalize it and store it or throw an
                 * error if a model with this name was registered before.
                 *
                 * @param {string} name The model name.
                 * @param {object=} model The model definition.
                 * @returns {boolean} Some result.
                 */
                self.model = function (name, model) {
                    if (!isString(name)) {
                        throw new Error('Invalid model name.');
                    }
                    if (arguments.length > 1) {
                        if (models[name]) {
                            throw new Error('Model "' + name + '" is already registered.');
                        }
                        model = normalizeModel(name, model);
                        normalizeModelMethods(model);
                        model.$new = model.$new || makeModelFactory(self, $injector, model);
                        models[name] = model;
                        return this;
                    } else {
                        if (!models[name]) {
                            throw new Error('Unknown model "' + name + '".');
                        }
                        return models[name];
                    }
                };

                // -- services

                /**
                 * @type {object} stores service factories
                 */
                var factories = {};

                /**
                 * @type {object} stores service instances
                 */
                var services = {};

                /**
                 * @ngdoc function
                 * @name service
                 * @methodOf ng.cl.api.ClApi
                 *
                 * @description
                 * Registers a service factory or retrieves a service instance.
                 *
                 * If no factory or configuration is provided it will retrieve the service instance or throw an error
                 * if the service is unkonwn. If a factory or configuration is provided it will store it or throw an
                 * error if a service with this name was registered before.
                 *
                 * @param {string} name The service name.
                 * @param {function=} factory A function that returns ths service instance or an object configuration for ClApiAbstractService.
                 * @returns {boolean} Some result.
                 */
                self.service = function (name, factory) {
                    if (!isString(name)) {
                        throw new Error('Invalid service name.');
                    }
                    if (arguments.length > 1) {
                        if (factories[name]) {
                            throw new Error('Service "' + name + '" is already registered.');
                        }
                        if (isObjectObject(factory)) {
                            factories[name] = function () {
                                return new ClApiAbstractService(factory);
                            };
                        } else if (isString(factory)) {
                            factories[name] = function () {
                                return $injector.get(name);
                            };
                        } else if (isFunction(factory)) {
                            factories[name] = factory;
                        } else {
                            throw new Error('Invalid factory or configuration for service "' + name + '".');
                        }
                        return this;
                    } else {
                        if (!services[name]) {
                            if (!factories[name]) {
                                throw new Error('Unknown service "' + name + '".');
                            }
                            services[name] = factories[name]();
                        }
                        return services[name];
                    }
                };

                // -- execute

                /**
                 * @ngdoc function
                 * @name execute
                 * @methodOf ng.cl.api.ClApi
                 *
                 * @description
                 * Wrapper for $http(), prepends url with the configured baseUrl.
                 *
                 * @param {object} httpConfig Options for $http.
                 * @returns {object} The underlying $http promise.
                 */
                self.execute = function (httpConfig) {

                    // resolves url in case it is a function
                    var url = angular.isFunction(httpConfig.url) ? httpConfig.url(httpConfig) : httpConfig.url;
                    url = url || '';
                    // and prefix with url if not absolute
                    httpConfig.url = prefixWithBaseUrl(config.baseUrl, url);

                    // normalise response object
                    return $http(httpConfig);
                };

                // -- properties

                Object.defineProperty(this, 'baseUrl', {
                    get: function () {
                        return config.baseUrl;
                    }
                });
            };

            return ClApi;
        }
    ]);

})(angular);
