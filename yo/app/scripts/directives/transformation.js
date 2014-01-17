'use strict';

angular.module('dmpApp')
    .controller('TransformationCtrl', ['$scope', '$window', '$modal', '$q', 'PubSub', 'Lo-Dash', 'TaskResource', 'DataModelGen',
        function ($scope, $window, $modal, $q, PubSub, loDash, TaskResource, DataModelGen) {
        $scope.internalName = 'Transformation Logic Widget';

        var activeComponentId = null
            , availableIds = []
            , makeComponentId = (function () {
                var _id = 0;
                return function () {
                    _id += 1;
                    return [activeComponentId, 'fun_' + _id].join(':');
                };
            })();

        var dmg = new DataModelGen($scope.project.mappings);

        $scope.showSortable = false;
        $scope.sourceComponent = null;
        $scope.targetComponent = null;
        $scope.components = [];
        $scope.tabs = [];

        function activate(id, skipBackup, skipBroadcast) {
            $scope.showSortable = true;
            if (activeComponentId !== id) {
                $scope.$broadcast('tabSwitch', id);

                var currentMapping =  $scope.project.mappings[
                    loDash.findIndex($scope.project.mappings,  { '$internal_id' : id })
                    ];

                $scope.components = currentMapping.$components;
                $scope.sourceComponent = currentMapping.$source;
                $scope.targetComponent = currentMapping.$target;

                activeComponentId = id;

                if (!skipBroadcast) {
                    PubSub.broadcast('connectionSwitched', { id: currentMapping.$connection_id });
                }
            }
        }

        $scope.switchTab = function(tab) {
            activate(tab.id);
        };

        function sendTransformations(tasks) {
            var promises = loDash.map(tasks, function(task) {
                return TaskResource.execute(task).$promise;
            });

            $q.all(promises)
                .then(function(results) {
                    loDash.forEach(results, function(result) {
                        console.log(result);
                        PubSub.broadcast('transformationFinished', result);
                    });
                }, function(resp) {
                    console.log(resp);
                    $window.alert(resp.message || resp.data.error);
                });

        }

        $scope.sendTransformation = function (tab) {
            if (activeComponentId === tab.id) {

                var payload = dmg.genTask([tab]);
                //dump(payload);

                sendTransformations(payload);
            }
        };

        $scope.sendTransformations = function () {

            var payload = dmg.genTask($scope.tabs);
            //dump(payload);

            sendTransformations(payload);
        };

        PubSub.subscribe($scope, 'connectionSelected', function(data) {

            if (activeComponentId !== data.internal_id) {
                if (loDash.findIndex($scope.project.mappings,  { '$internal_id' : data.internal_id }) > -1) {
                    var idx = availableIds.indexOf(data.internal_id);
                    $scope.tabs[idx].active = true;
                } else {

                    console.log("data", data);

                    var start = {
                            componentType: 'source',
                            id: data.sourcePath.id,
                            attribute: data.sourcePath,
                            dataModel: data.inputDataModel
                        },
                        end = {
                            componentType: 'target',
                            id: data.targetPath,
                            attribute: data.targetPath,
                            dataModel: data.outputDataModel
                        },
                        mapping = {
                            id :  data.id,
                            $internal_id : data.internal_id,
                            $connection_id : data.connection_id,
                            name : data.name,
                            transformation : {
                            },
                            input_attribute_paths : [{
                                id : data.sourcePath.id,
                                name : data.sourcePath.name
                            }],
                            output_attribute_path : {
                                id : data.targetPath.id,
                                name : data.targetPath.name
                            },
                            $components : [],
                            $source: start,
                            $target: end
                        };

                    $scope.project.mappings.push(mapping);

                    $scope.tabs.push( { title: data.name, active: true, id: data.internal_id } );
                    availableIds.push(data.internal_id);
                    activate(data.internal_id, true, true);
                }
            }
            if($scope.$$phase !== '$digest') {
                $scope.$digest();
            }
        });

        var lastPayload;

        function push(data, index, oldIndex) {
          if (angular.isDefined(oldIndex)) {
                $scope.components.splice(oldIndex, 1);
            }
            if (angular.isDefined(index)) {
                $scope.components.splice(index, 0, data);
            } else {
                $scope.components.push(data);
            }
        }

        $scope.sortableCallbacks = {
            receive: function (event, ui) {
                var payload = angular.element(ui.item).scope()['child']
                    , componentId = makeComponentId();

                lastPayload = {componentType: 'fun', payload: payload, id: componentId};
            },
            update: function (event, ui) {
                //noinspection JSCheckFunctionSignatures
                var index = ui.item.parent().children('.function').index(ui.item)
                    , payload, oldIndex;
                if (lastPayload) {
                    payload = angular.copy(lastPayload);
                    lastPayload = null;
                } else {
                    payload = ui.item.scope()['component'];
                    oldIndex = $scope.components.indexOf(payload);
                }

                if (payload) {
                    push(payload, index, oldIndex);
                    ui.item.remove();
                }

                $scope.$digest();
            }
        };

        $scope.onFunctionClick = function(component) {
            PubSub.broadcast('handleEditConfig', component);
        };

        $scope.onFilterClick = function(component) {

            var childScope = $scope.$new();
            childScope.component = component;

            $scope.currentComponent = component;

            var modalInstance = $modal.open({
                templateUrl: 'views/directives/filter.html',
                controller: 'FilterCtrl',
                scope: childScope
            });

            modalInstance.result.then(function (selectedItem) {
                $scope.handleTargetSchemaSelected(selectedItem);
            });

        };

    }])
    .directive('transformation', [ function () {
        return {
            scope : true,
            restrict: 'E',
            replace: true,
            templateUrl: 'views/directives/transformation.html',
            controller: 'TransformationCtrl'
        };
    }]);
