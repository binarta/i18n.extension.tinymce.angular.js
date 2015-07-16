angular.module('angularx', [])
    .service('resourceLoader', function () {
        var self = this;

        self.resources = [];

        self.add = function (href) {
            self.resources.push(href);
        };
    });