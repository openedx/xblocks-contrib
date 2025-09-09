/* eslint-env node */
'use strict';

const path = require('path');
const webpackConfig = require('./webpack.dev.config.js'); // or webpack.common.config.js

module.exports = function(config) {
  config.set({
    basePath: '',

    // Jasmine for unit testing
    frameworks: ['jasmine'],

    // Entry point: bundle is handled by Webpack
    files: [
      { pattern: './tests/i18n.js', watched: false },
      { pattern: './static/js/dist/video-xblock.js', watched: false },
      { pattern: './tests/**/*.spec.js', watched: false }
    ],

    // specFiles: [
    //   { pattern: 'test/js/**/*.spec.js', included: true }
    // ],

    // Exclude (if needed)
    exclude: [],

    // Preprocess files with Webpack + sourcemaps
    preprocessors: {
      'static/js/dist/video-xblock.js': ['webpack', 'sourcemap'],
      'tests/**/*.spec.js': ['webpack', 'sourcemap']
    },

    webpack: webpackConfig,

    // Reporters
    reporters: ['progress'],

    // Web server port
    port: 9876,

    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,

    // Browsers
    browsers: ['Chrome'],

    singleRun: false,
    concurrency: Infinity,

    // Resolve $/jQuery/_ if ProvidePlugin is kept in webpack config
    webpackMiddleware: {
      stats: 'errors-only'
    }
  });
};
