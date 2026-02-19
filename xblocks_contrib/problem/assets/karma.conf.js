/* eslint-env node */
'use strict';

const path = require('path');

const uiToolkitRoot = path.dirname(require.resolve('edx-ui-toolkit/package.json'));

module.exports = function (config) {
    config.set({
        basePath: '',

        frameworks: ['jasmine'],

        files: [
            { pattern: require.resolve('jquery/dist/jquery.js'), included: true },
            { pattern: require.resolve('jasmine-jquery/lib/jasmine-jquery.js'), included: true },
            { pattern: require.resolve('underscore/underscore.js'), included: true },

            { pattern: 'static/js/vendor/codemirror-compressed.js', included: true },

            { pattern: path.join(uiToolkitRoot, 'src/js/utils/global-loader.js'), included: true },
            { pattern: path.join(uiToolkitRoot, 'src/js/utils/string-utils.js'), included: true },
            { pattern: path.join(uiToolkitRoot, 'src/js/utils/html-utils.js'), included: true },

            { pattern: 'spec_helpers/ajax_prefix.js', included: true },
            { pattern: 'spec_helpers/i18n.js', included: true },
            { pattern: 'spec_helpers/logger.js', included: true },
            { pattern: 'spec_helpers/accessibility_tools.js', included: true },
            { pattern: 'spec_helpers/add_ajax_prefix.js', included: true },
            { pattern: 'spec_helpers/helper.js', included: true },

            { pattern: 'spec_helpers/jasmine-waituntil.js', included: true },
            { pattern: 'spec_helpers/jasmine-extensions.js', included: true },
            { pattern: 'spec_helpers/jasmine-imagediff.js', included: true },

            { pattern: 'static/js/xmodule.js', included: true },
            { pattern: 'static/js/javascript_loader.js', included: true },
            { pattern: 'static/js/collapsible.js', included: true },
            { pattern: 'static/js/display.js', included: true },
            { pattern: 'static/js/imageinput.js', included: true },
            { pattern: 'static/js/schematic.js', included: true },

            { pattern: '../static/js/**/*.js', included: false },

            { pattern: '../static/js/src/jschannel.js', included: true },
            { pattern: '../static/js/src/jsinput.js', included: true },
            { pattern: '../static/js/src/formula_equation_preview.js', included: true },
            { pattern: '../static/js/symbolic_mathjax_preprocessor.js', included: true },
            { pattern: '../static/js/annotationinput.js', included: true },
            { pattern: '../static/js/choicetextinput.js', included: true },

            { pattern: 'fixtures/**/*.html', included: false, served: true },
            { pattern: 'fixtures/**/*.underscore', included: false, served: true },
            { pattern: '../static/js/fixtures/**/*.html', included: false, served: true },
            { pattern: '../static/js/genex/**/*', included: false, served: true },
            { pattern: '../static/js/protex/**/*', included: false, served: true },

            { pattern: 'spec/*_spec.js', included: true },
            { pattern: '../static/js/spec/*_spec.js', included: true },

            { pattern: 'karma_runner.js', included: true }
        ],

        exclude: [
            '**/public/**',
            '../static/js/jsinput/jsinput_example.js'
        ],
        proxies: {
            '/spec/javascripts/fixturesfixtures/js/capa/fixtures/': '/absolute' + path.resolve(__dirname, '../static/js/fixtures').replace(/\\/g, '/') + '/',
            '/spec/javascripts/fixturesfixtures/js/': '/base/static/js/',
            '/spec/javascripts/fixturesfixtures/': '/base/fixtures/',
        },

        preprocessors: {
            'static/js/**/*.js': ['sourcemap'],
            'spec/**/*.js': ['sourcemap']
        },

        plugins: [
            'karma-jasmine',
            'karma-requirejs',
            'karma-firefox-launcher',
            'karma-sourcemap-loader',
            'karma-coverage',
            require('karma-spec-reporter')
        ],

        reporters: ['spec', 'coverage'],

        coverageReporter: {
            dir: 'coverage/',
            reporters: [
                { type: 'html', subdir: 'report-html' },
                { type: 'lcov', subdir: 'report-lcov' }
            ]
        },

        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: false,
        browsers: ['FirefoxNoUpdates'],

        customLaunchers: {
            FirefoxNoUpdates: {
                base: 'Firefox',
                prefs: {
                    'app.update.auto': false,
                    'app.update.enabled': false
                }
            }
        },

        singleRun: true,
        concurrency: Infinity,
        client: { captureConsole: true }
    });
};
