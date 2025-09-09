/* eslint-env node */

// Karma config for xmodule suite.
// Docs and troubleshooting tips in common/static/common/js/karma.common.conf.js

'use strict';

var path = require('path');

var configModule = require(path.join(__dirname, 'karma.common.conf.js'));

var options = {

    useRequireJs: false,

    // normalizePathsForCoverageFunc: function(appRoot, pattern) {
    //     return pattern;
    // },

    libraryFilesToInclude: [
        {pattern: 'static/js/vendor/jquery.js', included: true},
        {pattern: 'static/js/utils/ajax_prefix.js', included: true},
        {pattern: 'static/js/utils/add_ajax_prefix.js', included: true},
        {pattern: 'static/js/src/utils/logger.js', included: true}
    ],
    libraryFiles: [],
    sourceFiles: [],
    specFiles: [],

    // fixtureFiles: [
    //     {pattern: 'xblocks_contrib/video/tests/fixtures/*.html', included: false, served: true}
    // ],

    fixtureFiles: [
    {
        pattern: path.join(__dirname, 'tests/fixtures/*.html'),
        included: false,
        served: true,
        watched: true
    }],

    runFiles: [
        {pattern: 'karma_runner_webpack.js', webpack: true}
    ],

    preprocessors: {}
};

options.runFiles
    .filter(function(file) { return file.webpack; })
    .forEach(function(file) {
        options.preprocessors[file.pattern] = ['webpack'];
    });

console.log("Final preprocessors:", options.preprocessors);

module.exports = function(config) {
    configModule.configure(config, options);
};
