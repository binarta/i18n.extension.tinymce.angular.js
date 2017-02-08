describe('ui.tinymce', function () {

    var binarta, $rootScope, $window, registry, topics, tinymce, pluginName, editorSpy, pluginButtonObj;

    beforeEach(module('ui.tinymce'));

    beforeEach(inject(function (_binarta_, _$rootScope_, _$window_, topicRegistryMock, topicMessageDispatcherMock) {
        binarta = _binarta_;
        $rootScope = _$rootScope_;
        $window = _$window_;
        registry = topicRegistryMock;
        topics = topicMessageDispatcherMock;

        editorSpy = {
            execCommand: function () {
            },
            focus: function () {
            },
            undoManager: {
                add: function () {
                }
            },
            insertContent: function () {
            },
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
                select: function () {
                },
                getNode: function () {
                },
                getContent: function () {
                }
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

    afterEach(function () {
        binarta.checkpoint.profile.signout();
    });

    describe('load tinymce', function () {
        var resourceLoader, scriptLoaderCallback;

        beforeEach(inject(function (_resourceLoader_) {
            resourceLoader = _resourceLoader_;
            resourceLoader.getScript.and.returnValue({
                then: function (callback) {
                    scriptLoaderCallback = callback;
                }
            });
            $window.tinymce = undefined;
        }));

        describe('when active user has permission', function () {
            beforeEach(inject(function (activeUserHasPermissionHelper) {
                binarta.checkpoint.gateway.fetchPermissions = function (request, response) {
                    response.success(['edit.mode'].map(function (it) {
                        return {name: it}
                    }));
                };
                binarta.checkpoint.registrationForm.submit({username: 'u', password: 'p'});
            }));

            it('resources are loaded', function () {
                expect(resourceLoader.getScript).toHaveBeenCalledWith('//cdn.binarta.com/js/tinymce/4.2.7/tinymce.min.js');
            });

            describe('when tinymce is available', function () {
                beforeEach(function () {
                    scriptLoaderCallback();
                });

                it('fire notification', function () {
                    expect(topics.persistent['tinymce.loaded']).toBeTruthy();
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
                    scope.tinymceLinkForm = {
                        $valid: true,
                        url: {$invalid: false}
                    };
                });

                it('edit mode renderer is opened', function () {
                    expect(editModeRenderer.openSpy.id).toEqual('popup');
                    expect(editModeRenderer.openSpy.template).toEqual(jasmine.any(String));
                });

                it('on submit strip hash bang from fully qualified urls', function () {
                    scope.href = 'http://myapp.com/#!/path';
                    scope.submit();
                    expect(scope.href).toEqual('http://myapp.com/path');
                });

                it('on submit strip hash bang and leading slash from relative urls', function () {
                    scope.href = '/#!/path';
                    scope.submit();
                    expect(scope.href).toEqual('/path');
                });

                it('on submit strip hash bang from relative urls', function () {
                    scope.href = '#!/path';
                    scope.submit();
                    expect(scope.href).toEqual('/path');
                });
            });
        });
    });
});