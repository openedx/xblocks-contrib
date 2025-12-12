/**
 * @module JavascriptLoader
 * @description A utility for dynamically loading and executing JavaScript files
 * found within a specific part of the page.
 */
(() => {
    'use strict';

    // Use a Set to track scripts that have been requested, preventing duplicate loads.
    const loadedScripts = new Set();

    /**
     * Finds and executes scripts within a given DOM element.
     * @param {jQuery} el The jQuery object for the container element to scan.
     * @param {function} [callback=()=>{}] A function to call after all scripts have loaded.
     */
    const executeModuleScripts = (el, callback = () => {}) => {
        const placeholders = el.find('.script_placeholder');

        if (placeholders.length === 0) {
            callback();
            return;
        }

        const scriptPromises = placeholders.get().map(placeholder => {
            const src = placeholder.getAttribute('data-src');
            // Immediately remove the placeholder from the DOM.
            placeholder.remove();

            // If the script source is invalid or already loaded, resolve immediately.
            if (!src || loadedScripts.has(src)) {
                return Promise.resolve();
            }

            // Add the script to our set to prevent re-loading it.
            loadedScripts.add(src);

            // Return a new Promise that resolves when the script's 'onload' event fires.
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.setAttribute('src', src);
                script.setAttribute('type', 'text/javascript');
                
                // The Promise resolves successfully on load.
                script.onload = () => resolve();

                // The Promise rejects if the script fails to load.
                script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

                document.head.appendChild(script);
            });
        });

        // Wait for all the script-loading Promises to complete.
        Promise.all(scriptPromises)
            .then(() => {
                // Once all scripts are loaded, execute the final callback.
                callback();
            })
            .catch(error => {
                // Log any errors that occurred during script loading.
                console.error("A script failed to load:", error);
            });
    };

    // --- Global Export ---
    const JavascriptLoader = {
        executeModuleScripts,
    };

    // Attach the JavascriptLoader object to the window to make it globally available.
    window.JavascriptLoader = JavascriptLoader;

})();