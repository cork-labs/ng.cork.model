(function (angular) {
    'use strict';

    var module = angular.module('ng.cork.models.model', ['ng.cork.util']);

    var isString = angular.isString;

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
