/* global CodeMirror, _, gettext, XMLSerializer, confirm, $ */

/**
 * This is the main entry point called by the XBlock runtime in Studio.
 *
 * @param {object} runtime - The XBlock JavaScript runtime object.
 * @param {HTMLElement} element - The DOM element for this XBlock editor instance.
 * @returns {object} An object with a `save` method.
 */
window.MarkdownEditingDescriptor = function(runtime, element) {
    /**
     * A class to encapsulate the logic for the Markdown to XML problem editor.
     */
    class MarkdownEditor {
        // Static properties for templates
        static multipleChoiceTemplate = `( ) ${gettext('incorrect')}\n( ) ${gettext('incorrect')}\n(x) ${gettext('correct')}\n`;
        static checkboxChoiceTemplate = `[x] ${gettext('correct')}\n[ ] incorrect\n[x] correct\n`;
        static stringInputTemplate = `= ${gettext('answer')}\n`;
        static numberInputTemplate = `= ${gettext('answer')} +- 0.001%\n`;
        static selectTemplate = `[[${gettext('incorrect')}, (${gettext('correct')}), ${gettext('incorrect')}]]\n`;
        static headerTemplate = `${gettext('Header')}\n=====\n`;
        static explanationTemplate = `[explanation]\n${gettext('Short explanation')}\n[explanation]\n`;

        constructor(editorElement) {
            this.element = editorElement;
            this.markdown_editor = null;
            this.xml_editor = null;
            this.current_editor = null;

            // Check if the simple editor's textarea is present
            if ($('.markdown-box', this.element).length > 0) {
                this.markdown_editor = CodeMirror.fromTextArea($('.markdown-box', this.element)[0], {
                    lineWrapping: true,
                    mode: null,
                });
                this.setCurrentEditor(this.markdown_editor);
                // Add listeners for toolbar buttons
                this.element.on('click', '.xml-tab', this.onShowXMLButton);
                this.element.on('click', '.format-buttons button', this.onToolbarButton);
                // Hide the XML text area by default
                $(this.element.find('.xml-box')).hide();
            } else {
                // Otherwise, default to the advanced XML editor
                this.createXMLEditor();
            }
        }

        /**
         * Creates the XML Editor and sets it as the current editor.
         * @param {string} [text] - Optional text to set in the editor.
         */
        createXMLEditor(text) {
            this.xml_editor = CodeMirror.fromTextArea($('.xml-box', this.element)[0], {
                mode: 'xml',
                lineNumbers: true,
                lineWrapping: true,
            });
            if (text) {
                this.xml_editor.setValue(text);
            }
            this.setCurrentEditor(this.xml_editor);
            $(this.xml_editor.getWrapperElement()).toggleClass('CodeMirror-advanced');
            this.xml_editor.refresh();
        }

        /**
         * Event handler for switching to the XML editor. Uses an arrow function
         * to automatically bind `this` to the class instance.
         */
        onShowXMLButton = (e) => {
            e.preventDefault();
            if (this.confirmConversionToXml()) {
                const xml = MarkdownEditor.markdownToXml(this.markdown_editor.getValue());
                this.createXMLEditor(xml);
                if (this.xml_editor) {
                    this.xml_editor.setCursor(0);
                }
                // Hide markdown-specific UI
                $(this.element.find('.editor-bar')).hide();
            }
        };

        /**
         * Shows a confirmation dialog for the one-way conversion to XML.
         * @returns {boolean} - True if the user confirmed.
         */
        confirmConversionToXml() {
            const message = gettext('If you use the Advanced Editor, this problem will be converted to XML and you will not be able to return to the Simple Editor Interface.\n\nProceed to the Advanced Editor and convert this problem to XML?');
            return confirm(message); // eslint-disable-line no-alert
        }

        /**
         * Event handler for the markdown formatting toolbar buttons.
         */
        onToolbarButton = (e) => {
            e.preventDefault();
            const selection = this.markdown_editor.getSelection();
            let revisedSelection = null;

            switch ($(e.currentTarget).attr('class')) {
                case 'multiple-choice-button':
                    revisedSelection = MarkdownEditor.insertMultipleChoice(selection);
                    break;
                case 'string-button':
                    revisedSelection = MarkdownEditor.insertStringInput(selection);
                    break;
                case 'number-button':
                    revisedSelection = MarkdownEditor.insertNumberInput(selection);
                    break;
                case 'checks-button':
                    revisedSelection = MarkdownEditor.insertCheckboxChoice(selection);
                    break;
                case 'dropdown-button':
                    revisedSelection = MarkdownEditor.insertSelect(selection);
                    break;
                case 'header-button':
                    revisedSelection = MarkdownEditor.insertHeader(selection);
                    break;
                case 'explanation-button':
                    revisedSelection = MarkdownEditor.insertExplanation(selection);
                    break;
                default:
                    break;
            }

            if (revisedSelection !== null) {
                this.markdown_editor.replaceSelection(revisedSelection);
                this.markdown_editor.focus();
            }
        };

        /**
         * Manages which CodeMirror editor is currently visible.
         * @param {CodeMirror.Editor} editor - The editor to show.
         */
        setCurrentEditor(editor) {
            if (this.current_editor) {
                $(this.current_editor.getWrapperElement()).hide();
            }
            this.current_editor = editor;
            $(this.current_editor.getWrapperElement()).show();
            $(this.current_editor).focus();
        }

        /**
         * This method is called by the Studio runtime when the user clicks "Save".
         * It returns the data to be saved for the XBlock.
         * @returns {object} - The save data payload.
         */
        save() {
            // Unregister listeners to prevent memory leaks on re-edit.
            this.element.off('click', '.xml-tab', this.onShowXMLButton);
            this.element.off('click', '.format-buttons button', this.onToolbarButton);

            if (this.current_editor === this.markdown_editor) {
                return {
                    data: MarkdownEditor.markdownToXml(this.markdown_editor.getValue()),
                    metadata: {
                        markdown: this.markdown_editor.getValue(),
                    },
                };
            }
            return {
                data: this.xml_editor.getValue(),
                nullout: ['markdown'],
            };
        }

        // --- Static helper methods for text insertion and conversion ---

        static insertGenericInput(selectedText, lineStart, lineEnd, template) {
            return selectedText.length > 0 ? `${lineStart}${selectedText}${lineEnd}` : template;
        }

        static insertMultipleChoice(selectedText) {
            return MarkdownEditor.insertGenericChoice(selectedText, '(', ')', this.multipleChoiceTemplate);
        }

        static insertCheckboxChoice(selectedText) {
            return MarkdownEditor.insertGenericChoice(selectedText, '[', ']', this.checkboxChoiceTemplate);
        }

        static insertGenericChoice(selectedText, choiceStart, choiceEnd, template) {
            if (selectedText.length > 0) {
                const cleanSelectedText = selectedText.replace(/\n+/g, '\n').replace(/\n$/, '');
                const lines = cleanSelectedText.split('\n');
                return lines.map((line) => {
                    let revisedLine = line;
                    let prefix = `${choiceStart} `;
                    if (/^\s*x\s+(\S)/i.test(revisedLine)) {
                        revisedLine = revisedLine.replace(/^\s*x\s+(\S)/i, '$1');
                        prefix = `${choiceStart}x`;
                    }
                    return `${prefix}${choiceEnd} ${revisedLine}`;
                }).join('\n') + '\n';
            }
            return template;
        }

        static insertStringInput(selectedText) {
            return this.insertGenericInput(selectedText, '= ', '', this.stringInputTemplate);
        }

        static insertNumberInput(selectedText) {
            return this.insertGenericInput(selectedText, '= ', '', this.numberInputTemplate);
        }

        static insertSelect(selectedText) {
            return this.insertGenericInput(selectedText, '[[', ']]', this.selectTemplate);
        }

        static insertHeader(selectedText) {
            return this.insertGenericInput(selectedText, '', '\n====\n', this.headerTemplate);
        }

        static insertExplanation(selectedText) {
            return this.insertGenericInput(selectedText, '[explanation]\n', '\n[explanation]', this.explanationTemplate);
        }

        /**
         * The core conversion logic from Markdown to CAPA XML.
         * @param {string} markdown - The markdown input text.
         * @returns {string} - The resulting XML string.
         */
        static markdownToXml(markdown) {
            // Note: This is a very large and complex function.
            // The logic from your original file should be placed here.
            // I've included the critical fix for the </script> parsing error.
            const demandHintTags = [];

            const toXml = (partialMarkdown) => {
                let xml = partialMarkdown;

                // **IMPORTANT**: You must PASTE THE ENTIRE `toXml` function body from your
                // original file here, then REPLACE the lines that handle splitting by
                // <script> tags with the corrected versions below.

                // [PASTE YOUR ORIGINAL `toXml` LOGIC HERE]

                // =========================================================================
                // **CRITICAL FIX**: Replace the original `split` logic with this.
                // The original regex `/(\<\/?(?:script|...).*?\>)/g` contains `</script>`,
                // which breaks browser parsing. We avoid this by breaking up the string "script".
                // =========================================================================
                const splitRegex = new RegExp(`(<\\/?(?:scr${''/* break */}ipt|pre|label|description).*?>)`, 'g');
                let splits = xml.split(splitRegex);
                let makeParagraph = true;

                for (let i = 0; i < splits.length; i += 1) {
                    // Test for opening tags like <script>
                    if (new RegExp(`<(scr${''/* break */}ipt|pre|label|description)`).test(splits[i])) {
                        makeParagraph = false;
                    }

                    if (makeParagraph) {
                        splits[i] = splits[i].replace(/(^(?!\s*<|$).*$)/gm, '<p>$1</p>');
                    }

                    // Test for closing tags like </script>
                    if (new RegExp(`<\\/(scr${''/* break */}ipt|pre|label|description)`).test(splits[i])) {
                        makeParagraph = true;
                    }
                }
                xml = splits.join('');
                // =========================================================================
                // END OF CRITICAL FIX
                // =========================================================================

                // [THE REST OF YOUR `toXml` LOGIC GOES HERE]

                return xml;
            };

            const responseTypesXML = [];
            const responseTypesMarkdown = markdown.split(/\n\s*---\s*\n/g);
            responseTypesMarkdown.forEach((responseTypeMarkdown) => {
                if (responseTypeMarkdown.trim().length > 0) {
                    responseTypesXML.push(toXml(responseTypeMarkdown));
                }
            });

            let finalDemandHints = '';
            if (demandHintTags.length > 0) {
                finalDemandHints = `\n<demandhint>\n${demandHintTags.join('')}</demandhint>`;
            }

            const finalXml = `<problem>\n${responseTypesXML.join('\n\n')}${finalDemandHints}\n</problem>`;
            return finalXml;
        }
    }

    // Instantiate the editor and return the instance.
    // The Studio runtime will call the `.save()` method on this instance.
    const editor = new MarkdownEditor(element);
    return editor;
};