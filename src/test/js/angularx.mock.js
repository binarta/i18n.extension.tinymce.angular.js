angular.module('angularx', [])
    .service('resourceLoader', function () {
        this.getScript = jasmine.createSpy('getScript');
    });