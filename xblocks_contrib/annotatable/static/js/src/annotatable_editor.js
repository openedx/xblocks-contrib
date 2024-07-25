function XMLEditor(element) {
    class XMLEditingDescriptor {
        constructor(element) {
            this.element = element;
            this.editBox = this.createEditBox();
        }

        createEditBox() {
            const textArea = document.querySelector('.edit-box', this.element);
            const editor = CodeMirror.fromTextArea(textArea, {
                mode: 'xml',
                lineNumbers: true,
                lineWrapping: true,
            });
            return editor;
        }

        save() {
            return {
                data: this.editBox.getValue(),
            };
        }
    }

    return new XMLEditingDescriptor(element);
}
