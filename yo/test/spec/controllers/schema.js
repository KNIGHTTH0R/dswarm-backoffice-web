'use strict';

beforeEach(module('dmpApp', 'mockedSchema', 'mockedTargetSchema'));

describe('Controller: SchemaCtrl', function () {

  var schemaCtrl,
    scope,
    $httpBackend;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, _$httpBackend_, $rootScope, mockSchemaJSON, mockTargetSchemaJSON) {
      scope = $rootScope.$new();
      $httpBackend = _$httpBackend_;
      $httpBackend.whenGET('/data/schema.json').respond(mockSchemaJSON);
      $httpBackend.whenGET('/data/targetschema.json').respond(mockTargetSchemaJSON);

      schemaCtrl = function() {
        return $controller('SchemaCtrl', {
          '$scope': scope
        });
      };
    }
  ));

  afterEach(inject(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  }));

  it('should have a SchemaCtrl controller', function() {
      var SchemaCtrl = schemaCtrl();
      $httpBackend.flush();
      expect(SchemaCtrl).not.toBe(null);
  });

  it('should have loaded source schema data', inject(function () {
      $httpBackend.expectGET('/data/schema.json');
      schemaCtrl();
      $httpBackend.flush();

      expect(scope.sourceSchema.name).toBe('OAI-PMH');
      expect(scope.sourceSchema.children.length).toBe(3);

    }
  ));

  it('should have loaded source schema data', inject(function () {
      $httpBackend.expectGET('/data/targetschema.json');
      schemaCtrl();
      $httpBackend.flush();

      expect(scope.targetSchema.name).toBe('OAI-PMH');
      expect(scope.targetSchema.children.length).toBe(15);

    }
  ));
});
