/**
 * edx-global-loader.js
 *
 * This file is the single source of truth for initializing the global `window.edx`
 * object and attaching necessary utilities from the edx-ui-toolkit.
 * It is used by both the Webpack production build and the Karma test runner.
 */
import HtmlUtils from "edx-ui-toolkit/src/js/utils/html-utils";
import StringUtils from "edx-ui-toolkit/src/js/utils/string-utils";

// 1. Initialize the global `edx` namespace if it doesn't already exist.
window.edx = window.edx || {};

// 2. Attach the imported utilities to the global namespace.
// The legacy code (e.g., capa/display.js) expects these to be here.
window.edx.HtmlUtils = HtmlUtils;
window.edx.StringUtils = StringUtils;
