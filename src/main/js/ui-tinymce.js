angular.module('ui.tinymce', ['i18n', 'image-management', 'notifications', 'toggle.edit.mode', 'angularx', 'checkpoint', 'binarta-checkpointjs-angular1'])
    .value('uiTinymceConfig', {})
    .run(['i18nRendererTemplateInstaller', 'ngRegisterTopicHandler', function (installer, ngRegisterTopicHandler) {
        ngRegisterTopicHandler({
            topic: 'edit.mode',
            handler: installTemplates,
            executeHandlerOnce: true
        });

        function installTemplates() {
            installer.add('full', function (args) {
                return '<form name="i18nForm" ng-submit="submit()">' +
                    '<div class="bin-menu-edit-body">' +
                    installer.topMenuControls() +
                    '<textarea ui-tinymce="{' +
                    'plugins: [\'fullscreen textcolor paste table binartax.link\'],' +
                    'toolbar: \'undo redo | styleselect | bold italic | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent table | binartax.link | fullscreen\',' +
                    'theme_advanced_resizing: true,' +
                    'theme_advanced_resizing_use_cookie : false,' +
                    'object_resizing: false,' +
                    'content_css: \'//cdn.binarta.com/css/tinymce/content.css\',' +
                    'height:\'180\',' +
                    (args.isEditable ? '' : 'readonly: 1,') +
                    'menubar:false}"' +
                    'ng-model="translation" name="translation">' +
                    '</textarea>' +
                    '</div>' +
                    installer.bottomMenuControls(args.isEditable) +
                    '</form>';
            });

            installer.add('media', function (args) {
                return '<form name="i18nForm" ng-submit="submit()">' +
                    '<div class="bin-menu-edit-body">' +
                    installer.topMenuControls() +
                    '<textarea ui-tinymce="{' +
                    'plugins: [\'fullscreen media paste\'],' +
                    'toolbar: \'undo redo | media | fullscreen\',' +
                    'theme_advanced_resizing: true,' +
                    'theme_advanced_resizing_use_cookie : false,' +
                    'object_resizing: false,' +
                    'content_css: \'//cdn.binarta.com/css/tinymce/content.css\',' +
                    'height:\'180\',' +
                    (args.isEditable ? '' : 'readonly: 1,') +
                    'menubar:false}"' +
                    'ng-model="translation" name="translation">' +
                    '</textarea>' +
                    '</div>' +
                    installer.bottomMenuControls(args.isEditable) +
                    '</form>';
            });

            installer.add('full-media', function (args) {
                return '<form name="i18nForm" ng-submit="submit()">' +
                    '<div class="bin-menu-edit-body">' +
                    installer.topMenuControls() +
                    '<textarea ui-tinymce="{' +
                    'plugins: [\'fullscreen binartax.img textcolor paste table binartax.link\'],' +
                    'toolbar: \'undo redo | styleselect | bold italic | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent table | binartax.link | binartax.img | fullscreen\',' +
                    'theme_advanced_resizing: true,' +
                    'theme_advanced_resizing_use_cookie : false,' +
                    'object_resizing: false,' +
                    'content_css: \'//cdn.binarta.com/css/tinymce/content.css\',' +
                    'extended_valid_elements : \'img[src|alt|title|width|height|original-width|style]\',' +
                    'media_poster: false,' +
                    'height:\'180\',' +
                    (args.isEditable ? '' : 'readonly: 1,') +
                    'menubar:false}"' +
                    'ng-model="translation" name="translation">' +
                    '</textarea>' +
                    '</div>' +
                    installer.bottomMenuControls(args.isEditable) +
                    '</form>';
            });

            installer.add('minimal', function (args) {
                return '<form name="i18nForm" ng-submit="submit()">' +
                    '<div class="bin-menu-edit-body">' +
                    installer.topMenuControls() +
                    '<textarea ui-tinymce="{' +
                    'plugins: [\'paste\'],' +
                    'toolbar: \'bold italic\',' +
                    'forced_root_block: false,' +
                    'valid_elements: \'em/i,strong/b,br\',' +
                    'height:\'180\',' +
                    (args.isEditable ? '' : 'readonly: 1,') +
                    'menubar:false}"' +
                    'ng-model="translation" name="translation">' +
                    '</textarea>' +
                    '</div>' +
                    installer.bottomMenuControls(args.isEditable) +
                    '</form>';
            });
        }
    }])
    .run(['$rootScope', 'resourceLoader', 'topicMessageDispatcher', 'binarta', function ($rootScope, resourceLoader, topicMessageDispatcher, binarta) {
        function ProfileListener() {
            var self = this;

            this.signedin = function() {
                if(binarta.checkpoint.profile.hasPermission('edit.mode')) {
                    resourceLoader.getScript('//cdn.binarta.com/js/tinymce/4.2.7/tinymce.min.js').then(function () {
                        topicMessageDispatcher.firePersistently('tinymce.loaded', true);
                    });
                    binarta.checkpoint.profile.eventRegistry.remove(self);
                }
            }
        }
        binarta.checkpoint.profile.eventRegistry.add(new ProfileListener());
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
                    var initialText;
                    var dom = editor.dom;
                    var selection = editor.selection;
                    var selectedElm = selection.getNode();
                    var anchorElm = dom.getParent(selectedElm, 'a[href]');
                    var html = selection.getContent();
                    var isOnlyTextSelected = !(/</.test(html) && (!/^<a [^>]+>[^<]+<\/a>$/.test(html) || html.indexOf('href=') == -1));

                    var scope = angular.extend($rootScope.$new(), {
                        submit: function () {
                            scope.violation = {};
                            if (scope.tinymceLinkForm.text && scope.tinymceLinkForm.text.$invalid) scope.violation.text = 'required';
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
                                    if (isOnlyTextSelected)
                                        editor.insertContent(dom.createHTML('a', linkAttrs, dom.encode(scope.text)));
                                    else
                                        editor.execCommand('mceInsertLink', false, linkAttrs);
                                }
                                editModeRenderer.close({id: 'popup'});
                            }
                        },
                        clear: unlink,
                        cancel: function () {
                            editModeRenderer.close({id: 'popup'});
                        }
                    });

                    scope.text = initialText = anchorElm ? (anchorElm.innerText || anchorElm.textContent) : selection.getContent({format: 'text'});
                    scope.href = anchorElm ? dom.getAttrib(anchorElm, 'href') : '';
                    scope.showRemoveLinkButton = scope.href ? true: false;
                    scope.href = scope.href ? scope.href : 'http://';
                    scope.target = anchorElm && dom.getAttrib(anchorElm, 'target') == "_blank" ? true : false;

                    editModeRenderer.open({
                        id: 'popup',
                        template: '<form name="tinymceLinkForm" id="tinymceLinkForm" ng-submit="submit()">' +
                        '<div class="bin-menu-edit-body">' +
                        '<h4 i18n code="i18n.menu.insert.link.title" read-only ng-bind="var"></h4>' +
                        '<hr>' +
                        '<div class="form-group">' +
                        '<label for="tinymceLinkFormUrlField" ng-class="{\'text-danger\': violation.url}" i18n code="i18n.menu.link.url.label" read-only ng-bind="var"></label>' +
                        '<input type="url" class="form-control" name="url" id="tinymceLinkFormUrlField" ng-model="href" required autofocus>' +
                        '<span class="help-block text-danger" ng-if="violation.url" i18n code="i18n.menu.link.url.{{violation.url}}" read-only ng-bind="var"></span>' +
                        '</div>' +
                        (
                            isOnlyTextSelected ? '<div class="form-group">' +
                            '<label for="tinymceLinkFormTextField" ng-class="{\'text-danger\': violation.text}" i18n code="i18n.menu.link.text.label" read-only ng-bind="var"></label>' +
                            '<input type="text" class="form-control" name="text" id="tinymceLinkFormTextField" ng-model="text" required>' +
                            '<span class="help-block text-danger" ng-if="violation.text" i18n code="i18n.menu.link.text.{{violation.text}}" read-only ng-bind="var"></span>' +
                            '</div>' : ''
                        ) +
                        '<div class="form-group">' +
                        '<div class="checkbox-switch">' +
                        '<input type="checkbox" id="link-target-switch" ng-model="target">' +
                        '<label for="link-target-switch"></label>' +
                        '<span i18n code="i18n.menu.link.target.label" read-only ng-bind="var"></span>' +
                        '</div>' +
                        '</div>' +
                        '</div>' +
                        '<div class="bin-menu-edit-actions">' +
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
    .directive('uiTinymce', ['$document', '$parse', 'uiTinymceConfig', 'imageManagement', 'ngRegisterTopicHandler', 'topicMessageDispatcher', function ($document, $parse, uiTinymceConfig, imageManagement, ngRegisterTopicHandler, topicMessageDispatcher) {
        uiTinymceConfig = uiTinymceConfig || {};
        var generatedIds = 0;
        return {
            priority: 10,
            require: 'ngModel',
            link: function (scope, elm, attrs, ngModel) {
                var expression, options, tinyInstance;

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
                        ed.on('init', function () {
                            ngModel.$render();
                            ngModel.$setPristine();
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

                    /*
                        On a form submit, for each ngModel, $commitViewValue is called to commit pending updates.
                        Because in this case there are no pending updates, we override this function to update
                        the scope value with the tinyMCE content before the actual submit is performed.
                    */
                    ngModel.$commitViewValue = function () {
                        $parse(attrs.ngModel).assign(scope, tinyInstance.getContent());
                    };

                    scope.$on('$destroy', function () {
                        if (!tinyInstance) tinyInstance = tinymce.get(attrs.id);
                        if (tinyInstance) {
                            tinyInstance.remove();
                            tinyInstance = null;
                        }
                        $document.find('body').removeClass('mce-fullscreen');
                        $document.find('html').removeClass('mce-fullscreen');
                    });
                }
            }
        };
    }]);