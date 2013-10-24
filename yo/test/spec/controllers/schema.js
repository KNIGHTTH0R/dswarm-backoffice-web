'use strict';

describe('Controller: SchemaCtrl', function () {
    var $httpBackend, $rootScope, scope, schemaCtrl;

    var win = {
        dmp: {
            jsRoutes: {
                api: '/dmp/'
            }
        }
    };

    beforeEach(module('dmpApp', 'mockedSchema', 'mockedTargetSchema'));

    beforeEach(module(function($provide) {
        $provide.value('$window', win);
    }));

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($injector) {
        $httpBackend = $injector.get('$httpBackend');
        $rootScope = $injector.get('$rootScope');

        scope = $rootScope.$new();

        $httpBackend.whenGET('/data/schema.json').respond($injector.get('mockSchemaJSON'));
        $httpBackend.whenGET('/data/targetschema.json').respond($injector.get('mockTargetSchemaJSON'));

        var $controller = $injector.get('$controller');

        schemaCtrl = function () {
            return $controller('SchemaCtrl', {
                '$scope': scope
            });
        };

    }));

    afterEach(inject(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    }));

    it('should have a SchemaCtrl controller', function() {
        var SchemaCtrl = schemaCtrl();
        expect(SchemaCtrl).not.toBe(null);
    });

});
