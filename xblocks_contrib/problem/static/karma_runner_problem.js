/* eslint-env browser, jasmine */
"use strict";

// This is a workaround.
// Some tests may rely on code that initializes inside a jQuery(document).ready() block.
// By default, Karma may start the tests before this code has a chance to run.
// This overrides Karma's default start behavior and adds a small delay.
window.__karma__.loaded = function () {};

setTimeout(function () {
  window.__karma__.start();
}, 500); // 500ms delay, adjust if needed
