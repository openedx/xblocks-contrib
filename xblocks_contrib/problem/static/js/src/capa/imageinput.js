/**
 * @module ImageInput
 * @description A component for capturing coordinate clicks on an image.
 *
 * When instantiated, it listens for clicks on a specified image element.
 * On click, it updates the position of a crosshair element and records the
 * [x,y] coordinates in a hidden input field.
 */
(() => {
    'use strict';

    class ImageInput {
        /**
         * Initializes the ImageInput component.
         * @param {string} elementId The base ID used for the component's DOM elements.
         */
        constructor(elementId) {
            // Use jQuery and template literals to select and store the elements.
            this.el = $(`#imageinput_${elementId}`);
            this.crossEl = $(`#cross_${elementId}`);
            this.inputEl = $(`#input_${elementId}`);

            // Bind the click handler. Because clickHandler is an arrow function
            // class field, `this` is automatically bound to the instance.
            this.el.on('click', this.clickHandler);
        }

        /**
         * Handles the 'click' event on the image container.
         * @param {jQuery.Event} event The event object from the click.
         */
        clickHandler = (event) => {
            const offset = this.el.offset();

            // Calculate click position using event.offsetX/Y if available,
            // otherwise fall back to manual calculation for compatibility.
            // The nullish coalescing operator `??` provides a concise fallback.
            const posX = event.offsetX ?? (event.pageX - offset.left);
            const posY = event.offsetY ?? (event.pageY - offset.top);

            // Round coordinates for cross-browser consistency and format the result.
            const result = `[${Math.round(posX)},${Math.round(posY)}]`;

            // Reposition the crosshair element to the click location and make it visible.
            // The offset (-15) centers a 30x30px crosshair on the click point.
            this.crossEl.css({
                left: posX - 15,
                top: posY - 15,
                visibility: 'visible'
            });

            // Set the value of the hidden input field.
            this.inputEl.val(result);
        };
    }

    // Attach the class to the window object to make it globally available for instantiation.
    window.ImageInput = ImageInput;

})();