/**
 * Private helper function to generate a random string salt for unique IDs.
 * @returns {string} A 5-character random string.
 */
function makeSalt() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 5; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

/**
 * Private helper function to handle the global mouse move event. This allows
 * a draggable to continue moving even if the cursor leaves the element itself.
 * @param {object} state - The shared state object.
 * @param {Event} event - The jQuery mousemove event object.
 */
function documentMouseMove(state, event) {
    if (state.currentMovingDraggable) {
        const {
            currentMovingDraggable,
            baseImageEl
        } = state;
        const baseOffset = baseImageEl.offset();

        currentMovingDraggable.iconEl.css({
            left: event.pageX - baseOffset.left - currentMovingDraggable.iconWidth * 0.5 - currentMovingDraggable.iconElLeftOffset,
            top: event.pageY - baseOffset.top - currentMovingDraggable.iconHeight * 0.5,
        });

        if (currentMovingDraggable.labelEl) {
            currentMovingDraggable.labelEl.css({
                left: event.pageX - baseOffset.left - currentMovingDraggable.labelWidth * 0.5 - 9, // Account for padding/border
                top: event.pageY - baseOffset.top + currentMovingDraggable.iconHeight * 0.5 + 5,
            });
        }
    }
}

/**
 * ES2024 factory function to create and initialize the shared state object
 * for a drag and drop problem instance.
 * @param {string} problemId - The unique ID for the problem instance.
 * @returns {object} The state object.
 */
function State(problemId) {
    const state = {
        config: null,
        baseImageEl: null,
        baseImageLoaded: false,
        containerEl: null,
        sliderEl: null,
        problemId: problemId,
        draggables: [],
        numDraggablesInSlider: 0,
        currentMovingDraggable: null,
        targets: [],
        updateArrowOpacity: null,
        uniqueId: 0,
        salt: makeSalt(),
        /**
         * Generates a unique ID within the context of this state instance.
         * @returns {string} A unique ID string.
         */
        getUniqueId: function() {
            this.uniqueId += 1;
            return `${this.salt}_${this.uniqueId.toFixed(0)}`;
        },
    };

    // Attach a single, delegated mousemove event to the document,
    // namespaced to avoid conflicts.
    $(document).on('mousemove.drag_and_drop', (event) => {
        documentMouseMove(state, event);
    });

    return state;
}

export default State;
