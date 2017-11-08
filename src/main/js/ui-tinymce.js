angular.module('ui.tinymce', ['i18n', 'notifications', 'angularx', 'binarta-checkpointjs-angular1', 'config'])
    .run(['i18nRendererTemplateInstaller', 'ngRegisterTopicHandler', 'config', function (installer, ngRegisterTopicHandler, config) {
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
                    'plugins: [\'fullscreen textcolor colorpicker lists paste table binartax.link\'],' +
                    'toolbar: \'undo redo | styleselect | bold italic | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent table | binartax.link | fullscreen\',' +
                    'theme_advanced_resizing: true,' +
                    'theme_advanced_resizing_use_cookie : false,' +
                    'object_resizing: false,' +
                    'document_base_url: \'' + config.baseUri + '\',' +
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
                    'plugins: [\'fullscreen binartax.img textcolor colorpicker lists paste table binartax.link\'],' +
                    'toolbar: \'undo redo | styleselect | bold italic | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent table | binartax.link | binartax.img | fullscreen\',' +
                    'theme_advanced_resizing: true,' +
                    'theme_advanced_resizing_use_cookie : false,' +
                    'object_resizing: false,' +
                    'document_base_url: \'' + config.baseUri + '\',' +
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
                    'document_base_url: \'' + config.baseUri + '\',' +
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

            this.signedin = function () {
                if (binarta.checkpoint.profile.hasPermission('edit.mode')) {
                    resourceLoader.getScript('//cdn.binarta.com/js/tinymce/4.6.3/tinymce.min.js').then(function () {
                        topicMessageDispatcher.firePersistently('tinymce.loaded', true);
                    });
                    binarta.checkpoint.profile.eventRegistry.remove(self);
                }
            }
        }

        binarta.checkpoint.profile.eventRegistry.add(new ProfileListener());
    }])
    .run(['ngRegisterTopicHandler', 'binLink', function (ngRegisterTopicHandler, binLink) {
        ngRegisterTopicHandler({
            topic: 'tinymce.loaded',
            handler: addPlugin,
            executeHandlerOnce: true
        });

        function addPlugin() {
            tinymce.PluginManager.add('binartax.link', function (editor) {
                function onclick() {
                    var dom = editor.dom;
                    var selection = editor.selection;
                    var selectedElm = selection.getNode();
                    var anchorElm = dom.getParent(selectedElm, 'a[href]');
                    var html = selection.getContent();
                    var isOnlyTextSelected = !(/</.test(html) && (!/^<a [^>]+>[^<]+<\/a>$/.test(html) || html.indexOf('href=') === -1));
                    var initialText = anchorElm ? (anchorElm.innerText || anchorElm.textContent) : selection.getContent({format: 'text'});

                    binLink.open({
                        href: anchorElm ? dom.getAttrib(anchorElm, 'href') : '',
                        text: initialText,
                        allowText: true,
                        target: anchorElm && dom.getAttrib(anchorElm, 'target'),
                        onSubmit: onSubmit,
                        onRemove: onRemove
                    });

                    function onSubmit(args) {
                        var linkAttrs = {href: args.href, target: args.target};

                        if (anchorElm) {
                            editor.focus();
                            if (args.text !== initialText) {
                                if ("innerText" in anchorElm) anchorElm.innerText = args.text;
                                else anchorElm.textContent = args.text;
                            }
                            dom.setAttribs(anchorElm, linkAttrs);
                            selection.select(anchorElm);
                            editor.undoManager.add();
                        } else {
                            if (isOnlyTextSelected) editor.insertContent(dom.createHTML('a', linkAttrs, dom.encode(args.text)));
                            else editor.execCommand('mceInsertLink', false, linkAttrs);
                        }
                        args.success();
                    }

                    function onRemove(args) {
                        editor.execCommand('unlink');
                        args.success();
                    }
                }

                editor.addButton('binartax.link', {
                    icon: 'mce-ico mce-i-link',
                    tooltip: 'Insert/edit link',
                    stateSelector: 'a[href]',
                    onclick: onclick
                });
            });
        }
    }])
    .directive('uiTinymce', ['$document', '$parse', 'ngRegisterTopicHandler', function ($document, $parse, ngRegisterTopicHandler) {
        var generatedIds = 0;
        return {
            require: 'ngModel',
            link: function (scope, el, attrs, ngModel) {
                var options, editor;
                if (!attrs.id) attrs.$set('id', 'uiTinymce' + generatedIds++);
                ngModel.$render = function () {};
                options = scope.$eval(attrs.uiTinymce);
                options.selector = '#' + attrs.id;
                options.branding = false;
                options.init_instance_callback = function (e) {
                    editor = e;
                    editor.show();
                    editor.focus();
                    editor.insertContent(ngModel.$viewValue || '');
                };

                ngRegisterTopicHandler({
                    scope: scope,
                    topic: 'tinymce.loaded',
                    handler: tinymceIsAvailable
                });

                function tinymceIsAvailable() {
                    tinymce.init(options);

                    /*
                     On a form submit, for each ngModel, $commitViewValue is called to commit pending updates.
                     Because in this case there are no pending updates, we override this function to update
                     the scope value with the tinyMCE content before the actual submit is performed.
                     */
                    var commitViewValue = ngModel.$commitViewValue;
                    ngModel.$commitViewValue = function () {
                        $parse(attrs.ngModel).assign(scope, editor.getContent());
                        commitViewValue.apply(ngModel);
                    };

                    scope.$on('$destroy', function () {
                        if (editor) editor.destroy();
                        $document.find('body').removeClass('mce-fullscreen');
                        $document.find('html').removeClass('mce-fullscreen');
                    });
                }
            }
        };
    }]);