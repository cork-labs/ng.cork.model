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
