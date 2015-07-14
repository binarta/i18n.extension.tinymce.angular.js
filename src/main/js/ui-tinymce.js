/**
 * Binds a TinyMCE widget to <textarea> elements.
 */
angular.module('ui.tinymce', ['image-management', 'notifications'])
    .value('uiTinymceConfig', {})
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

                expression.file_browser_callback = function(field_name, url, type, win) {
                    if(type=='image') imageManagement.triggerFileUpload();
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
                        ed.on('init', function(args) {
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
                        ed.on('blur', function(e) {
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

                function tinymceIsAvailable () {
                    tinymce.init(options);

                    ngModel.$render = function() {
                        if (!tinyInstance) tinyInstance = tinymce.get(attrs.id);
                        if (tinyInstance) {
                            var viewValue = ngModel.$viewValue || '';
                            tinyInstance.setContent(viewValue);
                            if (viewValue == '') tinyInstance.focus();
                        }
                    };

                    scope.$on('$destroy', function() {
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
                    editModeRenderer.close({id:'popup'});
                }

                function onclick() {
                    var $scope = angular.extend($rootScope.$new(), {
                        submit:function() {
                            if(!$scope.href) {
                                unlink();
                            } else {
                                var linkAttrs = {href: $scope.href};
                                if(anchorElm) {
                                    editor.focus();
                                    if ($scope.text != initialText) {
                                        if ("innerText" in anchorElm) {
                                            anchorElm.innerText = $scope.text;
                                        } else {
                                            anchorElm.textContent = $scope.text;
                                        }
                                    }
                                    dom.setAttribs(anchorElm, linkAttrs);
                                    selection.select(anchorElm);
                                    editor.undoManager.add();
                                } else {
                                    editor.insertContent(dom.createHTML('a', linkAttrs, dom.encode($scope.text)));
                                }
                                editModeRenderer.close({id:'popup'});
                            }
                        },
                        clear:unlink,
                        cancel:function() {
                            editModeRenderer.close({id:'popup'});
                        }
                    });

                    var initialText;
                    var dom = editor.dom;
                    var selection = editor.selection;
                    var selectedElm = selection.getNode();
                    var anchorElm = dom.getParent(selectedElm, 'a[href]');

                    $scope.text = initialText = anchorElm ? (anchorElm.innerText || anchorElm.textContent) : selection.getContent({format: 'text'});
                    $scope.href = anchorElm ? dom.getAttrib(anchorElm, 'href') : '';

                    editModeRenderer.open({
                        id:'popup',
                        template: '<form id="tinymceLinkForm" ng-submit="submit()">' +
                        '<div class="form-group">' +
                        '<label for="tinymceLinkFormLinkField">Address:</label>' +
                        '<input type="text" class="form-control" id="tinymceLinkFormLinkField" placeholder="Address" ng-model="href">' +
                        '</div>' +
                        '<div class="form-group">' +
                        '<label for="tinymceLinkFormTextField">Text:</label>' +
                        '<input type="text" class="form-control" id="tinymceLinkFormTextField" placeholder="Text" ng-model="text">' +
                        '</div>' +
                        '<div class=\"dropdown-menu-buttons\">' +
                        '<button type="button" class="btn btn-danger pull-left" ng-click="clear()">Clear</button>' +
                        '<button type="submit" class="btn btn-primary">Submit</button>' +
                        '<button type="button" class="btn btn-default" ng-click="cancel()">Cancel</button>' +
                        '</div>' +
                        '</form>',
                        scope: $scope
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