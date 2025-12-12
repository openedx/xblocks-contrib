/**
 * @module Logger
 * @description A utility for logging client-side events to a server endpoint and
 * for local event listening between components.
 */
(() => {
    'use strict';

    // A private, module-scoped registry for event listeners.
    // The structure is: { eventType: { element: [callbacks] } }
    const listeners = {};

    /**
     * Sends event data to the server.
     * @private
     * @param {object} data - The payload to send.
     * @param {object} [options={}] - Optional jQuery AJAX settings to override defaults.
     * @returns {jqXHR} - The jQuery AJAX request object.
     */
    const sendRequest = (data, options = {}) => {
        const request = $.ajaxWithPrefix || $.ajax;
        const settings = {
            url: '/event',
            type: 'POST',
            data: data,
            async: true,
            ...options, // Modern object spread replaces $.extend
        };
        return request(settings);
    };

    // --- The public Logger API ---
    const Logger = {
        /**
         * Emits an event, triggering local listeners and sending data to the server.
         * The API for this method is stable and used by external XBlocks.
         * @param {string} eventType - The name of the event (e.g., 'problem_check').
         * @param {object} data - The event payload.
         * @param {HTMLElement|null} element - The element associated with the event, or null.
         * @param {object} [requestOptions] - Optional settings for the server request.
         */
        log(eventType, data, element = null, requestOptions) {
            // Trigger any registered local callbacks first.
            if (Object.hasOwn(listeners, eventType) && Object.hasOwn(listeners[eventType], element)) {
                const callbacks = listeners[eventType][element];
                callbacks.forEach(callback => {
                    try {
                        callback(eventType, data, element);
                    } catch (err) {
                        console.error({ eventType, data, element, error: err });
                    }
                });
            }

            // Always log the event to the server.
            return sendRequest({
                event_type: eventType,
                event: JSON.stringify(data),
                // Use global course_id if available.
                courserun_key: typeof window.$$course_id !== 'undefined' ? window.$$course_id : null,
                page: window.location.href
            }, requestOptions);
        },

        /**
         * Adds a listener for a specific event type.
         * The API for this method is stable and used by external XBlocks.
         * @param {string} eventType - The name of the event to listen for.
         * @param {HTMLElement|null} element - The specific element to scope the listener to. Use null for any element.
         * @param {function} callback - The function to execute when the event is logged.
         */
        listen(eventType, element, callback) {
            listeners[eventType] = listeners[eventType] || {};
            listeners[eventType][element] = listeners[eventType][element] || [];
            listeners[eventType][element].push(callback);
        },

        /**
         * Binds a listener to reliably log an event when the page is closed.
         * The API for this method is stable and used by external XBlocks.
         */
        bind() {
            window.addEventListener('unload', () => {
                const eventData = {
                    event_type: 'page_close',
                    event: '',
                    page: window.location.href,
                };

                // navigator.sendBeacon() is the modern, non-blocking API for sending data on page exit.
                if (navigator.sendBeacon) {
                    const url = '/event';
                    const headers = { type: 'application/json' };
                    const blob = new Blob([JSON.stringify(eventData)], headers);
                    navigator.sendBeacon(url, blob);
                } else {
                    // Fallback to the legacy synchronous GET request for older browsers.
                    sendRequest(eventData, { type: 'GET', async: false });
                }
            });
        }
    };

    // --- Global Export ---
    // Attach the Logger API to the window object to make it globally available.
    window.Logger = Logger;
    
    // log_event exists for backward compatibility and is an alias for Logger.log.
    window.log_event = Logger.log;
})();