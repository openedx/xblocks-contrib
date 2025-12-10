/* eslint-env node */
'use strict';

module.exports = function (config) {
  config.set({
    // Base path is the folder containing "js/"
    basePath: './',

    // Test framework
    frameworks: ['jasmine'],

    files: [
      // === VENDOR LIBRARIES (Loaded as classic scripts) ===
      '../../../node_modules/jquery/dist/jquery.js',
      '../../../node_modules/jquery-migrate/dist/jquery-migrate.js',
      '../../../node_modules/jquery-ui-dist/jquery-ui.js',
      '../../../node_modules/underscore/underscore.js',
      '../../../node_modules/backbone/backbone.js',
      '../../../node_modules/jasmine-jquery/lib/jasmine-jquery.js',
      '../../../node_modules/edx-ui-toolkit/js/edx-ui-toolkit.js',

      // CodeMirror from local vendor dir (also loaded as a classic script)
      'js/vendor/CodeMirror/codemirror.js',
      'js/vendor/CodeMirror/addons/**/*.js',

      'js/src/accessibility_tools.js',
      // === TEST HELPERS ===
      'js/spec/helper.js',
      { pattern: 'js/spec/i18n.js', included: true, served: true },


      // === ES MODULES & SPECS ===
      { pattern: 'js/**/*spec.js', type: 'module', included: true },
      { pattern: 'js/**/*.js', type: 'module', included: false },

      // === FIXTURES ===
      // Serve all HTML files from both fixture directories
    { pattern: 'js/fixtures/**/*', watched: true, included: false, served: true },
    { pattern: 'js/capa/fixtures/**/*', watched: true, included: false, served: true }
    ],

    // === PROXIES ===
    // This is the corrected section. It now properly maps the requested
    // URLs to the two different fixture directories on the Karma server.
    proxies: {
      // Rule 1: Handle the nested capa fixtures first (most specific)
      '/spec/javascripts/fixtures/js/capa/fixtures/': '/base/js/capa/fixtures/',

      // Rule 2: Handle all other general fixtures
      '/spec/javascripts/fixtures/': '/base/js/fixtures/',

      // Keep the original proxy for ES module imports
      '/js/': '/base/js/',
    },

    // === PREPROCESSORS ===
    preprocessors: {
      // Exclude vendor and spec files from coverage report
      'js/src/**/*.js': ['coverage'],
      'js/capa/**/*.js': ['coverage']
    },

    // === REPORTERS ===
    reporters: ['progress', 'coverage'],
    coverageReporter: {
      reporters: [
        { type: 'html', dir: 'coverage/' },
        { type: 'text-summary' }
      ]
    },

    // === SERVER SETTINGS ===
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['ChromeHeadless'],
    singleRun: true,
    concurrency: Infinity
  });
};
