/**
 * ES2024 module for creating the main container for a drag-and-drop problem.
 */

/**
 * Creates and inserts the main container element for the problem into the DOM.
 * @param {object} state - The shared state object for the problem instance.
 */
export default function Container(state) {
    // Create the container element using a jQuery object.
    // The dependency on 'edx-ui-toolkit/js/utils/html-utils' has been removed
    // as jQuery can handle DOM insertion directly.
    state.containerEl = $(
        '<div style="clear: both; width: 665px; margin-left: auto; margin-right: auto;"></div>'
    );

    // Insert the newly created container element into the page,
    // right before the problem's input field.
    $('#inputtype_' + state.problemId).before(state.containerEl);
}
