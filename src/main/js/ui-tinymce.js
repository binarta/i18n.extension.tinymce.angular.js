angular.module('ui.tinymce', ['i18n', 'image-management', 'notifications', 'toggle.edit.mode', 'angularx', 'checkpoint'])
    .value('uiTinymceConfig', {})
    .run(['i18nRendererTemplateInstaller', 'ngRegisterTopicHandler', function (installer, ngRegisterTopicHandler) {
        ngRegisterTopicHandler({
            topic: 'edit.mode',
            handler: installTemplates,
            executeHandlerOnce: true
        });

        function installTemplates() {
            installer.add('full', function (args) {
                return '<form name=\"i18nForm\" ng-submit=\"submit()\">' +
                    installer.topMenuControls() +
                    '<textarea ui-tinymce=\"{' +
                    'plugins: [\'link fullscreen textcolor paste table binartax.link\'],' +
                    'toolbar: \'undo redo | styleselect | bold italic | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent table | binartax.link | fullscreen\',' +
                    'theme_advanced_resizing: true,' +
                    'theme_advanced_resizing_use_cookie : false,' +
                    'object_resizing: false,' +
                    'content_css: \'//cdn.binarta.com/css/tinymce/content.css\',' +
                    'height:\'180\',' +
                    (args.isEditable ? '' : 'readonly: 1,') +
                    'menubar:false}\"' +
                    'ng-model=\"translation\" name=\"translation\">' +
                    '</textarea>' +
                    installer.bottomMenuControls(args.isEditable) +
                    '</form>';
            });

            installer.add('media', function (args) {
                return '<form name=\"i18nForm\" ng-submit=\"submit()\">' +
                    installer.topMenuControls() +
                    '<textarea ui-tinymce=\"{' +
                    'plugins: [\'fullscreen media paste\'],' +
                    'toolbar: \'undo redo | media | fullscreen\',' +
                    'theme_advanced_resizing: true,' +
                    'theme_advanced_resizing_use_cookie : false,' +
                    'object_resizing: false,' +
                    'content_css: \'//cdn.binarta.com/css/tinymce/content.css\',' +
                    'height:\'180\',' +
                    (args.isEditable ? '' : 'readonly: 1,') +
                    'menubar:false}\"' +
                    'ng-model=\"translation\" name=\"translation\">' +
                    '</textarea>' +
                    installer.bottomMenuControls(args.isEditable) +
                    '</form>';
            });

            installer.add('full-media', function (args) {
                return '<form name=\"i18nForm\" ng-submit=\"submit()\">' +
                    installer.topMenuControls() +
                    '<textarea ui-tinymce=\"{' +
                    'plugins: [\'link fullscreen binartax.img textcolor paste table binartax.link\'],' +
                    'toolbar: \'undo redo | styleselect | bold italic | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent table | binartax.link | binartax.img | fullscreen\',' +
                    'theme_advanced_resizing: true,' +
                    'theme_advanced_resizing_use_cookie : false,' +
                    'object_resizing: false,' +
                    'content_css: \'//cdn.binarta.com/css/tinymce/content.css\',' +
                    'extended_valid_elements : \'img[src|alt|title|width|height|original-width]\',' +
                    'media_poster: false,' +
                    'height:\'180\',' +
                    (args.isEditable ? '' : 'readonly: 1,') +
                    'menubar:false}\"' +
                    'ng-model=\"translation\" name=\"translation\">' +
                    '</textarea>' +
                    installer.bottomMenuControls(args.isEditable) +
                    '</form>';
            });
        }
    }])
    .run(['$rootScope', '$window', 'resourceLoader', 'activeUserHasPermission', 'topicMessageDispatcher', '$timeout', function ($rootScope, $window, resourceLoader, activeUserHasPermission, topicMessageDispatcher, $timeout) {
        activeUserHasPermission({
            yes: function () {
                resourceLoader.add('//cdn.binarta.com/js/tinymce/4.1.7/tinymce.min.js');
                resourceLoader.add('//cdn.binarta.com/js/tinymce/4.1.7/skins/lightgray/skin.min.css'); //pre-loading skin

                function checkIfTinymceIsAvailable() {
                    if (typeof $window.tinymce != 'undefined') {
                        topicMessageDispatcher.firePersistently('tinymce.loaded', true);
                    } else {
                        $timeout(checkIfTinymceIsAvailable, 100);
                    }
                }
                checkIfTinymceIsAvailable();
            },
            scope: $rootScope
        }, 'edit.mode');
    }])
    .run(['$rootScope', 'editModeRenderer', 'ngRegisterTopicHandler', function ($rootScope, editModeRenderer, ngRegisterTopicHandler) {
        ngRegisterTopicHandler({
            topic: 'tinymce.loaded',
            handler: addPlugin,
            executeHandlerOnce: true
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
                                scope.target ? linkAttrs.target = '_blank' : linkAttrs.target = '';
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
                    scope.href = scope.href ? scope.href : 'http://';
                    scope.target = anchorElm && dom.getAttrib(anchorElm, 'target') == "_blank" ? true : false;

                    editModeRenderer.open({
                        id: 'popup',
                        template: '<form name="tinymceLinkForm" id="tinymceLinkForm" ng-submit="submit()">' +
                        '<h4 i18n code="i18n.menu.insert.link.title" read-only ng-bind="var"></h4>' +
                        '<hr>' +
                        '<div class="form-group">' +
                        '<label for="tinymceLinkFormUrlField" ng-class="{\'text-danger\': violation.url}" i18n code="i18n.menu.link.url.label" read-only ng-bind="var"></label>' +
                        '<input type="url" class="form-control" name="url" id="tinymceLinkFormUrlField" ng-model="href" required autofocus>' +
                        '<span class="help-block text-danger" ng-if="violation.url" i18n code="i18n.menu.link.url.{{violation.url}}" read-only ng-bind="var"></span>' +
                        '</div>' +
                        '<div class="form-group">' +
                        '<label for="tinymceLinkFormTextField" ng-class="{\'text-danger\': violation.text}" i18n code="i18n.menu.link.text.label" read-only ng-bind="var"></label>' +
                        '<input type="text" class="form-control" name="text" id="tinymceLinkFormTextField" ng-model="text" required>' +
                        '<span class="help-block text-danger" ng-if="violation.text" i18n code="i18n.menu.link.text.{{violation.text}}" read-only ng-bind="var"></span>' +
                        '</div>' +
                        '<div class="form-group">' +
                        '<div class="checkbox-switch">' +
                        '<input type="checkbox" id="link-target-switch" ng-model="target">' +
                        '<label for="link-target-switch"></label>' +
                        '<span i18n code="i18n.menu.link.target.label" read-only ng-bind="var"></span>' +
                        '</div>' +
                        '</div>' +
                        '<div class=\"dropdown-menu-buttons\">' +
                        '<hr>' +
                        '<button type="button" class="btn btn-danger pull-left" ng-click="clear()" ng-if="showRemoveLinkButton" ' +
                        'i18n code="i18n.menu.remove.link.button" read-only ng-bind="var"></button>' +
                        '<button type="submit" class="btn btn-primary" i18n code="clerk.menu.ok.button" read-only ng-bind="var"></button>' +
                        '<button type="button" class="btn btn-default" ng-click="cancel()" i18n code="clerk.menu.cancel.button" read-only ng-bind="var"></button>' +
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
    }])
    .directive('uiTinymce', ['uiTinymceConfig', 'imageManagement', 'ngRegisterTopicHandler', 'topicMessageDispatcher', function (uiTinymceConfig, imageManagement, ngRegisterTopicHandler, topicMessageDispatcher) {
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

                ngRegisterTopicHandler({
                    scope: scope,
                    topic: 'tinymce.loaded',
                    handler: tinymceIsAvailable
                });

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
    }]);