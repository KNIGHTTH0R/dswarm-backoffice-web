/* global _ */
'use strict';

angular.module('dmpApp')
    .controller('TransformationCtrl', ['$scope', '$http', '$window', '$filter', '$modal', 'PubSub', function ($scope, $http, $window, $filter, $modal, PubSub) {
        $scope.internalName = 'Transformation Logic Widget';

        var allComponents = {}
            , activeComponentId = null
            , availableIds = []
            , makeComponentId = (function () {
                var _id = 0;
                return function () {
                    _id += 1;
                    return [activeComponentId, 'fun_' + _id].join(':');
                };
            })();

        $scope.showSortable = false;
        $scope.sourceComponent = null;
        $scope.targetComponent = null;
        $scope.components = [];
        $scope.tabs = [];

        function activate(id, skipBackup, skipBroadcast) {
            $scope.showSortable = true;
            if (activeComponentId !== id) {
                $scope.$broadcast('tabSwitch', id);

                if (!skipBackup) {
                    allComponents[activeComponentId] = {
                        components: $scope.components,
                        source: $scope.sourceComponent,
                        target: $scope.targetComponent
                    };
                }

                var newComponents = allComponents[id];

                $scope.components = newComponents.components;
                $scope.sourceComponent = newComponents.source;
                $scope.targetComponent = newComponents.target;

                activeComponentId = id;

                if (!skipBroadcast) {
                    PubSub.broadcast('connectionSwitched', {id: id});
                }
            }
        }

        $scope.switchTab = function(tab) {
            activate(tab.id);
        };

        function generatePayload(tab) {
            var id = tab.id
                , scp = allComponents[id];

            if (!scp) {
                return null;
            }

            return {
                'id': id,
                'name': tab.title,
                'components': angular.copy(scp.components),
                'source': angular.copy(scp.source),
                'target': angular.copy(scp.target),
                'resource_id': scp.source.payload.resourceId,
                'configuration_id': scp.source.payload.configurationId
            };
        }

        function sendTransformations(transformations, singleTransformation) {
            var url = $window['dmp']['jsRoutes']['api'],
                p = $http.post(
                    url + (singleTransformation? 'transformations' : 'jobs'),
                    transformations);

            p.then(function (resp) {
                console.log(resp);
                PubSub.broadcast('transformationFinished', resp.data);
            }, function (resp) {
                console.log(resp);
                $window.alert(resp.data.error);
            });
        }

        $scope.sendTransformation = function (tab) {
            if (activeComponentId === tab.id) {
                var transformation = generatePayload(tab);

                sendTransformations(transformation, true);
            }
        };

        $scope.sendTransformations = function () {
            var payloads = _($scope.tabs).map(generatePayload).filter(function (payload) {
                return payload !== null;
            }).valueOf();

            var transformations = {
                'transformations': payloads
            };

            sendTransformations(transformations);
        };

        PubSub.subscribe($scope, 'connectionSelected', function(data) {
            var id = data.id;
            if (activeComponentId !== id) {
                if (allComponents.hasOwnProperty(id)) {
                    var idx = availableIds.indexOf(id);
                    $scope.tabs[idx].active = true;
                } else {

                    var start = {
                            componentType: 'source',
                            payload: data.sourceData,
                            id: data.id + ':source',
                            source: data.source,
                            target: data.target
                        }
                        , end = {
                            componentType: 'target',
                            payload: data.targetData,
                            id: data.id + ':source',
                            source: data.source,
                            target: data.target
                        };

                    allComponents[id] = {
                        components: [],
                        source: start,
                        target: end
                    };
                    $scope.tabs.push({title: data.label, active: true, id: id});
                    availableIds.push(id);
                    activate(id, true, true);
                }
            }
            $scope.$digest();
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

            var modalInstance = $modal.open({
                templateUrl: 'views/directives/filter.html',
                controller: 'FilterCtrl'
            });

            modalInstance.result.then(function (selectedItem) {
                $scope.handleTargetSchemaSelected(selectedItem);
            });

        };

    }])
    .directive('transformation', [ function () {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'views/directives/transformation.html',
            controller: 'TransformationCtrl'
        };
    }]);
