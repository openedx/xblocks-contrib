/**
 * main.js - The single entry point for all Karma tests.
 */

// Import the loader script to set up the `window.edx` object.
import "../js/src/edx-global-loader.js";

// Now, use Webpack's require.context to find and run all spec files.
// All other source code has already been loaded by Karma.
const testsContext = require.context(".", true, /_spec\.js$|spec\.js$/);
testsContext.keys().forEach(testsContext);
