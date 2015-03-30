(function (angular) {
    'use strict';

    var module = angular.module('ng.cork.models.models', []);
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
     * @param {object} destination
     * @param {object} source
     * @return {object}
     */
    function extend(destination, source) {
        // bailout
        if (destination !== source) {
            // handles dates and regexps
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
        function CorkModelsFactory($injector) {

            /**
             * @type {object} default configuration
             */
            var defaults = {};

            var CorkModels = function (config) {
                var self = this;

                config = extend(copy(defaults), config || {});

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

            // -- static util

            /**
             * @ngdoc function
             * @name extend
             * @methodOf ng.cork.models.models.CorkModels
             *
             * @description
             * Static deep merge utility function.
             *
             * @param {*} destination The object to extend. If a scalar value is provided and `source` is object or an
             *   array you will get a new object returned, otherwise the destination is modified and you can ignore the return value.
             * @param {*} source The source object.
             * @returns {object} The extended object.
             */
            CorkModels.extend = extend;

            return CorkModels;
        }
    ]);

})(angular);
