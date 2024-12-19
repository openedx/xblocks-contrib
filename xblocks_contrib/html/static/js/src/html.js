function HTMLModule(element) {
    const el = $(element);

    JavascriptLoader.executeModuleScripts(el);
    Collapsible.setCollapsibles(el);

    if (typeof MathJax !== 'undefined' && MathJax !== null) {
        MathJax.Hub.Queue(['Typeset', MathJax.Hub, el[0]]);
    }

    if (typeof setupFullScreenModal !== 'undefined' && setupFullScreenModal !== null) {
        setupFullScreenModal();
    }

    this.$ = function(selector) {
        return $(selector, el);
    };
}
