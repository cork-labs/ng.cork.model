(function (angular) {
    'use strict';

    var module = angular.module('ng.cork.model.space', ['ng.cork.deep.extend']);

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
        'corkDeepExtend',
        function CorkModelSpaceFactory($injector, corkDeepExtend) {

            /**
             * @type {object} default configuration
             */
            var defaults = {};

            var CorkModelSpace = function (config) {
                var self = this;

                config = corkDeepExtend(copy(defaults), config || {});

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
