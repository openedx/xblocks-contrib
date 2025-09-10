/* global jasmine, $ */
(function () {
  "use strict";

  // Stub for the gettext function used for internationalization.
  window.gettext = function (text) {
    return text;
  };
  beforeAll(function () {
    // i18n shims for tests
    if (typeof window.gettext === "undefined") {
      window.gettext = function (msgid) {
        return msgid;
      };
    }
    if (typeof window.ngettext === "undefined") {
      window.ngettext = function (singular, plural, count) {
        return count === 1 ? singular : plural;
      };
    }
    if (typeof window.interpolate === "undefined") {
      window.interpolate = function (fmt, obj, named) {
        if (named) {
          return fmt.replace(/%\(\w+\)s/g, function (match) {
            return String(obj[match.slice(2, -2)]);
          });
        } else {
          let i = 0;
          return fmt.replace(/%s/g, function () {
            return String(obj[i++]);
          });
        }
      };
    }
  });

  beforeEach(function () {
    // Polyfill for jasmine.util.argsToArray, which was removed after Jasmine 1.x.
    jasmine.util = jasmine.util || {};
    jasmine.util.argsToArray = function (args) {
      return Array.prototype.slice.call(args);
    };

    // The ajax_prefix.js script expects a `Url.prefix` function to exist.
    // We define a simple placeholder for it here for the test environment.
    window.Url = {
      prefix: function (url) {
        return url;
      },
    };

    // Manually run the function that adds `$.postWithPrefix` to jQuery.
    if (window.AjaxPrefix) {
      window.AjaxPrefix.addAjaxPrefix($, window.Url.prefix);
    }
  });

  var origAjax = $.ajax;

  // This function spies on jQuery.ajax and stubs out problem-related endpoints.
  jasmine.stubRequests = function () {
    var spy = $.ajax;
    if (!jasmine.isSpy($.ajax)) {
      spy = spyOn($, "ajax");
    }
    return spy.and.callFake(function (settings) {
      if (settings.url.match(/.+\/problem_get$/)) {
        return settings.success({
          html: window.readFixtures("problem_content.html"),
        });
      } else if (settings.url === "/calculate" || settings.url.match(/.+\/problem_(check|reset|show|save)$/)) {
        return {};
      } else if (settings.url.match(new RegExp(jasmine.getFixtures().fixturesPath + ".+", "g"))) {
        return origAjax(settings);
      }
      return {};
    });
  };

  // Stub various jQuery plugins.
  $.cookie = jasmine.createSpy("jQuery.cookie");
  $.fn.qtip = jasmine.createSpy("jQuery.qtip");
  $.fn.scrollTo = jasmine.createSpy("jQuery.scrollTo");
  jasmine.getFixtures().fixturesPath = "base/fixtures";
})();
