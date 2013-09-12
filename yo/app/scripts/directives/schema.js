'use strict';

angular.module('dmpApp')
  .controller('SchemaCtrl', ['$scope', '$http', 'schemaParser', '$q', function ($scope, $http, schemaParser, $q) {
    $scope.internalName = 'Source Target Schema Mapper';

    $scope.sourceSchema = {};
    $scope.targetSchema = {};

    var sourceSchema = $http.get('/data/schema.json')
        , targetSchema = $http.get('/data/targetschema.json')
        , allPromise = $q.all([sourceSchema, targetSchema]);

    allPromise.then(function (result) {
        var sourceSchema = result[0]['data']
            , targetSchema = result[1]['data'];

        $scope.sourceSchema = schemaParser.mapData(sourceSchema['title'], sourceSchema);
        $scope.targetSchema = schemaParser.mapData(targetSchema['title'], targetSchema);

      });
  }])
  .directive('schema', ['$compile', function ($compile) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/directives/schema.html',
        controller: 'SchemaCtrl',
        compile: function (tElement, tAttrs) {
            var contents = tElement.contents().remove()
                , compiledContents
                , isInternal = angular.isDefined(tAttrs.internal);

            return function (scope, iElement) {
                if (!compiledContents) {
                    compiledContents = $compile(contents);
                }

                compiledContents(scope, function (clone) {
                    iElement.append(clone);
                });
            };
        }
    };
  }]);

