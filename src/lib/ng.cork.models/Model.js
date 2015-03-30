(function (angular) {
    'use strict';

    var module = angular.module('ng.cork.models.model', []);

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
     * @name ng.cork.models.model.CorkModel
     *
     * @description
     * Abstract class for models, provides data encapuslation.
     */
    module.factory('CorkModel', [

        function CorkModelFactory() {

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
