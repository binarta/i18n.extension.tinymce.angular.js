describe('ui.tinymce', function () {

    var $rootScope, $window, registry, topics, tinymce, pluginName, editorSpy, pluginButtonObj;

    beforeEach(module('ui.tinymce'));

    beforeEach(inject(function (_$rootScope_, _$window_, topicRegistryMock, topicMessageDispatcherMock) {
        $rootScope = _$rootScope_;
        $window = _$window_;
        registry = topicRegistryMock;
        topics = topicMessageDispatcherMock;

        editorSpy = {
            execCommand: function () {},
            focus: function () {},
            undoManager: {
                add: function () {}
            },
            insertContent: function () {},
            dom: {
                getParent: function () {
                    return {};
                },
                getAttrib: function () {

                },
                setAttribs: function (anchorElm, linkAttrs) {
                    this.setAttribsSpy['anchorElm'] = anchorElm;
                    this.setAttribsSpy['linkAttrs'] = linkAttrs;
                },
                setAttribsSpy: []
            },
            selection: {
                select: function () {},
                getNode: function () {},
                getContent: function () {}
            },
            addButton: function (name, obj) {
                pluginButtonObj = obj;
            }
        };

        tinymce = {
            PluginManager: {
                add: function (name, fn) {
                    pluginName = name;
                    fn(editorSpy)
                }
            }
        };
        $window.tinymce = tinymce;
    }));

    describe('load tinymce', function () {
        var resourceLoader;

        beforeEach(inject(function (_resourceLoader_) {
            resourceLoader = _resourceLoader_;
            $window.tinymce = undefined;
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

            describe('when tinymce is available', function () {
                beforeEach(inject(function ($timeout) {
                    $window.tinymce = tinymce;
                    $timeout.flush();
                }));

                it('fire notification', function () {
                    expect(topics.persistent['tinymce.loaded']).toBeTruthy();
                });

                it('notification is fired only once', function () {
                    topics.persistent = {};
                    $window.tinymce = undefined;
                    $rootScope.$digest();
                    $window.tinymce = tinymce;
                    $rootScope.$digest();

                    expect(topics.persistent['tinymce.loaded']).toBeFalsy();
                });
            });
        });
    });

    describe('binartax.link plugin', function () {
        var $rootScope, editModeRenderer;

        beforeEach(inject(function (_$rootScope_, _editModeRenderer_) {
            $rootScope = _$rootScope_;
            editModeRenderer = _editModeRenderer_;

            $rootScope.$digest();
        }));

        describe('when tinymce is loaded', function () {
            beforeEach(function () {
                registry['tinymce.loaded']();
            });

            it('add binartax.link plugin to tinymce plugin manager', function () {
                expect(pluginName).toEqual('binartax.link');
            });

            describe('on plugin button clicked', function () {
                var scope;

                beforeEach(function () {
                    pluginButtonObj.onclick();
                    scope = editModeRenderer.openSpy.scope;
                });

                it('edit mode renderer is opened', function () {
                    expect(editModeRenderer.openSpy.id).toEqual('popup');
                    expect(editModeRenderer.openSpy.template).toEqual(jasmine.any(String));
                });
            });
        });
    });
});