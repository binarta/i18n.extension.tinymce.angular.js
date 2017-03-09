angular.module('angularx', [])
    .service('resourceLoader', function () {
        this.getScript = jasmine.createSpy('getScript');
    })
    .filter('binSanitizeUrl', function () {
        return jasmine.createSpy('spy');
    });