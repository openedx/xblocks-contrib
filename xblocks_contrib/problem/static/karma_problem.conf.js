/* eslint-env node */
"use strict";

const path = require("path");
const webpackConfig = require("./webpack.config.js");

delete webpackConfig.entry;
delete webpackConfig.output;

// Detect environment
const isCI = !!process.env.CI;

// Configure FIREFOX_BIN automatically
if (isCI) {
  // On CI (Ubuntu), Firefox is installed via apt-get
  process.env.FIREFOX_BIN = process.env.FIREFOX_BIN || "/usr/bin/firefox";
} else {
  // On macOS, Homebrew usually installs firefox under /Applications
  process.env.FIREFOX_BIN =
    process.env.FIREFOX_BIN ||
    "/Applications/Firefox.app/Contents/MacOS/firefox";
}

module.exports = function (config) {
  const libraryFiles = [
    require.resolve("jquery"),
    path.join(path.dirname(require.resolve("jasmine-jquery")), "jasmine-jquery.js"),
    require.resolve("jasmine-ajax"),
    path.join(path.dirname(require.resolve("underscore/package.json")), "underscore.js"),
    require.resolve("backbone"),
    path.join(path.dirname(require.resolve("sinon/package.json")), "pkg/sinon.js"),
    require.resolve("codemirror"),
  ];

  const legacySourceFiles = [
    "js/vendor/ajax_prefix.js",
    "js/vendor/accessibility_tools.js",
    "js/vendor/jasmine-imagediff.js",
    "js/vendor/jasmine-extensions.js",
    "js/src/xmodule.js",
    "js/src/logger.js",
    "js/src/javascript_loader.js",
    "js/src/collapsible.js",
    "js/src/problem/edit.js",
    "js/src/capa/imageinput.js",
    "js/src/capa/display.js",
    "js/capa/src/jsinput.js",
  ];

  config.set({
    basePath: "",
    frameworks: ["jasmine", "webpack"],
    plugins: [
      "karma-jasmine",
      "karma-webpack",
      "karma-sourcemap-loader",
      "karma-chrome-launcher",
      "karma-firefox-launcher",
      "karma-spec-reporter",
      "karma-junit-reporter",
      "karma-coverage",
    ],
    files: [
      ...libraryFiles,
      "spec/helper.js",
      ...legacySourceFiles,
      "spec/main.js",
      { pattern: "fixtures/**/*.*", included: false, served: true },
      { pattern: "js/capa/fixtures/**/*.*", included: false, served: true },
    ],
    preprocessors: {
      "spec/main.js": ["webpack", "sourcemap"],
      "js/src/**/*.js": ["coverage"],
      "js/capa/src/**/*.js": ["coverage"],
    },
    proxies: {
      "/spec/javascripts/fixtures/": "/base/fixtures/",
    },
    webpack: webpackConfig,
    webpackMiddleware: {
      stats: "errors-only",
    },
    reporters: ["spec", "junit", "coverage"],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: [isCI ? "FirefoxHeadlessCI" : "Firefox"],
    customLaunchers: {
      FirefoxHeadlessCI: {
        base: "Firefox",
        flags: ["-headless"],
      },
    },
    singleRun: true,
    concurrency: Infinity,
    captureTimeout: 120000,
    browserDisconnectTimeout: 20000,
    browserNoActivityTimeout: 120000,
    junitReporter: {
      outputDir: path.join(__dirname, "../../reports"),
      outputFile: "karma-results.xml",
      suite: "javascript",
    },
    coverageReporter: {
      dir: path.join(__dirname, "../../coverage"),
      reporters: [
        { type: "cobertura", file: "cobertura.xml" },
        { type: "text-summary" },
      ],
    },
  });
};
