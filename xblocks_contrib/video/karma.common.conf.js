// Common settings and helpers for setting up Karma config.


/* eslint-env node */
/* globals process */

'use strict';

var path = require('path');
var _ = require('underscore');

var appRoot = __dirname;
var webpackConfig = require(path.join(appRoot, 'webpack.dev.config.js'));

// Files which are needed by all lms/cms suites.
var commonFiles = {
    libraryFiles: [
        {pattern: 'video/static/js/vendor/*.js', included: true},
        {pattern: 'video/edx-ui-toolkit/js/utils/**/*.js', included: true},        
        {pattern: 'video/static/js/utils/*.js', included: true}
    ],
    specFiles: [
        { pattern: 'tests/spec_helpers/*.js', watched: true, served: true, included: true }
    ]
};

/**
 * Customize the name attribute in xml testcase element
 * @param {Object} browser
 * @param {Object} result
 * @return {String}
 */
function junitNameFormatter(browser, result) {
    return result.suite[0] + ': ' + result.description;
}

/**
 * Customize the classname attribute in xml testcase element
 * @param {Object} browser
 * @return {String}
 */
function junitClassNameFormatter(browser) {
    return 'Javascript.' + browser.name.split(' ')[0];
}

/**
 * Return array containing default and user supplied reporters
 * @param {Object} config
 * @return {Array}
 */
function reporters(config) {
    var defaultReporters = ['spec', 'junit', 'kjhtml'];
    if (config.coverage) {
        defaultReporters.push('coverage');
    }
    return defaultReporters;
}

/**
 * Split a filepath into basepath and filename
 * @param {String} filepath
 * @return {Object}
 */
function getBasepathAndFilename(filepath) {
    var file, dir;

    if (!filepath) {
        // these will configure the reporters to create report files relative to this karma config file
        return {
            dir: undefined,
            file: undefined
        };
    }
    file = filepath.replace(/^.*[\\/]/, '');
    dir = filepath.replace(file, '');

    return {
        dir: dir,
        file: file
    };
}

/**
 * Return coverage reporter settings
 * @param {String} config
 * @return {Object}
 */
function coverageSettings(config) {
    var pth = getBasepathAndFilename(config.coveragereportpath);
    return {
        dir: pth.dir,
        subdir: '.',
        includeAllSources: true,
        reporters: [
            {type: 'cobertura', file: pth.file},
            {type: 'text-summary'}
        ]
    };
}

/**
 * Return junit reporter settings
 * @param {String} config
 * @return {Object}
 */
function junitSettings(config) {
    var pth = getBasepathAndFilename(config.junitreportpath);
    return {
        outputDir: pth.dir,
        outputFile: pth.file,
        suite: 'javascript',
        useBrowserName: false,
        nameFormatter: junitNameFormatter,
        classNameFormatter: junitClassNameFormatter
    };
}

/**
 * Sets defaults for each file pattern.
 * RequireJS files are excluded by default.
 * Webpack files are included by default.
 * @param {Object} files
 * @return {Object}
 */
function setDefaults(files) {
    return files.map(function(f) {
        var file = _.isObject(f) ? f : {pattern: f};
        if (!file.included && !file.webpack) {
            file.included = false;
        }
        return file;
    });
}

function getBaseConfig(config, useRequireJs) {
    var getFrameworkFiles = function() {
        var files = [
            '../../node_modules/jquery/dist/jquery.js',
            '../../node_modules/jasmine-core/lib/jasmine-core/jasmine.js',
            './jasmine_stack_trace.js',
            '../../node_modules/karma-jasmine/lib/boot.js',
            '../../node_modules/karma-jasmine/lib/adapter.js',
            '../../node_modules/jasmine-jquery/lib/jasmine-jquery.js',
            '../../node_modules/popper.js/dist/umd/popper.js',
            '../../node_modules/bootstrap/dist/js/bootstrap.js',
            '../../node_modules/underscore/underscore.js',
            '../../node_modules/backbone/backbone.js',
            'tests/i18n.js',
            'tests/spec_helpers/jasmine-waituntil.js'
        ];
        
        return files;
    };

    // Manually prepends the framework files to the karma files array
    // bypassing the karma's framework config. This is necessary if you want
    // to add a library or framework that isn't a karma plugin. e.g. we add jasmine-jquery
    // which isn't a karma plugin. Though a karma framework for jasmine-jquery is available
    // but it's not actively maintained. In future we also wanna add jQuery at the top when
    // we upgrade to jQuery 2
    var initFrameworks = function(files) {
        getFrameworkFiles().reverse().forEach(function(f) {
            files.unshift({
                pattern: path.join(appRoot, f),
                included: true,
                served: true,
                watch: false
            });
        });
    };

    var hostname = 'localhost';
    var port = 9876;
    var customPlugin = {
        'framework:custom': ['factory', initFrameworks]
    };

    initFrameworks.$inject = ['config.files'];

    return {
        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',

        // Proxy configuration to map fixture paths
        proxies: {
            '/base/fixtures/': '/base/tests/fixtures/'
        },

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['custom'],

        plugins: [
            'karma-jasmine',
            'karma-jasmine-html-reporter',
            'karma-requirejs',
            'karma-junit-reporter',
            'karma-coverage',
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-spec-reporter',
            'karma-selenium-webdriver-launcher',
            'karma-webpack',
            'karma-sourcemap-loader',
            customPlugin
        ],

        // list of files to exclude
        exclude: [],

        // karma-reporter
        reporters: reporters(config),

        // Spec Reporter configuration
        specReporter: {
            maxLogLines: 5,
            showSpecTiming: true
        },

        coverageReporter: coverageSettings(config),

        junitReporter: junitSettings(config),

        // web server hostname and port
        hostname: hostname,
        port: port,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        /* possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN
         || config.LOG_INFO || config.LOG_DEBUG */
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['FirefoxNoUpdates'],

        customLaunchers: {
            // Firefox configuration that doesn't perform auto-updates
            FirefoxNoUpdates: {
                base: 'Firefox',
                prefs: {
                    'app.update.auto': false,
                    'app.update.enabled': false,
                    'media.autoplay.default': 0, // allow autoplay
                    'media.autoplay.blocking_policy': 0, // disable autoplay blocking
                    'media.autoplay.allow-extension-background-pages': true,
                    'media.autoplay.enabled.user-gestures-needed': false,
                }
            }
        },
        
        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: config.singleRun,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity,

        browserNoActivityTimeout: 50000,

        client: {
            captureConsole: false
        },

        webpack: webpackConfig,

        webpackMiddleware: {
            watchOptions: {
                poll: true
            }
        }
    };
}

function configure(config, options) {
    var useRequireJs = options.useRequireJs === undefined ? true : options.useRequireJs,
        baseConfig = getBaseConfig(config, useRequireJs),
        files, filesForCoverage, preprocessors;

    if (options.includeCommonFiles) {
        _.forEach(['libraryFiles', 'sourceFiles', 'specFiles', 'fixtureFiles'], function(collectionName) {
            options[collectionName] = _.flatten([commonFiles[collectionName], options[collectionName]]);
        });
    }

    files = _.flatten(
        _.map(
            ['libraryFilesToInclude', 'libraryFiles', 'sourceFiles', 'specFiles', 'fixtureFiles', 'runFiles'],
            function(collectionName) { return options[collectionName] || []; }
        )
    );

    files.unshift(
        {pattern: path.join(appRoot, './jasmine.common.conf.js'), included: true}
    );

    // Karma sets included=true by default.
    // We set it to false by default because RequireJS should be used instead.
    files = setDefaults(files);

    filesForCoverage = _.flatten(
        _.map(
            ['sourceFiles', 'specFiles'],
            function(collectionName) { return options[collectionName]; }
        )
    );

    // If we give symlink paths to Istanbul, coverage for each path gets tracked
    // separately. So we pass absolute paths to the karma-coverage preprocessor.
    preprocessors = _.extend(
        {},
        options.preprocessors
    );

    config.set(_.extend(baseConfig, {
        files: files,
        preprocessors: preprocessors
    }));
}

module.exports = {
    configure: configure,
    appRoot: appRoot
};
