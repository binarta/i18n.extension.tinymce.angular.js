angular.module('angularx', [])
    .service('resourceLoader', function () {
        this.getScript = jasmine.createSpy('getScript');
    })
    .service('binLink', function () {
        this.open = jasmine.createSpy('binLink');
    })
    .filter('binSanitizeUrl', function () {
        return jasmine.createSpy('spy');
    });