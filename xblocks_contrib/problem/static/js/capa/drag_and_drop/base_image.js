/**
 * ES2024 module for creating and managing the base image in a drag-and-drop problem.
 */

/**
 * A simple utility to escape HTML to prevent XSS attacks.
 * @param {string} unsafe - The raw string that may contain HTML characters.
 * @returns {string} - A sanitized string safe for insertion into HTML.
 */
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') {
        return '';
    }
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


/**
 * Initializes the base image for a drag-and-drop problem.
 * It creates the image element, sets up load and error handlers,
 * and appends it to the problem's container.
 * @param {object} state - The shared state object for the problem.
 */
export default function BaseImage(state) {
    // Use a template literal for cleaner and more readable HTML string creation.
    const baseImageContainerHtml = `
      <div class="base_image_container" style="position: relative; margin-bottom: 25px; margin-left: auto; margin-right: auto;"></div>
    `;
    const $baseImageElContainer = $(baseImageContainerHtml);

    // Create the image element with jQuery.
    state.baseImageEl = $('<img />', {
        alt: gettext('Drop target image'), // Assumes gettext() is globally available.
    });

    state.baseImageEl.attr('src', state.config.baseImage);

    // Set up a handler for when the image successfully loads.
    state.baseImageEl.on('load', function() {
        // 'this' refers to the loaded image element.
        $baseImageElContainer.css({
            width: this.width,
            height: this.height,
        });

        state.baseImageEl.appendTo($baseImageElContainer);
        $baseImageElContainer.appendTo(state.containerEl);

        // Prevent the default browser behavior of dragging an image.
        state.baseImageEl.on('mousedown', function(event) {
            event.preventDefault();
        });

        state.baseImageLoaded = true;
    });

    // Set up a handler for when the image fails to load.
    state.baseImageEl.on('error', function() {
        const safeImageSrc = escapeHtml(state.config.baseImage);
        const errorMsg = `<span style="color: red;">ERROR: Image "${safeImageSrc}" was not found!</span>`;

        console.log(`ERROR: Image "${state.config.baseImage}" was not found!`);

        // Display a user-friendly error message inside the container.
        $baseImageElContainer.html(errorMsg);
        $baseImageElContainer.appendTo(state.containerEl);
    });
}
