/* eslint-disable quote-props */
function HTMLEditingDescriptor(element) {
    var CUSTOM_FONTS = "Default='Open Sans', Verdana, Arial, Helvetica, sans-serif;";
    var STANDARD_FONTS = 'Andale Mono=andale mono,times;'
        + 'Arial=arial,helvetica,sans-serif;'
        + 'Arial Black=arial black,avant garde;'
        + 'Book Antiqua=book antiqua,palatino;'
        + 'Comic Sans MS=comic sans ms,sans-serif;'
        + 'Courier New=courier new,courier;'
        + 'Georgia=georgia,palatino;'
        + 'Helvetica=helvetica;'
        + 'Impact=impact,chicago;'
        + 'Symbol=symbol;'
        + 'Tahoma=tahoma,arial,helvetica,sans-serif;'
        + 'Terminal=terminal,monaco;'
        + 'Times New Roman=times new roman,times;'
        + 'Trebuchet MS=trebuchet ms,geneva;'
        + 'Verdana=verdana,geneva;'
        + 'Webdings=webdings;'
        + 'Wingdings=wingdings,zapf dingbats';

    var _getFonts = function() {
        return CUSTOM_FONTS + STANDARD_FONTS;
    };

    this.element = element;
    this.base_asset_url = this.element.find('#editor-tab').data('base-asset-url') || null;
    this.editor_choice = this.element.find('#editor-tab').data('editor');
    this.new_image_modal = window.STUDIO_FRONTEND_IN_CONTEXT_IMAGE_SELECTION;

    this.advanced_editor = CodeMirror.fromTextArea($('.edit-box', this.element)[0], {
        mode: 'text/html',
        lineNumbers: true,
        lineWrapping: true
    });

    var tiny_mce_css_links = [];
    if (this.editor_choice === 'visual') {
        this.$advancedEditorWrapper = $(this.advanced_editor.getWrapperElement());
        this.$advancedEditorWrapper.addClass('is-inactive');
        $("link[rel=stylesheet][href*='tinymce']").filter("[href*='content']").each(function() {
            tiny_mce_css_links.push($(this).attr('href'));
        });

        tinyMCE.baseURL = baseUrl + 'js/vendor/tinymce/js/tinymce';
        tinyMCE.suffix = '.min';

        var tinyMceConfig = {
            script_url: baseUrl + 'js/vendor/tinymce/js/tinymce/tinymce.full.min.js',
            font_formats: _getFonts(),
            theme: 'silver',
            skin: 'studio-tmce5',
            schema: 'html5',
            entity_encoding: 'raw',
            convert_urls: false,
            directionality: $('.wrapper-view, .window-wrap').prop('dir'),
            content_css: tiny_mce_css_links.join(', '),
            formats: {
                code: {
                    inline: 'code'
                }
            },
            visual: false,
            plugins: 'lists, link, image, codemirror',
            codemirror: {
                path: baseUrl + 'js/vendor',
                disableFilesMerge: true,
                jsFiles: ['codemirror-compressed.js'],
                cssFiles: ['CodeMirror/codemirror.css']
            },
            image_advtab: true,
            toolbar: 'formatselect fontselect bold italic underline forecolor wrapAsCode '
                + 'alignleft aligncenter alignright alignjustify '
                + 'bullist numlist outdent indent blockquote link unlink '
                + ((this.new_image_modal ? 'insertImage' : 'image') + ' code'),
            block_formats: edx.StringUtils.interpolate(
                gettext('{paragraph}=p;{preformatted}=pre;{heading3}=h3;{heading4}=h4;{heading5}=h5;{heading6}=h6'), {
                    paragraph: gettext('Paragraph'),
                    preformatted: gettext('Preformatted'),
                    heading3: gettext('Heading 3'),
                    heading4: gettext('Heading 4'),
                    heading5: gettext('Heading 5'),
                    heading6: gettext('Heading 6')
                }
            ),
            width: '100%',
            height: '435px',
            menubar: false,
            statusbar: false,
            valid_children: '+body[style]',
            valid_elements: '*[*]',
            extended_valid_elements: '*[*]',
            invalid_elements: '',
            setup: (ed) => {
                ed.ui.registry.addButton('wrapAsCode', {
                    tooltip: gettext('Code block'),
                    icon: 'code-sample',
                    onAction: () => ed.formatter.toggle('code')
                });
                ed.ui.registry.addButton('insertImage', {
                    tooltip: gettext('Insert/Edit Image'),
                    icon: 'image',
                    onAction: this.openImageModal.bind(this)
                });
                this.visualEditor = ed;
                this.imageModal = $('#edit-image-modal #modalWrapper');
                ed.on('SaveImage', this.saveImage.bind(this));
                ed.on('EditImage', this.editImage.bind(this));
                ed.on('SaveLink', this.saveLink.bind(this));
                ed.on('EditLink', this.editLink.bind(this));
                ed.on('ShowCodeEditor', this.showCodeEditor.bind(this));
                ed.on('SaveCodeEditor', this.saveCodeEditor.bind(this));
                $('.action-cancel').on('click', this.cancelButton.bind(this));
                this.imageModal.on('closeModal', this.closeImageModal.bind(this));
                this.imageModal.on('submitForm', this.editImageSubmit.bind(this));
            },
            init_instance_callback: (visualEditor) => {
                visualEditor.setContent(rewriteStaticLinks(visualEditor.getContent({
                    no_events: 1
                }), '/static/', this.base_asset_url));
                this.starting_content = visualEditor.getContent({
                    format: 'raw',
                    no_events: 1
                });
                visualEditor.focus();
            },
            browser_spellcheck: true
        };

        if (typeof process != 'undefined' && process.env.JS_ENV_EXTRA_CONFIG) {
            var tinyMceAdditionalPlugins = process.env.JS_ENV_EXTRA_CONFIG.TINYMCE_ADDITIONAL_PLUGINS;
            if (tinyMceAdditionalPlugins) {
                tinyMceAdditionalPlugins.forEach(function(tinyMcePlugin) {
                    if (tinyMceConfig.plugins.trim()) {
                        tinyMceConfig.plugins += ', ';
                    }
                    tinyMceConfig.plugins += tinyMcePlugin.name;
                    if (tinyMcePlugin.toolbar) {
                        if (tinyMceConfig.toolbar.trim()) {
                            tinyMceConfig.toolbar += ' | ';
                        }
                        tinyMceConfig.toolbar += tinyMcePlugin.name;
                    }
                    if (tinyMcePlugin.extra_settings) {
                        tinyMceConfig[tinyMcePlugin.name] = tinyMcePlugin.extra_settings;
                    }
                });
            }
            var tinyMceConfigOverrides = process.env.JS_ENV_EXTRA_CONFIG.TINYMCE_CONFIG_OVERRIDES;
            if (tinyMceConfigOverrides) {
                Object.assign(tinyMceConfig, tinyMceConfigOverrides);
            }
        }

        this.tiny_mce_textarea = $('.tiny-mce', this.element).tinymce(tinyMceConfig);
        tinymce.addI18n('en', {

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Add to Dictionary': gettext('Add to Dictionary'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Advanced': gettext('Advanced'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Align center': gettext('Align center'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Align left': gettext('Align left'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Align right': gettext('Align right'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Alignment': gettext('Alignment'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Alternative source': gettext('Alternative source'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Anchor': gettext('Anchor'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Anchors': gettext('Anchors'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Author': gettext('Author'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Background color': gettext('Background color'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Blockquote': gettext('Blockquote'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Blocks': gettext('Blocks'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Body': gettext('Body'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Bold': gettext('Bold'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Border color': gettext('Border color'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Border': gettext('Border'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Bottom': gettext('Bottom'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Bullet list': gettext('Bullet list'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Cancel': gettext('Cancel'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Caption': gettext('Caption'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Cell padding': gettext('Cell padding'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Cell properties': gettext('Cell properties'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Cell spacing': gettext('Cell spacing'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Cell type': gettext('Cell type'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Cell': gettext('Cell'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Center': gettext('Center'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Circle': gettext('Circle'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Clear formatting': gettext('Clear formatting'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Close': gettext('Close'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Code block': gettext('Code block'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Code': gettext('Code'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Color': gettext('Color'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Cols': gettext('Cols'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Column group': gettext('Column group'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Column': gettext('Column'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Constrain proportions': gettext('Constrain proportions'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Copy row': gettext('Copy row'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Copy': gettext('Copy'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Could not find the specified string.': gettext('Could not find the specified string.'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Custom color': gettext('Custom color'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Custom...': gettext('Custom...'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Cut row': gettext('Cut row'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Cut': gettext('Cut'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Decrease indent': gettext('Decrease indent'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Default': gettext('Default'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Delete column': gettext('Delete column'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Delete row': gettext('Delete row'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Delete table': gettext('Delete table'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Description': gettext('Description'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Dimensions': gettext('Dimensions'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Disc': gettext('Disc'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Div': gettext('Div'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Document properties': gettext('Document properties'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Edit HTML': gettext('Edit HTML'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Edit': gettext('Edit'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Embed': gettext('Embed'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Emoticons': gettext('Emoticons'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Encoding': gettext('Encoding'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'File': gettext('File'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Find and replace': gettext('Find and replace'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Find next': gettext('Find next'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Find previous': gettext('Find previous'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Find': gettext('Find'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Finish': gettext('Finish'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Font Family': gettext('Font Family'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Font Sizes': gettext('Font Sizes'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Footer': gettext('Footer'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Format': gettext('Format'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Formats': gettext('Formats'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Fullscreen': gettext('Fullscreen'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'General': gettext('General'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'H Align': gettext('H Align'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Header 1': gettext('Header 1'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Header 2': gettext('Header 2'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Header 3': gettext('Header 3'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Header 4': gettext('Header 4'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Header 5': gettext('Header 5'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Header 6': gettext('Header 6'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Header cell': gettext('Header cell'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Header': gettext('Header'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Headers': gettext('Headers'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Heading 1': gettext('Heading 1'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Heading 2': gettext('Heading 2'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Heading 3': gettext('Heading 3'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Heading 4': gettext('Heading 4'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Heading 5': gettext('Heading 5'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Heading 6': gettext('Heading 6'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Headings': gettext('Headings'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Height': gettext('Height'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Horizontal line': gettext('Horizontal line'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Horizontal space': gettext('Horizontal space'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'HTML source code': gettext('HTML source code'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Ignore all': gettext('Ignore all'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Ignore': gettext('Ignore'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Image description': gettext('Image description'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Increase indent': gettext('Increase indent'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Inline': gettext('Inline'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Insert column after': gettext('Insert column after'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Insert column before': gettext('Insert column before'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Insert date/time': gettext('Insert date/time'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Insert image': gettext('Insert image'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Insert link': gettext('Insert link'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Insert row after': gettext('Insert row after'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Insert row before': gettext('Insert row before'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Insert table': gettext('Insert table'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Insert template': gettext('Insert template'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Insert video': gettext('Insert video'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Insert': gettext('Insert'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Insert/edit image': gettext('Insert/edit image'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Insert/edit link': gettext('Insert/edit link'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Insert/edit video': gettext('Insert/edit video'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Italic': gettext('Italic'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Justify': gettext('Justify'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Keywords': gettext('Keywords'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Left to right': gettext('Left to right'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Left': gettext('Left'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Lower Alpha': gettext('Lower Alpha'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Lower Greek': gettext('Lower Greek'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Lower Roman': gettext('Lower Roman'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Match case': gettext('Match case'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Merge cells': gettext('Merge cells'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Middle': gettext('Middle'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Name': gettext('Name'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'New document': gettext('New document'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'New window': gettext('New window'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Next': gettext('Next'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'No color': gettext('No color'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Nonbreaking space': gettext('Nonbreaking space'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'None': gettext('None'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Numbered list': gettext('Numbered list'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Ok': gettext('Ok'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'OK': gettext('OK'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Page break': gettext('Page break'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Paragraph': gettext('Paragraph'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Paste as text': gettext('Paste as text'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Paste is now in plain text mode. Contents will now be pasted as plain text until you toggle this option off.': gettext('Paste is now in plain text mode. Contents will now be pasted as plain text until you toggle this option off.'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Paste row after': gettext('Paste row after'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Paste row before': gettext('Paste row before'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Paste your embed code below:': gettext('Paste your embed code below:'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Paste': gettext('Paste'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Poster': gettext('Poster'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Pre': gettext('Pre'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Prev': gettext('Prev'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Preview': gettext('Preview'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Print': gettext('Print'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Redo': gettext('Redo'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Remove link': gettext('Remove link'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Replace all': gettext('Replace all'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Replace with': gettext('Replace with'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Replace': gettext('Replace'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Restore last draft': gettext('Restore last draft'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help': gettext('Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Right to left': gettext('Right to left'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Right': gettext('Right'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Robots': gettext('Robots'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Row group': gettext('Row group'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Row properties': gettext('Row properties'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Row type': gettext('Row type'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Row': gettext('Row'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Rows': gettext('Rows'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Save': gettext('Save'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Scope': gettext('Scope'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Select all': gettext('Select all'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Show blocks': gettext('Show blocks'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Show invisible characters': gettext('Show invisible characters'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Source code': gettext('Source code'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Source': gettext('Source'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Special character': gettext('Special character'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Spellcheck': gettext('Spellcheck'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Split cell': gettext('Split cell'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Square': gettext('Square'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Start search': gettext('Start search'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Strikethrough': gettext('Strikethrough'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Style': gettext('Style'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Subscript': gettext('Subscript'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Superscript': gettext('Superscript'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Table properties': gettext('Table properties'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Table': gettext('Table'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Target': gettext('Target'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Templates': gettext('Templates'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Text color': gettext('Text color'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Text to display': gettext('Text to display'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'The URL you entered seems to be an email address. Do you want to add the required mailto: prefix?': gettext('The URL you entered seems to be an email address. Do you want to add the required mailto: prefix?'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'The URL you entered seems to be an external link. Do you want to add the required http:// prefix?': gettext('The URL you entered seems to be an external link. Do you want to add the required http:// prefix?'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Title': gettext('Title'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Tools': gettext('Tools'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Top': gettext('Top'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Underline': gettext('Underline'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Undo': gettext('Undo'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Upper Alpha': gettext('Upper Alpha'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Upper Roman': gettext('Upper Roman'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Url': gettext('Url'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'V Align': gettext('V Align'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Vertical space': gettext('Vertical space'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'View': gettext('View'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Visual aids': gettext('Visual aids'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Whole words': gettext('Whole words'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Width': gettext('Width'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'Words: {0}': gettext('Words: {0}'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            'You have unsaved changes are you sure you want to navigate away?': gettext('You have unsaved changes are you sure you want to navigate away?'),

            /*
            Translators: this is a message from the raw HTML editor displayed in the browser when a user needs to edit HTML
             */
            "Your browser doesn't support direct access to the clipboard. Please use the Ctrl+X/C/V keyboard shortcuts instead.": gettext("Your browser doesn't support direct access to the clipboard. Please use the Ctrl+X/C/V keyboard shortcuts instead.")
        });
    }

    this.openImageModal = function() {
        var img = $(this.visualEditor.selection.getNode());
        var imgAttrs = {
            baseAssetUrl: this.base_asset_url
        };
        if (img && img.is('img')) {
            imgAttrs.src = rewriteStaticLinks(img.attr('src'), this.base_asset_url, '/static/');
            imgAttrs.alt = img.attr('alt');
            imgAttrs.width = parseInt(img.attr('width'), 10) || img[0].naturalWidth;
            imgAttrs.height = parseInt(img.attr('height'), 10) || img[0].naturalHeight;
            imgAttrs.style = img.attr('style');
        }
        $('body').addClass('modal-open');
        return this.imageModal[0].dispatchEvent(new CustomEvent('openModal', {
            bubbles: true,
            detail: imgAttrs
        }));
    };

    this.closeImageModal = function() {
        $('body').removeClass('modal-open');
    };

    this.saveImageFromModal = function(data) {
        if (data.src) {
            data.src = rewriteStaticLinks(data.src, '/static/', this.base_asset_url);
        }
        return this.visualEditor.insertContent(this.visualEditor.dom.createHTML('img', data));
    };

    this.editImageSubmit = function(event) {
        if (event.detail) {
            this.saveImageFromModal(event.detail);
        }
        return this.closeImageModal();
    };

    this.editLink = function(data) {
        if (data.href) {
            data.href = rewriteStaticLinks(data.href, this.base_asset_url, '/static/');
        }
    };

    this.saveLink = function(data) {
        if (data.href) {
            data.href = rewriteStaticLinks(data.href, '/static/', this.base_asset_url);
        }
    };

    this.showCodeEditor = function(source) {
        source.content = rewriteStaticLinks(source.content, this.base_asset_url, '/static/');
    };

    this.saveCodeEditor = function(source) {
        source.content = rewriteStaticLinks(source.content, '/static/', this.base_asset_url);
    };

    this.cancelButton = function() {
        this.unbindSubmitEventFromSubmitButton();
    };

    this.unbindSubmitEventFromSubmitButton = function() {
        $('.save-button').off('click');
    };

    this.bindSubmitEventToSubmitButton = function() {
        $('.save-button').on('click', this.submitButton.bind(this));
    };

    this.submitButton = function() {
        if (this.visualEditor) {
            this.visualEditor.save();
        }
        this.advanced_editor.save();
        return this.element.find('form').submit();
    };
}
