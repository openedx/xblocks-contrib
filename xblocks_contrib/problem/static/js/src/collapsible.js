/**
 * @module Collapsible
 * @description A utility for creating collapsible content sections.
 */
(() => {
    'use strict';

    /**
     * Scans a container element and wires up the functionality for collapsible sections.
     * @param {jQuery} el - The jQuery object for the container element.
     */
    const setCollapsibles = (el) => {
        const linkTop = '<a href="#" class="full full-top">See full output</a>';
        const linkBottom = '<a href="#" class="full full-bottom">See full output</a>';

        // Hide the long-form content initially and add toggle links.
        el.find('.longform').hide();
        el.find('.shortform').append(linkTop, linkBottom);

        // Set up elements with custom open/close link text.
        el.find('.shortform-custom').each((index, elt) => {
            const $elt = $(elt);
            const openText = $elt.data('open-text');
            const closeText = $elt.data('close-text');

            edx.HtmlUtils.append(
                $elt,
                edx.HtmlUtils.joinHtml(
                    edx.HtmlUtils.HTML("<a href='#' class='full-custom'>"),
                    gettext(openText),
                    edx.HtmlUtils.HTML('</a>')
                )
            );

            // Bind the click event with the custom text.
            $elt.find('.full-custom').on('click', (event) => {
                toggleFull(event, openText, closeText);
            });
        });

        // Hide the content of standard collapsible sections.
        el.find('.collapsible header + section').hide();

        // --- Set up global triggers ---
        el.find('.full').on('click', (event) => {
            toggleFull(event, 'See full output', 'Hide output');
        });
        el.find('.collapsible header a').on('click', toggleHint);
    };

    /**
     * Toggles the display of the full text for a collapsible element.
     * @param {Event} event - The click event object.
     * @param {string} openText - The text for the link when the content is hidden.
     * @param {string} closeText - The text for the link when the content is visible.
     */
    const toggleFull = (event, openText, closeText) => {
        event.preventDefault();

        const $target = $(event.target);
        const parent = $target.parent();
        parent.siblings().slideToggle();
        parent.parent().toggleClass('open');

        // Determine the new link text.
        const newText = $target.text() === openText ? closeText : openText;

        // Find the element(s) whose text needs to be updated.
        const $textElements = $target.hasClass('full') ? parent.find('.full') : $target;

        $textElements.text(newText);
    };

    /**
     * Toggles the visibility of a hint's content.
     * @param {Event} event - The click event object.
     */
    const toggleHint = (event) => {
        event.preventDefault();
        const $target = $(event.target);
        $target.parent().siblings().slideToggle();
        $target.parent().parent().toggleClass('open');
    };

    // --- Global Export ---
    // The main object that will be exposed globally.
    const Collapsible = {
        setCollapsibles,
        toggleFull,
        toggleHint,
    };

    // Attach the Collapsible object to the window to make it globally available.
    window.Collapsible = Collapsible;
})();