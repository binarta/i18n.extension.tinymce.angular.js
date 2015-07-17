angular.module('ui.tinymce', ['image-management', 'notifications', 'toggle.edit.mode', 'angularx'])
    .value('uiTinymceConfig', {})
    .run(['$rootScope', 'resourceLoader', 'activeUserHasPermission', function ($rootScope, resourceLoader, activeUserHasPermission) {
        activeUserHasPermission({
            yes: function () {
                resourceLoader.add('//cdn.binarta.com/js/tinymce/4.1.7/tinymce.min.js');
                resourceLoader.add('//cdn.binarta.com/js/tinymce/4.1.7/skins/lightgray/skin.min.css'); //pre-loading skin
            },
            scope: $rootScope
        }, 'edit.mode');
    }])
    .directive('uiTinymce', ['uiTinymceConfig', 'imageManagement', 'topicMessageDispatcher', '$timeout', function (uiTinymceConfig, imageManagement, topicMessageDispatcher, $timeout) {
        uiTinymceConfig = uiTinymceConfig || {};
        var generatedIds = 0;
        return {
            priority: 10,
            require: 'ngModel',
            link: function (scope, elm, attrs, ngModel) {
                var expression, options, tinyInstance,
                    updateView = function () {
                        ngModel.$setViewValue(tinyInstance.getContent());
                        if (!scope.$root.$$phase) {
                            scope.$apply();
                        }
                    };

                // generate an ID if not present
                if (!attrs.id) {
                    attrs.$set('id', 'uiTinymce' + generatedIds++);
                }

                if (attrs.uiTinymce) {
                    expression = scope.$eval(attrs.uiTinymce);
                } else {
                    expression = {};
                }

                expression.file_browser_callback = function (field_name, url, type, win) {
                    if (type == 'image') imageManagement.triggerFileUpload();
                    else {
                        topicMessageDispatcher.fire('system.info', {
                            code: 'upload.file.browser.unsupported',
                            default: 'Only images can be uploaded at this time.'
                        });
                    }
                };

                // make config'ed setup method available
                if (expression.setup) {
                    var configSetup = expression.setup;
                    delete expression.setup;
                }

                options = {
                    // Update model when calling setContent (such as from the source editor popup)
                    setup: function (ed) {
                        var args;
                        ed.on('init', function (args) {
                            ngModel.$render();
                            ngModel.$setPristine();
                        });
                        // Update model on button click
                        ed.on('ExecCommand', function (e) {
                            ed.save();
                            updateView();
                        });
                        // Update model on keypress
                        ed.on('KeyUp', function (e) {
                            ed.save();
                            updateView();
                        });
                        // Update model on change, i.e. copy/pasted text, plugins altering content
                        ed.on('SetContent', function (e) {
                            if (!e.initial && ngModel.$viewValue !== e.content) {
                                ed.save();
                                updateView();
                            }
                        });
                        ed.on('change', function (e) {
                            ed.save();
                            updateView();
                        });
                        ed.on('blur', function (e) {
                            elm.blur();
                        });
                        // Update model when an object has been resized (table, image)
                        ed.on('ObjectResized', function (e) {
                            ed.save();
                            updateView();
                        });
                        if (configSetup) {
                            configSetup(ed);
                        }
                    },
                    mode: 'exact',
                    elements: attrs.id
                };
                // extend options with initial uiTinymceConfig and options from directive attribute value
                angular.extend(options, uiTinymceConfig, expression);

                function checkIfTinymceIsAvailable() {
                    if (typeof tinymce != 'undefined') {
                        tinymceIsAvailable();
                    } else {
                        $timeout(checkIfTinymceIsAvailable, 100);
                    }
                }

                checkIfTinymceIsAvailable();

                function tinymceIsAvailable() {
                    tinymce.init(options);

                    ngModel.$render = function () {
                        if (!tinyInstance) tinyInstance = tinymce.get(attrs.id);
                        if (tinyInstance) {
                            var viewValue = ngModel.$viewValue || '';
                            tinyInstance.setContent(viewValue);
                            if (viewValue == '') tinyInstance.focus();
                        }
                    };

                    scope.$on('$destroy', function () {
                        if (!tinyInstance) tinyInstance = tinymce.get(attrs.id);
                        if (tinyInstance) {
                            tinyInstance.remove();
                            tinyInstance = null;
                        }
                    });
                }
            }
        };
    }])
    .run(['$rootScope', 'editModeRenderer', function ($rootScope, editModeRenderer) {
        $rootScope.$watch(function () {
            return typeof tinymce != 'undefined';
        }, function (value) {
            if (value) addPlugin();
        });

        function addPlugin() {
            tinymce.PluginManager.add('binartax.link', function (editor) {
                function unlink() {
                    editor.execCommand('unlink');
                    editModeRenderer.close({id: 'popup'});
                }

                function onclick() {
                    var scope = angular.extend($rootScope.$new(), {
                        submit: function () {
                            scope.violation = {};
                            if (scope.tinymceLinkForm.text.$invalid) scope.violation.text = 'required';
                            if (scope.tinymceLinkForm.url.$invalid) scope.violation.url = 'invalid';

                            if (scope.tinymceLinkForm.$valid) {
                                var linkAttrs = {href: scope.href};
                                if (scope.target) linkAttrs.target = "_blank";
                                if (anchorElm) {
                                    editor.focus();
                                    if (scope.text != initialText) {
                                        if ("innerText" in anchorElm) {
                                            anchorElm.innerText = scope.text;
                                        } else {
                                            anchorElm.textContent = scope.text;
                                        }
                                    }
                                    dom.setAttribs(anchorElm, linkAttrs);
                                    selection.select(anchorElm);
                                    editor.undoManager.add();
                                } else {
                                    editor.insertContent(dom.createHTML('a', linkAttrs, dom.encode(scope.text)));
                                }
                                editModeRenderer.close({id: 'popup'});
                            }
                        },
                        clear: unlink,
                        cancel: function () {
                            editModeRenderer.close({id: 'popup'});
                        }
                    });

                    var initialText;
                    var dom = editor.dom;
                    var selection = editor.selection;
                    var selectedElm = selection.getNode();
                    var anchorElm = dom.getParent(selectedElm, 'a[href]');

                    scope.text = initialText = anchorElm ? (anchorElm.innerText || anchorElm.textContent) : selection.getContent({format: 'text'});
                    scope.href = anchorElm ? dom.getAttrib(anchorElm, 'href') : '';
                    scope.showRemoveLinkButton = scope.href ? true: false;
                    scope.target = anchorElm && dom.getAttrib(anchorElm, 'target') == "_blank" ? true : false;

                    editModeRenderer.open({
                        id: 'popup',
                        template: '<form name="tinymceLinkForm" id="tinymceLinkForm" ng-submit="submit()">' +
                        '<h4 i18n code="i18n.menu.insert.link.title" read-only>{{var}}</h4>' +
                        '<hr>' +
                        '<div class="form-group">' +
                        '<label for="tinymceLinkFormUrlField" ng-class="{\'text-danger\': violation.url}" i18n code="i18n.menu.link.url.label" read-only>{{var}}</label>' +
                        '<input type="url" class="form-control" name="url" id="tinymceLinkFormUrlField" ng-model="href" required autofocus>' +
                        '<span class="help-block text-danger" ng-if="violation.url" i18n code="i18n.menu.link.url.{{violation.url}}" read-only>{{var}}</span>' +
                        '</div>' +
                        '<div class="form-group">' +
                        '<label for="tinymceLinkFormTextField" ng-class="{\'text-danger\': violation.text}" i18n code="i18n.menu.link.text.label" read-only>{{var}}</label>' +
                        '<input type="text" class="form-control" name="text" id="tinymceLinkFormTextField" ng-model="text" required>' +
                        '<span class="help-block text-danger" ng-if="violation.text" i18n code="i18n.menu.link.text.{{violation.text}}" read-only>{{var}}</span>' +
                        '</div>' +
                        '<div class="form-group">' +
                        '<div class="checkbox-switch">' +
                        '<input type="checkbox" id="link-target-switch" ng-model="target">' +
                        '<label for="link-target-switch"></label>' +
                        '<span i18n code="i18n.menu.link.target.label" read-only>{{var}}</span>' +
                        '</div>' +
                        '</div>' +
                        '<div class=\"dropdown-menu-buttons\">' +
                        '<hr>' +
                        '<button type="button" class="btn btn-danger pull-left" ng-click="clear()" ng-if="showRemoveLinkButton" ' +
                        'i18n code="i18n.menu.remove.link.button" read-only>{{var}}</button>' +
                        '<button type="submit" class="btn btn-primary" i18n code="clerk.menu.ok.button" read-only>{{var}}</button>' +
                        '<button type="button" class="btn btn-default" ng-click="cancel()" i18n code="clerk.menu.cancel.button" read-only>{{var}}</button>' +
                        '</div>' +
                        '</form>',
                        scope: scope
                    });
                }

                editor.addButton('binartax.link', {
                    icon: 'mce-ico mce-i-link',
                    tooltip: 'Insert/edit link',
                    stateSelector: 'a[href]',
                    onclick: onclick
                })
            });
        }
    }]);