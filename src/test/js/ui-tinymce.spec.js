describe('ui.tinymce', function () {

    beforeEach(module('ui.tinymce'));

    describe('load tinymce', function () {
        var resourceLoader;

        beforeEach(inject(function (_resourceLoader_) {
            resourceLoader = _resourceLoader_;
        }));

        describe('when active user has permission', function () {
            var permitter;

            beforeEach(inject(function (activeUserHasPermissionHelper) {
                permitter = activeUserHasPermissionHelper;
                permitter.yes();
            }));

            it('user has edit.mode permission', function () {
                expect(permitter.permission).toEqual('edit.mode');
            });

            it('resources are loaded', function () {
                expect(resourceLoader.resources).toEqual([
                    '//cdn.binarta.com/js/tinymce/4.1.7/tinymce.min.js',
                    '//cdn.binarta.com/js/tinymce/4.1.7/skins/lightgray/skin.min.css'
                ]);
            });
        });
    });

});