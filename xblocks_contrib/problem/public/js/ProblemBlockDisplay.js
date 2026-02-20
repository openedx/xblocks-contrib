/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "../../../node_modules/edx-ui-toolkit/src/js/utils/html-utils.js"
/*!***********************************************************************!*\
  !*** ../../../node_modules/edx-ui-toolkit/src/js/utils/html-utils.js ***!
  \***********************************************************************/
(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
 * Useful functions for dealing with HTML.
 *
 * In particular, these functions default to being safe against
 * Cross Site Scripting (XSS) attacks. You can read more about
 * the best practices for handling proper escaping in the Open edX
 * platform with
 * [Preventing Cross Site Scripting Vulnerabilities][1].
 * [1]: http://edx.readthedocs.org/projects/edx-developer-guide/en/latest/conventions/safe_templates.html
 *
 * @module HtmlUtils
 */
(function(define) {
    'use strict';

    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! underscore */ "underscore"), __webpack_require__(/*! jquery */ "jquery"), __webpack_require__(/*! edx-ui-toolkit/js/utils/string-utils */ "../../../node_modules/edx-ui-toolkit/src/js/utils/string-utils.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function(_, $, StringUtils) {
        var HtmlUtils, ensureHtml, interpolateHtml, joinHtml, HTML, template, setHtml, append, prepend;

        /**
         * Creates an HTML snippet.
         *
         * The intention of an HTML snippet is to communicate that the string
         * it represents contains HTML that has been safely escaped as necessary.
         * As an example, this allows `HtmlUtils.interpolate` to understand that
         * it does not need to further escape this HTML.
         *
         * @param {string} htmlString The string of HTML.
         */
        function HtmlSnippet(htmlString) {
            this.text = htmlString;
        }
        HtmlSnippet.prototype.valueOf = function() {
            return this.text;
        };
        HtmlSnippet.prototype.toString = function() {
            return this.text;
        };

        /**
         * Helper function to create an HTML snippet from a string.
         *
         * The intention of an HTML snippet is to communicate that the string
         * it represents contains HTML that has been safely escaped as necessary.
         *
         * @param {string} htmlString The string of HTML.
         * @returns {HtmlSnippet} An HTML snippet that can be safely rendered.
         */
        HTML = function(htmlString) {
            return new HtmlSnippet(htmlString);
        };

        /**
         * Ensures that the provided text is properly HTML-escaped.
         *
         * If a plain text string is provided, then it will be HTML-escaped and
         * returned as an HtmlSnippet. If the parameter is an HTML snippet
         * then it will be returned directly so as not to double escape it.
         *
         * @param {(string|HtmlSnippet)} html Either a plain text string
         * or an HTML snippet.
         * @returns {HtmlSnippet} A safely escaped HTML snippet.
         */
        ensureHtml = function(html) {
            if (html instanceof HtmlSnippet) {
                return html;
            } else {
                return HTML(_.escape(html));
            }
        };

        /**
         * Returns an HTML snippet by interpolating the provided parameters.
         *
         * The text is provided as a tokenized format string where parameters
         * are indicated via curly braces, e.g. `'Hello {name}'`. These tokens are
         * replaced by the parameter value of the same name.
         *
         * Parameter values will be rendered using their toString methods and then
         * HTML-escaped. The only exception is that instances of the class HTML
         * are rendered without escaping as their contract declares that they are
         * already valid HTML.
         *
         * Example:
         *
         *~~~ javascript
         * HtmlUtils.interpolateHtml(
         *     'You are enrolling in {spanStart}{courseName}{spanEnd}',
         *     {
         *         courseName: 'Rock & Roll 101',
         *         spanStart: HtmlUtils.HTML('<span class="course-title">'),
         *         spanEnd: HtmlUtils.HTML('</span>')
         *     }
         * );
         *~~~
         *
         * returns an HtmlSnippet object whose .toString() method returns:
         *
         *~~~ javascript
         * 'You are enrolling in <span class="course-title">Rock &amp; Roll 101</span>'
         *~~~
         *
         * Note: typically the formatString will need to be internationalized, in which
         * case it will be wrapped with a call to an i18n lookup function. If using
         * the Django i18n library this would look like:
         *
         *~~~ javascript
         * HtmlUtils.interpolateHtml(
         *     gettext('You are enrolling in {spanStart}{courseName}{spanEnd}'),
         *     ...
         * );
         *~~~
         *
         * Since escaping is done by default, this is safe to use for rendering untrusted
         * input within html. For example:
         *
         *~~~ javascript
         * HtmlUtils.interpolateHtml(
         *     'User said {emStart}{comment}{emEnd}',
         *     {
         *         emStart: HtmlUtils.HTML('<em>'),
         *         comment: '<script>alert("test");</script>',
         *         emEnd: HtmlUtils.HTML('</em>'),
         *     }
         * );
         *~~~
         *
         * returns an HtmlSnippet object whose .toString() method returns:
         *
         *~~~ javascript
         * 'User said <em>&lt;script&gt;alert(&quot;test&quot;);&lt;/script&gt;</em>'
         *~~~
         *
         * @param {string} formatString The string to be interpolated.
         * @param {Object} parameters An optional set of parameters for interpolation.
         * @returns {HtmlSnippet} The resulting safely escaped HTML snippet.
         */
        interpolateHtml = function(formatString, parameters) {
            var result = StringUtils.interpolate(
                ensureHtml(formatString).toString(),
                _.mapObject(parameters, ensureHtml)
            );
            return HTML(result);
        };

        /**
         * Joins multiple strings and/or HTML snippets together to produce
         * a single safely escaped HTML snippet.
         *
         * For each item, if it is provided as an HTML snippet then it is joined
         * directly. If the item is a string then it is assumed to be unescaped and
         * so it is first escaped before being joined.
         *
         * @param {...(string|HtmlSnippet)} items The strings and/or HTML snippets
         * to be joined together.
         * @returns {HtmlSnippet} The resulting safely escaped HTML snippet.
         */
        joinHtml = function() {
            var html = '',
                argumentCount = arguments.length,
                i;
            for (i = 0; i < argumentCount; i += 1) {
                html += ensureHtml(arguments[i]);
            }
            return HTML(html);
        };

        /**
         * Returns a function that renders an Underscore template as an HTML snippet.
         *
         * Note: This helper function makes the following context parameters
         * available to the template in addition to those passed in:
         *
         *   - `HtmlUtils`: the `HtmlUtils` helper class
         *   - `StringUtils`: the `StringUtils` helper class
         *
         * @param {string} text
         * @param {object} settings
         * @returns {function} A function that returns a rendered HTML snippet.
         */
        template = function(text, settings) {
            return function(data) {
                var augmentedData = _.extend(
                    {
                        HtmlUtils: HtmlUtils,
                        StringUtils: StringUtils
                    },
                    data || {}
                );
                return HTML(_.template(text, settings)(augmentedData));
            };
        };

        /**
         * A wrapper for `$.html` that safely escapes the provided HTML.
         *
         * If the HTML is provided as an HTML snippet then it is used directly.
         * If the value is a string then it is assumed to be unescaped and
         * so it is first escaped before being used.
         *
         * @param {element} element The element or elements to be updated.
         * @param {(string|HtmlSnippet)} html The desired HTML, either as a
         * plain string or as an HTML snippet.
         * @returns {JQuery} The JQuery object representing the element or elements.
         */
        setHtml = function(element, html) {
            return $(element).html(ensureHtml(html).toString());
        };

        /**
         * A wrapper for `$.append` that safely escapes the provided HTML.
         *
         * If the HTML is provided as an HTML snippet then it is used directly.
         * If the value is a string then it is assumed to be unescaped and
         * so it is first escaped before being used.
         *
         * @param {element} element The element or elements to be updated.
         * @param {(string|HtmlSnippet)} html The desired HTML, either as a
         * plain string or as an HTML snippet.
         * @returns {JQuery} The JQuery object representing the element or elements.
         */
        append = function(element, html) {
            return $(element).append(ensureHtml(html).toString());
        };

        /**
         * A wrapper for `$.prepend` that safely escapes the provided HTML.
         *
         * If the HTML is provided as an HTML snippet then it is used directly.
         * If the value is a string then it is assumed to be unescaped and
         * so it is first escaped before being used.
         *
         * @param {element} element The element or elements to be updated.
         * @param {(string|HtmlSnippet)} html The desired HTML, either as a
         * plain string or as an HTML snippet.
         * @returns {JQuery} The JQuery object representing the element or elements.
         */
        prepend = function(element, html) {
            return $(element).prepend(ensureHtml(html).toString());
        };

        HtmlUtils = {
            append: append,
            ensureHtml: ensureHtml,
            HTML: HTML,
            HtmlSnippet: HtmlSnippet,
            interpolateHtml: interpolateHtml,
            joinHtml: joinHtml,
            prepend: prepend,
            setHtml: setHtml,
            template: template
        };

        return HtmlUtils;
    }).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
}).call(
    this,
    // Pick a define function as follows:
    // 1. Use the default 'define' function if it is available
    // 2. If not, use 'RequireJS.define' if that is available
    // 3. else use the GlobalLoader to install the class into the edx namespace
    // eslint-disable-next-line no-nested-ternary
    __webpack_require__.amdD
);


/***/ },

/***/ "../../../node_modules/edx-ui-toolkit/src/js/utils/string-utils.js"
/*!*************************************************************************!*\
  !*** ../../../node_modules/edx-ui-toolkit/src/js/utils/string-utils.js ***!
  \*************************************************************************/
(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
 * Useful functions for dealing with strings.
 *
 * @module StringUtils
 */
(function(define) {
    'use strict';

    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = (function() {
        var interpolate;

        /**
         * Returns a string created by interpolating the provided parameters.
         *
         * The text is provided as a tokenized format string where parameters are
         * indicated via curly braces, e.g. 'Hello {name}'. These tokens are
         * replaced by the parameter value of the same name.
         *
         * Parameter values will be rendered using their toString methods.
         * **NO** HTML escaping or sanitizing of any form is performed.
         * If HTML escaping is required (for example, if user supplied input is
         * being interpolated), use HtmlUtils.interpolateHtml().
         *
         * Example:
         *
         *~~~ javascript
         * StringUtils.interpolate(
         *     'You are enrolling in {courseName}',
         *     {
         *         courseName: 'Rock & Roll 101',
         *     }
         * );
         *~~~
         *
         * returns:
         *
         *~~~ javascript
         * 'You are enrolling in Rock & Roll 101'
         *~~~
         *
         * Note: typically the formatString will need to be internationalized, in which
         * case it will be wrapped with a call to an i18n lookup function. In Django,
         * this would look like:
         *
         *~~~ javascript
         * StringUtils.interpolate(
         *     gettext('You are enrolling in {courseName}'),
         *     ...
         * );
         *~~~
         *
         * @param {string} formatString The string to be interpolated.
         * @param {Object} parameters An optional set of parameters to the template.
         * @returns {string} A string with the values interpolated.
         */
        interpolate = function(formatString, parameters) {
            return formatString.replace(/{\w+}/g,
                function(parameter) {
                    var parameterName = parameter.slice(1, -1);
                    return String(parameters[parameterName]);
                });
        };

        return {
            interpolate: interpolate
        };
    }).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
}).call(
    this,
    // Pick a define function as follows:
    // 1. Use the default 'define' function if it is available
    // 2. If not, use 'RequireJS.define' if that is available
    // 3. else use the GlobalLoader to install the class into the edx namespace
    // eslint-disable-next-line no-nested-ternary
    __webpack_require__.amdD
);


/***/ },

/***/ "./static/js/vendor/codemirror-compressed.js"
/*!***************************************************!*\
  !*** ./static/js/vendor/codemirror-compressed.js ***!
  \***************************************************/
(module, __unused_webpack_exports, __webpack_require__) {

/* provided dependency */ var CodeMirror = __webpack_require__(/*! codemirror */ "./static/js/vendor/codemirror-compressed.js");
window.CodeMirror = function () {
  "use strict";

  var userAgent = navigator.userAgent;
  var platform = navigator.platform;
  var gecko = /gecko\/\d/i.test(userAgent);
  var ie_upto10 = /MSIE \d/.test(userAgent);
  var ie_11up = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(userAgent);
  var edge = /Edge\/(\d+)/.exec(userAgent);
  var ie = ie_upto10 || ie_11up || edge;
  var ie_version = ie && (ie_upto10 ? document.documentMode || 6 : +(edge || ie_11up)[1]);
  var webkit = !edge && /WebKit\//.test(userAgent);
  var qtwebkit = webkit && /Qt\/\d+\.\d+/.test(userAgent);
  var chrome = !edge && /Chrome\//.test(userAgent);
  var presto = /Opera\//.test(userAgent);
  var safari = /Apple Computer/.test(navigator.vendor);
  var mac_geMountainLion = /Mac OS X 1\d\D([8-9]|\d\d)\D/.test(userAgent);
  var phantom = /PhantomJS/.test(userAgent);
  var ios = !edge && /AppleWebKit/.test(userAgent) && /Mobile\/\w+/.test(userAgent);
  var android = /Android/.test(userAgent);
  var mobile = ios || android || /webOS|BlackBerry|Opera Mini|Opera Mobi|IEMobile/i.test(userAgent);
  var mac = ios || /Mac/.test(platform);
  var chromeOS = /\bCrOS\b/.test(userAgent);
  var windows = /win/i.test(platform);
  var presto_version = presto && userAgent.match(/Version\/(\d*\.\d*)/);
  if (presto_version) {
    presto_version = Number(presto_version[1]);
  }
  if (presto_version && presto_version >= 15) {
    presto = false;
    webkit = true;
  }
  var flipCtrlCmd = mac && (qtwebkit || presto && (presto_version == null || presto_version < 12.11));
  var captureRightClick = gecko || ie && ie_version >= 9;
  function classTest(cls) {
    return new RegExp("(^|\\s)" + cls + "(?:$|\\s)\\s*");
  }
  var rmClass = function (node, cls) {
    var current = node.className;
    var match = classTest(cls).exec(current);
    if (match) {
      var after = current.slice(match.index + match[0].length);
      node.className = current.slice(0, match.index) + (after ? match[1] + after : "");
    }
  };
  function removeChildren(e) {
    for (var count = e.childNodes.length; count > 0; --count) {
      e.removeChild(e.firstChild);
    }
    return e;
  }
  function removeChildrenAndAdd(parent, e) {
    return removeChildren(parent).appendChild(e);
  }
  function elt(tag, content, className, style) {
    var e = document.createElement(tag);
    if (className) {
      e.className = className;
    }
    if (style) {
      e.style.cssText = style;
    }
    if (typeof content == "string") {
      e.appendChild(document.createTextNode(content));
    } else if (content) {
      for (var i = 0; i < content.length; ++i) {
        e.appendChild(content[i]);
      }
    }
    return e;
  }
  function eltP(tag, content, className, style) {
    var e = elt(tag, content, className, style);
    e.setAttribute("role", "presentation");
    return e;
  }
  var range;
  if (document.createRange) {
    range = function (node, start, end, endNode) {
      var r = document.createRange();
      r.setEnd(endNode || node, end);
      r.setStart(node, start);
      return r;
    };
  } else {
    range = function (node, start, end) {
      var r = document.body.createTextRange();
      try {
        r.moveToElementText(node.parentNode);
      } catch (e) {
        return r;
      }
      r.collapse(true);
      r.moveEnd("character", end);
      r.moveStart("character", start);
      return r;
    };
  }
  function contains(parent, child) {
    if (child.nodeType == 3) {
      child = child.parentNode;
    }
    if (parent.contains) {
      return parent.contains(child);
    }
    do {
      if (child.nodeType == 11) {
        child = child.host;
      }
      if (child == parent) {
        return true;
      }
    } while (child = child.parentNode);
  }
  function activeElt() {
    var activeElement;
    try {
      activeElement = document.activeElement;
    } catch (e) {
      activeElement = document.body || null;
    }
    while (activeElement && activeElement.shadowRoot && activeElement.shadowRoot.activeElement) {
      activeElement = activeElement.shadowRoot.activeElement;
    }
    return activeElement;
  }
  function addClass(node, cls) {
    var current = node.className;
    if (!classTest(cls).test(current)) {
      node.className += (current ? " " : "") + cls;
    }
  }
  function joinClasses(a, b) {
    var as = a.split(" ");
    for (var i = 0; i < as.length; i++) {
      if (as[i] && !classTest(as[i]).test(b)) {
        b += " " + as[i];
      }
    }
    return b;
  }
  var selectInput = function (node) {
    node.select();
  };
  if (ios) {
    selectInput = function (node) {
      node.selectionStart = 0;
      node.selectionEnd = node.value.length;
    };
  } else if (ie) {
    selectInput = function (node) {
      try {
        node.select();
      } catch (_e) {}
    };
  }
  function bind(f) {
    var args = Array.prototype.slice.call(arguments, 1);
    return function () {
      return f.apply(null, args);
    };
  }
  function copyObj(obj, target, overwrite) {
    if (!target) {
      target = {};
    }
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop) && (overwrite !== false || !target.hasOwnProperty(prop))) {
        target[prop] = obj[prop];
      }
    }
    return target;
  }
  function countColumn(string, end, tabSize, startIndex, startValue) {
    if (end == null) {
      end = string.search(/[^\s\u00a0]/);
      if (end == -1) {
        end = string.length;
      }
    }
    for (var i = startIndex || 0, n = startValue || 0;;) {
      var nextTab = string.indexOf("\t", i);
      if (nextTab < 0 || nextTab >= end) {
        return n + (end - i);
      }
      n += nextTab - i;
      n += tabSize - n % tabSize;
      i = nextTab + 1;
    }
  }
  var Delayed = function () {
    this.id = null;
    this.f = null;
    this.time = 0;
    this.handler = bind(this.onTimeout, this);
  };
  Delayed.prototype.onTimeout = function (self) {
    self.id = 0;
    if (self.time <= +new Date()) {
      self.f();
    } else {
      setTimeout(self.handler, self.time - +new Date());
    }
  };
  Delayed.prototype.set = function (ms, f) {
    this.f = f;
    var time = +new Date() + ms;
    if (!this.id || time < this.time) {
      clearTimeout(this.id);
      this.id = setTimeout(this.handler, ms);
      this.time = time;
    }
  };
  function indexOf(array, elt) {
    for (var i = 0; i < array.length; ++i) {
      if (array[i] == elt) {
        return i;
      }
    }
    return -1;
  }
  var scrollerGap = 30;
  var Pass = {
    toString: function () {
      return "CodeMirror.Pass";
    }
  };
  var sel_dontScroll = {
      scroll: false
    },
    sel_mouse = {
      origin: "*mouse"
    },
    sel_move = {
      origin: "+move"
    };
  function findColumn(string, goal, tabSize) {
    for (var pos = 0, col = 0;;) {
      var nextTab = string.indexOf("\t", pos);
      if (nextTab == -1) {
        nextTab = string.length;
      }
      var skipped = nextTab - pos;
      if (nextTab == string.length || col + skipped >= goal) {
        return pos + Math.min(skipped, goal - col);
      }
      col += nextTab - pos;
      col += tabSize - col % tabSize;
      pos = nextTab + 1;
      if (col >= goal) {
        return pos;
      }
    }
  }
  var spaceStrs = [""];
  function spaceStr(n) {
    while (spaceStrs.length <= n) {
      spaceStrs.push(lst(spaceStrs) + " ");
    }
    return spaceStrs[n];
  }
  function lst(arr) {
    return arr[arr.length - 1];
  }
  function map(array, f) {
    var out = [];
    for (var i = 0; i < array.length; i++) {
      out[i] = f(array[i], i);
    }
    return out;
  }
  function insertSorted(array, value, score) {
    var pos = 0,
      priority = score(value);
    while (pos < array.length && score(array[pos]) <= priority) {
      pos++;
    }
    array.splice(pos, 0, value);
  }
  function nothing() {}
  function createObj(base, props) {
    var inst;
    if (Object.create) {
      inst = Object.create(base);
    } else {
      nothing.prototype = base;
      inst = new nothing();
    }
    if (props) {
      copyObj(props, inst);
    }
    return inst;
  }
  var nonASCIISingleCaseWordChar = /[\u00df\u0587\u0590-\u05f4\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/;
  function isWordCharBasic(ch) {
    return /\w/.test(ch) || ch > "" && (ch.toUpperCase() != ch.toLowerCase() || nonASCIISingleCaseWordChar.test(ch));
  }
  function isWordChar(ch, helper) {
    if (!helper) {
      return isWordCharBasic(ch);
    }
    if (helper.source.indexOf("\\w") > -1 && isWordCharBasic(ch)) {
      return true;
    }
    return helper.test(ch);
  }
  function isEmpty(obj) {
    for (var n in obj) {
      if (obj.hasOwnProperty(n) && obj[n]) {
        return false;
      }
    }
    return true;
  }
  var extendingChars = /[\u0300-\u036f\u0483-\u0489\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u065e\u0670\u06d6-\u06dc\u06de-\u06e4\u06e7\u06e8\u06ea-\u06ed\u0711\u0730-\u074a\u07a6-\u07b0\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0900-\u0902\u093c\u0941-\u0948\u094d\u0951-\u0955\u0962\u0963\u0981\u09bc\u09be\u09c1-\u09c4\u09cd\u09d7\u09e2\u09e3\u0a01\u0a02\u0a3c\u0a41\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a70\u0a71\u0a75\u0a81\u0a82\u0abc\u0ac1-\u0ac5\u0ac7\u0ac8\u0acd\u0ae2\u0ae3\u0b01\u0b3c\u0b3e\u0b3f\u0b41-\u0b44\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b82\u0bbe\u0bc0\u0bcd\u0bd7\u0c3e-\u0c40\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0cbc\u0cbf\u0cc2\u0cc6\u0ccc\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0d3e\u0d41-\u0d44\u0d4d\u0d57\u0d62\u0d63\u0dca\u0dcf\u0dd2-\u0dd4\u0dd6\u0ddf\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0f18\u0f19\u0f35\u0f37\u0f39\u0f71-\u0f7e\u0f80-\u0f84\u0f86\u0f87\u0f90-\u0f97\u0f99-\u0fbc\u0fc6\u102d-\u1030\u1032-\u1037\u1039\u103a\u103d\u103e\u1058\u1059\u105e-\u1060\u1071-\u1074\u1082\u1085\u1086\u108d\u109d\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b7-\u17bd\u17c6\u17c9-\u17d3\u17dd\u180b-\u180d\u18a9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193b\u1a17\u1a18\u1a56\u1a58-\u1a5e\u1a60\u1a62\u1a65-\u1a6c\u1a73-\u1a7c\u1a7f\u1b00-\u1b03\u1b34\u1b36-\u1b3a\u1b3c\u1b42\u1b6b-\u1b73\u1b80\u1b81\u1ba2-\u1ba5\u1ba8\u1ba9\u1c2c-\u1c33\u1c36\u1c37\u1cd0-\u1cd2\u1cd4-\u1ce0\u1ce2-\u1ce8\u1ced\u1dc0-\u1de6\u1dfd-\u1dff\u200c\u200d\u20d0-\u20f0\u2cef-\u2cf1\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua66f-\ua672\ua67c\ua67d\ua6f0\ua6f1\ua802\ua806\ua80b\ua825\ua826\ua8c4\ua8e0-\ua8f1\ua926-\ua92d\ua947-\ua951\ua980-\ua982\ua9b3\ua9b6-\ua9b9\ua9bc\uaa29-\uaa2e\uaa31\uaa32\uaa35\uaa36\uaa43\uaa4c\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uabe5\uabe8\uabed\udc00-\udfff\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\uff9e\uff9f]/;
  function isExtendingChar(ch) {
    return ch.charCodeAt(0) >= 768 && extendingChars.test(ch);
  }
  function skipExtendingChars(str, pos, dir) {
    while ((dir < 0 ? pos > 0 : pos < str.length) && isExtendingChar(str.charAt(pos))) {
      pos += dir;
    }
    return pos;
  }
  function findFirst(pred, from, to) {
    var dir = from > to ? -1 : 1;
    for (;;) {
      if (from == to) {
        return from;
      }
      var midF = (from + to) / 2,
        mid = dir < 0 ? Math.ceil(midF) : Math.floor(midF);
      if (mid == from) {
        return pred(mid) ? from : to;
      }
      if (pred(mid)) {
        to = mid;
      } else {
        from = mid + dir;
      }
    }
  }
  function iterateBidiSections(order, from, to, f) {
    if (!order) {
      return f(from, to, "ltr", 0);
    }
    var found = false;
    for (var i = 0; i < order.length; ++i) {
      var part = order[i];
      if (part.from < to && part.to > from || from == to && part.to == from) {
        f(Math.max(part.from, from), Math.min(part.to, to), part.level == 1 ? "rtl" : "ltr", i);
        found = true;
      }
    }
    if (!found) {
      f(from, to, "ltr");
    }
  }
  var bidiOther = null;
  function getBidiPartAt(order, ch, sticky) {
    var found;
    bidiOther = null;
    for (var i = 0; i < order.length; ++i) {
      var cur = order[i];
      if (cur.from < ch && cur.to > ch) {
        return i;
      }
      if (cur.to == ch) {
        if (cur.from != cur.to && sticky == "before") {
          found = i;
        } else {
          bidiOther = i;
        }
      }
      if (cur.from == ch) {
        if (cur.from != cur.to && sticky != "before") {
          found = i;
        } else {
          bidiOther = i;
        }
      }
    }
    return found != null ? found : bidiOther;
  }
  var bidiOrdering = function () {
    var lowTypes = "bbbbbbbbbtstwsbbbbbbbbbbbbbbssstwNN%%%NNNNNN,N,N1111111111NNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNbbbbbbsbbbbbbbbbbbbbbbbbbbbbbbbbb,N%%%%NNNNLNNNNN%%11NLNNN1LNNNNNLLLLLLLLLLLLLLLLLLLLLLLNLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLN";
    var arabicTypes = "nnnnnnNNr%%r,rNNmmmmmmmmmmmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmmmmmmmmnnnnnnnnnn%nnrrrmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmnNmmmmmmrrmmNmmmmrr1111111111";
    function charType(code) {
      if (code <= 247) {
        return lowTypes.charAt(code);
      } else if (1424 <= code && code <= 1524) {
        return "R";
      } else if (1536 <= code && code <= 1785) {
        return arabicTypes.charAt(code - 1536);
      } else if (1774 <= code && code <= 2220) {
        return "r";
      } else if (8192 <= code && code <= 8203) {
        return "w";
      } else if (code == 8204) {
        return "b";
      } else {
        return "L";
      }
    }
    var bidiRE = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;
    var isNeutral = /[stwN]/,
      isStrong = /[LRr]/,
      countsAsLeft = /[Lb1n]/,
      countsAsNum = /[1n]/;
    function BidiSpan(level, from, to) {
      this.level = level;
      this.from = from;
      this.to = to;
    }
    return function (str, direction) {
      var outerType = direction == "ltr" ? "L" : "R";
      if (str.length == 0 || direction == "ltr" && !bidiRE.test(str)) {
        return false;
      }
      var len = str.length,
        types = [];
      for (var i = 0; i < len; ++i) {
        types.push(charType(str.charCodeAt(i)));
      }
      for (var i$1 = 0, prev = outerType; i$1 < len; ++i$1) {
        var type = types[i$1];
        if (type == "m") {
          types[i$1] = prev;
        } else {
          prev = type;
        }
      }
      for (var i$2 = 0, cur = outerType; i$2 < len; ++i$2) {
        var type$1 = types[i$2];
        if (type$1 == "1" && cur == "r") {
          types[i$2] = "n";
        } else if (isStrong.test(type$1)) {
          cur = type$1;
          if (type$1 == "r") {
            types[i$2] = "R";
          }
        }
      }
      for (var i$3 = 1, prev$1 = types[0]; i$3 < len - 1; ++i$3) {
        var type$2 = types[i$3];
        if (type$2 == "+" && prev$1 == "1" && types[i$3 + 1] == "1") {
          types[i$3] = "1";
        } else if (type$2 == "," && prev$1 == types[i$3 + 1] && (prev$1 == "1" || prev$1 == "n")) {
          types[i$3] = prev$1;
        }
        prev$1 = type$2;
      }
      for (var i$4 = 0; i$4 < len; ++i$4) {
        var type$3 = types[i$4];
        if (type$3 == ",") {
          types[i$4] = "N";
        } else if (type$3 == "%") {
          var end = void 0;
          for (end = i$4 + 1; end < len && types[end] == "%"; ++end) {}
          var replace = i$4 && types[i$4 - 1] == "!" || end < len && types[end] == "1" ? "1" : "N";
          for (var j = i$4; j < end; ++j) {
            types[j] = replace;
          }
          i$4 = end - 1;
        }
      }
      for (var i$5 = 0, cur$1 = outerType; i$5 < len; ++i$5) {
        var type$4 = types[i$5];
        if (cur$1 == "L" && type$4 == "1") {
          types[i$5] = "L";
        } else if (isStrong.test(type$4)) {
          cur$1 = type$4;
        }
      }
      for (var i$6 = 0; i$6 < len; ++i$6) {
        if (isNeutral.test(types[i$6])) {
          var end$1 = void 0;
          for (end$1 = i$6 + 1; end$1 < len && isNeutral.test(types[end$1]); ++end$1) {}
          var before = (i$6 ? types[i$6 - 1] : outerType) == "L";
          var after = (end$1 < len ? types[end$1] : outerType) == "L";
          var replace$1 = before == after ? before ? "L" : "R" : outerType;
          for (var j$1 = i$6; j$1 < end$1; ++j$1) {
            types[j$1] = replace$1;
          }
          i$6 = end$1 - 1;
        }
      }
      var order = [],
        m;
      for (var i$7 = 0; i$7 < len;) {
        if (countsAsLeft.test(types[i$7])) {
          var start = i$7;
          for (++i$7; i$7 < len && countsAsLeft.test(types[i$7]); ++i$7) {}
          order.push(new BidiSpan(0, start, i$7));
        } else {
          var pos = i$7,
            at = order.length;
          for (++i$7; i$7 < len && types[i$7] != "L"; ++i$7) {}
          for (var j$2 = pos; j$2 < i$7;) {
            if (countsAsNum.test(types[j$2])) {
              if (pos < j$2) {
                order.splice(at, 0, new BidiSpan(1, pos, j$2));
              }
              var nstart = j$2;
              for (++j$2; j$2 < i$7 && countsAsNum.test(types[j$2]); ++j$2) {}
              order.splice(at, 0, new BidiSpan(2, nstart, j$2));
              pos = j$2;
            } else {
              ++j$2;
            }
          }
          if (pos < i$7) {
            order.splice(at, 0, new BidiSpan(1, pos, i$7));
          }
        }
      }
      if (direction == "ltr") {
        if (order[0].level == 1 && (m = str.match(/^\s+/))) {
          order[0].from = m[0].length;
          order.unshift(new BidiSpan(0, 0, m[0].length));
        }
        if (lst(order).level == 1 && (m = str.match(/\s+$/))) {
          lst(order).to -= m[0].length;
          order.push(new BidiSpan(0, len - m[0].length, len));
        }
      }
      return direction == "rtl" ? order.reverse() : order;
    };
  }();
  function getOrder(line, direction) {
    var order = line.order;
    if (order == null) {
      order = line.order = bidiOrdering(line.text, direction);
    }
    return order;
  }
  var noHandlers = [];
  var on = function (emitter, type, f) {
    if (emitter.addEventListener) {
      emitter.addEventListener(type, f, false);
    } else if (emitter.attachEvent) {
      emitter.attachEvent("on" + type, f);
    } else {
      var map$$1 = emitter._handlers || (emitter._handlers = {});
      map$$1[type] = (map$$1[type] || noHandlers).concat(f);
    }
  };
  function getHandlers(emitter, type) {
    return emitter._handlers && emitter._handlers[type] || noHandlers;
  }
  function off(emitter, type, f) {
    if (emitter.removeEventListener) {
      emitter.removeEventListener(type, f, false);
    } else if (emitter.detachEvent) {
      emitter.detachEvent("on" + type, f);
    } else {
      var map$$1 = emitter._handlers,
        arr = map$$1 && map$$1[type];
      if (arr) {
        var index = indexOf(arr, f);
        if (index > -1) {
          map$$1[type] = arr.slice(0, index).concat(arr.slice(index + 1));
        }
      }
    }
  }
  function signal(emitter, type) {
    var handlers = getHandlers(emitter, type);
    if (!handlers.length) {
      return;
    }
    var args = Array.prototype.slice.call(arguments, 2);
    for (var i = 0; i < handlers.length; ++i) {
      handlers[i].apply(null, args);
    }
  }
  function signalDOMEvent(cm, e, override) {
    if (typeof e == "string") {
      e = {
        type: e,
        preventDefault: function () {
          this.defaultPrevented = true;
        }
      };
    }
    signal(cm, override || e.type, cm, e);
    return e_defaultPrevented(e) || e.codemirrorIgnore;
  }
  function signalCursorActivity(cm) {
    var arr = cm._handlers && cm._handlers.cursorActivity;
    if (!arr) {
      return;
    }
    var set = cm.curOp.cursorActivityHandlers || (cm.curOp.cursorActivityHandlers = []);
    for (var i = 0; i < arr.length; ++i) {
      if (indexOf(set, arr[i]) == -1) {
        set.push(arr[i]);
      }
    }
  }
  function hasHandler(emitter, type) {
    return getHandlers(emitter, type).length > 0;
  }
  function eventMixin(ctor) {
    ctor.prototype.on = function (type, f) {
      on(this, type, f);
    };
    ctor.prototype.off = function (type, f) {
      off(this, type, f);
    };
  }
  function e_preventDefault(e) {
    if (e.preventDefault) {
      e.preventDefault();
    } else {
      e.returnValue = false;
    }
  }
  function e_stopPropagation(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    } else {
      e.cancelBubble = true;
    }
  }
  function e_defaultPrevented(e) {
    return e.defaultPrevented != null ? e.defaultPrevented : e.returnValue == false;
  }
  function e_stop(e) {
    e_preventDefault(e);
    e_stopPropagation(e);
  }
  function e_target(e) {
    return e.target || e.srcElement;
  }
  function e_button(e) {
    var b = e.which;
    if (b == null) {
      if (e.button & 1) {
        b = 1;
      } else if (e.button & 2) {
        b = 3;
      } else if (e.button & 4) {
        b = 2;
      }
    }
    if (mac && e.ctrlKey && b == 1) {
      b = 3;
    }
    return b;
  }
  var dragAndDrop = function () {
    if (ie && ie_version < 9) {
      return false;
    }
    var div = elt("div");
    return "draggable" in div || "dragDrop" in div;
  }();
  var zwspSupported;
  function zeroWidthElement(measure) {
    if (zwspSupported == null) {
      var test = elt("span", "​");
      removeChildrenAndAdd(measure, elt("span", [test, document.createTextNode("x")]));
      if (measure.firstChild.offsetHeight != 0) {
        zwspSupported = test.offsetWidth <= 1 && test.offsetHeight > 2 && !(ie && ie_version < 8);
      }
    }
    var node = zwspSupported ? elt("span", "​") : elt("span", " ", null, "display: inline-block; width: 1px; margin-right: -1px");
    node.setAttribute("cm-text", "");
    return node;
  }
  var badBidiRects;
  function hasBadBidiRects(measure) {
    if (badBidiRects != null) {
      return badBidiRects;
    }
    var txt = removeChildrenAndAdd(measure, document.createTextNode("AخA"));
    var r0 = range(txt, 0, 1).getBoundingClientRect();
    var r1 = range(txt, 1, 2).getBoundingClientRect();
    removeChildren(measure);
    if (!r0 || r0.left == r0.right) {
      return false;
    }
    return badBidiRects = r1.right - r0.right < 3;
  }
  var splitLinesAuto = "\n\nb".split(/\n/).length != 3 ? function (string) {
    var pos = 0,
      result = [],
      l = string.length;
    while (pos <= l) {
      var nl = string.indexOf("\n", pos);
      if (nl == -1) {
        nl = string.length;
      }
      var line = string.slice(pos, string.charAt(nl - 1) == "\r" ? nl - 1 : nl);
      var rt = line.indexOf("\r");
      if (rt != -1) {
        result.push(line.slice(0, rt));
        pos += rt + 1;
      } else {
        result.push(line);
        pos = nl + 1;
      }
    }
    return result;
  } : function (string) {
    return string.split(/\r\n?|\n/);
  };
  var hasSelection = window.getSelection ? function (te) {
    try {
      return te.selectionStart != te.selectionEnd;
    } catch (e) {
      return false;
    }
  } : function (te) {
    var range$$1;
    try {
      range$$1 = te.ownerDocument.selection.createRange();
    } catch (e) {}
    if (!range$$1 || range$$1.parentElement() != te) {
      return false;
    }
    return range$$1.compareEndPoints("StartToEnd", range$$1) != 0;
  };
  var hasCopyEvent = function () {
    var e = elt("div");
    if ("oncopy" in e) {
      return true;
    }
    e.setAttribute("oncopy", "return;");
    return typeof e.oncopy == "function";
  }();
  var badZoomedRects = null;
  function hasBadZoomedRects(measure) {
    if (badZoomedRects != null) {
      return badZoomedRects;
    }
    var node = removeChildrenAndAdd(measure, elt("span", "x"));
    var normal = node.getBoundingClientRect();
    var fromRange = range(node, 0, 1).getBoundingClientRect();
    return badZoomedRects = Math.abs(normal.left - fromRange.left) > 1;
  }
  var modes = {},
    mimeModes = {};
  function defineMode(name, mode) {
    if (arguments.length > 2) {
      mode.dependencies = Array.prototype.slice.call(arguments, 2);
    }
    modes[name] = mode;
  }
  function defineMIME(mime, spec) {
    mimeModes[mime] = spec;
  }
  function resolveMode(spec) {
    if (typeof spec == "string" && mimeModes.hasOwnProperty(spec)) {
      spec = mimeModes[spec];
    } else if (spec && typeof spec.name == "string" && mimeModes.hasOwnProperty(spec.name)) {
      var found = mimeModes[spec.name];
      if (typeof found == "string") {
        found = {
          name: found
        };
      }
      spec = createObj(found, spec);
      spec.name = found.name;
    } else if (typeof spec == "string" && /^[\w\-]+\/[\w\-]+\+xml$/.test(spec)) {
      return resolveMode("application/xml");
    } else if (typeof spec == "string" && /^[\w\-]+\/[\w\-]+\+json$/.test(spec)) {
      return resolveMode("application/json");
    }
    if (typeof spec == "string") {
      return {
        name: spec
      };
    } else {
      return spec || {
        name: "null"
      };
    }
  }
  function getMode(options, spec) {
    spec = resolveMode(spec);
    var mfactory = modes[spec.name];
    if (!mfactory) {
      return getMode(options, "text/plain");
    }
    var modeObj = mfactory(options, spec);
    if (modeExtensions.hasOwnProperty(spec.name)) {
      var exts = modeExtensions[spec.name];
      for (var prop in exts) {
        if (!exts.hasOwnProperty(prop)) {
          continue;
        }
        if (modeObj.hasOwnProperty(prop)) {
          modeObj["_" + prop] = modeObj[prop];
        }
        modeObj[prop] = exts[prop];
      }
    }
    modeObj.name = spec.name;
    if (spec.helperType) {
      modeObj.helperType = spec.helperType;
    }
    if (spec.modeProps) {
      for (var prop$1 in spec.modeProps) {
        modeObj[prop$1] = spec.modeProps[prop$1];
      }
    }
    return modeObj;
  }
  var modeExtensions = {};
  function extendMode(mode, properties) {
    var exts = modeExtensions.hasOwnProperty(mode) ? modeExtensions[mode] : modeExtensions[mode] = {};
    copyObj(properties, exts);
  }
  function copyState(mode, state) {
    if (state === true) {
      return state;
    }
    if (mode.copyState) {
      return mode.copyState(state);
    }
    var nstate = {};
    for (var n in state) {
      var val = state[n];
      if (val instanceof Array) {
        val = val.concat([]);
      }
      nstate[n] = val;
    }
    return nstate;
  }
  function innerMode(mode, state) {
    var info;
    while (mode.innerMode) {
      info = mode.innerMode(state);
      if (!info || info.mode == mode) {
        break;
      }
      state = info.state;
      mode = info.mode;
    }
    return info || {
      mode: mode,
      state: state
    };
  }
  function startState(mode, a1, a2) {
    return mode.startState ? mode.startState(a1, a2) : true;
  }
  var StringStream = function (string, tabSize, lineOracle) {
    this.pos = this.start = 0;
    this.string = string;
    this.tabSize = tabSize || 8;
    this.lastColumnPos = this.lastColumnValue = 0;
    this.lineStart = 0;
    this.lineOracle = lineOracle;
  };
  StringStream.prototype.eol = function () {
    return this.pos >= this.string.length;
  };
  StringStream.prototype.sol = function () {
    return this.pos == this.lineStart;
  };
  StringStream.prototype.peek = function () {
    return this.string.charAt(this.pos) || undefined;
  };
  StringStream.prototype.next = function () {
    if (this.pos < this.string.length) {
      return this.string.charAt(this.pos++);
    }
  };
  StringStream.prototype.eat = function (match) {
    var ch = this.string.charAt(this.pos);
    var ok;
    if (typeof match == "string") {
      ok = ch == match;
    } else {
      ok = ch && (match.test ? match.test(ch) : match(ch));
    }
    if (ok) {
      ++this.pos;
      return ch;
    }
  };
  StringStream.prototype.eatWhile = function (match) {
    var start = this.pos;
    while (this.eat(match)) {}
    return this.pos > start;
  };
  StringStream.prototype.eatSpace = function () {
    var start = this.pos;
    while (/[\s\u00a0]/.test(this.string.charAt(this.pos))) {
      ++this.pos;
    }
    return this.pos > start;
  };
  StringStream.prototype.skipToEnd = function () {
    this.pos = this.string.length;
  };
  StringStream.prototype.skipTo = function (ch) {
    var found = this.string.indexOf(ch, this.pos);
    if (found > -1) {
      this.pos = found;
      return true;
    }
  };
  StringStream.prototype.backUp = function (n) {
    this.pos -= n;
  };
  StringStream.prototype.column = function () {
    if (this.lastColumnPos < this.start) {
      this.lastColumnValue = countColumn(this.string, this.start, this.tabSize, this.lastColumnPos, this.lastColumnValue);
      this.lastColumnPos = this.start;
    }
    return this.lastColumnValue - (this.lineStart ? countColumn(this.string, this.lineStart, this.tabSize) : 0);
  };
  StringStream.prototype.indentation = function () {
    return countColumn(this.string, null, this.tabSize) - (this.lineStart ? countColumn(this.string, this.lineStart, this.tabSize) : 0);
  };
  StringStream.prototype.match = function (pattern, consume, caseInsensitive) {
    if (typeof pattern == "string") {
      var cased = function (str) {
        return caseInsensitive ? str.toLowerCase() : str;
      };
      var substr = this.string.substr(this.pos, pattern.length);
      if (cased(substr) == cased(pattern)) {
        if (consume !== false) {
          this.pos += pattern.length;
        }
        return true;
      }
    } else {
      var match = this.string.slice(this.pos).match(pattern);
      if (match && match.index > 0) {
        return null;
      }
      if (match && consume !== false) {
        this.pos += match[0].length;
      }
      return match;
    }
  };
  StringStream.prototype.current = function () {
    return this.string.slice(this.start, this.pos);
  };
  StringStream.prototype.hideFirstChars = function (n, inner) {
    this.lineStart += n;
    try {
      return inner();
    } finally {
      this.lineStart -= n;
    }
  };
  StringStream.prototype.lookAhead = function (n) {
    var oracle = this.lineOracle;
    return oracle && oracle.lookAhead(n);
  };
  StringStream.prototype.baseToken = function () {
    var oracle = this.lineOracle;
    return oracle && oracle.baseToken(this.pos);
  };
  function getLine(doc, n) {
    n -= doc.first;
    if (n < 0 || n >= doc.size) {
      throw new Error("There is no line " + (n + doc.first) + " in the document.");
    }
    var chunk = doc;
    while (!chunk.lines) {
      for (var i = 0;; ++i) {
        var child = chunk.children[i],
          sz = child.chunkSize();
        if (n < sz) {
          chunk = child;
          break;
        }
        n -= sz;
      }
    }
    return chunk.lines[n];
  }
  function getBetween(doc, start, end) {
    var out = [],
      n = start.line;
    doc.iter(start.line, end.line + 1, function (line) {
      var text = line.text;
      if (n == end.line) {
        text = text.slice(0, end.ch);
      }
      if (n == start.line) {
        text = text.slice(start.ch);
      }
      out.push(text);
      ++n;
    });
    return out;
  }
  function getLines(doc, from, to) {
    var out = [];
    doc.iter(from, to, function (line) {
      out.push(line.text);
    });
    return out;
  }
  function updateLineHeight(line, height) {
    var diff = height - line.height;
    if (diff) {
      for (var n = line; n; n = n.parent) {
        n.height += diff;
      }
    }
  }
  function lineNo(line) {
    if (line.parent == null) {
      return null;
    }
    var cur = line.parent,
      no = indexOf(cur.lines, line);
    for (var chunk = cur.parent; chunk; cur = chunk, chunk = chunk.parent) {
      for (var i = 0;; ++i) {
        if (chunk.children[i] == cur) {
          break;
        }
        no += chunk.children[i].chunkSize();
      }
    }
    return no + cur.first;
  }
  function lineAtHeight(chunk, h) {
    var n = chunk.first;
    outer: do {
      for (var i$1 = 0; i$1 < chunk.children.length; ++i$1) {
        var child = chunk.children[i$1],
          ch = child.height;
        if (h < ch) {
          chunk = child;
          continue outer;
        }
        h -= ch;
        n += child.chunkSize();
      }
      return n;
    } while (!chunk.lines);
    var i = 0;
    for (; i < chunk.lines.length; ++i) {
      var line = chunk.lines[i],
        lh = line.height;
      if (h < lh) {
        break;
      }
      h -= lh;
    }
    return n + i;
  }
  function isLine(doc, l) {
    return l >= doc.first && l < doc.first + doc.size;
  }
  function lineNumberFor(options, i) {
    return String(options.lineNumberFormatter(i + options.firstLineNumber));
  }
  function Pos(line, ch, sticky) {
    if (sticky === void 0) sticky = null;
    if (!(this instanceof Pos)) {
      return new Pos(line, ch, sticky);
    }
    this.line = line;
    this.ch = ch;
    this.sticky = sticky;
  }
  function cmp(a, b) {
    return a.line - b.line || a.ch - b.ch;
  }
  function equalCursorPos(a, b) {
    return a.sticky == b.sticky && cmp(a, b) == 0;
  }
  function copyPos(x) {
    return Pos(x.line, x.ch);
  }
  function maxPos(a, b) {
    return cmp(a, b) < 0 ? b : a;
  }
  function minPos(a, b) {
    return cmp(a, b) < 0 ? a : b;
  }
  function clipLine(doc, n) {
    return Math.max(doc.first, Math.min(n, doc.first + doc.size - 1));
  }
  function clipPos(doc, pos) {
    if (pos.line < doc.first) {
      return Pos(doc.first, 0);
    }
    var last = doc.first + doc.size - 1;
    if (pos.line > last) {
      return Pos(last, getLine(doc, last).text.length);
    }
    return clipToLen(pos, getLine(doc, pos.line).text.length);
  }
  function clipToLen(pos, linelen) {
    var ch = pos.ch;
    if (ch == null || ch > linelen) {
      return Pos(pos.line, linelen);
    } else if (ch < 0) {
      return Pos(pos.line, 0);
    } else {
      return pos;
    }
  }
  function clipPosArray(doc, array) {
    var out = [];
    for (var i = 0; i < array.length; i++) {
      out[i] = clipPos(doc, array[i]);
    }
    return out;
  }
  var SavedContext = function (state, lookAhead) {
    this.state = state;
    this.lookAhead = lookAhead;
  };
  var Context = function (doc, state, line, lookAhead) {
    this.state = state;
    this.doc = doc;
    this.line = line;
    this.maxLookAhead = lookAhead || 0;
    this.baseTokens = null;
    this.baseTokenPos = 1;
  };
  Context.prototype.lookAhead = function (n) {
    var line = this.doc.getLine(this.line + n);
    if (line != null && n > this.maxLookAhead) {
      this.maxLookAhead = n;
    }
    return line;
  };
  Context.prototype.baseToken = function (n) {
    if (!this.baseTokens) {
      return null;
    }
    while (this.baseTokens[this.baseTokenPos] <= n) {
      this.baseTokenPos += 2;
    }
    var type = this.baseTokens[this.baseTokenPos + 1];
    return {
      type: type && type.replace(/( |^)overlay .*/, ""),
      size: this.baseTokens[this.baseTokenPos] - n
    };
  };
  Context.prototype.nextLine = function () {
    this.line++;
    if (this.maxLookAhead > 0) {
      this.maxLookAhead--;
    }
  };
  Context.fromSaved = function (doc, saved, line) {
    if (saved instanceof SavedContext) {
      return new Context(doc, copyState(doc.mode, saved.state), line, saved.lookAhead);
    } else {
      return new Context(doc, copyState(doc.mode, saved), line);
    }
  };
  Context.prototype.save = function (copy) {
    var state = copy !== false ? copyState(this.doc.mode, this.state) : this.state;
    return this.maxLookAhead > 0 ? new SavedContext(state, this.maxLookAhead) : state;
  };
  function highlightLine(cm, line, context, forceToEnd) {
    var st = [cm.state.modeGen],
      lineClasses = {};
    runMode(cm, line.text, cm.doc.mode, context, function (end, style) {
      return st.push(end, style);
    }, lineClasses, forceToEnd);
    var state = context.state;
    var loop = function (o) {
      context.baseTokens = st;
      var overlay = cm.state.overlays[o],
        i = 1,
        at = 0;
      context.state = true;
      runMode(cm, line.text, overlay.mode, context, function (end, style) {
        var start = i;
        while (at < end) {
          var i_end = st[i];
          if (i_end > end) {
            st.splice(i, 1, end, st[i + 1], i_end);
          }
          i += 2;
          at = Math.min(end, i_end);
        }
        if (!style) {
          return;
        }
        if (overlay.opaque) {
          st.splice(start, i - start, end, "overlay " + style);
          i = start + 2;
        } else {
          for (; start < i; start += 2) {
            var cur = st[start + 1];
            st[start + 1] = (cur ? cur + " " : "") + "overlay " + style;
          }
        }
      }, lineClasses);
      context.state = state;
      context.baseTokens = null;
      context.baseTokenPos = 1;
    };
    for (var o = 0; o < cm.state.overlays.length; ++o) loop(o);
    return {
      styles: st,
      classes: lineClasses.bgClass || lineClasses.textClass ? lineClasses : null
    };
  }
  function getLineStyles(cm, line, updateFrontier) {
    if (!line.styles || line.styles[0] != cm.state.modeGen) {
      var context = getContextBefore(cm, lineNo(line));
      var resetState = line.text.length > cm.options.maxHighlightLength && copyState(cm.doc.mode, context.state);
      var result = highlightLine(cm, line, context);
      if (resetState) {
        context.state = resetState;
      }
      line.stateAfter = context.save(!resetState);
      line.styles = result.styles;
      if (result.classes) {
        line.styleClasses = result.classes;
      } else if (line.styleClasses) {
        line.styleClasses = null;
      }
      if (updateFrontier === cm.doc.highlightFrontier) {
        cm.doc.modeFrontier = Math.max(cm.doc.modeFrontier, ++cm.doc.highlightFrontier);
      }
    }
    return line.styles;
  }
  function getContextBefore(cm, n, precise) {
    var doc = cm.doc,
      display = cm.display;
    if (!doc.mode.startState) {
      return new Context(doc, true, n);
    }
    var start = findStartLine(cm, n, precise);
    var saved = start > doc.first && getLine(doc, start - 1).stateAfter;
    var context = saved ? Context.fromSaved(doc, saved, start) : new Context(doc, startState(doc.mode), start);
    doc.iter(start, n, function (line) {
      processLine(cm, line.text, context);
      var pos = context.line;
      line.stateAfter = pos == n - 1 || pos % 5 == 0 || pos >= display.viewFrom && pos < display.viewTo ? context.save() : null;
      context.nextLine();
    });
    if (precise) {
      doc.modeFrontier = context.line;
    }
    return context;
  }
  function processLine(cm, text, context, startAt) {
    var mode = cm.doc.mode;
    var stream = new StringStream(text, cm.options.tabSize, context);
    stream.start = stream.pos = startAt || 0;
    if (text == "") {
      callBlankLine(mode, context.state);
    }
    while (!stream.eol()) {
      readToken(mode, stream, context.state);
      stream.start = stream.pos;
    }
  }
  function callBlankLine(mode, state) {
    if (mode.blankLine) {
      return mode.blankLine(state);
    }
    if (!mode.innerMode) {
      return;
    }
    var inner = innerMode(mode, state);
    if (inner.mode.blankLine) {
      return inner.mode.blankLine(inner.state);
    }
  }
  function readToken(mode, stream, state, inner) {
    for (var i = 0; i < 10; i++) {
      if (inner) {
        inner[0] = innerMode(mode, state).mode;
      }
      var style = mode.token(stream, state);
      if (stream.pos > stream.start) {
        return style;
      }
    }
    throw new Error("Mode " + mode.name + " failed to advance stream.");
  }
  var Token = function (stream, type, state) {
    this.start = stream.start;
    this.end = stream.pos;
    this.string = stream.current();
    this.type = type || null;
    this.state = state;
  };
  function takeToken(cm, pos, precise, asArray) {
    var doc = cm.doc,
      mode = doc.mode,
      style;
    pos = clipPos(doc, pos);
    var line = getLine(doc, pos.line),
      context = getContextBefore(cm, pos.line, precise);
    var stream = new StringStream(line.text, cm.options.tabSize, context),
      tokens;
    if (asArray) {
      tokens = [];
    }
    while ((asArray || stream.pos < pos.ch) && !stream.eol()) {
      stream.start = stream.pos;
      style = readToken(mode, stream, context.state);
      if (asArray) {
        tokens.push(new Token(stream, style, copyState(doc.mode, context.state)));
      }
    }
    return asArray ? tokens : new Token(stream, style, context.state);
  }
  function extractLineClasses(type, output) {
    if (type) {
      for (;;) {
        var lineClass = type.match(/(?:^|\s+)line-(background-)?(\S+)/);
        if (!lineClass) {
          break;
        }
        type = type.slice(0, lineClass.index) + type.slice(lineClass.index + lineClass[0].length);
        var prop = lineClass[1] ? "bgClass" : "textClass";
        if (output[prop] == null) {
          output[prop] = lineClass[2];
        } else if (!new RegExp("(?:^|s)" + lineClass[2] + "(?:$|s)").test(output[prop])) {
          output[prop] += " " + lineClass[2];
        }
      }
    }
    return type;
  }
  function runMode(cm, text, mode, context, f, lineClasses, forceToEnd) {
    var flattenSpans = mode.flattenSpans;
    if (flattenSpans == null) {
      flattenSpans = cm.options.flattenSpans;
    }
    var curStart = 0,
      curStyle = null;
    var stream = new StringStream(text, cm.options.tabSize, context),
      style;
    var inner = cm.options.addModeClass && [null];
    if (text == "") {
      extractLineClasses(callBlankLine(mode, context.state), lineClasses);
    }
    while (!stream.eol()) {
      if (stream.pos > cm.options.maxHighlightLength) {
        flattenSpans = false;
        if (forceToEnd) {
          processLine(cm, text, context, stream.pos);
        }
        stream.pos = text.length;
        style = null;
      } else {
        style = extractLineClasses(readToken(mode, stream, context.state, inner), lineClasses);
      }
      if (inner) {
        var mName = inner[0].name;
        if (mName) {
          style = "m-" + (style ? mName + " " + style : mName);
        }
      }
      if (!flattenSpans || curStyle != style) {
        while (curStart < stream.start) {
          curStart = Math.min(stream.start, curStart + 5e3);
          f(curStart, curStyle);
        }
        curStyle = style;
      }
      stream.start = stream.pos;
    }
    while (curStart < stream.pos) {
      var pos = Math.min(stream.pos, curStart + 5e3);
      f(pos, curStyle);
      curStart = pos;
    }
  }
  function findStartLine(cm, n, precise) {
    var minindent,
      minline,
      doc = cm.doc;
    var lim = precise ? -1 : n - (cm.doc.mode.innerMode ? 1e3 : 100);
    for (var search = n; search > lim; --search) {
      if (search <= doc.first) {
        return doc.first;
      }
      var line = getLine(doc, search - 1),
        after = line.stateAfter;
      if (after && (!precise || search + (after instanceof SavedContext ? after.lookAhead : 0) <= doc.modeFrontier)) {
        return search;
      }
      var indented = countColumn(line.text, null, cm.options.tabSize);
      if (minline == null || minindent > indented) {
        minline = search - 1;
        minindent = indented;
      }
    }
    return minline;
  }
  function retreatFrontier(doc, n) {
    doc.modeFrontier = Math.min(doc.modeFrontier, n);
    if (doc.highlightFrontier < n - 10) {
      return;
    }
    var start = doc.first;
    for (var line = n - 1; line > start; line--) {
      var saved = getLine(doc, line).stateAfter;
      if (saved && (!(saved instanceof SavedContext) || line + saved.lookAhead < n)) {
        start = line + 1;
        break;
      }
    }
    doc.highlightFrontier = Math.min(doc.highlightFrontier, start);
  }
  var sawReadOnlySpans = false,
    sawCollapsedSpans = false;
  function seeReadOnlySpans() {
    sawReadOnlySpans = true;
  }
  function seeCollapsedSpans() {
    sawCollapsedSpans = true;
  }
  function MarkedSpan(marker, from, to) {
    this.marker = marker;
    this.from = from;
    this.to = to;
  }
  function getMarkedSpanFor(spans, marker) {
    if (spans) {
      for (var i = 0; i < spans.length; ++i) {
        var span = spans[i];
        if (span.marker == marker) {
          return span;
        }
      }
    }
  }
  function removeMarkedSpan(spans, span) {
    var r;
    for (var i = 0; i < spans.length; ++i) {
      if (spans[i] != span) {
        (r || (r = [])).push(spans[i]);
      }
    }
    return r;
  }
  function addMarkedSpan(line, span) {
    line.markedSpans = line.markedSpans ? line.markedSpans.concat([span]) : [span];
    span.marker.attachLine(line);
  }
  function markedSpansBefore(old, startCh, isInsert) {
    var nw;
    if (old) {
      for (var i = 0; i < old.length; ++i) {
        var span = old[i],
          marker = span.marker;
        var startsBefore = span.from == null || (marker.inclusiveLeft ? span.from <= startCh : span.from < startCh);
        if (startsBefore || span.from == startCh && marker.type == "bookmark" && (!isInsert || !span.marker.insertLeft)) {
          var endsAfter = span.to == null || (marker.inclusiveRight ? span.to >= startCh : span.to > startCh);
          (nw || (nw = [])).push(new MarkedSpan(marker, span.from, endsAfter ? null : span.to));
        }
      }
    }
    return nw;
  }
  function markedSpansAfter(old, endCh, isInsert) {
    var nw;
    if (old) {
      for (var i = 0; i < old.length; ++i) {
        var span = old[i],
          marker = span.marker;
        var endsAfter = span.to == null || (marker.inclusiveRight ? span.to >= endCh : span.to > endCh);
        if (endsAfter || span.from == endCh && marker.type == "bookmark" && (!isInsert || span.marker.insertLeft)) {
          var startsBefore = span.from == null || (marker.inclusiveLeft ? span.from <= endCh : span.from < endCh);
          (nw || (nw = [])).push(new MarkedSpan(marker, startsBefore ? null : span.from - endCh, span.to == null ? null : span.to - endCh));
        }
      }
    }
    return nw;
  }
  function stretchSpansOverChange(doc, change) {
    if (change.full) {
      return null;
    }
    var oldFirst = isLine(doc, change.from.line) && getLine(doc, change.from.line).markedSpans;
    var oldLast = isLine(doc, change.to.line) && getLine(doc, change.to.line).markedSpans;
    if (!oldFirst && !oldLast) {
      return null;
    }
    var startCh = change.from.ch,
      endCh = change.to.ch,
      isInsert = cmp(change.from, change.to) == 0;
    var first = markedSpansBefore(oldFirst, startCh, isInsert);
    var last = markedSpansAfter(oldLast, endCh, isInsert);
    var sameLine = change.text.length == 1,
      offset = lst(change.text).length + (sameLine ? startCh : 0);
    if (first) {
      for (var i = 0; i < first.length; ++i) {
        var span = first[i];
        if (span.to == null) {
          var found = getMarkedSpanFor(last, span.marker);
          if (!found) {
            span.to = startCh;
          } else if (sameLine) {
            span.to = found.to == null ? null : found.to + offset;
          }
        }
      }
    }
    if (last) {
      for (var i$1 = 0; i$1 < last.length; ++i$1) {
        var span$1 = last[i$1];
        if (span$1.to != null) {
          span$1.to += offset;
        }
        if (span$1.from == null) {
          var found$1 = getMarkedSpanFor(first, span$1.marker);
          if (!found$1) {
            span$1.from = offset;
            if (sameLine) {
              (first || (first = [])).push(span$1);
            }
          }
        } else {
          span$1.from += offset;
          if (sameLine) {
            (first || (first = [])).push(span$1);
          }
        }
      }
    }
    if (first) {
      first = clearEmptySpans(first);
    }
    if (last && last != first) {
      last = clearEmptySpans(last);
    }
    var newMarkers = [first];
    if (!sameLine) {
      var gap = change.text.length - 2,
        gapMarkers;
      if (gap > 0 && first) {
        for (var i$2 = 0; i$2 < first.length; ++i$2) {
          if (first[i$2].to == null) {
            (gapMarkers || (gapMarkers = [])).push(new MarkedSpan(first[i$2].marker, null, null));
          }
        }
      }
      for (var i$3 = 0; i$3 < gap; ++i$3) {
        newMarkers.push(gapMarkers);
      }
      newMarkers.push(last);
    }
    return newMarkers;
  }
  function clearEmptySpans(spans) {
    for (var i = 0; i < spans.length; ++i) {
      var span = spans[i];
      if (span.from != null && span.from == span.to && span.marker.clearWhenEmpty !== false) {
        spans.splice(i--, 1);
      }
    }
    if (!spans.length) {
      return null;
    }
    return spans;
  }
  function removeReadOnlyRanges(doc, from, to) {
    var markers = null;
    doc.iter(from.line, to.line + 1, function (line) {
      if (line.markedSpans) {
        for (var i = 0; i < line.markedSpans.length; ++i) {
          var mark = line.markedSpans[i].marker;
          if (mark.readOnly && (!markers || indexOf(markers, mark) == -1)) {
            (markers || (markers = [])).push(mark);
          }
        }
      }
    });
    if (!markers) {
      return null;
    }
    var parts = [{
      from: from,
      to: to
    }];
    for (var i = 0; i < markers.length; ++i) {
      var mk = markers[i],
        m = mk.find(0);
      for (var j = 0; j < parts.length; ++j) {
        var p = parts[j];
        if (cmp(p.to, m.from) < 0 || cmp(p.from, m.to) > 0) {
          continue;
        }
        var newParts = [j, 1],
          dfrom = cmp(p.from, m.from),
          dto = cmp(p.to, m.to);
        if (dfrom < 0 || !mk.inclusiveLeft && !dfrom) {
          newParts.push({
            from: p.from,
            to: m.from
          });
        }
        if (dto > 0 || !mk.inclusiveRight && !dto) {
          newParts.push({
            from: m.to,
            to: p.to
          });
        }
        parts.splice.apply(parts, newParts);
        j += newParts.length - 3;
      }
    }
    return parts;
  }
  function detachMarkedSpans(line) {
    var spans = line.markedSpans;
    if (!spans) {
      return;
    }
    for (var i = 0; i < spans.length; ++i) {
      spans[i].marker.detachLine(line);
    }
    line.markedSpans = null;
  }
  function attachMarkedSpans(line, spans) {
    if (!spans) {
      return;
    }
    for (var i = 0; i < spans.length; ++i) {
      spans[i].marker.attachLine(line);
    }
    line.markedSpans = spans;
  }
  function extraLeft(marker) {
    return marker.inclusiveLeft ? -1 : 0;
  }
  function extraRight(marker) {
    return marker.inclusiveRight ? 1 : 0;
  }
  function compareCollapsedMarkers(a, b) {
    var lenDiff = a.lines.length - b.lines.length;
    if (lenDiff != 0) {
      return lenDiff;
    }
    var aPos = a.find(),
      bPos = b.find();
    var fromCmp = cmp(aPos.from, bPos.from) || extraLeft(a) - extraLeft(b);
    if (fromCmp) {
      return -fromCmp;
    }
    var toCmp = cmp(aPos.to, bPos.to) || extraRight(a) - extraRight(b);
    if (toCmp) {
      return toCmp;
    }
    return b.id - a.id;
  }
  function collapsedSpanAtSide(line, start) {
    var sps = sawCollapsedSpans && line.markedSpans,
      found;
    if (sps) {
      for (var sp = void 0, i = 0; i < sps.length; ++i) {
        sp = sps[i];
        if (sp.marker.collapsed && (start ? sp.from : sp.to) == null && (!found || compareCollapsedMarkers(found, sp.marker) < 0)) {
          found = sp.marker;
        }
      }
    }
    return found;
  }
  function collapsedSpanAtStart(line) {
    return collapsedSpanAtSide(line, true);
  }
  function collapsedSpanAtEnd(line) {
    return collapsedSpanAtSide(line, false);
  }
  function collapsedSpanAround(line, ch) {
    var sps = sawCollapsedSpans && line.markedSpans,
      found;
    if (sps) {
      for (var i = 0; i < sps.length; ++i) {
        var sp = sps[i];
        if (sp.marker.collapsed && (sp.from == null || sp.from < ch) && (sp.to == null || sp.to > ch) && (!found || compareCollapsedMarkers(found, sp.marker) < 0)) {
          found = sp.marker;
        }
      }
    }
    return found;
  }
  function conflictingCollapsedRange(doc, lineNo$$1, from, to, marker) {
    var line = getLine(doc, lineNo$$1);
    var sps = sawCollapsedSpans && line.markedSpans;
    if (sps) {
      for (var i = 0; i < sps.length; ++i) {
        var sp = sps[i];
        if (!sp.marker.collapsed) {
          continue;
        }
        var found = sp.marker.find(0);
        var fromCmp = cmp(found.from, from) || extraLeft(sp.marker) - extraLeft(marker);
        var toCmp = cmp(found.to, to) || extraRight(sp.marker) - extraRight(marker);
        if (fromCmp >= 0 && toCmp <= 0 || fromCmp <= 0 && toCmp >= 0) {
          continue;
        }
        if (fromCmp <= 0 && (sp.marker.inclusiveRight && marker.inclusiveLeft ? cmp(found.to, from) >= 0 : cmp(found.to, from) > 0) || fromCmp >= 0 && (sp.marker.inclusiveRight && marker.inclusiveLeft ? cmp(found.from, to) <= 0 : cmp(found.from, to) < 0)) {
          return true;
        }
      }
    }
  }
  function visualLine(line) {
    var merged;
    while (merged = collapsedSpanAtStart(line)) {
      line = merged.find(-1, true).line;
    }
    return line;
  }
  function visualLineEnd(line) {
    var merged;
    while (merged = collapsedSpanAtEnd(line)) {
      line = merged.find(1, true).line;
    }
    return line;
  }
  function visualLineContinued(line) {
    var merged, lines;
    while (merged = collapsedSpanAtEnd(line)) {
      line = merged.find(1, true).line;
      (lines || (lines = [])).push(line);
    }
    return lines;
  }
  function visualLineNo(doc, lineN) {
    var line = getLine(doc, lineN),
      vis = visualLine(line);
    if (line == vis) {
      return lineN;
    }
    return lineNo(vis);
  }
  function visualLineEndNo(doc, lineN) {
    if (lineN > doc.lastLine()) {
      return lineN;
    }
    var line = getLine(doc, lineN),
      merged;
    if (!lineIsHidden(doc, line)) {
      return lineN;
    }
    while (merged = collapsedSpanAtEnd(line)) {
      line = merged.find(1, true).line;
    }
    return lineNo(line) + 1;
  }
  function lineIsHidden(doc, line) {
    var sps = sawCollapsedSpans && line.markedSpans;
    if (sps) {
      for (var sp = void 0, i = 0; i < sps.length; ++i) {
        sp = sps[i];
        if (!sp.marker.collapsed) {
          continue;
        }
        if (sp.from == null) {
          return true;
        }
        if (sp.marker.widgetNode) {
          continue;
        }
        if (sp.from == 0 && sp.marker.inclusiveLeft && lineIsHiddenInner(doc, line, sp)) {
          return true;
        }
      }
    }
  }
  function lineIsHiddenInner(doc, line, span) {
    if (span.to == null) {
      var end = span.marker.find(1, true);
      return lineIsHiddenInner(doc, end.line, getMarkedSpanFor(end.line.markedSpans, span.marker));
    }
    if (span.marker.inclusiveRight && span.to == line.text.length) {
      return true;
    }
    for (var sp = void 0, i = 0; i < line.markedSpans.length; ++i) {
      sp = line.markedSpans[i];
      if (sp.marker.collapsed && !sp.marker.widgetNode && sp.from == span.to && (sp.to == null || sp.to != span.from) && (sp.marker.inclusiveLeft || span.marker.inclusiveRight) && lineIsHiddenInner(doc, line, sp)) {
        return true;
      }
    }
  }
  function heightAtLine(lineObj) {
    lineObj = visualLine(lineObj);
    var h = 0,
      chunk = lineObj.parent;
    for (var i = 0; i < chunk.lines.length; ++i) {
      var line = chunk.lines[i];
      if (line == lineObj) {
        break;
      } else {
        h += line.height;
      }
    }
    for (var p = chunk.parent; p; chunk = p, p = chunk.parent) {
      for (var i$1 = 0; i$1 < p.children.length; ++i$1) {
        var cur = p.children[i$1];
        if (cur == chunk) {
          break;
        } else {
          h += cur.height;
        }
      }
    }
    return h;
  }
  function lineLength(line) {
    if (line.height == 0) {
      return 0;
    }
    var len = line.text.length,
      merged,
      cur = line;
    while (merged = collapsedSpanAtStart(cur)) {
      var found = merged.find(0, true);
      cur = found.from.line;
      len += found.from.ch - found.to.ch;
    }
    cur = line;
    while (merged = collapsedSpanAtEnd(cur)) {
      var found$1 = merged.find(0, true);
      len -= cur.text.length - found$1.from.ch;
      cur = found$1.to.line;
      len += cur.text.length - found$1.to.ch;
    }
    return len;
  }
  function findMaxLine(cm) {
    var d = cm.display,
      doc = cm.doc;
    d.maxLine = getLine(doc, doc.first);
    d.maxLineLength = lineLength(d.maxLine);
    d.maxLineChanged = true;
    doc.iter(function (line) {
      var len = lineLength(line);
      if (len > d.maxLineLength) {
        d.maxLineLength = len;
        d.maxLine = line;
      }
    });
  }
  var Line = function (text, markedSpans, estimateHeight) {
    this.text = text;
    attachMarkedSpans(this, markedSpans);
    this.height = estimateHeight ? estimateHeight(this) : 1;
  };
  Line.prototype.lineNo = function () {
    return lineNo(this);
  };
  eventMixin(Line);
  function updateLine(line, text, markedSpans, estimateHeight) {
    line.text = text;
    if (line.stateAfter) {
      line.stateAfter = null;
    }
    if (line.styles) {
      line.styles = null;
    }
    if (line.order != null) {
      line.order = null;
    }
    detachMarkedSpans(line);
    attachMarkedSpans(line, markedSpans);
    var estHeight = estimateHeight ? estimateHeight(line) : 1;
    if (estHeight != line.height) {
      updateLineHeight(line, estHeight);
    }
  }
  function cleanUpLine(line) {
    line.parent = null;
    detachMarkedSpans(line);
  }
  var styleToClassCache = {},
    styleToClassCacheWithMode = {};
  function interpretTokenStyle(style, options) {
    if (!style || /^\s*$/.test(style)) {
      return null;
    }
    var cache = options.addModeClass ? styleToClassCacheWithMode : styleToClassCache;
    return cache[style] || (cache[style] = style.replace(/\S+/g, "cm-$&"));
  }
  function buildLineContent(cm, lineView) {
    var content = eltP("span", null, null, webkit ? "padding-right: .1px" : null);
    var builder = {
      pre: eltP("pre", [content], "CodeMirror-line"),
      content: content,
      col: 0,
      pos: 0,
      cm: cm,
      trailingSpace: false,
      splitSpaces: cm.getOption("lineWrapping")
    };
    lineView.measure = {};
    for (var i = 0; i <= (lineView.rest ? lineView.rest.length : 0); i++) {
      var line = i ? lineView.rest[i - 1] : lineView.line,
        order = void 0;
      builder.pos = 0;
      builder.addToken = buildToken;
      if (hasBadBidiRects(cm.display.measure) && (order = getOrder(line, cm.doc.direction))) {
        builder.addToken = buildTokenBadBidi(builder.addToken, order);
      }
      builder.map = [];
      var allowFrontierUpdate = lineView != cm.display.externalMeasured && lineNo(line);
      insertLineContent(line, builder, getLineStyles(cm, line, allowFrontierUpdate));
      if (line.styleClasses) {
        if (line.styleClasses.bgClass) {
          builder.bgClass = joinClasses(line.styleClasses.bgClass, builder.bgClass || "");
        }
        if (line.styleClasses.textClass) {
          builder.textClass = joinClasses(line.styleClasses.textClass, builder.textClass || "");
        }
      }
      if (builder.map.length == 0) {
        builder.map.push(0, 0, builder.content.appendChild(zeroWidthElement(cm.display.measure)));
      }
      if (i == 0) {
        lineView.measure.map = builder.map;
        lineView.measure.cache = {};
      } else {
        (lineView.measure.maps || (lineView.measure.maps = [])).push(builder.map);
        (lineView.measure.caches || (lineView.measure.caches = [])).push({});
      }
    }
    if (webkit) {
      var last = builder.content.lastChild;
      if (/\bcm-tab\b/.test(last.className) || last.querySelector && last.querySelector(".cm-tab")) {
        builder.content.className = "cm-tab-wrap-hack";
      }
    }
    signal(cm, "renderLine", cm, lineView.line, builder.pre);
    if (builder.pre.className) {
      builder.textClass = joinClasses(builder.pre.className, builder.textClass || "");
    }
    return builder;
  }
  function defaultSpecialCharPlaceholder(ch) {
    var token = elt("span", "•", "cm-invalidchar");
    token.title = "\\u" + ch.charCodeAt(0).toString(16);
    token.setAttribute("aria-label", token.title);
    return token;
  }
  function buildToken(builder, text, style, startStyle, endStyle, css, attributes) {
    if (!text) {
      return;
    }
    var displayText = builder.splitSpaces ? splitSpaces(text, builder.trailingSpace) : text;
    var special = builder.cm.state.specialChars,
      mustWrap = false;
    var content;
    if (!special.test(text)) {
      builder.col += text.length;
      content = document.createTextNode(displayText);
      builder.map.push(builder.pos, builder.pos + text.length, content);
      if (ie && ie_version < 9) {
        mustWrap = true;
      }
      builder.pos += text.length;
    } else {
      content = document.createDocumentFragment();
      var pos = 0;
      while (true) {
        special.lastIndex = pos;
        var m = special.exec(text);
        var skipped = m ? m.index - pos : text.length - pos;
        if (skipped) {
          var txt = document.createTextNode(displayText.slice(pos, pos + skipped));
          if (ie && ie_version < 9) {
            content.appendChild(elt("span", [txt]));
          } else {
            content.appendChild(txt);
          }
          builder.map.push(builder.pos, builder.pos + skipped, txt);
          builder.col += skipped;
          builder.pos += skipped;
        }
        if (!m) {
          break;
        }
        pos += skipped + 1;
        var txt$1 = void 0;
        if (m[0] == "\t") {
          var tabSize = builder.cm.options.tabSize,
            tabWidth = tabSize - builder.col % tabSize;
          txt$1 = content.appendChild(elt("span", spaceStr(tabWidth), "cm-tab"));
          txt$1.setAttribute("role", "presentation");
          txt$1.setAttribute("cm-text", "\t");
          builder.col += tabWidth;
        } else if (m[0] == "\r" || m[0] == "\n") {
          txt$1 = content.appendChild(elt("span", m[0] == "\r" ? "␍" : "␤", "cm-invalidchar"));
          txt$1.setAttribute("cm-text", m[0]);
          builder.col += 1;
        } else {
          txt$1 = builder.cm.options.specialCharPlaceholder(m[0]);
          txt$1.setAttribute("cm-text", m[0]);
          if (ie && ie_version < 9) {
            content.appendChild(elt("span", [txt$1]));
          } else {
            content.appendChild(txt$1);
          }
          builder.col += 1;
        }
        builder.map.push(builder.pos, builder.pos + 1, txt$1);
        builder.pos++;
      }
    }
    builder.trailingSpace = displayText.charCodeAt(text.length - 1) == 32;
    if (style || startStyle || endStyle || mustWrap || css) {
      var fullStyle = style || "";
      if (startStyle) {
        fullStyle += startStyle;
      }
      if (endStyle) {
        fullStyle += endStyle;
      }
      var token = elt("span", [content], fullStyle, css);
      if (attributes) {
        for (var attr in attributes) {
          if (attributes.hasOwnProperty(attr) && attr != "style" && attr != "class") {
            token.setAttribute(attr, attributes[attr]);
          }
        }
      }
      return builder.content.appendChild(token);
    }
    builder.content.appendChild(content);
  }
  function splitSpaces(text, trailingBefore) {
    if (text.length > 1 && !/  /.test(text)) {
      return text;
    }
    var spaceBefore = trailingBefore,
      result = "";
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (ch == " " && spaceBefore && (i == text.length - 1 || text.charCodeAt(i + 1) == 32)) {
        ch = " ";
      }
      result += ch;
      spaceBefore = ch == " ";
    }
    return result;
  }
  function buildTokenBadBidi(inner, order) {
    return function (builder, text, style, startStyle, endStyle, css, attributes) {
      style = style ? style + " cm-force-border" : "cm-force-border";
      var start = builder.pos,
        end = start + text.length;
      for (;;) {
        var part = void 0;
        for (var i = 0; i < order.length; i++) {
          part = order[i];
          if (part.to > start && part.from <= start) {
            break;
          }
        }
        if (part.to >= end) {
          return inner(builder, text, style, startStyle, endStyle, css, attributes);
        }
        inner(builder, text.slice(0, part.to - start), style, startStyle, null, css, attributes);
        startStyle = null;
        text = text.slice(part.to - start);
        start = part.to;
      }
    };
  }
  function buildCollapsedSpan(builder, size, marker, ignoreWidget) {
    var widget = !ignoreWidget && marker.widgetNode;
    if (widget) {
      builder.map.push(builder.pos, builder.pos + size, widget);
    }
    if (!ignoreWidget && builder.cm.display.input.needsContentAttribute) {
      if (!widget) {
        widget = builder.content.appendChild(document.createElement("span"));
      }
      widget.setAttribute("cm-marker", marker.id);
    }
    if (widget) {
      builder.cm.display.input.setUneditable(widget);
      builder.content.appendChild(widget);
    }
    builder.pos += size;
    builder.trailingSpace = false;
  }
  function insertLineContent(line, builder, styles) {
    var spans = line.markedSpans,
      allText = line.text,
      at = 0;
    if (!spans) {
      for (var i$1 = 1; i$1 < styles.length; i$1 += 2) {
        builder.addToken(builder, allText.slice(at, at = styles[i$1]), interpretTokenStyle(styles[i$1 + 1], builder.cm.options));
      }
      return;
    }
    var len = allText.length,
      pos = 0,
      i = 1,
      text = "",
      style,
      css;
    var nextChange = 0,
      spanStyle,
      spanEndStyle,
      spanStartStyle,
      collapsed,
      attributes;
    for (;;) {
      if (nextChange == pos) {
        spanStyle = spanEndStyle = spanStartStyle = css = "";
        attributes = null;
        collapsed = null;
        nextChange = Infinity;
        var foundBookmarks = [],
          endStyles = void 0;
        for (var j = 0; j < spans.length; ++j) {
          var sp = spans[j],
            m = sp.marker;
          if (m.type == "bookmark" && sp.from == pos && m.widgetNode) {
            foundBookmarks.push(m);
          } else if (sp.from <= pos && (sp.to == null || sp.to > pos || m.collapsed && sp.to == pos && sp.from == pos)) {
            if (sp.to != null && sp.to != pos && nextChange > sp.to) {
              nextChange = sp.to;
              spanEndStyle = "";
            }
            if (m.className) {
              spanStyle += " " + m.className;
            }
            if (m.css) {
              css = (css ? css + ";" : "") + m.css;
            }
            if (m.startStyle && sp.from == pos) {
              spanStartStyle += " " + m.startStyle;
            }
            if (m.endStyle && sp.to == nextChange) {
              (endStyles || (endStyles = [])).push(m.endStyle, sp.to);
            }
            if (m.title) {
              (attributes || (attributes = {})).title = m.title;
            }
            if (m.attributes) {
              for (var attr in m.attributes) {
                (attributes || (attributes = {}))[attr] = m.attributes[attr];
              }
            }
            if (m.collapsed && (!collapsed || compareCollapsedMarkers(collapsed.marker, m) < 0)) {
              collapsed = sp;
            }
          } else if (sp.from > pos && nextChange > sp.from) {
            nextChange = sp.from;
          }
        }
        if (endStyles) {
          for (var j$1 = 0; j$1 < endStyles.length; j$1 += 2) {
            if (endStyles[j$1 + 1] == nextChange) {
              spanEndStyle += " " + endStyles[j$1];
            }
          }
        }
        if (!collapsed || collapsed.from == pos) {
          for (var j$2 = 0; j$2 < foundBookmarks.length; ++j$2) {
            buildCollapsedSpan(builder, 0, foundBookmarks[j$2]);
          }
        }
        if (collapsed && (collapsed.from || 0) == pos) {
          buildCollapsedSpan(builder, (collapsed.to == null ? len + 1 : collapsed.to) - pos, collapsed.marker, collapsed.from == null);
          if (collapsed.to == null) {
            return;
          }
          if (collapsed.to == pos) {
            collapsed = false;
          }
        }
      }
      if (pos >= len) {
        break;
      }
      var upto = Math.min(len, nextChange);
      while (true) {
        if (text) {
          var end = pos + text.length;
          if (!collapsed) {
            var tokenText = end > upto ? text.slice(0, upto - pos) : text;
            builder.addToken(builder, tokenText, style ? style + spanStyle : spanStyle, spanStartStyle, pos + tokenText.length == nextChange ? spanEndStyle : "", css, attributes);
          }
          if (end >= upto) {
            text = text.slice(upto - pos);
            pos = upto;
            break;
          }
          pos = end;
          spanStartStyle = "";
        }
        text = allText.slice(at, at = styles[i++]);
        style = interpretTokenStyle(styles[i++], builder.cm.options);
      }
    }
  }
  function LineView(doc, line, lineN) {
    this.line = line;
    this.rest = visualLineContinued(line);
    this.size = this.rest ? lineNo(lst(this.rest)) - lineN + 1 : 1;
    this.node = this.text = null;
    this.hidden = lineIsHidden(doc, line);
  }
  function buildViewArray(cm, from, to) {
    var array = [],
      nextPos;
    for (var pos = from; pos < to; pos = nextPos) {
      var view = new LineView(cm.doc, getLine(cm.doc, pos), pos);
      nextPos = pos + view.size;
      array.push(view);
    }
    return array;
  }
  var operationGroup = null;
  function pushOperation(op) {
    if (operationGroup) {
      operationGroup.ops.push(op);
    } else {
      op.ownsGroup = operationGroup = {
        ops: [op],
        delayedCallbacks: []
      };
    }
  }
  function fireCallbacksForOps(group) {
    var callbacks = group.delayedCallbacks,
      i = 0;
    do {
      for (; i < callbacks.length; i++) {
        callbacks[i].call(null);
      }
      for (var j = 0; j < group.ops.length; j++) {
        var op = group.ops[j];
        if (op.cursorActivityHandlers) {
          while (op.cursorActivityCalled < op.cursorActivityHandlers.length) {
            op.cursorActivityHandlers[op.cursorActivityCalled++].call(null, op.cm);
          }
        }
      }
    } while (i < callbacks.length);
  }
  function finishOperation(op, endCb) {
    var group = op.ownsGroup;
    if (!group) {
      return;
    }
    try {
      fireCallbacksForOps(group);
    } finally {
      operationGroup = null;
      endCb(group);
    }
  }
  var orphanDelayedCallbacks = null;
  function signalLater(emitter, type) {
    var arr = getHandlers(emitter, type);
    if (!arr.length) {
      return;
    }
    var args = Array.prototype.slice.call(arguments, 2),
      list;
    if (operationGroup) {
      list = operationGroup.delayedCallbacks;
    } else if (orphanDelayedCallbacks) {
      list = orphanDelayedCallbacks;
    } else {
      list = orphanDelayedCallbacks = [];
      setTimeout(fireOrphanDelayed, 0);
    }
    var loop = function (i) {
      list.push(function () {
        return arr[i].apply(null, args);
      });
    };
    for (var i = 0; i < arr.length; ++i) loop(i);
  }
  function fireOrphanDelayed() {
    var delayed = orphanDelayedCallbacks;
    orphanDelayedCallbacks = null;
    for (var i = 0; i < delayed.length; ++i) {
      delayed[i]();
    }
  }
  function updateLineForChanges(cm, lineView, lineN, dims) {
    for (var j = 0; j < lineView.changes.length; j++) {
      var type = lineView.changes[j];
      if (type == "text") {
        updateLineText(cm, lineView);
      } else if (type == "gutter") {
        updateLineGutter(cm, lineView, lineN, dims);
      } else if (type == "class") {
        updateLineClasses(cm, lineView);
      } else if (type == "widget") {
        updateLineWidgets(cm, lineView, dims);
      }
    }
    lineView.changes = null;
  }
  function ensureLineWrapped(lineView) {
    if (lineView.node == lineView.text) {
      lineView.node = elt("div", null, null, "position: relative");
      if (lineView.text.parentNode) {
        lineView.text.parentNode.replaceChild(lineView.node, lineView.text);
      }
      lineView.node.appendChild(lineView.text);
      if (ie && ie_version < 8) {
        lineView.node.style.zIndex = 2;
      }
    }
    return lineView.node;
  }
  function updateLineBackground(cm, lineView) {
    var cls = lineView.bgClass ? lineView.bgClass + " " + (lineView.line.bgClass || "") : lineView.line.bgClass;
    if (cls) {
      cls += " CodeMirror-linebackground";
    }
    if (lineView.background) {
      if (cls) {
        lineView.background.className = cls;
      } else {
        lineView.background.parentNode.removeChild(lineView.background);
        lineView.background = null;
      }
    } else if (cls) {
      var wrap = ensureLineWrapped(lineView);
      lineView.background = wrap.insertBefore(elt("div", null, cls), wrap.firstChild);
      cm.display.input.setUneditable(lineView.background);
    }
  }
  function getLineContent(cm, lineView) {
    var ext = cm.display.externalMeasured;
    if (ext && ext.line == lineView.line) {
      cm.display.externalMeasured = null;
      lineView.measure = ext.measure;
      return ext.built;
    }
    return buildLineContent(cm, lineView);
  }
  function updateLineText(cm, lineView) {
    var cls = lineView.text.className;
    var built = getLineContent(cm, lineView);
    if (lineView.text == lineView.node) {
      lineView.node = built.pre;
    }
    lineView.text.parentNode.replaceChild(built.pre, lineView.text);
    lineView.text = built.pre;
    if (built.bgClass != lineView.bgClass || built.textClass != lineView.textClass) {
      lineView.bgClass = built.bgClass;
      lineView.textClass = built.textClass;
      updateLineClasses(cm, lineView);
    } else if (cls) {
      lineView.text.className = cls;
    }
  }
  function updateLineClasses(cm, lineView) {
    updateLineBackground(cm, lineView);
    if (lineView.line.wrapClass) {
      ensureLineWrapped(lineView).className = lineView.line.wrapClass;
    } else if (lineView.node != lineView.text) {
      lineView.node.className = "";
    }
    var textClass = lineView.textClass ? lineView.textClass + " " + (lineView.line.textClass || "") : lineView.line.textClass;
    lineView.text.className = textClass || "";
  }
  function updateLineGutter(cm, lineView, lineN, dims) {
    if (lineView.gutter) {
      lineView.node.removeChild(lineView.gutter);
      lineView.gutter = null;
    }
    if (lineView.gutterBackground) {
      lineView.node.removeChild(lineView.gutterBackground);
      lineView.gutterBackground = null;
    }
    if (lineView.line.gutterClass) {
      var wrap = ensureLineWrapped(lineView);
      lineView.gutterBackground = elt("div", null, "CodeMirror-gutter-background " + lineView.line.gutterClass, "left: " + (cm.options.fixedGutter ? dims.fixedPos : -dims.gutterTotalWidth) + "px; width: " + dims.gutterTotalWidth + "px");
      cm.display.input.setUneditable(lineView.gutterBackground);
      wrap.insertBefore(lineView.gutterBackground, lineView.text);
    }
    var markers = lineView.line.gutterMarkers;
    if (cm.options.lineNumbers || markers) {
      var wrap$1 = ensureLineWrapped(lineView);
      var gutterWrap = lineView.gutter = elt("div", null, "CodeMirror-gutter-wrapper", "left: " + (cm.options.fixedGutter ? dims.fixedPos : -dims.gutterTotalWidth) + "px");
      cm.display.input.setUneditable(gutterWrap);
      wrap$1.insertBefore(gutterWrap, lineView.text);
      if (lineView.line.gutterClass) {
        gutterWrap.className += " " + lineView.line.gutterClass;
      }
      if (cm.options.lineNumbers && (!markers || !markers["CodeMirror-linenumbers"])) {
        lineView.lineNumber = gutterWrap.appendChild(elt("div", lineNumberFor(cm.options, lineN), "CodeMirror-linenumber CodeMirror-gutter-elt", "left: " + dims.gutterLeft["CodeMirror-linenumbers"] + "px; width: " + cm.display.lineNumInnerWidth + "px"));
      }
      if (markers) {
        for (var k = 0; k < cm.display.gutterSpecs.length; ++k) {
          var id = cm.display.gutterSpecs[k].className,
            found = markers.hasOwnProperty(id) && markers[id];
          if (found) {
            gutterWrap.appendChild(elt("div", [found], "CodeMirror-gutter-elt", "left: " + dims.gutterLeft[id] + "px; width: " + dims.gutterWidth[id] + "px"));
          }
        }
      }
    }
  }
  function updateLineWidgets(cm, lineView, dims) {
    if (lineView.alignable) {
      lineView.alignable = null;
    }
    for (var node = lineView.node.firstChild, next = void 0; node; node = next) {
      next = node.nextSibling;
      if (node.className == "CodeMirror-linewidget") {
        lineView.node.removeChild(node);
      }
    }
    insertLineWidgets(cm, lineView, dims);
  }
  function buildLineElement(cm, lineView, lineN, dims) {
    var built = getLineContent(cm, lineView);
    lineView.text = lineView.node = built.pre;
    if (built.bgClass) {
      lineView.bgClass = built.bgClass;
    }
    if (built.textClass) {
      lineView.textClass = built.textClass;
    }
    updateLineClasses(cm, lineView);
    updateLineGutter(cm, lineView, lineN, dims);
    insertLineWidgets(cm, lineView, dims);
    return lineView.node;
  }
  function insertLineWidgets(cm, lineView, dims) {
    insertLineWidgetsFor(cm, lineView.line, lineView, dims, true);
    if (lineView.rest) {
      for (var i = 0; i < lineView.rest.length; i++) {
        insertLineWidgetsFor(cm, lineView.rest[i], lineView, dims, false);
      }
    }
  }
  function insertLineWidgetsFor(cm, line, lineView, dims, allowAbove) {
    if (!line.widgets) {
      return;
    }
    var wrap = ensureLineWrapped(lineView);
    for (var i = 0, ws = line.widgets; i < ws.length; ++i) {
      var widget = ws[i],
        node = elt("div", [widget.node], "CodeMirror-linewidget");
      if (!widget.handleMouseEvents) {
        node.setAttribute("cm-ignore-events", "true");
      }
      positionLineWidget(widget, node, lineView, dims);
      cm.display.input.setUneditable(node);
      if (allowAbove && widget.above) {
        wrap.insertBefore(node, lineView.gutter || lineView.text);
      } else {
        wrap.appendChild(node);
      }
      signalLater(widget, "redraw");
    }
  }
  function positionLineWidget(widget, node, lineView, dims) {
    if (widget.noHScroll) {
      (lineView.alignable || (lineView.alignable = [])).push(node);
      var width = dims.wrapperWidth;
      node.style.left = dims.fixedPos + "px";
      if (!widget.coverGutter) {
        width -= dims.gutterTotalWidth;
        node.style.paddingLeft = dims.gutterTotalWidth + "px";
      }
      node.style.width = width + "px";
    }
    if (widget.coverGutter) {
      node.style.zIndex = 5;
      node.style.position = "relative";
      if (!widget.noHScroll) {
        node.style.marginLeft = -dims.gutterTotalWidth + "px";
      }
    }
  }
  function widgetHeight(widget) {
    if (widget.height != null) {
      return widget.height;
    }
    var cm = widget.doc.cm;
    if (!cm) {
      return 0;
    }
    if (!contains(document.body, widget.node)) {
      var parentStyle = "position: relative;";
      if (widget.coverGutter) {
        parentStyle += "margin-left: -" + cm.display.gutters.offsetWidth + "px;";
      }
      if (widget.noHScroll) {
        parentStyle += "width: " + cm.display.wrapper.clientWidth + "px;";
      }
      removeChildrenAndAdd(cm.display.measure, elt("div", [widget.node], null, parentStyle));
    }
    return widget.height = widget.node.parentNode.offsetHeight;
  }
  function eventInWidget(display, e) {
    for (var n = e_target(e); n != display.wrapper; n = n.parentNode) {
      if (!n || n.nodeType == 1 && n.getAttribute("cm-ignore-events") == "true" || n.parentNode == display.sizer && n != display.mover) {
        return true;
      }
    }
  }
  function paddingTop(display) {
    return display.lineSpace.offsetTop;
  }
  function paddingVert(display) {
    return display.mover.offsetHeight - display.lineSpace.offsetHeight;
  }
  function paddingH(display) {
    if (display.cachedPaddingH) {
      return display.cachedPaddingH;
    }
    var e = removeChildrenAndAdd(display.measure, elt("pre", "x", "CodeMirror-line-like"));
    var style = window.getComputedStyle ? window.getComputedStyle(e) : e.currentStyle;
    var data = {
      left: parseInt(style.paddingLeft),
      right: parseInt(style.paddingRight)
    };
    if (!isNaN(data.left) && !isNaN(data.right)) {
      display.cachedPaddingH = data;
    }
    return data;
  }
  function scrollGap(cm) {
    return scrollerGap - cm.display.nativeBarWidth;
  }
  function displayWidth(cm) {
    return cm.display.scroller.clientWidth - scrollGap(cm) - cm.display.barWidth;
  }
  function displayHeight(cm) {
    return cm.display.scroller.clientHeight - scrollGap(cm) - cm.display.barHeight;
  }
  function ensureLineHeights(cm, lineView, rect) {
    var wrapping = cm.options.lineWrapping;
    var curWidth = wrapping && displayWidth(cm);
    if (!lineView.measure.heights || wrapping && lineView.measure.width != curWidth) {
      var heights = lineView.measure.heights = [];
      if (wrapping) {
        lineView.measure.width = curWidth;
        var rects = lineView.text.firstChild.getClientRects();
        for (var i = 0; i < rects.length - 1; i++) {
          var cur = rects[i],
            next = rects[i + 1];
          if (Math.abs(cur.bottom - next.bottom) > 2) {
            heights.push((cur.bottom + next.top) / 2 - rect.top);
          }
        }
      }
      heights.push(rect.bottom - rect.top);
    }
  }
  function mapFromLineView(lineView, line, lineN) {
    if (lineView.line == line) {
      return {
        map: lineView.measure.map,
        cache: lineView.measure.cache
      };
    }
    for (var i = 0; i < lineView.rest.length; i++) {
      if (lineView.rest[i] == line) {
        return {
          map: lineView.measure.maps[i],
          cache: lineView.measure.caches[i]
        };
      }
    }
    for (var i$1 = 0; i$1 < lineView.rest.length; i$1++) {
      if (lineNo(lineView.rest[i$1]) > lineN) {
        return {
          map: lineView.measure.maps[i$1],
          cache: lineView.measure.caches[i$1],
          before: true
        };
      }
    }
  }
  function updateExternalMeasurement(cm, line) {
    line = visualLine(line);
    var lineN = lineNo(line);
    var view = cm.display.externalMeasured = new LineView(cm.doc, line, lineN);
    view.lineN = lineN;
    var built = view.built = buildLineContent(cm, view);
    view.text = built.pre;
    removeChildrenAndAdd(cm.display.lineMeasure, built.pre);
    return view;
  }
  function measureChar(cm, line, ch, bias) {
    return measureCharPrepared(cm, prepareMeasureForLine(cm, line), ch, bias);
  }
  function findViewForLine(cm, lineN) {
    if (lineN >= cm.display.viewFrom && lineN < cm.display.viewTo) {
      return cm.display.view[findViewIndex(cm, lineN)];
    }
    var ext = cm.display.externalMeasured;
    if (ext && lineN >= ext.lineN && lineN < ext.lineN + ext.size) {
      return ext;
    }
  }
  function prepareMeasureForLine(cm, line) {
    var lineN = lineNo(line);
    var view = findViewForLine(cm, lineN);
    if (view && !view.text) {
      view = null;
    } else if (view && view.changes) {
      updateLineForChanges(cm, view, lineN, getDimensions(cm));
      cm.curOp.forceUpdate = true;
    }
    if (!view) {
      view = updateExternalMeasurement(cm, line);
    }
    var info = mapFromLineView(view, line, lineN);
    return {
      line: line,
      view: view,
      rect: null,
      map: info.map,
      cache: info.cache,
      before: info.before,
      hasHeights: false
    };
  }
  function measureCharPrepared(cm, prepared, ch, bias, varHeight) {
    if (prepared.before) {
      ch = -1;
    }
    var key = ch + (bias || ""),
      found;
    if (prepared.cache.hasOwnProperty(key)) {
      found = prepared.cache[key];
    } else {
      if (!prepared.rect) {
        prepared.rect = prepared.view.text.getBoundingClientRect();
      }
      if (!prepared.hasHeights) {
        ensureLineHeights(cm, prepared.view, prepared.rect);
        prepared.hasHeights = true;
      }
      found = measureCharInner(cm, prepared, ch, bias);
      if (!found.bogus) {
        prepared.cache[key] = found;
      }
    }
    return {
      left: found.left,
      right: found.right,
      top: varHeight ? found.rtop : found.top,
      bottom: varHeight ? found.rbottom : found.bottom
    };
  }
  var nullRect = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  };
  function nodeAndOffsetInLineMap(map$$1, ch, bias) {
    var node, start, end, collapse, mStart, mEnd;
    for (var i = 0; i < map$$1.length; i += 3) {
      mStart = map$$1[i];
      mEnd = map$$1[i + 1];
      if (ch < mStart) {
        start = 0;
        end = 1;
        collapse = "left";
      } else if (ch < mEnd) {
        start = ch - mStart;
        end = start + 1;
      } else if (i == map$$1.length - 3 || ch == mEnd && map$$1[i + 3] > ch) {
        end = mEnd - mStart;
        start = end - 1;
        if (ch >= mEnd) {
          collapse = "right";
        }
      }
      if (start != null) {
        node = map$$1[i + 2];
        if (mStart == mEnd && bias == (node.insertLeft ? "left" : "right")) {
          collapse = bias;
        }
        if (bias == "left" && start == 0) {
          while (i && map$$1[i - 2] == map$$1[i - 3] && map$$1[i - 1].insertLeft) {
            node = map$$1[(i -= 3) + 2];
            collapse = "left";
          }
        }
        if (bias == "right" && start == mEnd - mStart) {
          while (i < map$$1.length - 3 && map$$1[i + 3] == map$$1[i + 4] && !map$$1[i + 5].insertLeft) {
            node = map$$1[(i += 3) + 2];
            collapse = "right";
          }
        }
        break;
      }
    }
    return {
      node: node,
      start: start,
      end: end,
      collapse: collapse,
      coverStart: mStart,
      coverEnd: mEnd
    };
  }
  function getUsefulRect(rects, bias) {
    var rect = nullRect;
    if (bias == "left") {
      for (var i = 0; i < rects.length; i++) {
        if ((rect = rects[i]).left != rect.right) {
          break;
        }
      }
    } else {
      for (var i$1 = rects.length - 1; i$1 >= 0; i$1--) {
        if ((rect = rects[i$1]).left != rect.right) {
          break;
        }
      }
    }
    return rect;
  }
  function measureCharInner(cm, prepared, ch, bias) {
    var place = nodeAndOffsetInLineMap(prepared.map, ch, bias);
    var node = place.node,
      start = place.start,
      end = place.end,
      collapse = place.collapse;
    var rect;
    if (node.nodeType == 3) {
      for (var i$1 = 0; i$1 < 4; i$1++) {
        while (start && isExtendingChar(prepared.line.text.charAt(place.coverStart + start))) {
          --start;
        }
        while (place.coverStart + end < place.coverEnd && isExtendingChar(prepared.line.text.charAt(place.coverStart + end))) {
          ++end;
        }
        if (ie && ie_version < 9 && start == 0 && end == place.coverEnd - place.coverStart) {
          rect = node.parentNode.getBoundingClientRect();
        } else {
          rect = getUsefulRect(range(node, start, end).getClientRects(), bias);
        }
        if (rect.left || rect.right || start == 0) {
          break;
        }
        end = start;
        start = start - 1;
        collapse = "right";
      }
      if (ie && ie_version < 11) {
        rect = maybeUpdateRectForZooming(cm.display.measure, rect);
      }
    } else {
      if (start > 0) {
        collapse = bias = "right";
      }
      var rects;
      if (cm.options.lineWrapping && (rects = node.getClientRects()).length > 1) {
        rect = rects[bias == "right" ? rects.length - 1 : 0];
      } else {
        rect = node.getBoundingClientRect();
      }
    }
    if (ie && ie_version < 9 && !start && (!rect || !rect.left && !rect.right)) {
      var rSpan = node.parentNode.getClientRects()[0];
      if (rSpan) {
        rect = {
          left: rSpan.left,
          right: rSpan.left + charWidth(cm.display),
          top: rSpan.top,
          bottom: rSpan.bottom
        };
      } else {
        rect = nullRect;
      }
    }
    var rtop = rect.top - prepared.rect.top,
      rbot = rect.bottom - prepared.rect.top;
    var mid = (rtop + rbot) / 2;
    var heights = prepared.view.measure.heights;
    var i = 0;
    for (; i < heights.length - 1; i++) {
      if (mid < heights[i]) {
        break;
      }
    }
    var top = i ? heights[i - 1] : 0,
      bot = heights[i];
    var result = {
      left: (collapse == "right" ? rect.right : rect.left) - prepared.rect.left,
      right: (collapse == "left" ? rect.left : rect.right) - prepared.rect.left,
      top: top,
      bottom: bot
    };
    if (!rect.left && !rect.right) {
      result.bogus = true;
    }
    if (!cm.options.singleCursorHeightPerLine) {
      result.rtop = rtop;
      result.rbottom = rbot;
    }
    return result;
  }
  function maybeUpdateRectForZooming(measure, rect) {
    if (!window.screen || screen.logicalXDPI == null || screen.logicalXDPI == screen.deviceXDPI || !hasBadZoomedRects(measure)) {
      return rect;
    }
    var scaleX = screen.logicalXDPI / screen.deviceXDPI;
    var scaleY = screen.logicalYDPI / screen.deviceYDPI;
    return {
      left: rect.left * scaleX,
      right: rect.right * scaleX,
      top: rect.top * scaleY,
      bottom: rect.bottom * scaleY
    };
  }
  function clearLineMeasurementCacheFor(lineView) {
    if (lineView.measure) {
      lineView.measure.cache = {};
      lineView.measure.heights = null;
      if (lineView.rest) {
        for (var i = 0; i < lineView.rest.length; i++) {
          lineView.measure.caches[i] = {};
        }
      }
    }
  }
  function clearLineMeasurementCache(cm) {
    cm.display.externalMeasure = null;
    removeChildren(cm.display.lineMeasure);
    for (var i = 0; i < cm.display.view.length; i++) {
      clearLineMeasurementCacheFor(cm.display.view[i]);
    }
  }
  function clearCaches(cm) {
    clearLineMeasurementCache(cm);
    cm.display.cachedCharWidth = cm.display.cachedTextHeight = cm.display.cachedPaddingH = null;
    if (!cm.options.lineWrapping) {
      cm.display.maxLineChanged = true;
    }
    cm.display.lineNumChars = null;
  }
  function pageScrollX() {
    if (chrome && android) {
      return -(document.body.getBoundingClientRect().left - parseInt(getComputedStyle(document.body).marginLeft));
    }
    return window.pageXOffset || (document.documentElement || document.body).scrollLeft;
  }
  function pageScrollY() {
    if (chrome && android) {
      return -(document.body.getBoundingClientRect().top - parseInt(getComputedStyle(document.body).marginTop));
    }
    return window.pageYOffset || (document.documentElement || document.body).scrollTop;
  }
  function widgetTopHeight(lineObj) {
    var height = 0;
    if (lineObj.widgets) {
      for (var i = 0; i < lineObj.widgets.length; ++i) {
        if (lineObj.widgets[i].above) {
          height += widgetHeight(lineObj.widgets[i]);
        }
      }
    }
    return height;
  }
  function intoCoordSystem(cm, lineObj, rect, context, includeWidgets) {
    if (!includeWidgets) {
      var height = widgetTopHeight(lineObj);
      rect.top += height;
      rect.bottom += height;
    }
    if (context == "line") {
      return rect;
    }
    if (!context) {
      context = "local";
    }
    var yOff = heightAtLine(lineObj);
    if (context == "local") {
      yOff += paddingTop(cm.display);
    } else {
      yOff -= cm.display.viewOffset;
    }
    if (context == "page" || context == "window") {
      var lOff = cm.display.lineSpace.getBoundingClientRect();
      yOff += lOff.top + (context == "window" ? 0 : pageScrollY());
      var xOff = lOff.left + (context == "window" ? 0 : pageScrollX());
      rect.left += xOff;
      rect.right += xOff;
    }
    rect.top += yOff;
    rect.bottom += yOff;
    return rect;
  }
  function fromCoordSystem(cm, coords, context) {
    if (context == "div") {
      return coords;
    }
    var left = coords.left,
      top = coords.top;
    if (context == "page") {
      left -= pageScrollX();
      top -= pageScrollY();
    } else if (context == "local" || !context) {
      var localBox = cm.display.sizer.getBoundingClientRect();
      left += localBox.left;
      top += localBox.top;
    }
    var lineSpaceBox = cm.display.lineSpace.getBoundingClientRect();
    return {
      left: left - lineSpaceBox.left,
      top: top - lineSpaceBox.top
    };
  }
  function charCoords(cm, pos, context, lineObj, bias) {
    if (!lineObj) {
      lineObj = getLine(cm.doc, pos.line);
    }
    return intoCoordSystem(cm, lineObj, measureChar(cm, lineObj, pos.ch, bias), context);
  }
  function cursorCoords(cm, pos, context, lineObj, preparedMeasure, varHeight) {
    lineObj = lineObj || getLine(cm.doc, pos.line);
    if (!preparedMeasure) {
      preparedMeasure = prepareMeasureForLine(cm, lineObj);
    }
    function get(ch, right) {
      var m = measureCharPrepared(cm, preparedMeasure, ch, right ? "right" : "left", varHeight);
      if (right) {
        m.left = m.right;
      } else {
        m.right = m.left;
      }
      return intoCoordSystem(cm, lineObj, m, context);
    }
    var order = getOrder(lineObj, cm.doc.direction),
      ch = pos.ch,
      sticky = pos.sticky;
    if (ch >= lineObj.text.length) {
      ch = lineObj.text.length;
      sticky = "before";
    } else if (ch <= 0) {
      ch = 0;
      sticky = "after";
    }
    if (!order) {
      return get(sticky == "before" ? ch - 1 : ch, sticky == "before");
    }
    function getBidi(ch, partPos, invert) {
      var part = order[partPos],
        right = part.level == 1;
      return get(invert ? ch - 1 : ch, right != invert);
    }
    var partPos = getBidiPartAt(order, ch, sticky);
    var other = bidiOther;
    var val = getBidi(ch, partPos, sticky == "before");
    if (other != null) {
      val.other = getBidi(ch, other, sticky != "before");
    }
    return val;
  }
  function estimateCoords(cm, pos) {
    var left = 0;
    pos = clipPos(cm.doc, pos);
    if (!cm.options.lineWrapping) {
      left = charWidth(cm.display) * pos.ch;
    }
    var lineObj = getLine(cm.doc, pos.line);
    var top = heightAtLine(lineObj) + paddingTop(cm.display);
    return {
      left: left,
      right: left,
      top: top,
      bottom: top + lineObj.height
    };
  }
  function PosWithInfo(line, ch, sticky, outside, xRel) {
    var pos = Pos(line, ch, sticky);
    pos.xRel = xRel;
    if (outside) {
      pos.outside = outside;
    }
    return pos;
  }
  function coordsChar(cm, x, y) {
    var doc = cm.doc;
    y += cm.display.viewOffset;
    if (y < 0) {
      return PosWithInfo(doc.first, 0, null, -1, -1);
    }
    var lineN = lineAtHeight(doc, y),
      last = doc.first + doc.size - 1;
    if (lineN > last) {
      return PosWithInfo(doc.first + doc.size - 1, getLine(doc, last).text.length, null, 1, 1);
    }
    if (x < 0) {
      x = 0;
    }
    var lineObj = getLine(doc, lineN);
    for (;;) {
      var found = coordsCharInner(cm, lineObj, lineN, x, y);
      var collapsed = collapsedSpanAround(lineObj, found.ch + (found.xRel > 0 || found.outside > 0 ? 1 : 0));
      if (!collapsed) {
        return found;
      }
      var rangeEnd = collapsed.find(1);
      if (rangeEnd.line == lineN) {
        return rangeEnd;
      }
      lineObj = getLine(doc, lineN = rangeEnd.line);
    }
  }
  function wrappedLineExtent(cm, lineObj, preparedMeasure, y) {
    y -= widgetTopHeight(lineObj);
    var end = lineObj.text.length;
    var begin = findFirst(function (ch) {
      return measureCharPrepared(cm, preparedMeasure, ch - 1).bottom <= y;
    }, end, 0);
    end = findFirst(function (ch) {
      return measureCharPrepared(cm, preparedMeasure, ch).top > y;
    }, begin, end);
    return {
      begin: begin,
      end: end
    };
  }
  function wrappedLineExtentChar(cm, lineObj, preparedMeasure, target) {
    if (!preparedMeasure) {
      preparedMeasure = prepareMeasureForLine(cm, lineObj);
    }
    var targetTop = intoCoordSystem(cm, lineObj, measureCharPrepared(cm, preparedMeasure, target), "line").top;
    return wrappedLineExtent(cm, lineObj, preparedMeasure, targetTop);
  }
  function boxIsAfter(box, x, y, left) {
    return box.bottom <= y ? false : box.top > y ? true : (left ? box.left : box.right) > x;
  }
  function coordsCharInner(cm, lineObj, lineNo$$1, x, y) {
    y -= heightAtLine(lineObj);
    var preparedMeasure = prepareMeasureForLine(cm, lineObj);
    var widgetHeight$$1 = widgetTopHeight(lineObj);
    var begin = 0,
      end = lineObj.text.length,
      ltr = true;
    var order = getOrder(lineObj, cm.doc.direction);
    if (order) {
      var part = (cm.options.lineWrapping ? coordsBidiPartWrapped : coordsBidiPart)(cm, lineObj, lineNo$$1, preparedMeasure, order, x, y);
      ltr = part.level != 1;
      begin = ltr ? part.from : part.to - 1;
      end = ltr ? part.to : part.from - 1;
    }
    var chAround = null,
      boxAround = null;
    var ch = findFirst(function (ch) {
      var box = measureCharPrepared(cm, preparedMeasure, ch);
      box.top += widgetHeight$$1;
      box.bottom += widgetHeight$$1;
      if (!boxIsAfter(box, x, y, false)) {
        return false;
      }
      if (box.top <= y && box.left <= x) {
        chAround = ch;
        boxAround = box;
      }
      return true;
    }, begin, end);
    var baseX,
      sticky,
      outside = false;
    if (boxAround) {
      var atLeft = x - boxAround.left < boxAround.right - x,
        atStart = atLeft == ltr;
      ch = chAround + (atStart ? 0 : 1);
      sticky = atStart ? "after" : "before";
      baseX = atLeft ? boxAround.left : boxAround.right;
    } else {
      if (!ltr && (ch == end || ch == begin)) {
        ch++;
      }
      sticky = ch == 0 ? "after" : ch == lineObj.text.length ? "before" : measureCharPrepared(cm, preparedMeasure, ch - (ltr ? 1 : 0)).bottom + widgetHeight$$1 <= y == ltr ? "after" : "before";
      var coords = cursorCoords(cm, Pos(lineNo$$1, ch, sticky), "line", lineObj, preparedMeasure);
      baseX = coords.left;
      outside = y < coords.top ? -1 : y >= coords.bottom ? 1 : 0;
    }
    ch = skipExtendingChars(lineObj.text, ch, 1);
    return PosWithInfo(lineNo$$1, ch, sticky, outside, x - baseX);
  }
  function coordsBidiPart(cm, lineObj, lineNo$$1, preparedMeasure, order, x, y) {
    var index = findFirst(function (i) {
      var part = order[i],
        ltr = part.level != 1;
      return boxIsAfter(cursorCoords(cm, Pos(lineNo$$1, ltr ? part.to : part.from, ltr ? "before" : "after"), "line", lineObj, preparedMeasure), x, y, true);
    }, 0, order.length - 1);
    var part = order[index];
    if (index > 0) {
      var ltr = part.level != 1;
      var start = cursorCoords(cm, Pos(lineNo$$1, ltr ? part.from : part.to, ltr ? "after" : "before"), "line", lineObj, preparedMeasure);
      if (boxIsAfter(start, x, y, true) && start.top > y) {
        part = order[index - 1];
      }
    }
    return part;
  }
  function coordsBidiPartWrapped(cm, lineObj, _lineNo, preparedMeasure, order, x, y) {
    var ref = wrappedLineExtent(cm, lineObj, preparedMeasure, y);
    var begin = ref.begin;
    var end = ref.end;
    if (/\s/.test(lineObj.text.charAt(end - 1))) {
      end--;
    }
    var part = null,
      closestDist = null;
    for (var i = 0; i < order.length; i++) {
      var p = order[i];
      if (p.from >= end || p.to <= begin) {
        continue;
      }
      var ltr = p.level != 1;
      var endX = measureCharPrepared(cm, preparedMeasure, ltr ? Math.min(end, p.to) - 1 : Math.max(begin, p.from)).right;
      var dist = endX < x ? x - endX + 1e9 : endX - x;
      if (!part || closestDist > dist) {
        part = p;
        closestDist = dist;
      }
    }
    if (!part) {
      part = order[order.length - 1];
    }
    if (part.from < begin) {
      part = {
        from: begin,
        to: part.to,
        level: part.level
      };
    }
    if (part.to > end) {
      part = {
        from: part.from,
        to: end,
        level: part.level
      };
    }
    return part;
  }
  var measureText;
  function textHeight(display) {
    if (display.cachedTextHeight != null) {
      return display.cachedTextHeight;
    }
    if (measureText == null) {
      measureText = elt("pre", null, "CodeMirror-line-like");
      for (var i = 0; i < 49; ++i) {
        measureText.appendChild(document.createTextNode("x"));
        measureText.appendChild(elt("br"));
      }
      measureText.appendChild(document.createTextNode("x"));
    }
    removeChildrenAndAdd(display.measure, measureText);
    var height = measureText.offsetHeight / 50;
    if (height > 3) {
      display.cachedTextHeight = height;
    }
    removeChildren(display.measure);
    return height || 1;
  }
  function charWidth(display) {
    if (display.cachedCharWidth != null) {
      return display.cachedCharWidth;
    }
    var anchor = elt("span", "xxxxxxxxxx");
    var pre = elt("pre", [anchor], "CodeMirror-line-like");
    removeChildrenAndAdd(display.measure, pre);
    var rect = anchor.getBoundingClientRect(),
      width = (rect.right - rect.left) / 10;
    if (width > 2) {
      display.cachedCharWidth = width;
    }
    return width || 10;
  }
  function getDimensions(cm) {
    var d = cm.display,
      left = {},
      width = {};
    var gutterLeft = d.gutters.clientLeft;
    for (var n = d.gutters.firstChild, i = 0; n; n = n.nextSibling, ++i) {
      var id = cm.display.gutterSpecs[i].className;
      left[id] = n.offsetLeft + n.clientLeft + gutterLeft;
      width[id] = n.clientWidth;
    }
    return {
      fixedPos: compensateForHScroll(d),
      gutterTotalWidth: d.gutters.offsetWidth,
      gutterLeft: left,
      gutterWidth: width,
      wrapperWidth: d.wrapper.clientWidth
    };
  }
  function compensateForHScroll(display) {
    return display.scroller.getBoundingClientRect().left - display.sizer.getBoundingClientRect().left;
  }
  function estimateHeight(cm) {
    var th = textHeight(cm.display),
      wrapping = cm.options.lineWrapping;
    var perLine = wrapping && Math.max(5, cm.display.scroller.clientWidth / charWidth(cm.display) - 3);
    return function (line) {
      if (lineIsHidden(cm.doc, line)) {
        return 0;
      }
      var widgetsHeight = 0;
      if (line.widgets) {
        for (var i = 0; i < line.widgets.length; i++) {
          if (line.widgets[i].height) {
            widgetsHeight += line.widgets[i].height;
          }
        }
      }
      if (wrapping) {
        return widgetsHeight + (Math.ceil(line.text.length / perLine) || 1) * th;
      } else {
        return widgetsHeight + th;
      }
    };
  }
  function estimateLineHeights(cm) {
    var doc = cm.doc,
      est = estimateHeight(cm);
    doc.iter(function (line) {
      var estHeight = est(line);
      if (estHeight != line.height) {
        updateLineHeight(line, estHeight);
      }
    });
  }
  function posFromMouse(cm, e, liberal, forRect) {
    var display = cm.display;
    if (!liberal && e_target(e).getAttribute("cm-not-content") == "true") {
      return null;
    }
    var x,
      y,
      space = display.lineSpace.getBoundingClientRect();
    try {
      x = e.clientX - space.left;
      y = e.clientY - space.top;
    } catch (e) {
      return null;
    }
    var coords = coordsChar(cm, x, y),
      line;
    if (forRect && coords.xRel == 1 && (line = getLine(cm.doc, coords.line).text).length == coords.ch) {
      var colDiff = countColumn(line, line.length, cm.options.tabSize) - line.length;
      coords = Pos(coords.line, Math.max(0, Math.round((x - paddingH(cm.display).left) / charWidth(cm.display)) - colDiff));
    }
    return coords;
  }
  function findViewIndex(cm, n) {
    if (n >= cm.display.viewTo) {
      return null;
    }
    n -= cm.display.viewFrom;
    if (n < 0) {
      return null;
    }
    var view = cm.display.view;
    for (var i = 0; i < view.length; i++) {
      n -= view[i].size;
      if (n < 0) {
        return i;
      }
    }
  }
  function regChange(cm, from, to, lendiff) {
    if (from == null) {
      from = cm.doc.first;
    }
    if (to == null) {
      to = cm.doc.first + cm.doc.size;
    }
    if (!lendiff) {
      lendiff = 0;
    }
    var display = cm.display;
    if (lendiff && to < display.viewTo && (display.updateLineNumbers == null || display.updateLineNumbers > from)) {
      display.updateLineNumbers = from;
    }
    cm.curOp.viewChanged = true;
    if (from >= display.viewTo) {
      if (sawCollapsedSpans && visualLineNo(cm.doc, from) < display.viewTo) {
        resetView(cm);
      }
    } else if (to <= display.viewFrom) {
      if (sawCollapsedSpans && visualLineEndNo(cm.doc, to + lendiff) > display.viewFrom) {
        resetView(cm);
      } else {
        display.viewFrom += lendiff;
        display.viewTo += lendiff;
      }
    } else if (from <= display.viewFrom && to >= display.viewTo) {
      resetView(cm);
    } else if (from <= display.viewFrom) {
      var cut = viewCuttingPoint(cm, to, to + lendiff, 1);
      if (cut) {
        display.view = display.view.slice(cut.index);
        display.viewFrom = cut.lineN;
        display.viewTo += lendiff;
      } else {
        resetView(cm);
      }
    } else if (to >= display.viewTo) {
      var cut$1 = viewCuttingPoint(cm, from, from, -1);
      if (cut$1) {
        display.view = display.view.slice(0, cut$1.index);
        display.viewTo = cut$1.lineN;
      } else {
        resetView(cm);
      }
    } else {
      var cutTop = viewCuttingPoint(cm, from, from, -1);
      var cutBot = viewCuttingPoint(cm, to, to + lendiff, 1);
      if (cutTop && cutBot) {
        display.view = display.view.slice(0, cutTop.index).concat(buildViewArray(cm, cutTop.lineN, cutBot.lineN)).concat(display.view.slice(cutBot.index));
        display.viewTo += lendiff;
      } else {
        resetView(cm);
      }
    }
    var ext = display.externalMeasured;
    if (ext) {
      if (to < ext.lineN) {
        ext.lineN += lendiff;
      } else if (from < ext.lineN + ext.size) {
        display.externalMeasured = null;
      }
    }
  }
  function regLineChange(cm, line, type) {
    cm.curOp.viewChanged = true;
    var display = cm.display,
      ext = cm.display.externalMeasured;
    if (ext && line >= ext.lineN && line < ext.lineN + ext.size) {
      display.externalMeasured = null;
    }
    if (line < display.viewFrom || line >= display.viewTo) {
      return;
    }
    var lineView = display.view[findViewIndex(cm, line)];
    if (lineView.node == null) {
      return;
    }
    var arr = lineView.changes || (lineView.changes = []);
    if (indexOf(arr, type) == -1) {
      arr.push(type);
    }
  }
  function resetView(cm) {
    cm.display.viewFrom = cm.display.viewTo = cm.doc.first;
    cm.display.view = [];
    cm.display.viewOffset = 0;
  }
  function viewCuttingPoint(cm, oldN, newN, dir) {
    var index = findViewIndex(cm, oldN),
      diff,
      view = cm.display.view;
    if (!sawCollapsedSpans || newN == cm.doc.first + cm.doc.size) {
      return {
        index: index,
        lineN: newN
      };
    }
    var n = cm.display.viewFrom;
    for (var i = 0; i < index; i++) {
      n += view[i].size;
    }
    if (n != oldN) {
      if (dir > 0) {
        if (index == view.length - 1) {
          return null;
        }
        diff = n + view[index].size - oldN;
        index++;
      } else {
        diff = n - oldN;
      }
      oldN += diff;
      newN += diff;
    }
    while (visualLineNo(cm.doc, newN) != newN) {
      if (index == (dir < 0 ? 0 : view.length - 1)) {
        return null;
      }
      newN += dir * view[index - (dir < 0 ? 1 : 0)].size;
      index += dir;
    }
    return {
      index: index,
      lineN: newN
    };
  }
  function adjustView(cm, from, to) {
    var display = cm.display,
      view = display.view;
    if (view.length == 0 || from >= display.viewTo || to <= display.viewFrom) {
      display.view = buildViewArray(cm, from, to);
      display.viewFrom = from;
    } else {
      if (display.viewFrom > from) {
        display.view = buildViewArray(cm, from, display.viewFrom).concat(display.view);
      } else if (display.viewFrom < from) {
        display.view = display.view.slice(findViewIndex(cm, from));
      }
      display.viewFrom = from;
      if (display.viewTo < to) {
        display.view = display.view.concat(buildViewArray(cm, display.viewTo, to));
      } else if (display.viewTo > to) {
        display.view = display.view.slice(0, findViewIndex(cm, to));
      }
    }
    display.viewTo = to;
  }
  function countDirtyView(cm) {
    var view = cm.display.view,
      dirty = 0;
    for (var i = 0; i < view.length; i++) {
      var lineView = view[i];
      if (!lineView.hidden && (!lineView.node || lineView.changes)) {
        ++dirty;
      }
    }
    return dirty;
  }
  function updateSelection(cm) {
    cm.display.input.showSelection(cm.display.input.prepareSelection());
  }
  function prepareSelection(cm, primary) {
    if (primary === void 0) primary = true;
    var doc = cm.doc,
      result = {};
    var curFragment = result.cursors = document.createDocumentFragment();
    var selFragment = result.selection = document.createDocumentFragment();
    for (var i = 0; i < doc.sel.ranges.length; i++) {
      if (!primary && i == doc.sel.primIndex) {
        continue;
      }
      var range$$1 = doc.sel.ranges[i];
      if (range$$1.from().line >= cm.display.viewTo || range$$1.to().line < cm.display.viewFrom) {
        continue;
      }
      var collapsed = range$$1.empty();
      if (collapsed || cm.options.showCursorWhenSelecting) {
        drawSelectionCursor(cm, range$$1.head, curFragment);
      }
      if (!collapsed) {
        drawSelectionRange(cm, range$$1, selFragment);
      }
    }
    return result;
  }
  function drawSelectionCursor(cm, head, output) {
    var pos = cursorCoords(cm, head, "div", null, null, !cm.options.singleCursorHeightPerLine);
    var cursor = output.appendChild(elt("div", " ", "CodeMirror-cursor"));
    cursor.style.left = pos.left + "px";
    cursor.style.top = pos.top + "px";
    cursor.style.height = Math.max(0, pos.bottom - pos.top) * cm.options.cursorHeight + "px";
    if (pos.other) {
      var otherCursor = output.appendChild(elt("div", " ", "CodeMirror-cursor CodeMirror-secondarycursor"));
      otherCursor.style.display = "";
      otherCursor.style.left = pos.other.left + "px";
      otherCursor.style.top = pos.other.top + "px";
      otherCursor.style.height = (pos.other.bottom - pos.other.top) * .85 + "px";
    }
  }
  function cmpCoords(a, b) {
    return a.top - b.top || a.left - b.left;
  }
  function drawSelectionRange(cm, range$$1, output) {
    var display = cm.display,
      doc = cm.doc;
    var fragment = document.createDocumentFragment();
    var padding = paddingH(cm.display),
      leftSide = padding.left;
    var rightSide = Math.max(display.sizerWidth, displayWidth(cm) - display.sizer.offsetLeft) - padding.right;
    var docLTR = doc.direction == "ltr";
    function add(left, top, width, bottom) {
      if (top < 0) {
        top = 0;
      }
      top = Math.round(top);
      bottom = Math.round(bottom);
      fragment.appendChild(elt("div", null, "CodeMirror-selected", "position: absolute; left: " + left + "px;\n                             top: " + top + "px; width: " + (width == null ? rightSide - left : width) + "px;\n                             height: " + (bottom - top) + "px"));
    }
    function drawForLine(line, fromArg, toArg) {
      var lineObj = getLine(doc, line);
      var lineLen = lineObj.text.length;
      var start, end;
      function coords(ch, bias) {
        return charCoords(cm, Pos(line, ch), "div", lineObj, bias);
      }
      function wrapX(pos, dir, side) {
        var extent = wrappedLineExtentChar(cm, lineObj, null, pos);
        var prop = dir == "ltr" == (side == "after") ? "left" : "right";
        var ch = side == "after" ? extent.begin : extent.end - (/\s/.test(lineObj.text.charAt(extent.end - 1)) ? 2 : 1);
        return coords(ch, prop)[prop];
      }
      var order = getOrder(lineObj, doc.direction);
      iterateBidiSections(order, fromArg || 0, toArg == null ? lineLen : toArg, function (from, to, dir, i) {
        var ltr = dir == "ltr";
        var fromPos = coords(from, ltr ? "left" : "right");
        var toPos = coords(to - 1, ltr ? "right" : "left");
        var openStart = fromArg == null && from == 0,
          openEnd = toArg == null && to == lineLen;
        var first = i == 0,
          last = !order || i == order.length - 1;
        if (toPos.top - fromPos.top <= 3) {
          var openLeft = (docLTR ? openStart : openEnd) && first;
          var openRight = (docLTR ? openEnd : openStart) && last;
          var left = openLeft ? leftSide : (ltr ? fromPos : toPos).left;
          var right = openRight ? rightSide : (ltr ? toPos : fromPos).right;
          add(left, fromPos.top, right - left, fromPos.bottom);
        } else {
          var topLeft, topRight, botLeft, botRight;
          if (ltr) {
            topLeft = docLTR && openStart && first ? leftSide : fromPos.left;
            topRight = docLTR ? rightSide : wrapX(from, dir, "before");
            botLeft = docLTR ? leftSide : wrapX(to, dir, "after");
            botRight = docLTR && openEnd && last ? rightSide : toPos.right;
          } else {
            topLeft = !docLTR ? leftSide : wrapX(from, dir, "before");
            topRight = !docLTR && openStart && first ? rightSide : fromPos.right;
            botLeft = !docLTR && openEnd && last ? leftSide : toPos.left;
            botRight = !docLTR ? rightSide : wrapX(to, dir, "after");
          }
          add(topLeft, fromPos.top, topRight - topLeft, fromPos.bottom);
          if (fromPos.bottom < toPos.top) {
            add(leftSide, fromPos.bottom, null, toPos.top);
          }
          add(botLeft, toPos.top, botRight - botLeft, toPos.bottom);
        }
        if (!start || cmpCoords(fromPos, start) < 0) {
          start = fromPos;
        }
        if (cmpCoords(toPos, start) < 0) {
          start = toPos;
        }
        if (!end || cmpCoords(fromPos, end) < 0) {
          end = fromPos;
        }
        if (cmpCoords(toPos, end) < 0) {
          end = toPos;
        }
      });
      return {
        start: start,
        end: end
      };
    }
    var sFrom = range$$1.from(),
      sTo = range$$1.to();
    if (sFrom.line == sTo.line) {
      drawForLine(sFrom.line, sFrom.ch, sTo.ch);
    } else {
      var fromLine = getLine(doc, sFrom.line),
        toLine = getLine(doc, sTo.line);
      var singleVLine = visualLine(fromLine) == visualLine(toLine);
      var leftEnd = drawForLine(sFrom.line, sFrom.ch, singleVLine ? fromLine.text.length + 1 : null).end;
      var rightStart = drawForLine(sTo.line, singleVLine ? 0 : null, sTo.ch).start;
      if (singleVLine) {
        if (leftEnd.top < rightStart.top - 2) {
          add(leftEnd.right, leftEnd.top, null, leftEnd.bottom);
          add(leftSide, rightStart.top, rightStart.left, rightStart.bottom);
        } else {
          add(leftEnd.right, leftEnd.top, rightStart.left - leftEnd.right, leftEnd.bottom);
        }
      }
      if (leftEnd.bottom < rightStart.top) {
        add(leftSide, leftEnd.bottom, null, rightStart.top);
      }
    }
    output.appendChild(fragment);
  }
  function restartBlink(cm) {
    if (!cm.state.focused) {
      return;
    }
    var display = cm.display;
    clearInterval(display.blinker);
    var on = true;
    display.cursorDiv.style.visibility = "";
    if (cm.options.cursorBlinkRate > 0) {
      display.blinker = setInterval(function () {
        return display.cursorDiv.style.visibility = (on = !on) ? "" : "hidden";
      }, cm.options.cursorBlinkRate);
    } else if (cm.options.cursorBlinkRate < 0) {
      display.cursorDiv.style.visibility = "hidden";
    }
  }
  function ensureFocus(cm) {
    if (!cm.state.focused) {
      cm.display.input.focus();
      onFocus(cm);
    }
  }
  function delayBlurEvent(cm) {
    cm.state.delayingBlurEvent = true;
    setTimeout(function () {
      if (cm.state.delayingBlurEvent) {
        cm.state.delayingBlurEvent = false;
        onBlur(cm);
      }
    }, 100);
  }
  function onFocus(cm, e) {
    if (cm.state.delayingBlurEvent) {
      cm.state.delayingBlurEvent = false;
    }
    if (cm.options.readOnly == "nocursor") {
      return;
    }
    if (!cm.state.focused) {
      signal(cm, "focus", cm, e);
      cm.state.focused = true;
      addClass(cm.display.wrapper, "CodeMirror-focused");
      if (!cm.curOp && cm.display.selForContextMenu != cm.doc.sel) {
        cm.display.input.reset();
        if (webkit) {
          setTimeout(function () {
            return cm.display.input.reset(true);
          }, 20);
        }
      }
      cm.display.input.receivedFocus();
    }
    restartBlink(cm);
  }
  function onBlur(cm, e) {
    if (cm.state.delayingBlurEvent) {
      return;
    }
    if (cm.state.focused) {
      signal(cm, "blur", cm, e);
      cm.state.focused = false;
      rmClass(cm.display.wrapper, "CodeMirror-focused");
    }
    clearInterval(cm.display.blinker);
    setTimeout(function () {
      if (!cm.state.focused) {
        cm.display.shift = false;
      }
    }, 150);
  }
  function updateHeightsInViewport(cm) {
    var display = cm.display;
    var prevBottom = display.lineDiv.offsetTop;
    for (var i = 0; i < display.view.length; i++) {
      var cur = display.view[i],
        wrapping = cm.options.lineWrapping;
      var height = void 0,
        width = 0;
      if (cur.hidden) {
        continue;
      }
      if (ie && ie_version < 8) {
        var bot = cur.node.offsetTop + cur.node.offsetHeight;
        height = bot - prevBottom;
        prevBottom = bot;
      } else {
        var box = cur.node.getBoundingClientRect();
        height = box.bottom - box.top;
        if (!wrapping && cur.text.firstChild) {
          width = cur.text.firstChild.getBoundingClientRect().right - box.left - 1;
        }
      }
      var diff = cur.line.height - height;
      if (diff > .005 || diff < -.005) {
        updateLineHeight(cur.line, height);
        updateWidgetHeight(cur.line);
        if (cur.rest) {
          for (var j = 0; j < cur.rest.length; j++) {
            updateWidgetHeight(cur.rest[j]);
          }
        }
      }
      if (width > cm.display.sizerWidth) {
        var chWidth = Math.ceil(width / charWidth(cm.display));
        if (chWidth > cm.display.maxLineLength) {
          cm.display.maxLineLength = chWidth;
          cm.display.maxLine = cur.line;
          cm.display.maxLineChanged = true;
        }
      }
    }
  }
  function updateWidgetHeight(line) {
    if (line.widgets) {
      for (var i = 0; i < line.widgets.length; ++i) {
        var w = line.widgets[i],
          parent = w.node.parentNode;
        if (parent) {
          w.height = parent.offsetHeight;
        }
      }
    }
  }
  function visibleLines(display, doc, viewport) {
    var top = viewport && viewport.top != null ? Math.max(0, viewport.top) : display.scroller.scrollTop;
    top = Math.floor(top - paddingTop(display));
    var bottom = viewport && viewport.bottom != null ? viewport.bottom : top + display.wrapper.clientHeight;
    var from = lineAtHeight(doc, top),
      to = lineAtHeight(doc, bottom);
    if (viewport && viewport.ensure) {
      var ensureFrom = viewport.ensure.from.line,
        ensureTo = viewport.ensure.to.line;
      if (ensureFrom < from) {
        from = ensureFrom;
        to = lineAtHeight(doc, heightAtLine(getLine(doc, ensureFrom)) + display.wrapper.clientHeight);
      } else if (Math.min(ensureTo, doc.lastLine()) >= to) {
        from = lineAtHeight(doc, heightAtLine(getLine(doc, ensureTo)) - display.wrapper.clientHeight);
        to = ensureTo;
      }
    }
    return {
      from: from,
      to: Math.max(to, from + 1)
    };
  }
  function maybeScrollWindow(cm, rect) {
    if (signalDOMEvent(cm, "scrollCursorIntoView")) {
      return;
    }
    var display = cm.display,
      box = display.sizer.getBoundingClientRect(),
      doScroll = null;
    if (rect.top + box.top < 0) {
      doScroll = true;
    } else if (rect.bottom + box.top > (window.innerHeight || document.documentElement.clientHeight)) {
      doScroll = false;
    }
    if (doScroll != null && !phantom) {
      var scrollNode = elt("div", "​", null, "position: absolute;\n                         top: " + (rect.top - display.viewOffset - paddingTop(cm.display)) + "px;\n                         height: " + (rect.bottom - rect.top + scrollGap(cm) + display.barHeight) + "px;\n                         left: " + rect.left + "px; width: " + Math.max(2, rect.right - rect.left) + "px;");
      cm.display.lineSpace.appendChild(scrollNode);
      scrollNode.scrollIntoView(doScroll);
      cm.display.lineSpace.removeChild(scrollNode);
    }
  }
  function scrollPosIntoView(cm, pos, end, margin) {
    if (margin == null) {
      margin = 0;
    }
    var rect;
    if (!cm.options.lineWrapping && pos == end) {
      pos = pos.ch ? Pos(pos.line, pos.sticky == "before" ? pos.ch - 1 : pos.ch, "after") : pos;
      end = pos.sticky == "before" ? Pos(pos.line, pos.ch + 1, "before") : pos;
    }
    for (var limit = 0; limit < 5; limit++) {
      var changed = false;
      var coords = cursorCoords(cm, pos);
      var endCoords = !end || end == pos ? coords : cursorCoords(cm, end);
      rect = {
        left: Math.min(coords.left, endCoords.left),
        top: Math.min(coords.top, endCoords.top) - margin,
        right: Math.max(coords.left, endCoords.left),
        bottom: Math.max(coords.bottom, endCoords.bottom) + margin
      };
      var scrollPos = calculateScrollPos(cm, rect);
      var startTop = cm.doc.scrollTop,
        startLeft = cm.doc.scrollLeft;
      if (scrollPos.scrollTop != null) {
        updateScrollTop(cm, scrollPos.scrollTop);
        if (Math.abs(cm.doc.scrollTop - startTop) > 1) {
          changed = true;
        }
      }
      if (scrollPos.scrollLeft != null) {
        setScrollLeft(cm, scrollPos.scrollLeft);
        if (Math.abs(cm.doc.scrollLeft - startLeft) > 1) {
          changed = true;
        }
      }
      if (!changed) {
        break;
      }
    }
    return rect;
  }
  function scrollIntoView(cm, rect) {
    var scrollPos = calculateScrollPos(cm, rect);
    if (scrollPos.scrollTop != null) {
      updateScrollTop(cm, scrollPos.scrollTop);
    }
    if (scrollPos.scrollLeft != null) {
      setScrollLeft(cm, scrollPos.scrollLeft);
    }
  }
  function calculateScrollPos(cm, rect) {
    var display = cm.display,
      snapMargin = textHeight(cm.display);
    if (rect.top < 0) {
      rect.top = 0;
    }
    var screentop = cm.curOp && cm.curOp.scrollTop != null ? cm.curOp.scrollTop : display.scroller.scrollTop;
    var screen = displayHeight(cm),
      result = {};
    if (rect.bottom - rect.top > screen) {
      rect.bottom = rect.top + screen;
    }
    var docBottom = cm.doc.height + paddingVert(display);
    var atTop = rect.top < snapMargin,
      atBottom = rect.bottom > docBottom - snapMargin;
    if (rect.top < screentop) {
      result.scrollTop = atTop ? 0 : rect.top;
    } else if (rect.bottom > screentop + screen) {
      var newTop = Math.min(rect.top, (atBottom ? docBottom : rect.bottom) - screen);
      if (newTop != screentop) {
        result.scrollTop = newTop;
      }
    }
    var screenleft = cm.curOp && cm.curOp.scrollLeft != null ? cm.curOp.scrollLeft : display.scroller.scrollLeft;
    var screenw = displayWidth(cm) - (cm.options.fixedGutter ? display.gutters.offsetWidth : 0);
    var tooWide = rect.right - rect.left > screenw;
    if (tooWide) {
      rect.right = rect.left + screenw;
    }
    if (rect.left < 10) {
      result.scrollLeft = 0;
    } else if (rect.left < screenleft) {
      result.scrollLeft = Math.max(0, rect.left - (tooWide ? 0 : 10));
    } else if (rect.right > screenw + screenleft - 3) {
      result.scrollLeft = rect.right + (tooWide ? 0 : 10) - screenw;
    }
    return result;
  }
  function addToScrollTop(cm, top) {
    if (top == null) {
      return;
    }
    resolveScrollToPos(cm);
    cm.curOp.scrollTop = (cm.curOp.scrollTop == null ? cm.doc.scrollTop : cm.curOp.scrollTop) + top;
  }
  function ensureCursorVisible(cm) {
    resolveScrollToPos(cm);
    var cur = cm.getCursor();
    cm.curOp.scrollToPos = {
      from: cur,
      to: cur,
      margin: cm.options.cursorScrollMargin
    };
  }
  function scrollToCoords(cm, x, y) {
    if (x != null || y != null) {
      resolveScrollToPos(cm);
    }
    if (x != null) {
      cm.curOp.scrollLeft = x;
    }
    if (y != null) {
      cm.curOp.scrollTop = y;
    }
  }
  function scrollToRange(cm, range$$1) {
    resolveScrollToPos(cm);
    cm.curOp.scrollToPos = range$$1;
  }
  function resolveScrollToPos(cm) {
    var range$$1 = cm.curOp.scrollToPos;
    if (range$$1) {
      cm.curOp.scrollToPos = null;
      var from = estimateCoords(cm, range$$1.from),
        to = estimateCoords(cm, range$$1.to);
      scrollToCoordsRange(cm, from, to, range$$1.margin);
    }
  }
  function scrollToCoordsRange(cm, from, to, margin) {
    var sPos = calculateScrollPos(cm, {
      left: Math.min(from.left, to.left),
      top: Math.min(from.top, to.top) - margin,
      right: Math.max(from.right, to.right),
      bottom: Math.max(from.bottom, to.bottom) + margin
    });
    scrollToCoords(cm, sPos.scrollLeft, sPos.scrollTop);
  }
  function updateScrollTop(cm, val) {
    if (Math.abs(cm.doc.scrollTop - val) < 2) {
      return;
    }
    if (!gecko) {
      updateDisplaySimple(cm, {
        top: val
      });
    }
    setScrollTop(cm, val, true);
    if (gecko) {
      updateDisplaySimple(cm);
    }
    startWorker(cm, 100);
  }
  function setScrollTop(cm, val, forceScroll) {
    val = Math.min(cm.display.scroller.scrollHeight - cm.display.scroller.clientHeight, val);
    if (cm.display.scroller.scrollTop == val && !forceScroll) {
      return;
    }
    cm.doc.scrollTop = val;
    cm.display.scrollbars.setScrollTop(val);
    if (cm.display.scroller.scrollTop != val) {
      cm.display.scroller.scrollTop = val;
    }
  }
  function setScrollLeft(cm, val, isScroller, forceScroll) {
    val = Math.min(val, cm.display.scroller.scrollWidth - cm.display.scroller.clientWidth);
    if ((isScroller ? val == cm.doc.scrollLeft : Math.abs(cm.doc.scrollLeft - val) < 2) && !forceScroll) {
      return;
    }
    cm.doc.scrollLeft = val;
    alignHorizontally(cm);
    if (cm.display.scroller.scrollLeft != val) {
      cm.display.scroller.scrollLeft = val;
    }
    cm.display.scrollbars.setScrollLeft(val);
  }
  function measureForScrollbars(cm) {
    var d = cm.display,
      gutterW = d.gutters.offsetWidth;
    var docH = Math.round(cm.doc.height + paddingVert(cm.display));
    return {
      clientHeight: d.scroller.clientHeight,
      viewHeight: d.wrapper.clientHeight,
      scrollWidth: d.scroller.scrollWidth,
      clientWidth: d.scroller.clientWidth,
      viewWidth: d.wrapper.clientWidth,
      barLeft: cm.options.fixedGutter ? gutterW : 0,
      docHeight: docH,
      scrollHeight: docH + scrollGap(cm) + d.barHeight,
      nativeBarWidth: d.nativeBarWidth,
      gutterWidth: gutterW
    };
  }
  var NativeScrollbars = function (place, scroll, cm) {
    this.cm = cm;
    var vert = this.vert = elt("div", [elt("div", null, null, "min-width: 1px")], "CodeMirror-vscrollbar");
    var horiz = this.horiz = elt("div", [elt("div", null, null, "height: 100%; min-height: 1px")], "CodeMirror-hscrollbar");
    vert.tabIndex = horiz.tabIndex = -1;
    place(vert);
    place(horiz);
    on(vert, "scroll", function () {
      if (vert.clientHeight) {
        scroll(vert.scrollTop, "vertical");
      }
    });
    on(horiz, "scroll", function () {
      if (horiz.clientWidth) {
        scroll(horiz.scrollLeft, "horizontal");
      }
    });
    this.checkedZeroWidth = false;
    if (ie && ie_version < 8) {
      this.horiz.style.minHeight = this.vert.style.minWidth = "18px";
    }
  };
  NativeScrollbars.prototype.update = function (measure) {
    var needsH = measure.scrollWidth > measure.clientWidth + 1;
    var needsV = measure.scrollHeight > measure.clientHeight + 1;
    var sWidth = measure.nativeBarWidth;
    if (needsV) {
      this.vert.style.display = "block";
      this.vert.style.bottom = needsH ? sWidth + "px" : "0";
      var totalHeight = measure.viewHeight - (needsH ? sWidth : 0);
      this.vert.firstChild.style.height = Math.max(0, measure.scrollHeight - measure.clientHeight + totalHeight) + "px";
    } else {
      this.vert.style.display = "";
      this.vert.firstChild.style.height = "0";
    }
    if (needsH) {
      this.horiz.style.display = "block";
      this.horiz.style.right = needsV ? sWidth + "px" : "0";
      this.horiz.style.left = measure.barLeft + "px";
      var totalWidth = measure.viewWidth - measure.barLeft - (needsV ? sWidth : 0);
      this.horiz.firstChild.style.width = Math.max(0, measure.scrollWidth - measure.clientWidth + totalWidth) + "px";
    } else {
      this.horiz.style.display = "";
      this.horiz.firstChild.style.width = "0";
    }
    if (!this.checkedZeroWidth && measure.clientHeight > 0) {
      if (sWidth == 0) {
        this.zeroWidthHack();
      }
      this.checkedZeroWidth = true;
    }
    return {
      right: needsV ? sWidth : 0,
      bottom: needsH ? sWidth : 0
    };
  };
  NativeScrollbars.prototype.setScrollLeft = function (pos) {
    if (this.horiz.scrollLeft != pos) {
      this.horiz.scrollLeft = pos;
    }
    if (this.disableHoriz) {
      this.enableZeroWidthBar(this.horiz, this.disableHoriz, "horiz");
    }
  };
  NativeScrollbars.prototype.setScrollTop = function (pos) {
    if (this.vert.scrollTop != pos) {
      this.vert.scrollTop = pos;
    }
    if (this.disableVert) {
      this.enableZeroWidthBar(this.vert, this.disableVert, "vert");
    }
  };
  NativeScrollbars.prototype.zeroWidthHack = function () {
    var w = mac && !mac_geMountainLion ? "12px" : "18px";
    this.horiz.style.height = this.vert.style.width = w;
    this.horiz.style.pointerEvents = this.vert.style.pointerEvents = "none";
    this.disableHoriz = new Delayed();
    this.disableVert = new Delayed();
  };
  NativeScrollbars.prototype.enableZeroWidthBar = function (bar, delay, type) {
    bar.style.pointerEvents = "auto";
    function maybeDisable() {
      var box = bar.getBoundingClientRect();
      var elt$$1 = type == "vert" ? document.elementFromPoint(box.right - 1, (box.top + box.bottom) / 2) : document.elementFromPoint((box.right + box.left) / 2, box.bottom - 1);
      if (elt$$1 != bar) {
        bar.style.pointerEvents = "none";
      } else {
        delay.set(1e3, maybeDisable);
      }
    }
    delay.set(1e3, maybeDisable);
  };
  NativeScrollbars.prototype.clear = function () {
    var parent = this.horiz.parentNode;
    parent.removeChild(this.horiz);
    parent.removeChild(this.vert);
  };
  var NullScrollbars = function () {};
  NullScrollbars.prototype.update = function () {
    return {
      bottom: 0,
      right: 0
    };
  };
  NullScrollbars.prototype.setScrollLeft = function () {};
  NullScrollbars.prototype.setScrollTop = function () {};
  NullScrollbars.prototype.clear = function () {};
  function updateScrollbars(cm, measure) {
    if (!measure) {
      measure = measureForScrollbars(cm);
    }
    var startWidth = cm.display.barWidth,
      startHeight = cm.display.barHeight;
    updateScrollbarsInner(cm, measure);
    for (var i = 0; i < 4 && startWidth != cm.display.barWidth || startHeight != cm.display.barHeight; i++) {
      if (startWidth != cm.display.barWidth && cm.options.lineWrapping) {
        updateHeightsInViewport(cm);
      }
      updateScrollbarsInner(cm, measureForScrollbars(cm));
      startWidth = cm.display.barWidth;
      startHeight = cm.display.barHeight;
    }
  }
  function updateScrollbarsInner(cm, measure) {
    var d = cm.display;
    var sizes = d.scrollbars.update(measure);
    d.sizer.style.paddingRight = (d.barWidth = sizes.right) + "px";
    d.sizer.style.paddingBottom = (d.barHeight = sizes.bottom) + "px";
    d.heightForcer.style.borderBottom = sizes.bottom + "px solid transparent";
    if (sizes.right && sizes.bottom) {
      d.scrollbarFiller.style.display = "block";
      d.scrollbarFiller.style.height = sizes.bottom + "px";
      d.scrollbarFiller.style.width = sizes.right + "px";
    } else {
      d.scrollbarFiller.style.display = "";
    }
    if (sizes.bottom && cm.options.coverGutterNextToScrollbar && cm.options.fixedGutter) {
      d.gutterFiller.style.display = "block";
      d.gutterFiller.style.height = sizes.bottom + "px";
      d.gutterFiller.style.width = measure.gutterWidth + "px";
    } else {
      d.gutterFiller.style.display = "";
    }
  }
  var scrollbarModel = {
    native: NativeScrollbars,
    null: NullScrollbars
  };
  function initScrollbars(cm) {
    if (cm.display.scrollbars) {
      cm.display.scrollbars.clear();
      if (cm.display.scrollbars.addClass) {
        rmClass(cm.display.wrapper, cm.display.scrollbars.addClass);
      }
    }
    cm.display.scrollbars = new scrollbarModel[cm.options.scrollbarStyle](function (node) {
      cm.display.wrapper.insertBefore(node, cm.display.scrollbarFiller);
      on(node, "mousedown", function () {
        if (cm.state.focused) {
          setTimeout(function () {
            return cm.display.input.focus();
          }, 0);
        }
      });
      node.setAttribute("cm-not-content", "true");
    }, function (pos, axis) {
      if (axis == "horizontal") {
        setScrollLeft(cm, pos);
      } else {
        updateScrollTop(cm, pos);
      }
    }, cm);
    if (cm.display.scrollbars.addClass) {
      addClass(cm.display.wrapper, cm.display.scrollbars.addClass);
    }
  }
  var nextOpId = 0;
  function startOperation(cm) {
    cm.curOp = {
      cm: cm,
      viewChanged: false,
      startHeight: cm.doc.height,
      forceUpdate: false,
      updateInput: 0,
      typing: false,
      changeObjs: null,
      cursorActivityHandlers: null,
      cursorActivityCalled: 0,
      selectionChanged: false,
      updateMaxLine: false,
      scrollLeft: null,
      scrollTop: null,
      scrollToPos: null,
      focus: false,
      id: ++nextOpId
    };
    pushOperation(cm.curOp);
  }
  function endOperation(cm) {
    var op = cm.curOp;
    if (op) {
      finishOperation(op, function (group) {
        for (var i = 0; i < group.ops.length; i++) {
          group.ops[i].cm.curOp = null;
        }
        endOperations(group);
      });
    }
  }
  function endOperations(group) {
    var ops = group.ops;
    for (var i = 0; i < ops.length; i++) {
      endOperation_R1(ops[i]);
    }
    for (var i$1 = 0; i$1 < ops.length; i$1++) {
      endOperation_W1(ops[i$1]);
    }
    for (var i$2 = 0; i$2 < ops.length; i$2++) {
      endOperation_R2(ops[i$2]);
    }
    for (var i$3 = 0; i$3 < ops.length; i$3++) {
      endOperation_W2(ops[i$3]);
    }
    for (var i$4 = 0; i$4 < ops.length; i$4++) {
      endOperation_finish(ops[i$4]);
    }
  }
  function endOperation_R1(op) {
    var cm = op.cm,
      display = cm.display;
    maybeClipScrollbars(cm);
    if (op.updateMaxLine) {
      findMaxLine(cm);
    }
    op.mustUpdate = op.viewChanged || op.forceUpdate || op.scrollTop != null || op.scrollToPos && (op.scrollToPos.from.line < display.viewFrom || op.scrollToPos.to.line >= display.viewTo) || display.maxLineChanged && cm.options.lineWrapping;
    op.update = op.mustUpdate && new DisplayUpdate(cm, op.mustUpdate && {
      top: op.scrollTop,
      ensure: op.scrollToPos
    }, op.forceUpdate);
  }
  function endOperation_W1(op) {
    op.updatedDisplay = op.mustUpdate && updateDisplayIfNeeded(op.cm, op.update);
  }
  function endOperation_R2(op) {
    var cm = op.cm,
      display = cm.display;
    if (op.updatedDisplay) {
      updateHeightsInViewport(cm);
    }
    op.barMeasure = measureForScrollbars(cm);
    if (display.maxLineChanged && !cm.options.lineWrapping) {
      op.adjustWidthTo = measureChar(cm, display.maxLine, display.maxLine.text.length).left + 3;
      cm.display.sizerWidth = op.adjustWidthTo;
      op.barMeasure.scrollWidth = Math.max(display.scroller.clientWidth, display.sizer.offsetLeft + op.adjustWidthTo + scrollGap(cm) + cm.display.barWidth);
      op.maxScrollLeft = Math.max(0, display.sizer.offsetLeft + op.adjustWidthTo - displayWidth(cm));
    }
    if (op.updatedDisplay || op.selectionChanged) {
      op.preparedSelection = display.input.prepareSelection();
    }
  }
  function endOperation_W2(op) {
    var cm = op.cm;
    if (op.adjustWidthTo != null) {
      cm.display.sizer.style.minWidth = op.adjustWidthTo + "px";
      if (op.maxScrollLeft < cm.doc.scrollLeft) {
        setScrollLeft(cm, Math.min(cm.display.scroller.scrollLeft, op.maxScrollLeft), true);
      }
      cm.display.maxLineChanged = false;
    }
    var takeFocus = op.focus && op.focus == activeElt();
    if (op.preparedSelection) {
      cm.display.input.showSelection(op.preparedSelection, takeFocus);
    }
    if (op.updatedDisplay || op.startHeight != cm.doc.height) {
      updateScrollbars(cm, op.barMeasure);
    }
    if (op.updatedDisplay) {
      setDocumentHeight(cm, op.barMeasure);
    }
    if (op.selectionChanged) {
      restartBlink(cm);
    }
    if (cm.state.focused && op.updateInput) {
      cm.display.input.reset(op.typing);
    }
    if (takeFocus) {
      ensureFocus(op.cm);
    }
  }
  function endOperation_finish(op) {
    var cm = op.cm,
      display = cm.display,
      doc = cm.doc;
    if (op.updatedDisplay) {
      postUpdateDisplay(cm, op.update);
    }
    if (display.wheelStartX != null && (op.scrollTop != null || op.scrollLeft != null || op.scrollToPos)) {
      display.wheelStartX = display.wheelStartY = null;
    }
    if (op.scrollTop != null) {
      setScrollTop(cm, op.scrollTop, op.forceScroll);
    }
    if (op.scrollLeft != null) {
      setScrollLeft(cm, op.scrollLeft, true, true);
    }
    if (op.scrollToPos) {
      var rect = scrollPosIntoView(cm, clipPos(doc, op.scrollToPos.from), clipPos(doc, op.scrollToPos.to), op.scrollToPos.margin);
      maybeScrollWindow(cm, rect);
    }
    var hidden = op.maybeHiddenMarkers,
      unhidden = op.maybeUnhiddenMarkers;
    if (hidden) {
      for (var i = 0; i < hidden.length; ++i) {
        if (!hidden[i].lines.length) {
          signal(hidden[i], "hide");
        }
      }
    }
    if (unhidden) {
      for (var i$1 = 0; i$1 < unhidden.length; ++i$1) {
        if (unhidden[i$1].lines.length) {
          signal(unhidden[i$1], "unhide");
        }
      }
    }
    if (display.wrapper.offsetHeight) {
      doc.scrollTop = cm.display.scroller.scrollTop;
    }
    if (op.changeObjs) {
      signal(cm, "changes", cm, op.changeObjs);
    }
    if (op.update) {
      op.update.finish();
    }
  }
  function runInOp(cm, f) {
    if (cm.curOp) {
      return f();
    }
    startOperation(cm);
    try {
      return f();
    } finally {
      endOperation(cm);
    }
  }
  function operation(cm, f) {
    return function () {
      if (cm.curOp) {
        return f.apply(cm, arguments);
      }
      startOperation(cm);
      try {
        return f.apply(cm, arguments);
      } finally {
        endOperation(cm);
      }
    };
  }
  function methodOp(f) {
    return function () {
      if (this.curOp) {
        return f.apply(this, arguments);
      }
      startOperation(this);
      try {
        return f.apply(this, arguments);
      } finally {
        endOperation(this);
      }
    };
  }
  function docMethodOp(f) {
    return function () {
      var cm = this.cm;
      if (!cm || cm.curOp) {
        return f.apply(this, arguments);
      }
      startOperation(cm);
      try {
        return f.apply(this, arguments);
      } finally {
        endOperation(cm);
      }
    };
  }
  function startWorker(cm, time) {
    if (cm.doc.highlightFrontier < cm.display.viewTo) {
      cm.state.highlight.set(time, bind(highlightWorker, cm));
    }
  }
  function highlightWorker(cm) {
    var doc = cm.doc;
    if (doc.highlightFrontier >= cm.display.viewTo) {
      return;
    }
    var end = +new Date() + cm.options.workTime;
    var context = getContextBefore(cm, doc.highlightFrontier);
    var changedLines = [];
    doc.iter(context.line, Math.min(doc.first + doc.size, cm.display.viewTo + 500), function (line) {
      if (context.line >= cm.display.viewFrom) {
        var oldStyles = line.styles;
        var resetState = line.text.length > cm.options.maxHighlightLength ? copyState(doc.mode, context.state) : null;
        var highlighted = highlightLine(cm, line, context, true);
        if (resetState) {
          context.state = resetState;
        }
        line.styles = highlighted.styles;
        var oldCls = line.styleClasses,
          newCls = highlighted.classes;
        if (newCls) {
          line.styleClasses = newCls;
        } else if (oldCls) {
          line.styleClasses = null;
        }
        var ischange = !oldStyles || oldStyles.length != line.styles.length || oldCls != newCls && (!oldCls || !newCls || oldCls.bgClass != newCls.bgClass || oldCls.textClass != newCls.textClass);
        for (var i = 0; !ischange && i < oldStyles.length; ++i) {
          ischange = oldStyles[i] != line.styles[i];
        }
        if (ischange) {
          changedLines.push(context.line);
        }
        line.stateAfter = context.save();
        context.nextLine();
      } else {
        if (line.text.length <= cm.options.maxHighlightLength) {
          processLine(cm, line.text, context);
        }
        line.stateAfter = context.line % 5 == 0 ? context.save() : null;
        context.nextLine();
      }
      if (+new Date() > end) {
        startWorker(cm, cm.options.workDelay);
        return true;
      }
    });
    doc.highlightFrontier = context.line;
    doc.modeFrontier = Math.max(doc.modeFrontier, context.line);
    if (changedLines.length) {
      runInOp(cm, function () {
        for (var i = 0; i < changedLines.length; i++) {
          regLineChange(cm, changedLines[i], "text");
        }
      });
    }
  }
  var DisplayUpdate = function (cm, viewport, force) {
    var display = cm.display;
    this.viewport = viewport;
    this.visible = visibleLines(display, cm.doc, viewport);
    this.editorIsHidden = !display.wrapper.offsetWidth;
    this.wrapperHeight = display.wrapper.clientHeight;
    this.wrapperWidth = display.wrapper.clientWidth;
    this.oldDisplayWidth = displayWidth(cm);
    this.force = force;
    this.dims = getDimensions(cm);
    this.events = [];
  };
  DisplayUpdate.prototype.signal = function (emitter, type) {
    if (hasHandler(emitter, type)) {
      this.events.push(arguments);
    }
  };
  DisplayUpdate.prototype.finish = function () {
    for (var i = 0; i < this.events.length; i++) {
      signal.apply(null, this.events[i]);
    }
  };
  function maybeClipScrollbars(cm) {
    var display = cm.display;
    if (!display.scrollbarsClipped && display.scroller.offsetWidth) {
      display.nativeBarWidth = display.scroller.offsetWidth - display.scroller.clientWidth;
      display.heightForcer.style.height = scrollGap(cm) + "px";
      display.sizer.style.marginBottom = -display.nativeBarWidth + "px";
      display.sizer.style.borderRightWidth = scrollGap(cm) + "px";
      display.scrollbarsClipped = true;
    }
  }
  function selectionSnapshot(cm) {
    if (cm.hasFocus()) {
      return null;
    }
    var active = activeElt();
    if (!active || !contains(cm.display.lineDiv, active)) {
      return null;
    }
    var result = {
      activeElt: active
    };
    if (window.getSelection) {
      var sel = window.getSelection();
      if (sel.anchorNode && sel.extend && contains(cm.display.lineDiv, sel.anchorNode)) {
        result.anchorNode = sel.anchorNode;
        result.anchorOffset = sel.anchorOffset;
        result.focusNode = sel.focusNode;
        result.focusOffset = sel.focusOffset;
      }
    }
    return result;
  }
  function restoreSelection(snapshot) {
    if (!snapshot || !snapshot.activeElt || snapshot.activeElt == activeElt()) {
      return;
    }
    snapshot.activeElt.focus();
    if (snapshot.anchorNode && contains(document.body, snapshot.anchorNode) && contains(document.body, snapshot.focusNode)) {
      var sel = window.getSelection(),
        range$$1 = document.createRange();
      range$$1.setEnd(snapshot.anchorNode, snapshot.anchorOffset);
      range$$1.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range$$1);
      sel.extend(snapshot.focusNode, snapshot.focusOffset);
    }
  }
  function updateDisplayIfNeeded(cm, update) {
    var display = cm.display,
      doc = cm.doc;
    if (update.editorIsHidden) {
      resetView(cm);
      return false;
    }
    if (!update.force && update.visible.from >= display.viewFrom && update.visible.to <= display.viewTo && (display.updateLineNumbers == null || display.updateLineNumbers >= display.viewTo) && display.renderedView == display.view && countDirtyView(cm) == 0) {
      return false;
    }
    if (maybeUpdateLineNumberWidth(cm)) {
      resetView(cm);
      update.dims = getDimensions(cm);
    }
    var end = doc.first + doc.size;
    var from = Math.max(update.visible.from - cm.options.viewportMargin, doc.first);
    var to = Math.min(end, update.visible.to + cm.options.viewportMargin);
    if (display.viewFrom < from && from - display.viewFrom < 20) {
      from = Math.max(doc.first, display.viewFrom);
    }
    if (display.viewTo > to && display.viewTo - to < 20) {
      to = Math.min(end, display.viewTo);
    }
    if (sawCollapsedSpans) {
      from = visualLineNo(cm.doc, from);
      to = visualLineEndNo(cm.doc, to);
    }
    var different = from != display.viewFrom || to != display.viewTo || display.lastWrapHeight != update.wrapperHeight || display.lastWrapWidth != update.wrapperWidth;
    adjustView(cm, from, to);
    display.viewOffset = heightAtLine(getLine(cm.doc, display.viewFrom));
    cm.display.mover.style.top = display.viewOffset + "px";
    var toUpdate = countDirtyView(cm);
    if (!different && toUpdate == 0 && !update.force && display.renderedView == display.view && (display.updateLineNumbers == null || display.updateLineNumbers >= display.viewTo)) {
      return false;
    }
    var selSnapshot = selectionSnapshot(cm);
    if (toUpdate > 4) {
      display.lineDiv.style.display = "none";
    }
    patchDisplay(cm, display.updateLineNumbers, update.dims);
    if (toUpdate > 4) {
      display.lineDiv.style.display = "";
    }
    display.renderedView = display.view;
    restoreSelection(selSnapshot);
    removeChildren(display.cursorDiv);
    removeChildren(display.selectionDiv);
    display.gutters.style.height = display.sizer.style.minHeight = 0;
    if (different) {
      display.lastWrapHeight = update.wrapperHeight;
      display.lastWrapWidth = update.wrapperWidth;
      startWorker(cm, 400);
    }
    display.updateLineNumbers = null;
    return true;
  }
  function postUpdateDisplay(cm, update) {
    var viewport = update.viewport;
    for (var first = true;; first = false) {
      if (!first || !cm.options.lineWrapping || update.oldDisplayWidth == displayWidth(cm)) {
        if (viewport && viewport.top != null) {
          viewport = {
            top: Math.min(cm.doc.height + paddingVert(cm.display) - displayHeight(cm), viewport.top)
          };
        }
        update.visible = visibleLines(cm.display, cm.doc, viewport);
        if (update.visible.from >= cm.display.viewFrom && update.visible.to <= cm.display.viewTo) {
          break;
        }
      }
      if (!updateDisplayIfNeeded(cm, update)) {
        break;
      }
      updateHeightsInViewport(cm);
      var barMeasure = measureForScrollbars(cm);
      updateSelection(cm);
      updateScrollbars(cm, barMeasure);
      setDocumentHeight(cm, barMeasure);
      update.force = false;
    }
    update.signal(cm, "update", cm);
    if (cm.display.viewFrom != cm.display.reportedViewFrom || cm.display.viewTo != cm.display.reportedViewTo) {
      update.signal(cm, "viewportChange", cm, cm.display.viewFrom, cm.display.viewTo);
      cm.display.reportedViewFrom = cm.display.viewFrom;
      cm.display.reportedViewTo = cm.display.viewTo;
    }
  }
  function updateDisplaySimple(cm, viewport) {
    var update = new DisplayUpdate(cm, viewport);
    if (updateDisplayIfNeeded(cm, update)) {
      updateHeightsInViewport(cm);
      postUpdateDisplay(cm, update);
      var barMeasure = measureForScrollbars(cm);
      updateSelection(cm);
      updateScrollbars(cm, barMeasure);
      setDocumentHeight(cm, barMeasure);
      update.finish();
    }
  }
  function patchDisplay(cm, updateNumbersFrom, dims) {
    var display = cm.display,
      lineNumbers = cm.options.lineNumbers;
    var container = display.lineDiv,
      cur = container.firstChild;
    function rm(node) {
      var next = node.nextSibling;
      if (webkit && mac && cm.display.currentWheelTarget == node) {
        node.style.display = "none";
      } else {
        node.parentNode.removeChild(node);
      }
      return next;
    }
    var view = display.view,
      lineN = display.viewFrom;
    for (var i = 0; i < view.length; i++) {
      var lineView = view[i];
      if (lineView.hidden) ;else if (!lineView.node || lineView.node.parentNode != container) {
        var node = buildLineElement(cm, lineView, lineN, dims);
        container.insertBefore(node, cur);
      } else {
        while (cur != lineView.node) {
          cur = rm(cur);
        }
        var updateNumber = lineNumbers && updateNumbersFrom != null && updateNumbersFrom <= lineN && lineView.lineNumber;
        if (lineView.changes) {
          if (indexOf(lineView.changes, "gutter") > -1) {
            updateNumber = false;
          }
          updateLineForChanges(cm, lineView, lineN, dims);
        }
        if (updateNumber) {
          removeChildren(lineView.lineNumber);
          lineView.lineNumber.appendChild(document.createTextNode(lineNumberFor(cm.options, lineN)));
        }
        cur = lineView.node.nextSibling;
      }
      lineN += lineView.size;
    }
    while (cur) {
      cur = rm(cur);
    }
  }
  function updateGutterSpace(display) {
    var width = display.gutters.offsetWidth;
    display.sizer.style.marginLeft = width + "px";
  }
  function setDocumentHeight(cm, measure) {
    cm.display.sizer.style.minHeight = measure.docHeight + "px";
    cm.display.heightForcer.style.top = measure.docHeight + "px";
    cm.display.gutters.style.height = measure.docHeight + cm.display.barHeight + scrollGap(cm) + "px";
  }
  function alignHorizontally(cm) {
    var display = cm.display,
      view = display.view;
    if (!display.alignWidgets && (!display.gutters.firstChild || !cm.options.fixedGutter)) {
      return;
    }
    var comp = compensateForHScroll(display) - display.scroller.scrollLeft + cm.doc.scrollLeft;
    var gutterW = display.gutters.offsetWidth,
      left = comp + "px";
    for (var i = 0; i < view.length; i++) {
      if (!view[i].hidden) {
        if (cm.options.fixedGutter) {
          if (view[i].gutter) {
            view[i].gutter.style.left = left;
          }
          if (view[i].gutterBackground) {
            view[i].gutterBackground.style.left = left;
          }
        }
        var align = view[i].alignable;
        if (align) {
          for (var j = 0; j < align.length; j++) {
            align[j].style.left = left;
          }
        }
      }
    }
    if (cm.options.fixedGutter) {
      display.gutters.style.left = comp + gutterW + "px";
    }
  }
  function maybeUpdateLineNumberWidth(cm) {
    if (!cm.options.lineNumbers) {
      return false;
    }
    var doc = cm.doc,
      last = lineNumberFor(cm.options, doc.first + doc.size - 1),
      display = cm.display;
    if (last.length != display.lineNumChars) {
      var test = display.measure.appendChild(elt("div", [elt("div", last)], "CodeMirror-linenumber CodeMirror-gutter-elt"));
      var innerW = test.firstChild.offsetWidth,
        padding = test.offsetWidth - innerW;
      display.lineGutter.style.width = "";
      display.lineNumInnerWidth = Math.max(innerW, display.lineGutter.offsetWidth - padding) + 1;
      display.lineNumWidth = display.lineNumInnerWidth + padding;
      display.lineNumChars = display.lineNumInnerWidth ? last.length : -1;
      display.lineGutter.style.width = display.lineNumWidth + "px";
      updateGutterSpace(cm.display);
      return true;
    }
    return false;
  }
  function getGutters(gutters, lineNumbers) {
    var result = [],
      sawLineNumbers = false;
    for (var i = 0; i < gutters.length; i++) {
      var name = gutters[i],
        style = null;
      if (typeof name != "string") {
        style = name.style;
        name = name.className;
      }
      if (name == "CodeMirror-linenumbers") {
        if (!lineNumbers) {
          continue;
        } else {
          sawLineNumbers = true;
        }
      }
      result.push({
        className: name,
        style: style
      });
    }
    if (lineNumbers && !sawLineNumbers) {
      result.push({
        className: "CodeMirror-linenumbers",
        style: null
      });
    }
    return result;
  }
  function renderGutters(display) {
    var gutters = display.gutters,
      specs = display.gutterSpecs;
    removeChildren(gutters);
    display.lineGutter = null;
    for (var i = 0; i < specs.length; ++i) {
      var ref = specs[i];
      var className = ref.className;
      var style = ref.style;
      var gElt = gutters.appendChild(elt("div", null, "CodeMirror-gutter " + className));
      if (style) {
        gElt.style.cssText = style;
      }
      if (className == "CodeMirror-linenumbers") {
        display.lineGutter = gElt;
        gElt.style.width = (display.lineNumWidth || 1) + "px";
      }
    }
    gutters.style.display = specs.length ? "" : "none";
    updateGutterSpace(display);
  }
  function updateGutters(cm) {
    renderGutters(cm.display);
    regChange(cm);
    alignHorizontally(cm);
  }
  function Display(place, doc, input, options) {
    var d = this;
    this.input = input;
    d.scrollbarFiller = elt("div", null, "CodeMirror-scrollbar-filler");
    d.scrollbarFiller.setAttribute("cm-not-content", "true");
    d.gutterFiller = elt("div", null, "CodeMirror-gutter-filler");
    d.gutterFiller.setAttribute("cm-not-content", "true");
    d.lineDiv = eltP("div", null, "CodeMirror-code");
    d.selectionDiv = elt("div", null, null, "position: relative; z-index: 1");
    d.cursorDiv = elt("div", null, "CodeMirror-cursors");
    d.measure = elt("div", null, "CodeMirror-measure");
    d.lineMeasure = elt("div", null, "CodeMirror-measure");
    d.lineSpace = eltP("div", [d.measure, d.lineMeasure, d.selectionDiv, d.cursorDiv, d.lineDiv], null, "position: relative; outline: none");
    var lines = eltP("div", [d.lineSpace], "CodeMirror-lines");
    d.mover = elt("div", [lines], null, "position: relative");
    d.sizer = elt("div", [d.mover], "CodeMirror-sizer");
    d.sizerWidth = null;
    d.heightForcer = elt("div", null, null, "position: absolute; height: " + scrollerGap + "px; width: 1px;");
    d.gutters = elt("div", null, "CodeMirror-gutters");
    d.lineGutter = null;
    d.scroller = elt("div", [d.sizer, d.heightForcer, d.gutters], "CodeMirror-scroll");
    d.scroller.setAttribute("tabIndex", "-1");
    d.wrapper = elt("div", [d.scrollbarFiller, d.gutterFiller, d.scroller], "CodeMirror");
    if (ie && ie_version < 8) {
      d.gutters.style.zIndex = -1;
      d.scroller.style.paddingRight = 0;
    }
    if (!webkit && !(gecko && mobile)) {
      d.scroller.draggable = true;
    }
    if (place) {
      if (place.appendChild) {
        place.appendChild(d.wrapper);
      } else {
        place(d.wrapper);
      }
    }
    d.viewFrom = d.viewTo = doc.first;
    d.reportedViewFrom = d.reportedViewTo = doc.first;
    d.view = [];
    d.renderedView = null;
    d.externalMeasured = null;
    d.viewOffset = 0;
    d.lastWrapHeight = d.lastWrapWidth = 0;
    d.updateLineNumbers = null;
    d.nativeBarWidth = d.barHeight = d.barWidth = 0;
    d.scrollbarsClipped = false;
    d.lineNumWidth = d.lineNumInnerWidth = d.lineNumChars = null;
    d.alignWidgets = false;
    d.cachedCharWidth = d.cachedTextHeight = d.cachedPaddingH = null;
    d.maxLine = null;
    d.maxLineLength = 0;
    d.maxLineChanged = false;
    d.wheelDX = d.wheelDY = d.wheelStartX = d.wheelStartY = null;
    d.shift = false;
    d.selForContextMenu = null;
    d.activeTouch = null;
    d.gutterSpecs = getGutters(options.gutters, options.lineNumbers);
    renderGutters(d);
    input.init(d);
  }
  var wheelSamples = 0,
    wheelPixelsPerUnit = null;
  if (ie) {
    wheelPixelsPerUnit = -.53;
  } else if (gecko) {
    wheelPixelsPerUnit = 15;
  } else if (chrome) {
    wheelPixelsPerUnit = -.7;
  } else if (safari) {
    wheelPixelsPerUnit = -1 / 3;
  }
  function wheelEventDelta(e) {
    var dx = e.wheelDeltaX,
      dy = e.wheelDeltaY;
    if (dx == null && e.detail && e.axis == e.HORIZONTAL_AXIS) {
      dx = e.detail;
    }
    if (dy == null && e.detail && e.axis == e.VERTICAL_AXIS) {
      dy = e.detail;
    } else if (dy == null) {
      dy = e.wheelDelta;
    }
    return {
      x: dx,
      y: dy
    };
  }
  function wheelEventPixels(e) {
    var delta = wheelEventDelta(e);
    delta.x *= wheelPixelsPerUnit;
    delta.y *= wheelPixelsPerUnit;
    return delta;
  }
  function onScrollWheel(cm, e) {
    var delta = wheelEventDelta(e),
      dx = delta.x,
      dy = delta.y;
    var display = cm.display,
      scroll = display.scroller;
    var canScrollX = scroll.scrollWidth > scroll.clientWidth;
    var canScrollY = scroll.scrollHeight > scroll.clientHeight;
    if (!(dx && canScrollX || dy && canScrollY)) {
      return;
    }
    if (dy && mac && webkit) {
      outer: for (var cur = e.target, view = display.view; cur != scroll; cur = cur.parentNode) {
        for (var i = 0; i < view.length; i++) {
          if (view[i].node == cur) {
            cm.display.currentWheelTarget = cur;
            break outer;
          }
        }
      }
    }
    if (dx && !gecko && !presto && wheelPixelsPerUnit != null) {
      if (dy && canScrollY) {
        updateScrollTop(cm, Math.max(0, scroll.scrollTop + dy * wheelPixelsPerUnit));
      }
      setScrollLeft(cm, Math.max(0, scroll.scrollLeft + dx * wheelPixelsPerUnit));
      if (!dy || dy && canScrollY) {
        e_preventDefault(e);
      }
      display.wheelStartX = null;
      return;
    }
    if (dy && wheelPixelsPerUnit != null) {
      var pixels = dy * wheelPixelsPerUnit;
      var top = cm.doc.scrollTop,
        bot = top + display.wrapper.clientHeight;
      if (pixels < 0) {
        top = Math.max(0, top + pixels - 50);
      } else {
        bot = Math.min(cm.doc.height, bot + pixels + 50);
      }
      updateDisplaySimple(cm, {
        top: top,
        bottom: bot
      });
    }
    if (wheelSamples < 20) {
      if (display.wheelStartX == null) {
        display.wheelStartX = scroll.scrollLeft;
        display.wheelStartY = scroll.scrollTop;
        display.wheelDX = dx;
        display.wheelDY = dy;
        setTimeout(function () {
          if (display.wheelStartX == null) {
            return;
          }
          var movedX = scroll.scrollLeft - display.wheelStartX;
          var movedY = scroll.scrollTop - display.wheelStartY;
          var sample = movedY && display.wheelDY && movedY / display.wheelDY || movedX && display.wheelDX && movedX / display.wheelDX;
          display.wheelStartX = display.wheelStartY = null;
          if (!sample) {
            return;
          }
          wheelPixelsPerUnit = (wheelPixelsPerUnit * wheelSamples + sample) / (wheelSamples + 1);
          ++wheelSamples;
        }, 200);
      } else {
        display.wheelDX += dx;
        display.wheelDY += dy;
      }
    }
  }
  var Selection = function (ranges, primIndex) {
    this.ranges = ranges;
    this.primIndex = primIndex;
  };
  Selection.prototype.primary = function () {
    return this.ranges[this.primIndex];
  };
  Selection.prototype.equals = function (other) {
    if (other == this) {
      return true;
    }
    if (other.primIndex != this.primIndex || other.ranges.length != this.ranges.length) {
      return false;
    }
    for (var i = 0; i < this.ranges.length; i++) {
      var here = this.ranges[i],
        there = other.ranges[i];
      if (!equalCursorPos(here.anchor, there.anchor) || !equalCursorPos(here.head, there.head)) {
        return false;
      }
    }
    return true;
  };
  Selection.prototype.deepCopy = function () {
    var out = [];
    for (var i = 0; i < this.ranges.length; i++) {
      out[i] = new Range(copyPos(this.ranges[i].anchor), copyPos(this.ranges[i].head));
    }
    return new Selection(out, this.primIndex);
  };
  Selection.prototype.somethingSelected = function () {
    for (var i = 0; i < this.ranges.length; i++) {
      if (!this.ranges[i].empty()) {
        return true;
      }
    }
    return false;
  };
  Selection.prototype.contains = function (pos, end) {
    if (!end) {
      end = pos;
    }
    for (var i = 0; i < this.ranges.length; i++) {
      var range = this.ranges[i];
      if (cmp(end, range.from()) >= 0 && cmp(pos, range.to()) <= 0) {
        return i;
      }
    }
    return -1;
  };
  var Range = function (anchor, head) {
    this.anchor = anchor;
    this.head = head;
  };
  Range.prototype.from = function () {
    return minPos(this.anchor, this.head);
  };
  Range.prototype.to = function () {
    return maxPos(this.anchor, this.head);
  };
  Range.prototype.empty = function () {
    return this.head.line == this.anchor.line && this.head.ch == this.anchor.ch;
  };
  function normalizeSelection(cm, ranges, primIndex) {
    var mayTouch = cm && cm.options.selectionsMayTouch;
    var prim = ranges[primIndex];
    ranges.sort(function (a, b) {
      return cmp(a.from(), b.from());
    });
    primIndex = indexOf(ranges, prim);
    for (var i = 1; i < ranges.length; i++) {
      var cur = ranges[i],
        prev = ranges[i - 1];
      var diff = cmp(prev.to(), cur.from());
      if (mayTouch && !cur.empty() ? diff > 0 : diff >= 0) {
        var from = minPos(prev.from(), cur.from()),
          to = maxPos(prev.to(), cur.to());
        var inv = prev.empty() ? cur.from() == cur.head : prev.from() == prev.head;
        if (i <= primIndex) {
          --primIndex;
        }
        ranges.splice(--i, 2, new Range(inv ? to : from, inv ? from : to));
      }
    }
    return new Selection(ranges, primIndex);
  }
  function simpleSelection(anchor, head) {
    return new Selection([new Range(anchor, head || anchor)], 0);
  }
  function changeEnd(change) {
    if (!change.text) {
      return change.to;
    }
    return Pos(change.from.line + change.text.length - 1, lst(change.text).length + (change.text.length == 1 ? change.from.ch : 0));
  }
  function adjustForChange(pos, change) {
    if (cmp(pos, change.from) < 0) {
      return pos;
    }
    if (cmp(pos, change.to) <= 0) {
      return changeEnd(change);
    }
    var line = pos.line + change.text.length - (change.to.line - change.from.line) - 1,
      ch = pos.ch;
    if (pos.line == change.to.line) {
      ch += changeEnd(change).ch - change.to.ch;
    }
    return Pos(line, ch);
  }
  function computeSelAfterChange(doc, change) {
    var out = [];
    for (var i = 0; i < doc.sel.ranges.length; i++) {
      var range = doc.sel.ranges[i];
      out.push(new Range(adjustForChange(range.anchor, change), adjustForChange(range.head, change)));
    }
    return normalizeSelection(doc.cm, out, doc.sel.primIndex);
  }
  function offsetPos(pos, old, nw) {
    if (pos.line == old.line) {
      return Pos(nw.line, pos.ch - old.ch + nw.ch);
    } else {
      return Pos(nw.line + (pos.line - old.line), pos.ch);
    }
  }
  function computeReplacedSel(doc, changes, hint) {
    var out = [];
    var oldPrev = Pos(doc.first, 0),
      newPrev = oldPrev;
    for (var i = 0; i < changes.length; i++) {
      var change = changes[i];
      var from = offsetPos(change.from, oldPrev, newPrev);
      var to = offsetPos(changeEnd(change), oldPrev, newPrev);
      oldPrev = change.to;
      newPrev = to;
      if (hint == "around") {
        var range = doc.sel.ranges[i],
          inv = cmp(range.head, range.anchor) < 0;
        out[i] = new Range(inv ? to : from, inv ? from : to);
      } else {
        out[i] = new Range(from, from);
      }
    }
    return new Selection(out, doc.sel.primIndex);
  }
  function loadMode(cm) {
    cm.doc.mode = getMode(cm.options, cm.doc.modeOption);
    resetModeState(cm);
  }
  function resetModeState(cm) {
    cm.doc.iter(function (line) {
      if (line.stateAfter) {
        line.stateAfter = null;
      }
      if (line.styles) {
        line.styles = null;
      }
    });
    cm.doc.modeFrontier = cm.doc.highlightFrontier = cm.doc.first;
    startWorker(cm, 100);
    cm.state.modeGen++;
    if (cm.curOp) {
      regChange(cm);
    }
  }
  function isWholeLineUpdate(doc, change) {
    return change.from.ch == 0 && change.to.ch == 0 && lst(change.text) == "" && (!doc.cm || doc.cm.options.wholeLineUpdateBefore);
  }
  function updateDoc(doc, change, markedSpans, estimateHeight$$1) {
    function spansFor(n) {
      return markedSpans ? markedSpans[n] : null;
    }
    function update(line, text, spans) {
      updateLine(line, text, spans, estimateHeight$$1);
      signalLater(line, "change", line, change);
    }
    function linesFor(start, end) {
      var result = [];
      for (var i = start; i < end; ++i) {
        result.push(new Line(text[i], spansFor(i), estimateHeight$$1));
      }
      return result;
    }
    var from = change.from,
      to = change.to,
      text = change.text;
    var firstLine = getLine(doc, from.line),
      lastLine = getLine(doc, to.line);
    var lastText = lst(text),
      lastSpans = spansFor(text.length - 1),
      nlines = to.line - from.line;
    if (change.full) {
      doc.insert(0, linesFor(0, text.length));
      doc.remove(text.length, doc.size - text.length);
    } else if (isWholeLineUpdate(doc, change)) {
      var added = linesFor(0, text.length - 1);
      update(lastLine, lastLine.text, lastSpans);
      if (nlines) {
        doc.remove(from.line, nlines);
      }
      if (added.length) {
        doc.insert(from.line, added);
      }
    } else if (firstLine == lastLine) {
      if (text.length == 1) {
        update(firstLine, firstLine.text.slice(0, from.ch) + lastText + firstLine.text.slice(to.ch), lastSpans);
      } else {
        var added$1 = linesFor(1, text.length - 1);
        added$1.push(new Line(lastText + firstLine.text.slice(to.ch), lastSpans, estimateHeight$$1));
        update(firstLine, firstLine.text.slice(0, from.ch) + text[0], spansFor(0));
        doc.insert(from.line + 1, added$1);
      }
    } else if (text.length == 1) {
      update(firstLine, firstLine.text.slice(0, from.ch) + text[0] + lastLine.text.slice(to.ch), spansFor(0));
      doc.remove(from.line + 1, nlines);
    } else {
      update(firstLine, firstLine.text.slice(0, from.ch) + text[0], spansFor(0));
      update(lastLine, lastText + lastLine.text.slice(to.ch), lastSpans);
      var added$2 = linesFor(1, text.length - 1);
      if (nlines > 1) {
        doc.remove(from.line + 1, nlines - 1);
      }
      doc.insert(from.line + 1, added$2);
    }
    signalLater(doc, "change", doc, change);
  }
  function linkedDocs(doc, f, sharedHistOnly) {
    function propagate(doc, skip, sharedHist) {
      if (doc.linked) {
        for (var i = 0; i < doc.linked.length; ++i) {
          var rel = doc.linked[i];
          if (rel.doc == skip) {
            continue;
          }
          var shared = sharedHist && rel.sharedHist;
          if (sharedHistOnly && !shared) {
            continue;
          }
          f(rel.doc, shared);
          propagate(rel.doc, doc, shared);
        }
      }
    }
    propagate(doc, null, true);
  }
  function attachDoc(cm, doc) {
    if (doc.cm) {
      throw new Error("This document is already in use.");
    }
    cm.doc = doc;
    doc.cm = cm;
    estimateLineHeights(cm);
    loadMode(cm);
    setDirectionClass(cm);
    if (!cm.options.lineWrapping) {
      findMaxLine(cm);
    }
    cm.options.mode = doc.modeOption;
    regChange(cm);
  }
  function setDirectionClass(cm) {
    (cm.doc.direction == "rtl" ? addClass : rmClass)(cm.display.lineDiv, "CodeMirror-rtl");
  }
  function directionChanged(cm) {
    runInOp(cm, function () {
      setDirectionClass(cm);
      regChange(cm);
    });
  }
  function History(startGen) {
    this.done = [];
    this.undone = [];
    this.undoDepth = Infinity;
    this.lastModTime = this.lastSelTime = 0;
    this.lastOp = this.lastSelOp = null;
    this.lastOrigin = this.lastSelOrigin = null;
    this.generation = this.maxGeneration = startGen || 1;
  }
  function historyChangeFromChange(doc, change) {
    var histChange = {
      from: copyPos(change.from),
      to: changeEnd(change),
      text: getBetween(doc, change.from, change.to)
    };
    attachLocalSpans(doc, histChange, change.from.line, change.to.line + 1);
    linkedDocs(doc, function (doc) {
      return attachLocalSpans(doc, histChange, change.from.line, change.to.line + 1);
    }, true);
    return histChange;
  }
  function clearSelectionEvents(array) {
    while (array.length) {
      var last = lst(array);
      if (last.ranges) {
        array.pop();
      } else {
        break;
      }
    }
  }
  function lastChangeEvent(hist, force) {
    if (force) {
      clearSelectionEvents(hist.done);
      return lst(hist.done);
    } else if (hist.done.length && !lst(hist.done).ranges) {
      return lst(hist.done);
    } else if (hist.done.length > 1 && !hist.done[hist.done.length - 2].ranges) {
      hist.done.pop();
      return lst(hist.done);
    }
  }
  function addChangeToHistory(doc, change, selAfter, opId) {
    var hist = doc.history;
    hist.undone.length = 0;
    var time = +new Date(),
      cur;
    var last;
    if ((hist.lastOp == opId || hist.lastOrigin == change.origin && change.origin && (change.origin.charAt(0) == "+" && hist.lastModTime > time - (doc.cm ? doc.cm.options.historyEventDelay : 500) || change.origin.charAt(0) == "*")) && (cur = lastChangeEvent(hist, hist.lastOp == opId))) {
      last = lst(cur.changes);
      if (cmp(change.from, change.to) == 0 && cmp(change.from, last.to) == 0) {
        last.to = changeEnd(change);
      } else {
        cur.changes.push(historyChangeFromChange(doc, change));
      }
    } else {
      var before = lst(hist.done);
      if (!before || !before.ranges) {
        pushSelectionToHistory(doc.sel, hist.done);
      }
      cur = {
        changes: [historyChangeFromChange(doc, change)],
        generation: hist.generation
      };
      hist.done.push(cur);
      while (hist.done.length > hist.undoDepth) {
        hist.done.shift();
        if (!hist.done[0].ranges) {
          hist.done.shift();
        }
      }
    }
    hist.done.push(selAfter);
    hist.generation = ++hist.maxGeneration;
    hist.lastModTime = hist.lastSelTime = time;
    hist.lastOp = hist.lastSelOp = opId;
    hist.lastOrigin = hist.lastSelOrigin = change.origin;
    if (!last) {
      signal(doc, "historyAdded");
    }
  }
  function selectionEventCanBeMerged(doc, origin, prev, sel) {
    var ch = origin.charAt(0);
    return ch == "*" || ch == "+" && prev.ranges.length == sel.ranges.length && prev.somethingSelected() == sel.somethingSelected() && new Date() - doc.history.lastSelTime <= (doc.cm ? doc.cm.options.historyEventDelay : 500);
  }
  function addSelectionToHistory(doc, sel, opId, options) {
    var hist = doc.history,
      origin = options && options.origin;
    if (opId == hist.lastSelOp || origin && hist.lastSelOrigin == origin && (hist.lastModTime == hist.lastSelTime && hist.lastOrigin == origin || selectionEventCanBeMerged(doc, origin, lst(hist.done), sel))) {
      hist.done[hist.done.length - 1] = sel;
    } else {
      pushSelectionToHistory(sel, hist.done);
    }
    hist.lastSelTime = +new Date();
    hist.lastSelOrigin = origin;
    hist.lastSelOp = opId;
    if (options && options.clearRedo !== false) {
      clearSelectionEvents(hist.undone);
    }
  }
  function pushSelectionToHistory(sel, dest) {
    var top = lst(dest);
    if (!(top && top.ranges && top.equals(sel))) {
      dest.push(sel);
    }
  }
  function attachLocalSpans(doc, change, from, to) {
    var existing = change["spans_" + doc.id],
      n = 0;
    doc.iter(Math.max(doc.first, from), Math.min(doc.first + doc.size, to), function (line) {
      if (line.markedSpans) {
        (existing || (existing = change["spans_" + doc.id] = {}))[n] = line.markedSpans;
      }
      ++n;
    });
  }
  function removeClearedSpans(spans) {
    if (!spans) {
      return null;
    }
    var out;
    for (var i = 0; i < spans.length; ++i) {
      if (spans[i].marker.explicitlyCleared) {
        if (!out) {
          out = spans.slice(0, i);
        }
      } else if (out) {
        out.push(spans[i]);
      }
    }
    return !out ? spans : out.length ? out : null;
  }
  function getOldSpans(doc, change) {
    var found = change["spans_" + doc.id];
    if (!found) {
      return null;
    }
    var nw = [];
    for (var i = 0; i < change.text.length; ++i) {
      nw.push(removeClearedSpans(found[i]));
    }
    return nw;
  }
  function mergeOldSpans(doc, change) {
    var old = getOldSpans(doc, change);
    var stretched = stretchSpansOverChange(doc, change);
    if (!old) {
      return stretched;
    }
    if (!stretched) {
      return old;
    }
    for (var i = 0; i < old.length; ++i) {
      var oldCur = old[i],
        stretchCur = stretched[i];
      if (oldCur && stretchCur) {
        spans: for (var j = 0; j < stretchCur.length; ++j) {
          var span = stretchCur[j];
          for (var k = 0; k < oldCur.length; ++k) {
            if (oldCur[k].marker == span.marker) {
              continue spans;
            }
          }
          oldCur.push(span);
        }
      } else if (stretchCur) {
        old[i] = stretchCur;
      }
    }
    return old;
  }
  function copyHistoryArray(events, newGroup, instantiateSel) {
    var copy = [];
    for (var i = 0; i < events.length; ++i) {
      var event = events[i];
      if (event.ranges) {
        copy.push(instantiateSel ? Selection.prototype.deepCopy.call(event) : event);
        continue;
      }
      var changes = event.changes,
        newChanges = [];
      copy.push({
        changes: newChanges
      });
      for (var j = 0; j < changes.length; ++j) {
        var change = changes[j],
          m = void 0;
        newChanges.push({
          from: change.from,
          to: change.to,
          text: change.text
        });
        if (newGroup) {
          for (var prop in change) {
            if (m = prop.match(/^spans_(\d+)$/)) {
              if (indexOf(newGroup, Number(m[1])) > -1) {
                lst(newChanges)[prop] = change[prop];
                delete change[prop];
              }
            }
          }
        }
      }
    }
    return copy;
  }
  function extendRange(range, head, other, extend) {
    if (extend) {
      var anchor = range.anchor;
      if (other) {
        var posBefore = cmp(head, anchor) < 0;
        if (posBefore != cmp(other, anchor) < 0) {
          anchor = head;
          head = other;
        } else if (posBefore != cmp(head, other) < 0) {
          head = other;
        }
      }
      return new Range(anchor, head);
    } else {
      return new Range(other || head, head);
    }
  }
  function extendSelection(doc, head, other, options, extend) {
    if (extend == null) {
      extend = doc.cm && (doc.cm.display.shift || doc.extend);
    }
    setSelection(doc, new Selection([extendRange(doc.sel.primary(), head, other, extend)], 0), options);
  }
  function extendSelections(doc, heads, options) {
    var out = [];
    var extend = doc.cm && (doc.cm.display.shift || doc.extend);
    for (var i = 0; i < doc.sel.ranges.length; i++) {
      out[i] = extendRange(doc.sel.ranges[i], heads[i], null, extend);
    }
    var newSel = normalizeSelection(doc.cm, out, doc.sel.primIndex);
    setSelection(doc, newSel, options);
  }
  function replaceOneSelection(doc, i, range, options) {
    var ranges = doc.sel.ranges.slice(0);
    ranges[i] = range;
    setSelection(doc, normalizeSelection(doc.cm, ranges, doc.sel.primIndex), options);
  }
  function setSimpleSelection(doc, anchor, head, options) {
    setSelection(doc, simpleSelection(anchor, head), options);
  }
  function filterSelectionChange(doc, sel, options) {
    var obj = {
      ranges: sel.ranges,
      update: function (ranges) {
        this.ranges = [];
        for (var i = 0; i < ranges.length; i++) {
          this.ranges[i] = new Range(clipPos(doc, ranges[i].anchor), clipPos(doc, ranges[i].head));
        }
      },
      origin: options && options.origin
    };
    signal(doc, "beforeSelectionChange", doc, obj);
    if (doc.cm) {
      signal(doc.cm, "beforeSelectionChange", doc.cm, obj);
    }
    if (obj.ranges != sel.ranges) {
      return normalizeSelection(doc.cm, obj.ranges, obj.ranges.length - 1);
    } else {
      return sel;
    }
  }
  function setSelectionReplaceHistory(doc, sel, options) {
    var done = doc.history.done,
      last = lst(done);
    if (last && last.ranges) {
      done[done.length - 1] = sel;
      setSelectionNoUndo(doc, sel, options);
    } else {
      setSelection(doc, sel, options);
    }
  }
  function setSelection(doc, sel, options) {
    setSelectionNoUndo(doc, sel, options);
    addSelectionToHistory(doc, doc.sel, doc.cm ? doc.cm.curOp.id : NaN, options);
  }
  function setSelectionNoUndo(doc, sel, options) {
    if (hasHandler(doc, "beforeSelectionChange") || doc.cm && hasHandler(doc.cm, "beforeSelectionChange")) {
      sel = filterSelectionChange(doc, sel, options);
    }
    var bias = options && options.bias || (cmp(sel.primary().head, doc.sel.primary().head) < 0 ? -1 : 1);
    setSelectionInner(doc, skipAtomicInSelection(doc, sel, bias, true));
    if (!(options && options.scroll === false) && doc.cm) {
      ensureCursorVisible(doc.cm);
    }
  }
  function setSelectionInner(doc, sel) {
    if (sel.equals(doc.sel)) {
      return;
    }
    doc.sel = sel;
    if (doc.cm) {
      doc.cm.curOp.updateInput = 1;
      doc.cm.curOp.selectionChanged = true;
      signalCursorActivity(doc.cm);
    }
    signalLater(doc, "cursorActivity", doc);
  }
  function reCheckSelection(doc) {
    setSelectionInner(doc, skipAtomicInSelection(doc, doc.sel, null, false));
  }
  function skipAtomicInSelection(doc, sel, bias, mayClear) {
    var out;
    for (var i = 0; i < sel.ranges.length; i++) {
      var range = sel.ranges[i];
      var old = sel.ranges.length == doc.sel.ranges.length && doc.sel.ranges[i];
      var newAnchor = skipAtomic(doc, range.anchor, old && old.anchor, bias, mayClear);
      var newHead = skipAtomic(doc, range.head, old && old.head, bias, mayClear);
      if (out || newAnchor != range.anchor || newHead != range.head) {
        if (!out) {
          out = sel.ranges.slice(0, i);
        }
        out[i] = new Range(newAnchor, newHead);
      }
    }
    return out ? normalizeSelection(doc.cm, out, sel.primIndex) : sel;
  }
  function skipAtomicInner(doc, pos, oldPos, dir, mayClear) {
    var line = getLine(doc, pos.line);
    if (line.markedSpans) {
      for (var i = 0; i < line.markedSpans.length; ++i) {
        var sp = line.markedSpans[i],
          m = sp.marker;
        var preventCursorLeft = "selectLeft" in m ? !m.selectLeft : m.inclusiveLeft;
        var preventCursorRight = "selectRight" in m ? !m.selectRight : m.inclusiveRight;
        if ((sp.from == null || (preventCursorLeft ? sp.from <= pos.ch : sp.from < pos.ch)) && (sp.to == null || (preventCursorRight ? sp.to >= pos.ch : sp.to > pos.ch))) {
          if (mayClear) {
            signal(m, "beforeCursorEnter");
            if (m.explicitlyCleared) {
              if (!line.markedSpans) {
                break;
              } else {
                --i;
                continue;
              }
            }
          }
          if (!m.atomic) {
            continue;
          }
          if (oldPos) {
            var near = m.find(dir < 0 ? 1 : -1),
              diff = void 0;
            if (dir < 0 ? preventCursorRight : preventCursorLeft) {
              near = movePos(doc, near, -dir, near && near.line == pos.line ? line : null);
            }
            if (near && near.line == pos.line && (diff = cmp(near, oldPos)) && (dir < 0 ? diff < 0 : diff > 0)) {
              return skipAtomicInner(doc, near, pos, dir, mayClear);
            }
          }
          var far = m.find(dir < 0 ? -1 : 1);
          if (dir < 0 ? preventCursorLeft : preventCursorRight) {
            far = movePos(doc, far, dir, far.line == pos.line ? line : null);
          }
          return far ? skipAtomicInner(doc, far, pos, dir, mayClear) : null;
        }
      }
    }
    return pos;
  }
  function skipAtomic(doc, pos, oldPos, bias, mayClear) {
    var dir = bias || 1;
    var found = skipAtomicInner(doc, pos, oldPos, dir, mayClear) || !mayClear && skipAtomicInner(doc, pos, oldPos, dir, true) || skipAtomicInner(doc, pos, oldPos, -dir, mayClear) || !mayClear && skipAtomicInner(doc, pos, oldPos, -dir, true);
    if (!found) {
      doc.cantEdit = true;
      return Pos(doc.first, 0);
    }
    return found;
  }
  function movePos(doc, pos, dir, line) {
    if (dir < 0 && pos.ch == 0) {
      if (pos.line > doc.first) {
        return clipPos(doc, Pos(pos.line - 1));
      } else {
        return null;
      }
    } else if (dir > 0 && pos.ch == (line || getLine(doc, pos.line)).text.length) {
      if (pos.line < doc.first + doc.size - 1) {
        return Pos(pos.line + 1, 0);
      } else {
        return null;
      }
    } else {
      return new Pos(pos.line, pos.ch + dir);
    }
  }
  function selectAll(cm) {
    cm.setSelection(Pos(cm.firstLine(), 0), Pos(cm.lastLine()), sel_dontScroll);
  }
  function filterChange(doc, change, update) {
    var obj = {
      canceled: false,
      from: change.from,
      to: change.to,
      text: change.text,
      origin: change.origin,
      cancel: function () {
        return obj.canceled = true;
      }
    };
    if (update) {
      obj.update = function (from, to, text, origin) {
        if (from) {
          obj.from = clipPos(doc, from);
        }
        if (to) {
          obj.to = clipPos(doc, to);
        }
        if (text) {
          obj.text = text;
        }
        if (origin !== undefined) {
          obj.origin = origin;
        }
      };
    }
    signal(doc, "beforeChange", doc, obj);
    if (doc.cm) {
      signal(doc.cm, "beforeChange", doc.cm, obj);
    }
    if (obj.canceled) {
      if (doc.cm) {
        doc.cm.curOp.updateInput = 2;
      }
      return null;
    }
    return {
      from: obj.from,
      to: obj.to,
      text: obj.text,
      origin: obj.origin
    };
  }
  function makeChange(doc, change, ignoreReadOnly) {
    if (doc.cm) {
      if (!doc.cm.curOp) {
        return operation(doc.cm, makeChange)(doc, change, ignoreReadOnly);
      }
      if (doc.cm.state.suppressEdits) {
        return;
      }
    }
    if (hasHandler(doc, "beforeChange") || doc.cm && hasHandler(doc.cm, "beforeChange")) {
      change = filterChange(doc, change, true);
      if (!change) {
        return;
      }
    }
    var split = sawReadOnlySpans && !ignoreReadOnly && removeReadOnlyRanges(doc, change.from, change.to);
    if (split) {
      for (var i = split.length - 1; i >= 0; --i) {
        makeChangeInner(doc, {
          from: split[i].from,
          to: split[i].to,
          text: i ? [""] : change.text,
          origin: change.origin
        });
      }
    } else {
      makeChangeInner(doc, change);
    }
  }
  function makeChangeInner(doc, change) {
    if (change.text.length == 1 && change.text[0] == "" && cmp(change.from, change.to) == 0) {
      return;
    }
    var selAfter = computeSelAfterChange(doc, change);
    addChangeToHistory(doc, change, selAfter, doc.cm ? doc.cm.curOp.id : NaN);
    makeChangeSingleDoc(doc, change, selAfter, stretchSpansOverChange(doc, change));
    var rebased = [];
    linkedDocs(doc, function (doc, sharedHist) {
      if (!sharedHist && indexOf(rebased, doc.history) == -1) {
        rebaseHist(doc.history, change);
        rebased.push(doc.history);
      }
      makeChangeSingleDoc(doc, change, null, stretchSpansOverChange(doc, change));
    });
  }
  function makeChangeFromHistory(doc, type, allowSelectionOnly) {
    var suppress = doc.cm && doc.cm.state.suppressEdits;
    if (suppress && !allowSelectionOnly) {
      return;
    }
    var hist = doc.history,
      event,
      selAfter = doc.sel;
    var source = type == "undo" ? hist.done : hist.undone,
      dest = type == "undo" ? hist.undone : hist.done;
    var i = 0;
    for (; i < source.length; i++) {
      event = source[i];
      if (allowSelectionOnly ? event.ranges && !event.equals(doc.sel) : !event.ranges) {
        break;
      }
    }
    if (i == source.length) {
      return;
    }
    hist.lastOrigin = hist.lastSelOrigin = null;
    for (;;) {
      event = source.pop();
      if (event.ranges) {
        pushSelectionToHistory(event, dest);
        if (allowSelectionOnly && !event.equals(doc.sel)) {
          setSelection(doc, event, {
            clearRedo: false
          });
          return;
        }
        selAfter = event;
      } else if (suppress) {
        source.push(event);
        return;
      } else {
        break;
      }
    }
    var antiChanges = [];
    pushSelectionToHistory(selAfter, dest);
    dest.push({
      changes: antiChanges,
      generation: hist.generation
    });
    hist.generation = event.generation || ++hist.maxGeneration;
    var filter = hasHandler(doc, "beforeChange") || doc.cm && hasHandler(doc.cm, "beforeChange");
    var loop = function (i) {
      var change = event.changes[i];
      change.origin = type;
      if (filter && !filterChange(doc, change, false)) {
        source.length = 0;
        return {};
      }
      antiChanges.push(historyChangeFromChange(doc, change));
      var after = i ? computeSelAfterChange(doc, change) : lst(source);
      makeChangeSingleDoc(doc, change, after, mergeOldSpans(doc, change));
      if (!i && doc.cm) {
        doc.cm.scrollIntoView({
          from: change.from,
          to: changeEnd(change)
        });
      }
      var rebased = [];
      linkedDocs(doc, function (doc, sharedHist) {
        if (!sharedHist && indexOf(rebased, doc.history) == -1) {
          rebaseHist(doc.history, change);
          rebased.push(doc.history);
        }
        makeChangeSingleDoc(doc, change, null, mergeOldSpans(doc, change));
      });
    };
    for (var i$1 = event.changes.length - 1; i$1 >= 0; --i$1) {
      var returned = loop(i$1);
      if (returned) return returned.v;
    }
  }
  function shiftDoc(doc, distance) {
    if (distance == 0) {
      return;
    }
    doc.first += distance;
    doc.sel = new Selection(map(doc.sel.ranges, function (range) {
      return new Range(Pos(range.anchor.line + distance, range.anchor.ch), Pos(range.head.line + distance, range.head.ch));
    }), doc.sel.primIndex);
    if (doc.cm) {
      regChange(doc.cm, doc.first, doc.first - distance, distance);
      for (var d = doc.cm.display, l = d.viewFrom; l < d.viewTo; l++) {
        regLineChange(doc.cm, l, "gutter");
      }
    }
  }
  function makeChangeSingleDoc(doc, change, selAfter, spans) {
    if (doc.cm && !doc.cm.curOp) {
      return operation(doc.cm, makeChangeSingleDoc)(doc, change, selAfter, spans);
    }
    if (change.to.line < doc.first) {
      shiftDoc(doc, change.text.length - 1 - (change.to.line - change.from.line));
      return;
    }
    if (change.from.line > doc.lastLine()) {
      return;
    }
    if (change.from.line < doc.first) {
      var shift = change.text.length - 1 - (doc.first - change.from.line);
      shiftDoc(doc, shift);
      change = {
        from: Pos(doc.first, 0),
        to: Pos(change.to.line + shift, change.to.ch),
        text: [lst(change.text)],
        origin: change.origin
      };
    }
    var last = doc.lastLine();
    if (change.to.line > last) {
      change = {
        from: change.from,
        to: Pos(last, getLine(doc, last).text.length),
        text: [change.text[0]],
        origin: change.origin
      };
    }
    change.removed = getBetween(doc, change.from, change.to);
    if (!selAfter) {
      selAfter = computeSelAfterChange(doc, change);
    }
    if (doc.cm) {
      makeChangeSingleDocInEditor(doc.cm, change, spans);
    } else {
      updateDoc(doc, change, spans);
    }
    setSelectionNoUndo(doc, selAfter, sel_dontScroll);
    if (doc.cantEdit && skipAtomic(doc, Pos(doc.firstLine(), 0))) {
      doc.cantEdit = false;
    }
  }
  function makeChangeSingleDocInEditor(cm, change, spans) {
    var doc = cm.doc,
      display = cm.display,
      from = change.from,
      to = change.to;
    var recomputeMaxLength = false,
      checkWidthStart = from.line;
    if (!cm.options.lineWrapping) {
      checkWidthStart = lineNo(visualLine(getLine(doc, from.line)));
      doc.iter(checkWidthStart, to.line + 1, function (line) {
        if (line == display.maxLine) {
          recomputeMaxLength = true;
          return true;
        }
      });
    }
    if (doc.sel.contains(change.from, change.to) > -1) {
      signalCursorActivity(cm);
    }
    updateDoc(doc, change, spans, estimateHeight(cm));
    if (!cm.options.lineWrapping) {
      doc.iter(checkWidthStart, from.line + change.text.length, function (line) {
        var len = lineLength(line);
        if (len > display.maxLineLength) {
          display.maxLine = line;
          display.maxLineLength = len;
          display.maxLineChanged = true;
          recomputeMaxLength = false;
        }
      });
      if (recomputeMaxLength) {
        cm.curOp.updateMaxLine = true;
      }
    }
    retreatFrontier(doc, from.line);
    startWorker(cm, 400);
    var lendiff = change.text.length - (to.line - from.line) - 1;
    if (change.full) {
      regChange(cm);
    } else if (from.line == to.line && change.text.length == 1 && !isWholeLineUpdate(cm.doc, change)) {
      regLineChange(cm, from.line, "text");
    } else {
      regChange(cm, from.line, to.line + 1, lendiff);
    }
    var changesHandler = hasHandler(cm, "changes"),
      changeHandler = hasHandler(cm, "change");
    if (changeHandler || changesHandler) {
      var obj = {
        from: from,
        to: to,
        text: change.text,
        removed: change.removed,
        origin: change.origin
      };
      if (changeHandler) {
        signalLater(cm, "change", cm, obj);
      }
      if (changesHandler) {
        (cm.curOp.changeObjs || (cm.curOp.changeObjs = [])).push(obj);
      }
    }
    cm.display.selForContextMenu = null;
  }
  function replaceRange(doc, code, from, to, origin) {
    var assign;
    if (!to) {
      to = from;
    }
    if (cmp(to, from) < 0) {
      assign = [to, from], from = assign[0], to = assign[1];
    }
    if (typeof code == "string") {
      code = doc.splitLines(code);
    }
    makeChange(doc, {
      from: from,
      to: to,
      text: code,
      origin: origin
    });
  }
  function rebaseHistSelSingle(pos, from, to, diff) {
    if (to < pos.line) {
      pos.line += diff;
    } else if (from < pos.line) {
      pos.line = from;
      pos.ch = 0;
    }
  }
  function rebaseHistArray(array, from, to, diff) {
    for (var i = 0; i < array.length; ++i) {
      var sub = array[i],
        ok = true;
      if (sub.ranges) {
        if (!sub.copied) {
          sub = array[i] = sub.deepCopy();
          sub.copied = true;
        }
        for (var j = 0; j < sub.ranges.length; j++) {
          rebaseHistSelSingle(sub.ranges[j].anchor, from, to, diff);
          rebaseHistSelSingle(sub.ranges[j].head, from, to, diff);
        }
        continue;
      }
      for (var j$1 = 0; j$1 < sub.changes.length; ++j$1) {
        var cur = sub.changes[j$1];
        if (to < cur.from.line) {
          cur.from = Pos(cur.from.line + diff, cur.from.ch);
          cur.to = Pos(cur.to.line + diff, cur.to.ch);
        } else if (from <= cur.to.line) {
          ok = false;
          break;
        }
      }
      if (!ok) {
        array.splice(0, i + 1);
        i = 0;
      }
    }
  }
  function rebaseHist(hist, change) {
    var from = change.from.line,
      to = change.to.line,
      diff = change.text.length - (to - from) - 1;
    rebaseHistArray(hist.done, from, to, diff);
    rebaseHistArray(hist.undone, from, to, diff);
  }
  function changeLine(doc, handle, changeType, op) {
    var no = handle,
      line = handle;
    if (typeof handle == "number") {
      line = getLine(doc, clipLine(doc, handle));
    } else {
      no = lineNo(handle);
    }
    if (no == null) {
      return null;
    }
    if (op(line, no) && doc.cm) {
      regLineChange(doc.cm, no, changeType);
    }
    return line;
  }
  function LeafChunk(lines) {
    this.lines = lines;
    this.parent = null;
    var height = 0;
    for (var i = 0; i < lines.length; ++i) {
      lines[i].parent = this;
      height += lines[i].height;
    }
    this.height = height;
  }
  LeafChunk.prototype = {
    chunkSize: function () {
      return this.lines.length;
    },
    removeInner: function (at, n) {
      for (var i = at, e = at + n; i < e; ++i) {
        var line = this.lines[i];
        this.height -= line.height;
        cleanUpLine(line);
        signalLater(line, "delete");
      }
      this.lines.splice(at, n);
    },
    collapse: function (lines) {
      lines.push.apply(lines, this.lines);
    },
    insertInner: function (at, lines, height) {
      this.height += height;
      this.lines = this.lines.slice(0, at).concat(lines).concat(this.lines.slice(at));
      for (var i = 0; i < lines.length; ++i) {
        lines[i].parent = this;
      }
    },
    iterN: function (at, n, op) {
      for (var e = at + n; at < e; ++at) {
        if (op(this.lines[at])) {
          return true;
        }
      }
    }
  };
  function BranchChunk(children) {
    this.children = children;
    var size = 0,
      height = 0;
    for (var i = 0; i < children.length; ++i) {
      var ch = children[i];
      size += ch.chunkSize();
      height += ch.height;
      ch.parent = this;
    }
    this.size = size;
    this.height = height;
    this.parent = null;
  }
  BranchChunk.prototype = {
    chunkSize: function () {
      return this.size;
    },
    removeInner: function (at, n) {
      this.size -= n;
      for (var i = 0; i < this.children.length; ++i) {
        var child = this.children[i],
          sz = child.chunkSize();
        if (at < sz) {
          var rm = Math.min(n, sz - at),
            oldHeight = child.height;
          child.removeInner(at, rm);
          this.height -= oldHeight - child.height;
          if (sz == rm) {
            this.children.splice(i--, 1);
            child.parent = null;
          }
          if ((n -= rm) == 0) {
            break;
          }
          at = 0;
        } else {
          at -= sz;
        }
      }
      if (this.size - n < 25 && (this.children.length > 1 || !(this.children[0] instanceof LeafChunk))) {
        var lines = [];
        this.collapse(lines);
        this.children = [new LeafChunk(lines)];
        this.children[0].parent = this;
      }
    },
    collapse: function (lines) {
      for (var i = 0; i < this.children.length; ++i) {
        this.children[i].collapse(lines);
      }
    },
    insertInner: function (at, lines, height) {
      this.size += lines.length;
      this.height += height;
      for (var i = 0; i < this.children.length; ++i) {
        var child = this.children[i],
          sz = child.chunkSize();
        if (at <= sz) {
          child.insertInner(at, lines, height);
          if (child.lines && child.lines.length > 50) {
            var remaining = child.lines.length % 25 + 25;
            for (var pos = remaining; pos < child.lines.length;) {
              var leaf = new LeafChunk(child.lines.slice(pos, pos += 25));
              child.height -= leaf.height;
              this.children.splice(++i, 0, leaf);
              leaf.parent = this;
            }
            child.lines = child.lines.slice(0, remaining);
            this.maybeSpill();
          }
          break;
        }
        at -= sz;
      }
    },
    maybeSpill: function () {
      if (this.children.length <= 10) {
        return;
      }
      var me = this;
      do {
        var spilled = me.children.splice(me.children.length - 5, 5);
        var sibling = new BranchChunk(spilled);
        if (!me.parent) {
          var copy = new BranchChunk(me.children);
          copy.parent = me;
          me.children = [copy, sibling];
          me = copy;
        } else {
          me.size -= sibling.size;
          me.height -= sibling.height;
          var myIndex = indexOf(me.parent.children, me);
          me.parent.children.splice(myIndex + 1, 0, sibling);
        }
        sibling.parent = me.parent;
      } while (me.children.length > 10);
      me.parent.maybeSpill();
    },
    iterN: function (at, n, op) {
      for (var i = 0; i < this.children.length; ++i) {
        var child = this.children[i],
          sz = child.chunkSize();
        if (at < sz) {
          var used = Math.min(n, sz - at);
          if (child.iterN(at, used, op)) {
            return true;
          }
          if ((n -= used) == 0) {
            break;
          }
          at = 0;
        } else {
          at -= sz;
        }
      }
    }
  };
  var LineWidget = function (doc, node, options) {
    if (options) {
      for (var opt in options) {
        if (options.hasOwnProperty(opt)) {
          this[opt] = options[opt];
        }
      }
    }
    this.doc = doc;
    this.node = node;
  };
  LineWidget.prototype.clear = function () {
    var cm = this.doc.cm,
      ws = this.line.widgets,
      line = this.line,
      no = lineNo(line);
    if (no == null || !ws) {
      return;
    }
    for (var i = 0; i < ws.length; ++i) {
      if (ws[i] == this) {
        ws.splice(i--, 1);
      }
    }
    if (!ws.length) {
      line.widgets = null;
    }
    var height = widgetHeight(this);
    updateLineHeight(line, Math.max(0, line.height - height));
    if (cm) {
      runInOp(cm, function () {
        adjustScrollWhenAboveVisible(cm, line, -height);
        regLineChange(cm, no, "widget");
      });
      signalLater(cm, "lineWidgetCleared", cm, this, no);
    }
  };
  LineWidget.prototype.changed = function () {
    var this$1 = this;
    var oldH = this.height,
      cm = this.doc.cm,
      line = this.line;
    this.height = null;
    var diff = widgetHeight(this) - oldH;
    if (!diff) {
      return;
    }
    if (!lineIsHidden(this.doc, line)) {
      updateLineHeight(line, line.height + diff);
    }
    if (cm) {
      runInOp(cm, function () {
        cm.curOp.forceUpdate = true;
        adjustScrollWhenAboveVisible(cm, line, diff);
        signalLater(cm, "lineWidgetChanged", cm, this$1, lineNo(line));
      });
    }
  };
  eventMixin(LineWidget);
  function adjustScrollWhenAboveVisible(cm, line, diff) {
    if (heightAtLine(line) < (cm.curOp && cm.curOp.scrollTop || cm.doc.scrollTop)) {
      addToScrollTop(cm, diff);
    }
  }
  function addLineWidget(doc, handle, node, options) {
    var widget = new LineWidget(doc, node, options);
    var cm = doc.cm;
    if (cm && widget.noHScroll) {
      cm.display.alignWidgets = true;
    }
    changeLine(doc, handle, "widget", function (line) {
      var widgets = line.widgets || (line.widgets = []);
      if (widget.insertAt == null) {
        widgets.push(widget);
      } else {
        widgets.splice(Math.min(widgets.length - 1, Math.max(0, widget.insertAt)), 0, widget);
      }
      widget.line = line;
      if (cm && !lineIsHidden(doc, line)) {
        var aboveVisible = heightAtLine(line) < doc.scrollTop;
        updateLineHeight(line, line.height + widgetHeight(widget));
        if (aboveVisible) {
          addToScrollTop(cm, widget.height);
        }
        cm.curOp.forceUpdate = true;
      }
      return true;
    });
    if (cm) {
      signalLater(cm, "lineWidgetAdded", cm, widget, typeof handle == "number" ? handle : lineNo(handle));
    }
    return widget;
  }
  var nextMarkerId = 0;
  var TextMarker = function (doc, type) {
    this.lines = [];
    this.type = type;
    this.doc = doc;
    this.id = ++nextMarkerId;
  };
  TextMarker.prototype.clear = function () {
    if (this.explicitlyCleared) {
      return;
    }
    var cm = this.doc.cm,
      withOp = cm && !cm.curOp;
    if (withOp) {
      startOperation(cm);
    }
    if (hasHandler(this, "clear")) {
      var found = this.find();
      if (found) {
        signalLater(this, "clear", found.from, found.to);
      }
    }
    var min = null,
      max = null;
    for (var i = 0; i < this.lines.length; ++i) {
      var line = this.lines[i];
      var span = getMarkedSpanFor(line.markedSpans, this);
      if (cm && !this.collapsed) {
        regLineChange(cm, lineNo(line), "text");
      } else if (cm) {
        if (span.to != null) {
          max = lineNo(line);
        }
        if (span.from != null) {
          min = lineNo(line);
        }
      }
      line.markedSpans = removeMarkedSpan(line.markedSpans, span);
      if (span.from == null && this.collapsed && !lineIsHidden(this.doc, line) && cm) {
        updateLineHeight(line, textHeight(cm.display));
      }
    }
    if (cm && this.collapsed && !cm.options.lineWrapping) {
      for (var i$1 = 0; i$1 < this.lines.length; ++i$1) {
        var visual = visualLine(this.lines[i$1]),
          len = lineLength(visual);
        if (len > cm.display.maxLineLength) {
          cm.display.maxLine = visual;
          cm.display.maxLineLength = len;
          cm.display.maxLineChanged = true;
        }
      }
    }
    if (min != null && cm && this.collapsed) {
      regChange(cm, min, max + 1);
    }
    this.lines.length = 0;
    this.explicitlyCleared = true;
    if (this.atomic && this.doc.cantEdit) {
      this.doc.cantEdit = false;
      if (cm) {
        reCheckSelection(cm.doc);
      }
    }
    if (cm) {
      signalLater(cm, "markerCleared", cm, this, min, max);
    }
    if (withOp) {
      endOperation(cm);
    }
    if (this.parent) {
      this.parent.clear();
    }
  };
  TextMarker.prototype.find = function (side, lineObj) {
    if (side == null && this.type == "bookmark") {
      side = 1;
    }
    var from, to;
    for (var i = 0; i < this.lines.length; ++i) {
      var line = this.lines[i];
      var span = getMarkedSpanFor(line.markedSpans, this);
      if (span.from != null) {
        from = Pos(lineObj ? line : lineNo(line), span.from);
        if (side == -1) {
          return from;
        }
      }
      if (span.to != null) {
        to = Pos(lineObj ? line : lineNo(line), span.to);
        if (side == 1) {
          return to;
        }
      }
    }
    return from && {
      from: from,
      to: to
    };
  };
  TextMarker.prototype.changed = function () {
    var this$1 = this;
    var pos = this.find(-1, true),
      widget = this,
      cm = this.doc.cm;
    if (!pos || !cm) {
      return;
    }
    runInOp(cm, function () {
      var line = pos.line,
        lineN = lineNo(pos.line);
      var view = findViewForLine(cm, lineN);
      if (view) {
        clearLineMeasurementCacheFor(view);
        cm.curOp.selectionChanged = cm.curOp.forceUpdate = true;
      }
      cm.curOp.updateMaxLine = true;
      if (!lineIsHidden(widget.doc, line) && widget.height != null) {
        var oldHeight = widget.height;
        widget.height = null;
        var dHeight = widgetHeight(widget) - oldHeight;
        if (dHeight) {
          updateLineHeight(line, line.height + dHeight);
        }
      }
      signalLater(cm, "markerChanged", cm, this$1);
    });
  };
  TextMarker.prototype.attachLine = function (line) {
    if (!this.lines.length && this.doc.cm) {
      var op = this.doc.cm.curOp;
      if (!op.maybeHiddenMarkers || indexOf(op.maybeHiddenMarkers, this) == -1) {
        (op.maybeUnhiddenMarkers || (op.maybeUnhiddenMarkers = [])).push(this);
      }
    }
    this.lines.push(line);
  };
  TextMarker.prototype.detachLine = function (line) {
    this.lines.splice(indexOf(this.lines, line), 1);
    if (!this.lines.length && this.doc.cm) {
      var op = this.doc.cm.curOp;
      (op.maybeHiddenMarkers || (op.maybeHiddenMarkers = [])).push(this);
    }
  };
  eventMixin(TextMarker);
  function markText(doc, from, to, options, type) {
    if (options && options.shared) {
      return markTextShared(doc, from, to, options, type);
    }
    if (doc.cm && !doc.cm.curOp) {
      return operation(doc.cm, markText)(doc, from, to, options, type);
    }
    var marker = new TextMarker(doc, type),
      diff = cmp(from, to);
    if (options) {
      copyObj(options, marker, false);
    }
    if (diff > 0 || diff == 0 && marker.clearWhenEmpty !== false) {
      return marker;
    }
    if (marker.replacedWith) {
      marker.collapsed = true;
      marker.widgetNode = eltP("span", [marker.replacedWith], "CodeMirror-widget");
      if (!options.handleMouseEvents) {
        marker.widgetNode.setAttribute("cm-ignore-events", "true");
      }
      if (options.insertLeft) {
        marker.widgetNode.insertLeft = true;
      }
    }
    if (marker.collapsed) {
      if (conflictingCollapsedRange(doc, from.line, from, to, marker) || from.line != to.line && conflictingCollapsedRange(doc, to.line, from, to, marker)) {
        throw new Error("Inserting collapsed marker partially overlapping an existing one");
      }
      seeCollapsedSpans();
    }
    if (marker.addToHistory) {
      addChangeToHistory(doc, {
        from: from,
        to: to,
        origin: "markText"
      }, doc.sel, NaN);
    }
    var curLine = from.line,
      cm = doc.cm,
      updateMaxLine;
    doc.iter(curLine, to.line + 1, function (line) {
      if (cm && marker.collapsed && !cm.options.lineWrapping && visualLine(line) == cm.display.maxLine) {
        updateMaxLine = true;
      }
      if (marker.collapsed && curLine != from.line) {
        updateLineHeight(line, 0);
      }
      addMarkedSpan(line, new MarkedSpan(marker, curLine == from.line ? from.ch : null, curLine == to.line ? to.ch : null));
      ++curLine;
    });
    if (marker.collapsed) {
      doc.iter(from.line, to.line + 1, function (line) {
        if (lineIsHidden(doc, line)) {
          updateLineHeight(line, 0);
        }
      });
    }
    if (marker.clearOnEnter) {
      on(marker, "beforeCursorEnter", function () {
        return marker.clear();
      });
    }
    if (marker.readOnly) {
      seeReadOnlySpans();
      if (doc.history.done.length || doc.history.undone.length) {
        doc.clearHistory();
      }
    }
    if (marker.collapsed) {
      marker.id = ++nextMarkerId;
      marker.atomic = true;
    }
    if (cm) {
      if (updateMaxLine) {
        cm.curOp.updateMaxLine = true;
      }
      if (marker.collapsed) {
        regChange(cm, from.line, to.line + 1);
      } else if (marker.className || marker.startStyle || marker.endStyle || marker.css || marker.attributes || marker.title) {
        for (var i = from.line; i <= to.line; i++) {
          regLineChange(cm, i, "text");
        }
      }
      if (marker.atomic) {
        reCheckSelection(cm.doc);
      }
      signalLater(cm, "markerAdded", cm, marker);
    }
    return marker;
  }
  var SharedTextMarker = function (markers, primary) {
    this.markers = markers;
    this.primary = primary;
    for (var i = 0; i < markers.length; ++i) {
      markers[i].parent = this;
    }
  };
  SharedTextMarker.prototype.clear = function () {
    if (this.explicitlyCleared) {
      return;
    }
    this.explicitlyCleared = true;
    for (var i = 0; i < this.markers.length; ++i) {
      this.markers[i].clear();
    }
    signalLater(this, "clear");
  };
  SharedTextMarker.prototype.find = function (side, lineObj) {
    return this.primary.find(side, lineObj);
  };
  eventMixin(SharedTextMarker);
  function markTextShared(doc, from, to, options, type) {
    options = copyObj(options);
    options.shared = false;
    var markers = [markText(doc, from, to, options, type)],
      primary = markers[0];
    var widget = options.widgetNode;
    linkedDocs(doc, function (doc) {
      if (widget) {
        options.widgetNode = widget.cloneNode(true);
      }
      markers.push(markText(doc, clipPos(doc, from), clipPos(doc, to), options, type));
      for (var i = 0; i < doc.linked.length; ++i) {
        if (doc.linked[i].isParent) {
          return;
        }
      }
      primary = lst(markers);
    });
    return new SharedTextMarker(markers, primary);
  }
  function findSharedMarkers(doc) {
    return doc.findMarks(Pos(doc.first, 0), doc.clipPos(Pos(doc.lastLine())), function (m) {
      return m.parent;
    });
  }
  function copySharedMarkers(doc, markers) {
    for (var i = 0; i < markers.length; i++) {
      var marker = markers[i],
        pos = marker.find();
      var mFrom = doc.clipPos(pos.from),
        mTo = doc.clipPos(pos.to);
      if (cmp(mFrom, mTo)) {
        var subMark = markText(doc, mFrom, mTo, marker.primary, marker.primary.type);
        marker.markers.push(subMark);
        subMark.parent = marker;
      }
    }
  }
  function detachSharedMarkers(markers) {
    var loop = function (i) {
      var marker = markers[i],
        linked = [marker.primary.doc];
      linkedDocs(marker.primary.doc, function (d) {
        return linked.push(d);
      });
      for (var j = 0; j < marker.markers.length; j++) {
        var subMarker = marker.markers[j];
        if (indexOf(linked, subMarker.doc) == -1) {
          subMarker.parent = null;
          marker.markers.splice(j--, 1);
        }
      }
    };
    for (var i = 0; i < markers.length; i++) loop(i);
  }
  var nextDocId = 0;
  var Doc = function (text, mode, firstLine, lineSep, direction) {
    if (!(this instanceof Doc)) {
      return new Doc(text, mode, firstLine, lineSep, direction);
    }
    if (firstLine == null) {
      firstLine = 0;
    }
    BranchChunk.call(this, [new LeafChunk([new Line("", null)])]);
    this.first = firstLine;
    this.scrollTop = this.scrollLeft = 0;
    this.cantEdit = false;
    this.cleanGeneration = 1;
    this.modeFrontier = this.highlightFrontier = firstLine;
    var start = Pos(firstLine, 0);
    this.sel = simpleSelection(start);
    this.history = new History(null);
    this.id = ++nextDocId;
    this.modeOption = mode;
    this.lineSep = lineSep;
    this.direction = direction == "rtl" ? "rtl" : "ltr";
    this.extend = false;
    if (typeof text == "string") {
      text = this.splitLines(text);
    }
    updateDoc(this, {
      from: start,
      to: start,
      text: text
    });
    setSelection(this, simpleSelection(start), sel_dontScroll);
  };
  Doc.prototype = createObj(BranchChunk.prototype, {
    constructor: Doc,
    iter: function (from, to, op) {
      if (op) {
        this.iterN(from - this.first, to - from, op);
      } else {
        this.iterN(this.first, this.first + this.size, from);
      }
    },
    insert: function (at, lines) {
      var height = 0;
      for (var i = 0; i < lines.length; ++i) {
        height += lines[i].height;
      }
      this.insertInner(at - this.first, lines, height);
    },
    remove: function (at, n) {
      this.removeInner(at - this.first, n);
    },
    getValue: function (lineSep) {
      var lines = getLines(this, this.first, this.first + this.size);
      if (lineSep === false) {
        return lines;
      }
      return lines.join(lineSep || this.lineSeparator());
    },
    setValue: docMethodOp(function (code) {
      var top = Pos(this.first, 0),
        last = this.first + this.size - 1;
      makeChange(this, {
        from: top,
        to: Pos(last, getLine(this, last).text.length),
        text: this.splitLines(code),
        origin: "setValue",
        full: true
      }, true);
      if (this.cm) {
        scrollToCoords(this.cm, 0, 0);
      }
      setSelection(this, simpleSelection(top), sel_dontScroll);
    }),
    replaceRange: function (code, from, to, origin) {
      from = clipPos(this, from);
      to = to ? clipPos(this, to) : from;
      replaceRange(this, code, from, to, origin);
    },
    getRange: function (from, to, lineSep) {
      var lines = getBetween(this, clipPos(this, from), clipPos(this, to));
      if (lineSep === false) {
        return lines;
      }
      return lines.join(lineSep || this.lineSeparator());
    },
    getLine: function (line) {
      var l = this.getLineHandle(line);
      return l && l.text;
    },
    setLine: function (line, text) {
      if (isLine(this, line)) replaceRange(this, text, Pos(line, 0), clipPos(this, Pos(line)));
    },
    getLineHandle: function (line) {
      if (isLine(this, line)) {
        return getLine(this, line);
      }
    },
    getLineNumber: function (line) {
      return lineNo(line);
    },
    getLineHandleVisualStart: function (line) {
      if (typeof line == "number") {
        line = getLine(this, line);
      }
      return visualLine(line);
    },
    lineCount: function () {
      return this.size;
    },
    firstLine: function () {
      return this.first;
    },
    lastLine: function () {
      return this.first + this.size - 1;
    },
    clipPos: function (pos) {
      return clipPos(this, pos);
    },
    getCursor: function (start) {
      var range$$1 = this.sel.primary(),
        pos;
      if (start == null || start == "head") {
        pos = range$$1.head;
      } else if (start == "anchor") {
        pos = range$$1.anchor;
      } else if (start == "end" || start == "to" || start === false) {
        pos = range$$1.to();
      } else {
        pos = range$$1.from();
      }
      return pos;
    },
    listSelections: function () {
      return this.sel.ranges;
    },
    somethingSelected: function () {
      return this.sel.somethingSelected();
    },
    setCursor: docMethodOp(function (line, ch, options) {
      setSimpleSelection(this, clipPos(this, typeof line == "number" ? Pos(line, ch || 0) : line), null, options);
    }),
    setSelection: docMethodOp(function (anchor, head, options) {
      setSimpleSelection(this, clipPos(this, anchor), clipPos(this, head || anchor), options);
    }),
    extendSelection: docMethodOp(function (head, other, options) {
      extendSelection(this, clipPos(this, head), other && clipPos(this, other), options);
    }),
    extendSelections: docMethodOp(function (heads, options) {
      extendSelections(this, clipPosArray(this, heads), options);
    }),
    extendSelectionsBy: docMethodOp(function (f, options) {
      var heads = map(this.sel.ranges, f);
      extendSelections(this, clipPosArray(this, heads), options);
    }),
    setSelections: docMethodOp(function (ranges, primary, options) {
      if (!ranges.length) {
        return;
      }
      var out = [];
      for (var i = 0; i < ranges.length; i++) {
        out[i] = new Range(clipPos(this, ranges[i].anchor), clipPos(this, ranges[i].head));
      }
      if (primary == null) {
        primary = Math.min(ranges.length - 1, this.sel.primIndex);
      }
      setSelection(this, normalizeSelection(this.cm, out, primary), options);
    }),
    addSelection: docMethodOp(function (anchor, head, options) {
      var ranges = this.sel.ranges.slice(0);
      ranges.push(new Range(clipPos(this, anchor), clipPos(this, head || anchor)));
      setSelection(this, normalizeSelection(this.cm, ranges, ranges.length - 1), options);
    }),
    getSelection: function (lineSep) {
      var ranges = this.sel.ranges,
        lines;
      for (var i = 0; i < ranges.length; i++) {
        var sel = getBetween(this, ranges[i].from(), ranges[i].to());
        lines = lines ? lines.concat(sel) : sel;
      }
      if (lineSep === false) {
        return lines;
      } else {
        return lines.join(lineSep || this.lineSeparator());
      }
    },
    getSelections: function (lineSep) {
      var parts = [],
        ranges = this.sel.ranges;
      for (var i = 0; i < ranges.length; i++) {
        var sel = getBetween(this, ranges[i].from(), ranges[i].to());
        if (lineSep !== false) {
          sel = sel.join(lineSep || this.lineSeparator());
        }
        parts[i] = sel;
      }
      return parts;
    },
    replaceSelection: function (code, collapse, origin) {
      var dup = [];
      for (var i = 0; i < this.sel.ranges.length; i++) {
        dup[i] = code;
      }
      this.replaceSelections(dup, collapse, origin || "+input");
    },
    replaceSelections: docMethodOp(function (code, collapse, origin) {
      var changes = [],
        sel = this.sel;
      for (var i = 0; i < sel.ranges.length; i++) {
        var range$$1 = sel.ranges[i];
        changes[i] = {
          from: range$$1.from(),
          to: range$$1.to(),
          text: this.splitLines(code[i]),
          origin: origin
        };
      }
      var newSel = collapse && collapse != "end" && computeReplacedSel(this, changes, collapse);
      for (var i$1 = changes.length - 1; i$1 >= 0; i$1--) {
        makeChange(this, changes[i$1]);
      }
      if (newSel) {
        setSelectionReplaceHistory(this, newSel);
      } else if (this.cm) {
        ensureCursorVisible(this.cm);
      }
    }),
    undo: docMethodOp(function () {
      makeChangeFromHistory(this, "undo");
    }),
    redo: docMethodOp(function () {
      makeChangeFromHistory(this, "redo");
    }),
    undoSelection: docMethodOp(function () {
      makeChangeFromHistory(this, "undo", true);
    }),
    redoSelection: docMethodOp(function () {
      makeChangeFromHistory(this, "redo", true);
    }),
    setExtending: function (val) {
      this.extend = val;
    },
    getExtending: function () {
      return this.extend;
    },
    historySize: function () {
      var hist = this.history,
        done = 0,
        undone = 0;
      for (var i = 0; i < hist.done.length; i++) {
        if (!hist.done[i].ranges) {
          ++done;
        }
      }
      for (var i$1 = 0; i$1 < hist.undone.length; i$1++) {
        if (!hist.undone[i$1].ranges) {
          ++undone;
        }
      }
      return {
        undo: done,
        redo: undone
      };
    },
    clearHistory: function () {
      this.history = new History(this.history.maxGeneration);
    },
    markClean: function () {
      this.cleanGeneration = this.changeGeneration(true);
    },
    changeGeneration: function (forceSplit) {
      if (forceSplit) {
        this.history.lastOp = this.history.lastSelOp = this.history.lastOrigin = null;
      }
      return this.history.generation;
    },
    isClean: function (gen) {
      return this.history.generation == (gen || this.cleanGeneration);
    },
    getHistory: function () {
      return {
        done: copyHistoryArray(this.history.done),
        undone: copyHistoryArray(this.history.undone)
      };
    },
    setHistory: function (histData) {
      var hist = this.history = new History(this.history.maxGeneration);
      hist.done = copyHistoryArray(histData.done.slice(0), null, true);
      hist.undone = copyHistoryArray(histData.undone.slice(0), null, true);
    },
    setGutterMarker: docMethodOp(function (line, gutterID, value) {
      return changeLine(this, line, "gutter", function (line) {
        var markers = line.gutterMarkers || (line.gutterMarkers = {});
        markers[gutterID] = value;
        if (!value && isEmpty(markers)) {
          line.gutterMarkers = null;
        }
        return true;
      });
    }),
    clearGutter: docMethodOp(function (gutterID) {
      var this$1 = this;
      this.iter(function (line) {
        if (line.gutterMarkers && line.gutterMarkers[gutterID]) {
          changeLine(this$1, line, "gutter", function () {
            line.gutterMarkers[gutterID] = null;
            if (isEmpty(line.gutterMarkers)) {
              line.gutterMarkers = null;
            }
            return true;
          });
        }
      });
    }),
    lineInfo: function (line) {
      var n;
      if (typeof line == "number") {
        if (!isLine(this, line)) {
          return null;
        }
        n = line;
        line = getLine(this, line);
        if (!line) {
          return null;
        }
      } else {
        n = lineNo(line);
        if (n == null) {
          return null;
        }
      }
      return {
        line: n,
        handle: line,
        text: line.text,
        gutterMarkers: line.gutterMarkers,
        textClass: line.textClass,
        bgClass: line.bgClass,
        wrapClass: line.wrapClass,
        widgets: line.widgets
      };
    },
    addLineClass: docMethodOp(function (handle, where, cls) {
      return changeLine(this, handle, where == "gutter" ? "gutter" : "class", function (line) {
        var prop = where == "text" ? "textClass" : where == "background" ? "bgClass" : where == "gutter" ? "gutterClass" : "wrapClass";
        if (!line[prop]) {
          line[prop] = cls;
        } else if (classTest(cls).test(line[prop])) {
          return false;
        } else {
          line[prop] += " " + cls;
        }
        return true;
      });
    }),
    removeLineClass: docMethodOp(function (handle, where, cls) {
      return changeLine(this, handle, where == "gutter" ? "gutter" : "class", function (line) {
        var prop = where == "text" ? "textClass" : where == "background" ? "bgClass" : where == "gutter" ? "gutterClass" : "wrapClass";
        var cur = line[prop];
        if (!cur) {
          return false;
        } else if (cls == null) {
          line[prop] = null;
        } else {
          var found = cur.match(classTest(cls));
          if (!found) {
            return false;
          }
          var end = found.index + found[0].length;
          line[prop] = cur.slice(0, found.index) + (!found.index || end == cur.length ? "" : " ") + cur.slice(end) || null;
        }
        return true;
      });
    }),
    addLineWidget: docMethodOp(function (handle, node, options) {
      return addLineWidget(this, handle, node, options);
    }),
    removeLineWidget: function (widget) {
      widget.clear();
    },
    markText: function (from, to, options) {
      return markText(this, clipPos(this, from), clipPos(this, to), options, options && options.type || "range");
    },
    setBookmark: function (pos, options) {
      var realOpts = {
        replacedWith: options && (options.nodeType == null ? options.widget : options),
        insertLeft: options && options.insertLeft,
        clearWhenEmpty: false,
        shared: options && options.shared,
        handleMouseEvents: options && options.handleMouseEvents
      };
      pos = clipPos(this, pos);
      return markText(this, pos, pos, realOpts, "bookmark");
    },
    findMarksAt: function (pos) {
      pos = clipPos(this, pos);
      var markers = [],
        spans = getLine(this, pos.line).markedSpans;
      if (spans) {
        for (var i = 0; i < spans.length; ++i) {
          var span = spans[i];
          if ((span.from == null || span.from <= pos.ch) && (span.to == null || span.to >= pos.ch)) {
            markers.push(span.marker.parent || span.marker);
          }
        }
      }
      return markers;
    },
    findMarks: function (from, to, filter) {
      from = clipPos(this, from);
      to = clipPos(this, to);
      var found = [],
        lineNo$$1 = from.line;
      this.iter(from.line, to.line + 1, function (line) {
        var spans = line.markedSpans;
        if (spans) {
          for (var i = 0; i < spans.length; i++) {
            var span = spans[i];
            if (!(span.to != null && lineNo$$1 == from.line && from.ch >= span.to || span.from == null && lineNo$$1 != from.line || span.from != null && lineNo$$1 == to.line && span.from >= to.ch) && (!filter || filter(span.marker))) {
              found.push(span.marker.parent || span.marker);
            }
          }
        }
        ++lineNo$$1;
      });
      return found;
    },
    getAllMarks: function () {
      var markers = [];
      this.iter(function (line) {
        var sps = line.markedSpans;
        if (sps) {
          for (var i = 0; i < sps.length; ++i) {
            if (sps[i].from != null) {
              markers.push(sps[i].marker);
            }
          }
        }
      });
      return markers;
    },
    posFromIndex: function (off) {
      var ch,
        lineNo$$1 = this.first,
        sepSize = this.lineSeparator().length;
      this.iter(function (line) {
        var sz = line.text.length + sepSize;
        if (sz > off) {
          ch = off;
          return true;
        }
        off -= sz;
        ++lineNo$$1;
      });
      return clipPos(this, Pos(lineNo$$1, ch));
    },
    indexFromPos: function (coords) {
      coords = clipPos(this, coords);
      var index = coords.ch;
      if (coords.line < this.first || coords.ch < 0) {
        return 0;
      }
      var sepSize = this.lineSeparator().length;
      this.iter(this.first, coords.line, function (line) {
        index += line.text.length + sepSize;
      });
      return index;
    },
    copy: function (copyHistory) {
      var doc = new Doc(getLines(this, this.first, this.first + this.size), this.modeOption, this.first, this.lineSep, this.direction);
      doc.scrollTop = this.scrollTop;
      doc.scrollLeft = this.scrollLeft;
      doc.sel = this.sel;
      doc.extend = false;
      if (copyHistory) {
        doc.history.undoDepth = this.history.undoDepth;
        doc.setHistory(this.getHistory());
      }
      return doc;
    },
    linkedDoc: function (options) {
      if (!options) {
        options = {};
      }
      var from = this.first,
        to = this.first + this.size;
      if (options.from != null && options.from > from) {
        from = options.from;
      }
      if (options.to != null && options.to < to) {
        to = options.to;
      }
      var copy = new Doc(getLines(this, from, to), options.mode || this.modeOption, from, this.lineSep, this.direction);
      if (options.sharedHist) {
        copy.history = this.history;
      }
      (this.linked || (this.linked = [])).push({
        doc: copy,
        sharedHist: options.sharedHist
      });
      copy.linked = [{
        doc: this,
        isParent: true,
        sharedHist: options.sharedHist
      }];
      copySharedMarkers(copy, findSharedMarkers(this));
      return copy;
    },
    unlinkDoc: function (other) {
      if (other instanceof CodeMirror) {
        other = other.doc;
      }
      if (this.linked) {
        for (var i = 0; i < this.linked.length; ++i) {
          var link = this.linked[i];
          if (link.doc != other) {
            continue;
          }
          this.linked.splice(i, 1);
          other.unlinkDoc(this);
          detachSharedMarkers(findSharedMarkers(this));
          break;
        }
      }
      if (other.history == this.history) {
        var splitIds = [other.id];
        linkedDocs(other, function (doc) {
          return splitIds.push(doc.id);
        }, true);
        other.history = new History(null);
        other.history.done = copyHistoryArray(this.history.done, splitIds);
        other.history.undone = copyHistoryArray(this.history.undone, splitIds);
      }
    },
    iterLinkedDocs: function (f) {
      linkedDocs(this, f);
    },
    getMode: function () {
      return this.mode;
    },
    getEditor: function () {
      return this.cm;
    },
    splitLines: function (str) {
      if (this.lineSep) {
        return str.split(this.lineSep);
      }
      return splitLinesAuto(str);
    },
    lineSeparator: function () {
      return this.lineSep || "\n";
    },
    setDirection: docMethodOp(function (dir) {
      if (dir != "rtl") {
        dir = "ltr";
      }
      if (dir == this.direction) {
        return;
      }
      this.direction = dir;
      this.iter(function (line) {
        return line.order = null;
      });
      if (this.cm) {
        directionChanged(this.cm);
      }
    })
  });
  Doc.prototype.eachLine = Doc.prototype.iter;
  var lastDrop = 0;
  function onDrop(e) {
    var cm = this;
    clearDragCursor(cm);
    if (signalDOMEvent(cm, e) || eventInWidget(cm.display, e)) {
      return;
    }
    e_preventDefault(e);
    if (ie) {
      lastDrop = +new Date();
    }
    var pos = posFromMouse(cm, e, true),
      files = e.dataTransfer.files;
    if (!pos || cm.isReadOnly()) {
      return;
    }
    if (files && files.length && window.FileReader && window.File) {
      var n = files.length,
        text = Array(n),
        read = 0;
      var loadFile = function (file, i) {
        if (cm.options.allowDropFileTypes && indexOf(cm.options.allowDropFileTypes, file.type) == -1) {
          return;
        }
        var reader = new FileReader();
        reader.onload = operation(cm, function () {
          var content = reader.result;
          if (/[\x00-\x08\x0e-\x1f]{2}/.test(content)) {
            content = "";
          }
          text[i] = content;
          if (++read == n) {
            pos = clipPos(cm.doc, pos);
            var change = {
              from: pos,
              to: pos,
              text: cm.doc.splitLines(text.join(cm.doc.lineSeparator())),
              origin: "paste"
            };
            makeChange(cm.doc, change);
            setSelectionReplaceHistory(cm.doc, simpleSelection(pos, changeEnd(change)));
          }
        });
        reader.readAsText(file);
      };
      for (var i = 0; i < n; ++i) {
        loadFile(files[i], i);
      }
    } else {
      if (cm.state.draggingText && cm.doc.sel.contains(pos) > -1) {
        cm.state.draggingText(e);
        setTimeout(function () {
          return cm.display.input.focus();
        }, 20);
        return;
      }
      try {
        var text$1 = e.dataTransfer.getData("Text");
        if (text$1) {
          var selected;
          if (cm.state.draggingText && !cm.state.draggingText.copy) {
            selected = cm.listSelections();
          }
          setSelectionNoUndo(cm.doc, simpleSelection(pos, pos));
          if (selected) {
            for (var i$1 = 0; i$1 < selected.length; ++i$1) {
              replaceRange(cm.doc, "", selected[i$1].anchor, selected[i$1].head, "drag");
            }
          }
          cm.replaceSelection(text$1, "around", "paste");
          cm.display.input.focus();
        }
      } catch (e) {}
    }
  }
  function onDragStart(cm, e) {
    if (ie && (!cm.state.draggingText || +new Date() - lastDrop < 100)) {
      e_stop(e);
      return;
    }
    if (signalDOMEvent(cm, e) || eventInWidget(cm.display, e)) {
      return;
    }
    e.dataTransfer.setData("Text", cm.getSelection());
    e.dataTransfer.effectAllowed = "copyMove";
    if (e.dataTransfer.setDragImage && !safari) {
      var img = elt("img", null, null, "position: fixed; left: 0; top: 0;");
      img.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
      if (presto) {
        img.width = img.height = 1;
        cm.display.wrapper.appendChild(img);
        img._top = img.offsetTop;
      }
      e.dataTransfer.setDragImage(img, 0, 0);
      if (presto) {
        img.parentNode.removeChild(img);
      }
    }
  }
  function onDragOver(cm, e) {
    var pos = posFromMouse(cm, e);
    if (!pos) {
      return;
    }
    var frag = document.createDocumentFragment();
    drawSelectionCursor(cm, pos, frag);
    if (!cm.display.dragCursor) {
      cm.display.dragCursor = elt("div", null, "CodeMirror-cursors CodeMirror-dragcursors");
      cm.display.lineSpace.insertBefore(cm.display.dragCursor, cm.display.cursorDiv);
    }
    removeChildrenAndAdd(cm.display.dragCursor, frag);
  }
  function clearDragCursor(cm) {
    if (cm.display.dragCursor) {
      cm.display.lineSpace.removeChild(cm.display.dragCursor);
      cm.display.dragCursor = null;
    }
  }
  function forEachCodeMirror(f) {
    if (!document.getElementsByClassName) {
      return;
    }
    var byClass = document.getElementsByClassName("CodeMirror"),
      editors = [];
    for (var i = 0; i < byClass.length; i++) {
      var cm = byClass[i].CodeMirror;
      if (cm) {
        editors.push(cm);
      }
    }
    if (editors.length) {
      editors[0].operation(function () {
        for (var i = 0; i < editors.length; i++) {
          f(editors[i]);
        }
      });
    }
  }
  var globalsRegistered = false;
  function ensureGlobalHandlers() {
    if (globalsRegistered) {
      return;
    }
    registerGlobalHandlers();
    globalsRegistered = true;
  }
  function registerGlobalHandlers() {
    var resizeTimer;
    on(window, "resize", function () {
      if (resizeTimer == null) {
        resizeTimer = setTimeout(function () {
          resizeTimer = null;
          forEachCodeMirror(onResize);
        }, 100);
      }
    });
    on(window, "blur", function () {
      return forEachCodeMirror(onBlur);
    });
  }
  function onResize(cm) {
    var d = cm.display;
    d.cachedCharWidth = d.cachedTextHeight = d.cachedPaddingH = null;
    d.scrollbarsClipped = false;
    cm.setSize();
  }
  var keyNames = {
    3: "Pause",
    8: "Backspace",
    9: "Tab",
    13: "Enter",
    16: "Shift",
    17: "Ctrl",
    18: "Alt",
    19: "Pause",
    20: "CapsLock",
    27: "Esc",
    32: "Space",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "Left",
    38: "Up",
    39: "Right",
    40: "Down",
    44: "PrintScrn",
    45: "Insert",
    46: "Delete",
    59: ";",
    61: "=",
    91: "Mod",
    92: "Mod",
    93: "Mod",
    106: "*",
    107: "=",
    109: "-",
    110: ".",
    111: "/",
    145: "ScrollLock",
    173: "-",
    186: ";",
    187: "=",
    188: ",",
    189: "-",
    190: ".",
    191: "/",
    192: "`",
    219: "[",
    220: "\\",
    221: "]",
    222: "'",
    63232: "Up",
    63233: "Down",
    63234: "Left",
    63235: "Right",
    63272: "Delete",
    63273: "Home",
    63275: "End",
    63276: "PageUp",
    63277: "PageDown",
    63302: "Insert"
  };
  for (var i = 0; i < 10; i++) {
    keyNames[i + 48] = keyNames[i + 96] = String(i);
  }
  for (var i$1 = 65; i$1 <= 90; i$1++) {
    keyNames[i$1] = String.fromCharCode(i$1);
  }
  for (var i$2 = 1; i$2 <= 12; i$2++) {
    keyNames[i$2 + 111] = keyNames[i$2 + 63235] = "F" + i$2;
  }
  var keyMap = {};
  keyMap.basic = {
    Left: "goCharLeft",
    Right: "goCharRight",
    Up: "goLineUp",
    Down: "goLineDown",
    End: "goLineEnd",
    Home: "goLineStartSmart",
    PageUp: "goPageUp",
    PageDown: "goPageDown",
    Delete: "delCharAfter",
    Backspace: "delCharBefore",
    "Shift-Backspace": "delCharBefore",
    Tab: "defaultTab",
    "Shift-Tab": "indentAuto",
    Enter: "newlineAndIndent",
    Insert: "toggleOverwrite",
    Esc: "singleSelection"
  };
  keyMap.pcDefault = {
    "Ctrl-A": "selectAll",
    "Ctrl-D": "deleteLine",
    "Ctrl-Z": "undo",
    "Shift-Ctrl-Z": "redo",
    "Ctrl-Y": "redo",
    "Ctrl-Home": "goDocStart",
    "Ctrl-End": "goDocEnd",
    "Ctrl-Up": "goLineUp",
    "Ctrl-Down": "goLineDown",
    "Ctrl-Left": "goGroupLeft",
    "Ctrl-Right": "goGroupRight",
    "Alt-Left": "goLineStart",
    "Alt-Right": "goLineEnd",
    "Ctrl-Backspace": "delGroupBefore",
    "Ctrl-Delete": "delGroupAfter",
    "Ctrl-S": "save",
    "Ctrl-F": "find",
    "Ctrl-G": "findNext",
    "Shift-Ctrl-G": "findPrev",
    "Shift-Ctrl-F": "replace",
    "Shift-Ctrl-R": "replaceAll",
    "Ctrl-[": "indentLess",
    "Ctrl-]": "indentMore",
    "Ctrl-U": "undoSelection",
    "Shift-Ctrl-U": "redoSelection",
    "Alt-U": "redoSelection",
    fallthrough: "basic"
  };
  keyMap.emacsy = {
    "Ctrl-F": "goCharRight",
    "Ctrl-B": "goCharLeft",
    "Ctrl-P": "goLineUp",
    "Ctrl-N": "goLineDown",
    "Alt-F": "goWordRight",
    "Alt-B": "goWordLeft",
    "Ctrl-A": "goLineStart",
    "Ctrl-E": "goLineEnd",
    "Ctrl-V": "goPageDown",
    "Shift-Ctrl-V": "goPageUp",
    "Ctrl-D": "delCharAfter",
    "Ctrl-H": "delCharBefore",
    "Alt-D": "delWordAfter",
    "Alt-Backspace": "delWordBefore",
    "Ctrl-K": "killLine",
    "Ctrl-T": "transposeChars",
    "Ctrl-O": "openLine"
  };
  keyMap.macDefault = {
    "Cmd-A": "selectAll",
    "Cmd-D": "deleteLine",
    "Cmd-Z": "undo",
    "Shift-Cmd-Z": "redo",
    "Cmd-Y": "redo",
    "Cmd-Home": "goDocStart",
    "Cmd-Up": "goDocStart",
    "Cmd-End": "goDocEnd",
    "Cmd-Down": "goDocEnd",
    "Alt-Left": "goGroupLeft",
    "Alt-Right": "goGroupRight",
    "Cmd-Left": "goLineLeft",
    "Cmd-Right": "goLineRight",
    "Alt-Backspace": "delGroupBefore",
    "Ctrl-Alt-Backspace": "delGroupAfter",
    "Alt-Delete": "delGroupAfter",
    "Cmd-S": "save",
    "Cmd-F": "find",
    "Cmd-G": "findNext",
    "Shift-Cmd-G": "findPrev",
    "Cmd-Alt-F": "replace",
    "Shift-Cmd-Alt-F": "replaceAll",
    "Cmd-[": "indentLess",
    "Cmd-]": "indentMore",
    "Cmd-Backspace": "delWrappedLineLeft",
    "Cmd-Delete": "delWrappedLineRight",
    "Cmd-U": "undoSelection",
    "Shift-Cmd-U": "redoSelection",
    "Ctrl-Up": "goDocStart",
    "Ctrl-Down": "goDocEnd",
    fallthrough: ["basic", "emacsy"]
  };
  keyMap["default"] = mac ? keyMap.macDefault : keyMap.pcDefault;
  function normalizeKeyName(name) {
    var parts = name.split(/-(?!$)/);
    name = parts[parts.length - 1];
    var alt, ctrl, shift, cmd;
    for (var i = 0; i < parts.length - 1; i++) {
      var mod = parts[i];
      if (/^(cmd|meta|m)$/i.test(mod)) {
        cmd = true;
      } else if (/^a(lt)?$/i.test(mod)) {
        alt = true;
      } else if (/^(c|ctrl|control)$/i.test(mod)) {
        ctrl = true;
      } else if (/^s(hift)?$/i.test(mod)) {
        shift = true;
      } else {
        throw new Error("Unrecognized modifier name: " + mod);
      }
    }
    if (alt) {
      name = "Alt-" + name;
    }
    if (ctrl) {
      name = "Ctrl-" + name;
    }
    if (cmd) {
      name = "Cmd-" + name;
    }
    if (shift) {
      name = "Shift-" + name;
    }
    return name;
  }
  function normalizeKeyMap(keymap) {
    var copy = {};
    for (var keyname in keymap) {
      if (keymap.hasOwnProperty(keyname)) {
        var value = keymap[keyname];
        if (/^(name|fallthrough|(de|at)tach)$/.test(keyname)) {
          continue;
        }
        if (value == "...") {
          delete keymap[keyname];
          continue;
        }
        var keys = map(keyname.split(" "), normalizeKeyName);
        for (var i = 0; i < keys.length; i++) {
          var val = void 0,
            name = void 0;
          if (i == keys.length - 1) {
            name = keys.join(" ");
            val = value;
          } else {
            name = keys.slice(0, i + 1).join(" ");
            val = "...";
          }
          var prev = copy[name];
          if (!prev) {
            copy[name] = val;
          } else if (prev != val) {
            throw new Error("Inconsistent bindings for " + name);
          }
        }
        delete keymap[keyname];
      }
    }
    for (var prop in copy) {
      keymap[prop] = copy[prop];
    }
    return keymap;
  }
  function lookupKey(key, map$$1, handle, context) {
    map$$1 = getKeyMap(map$$1);
    var found = map$$1.call ? map$$1.call(key, context) : map$$1[key];
    if (found === false) {
      return "nothing";
    }
    if (found === "...") {
      return "multi";
    }
    if (found != null && handle(found)) {
      return "handled";
    }
    if (map$$1.fallthrough) {
      if (Object.prototype.toString.call(map$$1.fallthrough) != "[object Array]") {
        return lookupKey(key, map$$1.fallthrough, handle, context);
      }
      for (var i = 0; i < map$$1.fallthrough.length; i++) {
        var result = lookupKey(key, map$$1.fallthrough[i], handle, context);
        if (result) {
          return result;
        }
      }
    }
  }
  function isModifierKey(value) {
    var name = typeof value == "string" ? value : keyNames[value.keyCode];
    return name == "Ctrl" || name == "Alt" || name == "Shift" || name == "Mod";
  }
  function addModifierNames(name, event, noShift) {
    var base = name;
    if (event.altKey && base != "Alt") {
      name = "Alt-" + name;
    }
    if ((flipCtrlCmd ? event.metaKey : event.ctrlKey) && base != "Ctrl") {
      name = "Ctrl-" + name;
    }
    if ((flipCtrlCmd ? event.ctrlKey : event.metaKey) && base != "Cmd") {
      name = "Cmd-" + name;
    }
    if (!noShift && event.shiftKey && base != "Shift") {
      name = "Shift-" + name;
    }
    return name;
  }
  function keyName(event, noShift) {
    if (presto && event.keyCode == 34 && event["char"]) {
      return false;
    }
    var name = keyNames[event.keyCode];
    if (name == null || event.altGraphKey) {
      return false;
    }
    if (event.keyCode == 3 && event.code) {
      name = event.code;
    }
    return addModifierNames(name, event, noShift);
  }
  function getKeyMap(val) {
    return typeof val == "string" ? keyMap[val] : val;
  }
  function deleteNearSelection(cm, compute) {
    var ranges = cm.doc.sel.ranges,
      kill = [];
    for (var i = 0; i < ranges.length; i++) {
      var toKill = compute(ranges[i]);
      while (kill.length && cmp(toKill.from, lst(kill).to) <= 0) {
        var replaced = kill.pop();
        if (cmp(replaced.from, toKill.from) < 0) {
          toKill.from = replaced.from;
          break;
        }
      }
      kill.push(toKill);
    }
    runInOp(cm, function () {
      for (var i = kill.length - 1; i >= 0; i--) {
        replaceRange(cm.doc, "", kill[i].from, kill[i].to, "+delete");
      }
      ensureCursorVisible(cm);
    });
  }
  function moveCharLogically(line, ch, dir) {
    var target = skipExtendingChars(line.text, ch + dir, dir);
    return target < 0 || target > line.text.length ? null : target;
  }
  function moveLogically(line, start, dir) {
    var ch = moveCharLogically(line, start.ch, dir);
    return ch == null ? null : new Pos(start.line, ch, dir < 0 ? "after" : "before");
  }
  function endOfLine(visually, cm, lineObj, lineNo, dir) {
    if (visually) {
      var order = getOrder(lineObj, cm.doc.direction);
      if (order) {
        var part = dir < 0 ? lst(order) : order[0];
        var moveInStorageOrder = dir < 0 == (part.level == 1);
        var sticky = moveInStorageOrder ? "after" : "before";
        var ch;
        if (part.level > 0 || cm.doc.direction == "rtl") {
          var prep = prepareMeasureForLine(cm, lineObj);
          ch = dir < 0 ? lineObj.text.length - 1 : 0;
          var targetTop = measureCharPrepared(cm, prep, ch).top;
          ch = findFirst(function (ch) {
            return measureCharPrepared(cm, prep, ch).top == targetTop;
          }, dir < 0 == (part.level == 1) ? part.from : part.to - 1, ch);
          if (sticky == "before") {
            ch = moveCharLogically(lineObj, ch, 1);
          }
        } else {
          ch = dir < 0 ? part.to : part.from;
        }
        return new Pos(lineNo, ch, sticky);
      }
    }
    return new Pos(lineNo, dir < 0 ? lineObj.text.length : 0, dir < 0 ? "before" : "after");
  }
  function moveVisually(cm, line, start, dir) {
    var bidi = getOrder(line, cm.doc.direction);
    if (!bidi) {
      return moveLogically(line, start, dir);
    }
    if (start.ch >= line.text.length) {
      start.ch = line.text.length;
      start.sticky = "before";
    } else if (start.ch <= 0) {
      start.ch = 0;
      start.sticky = "after";
    }
    var partPos = getBidiPartAt(bidi, start.ch, start.sticky),
      part = bidi[partPos];
    if (cm.doc.direction == "ltr" && part.level % 2 == 0 && (dir > 0 ? part.to > start.ch : part.from < start.ch)) {
      return moveLogically(line, start, dir);
    }
    var mv = function (pos, dir) {
      return moveCharLogically(line, pos instanceof Pos ? pos.ch : pos, dir);
    };
    var prep;
    var getWrappedLineExtent = function (ch) {
      if (!cm.options.lineWrapping) {
        return {
          begin: 0,
          end: line.text.length
        };
      }
      prep = prep || prepareMeasureForLine(cm, line);
      return wrappedLineExtentChar(cm, line, prep, ch);
    };
    var wrappedLineExtent = getWrappedLineExtent(start.sticky == "before" ? mv(start, -1) : start.ch);
    if (cm.doc.direction == "rtl" || part.level == 1) {
      var moveInStorageOrder = part.level == 1 == dir < 0;
      var ch = mv(start, moveInStorageOrder ? 1 : -1);
      if (ch != null && (!moveInStorageOrder ? ch >= part.from && ch >= wrappedLineExtent.begin : ch <= part.to && ch <= wrappedLineExtent.end)) {
        var sticky = moveInStorageOrder ? "before" : "after";
        return new Pos(start.line, ch, sticky);
      }
    }
    var searchInVisualLine = function (partPos, dir, wrappedLineExtent) {
      var getRes = function (ch, moveInStorageOrder) {
        return moveInStorageOrder ? new Pos(start.line, mv(ch, 1), "before") : new Pos(start.line, ch, "after");
      };
      for (; partPos >= 0 && partPos < bidi.length; partPos += dir) {
        var part = bidi[partPos];
        var moveInStorageOrder = dir > 0 == (part.level != 1);
        var ch = moveInStorageOrder ? wrappedLineExtent.begin : mv(wrappedLineExtent.end, -1);
        if (part.from <= ch && ch < part.to) {
          return getRes(ch, moveInStorageOrder);
        }
        ch = moveInStorageOrder ? part.from : mv(part.to, -1);
        if (wrappedLineExtent.begin <= ch && ch < wrappedLineExtent.end) {
          return getRes(ch, moveInStorageOrder);
        }
      }
    };
    var res = searchInVisualLine(partPos + dir, dir, wrappedLineExtent);
    if (res) {
      return res;
    }
    var nextCh = dir > 0 ? wrappedLineExtent.end : mv(wrappedLineExtent.begin, -1);
    if (nextCh != null && !(dir > 0 && nextCh == line.text.length)) {
      res = searchInVisualLine(dir > 0 ? 0 : bidi.length - 1, dir, getWrappedLineExtent(nextCh));
      if (res) {
        return res;
      }
    }
    return null;
  }
  var commands = {
    selectAll: selectAll,
    singleSelection: function (cm) {
      return cm.setSelection(cm.getCursor("anchor"), cm.getCursor("head"), sel_dontScroll);
    },
    killLine: function (cm) {
      return deleteNearSelection(cm, function (range) {
        if (range.empty()) {
          var len = getLine(cm.doc, range.head.line).text.length;
          if (range.head.ch == len && range.head.line < cm.lastLine()) {
            return {
              from: range.head,
              to: Pos(range.head.line + 1, 0)
            };
          } else {
            return {
              from: range.head,
              to: Pos(range.head.line, len)
            };
          }
        } else {
          return {
            from: range.from(),
            to: range.to()
          };
        }
      });
    },
    deleteLine: function (cm) {
      return deleteNearSelection(cm, function (range) {
        return {
          from: Pos(range.from().line, 0),
          to: clipPos(cm.doc, Pos(range.to().line + 1, 0))
        };
      });
    },
    delLineLeft: function (cm) {
      return deleteNearSelection(cm, function (range) {
        return {
          from: Pos(range.from().line, 0),
          to: range.from()
        };
      });
    },
    delWrappedLineLeft: function (cm) {
      return deleteNearSelection(cm, function (range) {
        var top = cm.charCoords(range.head, "div").top + 5;
        var leftPos = cm.coordsChar({
          left: 0,
          top: top
        }, "div");
        return {
          from: leftPos,
          to: range.from()
        };
      });
    },
    delWrappedLineRight: function (cm) {
      return deleteNearSelection(cm, function (range) {
        var top = cm.charCoords(range.head, "div").top + 5;
        var rightPos = cm.coordsChar({
          left: cm.display.lineDiv.offsetWidth + 100,
          top: top
        }, "div");
        return {
          from: range.from(),
          to: rightPos
        };
      });
    },
    undo: function (cm) {
      return cm.undo();
    },
    redo: function (cm) {
      return cm.redo();
    },
    undoSelection: function (cm) {
      return cm.undoSelection();
    },
    redoSelection: function (cm) {
      return cm.redoSelection();
    },
    goDocStart: function (cm) {
      return cm.extendSelection(Pos(cm.firstLine(), 0));
    },
    goDocEnd: function (cm) {
      return cm.extendSelection(Pos(cm.lastLine()));
    },
    goLineStart: function (cm) {
      return cm.extendSelectionsBy(function (range) {
        return lineStart(cm, range.head.line);
      }, {
        origin: "+move",
        bias: 1
      });
    },
    goLineStartSmart: function (cm) {
      return cm.extendSelectionsBy(function (range) {
        return lineStartSmart(cm, range.head);
      }, {
        origin: "+move",
        bias: 1
      });
    },
    goLineEnd: function (cm) {
      return cm.extendSelectionsBy(function (range) {
        return lineEnd(cm, range.head.line);
      }, {
        origin: "+move",
        bias: -1
      });
    },
    goLineRight: function (cm) {
      return cm.extendSelectionsBy(function (range) {
        var top = cm.cursorCoords(range.head, "div").top + 5;
        return cm.coordsChar({
          left: cm.display.lineDiv.offsetWidth + 100,
          top: top
        }, "div");
      }, sel_move);
    },
    goLineLeft: function (cm) {
      return cm.extendSelectionsBy(function (range) {
        var top = cm.cursorCoords(range.head, "div").top + 5;
        return cm.coordsChar({
          left: 0,
          top: top
        }, "div");
      }, sel_move);
    },
    goLineLeftSmart: function (cm) {
      return cm.extendSelectionsBy(function (range) {
        var top = cm.cursorCoords(range.head, "div").top + 5;
        var pos = cm.coordsChar({
          left: 0,
          top: top
        }, "div");
        if (pos.ch < cm.getLine(pos.line).search(/\S/)) {
          return lineStartSmart(cm, range.head);
        }
        return pos;
      }, sel_move);
    },
    goLineUp: function (cm) {
      return cm.moveV(-1, "line");
    },
    goLineDown: function (cm) {
      return cm.moveV(1, "line");
    },
    goPageUp: function (cm) {
      return cm.moveV(-1, "page");
    },
    goPageDown: function (cm) {
      return cm.moveV(1, "page");
    },
    goCharLeft: function (cm) {
      return cm.moveH(-1, "char");
    },
    goCharRight: function (cm) {
      return cm.moveH(1, "char");
    },
    goColumnLeft: function (cm) {
      return cm.moveH(-1, "column");
    },
    goColumnRight: function (cm) {
      return cm.moveH(1, "column");
    },
    goWordLeft: function (cm) {
      return cm.moveH(-1, "word");
    },
    goGroupRight: function (cm) {
      return cm.moveH(1, "group");
    },
    goGroupLeft: function (cm) {
      return cm.moveH(-1, "group");
    },
    goWordRight: function (cm) {
      return cm.moveH(1, "word");
    },
    delCharBefore: function (cm) {
      return cm.deleteH(-1, "char");
    },
    delCharAfter: function (cm) {
      return cm.deleteH(1, "char");
    },
    delWordBefore: function (cm) {
      return cm.deleteH(-1, "word");
    },
    delWordAfter: function (cm) {
      return cm.deleteH(1, "word");
    },
    delGroupBefore: function (cm) {
      return cm.deleteH(-1, "group");
    },
    delGroupAfter: function (cm) {
      return cm.deleteH(1, "group");
    },
    indentAuto: function (cm) {
      return cm.indentSelection("smart");
    },
    indentMore: function (cm) {
      return cm.indentSelection("add");
    },
    indentLess: function (cm) {
      return cm.indentSelection("subtract");
    },
    insertTab: function (cm) {
      return cm.replaceSelection("\t");
    },
    insertSoftTab: function (cm) {
      var spaces = [],
        ranges = cm.listSelections(),
        tabSize = cm.options.tabSize;
      for (var i = 0; i < ranges.length; i++) {
        var pos = ranges[i].from();
        var col = countColumn(cm.getLine(pos.line), pos.ch, tabSize);
        spaces.push(spaceStr(tabSize - col % tabSize));
      }
      cm.replaceSelections(spaces);
    },
    defaultTab: function (cm) {
      if (cm.somethingSelected()) {
        cm.indentSelection("add");
      } else {
        cm.execCommand("insertTab");
      }
    },
    transposeChars: function (cm) {
      return runInOp(cm, function () {
        var ranges = cm.listSelections(),
          newSel = [];
        for (var i = 0; i < ranges.length; i++) {
          if (!ranges[i].empty()) {
            continue;
          }
          var cur = ranges[i].head,
            line = getLine(cm.doc, cur.line).text;
          if (line) {
            if (cur.ch == line.length) {
              cur = new Pos(cur.line, cur.ch - 1);
            }
            if (cur.ch > 0) {
              cur = new Pos(cur.line, cur.ch + 1);
              cm.replaceRange(line.charAt(cur.ch - 1) + line.charAt(cur.ch - 2), Pos(cur.line, cur.ch - 2), cur, "+transpose");
            } else if (cur.line > cm.doc.first) {
              var prev = getLine(cm.doc, cur.line - 1).text;
              if (prev) {
                cur = new Pos(cur.line, 1);
                cm.replaceRange(line.charAt(0) + cm.doc.lineSeparator() + prev.charAt(prev.length - 1), Pos(cur.line - 1, prev.length - 1), cur, "+transpose");
              }
            }
          }
          newSel.push(new Range(cur, cur));
        }
        cm.setSelections(newSel);
      });
    },
    newlineAndIndent: function (cm) {
      return runInOp(cm, function () {
        var sels = cm.listSelections();
        for (var i = sels.length - 1; i >= 0; i--) {
          cm.replaceRange(cm.doc.lineSeparator(), sels[i].anchor, sels[i].head, "+input");
        }
        sels = cm.listSelections();
        for (var i$1 = 0; i$1 < sels.length; i$1++) {
          cm.indentLine(sels[i$1].from().line, null, true);
        }
        ensureCursorVisible(cm);
      });
    },
    openLine: function (cm) {
      return cm.replaceSelection("\n", "start");
    },
    toggleOverwrite: function (cm) {
      return cm.toggleOverwrite();
    }
  };
  function lineStart(cm, lineN) {
    var line = getLine(cm.doc, lineN);
    var visual = visualLine(line);
    if (visual != line) {
      lineN = lineNo(visual);
    }
    return endOfLine(true, cm, visual, lineN, 1);
  }
  function lineEnd(cm, lineN) {
    var line = getLine(cm.doc, lineN);
    var visual = visualLineEnd(line);
    if (visual != line) {
      lineN = lineNo(visual);
    }
    return endOfLine(true, cm, line, lineN, -1);
  }
  function lineStartSmart(cm, pos) {
    var start = lineStart(cm, pos.line);
    var line = getLine(cm.doc, start.line);
    var order = getOrder(line, cm.doc.direction);
    if (!order || order[0].level == 0) {
      var firstNonWS = Math.max(0, line.text.search(/\S/));
      var inWS = pos.line == start.line && pos.ch <= firstNonWS && pos.ch;
      return Pos(start.line, inWS ? 0 : firstNonWS, start.sticky);
    }
    return start;
  }
  function doHandleBinding(cm, bound, dropShift) {
    if (typeof bound == "string") {
      bound = commands[bound];
      if (!bound) {
        return false;
      }
    }
    cm.display.input.ensurePolled();
    var prevShift = cm.display.shift,
      done = false;
    try {
      if (cm.isReadOnly()) {
        cm.state.suppressEdits = true;
      }
      if (dropShift) {
        cm.display.shift = false;
      }
      done = bound(cm) != Pass;
    } finally {
      cm.display.shift = prevShift;
      cm.state.suppressEdits = false;
    }
    return done;
  }
  function lookupKeyForEditor(cm, name, handle) {
    for (var i = 0; i < cm.state.keyMaps.length; i++) {
      var result = lookupKey(name, cm.state.keyMaps[i], handle, cm);
      if (result) {
        return result;
      }
    }
    return cm.options.extraKeys && lookupKey(name, cm.options.extraKeys, handle, cm) || lookupKey(name, cm.options.keyMap, handle, cm);
  }
  var stopSeq = new Delayed();
  function dispatchKey(cm, name, e, handle) {
    var seq = cm.state.keySeq;
    if (seq) {
      if (isModifierKey(name)) {
        return "handled";
      }
      if (/\'$/.test(name)) {
        cm.state.keySeq = null;
      } else {
        stopSeq.set(50, function () {
          if (cm.state.keySeq == seq) {
            cm.state.keySeq = null;
            cm.display.input.reset();
          }
        });
      }
      if (dispatchKeyInner(cm, seq + " " + name, e, handle)) {
        return true;
      }
    }
    return dispatchKeyInner(cm, name, e, handle);
  }
  function dispatchKeyInner(cm, name, e, handle) {
    var result = lookupKeyForEditor(cm, name, handle);
    if (result == "multi") {
      cm.state.keySeq = name;
    }
    if (result == "handled") {
      signalLater(cm, "keyHandled", cm, name, e);
    }
    if (result == "handled" || result == "multi") {
      e_preventDefault(e);
      restartBlink(cm);
    }
    return !!result;
  }
  function handleKeyBinding(cm, e) {
    var name = keyName(e, true);
    if (!name) {
      return false;
    }
    if (e.shiftKey && !cm.state.keySeq) {
      return dispatchKey(cm, "Shift-" + name, e, function (b) {
        return doHandleBinding(cm, b, true);
      }) || dispatchKey(cm, name, e, function (b) {
        if (typeof b == "string" ? /^go[A-Z]/.test(b) : b.motion) {
          return doHandleBinding(cm, b);
        }
      });
    } else {
      return dispatchKey(cm, name, e, function (b) {
        return doHandleBinding(cm, b);
      });
    }
  }
  function handleCharBinding(cm, e, ch) {
    return dispatchKey(cm, "'" + ch + "'", e, function (b) {
      return doHandleBinding(cm, b, true);
    });
  }
  var lastStoppedKey = null;
  function onKeyDown(e) {
    var cm = this;
    cm.curOp.focus = activeElt();
    if (signalDOMEvent(cm, e)) {
      return;
    }
    if (ie && ie_version < 11 && e.keyCode == 27) {
      e.returnValue = false;
    }
    var code = e.keyCode;
    cm.display.shift = code == 16 || e.shiftKey;
    var handled = handleKeyBinding(cm, e);
    if (presto) {
      lastStoppedKey = handled ? code : null;
      if (!handled && code == 88 && !hasCopyEvent && (mac ? e.metaKey : e.ctrlKey)) {
        cm.replaceSelection("", null, "cut");
      }
    }
    if (code == 18 && !/\bCodeMirror-crosshair\b/.test(cm.display.lineDiv.className)) {
      showCrossHair(cm);
    }
  }
  function showCrossHair(cm) {
    var lineDiv = cm.display.lineDiv;
    addClass(lineDiv, "CodeMirror-crosshair");
    function up(e) {
      if (e.keyCode == 18 || !e.altKey) {
        rmClass(lineDiv, "CodeMirror-crosshair");
        off(document, "keyup", up);
        off(document, "mouseover", up);
      }
    }
    on(document, "keyup", up);
    on(document, "mouseover", up);
  }
  function onKeyUp(e) {
    if (e.keyCode == 16) {
      this.doc.sel.shift = false;
    }
    signalDOMEvent(this, e);
  }
  function onKeyPress(e) {
    var cm = this;
    if (eventInWidget(cm.display, e) || signalDOMEvent(cm, e) || e.ctrlKey && !e.altKey || mac && e.metaKey) {
      return;
    }
    var keyCode = e.keyCode,
      charCode = e.charCode;
    if (presto && keyCode == lastStoppedKey) {
      lastStoppedKey = null;
      e_preventDefault(e);
      return;
    }
    if (presto && (!e.which || e.which < 10) && handleKeyBinding(cm, e)) {
      return;
    }
    var ch = String.fromCharCode(charCode == null ? keyCode : charCode);
    if (ch == "\b") {
      return;
    }
    if (handleCharBinding(cm, e, ch)) {
      return;
    }
    cm.display.input.onKeyPress(e);
  }
  var DOUBLECLICK_DELAY = 400;
  var PastClick = function (time, pos, button) {
    this.time = time;
    this.pos = pos;
    this.button = button;
  };
  PastClick.prototype.compare = function (time, pos, button) {
    return this.time + DOUBLECLICK_DELAY > time && cmp(pos, this.pos) == 0 && button == this.button;
  };
  var lastClick, lastDoubleClick;
  function clickRepeat(pos, button) {
    var now = +new Date();
    if (lastDoubleClick && lastDoubleClick.compare(now, pos, button)) {
      lastClick = lastDoubleClick = null;
      return "triple";
    } else if (lastClick && lastClick.compare(now, pos, button)) {
      lastDoubleClick = new PastClick(now, pos, button);
      lastClick = null;
      return "double";
    } else {
      lastClick = new PastClick(now, pos, button);
      lastDoubleClick = null;
      return "single";
    }
  }
  function onMouseDown(e) {
    var cm = this,
      display = cm.display;
    if (signalDOMEvent(cm, e) || display.activeTouch && display.input.supportsTouch()) {
      return;
    }
    display.input.ensurePolled();
    display.shift = e.shiftKey;
    if (eventInWidget(display, e)) {
      if (!webkit) {
        display.scroller.draggable = false;
        setTimeout(function () {
          return display.scroller.draggable = true;
        }, 100);
      }
      return;
    }
    if (clickInGutter(cm, e)) {
      return;
    }
    var pos = posFromMouse(cm, e),
      button = e_button(e),
      repeat = pos ? clickRepeat(pos, button) : "single";
    window.focus();
    if (button == 1 && cm.state.selectingText) {
      cm.state.selectingText(e);
    }
    if (pos && handleMappedButton(cm, button, pos, repeat, e)) {
      return;
    }
    if (button == 1) {
      if (pos) {
        leftButtonDown(cm, pos, repeat, e);
      } else if (e_target(e) == display.scroller) {
        e_preventDefault(e);
      }
    } else if (button == 2) {
      if (pos) {
        extendSelection(cm.doc, pos);
      }
      setTimeout(function () {
        return display.input.focus();
      }, 20);
    } else if (button == 3) {
      if (captureRightClick) {
        cm.display.input.onContextMenu(e);
      } else {
        delayBlurEvent(cm);
      }
    }
  }
  function handleMappedButton(cm, button, pos, repeat, event) {
    var name = "Click";
    if (repeat == "double") {
      name = "Double" + name;
    } else if (repeat == "triple") {
      name = "Triple" + name;
    }
    name = (button == 1 ? "Left" : button == 2 ? "Middle" : "Right") + name;
    return dispatchKey(cm, addModifierNames(name, event), event, function (bound) {
      if (typeof bound == "string") {
        bound = commands[bound];
      }
      if (!bound) {
        return false;
      }
      var done = false;
      try {
        if (cm.isReadOnly()) {
          cm.state.suppressEdits = true;
        }
        done = bound(cm, pos) != Pass;
      } finally {
        cm.state.suppressEdits = false;
      }
      return done;
    });
  }
  function configureMouse(cm, repeat, event) {
    var option = cm.getOption("configureMouse");
    var value = option ? option(cm, repeat, event) : {};
    if (value.unit == null) {
      var rect = chromeOS ? event.shiftKey && event.metaKey : event.altKey;
      value.unit = rect ? "rectangle" : repeat == "single" ? "char" : repeat == "double" ? "word" : "line";
    }
    if (value.extend == null || cm.doc.extend) {
      value.extend = cm.doc.extend || event.shiftKey;
    }
    if (value.addNew == null) {
      value.addNew = mac ? event.metaKey : event.ctrlKey;
    }
    if (value.moveOnDrag == null) {
      value.moveOnDrag = !(mac ? event.altKey : event.ctrlKey);
    }
    return value;
  }
  function leftButtonDown(cm, pos, repeat, event) {
    if (ie) {
      setTimeout(bind(ensureFocus, cm), 0);
    } else {
      cm.curOp.focus = activeElt();
    }
    var behavior = configureMouse(cm, repeat, event);
    var sel = cm.doc.sel,
      contained;
    if (cm.options.dragDrop && dragAndDrop && !cm.isReadOnly() && repeat == "single" && (contained = sel.contains(pos)) > -1 && (cmp((contained = sel.ranges[contained]).from(), pos) < 0 || pos.xRel > 0) && (cmp(contained.to(), pos) > 0 || pos.xRel < 0)) {
      leftButtonStartDrag(cm, event, pos, behavior);
    } else {
      leftButtonSelect(cm, event, pos, behavior);
    }
  }
  function leftButtonStartDrag(cm, event, pos, behavior) {
    var display = cm.display,
      moved = false;
    var dragEnd = operation(cm, function (e) {
      if (webkit) {
        display.scroller.draggable = false;
      }
      cm.state.draggingText = false;
      off(display.wrapper.ownerDocument, "mouseup", dragEnd);
      off(display.wrapper.ownerDocument, "mousemove", mouseMove);
      off(display.scroller, "dragstart", dragStart);
      off(display.scroller, "drop", dragEnd);
      if (!moved) {
        e_preventDefault(e);
        if (!behavior.addNew) {
          extendSelection(cm.doc, pos, null, null, behavior.extend);
        }
        if (webkit || ie && ie_version == 9) {
          setTimeout(function () {
            display.wrapper.ownerDocument.body.focus();
            display.input.focus();
          }, 20);
        } else {
          display.input.focus();
        }
      }
    });
    var mouseMove = function (e2) {
      moved = moved || Math.abs(event.clientX - e2.clientX) + Math.abs(event.clientY - e2.clientY) >= 10;
    };
    var dragStart = function () {
      return moved = true;
    };
    if (webkit) {
      display.scroller.draggable = true;
    }
    cm.state.draggingText = dragEnd;
    dragEnd.copy = !behavior.moveOnDrag;
    if (display.scroller.dragDrop) {
      display.scroller.dragDrop();
    }
    on(display.wrapper.ownerDocument, "mouseup", dragEnd);
    on(display.wrapper.ownerDocument, "mousemove", mouseMove);
    on(display.scroller, "dragstart", dragStart);
    on(display.scroller, "drop", dragEnd);
    delayBlurEvent(cm);
    setTimeout(function () {
      return display.input.focus();
    }, 20);
  }
  function rangeForUnit(cm, pos, unit) {
    if (unit == "char") {
      return new Range(pos, pos);
    }
    if (unit == "word") {
      return cm.findWordAt(pos);
    }
    if (unit == "line") {
      return new Range(Pos(pos.line, 0), clipPos(cm.doc, Pos(pos.line + 1, 0)));
    }
    var result = unit(cm, pos);
    return new Range(result.from, result.to);
  }
  function leftButtonSelect(cm, event, start, behavior) {
    var display = cm.display,
      doc = cm.doc;
    e_preventDefault(event);
    var ourRange,
      ourIndex,
      startSel = doc.sel,
      ranges = startSel.ranges;
    if (behavior.addNew && !behavior.extend) {
      ourIndex = doc.sel.contains(start);
      if (ourIndex > -1) {
        ourRange = ranges[ourIndex];
      } else {
        ourRange = new Range(start, start);
      }
    } else {
      ourRange = doc.sel.primary();
      ourIndex = doc.sel.primIndex;
    }
    if (behavior.unit == "rectangle") {
      if (!behavior.addNew) {
        ourRange = new Range(start, start);
      }
      start = posFromMouse(cm, event, true, true);
      ourIndex = -1;
    } else {
      var range$$1 = rangeForUnit(cm, start, behavior.unit);
      if (behavior.extend) {
        ourRange = extendRange(ourRange, range$$1.anchor, range$$1.head, behavior.extend);
      } else {
        ourRange = range$$1;
      }
    }
    if (!behavior.addNew) {
      ourIndex = 0;
      setSelection(doc, new Selection([ourRange], 0), sel_mouse);
      startSel = doc.sel;
    } else if (ourIndex == -1) {
      ourIndex = ranges.length;
      setSelection(doc, normalizeSelection(cm, ranges.concat([ourRange]), ourIndex), {
        scroll: false,
        origin: "*mouse"
      });
    } else if (ranges.length > 1 && ranges[ourIndex].empty() && behavior.unit == "char" && !behavior.extend) {
      setSelection(doc, normalizeSelection(cm, ranges.slice(0, ourIndex).concat(ranges.slice(ourIndex + 1)), 0), {
        scroll: false,
        origin: "*mouse"
      });
      startSel = doc.sel;
    } else {
      replaceOneSelection(doc, ourIndex, ourRange, sel_mouse);
    }
    var lastPos = start;
    function extendTo(pos) {
      if (cmp(lastPos, pos) == 0) {
        return;
      }
      lastPos = pos;
      if (behavior.unit == "rectangle") {
        var ranges = [],
          tabSize = cm.options.tabSize;
        var startCol = countColumn(getLine(doc, start.line).text, start.ch, tabSize);
        var posCol = countColumn(getLine(doc, pos.line).text, pos.ch, tabSize);
        var left = Math.min(startCol, posCol),
          right = Math.max(startCol, posCol);
        for (var line = Math.min(start.line, pos.line), end = Math.min(cm.lastLine(), Math.max(start.line, pos.line)); line <= end; line++) {
          var text = getLine(doc, line).text,
            leftPos = findColumn(text, left, tabSize);
          if (left == right) {
            ranges.push(new Range(Pos(line, leftPos), Pos(line, leftPos)));
          } else if (text.length > leftPos) {
            ranges.push(new Range(Pos(line, leftPos), Pos(line, findColumn(text, right, tabSize))));
          }
        }
        if (!ranges.length) {
          ranges.push(new Range(start, start));
        }
        setSelection(doc, normalizeSelection(cm, startSel.ranges.slice(0, ourIndex).concat(ranges), ourIndex), {
          origin: "*mouse",
          scroll: false
        });
        cm.scrollIntoView(pos);
      } else {
        var oldRange = ourRange;
        var range$$1 = rangeForUnit(cm, pos, behavior.unit);
        var anchor = oldRange.anchor,
          head;
        if (cmp(range$$1.anchor, anchor) > 0) {
          head = range$$1.head;
          anchor = minPos(oldRange.from(), range$$1.anchor);
        } else {
          head = range$$1.anchor;
          anchor = maxPos(oldRange.to(), range$$1.head);
        }
        var ranges$1 = startSel.ranges.slice(0);
        ranges$1[ourIndex] = bidiSimplify(cm, new Range(clipPos(doc, anchor), head));
        setSelection(doc, normalizeSelection(cm, ranges$1, ourIndex), sel_mouse);
      }
    }
    var editorSize = display.wrapper.getBoundingClientRect();
    var counter = 0;
    function extend(e) {
      var curCount = ++counter;
      var cur = posFromMouse(cm, e, true, behavior.unit == "rectangle");
      if (!cur) {
        return;
      }
      if (cmp(cur, lastPos) != 0) {
        cm.curOp.focus = activeElt();
        extendTo(cur);
        var visible = visibleLines(display, doc);
        if (cur.line >= visible.to || cur.line < visible.from) {
          setTimeout(operation(cm, function () {
            if (counter == curCount) {
              extend(e);
            }
          }), 150);
        }
      } else {
        var outside = e.clientY < editorSize.top ? -20 : e.clientY > editorSize.bottom ? 20 : 0;
        if (outside) {
          setTimeout(operation(cm, function () {
            if (counter != curCount) {
              return;
            }
            display.scroller.scrollTop += outside;
            extend(e);
          }), 50);
        }
      }
    }
    function done(e) {
      cm.state.selectingText = false;
      counter = Infinity;
      if (e) {
        e_preventDefault(e);
        display.input.focus();
      }
      off(display.wrapper.ownerDocument, "mousemove", move);
      off(display.wrapper.ownerDocument, "mouseup", up);
      doc.history.lastSelOrigin = null;
    }
    var move = operation(cm, function (e) {
      if (e.buttons === 0 || !e_button(e)) {
        done(e);
      } else {
        extend(e);
      }
    });
    var up = operation(cm, done);
    cm.state.selectingText = up;
    on(display.wrapper.ownerDocument, "mousemove", move);
    on(display.wrapper.ownerDocument, "mouseup", up);
  }
  function bidiSimplify(cm, range$$1) {
    var anchor = range$$1.anchor;
    var head = range$$1.head;
    var anchorLine = getLine(cm.doc, anchor.line);
    if (cmp(anchor, head) == 0 && anchor.sticky == head.sticky) {
      return range$$1;
    }
    var order = getOrder(anchorLine);
    if (!order) {
      return range$$1;
    }
    var index = getBidiPartAt(order, anchor.ch, anchor.sticky),
      part = order[index];
    if (part.from != anchor.ch && part.to != anchor.ch) {
      return range$$1;
    }
    var boundary = index + (part.from == anchor.ch == (part.level != 1) ? 0 : 1);
    if (boundary == 0 || boundary == order.length) {
      return range$$1;
    }
    var leftSide;
    if (head.line != anchor.line) {
      leftSide = (head.line - anchor.line) * (cm.doc.direction == "ltr" ? 1 : -1) > 0;
    } else {
      var headIndex = getBidiPartAt(order, head.ch, head.sticky);
      var dir = headIndex - index || (head.ch - anchor.ch) * (part.level == 1 ? -1 : 1);
      if (headIndex == boundary - 1 || headIndex == boundary) {
        leftSide = dir < 0;
      } else {
        leftSide = dir > 0;
      }
    }
    var usePart = order[boundary + (leftSide ? -1 : 0)];
    var from = leftSide == (usePart.level == 1);
    var ch = from ? usePart.from : usePart.to,
      sticky = from ? "after" : "before";
    return anchor.ch == ch && anchor.sticky == sticky ? range$$1 : new Range(new Pos(anchor.line, ch, sticky), head);
  }
  function gutterEvent(cm, e, type, prevent) {
    var mX, mY;
    if (e.touches) {
      mX = e.touches[0].clientX;
      mY = e.touches[0].clientY;
    } else {
      try {
        mX = e.clientX;
        mY = e.clientY;
      } catch (e) {
        return false;
      }
    }
    if (mX >= Math.floor(cm.display.gutters.getBoundingClientRect().right)) {
      return false;
    }
    if (prevent) {
      e_preventDefault(e);
    }
    var display = cm.display;
    var lineBox = display.lineDiv.getBoundingClientRect();
    if (mY > lineBox.bottom || !hasHandler(cm, type)) {
      return e_defaultPrevented(e);
    }
    mY -= lineBox.top - display.viewOffset;
    for (var i = 0; i < cm.display.gutterSpecs.length; ++i) {
      var g = display.gutters.childNodes[i];
      if (g && g.getBoundingClientRect().right >= mX) {
        var line = lineAtHeight(cm.doc, mY);
        var gutter = cm.display.gutterSpecs[i];
        signal(cm, type, cm, line, gutter.className, e);
        return e_defaultPrevented(e);
      }
    }
  }
  function clickInGutter(cm, e) {
    return gutterEvent(cm, e, "gutterClick", true);
  }
  function onContextMenu(cm, e) {
    if (eventInWidget(cm.display, e) || contextMenuInGutter(cm, e)) {
      return;
    }
    if (signalDOMEvent(cm, e, "contextmenu")) {
      return;
    }
    if (!captureRightClick) {
      cm.display.input.onContextMenu(e);
    }
  }
  function contextMenuInGutter(cm, e) {
    if (!hasHandler(cm, "gutterContextMenu")) {
      return false;
    }
    return gutterEvent(cm, e, "gutterContextMenu", false);
  }
  function themeChanged(cm) {
    cm.display.wrapper.className = cm.display.wrapper.className.replace(/\s*cm-s-\S+/g, "") + cm.options.theme.replace(/(^|\s)\s*/g, " cm-s-");
    clearCaches(cm);
  }
  var Init = {
    toString: function () {
      return "CodeMirror.Init";
    }
  };
  var defaults = {};
  var optionHandlers = {};
  function defineOptions(CodeMirror) {
    var optionHandlers = CodeMirror.optionHandlers;
    function option(name, deflt, handle, notOnInit) {
      CodeMirror.defaults[name] = deflt;
      if (handle) {
        optionHandlers[name] = notOnInit ? function (cm, val, old) {
          if (old != Init) {
            handle(cm, val, old);
          }
        } : handle;
      }
    }
    CodeMirror.defineOption = option;
    CodeMirror.Init = Init;
    option("value", "", function (cm, val) {
      return cm.setValue(val);
    }, true);
    option("mode", null, function (cm, val) {
      cm.doc.modeOption = val;
      loadMode(cm);
    }, true);
    option("indentUnit", 2, loadMode, true);
    option("indentWithTabs", false);
    option("smartIndent", true);
    option("tabSize", 4, function (cm) {
      resetModeState(cm);
      clearCaches(cm);
      regChange(cm);
    }, true);
    option("lineSeparator", null, function (cm, val) {
      cm.doc.lineSep = val;
      if (!val) {
        return;
      }
      var newBreaks = [],
        lineNo = cm.doc.first;
      cm.doc.iter(function (line) {
        for (var pos = 0;;) {
          var found = line.text.indexOf(val, pos);
          if (found == -1) {
            break;
          }
          pos = found + val.length;
          newBreaks.push(Pos(lineNo, found));
        }
        lineNo++;
      });
      for (var i = newBreaks.length - 1; i >= 0; i--) {
        replaceRange(cm.doc, val, newBreaks[i], Pos(newBreaks[i].line, newBreaks[i].ch + val.length));
      }
    });
    option("specialChars", /[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u200b-\u200f\u2028\u2029\ufeff\ufff9-\ufffc]/g, function (cm, val, old) {
      cm.state.specialChars = new RegExp(val.source + (val.test("\t") ? "" : "|\t"), "g");
      if (old != Init) {
        cm.refresh();
      }
    });
    option("specialCharPlaceholder", defaultSpecialCharPlaceholder, function (cm) {
      return cm.refresh();
    }, true);
    option("electricChars", true);
    option("inputStyle", mobile ? "contenteditable" : "textarea", function () {
      throw new Error("inputStyle can not (yet) be changed in a running editor");
    }, true);
    option("spellcheck", false, function (cm, val) {
      return cm.getInputField().spellcheck = val;
    }, true);
    option("autocorrect", false, function (cm, val) {
      return cm.getInputField().autocorrect = val;
    }, true);
    option("autocapitalize", false, function (cm, val) {
      return cm.getInputField().autocapitalize = val;
    }, true);
    option("rtlMoveVisually", !windows);
    option("wholeLineUpdateBefore", true);
    option("theme", "default", function (cm) {
      themeChanged(cm);
      updateGutters(cm);
    }, true);
    option("keyMap", "default", function (cm, val, old) {
      var next = getKeyMap(val);
      var prev = old != Init && getKeyMap(old);
      if (prev && prev.detach) {
        prev.detach(cm, next);
      }
      if (next.attach) {
        next.attach(cm, prev || null);
      }
    });
    option("extraKeys", null);
    option("configureMouse", null);
    option("lineWrapping", false, wrappingChanged, true);
    option("gutters", [], function (cm, val) {
      cm.display.gutterSpecs = getGutters(val, cm.options.lineNumbers);
      updateGutters(cm);
    }, true);
    option("fixedGutter", true, function (cm, val) {
      cm.display.gutters.style.left = val ? compensateForHScroll(cm.display) + "px" : "0";
      cm.refresh();
    }, true);
    option("coverGutterNextToScrollbar", false, function (cm) {
      return updateScrollbars(cm);
    }, true);
    option("scrollbarStyle", "native", function (cm) {
      initScrollbars(cm);
      updateScrollbars(cm);
      cm.display.scrollbars.setScrollTop(cm.doc.scrollTop);
      cm.display.scrollbars.setScrollLeft(cm.doc.scrollLeft);
    }, true);
    option("lineNumbers", false, function (cm, val) {
      cm.display.gutterSpecs = getGutters(cm.options.gutters, val);
      updateGutters(cm);
    }, true);
    option("firstLineNumber", 1, updateGutters, true);
    option("lineNumberFormatter", function (integer) {
      return integer;
    }, updateGutters, true);
    option("showCursorWhenSelecting", false, updateSelection, true);
    option("resetSelectionOnContextMenu", true);
    option("lineWiseCopyCut", true);
    option("pasteLinesPerSelection", true);
    option("selectionsMayTouch", false);
    option("readOnly", false, function (cm, val) {
      if (val == "nocursor") {
        onBlur(cm);
        cm.display.input.blur();
      }
      cm.display.input.readOnlyChanged(val);
    });
    option("disableInput", false, function (cm, val) {
      if (!val) {
        cm.display.input.reset();
      }
    }, true);
    option("dragDrop", true, dragDropChanged);
    option("allowDropFileTypes", null);
    option("cursorBlinkRate", 530);
    option("cursorScrollMargin", 0);
    option("cursorHeight", 1, updateSelection, true);
    option("singleCursorHeightPerLine", true, updateSelection, true);
    option("workTime", 100);
    option("workDelay", 100);
    option("flattenSpans", true, resetModeState, true);
    option("addModeClass", false, resetModeState, true);
    option("pollInterval", 100);
    option("undoDepth", 200, function (cm, val) {
      return cm.doc.history.undoDepth = val;
    });
    option("historyEventDelay", 1250);
    option("viewportMargin", 10, function (cm) {
      return cm.refresh();
    }, true);
    option("maxHighlightLength", 1e4, resetModeState, true);
    option("moveInputWithCursor", true, function (cm, val) {
      if (!val) {
        cm.display.input.resetPosition();
      }
    });
    option("tabindex", null, function (cm, val) {
      return cm.display.input.getField().tabIndex = val || "";
    });
    option("autofocus", null);
    option("direction", "ltr", function (cm, val) {
      return cm.doc.setDirection(val);
    }, true);
    option("phrases", null);
  }
  function dragDropChanged(cm, value, old) {
    var wasOn = old && old != Init;
    if (!value != !wasOn) {
      var funcs = cm.display.dragFunctions;
      var toggle = value ? on : off;
      toggle(cm.display.scroller, "dragstart", funcs.start);
      toggle(cm.display.scroller, "dragenter", funcs.enter);
      toggle(cm.display.scroller, "dragover", funcs.over);
      toggle(cm.display.scroller, "dragleave", funcs.leave);
      toggle(cm.display.scroller, "drop", funcs.drop);
    }
  }
  function wrappingChanged(cm) {
    if (cm.options.lineWrapping) {
      addClass(cm.display.wrapper, "CodeMirror-wrap");
      cm.display.sizer.style.minWidth = "";
      cm.display.sizerWidth = null;
    } else {
      rmClass(cm.display.wrapper, "CodeMirror-wrap");
      findMaxLine(cm);
    }
    estimateLineHeights(cm);
    regChange(cm);
    clearCaches(cm);
    setTimeout(function () {
      return updateScrollbars(cm);
    }, 100);
  }
  function CodeMirror(place, options) {
    var this$1 = this;
    if (!(this instanceof CodeMirror)) {
      return new CodeMirror(place, options);
    }
    this.options = options = options ? copyObj(options) : {};
    copyObj(defaults, options, false);
    var doc = options.value;
    if (typeof doc == "string") {
      doc = new Doc(doc, options.mode, null, options.lineSeparator, options.direction);
    } else if (options.mode) {
      doc.modeOption = options.mode;
    }
    this.doc = doc;
    var input = new CodeMirror.inputStyles[options.inputStyle](this);
    var display = this.display = new Display(place, doc, input, options);
    display.wrapper.CodeMirror = this;
    themeChanged(this);
    if (options.lineWrapping) {
      this.display.wrapper.className += " CodeMirror-wrap";
    }
    initScrollbars(this);
    this.state = {
      keyMaps: [],
      overlays: [],
      modeGen: 0,
      overwrite: false,
      delayingBlurEvent: false,
      focused: false,
      suppressEdits: false,
      pasteIncoming: -1,
      cutIncoming: -1,
      selectingText: false,
      draggingText: false,
      highlight: new Delayed(),
      keySeq: null,
      specialChars: null
    };
    if (options.autofocus && !mobile) {
      display.input.focus();
    }
    if (ie && ie_version < 11) {
      setTimeout(function () {
        return this$1.display.input.reset(true);
      }, 20);
    }
    registerEventHandlers(this);
    ensureGlobalHandlers();
    startOperation(this);
    this.curOp.forceUpdate = true;
    attachDoc(this, doc);
    if (options.autofocus && !mobile || this.hasFocus()) {
      setTimeout(bind(onFocus, this), 20);
    } else {
      onBlur(this);
    }
    for (var opt in optionHandlers) {
      if (optionHandlers.hasOwnProperty(opt)) {
        optionHandlers[opt](this, options[opt], Init);
      }
    }
    maybeUpdateLineNumberWidth(this);
    if (options.finishInit) {
      options.finishInit(this);
    }
    for (var i = 0; i < initHooks.length; ++i) {
      initHooks[i](this);
    }
    endOperation(this);
    if (webkit && options.lineWrapping && getComputedStyle(display.lineDiv).textRendering == "optimizelegibility") {
      display.lineDiv.style.textRendering = "auto";
    }
  }
  CodeMirror.defaults = defaults;
  CodeMirror.optionHandlers = optionHandlers;
  function registerEventHandlers(cm) {
    var d = cm.display;
    on(d.scroller, "mousedown", operation(cm, onMouseDown));
    if (ie && ie_version < 11) {
      on(d.scroller, "dblclick", operation(cm, function (e) {
        if (signalDOMEvent(cm, e)) {
          return;
        }
        var pos = posFromMouse(cm, e);
        if (!pos || clickInGutter(cm, e) || eventInWidget(cm.display, e)) {
          return;
        }
        e_preventDefault(e);
        var word = cm.findWordAt(pos);
        extendSelection(cm.doc, word.anchor, word.head);
      }));
    } else {
      on(d.scroller, "dblclick", function (e) {
        return signalDOMEvent(cm, e) || e_preventDefault(e);
      });
    }
    on(d.scroller, "contextmenu", function (e) {
      return onContextMenu(cm, e);
    });
    var touchFinished,
      prevTouch = {
        end: 0
      };
    function finishTouch() {
      if (d.activeTouch) {
        touchFinished = setTimeout(function () {
          return d.activeTouch = null;
        }, 1e3);
        prevTouch = d.activeTouch;
        prevTouch.end = +new Date();
      }
    }
    function isMouseLikeTouchEvent(e) {
      if (e.touches.length != 1) {
        return false;
      }
      var touch = e.touches[0];
      return touch.radiusX <= 1 && touch.radiusY <= 1;
    }
    function farAway(touch, other) {
      if (other.left == null) {
        return true;
      }
      var dx = other.left - touch.left,
        dy = other.top - touch.top;
      return dx * dx + dy * dy > 20 * 20;
    }
    on(d.scroller, "touchstart", function (e) {
      if (!signalDOMEvent(cm, e) && !isMouseLikeTouchEvent(e) && !clickInGutter(cm, e)) {
        d.input.ensurePolled();
        clearTimeout(touchFinished);
        var now = +new Date();
        d.activeTouch = {
          start: now,
          moved: false,
          prev: now - prevTouch.end <= 300 ? prevTouch : null
        };
        if (e.touches.length == 1) {
          d.activeTouch.left = e.touches[0].pageX;
          d.activeTouch.top = e.touches[0].pageY;
        }
      }
    });
    on(d.scroller, "touchmove", function () {
      if (d.activeTouch) {
        d.activeTouch.moved = true;
      }
    });
    on(d.scroller, "touchend", function (e) {
      var touch = d.activeTouch;
      if (touch && !eventInWidget(d, e) && touch.left != null && !touch.moved && new Date() - touch.start < 300) {
        var pos = cm.coordsChar(d.activeTouch, "page"),
          range;
        if (!touch.prev || farAway(touch, touch.prev)) {
          range = new Range(pos, pos);
        } else if (!touch.prev.prev || farAway(touch, touch.prev.prev)) {
          range = cm.findWordAt(pos);
        } else {
          range = new Range(Pos(pos.line, 0), clipPos(cm.doc, Pos(pos.line + 1, 0)));
        }
        cm.setSelection(range.anchor, range.head);
        cm.focus();
        e_preventDefault(e);
      }
      finishTouch();
    });
    on(d.scroller, "touchcancel", finishTouch);
    on(d.scroller, "scroll", function () {
      if (d.scroller.clientHeight) {
        updateScrollTop(cm, d.scroller.scrollTop);
        setScrollLeft(cm, d.scroller.scrollLeft, true);
        signal(cm, "scroll", cm);
      }
    });
    on(d.scroller, "mousewheel", function (e) {
      return onScrollWheel(cm, e);
    });
    on(d.scroller, "DOMMouseScroll", function (e) {
      return onScrollWheel(cm, e);
    });
    on(d.wrapper, "scroll", function () {
      return d.wrapper.scrollTop = d.wrapper.scrollLeft = 0;
    });
    d.dragFunctions = {
      enter: function (e) {
        if (!signalDOMEvent(cm, e)) {
          e_stop(e);
        }
      },
      over: function (e) {
        if (!signalDOMEvent(cm, e)) {
          onDragOver(cm, e);
          e_stop(e);
        }
      },
      start: function (e) {
        return onDragStart(cm, e);
      },
      drop: operation(cm, onDrop),
      leave: function (e) {
        if (!signalDOMEvent(cm, e)) {
          clearDragCursor(cm);
        }
      }
    };
    var inp = d.input.getField();
    on(inp, "keyup", function (e) {
      return onKeyUp.call(cm, e);
    });
    on(inp, "keydown", operation(cm, onKeyDown));
    on(inp, "keypress", operation(cm, onKeyPress));
    on(inp, "focus", function (e) {
      return onFocus(cm, e);
    });
    on(inp, "blur", function (e) {
      return onBlur(cm, e);
    });
  }
  var initHooks = [];
  CodeMirror.defineInitHook = function (f) {
    return initHooks.push(f);
  };
  function indentLine(cm, n, how, aggressive) {
    var doc = cm.doc,
      state;
    if (how == null) {
      how = "add";
    }
    if (how == "smart") {
      if (!doc.mode.indent) {
        how = "prev";
      } else {
        state = getContextBefore(cm, n).state;
      }
    }
    var tabSize = cm.options.tabSize;
    var line = getLine(doc, n),
      curSpace = countColumn(line.text, null, tabSize);
    if (line.stateAfter) {
      line.stateAfter = null;
    }
    var curSpaceString = line.text.match(/^\s*/)[0],
      indentation;
    if (!aggressive && !/\S/.test(line.text)) {
      indentation = 0;
      how = "not";
    } else if (how == "smart") {
      indentation = doc.mode.indent(state, line.text.slice(curSpaceString.length), line.text);
      if (indentation == Pass || indentation > 150) {
        if (!aggressive) {
          return;
        }
        how = "prev";
      }
    }
    if (how == "prev") {
      if (n > doc.first) {
        indentation = countColumn(getLine(doc, n - 1).text, null, tabSize);
      } else {
        indentation = 0;
      }
    } else if (how == "add") {
      indentation = curSpace + cm.options.indentUnit;
    } else if (how == "subtract") {
      indentation = curSpace - cm.options.indentUnit;
    } else if (typeof how == "number") {
      indentation = curSpace + how;
    }
    indentation = Math.max(0, indentation);
    var indentString = "",
      pos = 0;
    if (cm.options.indentWithTabs) {
      for (var i = Math.floor(indentation / tabSize); i; --i) {
        pos += tabSize;
        indentString += "\t";
      }
    }
    if (pos < indentation) {
      indentString += spaceStr(indentation - pos);
    }
    if (indentString != curSpaceString) {
      replaceRange(doc, indentString, Pos(n, 0), Pos(n, curSpaceString.length), "+input");
      line.stateAfter = null;
      return true;
    } else {
      for (var i$1 = 0; i$1 < doc.sel.ranges.length; i$1++) {
        var range = doc.sel.ranges[i$1];
        if (range.head.line == n && range.head.ch < curSpaceString.length) {
          var pos$1 = Pos(n, curSpaceString.length);
          replaceOneSelection(doc, i$1, new Range(pos$1, pos$1));
          break;
        }
      }
    }
  }
  var lastCopied = null;
  function setLastCopied(newLastCopied) {
    lastCopied = newLastCopied;
  }
  function applyTextInput(cm, inserted, deleted, sel, origin) {
    var doc = cm.doc;
    cm.display.shift = false;
    if (!sel) {
      sel = doc.sel;
    }
    var recent = +new Date() - 200;
    var paste = origin == "paste" || cm.state.pasteIncoming > recent;
    var textLines = splitLinesAuto(inserted),
      multiPaste = null;
    if (paste && sel.ranges.length > 1) {
      if (lastCopied && lastCopied.text.join("\n") == inserted) {
        if (sel.ranges.length % lastCopied.text.length == 0) {
          multiPaste = [];
          for (var i = 0; i < lastCopied.text.length; i++) {
            multiPaste.push(doc.splitLines(lastCopied.text[i]));
          }
        }
      } else if (textLines.length == sel.ranges.length && cm.options.pasteLinesPerSelection) {
        multiPaste = map(textLines, function (l) {
          return [l];
        });
      }
    }
    var updateInput = cm.curOp.updateInput;
    for (var i$1 = sel.ranges.length - 1; i$1 >= 0; i$1--) {
      var range$$1 = sel.ranges[i$1];
      var from = range$$1.from(),
        to = range$$1.to();
      if (range$$1.empty()) {
        if (deleted && deleted > 0) {
          from = Pos(from.line, from.ch - deleted);
        } else if (cm.state.overwrite && !paste) {
          to = Pos(to.line, Math.min(getLine(doc, to.line).text.length, to.ch + lst(textLines).length));
        } else if (paste && lastCopied && lastCopied.lineWise && lastCopied.text.join("\n") == inserted) {
          from = to = Pos(from.line, 0);
        }
      }
      var changeEvent = {
        from: from,
        to: to,
        text: multiPaste ? multiPaste[i$1 % multiPaste.length] : textLines,
        origin: origin || (paste ? "paste" : cm.state.cutIncoming > recent ? "cut" : "+input")
      };
      makeChange(cm.doc, changeEvent);
      signalLater(cm, "inputRead", cm, changeEvent);
    }
    if (inserted && !paste) {
      triggerElectric(cm, inserted);
    }
    ensureCursorVisible(cm);
    if (cm.curOp.updateInput < 2) {
      cm.curOp.updateInput = updateInput;
    }
    cm.curOp.typing = true;
    cm.state.pasteIncoming = cm.state.cutIncoming = -1;
  }
  function handlePaste(e, cm) {
    var pasted = e.clipboardData && e.clipboardData.getData("Text");
    if (pasted) {
      e.preventDefault();
      if (!cm.isReadOnly() && !cm.options.disableInput) {
        runInOp(cm, function () {
          return applyTextInput(cm, pasted, 0, null, "paste");
        });
      }
      return true;
    }
  }
  function triggerElectric(cm, inserted) {
    if (!cm.options.electricChars || !cm.options.smartIndent) {
      return;
    }
    var sel = cm.doc.sel;
    for (var i = sel.ranges.length - 1; i >= 0; i--) {
      var range$$1 = sel.ranges[i];
      if (range$$1.head.ch > 100 || i && sel.ranges[i - 1].head.line == range$$1.head.line) {
        continue;
      }
      var mode = cm.getModeAt(range$$1.head);
      var indented = false;
      if (mode.electricChars) {
        for (var j = 0; j < mode.electricChars.length; j++) {
          if (inserted.indexOf(mode.electricChars.charAt(j)) > -1) {
            indented = indentLine(cm, range$$1.head.line, "smart");
            break;
          }
        }
      } else if (mode.electricInput) {
        if (mode.electricInput.test(getLine(cm.doc, range$$1.head.line).text.slice(0, range$$1.head.ch))) {
          indented = indentLine(cm, range$$1.head.line, "smart");
        }
      }
      if (indented) {
        signalLater(cm, "electricInput", cm, range$$1.head.line);
      }
    }
  }
  function copyableRanges(cm) {
    var text = [],
      ranges = [];
    for (var i = 0; i < cm.doc.sel.ranges.length; i++) {
      var line = cm.doc.sel.ranges[i].head.line;
      var lineRange = {
        anchor: Pos(line, 0),
        head: Pos(line + 1, 0)
      };
      ranges.push(lineRange);
      text.push(cm.getRange(lineRange.anchor, lineRange.head));
    }
    return {
      text: text,
      ranges: ranges
    };
  }
  function disableBrowserMagic(field, spellcheck, autocorrect, autocapitalize) {
    field.setAttribute("autocorrect", autocorrect ? "" : "off");
    field.setAttribute("autocapitalize", autocapitalize ? "" : "off");
    field.setAttribute("spellcheck", !!spellcheck);
  }
  function hiddenTextarea() {
    var te = elt("textarea", null, null, "position: absolute; bottom: -1em; padding: 0; width: 1px; height: 1em; outline: none");
    var div = elt("div", [te], null, "overflow: hidden; position: relative; width: 3px; height: 0px;");
    if (webkit) {
      te.style.width = "1000px";
    } else {
      te.setAttribute("wrap", "off");
    }
    if (ios) {
      te.style.border = "1px solid black";
    }
    disableBrowserMagic(te);
    return div;
  }
  function addEditorMethods(CodeMirror) {
    var optionHandlers = CodeMirror.optionHandlers;
    var helpers = CodeMirror.helpers = {};
    CodeMirror.prototype = {
      constructor: CodeMirror,
      focus: function () {
        window.focus();
        this.display.input.focus();
      },
      setOption: function (option, value) {
        var options = this.options,
          old = options[option];
        if (options[option] == value && option != "mode") {
          return;
        }
        options[option] = value;
        if (optionHandlers.hasOwnProperty(option)) {
          operation(this, optionHandlers[option])(this, value, old);
        }
        signal(this, "optionChange", this, option);
      },
      getOption: function (option) {
        return this.options[option];
      },
      getDoc: function () {
        return this.doc;
      },
      addKeyMap: function (map$$1, bottom) {
        this.state.keyMaps[bottom ? "push" : "unshift"](getKeyMap(map$$1));
      },
      removeKeyMap: function (map$$1) {
        var maps = this.state.keyMaps;
        for (var i = 0; i < maps.length; ++i) {
          if (maps[i] == map$$1 || maps[i].name == map$$1) {
            maps.splice(i, 1);
            return true;
          }
        }
      },
      addOverlay: methodOp(function (spec, options) {
        var mode = spec.token ? spec : CodeMirror.getMode(this.options, spec);
        if (mode.startState) {
          throw new Error("Overlays may not be stateful.");
        }
        insertSorted(this.state.overlays, {
          mode: mode,
          modeSpec: spec,
          opaque: options && options.opaque,
          priority: options && options.priority || 0
        }, function (overlay) {
          return overlay.priority;
        });
        this.state.modeGen++;
        regChange(this);
      }),
      removeOverlay: methodOp(function (spec) {
        var overlays = this.state.overlays;
        for (var i = 0; i < overlays.length; ++i) {
          var cur = overlays[i].modeSpec;
          if (cur == spec || typeof spec == "string" && cur.name == spec) {
            overlays.splice(i, 1);
            this.state.modeGen++;
            regChange(this);
            return;
          }
        }
      }),
      indentLine: methodOp(function (n, dir, aggressive) {
        if (typeof dir != "string" && typeof dir != "number") {
          if (dir == null) {
            dir = this.options.smartIndent ? "smart" : "prev";
          } else {
            dir = dir ? "add" : "subtract";
          }
        }
        if (isLine(this.doc, n)) {
          indentLine(this, n, dir, aggressive);
        }
      }),
      indentSelection: methodOp(function (how) {
        var ranges = this.doc.sel.ranges,
          end = -1;
        for (var i = 0; i < ranges.length; i++) {
          var range$$1 = ranges[i];
          if (!range$$1.empty()) {
            var from = range$$1.from(),
              to = range$$1.to();
            var start = Math.max(end, from.line);
            end = Math.min(this.lastLine(), to.line - (to.ch ? 0 : 1)) + 1;
            for (var j = start; j < end; ++j) {
              indentLine(this, j, how);
            }
            var newRanges = this.doc.sel.ranges;
            if (from.ch == 0 && ranges.length == newRanges.length && newRanges[i].from().ch > 0) {
              replaceOneSelection(this.doc, i, new Range(from, newRanges[i].to()), sel_dontScroll);
            }
          } else if (range$$1.head.line > end) {
            indentLine(this, range$$1.head.line, how, true);
            end = range$$1.head.line;
            if (i == this.doc.sel.primIndex) {
              ensureCursorVisible(this);
            }
          }
        }
      }),
      getTokenAt: function (pos, precise) {
        return takeToken(this, pos, precise);
      },
      getLineTokens: function (line, precise) {
        return takeToken(this, Pos(line), precise, true);
      },
      getTokenTypeAt: function (pos) {
        pos = clipPos(this.doc, pos);
        var styles = getLineStyles(this, getLine(this.doc, pos.line));
        var before = 0,
          after = (styles.length - 1) / 2,
          ch = pos.ch;
        var type;
        if (ch == 0) {
          type = styles[2];
        } else {
          for (;;) {
            var mid = before + after >> 1;
            if ((mid ? styles[mid * 2 - 1] : 0) >= ch) {
              after = mid;
            } else if (styles[mid * 2 + 1] < ch) {
              before = mid + 1;
            } else {
              type = styles[mid * 2 + 2];
              break;
            }
          }
        }
        var cut = type ? type.indexOf("overlay ") : -1;
        return cut < 0 ? type : cut == 0 ? null : type.slice(0, cut - 1);
      },
      getModeAt: function (pos) {
        var mode = this.doc.mode;
        if (!mode.innerMode) {
          return mode;
        }
        return CodeMirror.innerMode(mode, this.getTokenAt(pos).state).mode;
      },
      getHelper: function (pos, type) {
        return this.getHelpers(pos, type)[0];
      },
      getHelpers: function (pos, type) {
        var found = [];
        if (!helpers.hasOwnProperty(type)) {
          return found;
        }
        var help = helpers[type],
          mode = this.getModeAt(pos);
        if (typeof mode[type] == "string") {
          if (help[mode[type]]) {
            found.push(help[mode[type]]);
          }
        } else if (mode[type]) {
          for (var i = 0; i < mode[type].length; i++) {
            var val = help[mode[type][i]];
            if (val) {
              found.push(val);
            }
          }
        } else if (mode.helperType && help[mode.helperType]) {
          found.push(help[mode.helperType]);
        } else if (help[mode.name]) {
          found.push(help[mode.name]);
        }
        for (var i$1 = 0; i$1 < help._global.length; i$1++) {
          var cur = help._global[i$1];
          if (cur.pred(mode, this) && indexOf(found, cur.val) == -1) {
            found.push(cur.val);
          }
        }
        return found;
      },
      getStateAfter: function (line, precise) {
        var doc = this.doc;
        line = clipLine(doc, line == null ? doc.first + doc.size - 1 : line);
        return getContextBefore(this, line + 1, precise).state;
      },
      cursorCoords: function (start, mode) {
        var pos,
          range$$1 = this.doc.sel.primary();
        if (start == null) {
          pos = range$$1.head;
        } else if (typeof start == "object") {
          pos = clipPos(this.doc, start);
        } else {
          pos = start ? range$$1.from() : range$$1.to();
        }
        return cursorCoords(this, pos, mode || "page");
      },
      charCoords: function (pos, mode) {
        return charCoords(this, clipPos(this.doc, pos), mode || "page");
      },
      coordsChar: function (coords, mode) {
        coords = fromCoordSystem(this, coords, mode || "page");
        return coordsChar(this, coords.left, coords.top);
      },
      lineAtHeight: function (height, mode) {
        height = fromCoordSystem(this, {
          top: height,
          left: 0
        }, mode || "page").top;
        return lineAtHeight(this.doc, height + this.display.viewOffset);
      },
      heightAtLine: function (line, mode, includeWidgets) {
        var end = false,
          lineObj;
        if (typeof line == "number") {
          var last = this.doc.first + this.doc.size - 1;
          if (line < this.doc.first) {
            line = this.doc.first;
          } else if (line > last) {
            line = last;
            end = true;
          }
          lineObj = getLine(this.doc, line);
        } else {
          lineObj = line;
        }
        return intoCoordSystem(this, lineObj, {
          top: 0,
          left: 0
        }, mode || "page", includeWidgets || end).top + (end ? this.doc.height - heightAtLine(lineObj) : 0);
      },
      defaultTextHeight: function () {
        return textHeight(this.display);
      },
      defaultCharWidth: function () {
        return charWidth(this.display);
      },
      getViewport: function () {
        return {
          from: this.display.viewFrom,
          to: this.display.viewTo
        };
      },
      addWidget: function (pos, node, scroll, vert, horiz) {
        var display = this.display;
        pos = cursorCoords(this, clipPos(this.doc, pos));
        var top = pos.bottom,
          left = pos.left;
        node.style.position = "absolute";
        node.setAttribute("cm-ignore-events", "true");
        this.display.input.setUneditable(node);
        display.sizer.appendChild(node);
        if (vert == "over") {
          top = pos.top;
        } else if (vert == "above" || vert == "near") {
          var vspace = Math.max(display.wrapper.clientHeight, this.doc.height),
            hspace = Math.max(display.sizer.clientWidth, display.lineSpace.clientWidth);
          if ((vert == "above" || pos.bottom + node.offsetHeight > vspace) && pos.top > node.offsetHeight) {
            top = pos.top - node.offsetHeight;
          } else if (pos.bottom + node.offsetHeight <= vspace) {
            top = pos.bottom;
          }
          if (left + node.offsetWidth > hspace) {
            left = hspace - node.offsetWidth;
          }
        }
        node.style.top = top + "px";
        node.style.left = node.style.right = "";
        if (horiz == "right") {
          left = display.sizer.clientWidth - node.offsetWidth;
          node.style.right = "0px";
        } else {
          if (horiz == "left") {
            left = 0;
          } else if (horiz == "middle") {
            left = (display.sizer.clientWidth - node.offsetWidth) / 2;
          }
          node.style.left = left + "px";
        }
        if (scroll) {
          scrollIntoView(this, {
            left: left,
            top: top,
            right: left + node.offsetWidth,
            bottom: top + node.offsetHeight
          });
        }
      },
      triggerOnKeyDown: methodOp(onKeyDown),
      triggerOnKeyPress: methodOp(onKeyPress),
      triggerOnKeyUp: onKeyUp,
      triggerOnMouseDown: methodOp(onMouseDown),
      execCommand: function (cmd) {
        if (commands.hasOwnProperty(cmd)) {
          return commands[cmd].call(null, this);
        }
      },
      triggerElectric: methodOp(function (text) {
        triggerElectric(this, text);
      }),
      findPosH: function (from, amount, unit, visually) {
        var dir = 1;
        if (amount < 0) {
          dir = -1;
          amount = -amount;
        }
        var cur = clipPos(this.doc, from);
        for (var i = 0; i < amount; ++i) {
          cur = findPosH(this.doc, cur, dir, unit, visually);
          if (cur.hitSide) {
            break;
          }
        }
        return cur;
      },
      moveH: methodOp(function (dir, unit) {
        var this$1 = this;
        this.extendSelectionsBy(function (range$$1) {
          if (this$1.display.shift || this$1.doc.extend || range$$1.empty()) {
            return findPosH(this$1.doc, range$$1.head, dir, unit, this$1.options.rtlMoveVisually);
          } else {
            return dir < 0 ? range$$1.from() : range$$1.to();
          }
        }, sel_move);
      }),
      deleteH: methodOp(function (dir, unit) {
        var sel = this.doc.sel,
          doc = this.doc;
        if (sel.somethingSelected()) {
          doc.replaceSelection("", null, "+delete");
        } else {
          deleteNearSelection(this, function (range$$1) {
            var other = findPosH(doc, range$$1.head, dir, unit, false);
            return dir < 0 ? {
              from: other,
              to: range$$1.head
            } : {
              from: range$$1.head,
              to: other
            };
          });
        }
      }),
      findPosV: function (from, amount, unit, goalColumn) {
        var dir = 1,
          x = goalColumn;
        if (amount < 0) {
          dir = -1;
          amount = -amount;
        }
        var cur = clipPos(this.doc, from);
        for (var i = 0; i < amount; ++i) {
          var coords = cursorCoords(this, cur, "div");
          if (x == null) {
            x = coords.left;
          } else {
            coords.left = x;
          }
          cur = findPosV(this, coords, dir, unit);
          if (cur.hitSide) {
            break;
          }
        }
        return cur;
      },
      moveV: methodOp(function (dir, unit) {
        var this$1 = this;
        var doc = this.doc,
          goals = [];
        var collapse = !this.display.shift && !doc.extend && doc.sel.somethingSelected();
        doc.extendSelectionsBy(function (range$$1) {
          if (collapse) {
            return dir < 0 ? range$$1.from() : range$$1.to();
          }
          var headPos = cursorCoords(this$1, range$$1.head, "div");
          if (range$$1.goalColumn != null) {
            headPos.left = range$$1.goalColumn;
          }
          goals.push(headPos.left);
          var pos = findPosV(this$1, headPos, dir, unit);
          if (unit == "page" && range$$1 == doc.sel.primary()) {
            addToScrollTop(this$1, charCoords(this$1, pos, "div").top - headPos.top);
          }
          return pos;
        }, sel_move);
        if (goals.length) {
          for (var i = 0; i < doc.sel.ranges.length; i++) {
            doc.sel.ranges[i].goalColumn = goals[i];
          }
        }
      }),
      findWordAt: function (pos) {
        var doc = this.doc,
          line = getLine(doc, pos.line).text;
        var start = pos.ch,
          end = pos.ch;
        if (line) {
          var helper = this.getHelper(pos, "wordChars");
          if ((pos.sticky == "before" || end == line.length) && start) {
            --start;
          } else {
            ++end;
          }
          var startChar = line.charAt(start);
          var check = isWordChar(startChar, helper) ? function (ch) {
            return isWordChar(ch, helper);
          } : /\s/.test(startChar) ? function (ch) {
            return /\s/.test(ch);
          } : function (ch) {
            return !/\s/.test(ch) && !isWordChar(ch);
          };
          while (start > 0 && check(line.charAt(start - 1))) {
            --start;
          }
          while (end < line.length && check(line.charAt(end))) {
            ++end;
          }
        }
        return new Range(Pos(pos.line, start), Pos(pos.line, end));
      },
      toggleOverwrite: function (value) {
        if (value != null && value == this.state.overwrite) {
          return;
        }
        if (this.state.overwrite = !this.state.overwrite) {
          addClass(this.display.cursorDiv, "CodeMirror-overwrite");
        } else {
          rmClass(this.display.cursorDiv, "CodeMirror-overwrite");
        }
        signal(this, "overwriteToggle", this, this.state.overwrite);
      },
      hasFocus: function () {
        return this.display.input.getField() == activeElt();
      },
      isReadOnly: function () {
        return !!(this.options.readOnly || this.doc.cantEdit);
      },
      scrollTo: methodOp(function (x, y) {
        scrollToCoords(this, x, y);
      }),
      getScrollInfo: function () {
        var scroller = this.display.scroller;
        return {
          left: scroller.scrollLeft,
          top: scroller.scrollTop,
          height: scroller.scrollHeight - scrollGap(this) - this.display.barHeight,
          width: scroller.scrollWidth - scrollGap(this) - this.display.barWidth,
          clientHeight: displayHeight(this),
          clientWidth: displayWidth(this)
        };
      },
      scrollIntoView: methodOp(function (range$$1, margin) {
        if (range$$1 == null) {
          range$$1 = {
            from: this.doc.sel.primary().head,
            to: null
          };
          if (margin == null) {
            margin = this.options.cursorScrollMargin;
          }
        } else if (typeof range$$1 == "number") {
          range$$1 = {
            from: Pos(range$$1, 0),
            to: null
          };
        } else if (range$$1.from == null) {
          range$$1 = {
            from: range$$1,
            to: null
          };
        }
        if (!range$$1.to) {
          range$$1.to = range$$1.from;
        }
        range$$1.margin = margin || 0;
        if (range$$1.from.line != null) {
          scrollToRange(this, range$$1);
        } else {
          scrollToCoordsRange(this, range$$1.from, range$$1.to, range$$1.margin);
        }
      }),
      setSize: methodOp(function (width, height) {
        var this$1 = this;
        var interpret = function (val) {
          return typeof val == "number" || /^\d+$/.test(String(val)) ? val + "px" : val;
        };
        if (width != null) {
          this.display.wrapper.style.width = interpret(width);
        }
        if (height != null) {
          this.display.wrapper.style.height = interpret(height);
        }
        if (this.options.lineWrapping) {
          clearLineMeasurementCache(this);
        }
        var lineNo$$1 = this.display.viewFrom;
        this.doc.iter(lineNo$$1, this.display.viewTo, function (line) {
          if (line.widgets) {
            for (var i = 0; i < line.widgets.length; i++) {
              if (line.widgets[i].noHScroll) {
                regLineChange(this$1, lineNo$$1, "widget");
                break;
              }
            }
          }
          ++lineNo$$1;
        });
        this.curOp.forceUpdate = true;
        signal(this, "refresh", this);
      }),
      operation: function (f) {
        return runInOp(this, f);
      },
      startOperation: function () {
        return startOperation(this);
      },
      endOperation: function () {
        return endOperation(this);
      },
      refresh: methodOp(function () {
        var oldHeight = this.display.cachedTextHeight;
        regChange(this);
        this.curOp.forceUpdate = true;
        clearCaches(this);
        scrollToCoords(this, this.doc.scrollLeft, this.doc.scrollTop);
        updateGutterSpace(this.display);
        if (oldHeight == null || Math.abs(oldHeight - textHeight(this.display)) > .5) {
          estimateLineHeights(this);
        }
        signal(this, "refresh", this);
      }),
      swapDoc: methodOp(function (doc) {
        var old = this.doc;
        old.cm = null;
        if (this.state.selectingText) {
          this.state.selectingText();
        }
        attachDoc(this, doc);
        clearCaches(this);
        this.display.input.reset();
        scrollToCoords(this, doc.scrollLeft, doc.scrollTop);
        this.curOp.forceScroll = true;
        signalLater(this, "swapDoc", this, old);
        return old;
      }),
      phrase: function (phraseText) {
        var phrases = this.options.phrases;
        return phrases && Object.prototype.hasOwnProperty.call(phrases, phraseText) ? phrases[phraseText] : phraseText;
      },
      getInputField: function () {
        return this.display.input.getField();
      },
      getWrapperElement: function () {
        return this.display.wrapper;
      },
      getScrollerElement: function () {
        return this.display.scroller;
      },
      getGutterElement: function () {
        return this.display.gutters;
      }
    };
    eventMixin(CodeMirror);
    CodeMirror.registerHelper = function (type, name, value) {
      if (!helpers.hasOwnProperty(type)) {
        helpers[type] = CodeMirror[type] = {
          _global: []
        };
      }
      helpers[type][name] = value;
    };
    CodeMirror.registerGlobalHelper = function (type, name, predicate, value) {
      CodeMirror.registerHelper(type, name, value);
      helpers[type]._global.push({
        pred: predicate,
        val: value
      });
    };
  }
  function findPosH(doc, pos, dir, unit, visually) {
    var oldPos = pos;
    var origDir = dir;
    var lineObj = getLine(doc, pos.line);
    function findNextLine() {
      var l = pos.line + dir;
      if (l < doc.first || l >= doc.first + doc.size) {
        return false;
      }
      pos = new Pos(l, pos.ch, pos.sticky);
      return lineObj = getLine(doc, l);
    }
    function moveOnce(boundToLine) {
      var next;
      if (visually) {
        next = moveVisually(doc.cm, lineObj, pos, dir);
      } else {
        next = moveLogically(lineObj, pos, dir);
      }
      if (next == null) {
        if (!boundToLine && findNextLine()) {
          pos = endOfLine(visually, doc.cm, lineObj, pos.line, dir);
        } else {
          return false;
        }
      } else {
        pos = next;
      }
      return true;
    }
    if (unit == "char") {
      moveOnce();
    } else if (unit == "column") {
      moveOnce(true);
    } else if (unit == "word" || unit == "group") {
      var sawType = null,
        group = unit == "group";
      var helper = doc.cm && doc.cm.getHelper(pos, "wordChars");
      for (var first = true;; first = false) {
        if (dir < 0 && !moveOnce(!first)) {
          break;
        }
        var cur = lineObj.text.charAt(pos.ch) || "\n";
        var type = isWordChar(cur, helper) ? "w" : group && cur == "\n" ? "n" : !group || /\s/.test(cur) ? null : "p";
        if (group && !first && !type) {
          type = "s";
        }
        if (sawType && sawType != type) {
          if (dir < 0) {
            dir = 1;
            moveOnce();
            pos.sticky = "after";
          }
          break;
        }
        if (type) {
          sawType = type;
        }
        if (dir > 0 && !moveOnce(!first)) {
          break;
        }
      }
    }
    var result = skipAtomic(doc, pos, oldPos, origDir, true);
    if (equalCursorPos(oldPos, result)) {
      result.hitSide = true;
    }
    return result;
  }
  function findPosV(cm, pos, dir, unit) {
    var doc = cm.doc,
      x = pos.left,
      y;
    if (unit == "page") {
      var pageSize = Math.min(cm.display.wrapper.clientHeight, window.innerHeight || document.documentElement.clientHeight);
      var moveAmount = Math.max(pageSize - .5 * textHeight(cm.display), 3);
      y = (dir > 0 ? pos.bottom : pos.top) + dir * moveAmount;
    } else if (unit == "line") {
      y = dir > 0 ? pos.bottom + 3 : pos.top - 3;
    }
    var target;
    for (;;) {
      target = coordsChar(cm, x, y);
      if (!target.outside) {
        break;
      }
      if (dir < 0 ? y <= 0 : y >= doc.height) {
        target.hitSide = true;
        break;
      }
      y += dir * 5;
    }
    return target;
  }
  var ContentEditableInput = function (cm) {
    this.cm = cm;
    this.lastAnchorNode = this.lastAnchorOffset = this.lastFocusNode = this.lastFocusOffset = null;
    this.polling = new Delayed();
    this.composing = null;
    this.gracePeriod = false;
    this.readDOMTimeout = null;
  };
  ContentEditableInput.prototype.init = function (display) {
    var this$1 = this;
    var input = this,
      cm = input.cm;
    var div = input.div = display.lineDiv;
    disableBrowserMagic(div, cm.options.spellcheck, cm.options.autocorrect, cm.options.autocapitalize);
    on(div, "paste", function (e) {
      if (signalDOMEvent(cm, e) || handlePaste(e, cm)) {
        return;
      }
      if (ie_version <= 11) {
        setTimeout(operation(cm, function () {
          return this$1.updateFromDOM();
        }), 20);
      }
    });
    on(div, "compositionstart", function (e) {
      this$1.composing = {
        data: e.data,
        done: false
      };
    });
    on(div, "compositionupdate", function (e) {
      if (!this$1.composing) {
        this$1.composing = {
          data: e.data,
          done: false
        };
      }
    });
    on(div, "compositionend", function (e) {
      if (this$1.composing) {
        if (e.data != this$1.composing.data) {
          this$1.readFromDOMSoon();
        }
        this$1.composing.done = true;
      }
    });
    on(div, "touchstart", function () {
      return input.forceCompositionEnd();
    });
    on(div, "input", function () {
      if (!this$1.composing) {
        this$1.readFromDOMSoon();
      }
    });
    function onCopyCut(e) {
      if (signalDOMEvent(cm, e)) {
        return;
      }
      if (cm.somethingSelected()) {
        setLastCopied({
          lineWise: false,
          text: cm.getSelections()
        });
        if (e.type == "cut") {
          cm.replaceSelection("", null, "cut");
        }
      } else if (!cm.options.lineWiseCopyCut) {
        return;
      } else {
        var ranges = copyableRanges(cm);
        setLastCopied({
          lineWise: true,
          text: ranges.text
        });
        if (e.type == "cut") {
          cm.operation(function () {
            cm.setSelections(ranges.ranges, 0, sel_dontScroll);
            cm.replaceSelection("", null, "cut");
          });
        }
      }
      if (e.clipboardData) {
        e.clipboardData.clearData();
        var content = lastCopied.text.join("\n");
        e.clipboardData.setData("Text", content);
        if (e.clipboardData.getData("Text") == content) {
          e.preventDefault();
          return;
        }
      }
      var kludge = hiddenTextarea(),
        te = kludge.firstChild;
      cm.display.lineSpace.insertBefore(kludge, cm.display.lineSpace.firstChild);
      te.value = lastCopied.text.join("\n");
      var hadFocus = document.activeElement;
      selectInput(te);
      setTimeout(function () {
        cm.display.lineSpace.removeChild(kludge);
        hadFocus.focus();
        if (hadFocus == div) {
          input.showPrimarySelection();
        }
      }, 50);
    }
    on(div, "copy", onCopyCut);
    on(div, "cut", onCopyCut);
  };
  ContentEditableInput.prototype.prepareSelection = function () {
    var result = prepareSelection(this.cm, false);
    result.focus = this.cm.state.focused;
    return result;
  };
  ContentEditableInput.prototype.showSelection = function (info, takeFocus) {
    if (!info || !this.cm.display.view.length) {
      return;
    }
    if (info.focus || takeFocus) {
      this.showPrimarySelection();
    }
    this.showMultipleSelections(info);
  };
  ContentEditableInput.prototype.getSelection = function () {
    return this.cm.display.wrapper.ownerDocument.getSelection();
  };
  ContentEditableInput.prototype.showPrimarySelection = function () {
    var sel = this.getSelection(),
      cm = this.cm,
      prim = cm.doc.sel.primary();
    var from = prim.from(),
      to = prim.to();
    if (cm.display.viewTo == cm.display.viewFrom || from.line >= cm.display.viewTo || to.line < cm.display.viewFrom) {
      sel.removeAllRanges();
      return;
    }
    var curAnchor = domToPos(cm, sel.anchorNode, sel.anchorOffset);
    var curFocus = domToPos(cm, sel.focusNode, sel.focusOffset);
    if (curAnchor && !curAnchor.bad && curFocus && !curFocus.bad && cmp(minPos(curAnchor, curFocus), from) == 0 && cmp(maxPos(curAnchor, curFocus), to) == 0) {
      return;
    }
    var view = cm.display.view;
    var start = from.line >= cm.display.viewFrom && posToDOM(cm, from) || {
      node: view[0].measure.map[2],
      offset: 0
    };
    var end = to.line < cm.display.viewTo && posToDOM(cm, to);
    if (!end) {
      var measure = view[view.length - 1].measure;
      var map$$1 = measure.maps ? measure.maps[measure.maps.length - 1] : measure.map;
      end = {
        node: map$$1[map$$1.length - 1],
        offset: map$$1[map$$1.length - 2] - map$$1[map$$1.length - 3]
      };
    }
    if (!start || !end) {
      sel.removeAllRanges();
      return;
    }
    var old = sel.rangeCount && sel.getRangeAt(0),
      rng;
    try {
      rng = range(start.node, start.offset, end.offset, end.node);
    } catch (e) {}
    if (rng) {
      if (!gecko && cm.state.focused) {
        sel.collapse(start.node, start.offset);
        if (!rng.collapsed) {
          sel.removeAllRanges();
          sel.addRange(rng);
        }
      } else {
        sel.removeAllRanges();
        sel.addRange(rng);
      }
      if (old && sel.anchorNode == null) {
        sel.addRange(old);
      } else if (gecko) {
        this.startGracePeriod();
      }
    }
    this.rememberSelection();
  };
  ContentEditableInput.prototype.startGracePeriod = function () {
    var this$1 = this;
    clearTimeout(this.gracePeriod);
    this.gracePeriod = setTimeout(function () {
      this$1.gracePeriod = false;
      if (this$1.selectionChanged()) {
        this$1.cm.operation(function () {
          return this$1.cm.curOp.selectionChanged = true;
        });
      }
    }, 20);
  };
  ContentEditableInput.prototype.showMultipleSelections = function (info) {
    removeChildrenAndAdd(this.cm.display.cursorDiv, info.cursors);
    removeChildrenAndAdd(this.cm.display.selectionDiv, info.selection);
  };
  ContentEditableInput.prototype.rememberSelection = function () {
    var sel = this.getSelection();
    this.lastAnchorNode = sel.anchorNode;
    this.lastAnchorOffset = sel.anchorOffset;
    this.lastFocusNode = sel.focusNode;
    this.lastFocusOffset = sel.focusOffset;
  };
  ContentEditableInput.prototype.selectionInEditor = function () {
    var sel = this.getSelection();
    if (!sel.rangeCount) {
      return false;
    }
    var node = sel.getRangeAt(0).commonAncestorContainer;
    return contains(this.div, node);
  };
  ContentEditableInput.prototype.focus = function () {
    if (this.cm.options.readOnly != "nocursor") {
      if (!this.selectionInEditor()) {
        this.showSelection(this.prepareSelection(), true);
      }
      this.div.focus();
    }
  };
  ContentEditableInput.prototype.blur = function () {
    this.div.blur();
  };
  ContentEditableInput.prototype.getField = function () {
    return this.div;
  };
  ContentEditableInput.prototype.supportsTouch = function () {
    return true;
  };
  ContentEditableInput.prototype.receivedFocus = function () {
    var input = this;
    if (this.selectionInEditor()) {
      this.pollSelection();
    } else {
      runInOp(this.cm, function () {
        return input.cm.curOp.selectionChanged = true;
      });
    }
    function poll() {
      if (input.cm.state.focused) {
        input.pollSelection();
        input.polling.set(input.cm.options.pollInterval, poll);
      }
    }
    this.polling.set(this.cm.options.pollInterval, poll);
  };
  ContentEditableInput.prototype.selectionChanged = function () {
    var sel = this.getSelection();
    return sel.anchorNode != this.lastAnchorNode || sel.anchorOffset != this.lastAnchorOffset || sel.focusNode != this.lastFocusNode || sel.focusOffset != this.lastFocusOffset;
  };
  ContentEditableInput.prototype.pollSelection = function () {
    if (this.readDOMTimeout != null || this.gracePeriod || !this.selectionChanged()) {
      return;
    }
    var sel = this.getSelection(),
      cm = this.cm;
    if (android && chrome && this.cm.display.gutterSpecs.length && isInGutter(sel.anchorNode)) {
      this.cm.triggerOnKeyDown({
        type: "keydown",
        keyCode: 8,
        preventDefault: Math.abs
      });
      this.blur();
      this.focus();
      return;
    }
    if (this.composing) {
      return;
    }
    this.rememberSelection();
    var anchor = domToPos(cm, sel.anchorNode, sel.anchorOffset);
    var head = domToPos(cm, sel.focusNode, sel.focusOffset);
    if (anchor && head) {
      runInOp(cm, function () {
        setSelection(cm.doc, simpleSelection(anchor, head), sel_dontScroll);
        if (anchor.bad || head.bad) {
          cm.curOp.selectionChanged = true;
        }
      });
    }
  };
  ContentEditableInput.prototype.pollContent = function () {
    if (this.readDOMTimeout != null) {
      clearTimeout(this.readDOMTimeout);
      this.readDOMTimeout = null;
    }
    var cm = this.cm,
      display = cm.display,
      sel = cm.doc.sel.primary();
    var from = sel.from(),
      to = sel.to();
    if (from.ch == 0 && from.line > cm.firstLine()) {
      from = Pos(from.line - 1, getLine(cm.doc, from.line - 1).length);
    }
    if (to.ch == getLine(cm.doc, to.line).text.length && to.line < cm.lastLine()) {
      to = Pos(to.line + 1, 0);
    }
    if (from.line < display.viewFrom || to.line > display.viewTo - 1) {
      return false;
    }
    var fromIndex, fromLine, fromNode;
    if (from.line == display.viewFrom || (fromIndex = findViewIndex(cm, from.line)) == 0) {
      fromLine = lineNo(display.view[0].line);
      fromNode = display.view[0].node;
    } else {
      fromLine = lineNo(display.view[fromIndex].line);
      fromNode = display.view[fromIndex - 1].node.nextSibling;
    }
    var toIndex = findViewIndex(cm, to.line);
    var toLine, toNode;
    if (toIndex == display.view.length - 1) {
      toLine = display.viewTo - 1;
      toNode = display.lineDiv.lastChild;
    } else {
      toLine = lineNo(display.view[toIndex + 1].line) - 1;
      toNode = display.view[toIndex + 1].node.previousSibling;
    }
    if (!fromNode) {
      return false;
    }
    var newText = cm.doc.splitLines(domTextBetween(cm, fromNode, toNode, fromLine, toLine));
    var oldText = getBetween(cm.doc, Pos(fromLine, 0), Pos(toLine, getLine(cm.doc, toLine).text.length));
    while (newText.length > 1 && oldText.length > 1) {
      if (lst(newText) == lst(oldText)) {
        newText.pop();
        oldText.pop();
        toLine--;
      } else if (newText[0] == oldText[0]) {
        newText.shift();
        oldText.shift();
        fromLine++;
      } else {
        break;
      }
    }
    var cutFront = 0,
      cutEnd = 0;
    var newTop = newText[0],
      oldTop = oldText[0],
      maxCutFront = Math.min(newTop.length, oldTop.length);
    while (cutFront < maxCutFront && newTop.charCodeAt(cutFront) == oldTop.charCodeAt(cutFront)) {
      ++cutFront;
    }
    var newBot = lst(newText),
      oldBot = lst(oldText);
    var maxCutEnd = Math.min(newBot.length - (newText.length == 1 ? cutFront : 0), oldBot.length - (oldText.length == 1 ? cutFront : 0));
    while (cutEnd < maxCutEnd && newBot.charCodeAt(newBot.length - cutEnd - 1) == oldBot.charCodeAt(oldBot.length - cutEnd - 1)) {
      ++cutEnd;
    }
    if (newText.length == 1 && oldText.length == 1 && fromLine == from.line) {
      while (cutFront && cutFront > from.ch && newBot.charCodeAt(newBot.length - cutEnd - 1) == oldBot.charCodeAt(oldBot.length - cutEnd - 1)) {
        cutFront--;
        cutEnd++;
      }
    }
    newText[newText.length - 1] = newBot.slice(0, newBot.length - cutEnd).replace(/^\u200b+/, "");
    newText[0] = newText[0].slice(cutFront).replace(/\u200b+$/, "");
    var chFrom = Pos(fromLine, cutFront);
    var chTo = Pos(toLine, oldText.length ? lst(oldText).length - cutEnd : 0);
    if (newText.length > 1 || newText[0] || cmp(chFrom, chTo)) {
      replaceRange(cm.doc, newText, chFrom, chTo, "+input");
      return true;
    }
  };
  ContentEditableInput.prototype.ensurePolled = function () {
    this.forceCompositionEnd();
  };
  ContentEditableInput.prototype.reset = function () {
    this.forceCompositionEnd();
  };
  ContentEditableInput.prototype.forceCompositionEnd = function () {
    if (!this.composing) {
      return;
    }
    clearTimeout(this.readDOMTimeout);
    this.composing = null;
    this.updateFromDOM();
    this.div.blur();
    this.div.focus();
  };
  ContentEditableInput.prototype.readFromDOMSoon = function () {
    var this$1 = this;
    if (this.readDOMTimeout != null) {
      return;
    }
    this.readDOMTimeout = setTimeout(function () {
      this$1.readDOMTimeout = null;
      if (this$1.composing) {
        if (this$1.composing.done) {
          this$1.composing = null;
        } else {
          return;
        }
      }
      this$1.updateFromDOM();
    }, 80);
  };
  ContentEditableInput.prototype.updateFromDOM = function () {
    var this$1 = this;
    if (this.cm.isReadOnly() || !this.pollContent()) {
      runInOp(this.cm, function () {
        return regChange(this$1.cm);
      });
    }
  };
  ContentEditableInput.prototype.setUneditable = function (node) {
    node.contentEditable = "false";
  };
  ContentEditableInput.prototype.onKeyPress = function (e) {
    if (e.charCode == 0 || this.composing) {
      return;
    }
    e.preventDefault();
    if (!this.cm.isReadOnly()) {
      operation(this.cm, applyTextInput)(this.cm, String.fromCharCode(e.charCode == null ? e.keyCode : e.charCode), 0);
    }
  };
  ContentEditableInput.prototype.readOnlyChanged = function (val) {
    this.div.contentEditable = String(val != "nocursor");
  };
  ContentEditableInput.prototype.onContextMenu = function () {};
  ContentEditableInput.prototype.resetPosition = function () {};
  ContentEditableInput.prototype.needsContentAttribute = true;
  function posToDOM(cm, pos) {
    var view = findViewForLine(cm, pos.line);
    if (!view || view.hidden) {
      return null;
    }
    var line = getLine(cm.doc, pos.line);
    var info = mapFromLineView(view, line, pos.line);
    var order = getOrder(line, cm.doc.direction),
      side = "left";
    if (order) {
      var partPos = getBidiPartAt(order, pos.ch);
      side = partPos % 2 ? "right" : "left";
    }
    var result = nodeAndOffsetInLineMap(info.map, pos.ch, side);
    result.offset = result.collapse == "right" ? result.end : result.start;
    return result;
  }
  function isInGutter(node) {
    for (var scan = node; scan; scan = scan.parentNode) {
      if (/CodeMirror-gutter-wrapper/.test(scan.className)) {
        return true;
      }
    }
    return false;
  }
  function badPos(pos, bad) {
    if (bad) {
      pos.bad = true;
    }
    return pos;
  }
  function domTextBetween(cm, from, to, fromLine, toLine) {
    var text = "",
      closing = false,
      lineSep = cm.doc.lineSeparator(),
      extraLinebreak = false;
    function recognizeMarker(id) {
      return function (marker) {
        return marker.id == id;
      };
    }
    function close() {
      if (closing) {
        text += lineSep;
        if (extraLinebreak) {
          text += lineSep;
        }
        closing = extraLinebreak = false;
      }
    }
    function addText(str) {
      if (str) {
        close();
        text += str;
      }
    }
    function walk(node) {
      if (node.nodeType == 1) {
        var cmText = node.getAttribute("cm-text");
        if (cmText) {
          addText(cmText);
          return;
        }
        var markerID = node.getAttribute("cm-marker"),
          range$$1;
        if (markerID) {
          var found = cm.findMarks(Pos(fromLine, 0), Pos(toLine + 1, 0), recognizeMarker(+markerID));
          if (found.length && (range$$1 = found[0].find(0))) {
            addText(getBetween(cm.doc, range$$1.from, range$$1.to).join(lineSep));
          }
          return;
        }
        if (node.getAttribute("contenteditable") == "false") {
          return;
        }
        var isBlock = /^(pre|div|p|li|table|br)$/i.test(node.nodeName);
        if (!/^br$/i.test(node.nodeName) && node.textContent.length == 0) {
          return;
        }
        if (isBlock) {
          close();
        }
        for (var i = 0; i < node.childNodes.length; i++) {
          walk(node.childNodes[i]);
        }
        if (/^(pre|p)$/i.test(node.nodeName)) {
          extraLinebreak = true;
        }
        if (isBlock) {
          closing = true;
        }
      } else if (node.nodeType == 3) {
        addText(node.nodeValue.replace(/\u200b/g, "").replace(/\u00a0/g, " "));
      }
    }
    for (;;) {
      walk(from);
      if (from == to) {
        break;
      }
      from = from.nextSibling;
      extraLinebreak = false;
    }
    return text;
  }
  function domToPos(cm, node, offset) {
    var lineNode;
    if (node == cm.display.lineDiv) {
      lineNode = cm.display.lineDiv.childNodes[offset];
      if (!lineNode) {
        return badPos(cm.clipPos(Pos(cm.display.viewTo - 1)), true);
      }
      node = null;
      offset = 0;
    } else {
      for (lineNode = node;; lineNode = lineNode.parentNode) {
        if (!lineNode || lineNode == cm.display.lineDiv) {
          return null;
        }
        if (lineNode.parentNode && lineNode.parentNode == cm.display.lineDiv) {
          break;
        }
      }
    }
    for (var i = 0; i < cm.display.view.length; i++) {
      var lineView = cm.display.view[i];
      if (lineView.node == lineNode) {
        return locateNodeInLineView(lineView, node, offset);
      }
    }
  }
  function locateNodeInLineView(lineView, node, offset) {
    var wrapper = lineView.text.firstChild,
      bad = false;
    if (!node || !contains(wrapper, node)) {
      return badPos(Pos(lineNo(lineView.line), 0), true);
    }
    if (node == wrapper) {
      bad = true;
      node = wrapper.childNodes[offset];
      offset = 0;
      if (!node) {
        var line = lineView.rest ? lst(lineView.rest) : lineView.line;
        return badPos(Pos(lineNo(line), line.text.length), bad);
      }
    }
    var textNode = node.nodeType == 3 ? node : null,
      topNode = node;
    if (!textNode && node.childNodes.length == 1 && node.firstChild.nodeType == 3) {
      textNode = node.firstChild;
      if (offset) {
        offset = textNode.nodeValue.length;
      }
    }
    while (topNode.parentNode != wrapper) {
      topNode = topNode.parentNode;
    }
    var measure = lineView.measure,
      maps = measure.maps;
    function find(textNode, topNode, offset) {
      for (var i = -1; i < (maps ? maps.length : 0); i++) {
        var map$$1 = i < 0 ? measure.map : maps[i];
        for (var j = 0; j < map$$1.length; j += 3) {
          var curNode = map$$1[j + 2];
          if (curNode == textNode || curNode == topNode) {
            var line = lineNo(i < 0 ? lineView.line : lineView.rest[i]);
            var ch = map$$1[j] + offset;
            if (offset < 0 || curNode != textNode) {
              ch = map$$1[j + (offset ? 1 : 0)];
            }
            return Pos(line, ch);
          }
        }
      }
    }
    var found = find(textNode, topNode, offset);
    if (found) {
      return badPos(found, bad);
    }
    for (var after = topNode.nextSibling, dist = textNode ? textNode.nodeValue.length - offset : 0; after; after = after.nextSibling) {
      found = find(after, after.firstChild, 0);
      if (found) {
        return badPos(Pos(found.line, found.ch - dist), bad);
      } else {
        dist += after.textContent.length;
      }
    }
    for (var before = topNode.previousSibling, dist$1 = offset; before; before = before.previousSibling) {
      found = find(before, before.firstChild, -1);
      if (found) {
        return badPos(Pos(found.line, found.ch + dist$1), bad);
      } else {
        dist$1 += before.textContent.length;
      }
    }
  }
  var TextareaInput = function (cm) {
    this.cm = cm;
    this.prevInput = "";
    this.pollingFast = false;
    this.polling = new Delayed();
    this.hasSelection = false;
    this.composing = null;
  };
  TextareaInput.prototype.init = function (display) {
    var this$1 = this;
    var input = this,
      cm = this.cm;
    this.createField(display);
    var te = this.textarea;
    display.wrapper.insertBefore(this.wrapper, display.wrapper.firstChild);
    if (ios) {
      te.style.width = "0px";
    }
    on(te, "input", function () {
      if (ie && ie_version >= 9 && this$1.hasSelection) {
        this$1.hasSelection = null;
      }
      input.poll();
    });
    on(te, "paste", function (e) {
      if (signalDOMEvent(cm, e) || handlePaste(e, cm)) {
        return;
      }
      cm.state.pasteIncoming = +new Date();
      input.fastPoll();
    });
    function prepareCopyCut(e) {
      if (signalDOMEvent(cm, e)) {
        return;
      }
      if (cm.somethingSelected()) {
        setLastCopied({
          lineWise: false,
          text: cm.getSelections()
        });
      } else if (!cm.options.lineWiseCopyCut) {
        return;
      } else {
        var ranges = copyableRanges(cm);
        setLastCopied({
          lineWise: true,
          text: ranges.text
        });
        if (e.type == "cut") {
          cm.setSelections(ranges.ranges, null, sel_dontScroll);
        } else {
          input.prevInput = "";
          te.value = ranges.text.join("\n");
          selectInput(te);
        }
      }
      if (e.type == "cut") {
        cm.state.cutIncoming = +new Date();
      }
    }
    on(te, "cut", prepareCopyCut);
    on(te, "copy", prepareCopyCut);
    on(display.scroller, "paste", function (e) {
      if (eventInWidget(display, e) || signalDOMEvent(cm, e)) {
        return;
      }
      if (!te.dispatchEvent) {
        cm.state.pasteIncoming = +new Date();
        input.focus();
        return;
      }
      var event = new Event("paste");
      event.clipboardData = e.clipboardData;
      te.dispatchEvent(event);
    });
    on(display.lineSpace, "selectstart", function (e) {
      if (!eventInWidget(display, e)) {
        e_preventDefault(e);
      }
    });
    on(te, "compositionstart", function () {
      var start = cm.getCursor("from");
      if (input.composing) {
        input.composing.range.clear();
      }
      input.composing = {
        start: start,
        range: cm.markText(start, cm.getCursor("to"), {
          className: "CodeMirror-composing"
        })
      };
    });
    on(te, "compositionend", function () {
      if (input.composing) {
        input.poll();
        input.composing.range.clear();
        input.composing = null;
      }
    });
  };
  TextareaInput.prototype.createField = function (_display) {
    this.wrapper = hiddenTextarea();
    this.textarea = this.wrapper.firstChild;
  };
  TextareaInput.prototype.prepareSelection = function () {
    var cm = this.cm,
      display = cm.display,
      doc = cm.doc;
    var result = prepareSelection(cm);
    if (cm.options.moveInputWithCursor) {
      var headPos = cursorCoords(cm, doc.sel.primary().head, "div");
      var wrapOff = display.wrapper.getBoundingClientRect(),
        lineOff = display.lineDiv.getBoundingClientRect();
      result.teTop = Math.max(0, Math.min(display.wrapper.clientHeight - 10, headPos.top + lineOff.top - wrapOff.top));
      result.teLeft = Math.max(0, Math.min(display.wrapper.clientWidth - 10, headPos.left + lineOff.left - wrapOff.left));
    }
    return result;
  };
  TextareaInput.prototype.showSelection = function (drawn) {
    var cm = this.cm,
      display = cm.display;
    removeChildrenAndAdd(display.cursorDiv, drawn.cursors);
    removeChildrenAndAdd(display.selectionDiv, drawn.selection);
    if (drawn.teTop != null) {
      this.wrapper.style.top = drawn.teTop + "px";
      this.wrapper.style.left = drawn.teLeft + "px";
    }
  };
  TextareaInput.prototype.reset = function (typing) {
    if (this.contextMenuPending || this.composing) {
      return;
    }
    var cm = this.cm;
    if (cm.somethingSelected()) {
      this.prevInput = "";
      var content = cm.getSelection();
      this.textarea.value = content;
      if (cm.state.focused) {
        selectInput(this.textarea);
      }
      if (ie && ie_version >= 9) {
        this.hasSelection = content;
      }
    } else if (!typing) {
      this.prevInput = this.textarea.value = "";
      if (ie && ie_version >= 9) {
        this.hasSelection = null;
      }
    }
  };
  TextareaInput.prototype.getField = function () {
    return this.textarea;
  };
  TextareaInput.prototype.supportsTouch = function () {
    return false;
  };
  TextareaInput.prototype.focus = function () {
    if (this.cm.options.readOnly != "nocursor" && (!mobile || activeElt() != this.textarea)) {
      try {
        this.textarea.focus();
      } catch (e) {}
    }
  };
  TextareaInput.prototype.blur = function () {
    this.textarea.blur();
  };
  TextareaInput.prototype.resetPosition = function () {
    this.wrapper.style.top = this.wrapper.style.left = 0;
  };
  TextareaInput.prototype.receivedFocus = function () {
    this.slowPoll();
  };
  TextareaInput.prototype.slowPoll = function () {
    var this$1 = this;
    if (this.pollingFast) {
      return;
    }
    this.polling.set(this.cm.options.pollInterval, function () {
      this$1.poll();
      if (this$1.cm.state.focused) {
        this$1.slowPoll();
      }
    });
  };
  TextareaInput.prototype.fastPoll = function () {
    var missed = false,
      input = this;
    input.pollingFast = true;
    function p() {
      var changed = input.poll();
      if (!changed && !missed) {
        missed = true;
        input.polling.set(60, p);
      } else {
        input.pollingFast = false;
        input.slowPoll();
      }
    }
    input.polling.set(20, p);
  };
  TextareaInput.prototype.poll = function () {
    var this$1 = this;
    var cm = this.cm,
      input = this.textarea,
      prevInput = this.prevInput;
    if (this.contextMenuPending || !cm.state.focused || hasSelection(input) && !prevInput && !this.composing || cm.isReadOnly() || cm.options.disableInput || cm.state.keySeq) {
      return false;
    }
    var text = input.value;
    if (text == prevInput && !cm.somethingSelected()) {
      return false;
    }
    if (ie && ie_version >= 9 && this.hasSelection === text || mac && /[\uf700-\uf7ff]/.test(text)) {
      cm.display.input.reset();
      return false;
    }
    if (cm.doc.sel == cm.display.selForContextMenu) {
      var first = text.charCodeAt(0);
      if (first == 8203 && !prevInput) {
        prevInput = "​";
      }
      if (first == 8666) {
        this.reset();
        return this.cm.execCommand("undo");
      }
    }
    var same = 0,
      l = Math.min(prevInput.length, text.length);
    while (same < l && prevInput.charCodeAt(same) == text.charCodeAt(same)) {
      ++same;
    }
    runInOp(cm, function () {
      applyTextInput(cm, text.slice(same), prevInput.length - same, null, this$1.composing ? "*compose" : null);
      if (text.length > 1e3 || text.indexOf("\n") > -1) {
        input.value = this$1.prevInput = "";
      } else {
        this$1.prevInput = text;
      }
      if (this$1.composing) {
        this$1.composing.range.clear();
        this$1.composing.range = cm.markText(this$1.composing.start, cm.getCursor("to"), {
          className: "CodeMirror-composing"
        });
      }
    });
    return true;
  };
  TextareaInput.prototype.ensurePolled = function () {
    if (this.pollingFast && this.poll()) {
      this.pollingFast = false;
    }
  };
  TextareaInput.prototype.onKeyPress = function () {
    if (ie && ie_version >= 9) {
      this.hasSelection = null;
    }
    this.fastPoll();
  };
  TextareaInput.prototype.onContextMenu = function (e) {
    var input = this,
      cm = input.cm,
      display = cm.display,
      te = input.textarea;
    if (input.contextMenuPending) {
      input.contextMenuPending();
    }
    var pos = posFromMouse(cm, e),
      scrollPos = display.scroller.scrollTop;
    if (!pos || presto) {
      return;
    }
    var reset = cm.options.resetSelectionOnContextMenu;
    if (reset && cm.doc.sel.contains(pos) == -1) {
      operation(cm, setSelection)(cm.doc, simpleSelection(pos), sel_dontScroll);
    }
    var oldCSS = te.style.cssText,
      oldWrapperCSS = input.wrapper.style.cssText;
    var wrapperBox = input.wrapper.offsetParent.getBoundingClientRect();
    input.wrapper.style.cssText = "position: static";
    te.style.cssText = "position: absolute; width: 30px; height: 30px;\n      top: " + (e.clientY - wrapperBox.top - 5) + "px; left: " + (e.clientX - wrapperBox.left - 5) + "px;\n      z-index: 1000; background: " + (ie ? "rgba(255, 255, 255, .05)" : "transparent") + ";\n      outline: none; border-width: 0; outline: none; overflow: hidden; opacity: .05; filter: alpha(opacity=5);";
    var oldScrollY;
    if (webkit) {
      oldScrollY = window.scrollY;
    }
    display.input.focus();
    if (webkit) {
      window.scrollTo(null, oldScrollY);
    }
    display.input.reset();
    if (!cm.somethingSelected()) {
      te.value = input.prevInput = " ";
    }
    input.contextMenuPending = rehide;
    display.selForContextMenu = cm.doc.sel;
    clearTimeout(display.detectingSelectAll);
    function prepareSelectAllHack() {
      if (te.selectionStart != null) {
        var selected = cm.somethingSelected();
        var extval = "​" + (selected ? te.value : "");
        te.value = "⇚";
        te.value = extval;
        input.prevInput = selected ? "" : "​";
        te.selectionStart = 1;
        te.selectionEnd = extval.length;
        display.selForContextMenu = cm.doc.sel;
      }
    }
    function rehide() {
      if (input.contextMenuPending != rehide) {
        return;
      }
      input.contextMenuPending = false;
      input.wrapper.style.cssText = oldWrapperCSS;
      te.style.cssText = oldCSS;
      if (ie && ie_version < 9) {
        display.scrollbars.setScrollTop(display.scroller.scrollTop = scrollPos);
      }
      if (te.selectionStart != null) {
        if (!ie || ie && ie_version < 9) {
          prepareSelectAllHack();
        }
        var i = 0,
          poll = function () {
            if (display.selForContextMenu == cm.doc.sel && te.selectionStart == 0 && te.selectionEnd > 0 && input.prevInput == "​") {
              operation(cm, selectAll)(cm);
            } else if (i++ < 10) {
              display.detectingSelectAll = setTimeout(poll, 500);
            } else {
              display.selForContextMenu = null;
              display.input.reset();
            }
          };
        display.detectingSelectAll = setTimeout(poll, 200);
      }
    }
    if (ie && ie_version >= 9) {
      prepareSelectAllHack();
    }
    if (captureRightClick) {
      e_stop(e);
      var mouseup = function () {
        off(window, "mouseup", mouseup);
        setTimeout(rehide, 20);
      };
      on(window, "mouseup", mouseup);
    } else {
      setTimeout(rehide, 50);
    }
  };
  TextareaInput.prototype.readOnlyChanged = function (val) {
    if (!val) {
      this.reset();
    }
    this.textarea.disabled = val == "nocursor";
  };
  TextareaInput.prototype.setUneditable = function () {};
  TextareaInput.prototype.needsContentAttribute = false;
  function fromTextArea(textarea, options) {
    options = options ? copyObj(options) : {};
    options.value = textarea.value;
    if (!options.tabindex && textarea.tabIndex) {
      options.tabindex = textarea.tabIndex;
    }
    if (!options.placeholder && textarea.placeholder) {
      options.placeholder = textarea.placeholder;
    }
    if (options.autofocus == null) {
      var hasFocus = activeElt();
      options.autofocus = hasFocus == textarea || textarea.getAttribute("autofocus") != null && hasFocus == document.body;
    }
    function save() {
      textarea.value = cm.getValue();
    }
    var realSubmit;
    if (textarea.form) {
      on(textarea.form, "submit", save);
      if (!options.leaveSubmitMethodAlone) {
        var form = textarea.form;
        realSubmit = form.submit;
        try {
          var wrappedSubmit = form.submit = function () {
            save();
            form.submit = realSubmit;
            form.submit();
            form.submit = wrappedSubmit;
          };
        } catch (e) {}
      }
    }
    options.finishInit = function (cm) {
      cm.save = save;
      cm.getTextArea = function () {
        return textarea;
      };
      cm.toTextArea = function () {
        cm.toTextArea = isNaN;
        save();
        textarea.parentNode.removeChild(cm.getWrapperElement());
        textarea.style.display = "";
        if (textarea.form) {
          off(textarea.form, "submit", save);
          if (!options.leaveSubmitMethodAlone && typeof textarea.form.submit == "function") {
            textarea.form.submit = realSubmit;
          }
        }
      };
    };
    textarea.style.display = "none";
    var cm = CodeMirror(function (node) {
      return textarea.parentNode.insertBefore(node, textarea.nextSibling);
    }, options);
    return cm;
  }
  function addLegacyProps(CodeMirror) {
    CodeMirror.off = off;
    CodeMirror.on = on;
    CodeMirror.wheelEventPixels = wheelEventPixels;
    CodeMirror.Doc = Doc;
    CodeMirror.splitLines = splitLinesAuto;
    CodeMirror.countColumn = countColumn;
    CodeMirror.findColumn = findColumn;
    CodeMirror.isWordChar = isWordCharBasic;
    CodeMirror.Pass = Pass;
    CodeMirror.signal = signal;
    CodeMirror.Line = Line;
    CodeMirror.changeEnd = changeEnd;
    CodeMirror.scrollbarModel = scrollbarModel;
    CodeMirror.Pos = Pos;
    CodeMirror.cmpPos = cmp;
    CodeMirror.modes = modes;
    CodeMirror.mimeModes = mimeModes;
    CodeMirror.resolveMode = resolveMode;
    CodeMirror.getMode = getMode;
    CodeMirror.modeExtensions = modeExtensions;
    CodeMirror.extendMode = extendMode;
    CodeMirror.copyState = copyState;
    CodeMirror.startState = startState;
    CodeMirror.innerMode = innerMode;
    CodeMirror.commands = commands;
    CodeMirror.keyMap = keyMap;
    CodeMirror.keyName = keyName;
    CodeMirror.isModifierKey = isModifierKey;
    CodeMirror.lookupKey = lookupKey;
    CodeMirror.normalizeKeyMap = normalizeKeyMap;
    CodeMirror.StringStream = StringStream;
    CodeMirror.SharedTextMarker = SharedTextMarker;
    CodeMirror.TextMarker = TextMarker;
    CodeMirror.LineWidget = LineWidget;
    CodeMirror.e_preventDefault = e_preventDefault;
    CodeMirror.e_stopPropagation = e_stopPropagation;
    CodeMirror.e_stop = e_stop;
    CodeMirror.addClass = addClass;
    CodeMirror.contains = contains;
    CodeMirror.rmClass = rmClass;
    CodeMirror.keyNames = keyNames;
  }
  defineOptions(CodeMirror);
  addEditorMethods(CodeMirror);
  var dontDelegate = "iter insert remove copy getEditor constructor".split(" ");
  for (var prop in Doc.prototype) {
    if (Doc.prototype.hasOwnProperty(prop) && indexOf(dontDelegate, prop) < 0) {
      CodeMirror.prototype[prop] = function (method) {
        return function () {
          return method.apply(this.doc, arguments);
        };
      }(Doc.prototype[prop]);
    }
  }
  eventMixin(Doc);
  CodeMirror.inputStyles = {
    textarea: TextareaInput,
    contenteditable: ContentEditableInput
  };
  CodeMirror.defineMode = function (name) {
    if (!CodeMirror.defaults.mode && name != "null") {
      CodeMirror.defaults.mode = name;
    }
    defineMode.apply(this, arguments);
  };
  CodeMirror.defineMIME = defineMIME;
  CodeMirror.defineMode("null", function () {
    return {
      token: function (stream) {
        return stream.skipToEnd();
      }
    };
  });
  CodeMirror.defineMIME("text/plain", "null");
  CodeMirror.defineExtension = function (name, func) {
    CodeMirror.prototype[name] = func;
  };
  CodeMirror.defineDocExtension = function (name, func) {
    Doc.prototype[name] = func;
  };
  CodeMirror.fromTextArea = fromTextArea;
  addLegacyProps(CodeMirror);
  CodeMirror.version = "5.49.2";
  return CodeMirror;
}();
(function () {
  CodeMirror.defineOption("autoCloseTags", false, function (cm, val, old) {
    if (old != CodeMirror.Init && old) cm.removeKeyMap("autoCloseTags");
    if (!val) return;
    var map = {
      name: "autoCloseTags"
    };
    if (typeof val != "object" || val.whenClosing) map["'/'"] = function (cm) {
      return autoCloseSlash(cm);
    };
    if (typeof val != "object" || val.whenOpening) map["'>'"] = function (cm) {
      return autoCloseGT(cm);
    };
    cm.addKeyMap(map);
  });
  var htmlDontClose = ["area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"];
  var htmlIndent = ["applet", "blockquote", "body", "button", "div", "dl", "fieldset", "form", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "html", "iframe", "layer", "legend", "object", "ol", "p", "select", "table", "ul"];
  function autoCloseGT(cm) {
    var pos = cm.getCursor(),
      tok = cm.getTokenAt(pos);
    var inner = CodeMirror.innerMode(cm.getMode(), tok.state),
      state = inner.state;
    if (inner.mode.name != "xml" || !state.tagName || cm.getOption("disableInput")) return CodeMirror.Pass;
    var opt = cm.getOption("autoCloseTags"),
      html = inner.mode.configuration == "html";
    var dontCloseTags = typeof opt == "object" && opt.dontCloseTags || html && htmlDontClose;
    var indentTags = typeof opt == "object" && opt.indentTags || html && htmlIndent;
    var tagName = state.tagName;
    if (tok.end > pos.ch) tagName = tagName.slice(0, tagName.length - tok.end + pos.ch);
    var lowerTagName = tagName.toLowerCase();
    if (!tagName || tok.type == "string" && (tok.end != pos.ch || !/[\"\']/.test(tok.string.charAt(tok.string.length - 1)) || tok.string.length == 1) || tok.type == "tag" && state.type == "closeTag" || tok.string.indexOf("/") == tok.string.length - 1 || dontCloseTags && indexOf(dontCloseTags, lowerTagName) > -1 || CodeMirror.scanForClosingTag && CodeMirror.scanForClosingTag(cm, pos, tagName, Math.min(cm.lastLine() + 1, pos.line + 50))) return CodeMirror.Pass;
    var doIndent = indentTags && indexOf(indentTags, lowerTagName) > -1;
    var curPos = doIndent ? CodeMirror.Pos(pos.line + 1, 0) : CodeMirror.Pos(pos.line, pos.ch + 1);
    cm.replaceSelection(">" + (doIndent ? "\n\n" : "") + "</" + tagName + ">", {
      head: curPos,
      anchor: curPos
    });
    if (doIndent) {
      cm.indentLine(pos.line + 1, null, true);
      cm.indentLine(pos.line + 2, null);
    }
  }
  function autoCloseSlash(cm) {
    var pos = cm.getCursor(),
      tok = cm.getTokenAt(pos);
    var inner = CodeMirror.innerMode(cm.getMode(), tok.state),
      state = inner.state;
    if (tok.type == "string" || tok.string.charAt(0) != "<" || tok.start != pos.ch - 1 || inner.mode.name != "xml" || cm.getOption("disableInput")) return CodeMirror.Pass;
    var tagName = state.context && state.context.tagName;
    if (tagName) cm.replaceSelection("/" + tagName + ">", "end");
  }
  function indexOf(collection, elt) {
    if (collection.indexOf) return collection.indexOf(elt);
    for (var i = 0, e = collection.length; i < e; ++i) if (collection[i] == elt) return i;
    return -1;
  }
})();
(function () {
  "use strict";

  var noOptions = {};
  var nonWS = /[^\s\u00a0]/;
  var Pos = CodeMirror.Pos;
  function firstNonWS(str) {
    var found = str.search(nonWS);
    return found == -1 ? 0 : found;
  }
  CodeMirror.commands.toggleComment = function (cm) {
    var from = cm.getCursor("start"),
      to = cm.getCursor("end");
    cm.uncomment(from, to) || cm.lineComment(from, to);
  };
  CodeMirror.defineExtension("lineComment", function (from, to, options) {
    if (!options) options = noOptions;
    var self = this,
      mode = self.getModeAt(from);
    var commentString = options.lineComment || mode.lineComment;
    if (!commentString) {
      if (options.blockCommentStart || mode.blockCommentStart) {
        options.fullLines = true;
        self.blockComment(from, to, options);
      }
      return;
    }
    var firstLine = self.getLine(from.line);
    if (firstLine == null) return;
    var end = Math.min(to.ch != 0 || to.line == from.line ? to.line + 1 : to.line, self.lastLine() + 1);
    var pad = options.padding == null ? " " : options.padding;
    var blankLines = options.commentBlankLines || from.line == to.line;
    self.operation(function () {
      if (options.indent) {
        var baseString = firstLine.slice(0, firstNonWS(firstLine));
        for (var i = from.line; i < end; ++i) {
          var line = self.getLine(i),
            cut = baseString.length;
          if (!blankLines && !nonWS.test(line)) continue;
          if (line.slice(0, cut) != baseString) cut = firstNonWS(line);
          self.replaceRange(baseString + commentString + pad, Pos(i, 0), Pos(i, cut));
        }
      } else {
        for (var i = from.line; i < end; ++i) {
          if (blankLines || nonWS.test(self.getLine(i))) self.replaceRange(commentString + pad, Pos(i, 0));
        }
      }
    });
  });
  CodeMirror.defineExtension("blockComment", function (from, to, options) {
    if (!options) options = noOptions;
    var self = this,
      mode = self.getModeAt(from);
    var startString = options.blockCommentStart || mode.blockCommentStart;
    var endString = options.blockCommentEnd || mode.blockCommentEnd;
    if (!startString || !endString) {
      if ((options.lineComment || mode.lineComment) && options.fullLines != false) self.lineComment(from, to, options);
      return;
    }
    var end = Math.min(to.line, self.lastLine());
    if (end != from.line && to.ch == 0 && nonWS.test(self.getLine(end))) --end;
    var pad = options.padding == null ? " " : options.padding;
    if (from.line > end) return;
    self.operation(function () {
      if (options.fullLines != false) {
        var lastLineHasText = nonWS.test(self.getLine(end));
        self.replaceRange(pad + endString, Pos(end));
        self.replaceRange(startString + pad, Pos(from.line, 0));
        var lead = options.blockCommentLead || mode.blockCommentLead;
        if (lead != null) for (var i = from.line + 1; i <= end; ++i) if (i != end || lastLineHasText) self.replaceRange(lead + pad, Pos(i, 0));
      } else {
        self.replaceRange(endString, to);
        self.replaceRange(startString, from);
      }
    });
  });
  CodeMirror.defineExtension("uncomment", function (from, to, options) {
    if (!options) options = noOptions;
    var self = this,
      mode = self.getModeAt(from);
    var end = Math.min(to.line, self.lastLine()),
      start = Math.min(from.line, end);
    var lineString = options.lineComment || mode.lineComment,
      lines = [];
    var pad = options.padding == null ? " " : options.padding,
      didSomething;
    lineComment: {
      if (!lineString) break lineComment;
      for (var i = start; i <= end; ++i) {
        var line = self.getLine(i);
        var found = line.indexOf(lineString);
        if (found > -1 && !/comment/.test(self.getTokenTypeAt(Pos(i, found + 1)))) found = -1;
        if (found == -1 && (i != end || i == start) && nonWS.test(line)) break lineComment;
        if (found > -1 && nonWS.test(line.slice(0, found))) break lineComment;
        lines.push(line);
      }
      self.operation(function () {
        for (var i = start; i <= end; ++i) {
          var line = lines[i - start];
          var pos = line.indexOf(lineString),
            endPos = pos + lineString.length;
          if (pos < 0) continue;
          if (line.slice(endPos, endPos + pad.length) == pad) endPos += pad.length;
          didSomething = true;
          self.replaceRange("", Pos(i, pos), Pos(i, endPos));
        }
      });
      if (didSomething) return true;
    }
    var startString = options.blockCommentStart || mode.blockCommentStart;
    var endString = options.blockCommentEnd || mode.blockCommentEnd;
    if (!startString || !endString) return false;
    var lead = options.blockCommentLead || mode.blockCommentLead;
    var startLine = self.getLine(start),
      endLine = end == start ? startLine : self.getLine(end);
    var open = startLine.indexOf(startString),
      close = endLine.lastIndexOf(endString);
    if (close == -1 && start != end) {
      endLine = self.getLine(--end);
      close = endLine.lastIndexOf(endString);
    }
    if (open == -1 || close == -1 || !/comment/.test(self.getTokenTypeAt(Pos(start, open + 1))) || !/comment/.test(self.getTokenTypeAt(Pos(end, close + 1)))) return false;
    self.operation(function () {
      self.replaceRange("", Pos(end, close - (pad && endLine.slice(close - pad.length, close) == pad ? pad.length : 0)), Pos(end, close + endString.length));
      var openEnd = open + startString.length;
      if (pad && startLine.slice(openEnd, openEnd + pad.length) == pad) openEnd += pad.length;
      self.replaceRange("", Pos(start, open), Pos(start, openEnd));
      if (lead) for (var i = start + 1; i <= end; ++i) {
        var line = self.getLine(i),
          found = line.indexOf(lead);
        if (found == -1 || nonWS.test(line.slice(0, found))) continue;
        var foundEnd = found + lead.length;
        if (pad && line.slice(foundEnd, foundEnd + pad.length) == pad) foundEnd += pad.length;
        self.replaceRange("", Pos(i, found), Pos(i, foundEnd));
      }
    });
    return true;
  });
})();
CodeMirror.defineMode("css", function (config, parserConfig) {
  "use strict";

  if (!parserConfig.propertyKeywords) parserConfig = CodeMirror.resolveMode("text/css");
  var indentUnit = config.indentUnit,
    tokenHooks = parserConfig.tokenHooks,
    mediaTypes = parserConfig.mediaTypes || {},
    mediaFeatures = parserConfig.mediaFeatures || {},
    propertyKeywords = parserConfig.propertyKeywords || {},
    colorKeywords = parserConfig.colorKeywords || {},
    valueKeywords = parserConfig.valueKeywords || {},
    fontProperties = parserConfig.fontProperties || {},
    allowNested = parserConfig.allowNested;
  var type, override;
  function ret(style, tp) {
    type = tp;
    return style;
  }
  function tokenBase(stream, state) {
    var ch = stream.next();
    if (tokenHooks[ch]) {
      var result = tokenHooks[ch](stream, state);
      if (result !== false) return result;
    }
    if (ch == "@") {
      stream.eatWhile(/[\w\\\-]/);
      return ret("def", stream.current());
    } else if (ch == "=" || (ch == "~" || ch == "|") && stream.eat("=")) {
      return ret(null, "compare");
    } else if (ch == '"' || ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    } else if (ch == "#") {
      stream.eatWhile(/[\w\\\-]/);
      return ret("atom", "hash");
    } else if (ch == "!") {
      stream.match(/^\s*\w*/);
      return ret("keyword", "important");
    } else if (/\d/.test(ch) || ch == "." && stream.eat(/\d/)) {
      stream.eatWhile(/[\w.%]/);
      return ret("number", "unit");
    } else if (ch === "-") {
      if (/[\d.]/.test(stream.peek())) {
        stream.eatWhile(/[\w.%]/);
        return ret("number", "unit");
      } else if (stream.match(/^[^-]+-/)) {
        return ret("meta", "meta");
      }
    } else if (/[,+>*\/]/.test(ch)) {
      return ret(null, "select-op");
    } else if (ch == "." && stream.match(/^-?[_a-z][_a-z0-9-]*/i)) {
      return ret("qualifier", "qualifier");
    } else if (/[:;{}\[\]\(\)]/.test(ch)) {
      return ret(null, ch);
    } else if (ch == "u" && stream.match("rl(")) {
      stream.backUp(1);
      state.tokenize = tokenParenthesized;
      return ret("property", "word");
    } else if (/[\w\\\-]/.test(ch)) {
      stream.eatWhile(/[\w\\\-]/);
      return ret("property", "word");
    } else {
      return ret(null, null);
    }
  }
  function tokenString(quote) {
    return function (stream, state) {
      var escaped = false,
        ch;
      while ((ch = stream.next()) != null) {
        if (ch == quote && !escaped) {
          if (quote == ")") stream.backUp(1);
          break;
        }
        escaped = !escaped && ch == "\\";
      }
      if (ch == quote || !escaped && quote != ")") state.tokenize = null;
      return ret("string", "string");
    };
  }
  function tokenParenthesized(stream, state) {
    stream.next();
    if (!stream.match(/\s*[\"\']/, false)) state.tokenize = tokenString(")");else state.tokenize = null;
    return ret(null, "(");
  }
  function Context(type, indent, prev) {
    this.type = type;
    this.indent = indent;
    this.prev = prev;
  }
  function pushContext(state, stream, type) {
    state.context = new Context(type, stream.indentation() + indentUnit, state.context);
    return type;
  }
  function popContext(state) {
    state.context = state.context.prev;
    return state.context.type;
  }
  function pass(type, stream, state) {
    return states[state.context.type](type, stream, state);
  }
  function popAndPass(type, stream, state, n) {
    for (var i = n || 1; i > 0; i--) state.context = state.context.prev;
    return pass(type, stream, state);
  }
  function wordAsValue(stream) {
    var word = stream.current().toLowerCase();
    if (valueKeywords.hasOwnProperty(word)) override = "atom";else if (colorKeywords.hasOwnProperty(word)) override = "keyword";else override = "variable";
  }
  var states = {};
  states.top = function (type, stream, state) {
    if (type == "{") {
      return pushContext(state, stream, "block");
    } else if (type == "}" && state.context.prev) {
      return popContext(state);
    } else if (type == "@media") {
      return pushContext(state, stream, "media");
    } else if (type == "@font-face") {
      return "font_face_before";
    } else if (type && type.charAt(0) == "@") {
      return pushContext(state, stream, "at");
    } else if (type == "hash") {
      override = "builtin";
    } else if (type == "word") {
      override = "tag";
    } else if (type == "variable-definition") {
      return "maybeprop";
    } else if (type == "interpolation") {
      return pushContext(state, stream, "interpolation");
    } else if (type == ":") {
      return "pseudo";
    } else if (allowNested && type == "(") {
      return pushContext(state, stream, "params");
    }
    return state.context.type;
  };
  states.block = function (type, stream, state) {
    if (type == "word") {
      if (propertyKeywords.hasOwnProperty(stream.current().toLowerCase())) {
        override = "property";
        return "maybeprop";
      } else if (allowNested) {
        override = stream.match(/^\s*:/, false) ? "property" : "tag";
        return "block";
      } else {
        override += " error";
        return "maybeprop";
      }
    } else if (type == "meta") {
      return "block";
    } else if (!allowNested && (type == "hash" || type == "qualifier")) {
      override = "error";
      return "block";
    } else {
      return states.top(type, stream, state);
    }
  };
  states.maybeprop = function (type, stream, state) {
    if (type == ":") return pushContext(state, stream, "prop");
    return pass(type, stream, state);
  };
  states.prop = function (type, stream, state) {
    if (type == ";") return popContext(state);
    if (type == "{" && allowNested) return pushContext(state, stream, "propBlock");
    if (type == "}" || type == "{") return popAndPass(type, stream, state);
    if (type == "(") return pushContext(state, stream, "parens");
    if (type == "hash" && !/^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/.test(stream.current())) {
      override += " error";
    } else if (type == "word") {
      wordAsValue(stream);
    } else if (type == "interpolation") {
      return pushContext(state, stream, "interpolation");
    }
    return "prop";
  };
  states.propBlock = function (type, _stream, state) {
    if (type == "}") return popContext(state);
    if (type == "word") {
      override = "property";
      return "maybeprop";
    }
    return state.context.type;
  };
  states.parens = function (type, stream, state) {
    if (type == "{" || type == "}") return popAndPass(type, stream, state);
    if (type == ")") return popContext(state);
    return "parens";
  };
  states.pseudo = function (type, stream, state) {
    if (type == "word") {
      override = "variable-3";
      return state.context.type;
    }
    return pass(type, stream, state);
  };
  states.media = function (type, stream, state) {
    if (type == "(") return pushContext(state, stream, "media_parens");
    if (type == "}") return popAndPass(type, stream, state);
    if (type == "{") return popContext(state) && pushContext(state, stream, allowNested ? "block" : "top");
    if (type == "word") {
      var word = stream.current().toLowerCase();
      if (word == "only" || word == "not" || word == "and") override = "keyword";else if (mediaTypes.hasOwnProperty(word)) override = "attribute";else if (mediaFeatures.hasOwnProperty(word)) override = "property";else override = "error";
    }
    return state.context.type;
  };
  states.media_parens = function (type, stream, state) {
    if (type == ")") return popContext(state);
    if (type == "{" || type == "}") return popAndPass(type, stream, state, 2);
    return states.media(type, stream, state);
  };
  states.font_face_before = function (type, stream, state) {
    if (type == "{") return pushContext(state, stream, "font_face");
    return pass(type, stream, state);
  };
  states.font_face = function (type, stream, state) {
    if (type == "}") return popContext(state);
    if (type == "word") {
      if (!fontProperties.hasOwnProperty(stream.current().toLowerCase())) override = "error";else override = "property";
      return "maybeprop";
    }
    return "font_face";
  };
  states.at = function (type, stream, state) {
    if (type == ";") return popContext(state);
    if (type == "{" || type == "}") return popAndPass(type, stream, state);
    if (type == "word") override = "tag";else if (type == "hash") override = "builtin";
    return "at";
  };
  states.interpolation = function (type, stream, state) {
    if (type == "}") return popContext(state);
    if (type == "{" || type == ";") return popAndPass(type, stream, state);
    if (type != "variable") override = "error";
    return "interpolation";
  };
  states.params = function (type, stream, state) {
    if (type == ")") return popContext(state);
    if (type == "{" || type == "}") return popAndPass(type, stream, state);
    if (type == "word") wordAsValue(stream);
    return "params";
  };
  return {
    startState: function (base) {
      return {
        tokenize: null,
        state: "top",
        context: new Context("top", base || 0, null)
      };
    },
    token: function (stream, state) {
      if (!state.tokenize && stream.eatSpace()) return null;
      var style = (state.tokenize || tokenBase)(stream, state);
      if (style && typeof style == "object") {
        type = style[1];
        style = style[0];
      }
      override = style;
      state.state = states[state.state](type, stream, state);
      return override;
    },
    indent: function (state, textAfter) {
      var cx = state.context,
        ch = textAfter && textAfter.charAt(0);
      var indent = cx.indent;
      if (cx.prev && (ch == "}" && (cx.type == "block" || cx.type == "top" || cx.type == "interpolation" || cx.type == "font_face") || ch == ")" && (cx.type == "parens" || cx.type == "params" || cx.type == "media_parens") || ch == "{" && (cx.type == "at" || cx.type == "media"))) {
        indent = cx.indent - indentUnit;
        cx = cx.prev;
      }
      return indent;
    },
    electricChars: "}",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    fold: "brace"
  };
});
(function () {
  function keySet(array) {
    var keys = {};
    for (var i = 0; i < array.length; ++i) {
      keys[array[i]] = true;
    }
    return keys;
  }
  var mediaTypes_ = ["all", "aural", "braille", "handheld", "print", "projection", "screen", "tty", "tv", "embossed"],
    mediaTypes = keySet(mediaTypes_);
  var mediaFeatures_ = ["width", "min-width", "max-width", "height", "min-height", "max-height", "device-width", "min-device-width", "max-device-width", "device-height", "min-device-height", "max-device-height", "aspect-ratio", "min-aspect-ratio", "max-aspect-ratio", "device-aspect-ratio", "min-device-aspect-ratio", "max-device-aspect-ratio", "color", "min-color", "max-color", "color-index", "min-color-index", "max-color-index", "monochrome", "min-monochrome", "max-monochrome", "resolution", "min-resolution", "max-resolution", "scan", "grid"],
    mediaFeatures = keySet(mediaFeatures_);
  var propertyKeywords_ = ["align-content", "align-items", "align-self", "alignment-adjust", "alignment-baseline", "anchor-point", "animation", "animation-delay", "animation-direction", "animation-duration", "animation-iteration-count", "animation-name", "animation-play-state", "animation-timing-function", "appearance", "azimuth", "backface-visibility", "background", "background-attachment", "background-clip", "background-color", "background-image", "background-origin", "background-position", "background-repeat", "background-size", "baseline-shift", "binding", "bleed", "bookmark-label", "bookmark-level", "bookmark-state", "bookmark-target", "border", "border-bottom", "border-bottom-color", "border-bottom-left-radius", "border-bottom-right-radius", "border-bottom-style", "border-bottom-width", "border-collapse", "border-color", "border-image", "border-image-outset", "border-image-repeat", "border-image-slice", "border-image-source", "border-image-width", "border-left", "border-left-color", "border-left-style", "border-left-width", "border-radius", "border-right", "border-right-color", "border-right-style", "border-right-width", "border-spacing", "border-style", "border-top", "border-top-color", "border-top-left-radius", "border-top-right-radius", "border-top-style", "border-top-width", "border-width", "bottom", "box-decoration-break", "box-shadow", "box-sizing", "break-after", "break-before", "break-inside", "caption-side", "clear", "clip", "color", "color-profile", "column-count", "column-fill", "column-gap", "column-rule", "column-rule-color", "column-rule-style", "column-rule-width", "column-span", "column-width", "columns", "content", "counter-increment", "counter-reset", "crop", "cue", "cue-after", "cue-before", "cursor", "direction", "display", "dominant-baseline", "drop-initial-after-adjust", "drop-initial-after-align", "drop-initial-before-adjust", "drop-initial-before-align", "drop-initial-size", "drop-initial-value", "elevation", "empty-cells", "fit", "fit-position", "flex", "flex-basis", "flex-direction", "flex-flow", "flex-grow", "flex-shrink", "flex-wrap", "float", "float-offset", "flow-from", "flow-into", "font", "font-feature-settings", "font-family", "font-kerning", "font-language-override", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-synthesis", "font-variant", "font-variant-alternates", "font-variant-caps", "font-variant-east-asian", "font-variant-ligatures", "font-variant-numeric", "font-variant-position", "font-weight", "grid-cell", "grid-column", "grid-column-align", "grid-column-sizing", "grid-column-span", "grid-columns", "grid-flow", "grid-row", "grid-row-align", "grid-row-sizing", "grid-row-span", "grid-rows", "grid-template", "hanging-punctuation", "height", "hyphens", "icon", "image-orientation", "image-rendering", "image-resolution", "inline-box-align", "justify-content", "left", "letter-spacing", "line-break", "line-height", "line-stacking", "line-stacking-ruby", "line-stacking-shift", "line-stacking-strategy", "list-style", "list-style-image", "list-style-position", "list-style-type", "margin", "margin-bottom", "margin-left", "margin-right", "margin-top", "marker-offset", "marks", "marquee-direction", "marquee-loop", "marquee-play-count", "marquee-speed", "marquee-style", "max-height", "max-width", "min-height", "min-width", "move-to", "nav-down", "nav-index", "nav-left", "nav-right", "nav-up", "opacity", "order", "orphans", "outline", "outline-color", "outline-offset", "outline-style", "outline-width", "overflow", "overflow-style", "overflow-wrap", "overflow-x", "overflow-y", "padding", "padding-bottom", "padding-left", "padding-right", "padding-top", "page", "page-break-after", "page-break-before", "page-break-inside", "page-policy", "pause", "pause-after", "pause-before", "perspective", "perspective-origin", "pitch", "pitch-range", "play-during", "position", "presentation-level", "punctuation-trim", "quotes", "region-break-after", "region-break-before", "region-break-inside", "region-fragment", "rendering-intent", "resize", "rest", "rest-after", "rest-before", "richness", "right", "rotation", "rotation-point", "ruby-align", "ruby-overhang", "ruby-position", "ruby-span", "shape-inside", "shape-outside", "size", "speak", "speak-as", "speak-header", "speak-numeral", "speak-punctuation", "speech-rate", "stress", "string-set", "tab-size", "table-layout", "target", "target-name", "target-new", "target-position", "text-align", "text-align-last", "text-decoration", "text-decoration-color", "text-decoration-line", "text-decoration-skip", "text-decoration-style", "text-emphasis", "text-emphasis-color", "text-emphasis-position", "text-emphasis-style", "text-height", "text-indent", "text-justify", "text-outline", "text-overflow", "text-shadow", "text-size-adjust", "text-space-collapse", "text-transform", "text-underline-position", "text-wrap", "top", "transform", "transform-origin", "transform-style", "transition", "transition-delay", "transition-duration", "transition-property", "transition-timing-function", "unicode-bidi", "vertical-align", "visibility", "voice-balance", "voice-duration", "voice-family", "voice-pitch", "voice-range", "voice-rate", "voice-stress", "voice-volume", "volume", "white-space", "widows", "width", "word-break", "word-spacing", "word-wrap", "z-index", "zoom", "clip-path", "clip-rule", "mask", "enable-background", "filter", "flood-color", "flood-opacity", "lighting-color", "stop-color", "stop-opacity", "pointer-events", "color-interpolation", "color-interpolation-filters", "color-profile", "color-rendering", "fill", "fill-opacity", "fill-rule", "image-rendering", "marker", "marker-end", "marker-mid", "marker-start", "shape-rendering", "stroke", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke-width", "text-rendering", "baseline-shift", "dominant-baseline", "glyph-orientation-horizontal", "glyph-orientation-vertical", "kerning", "text-anchor", "writing-mode"],
    propertyKeywords = keySet(propertyKeywords_);
  var colorKeywords_ = ["aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige", "bisque", "black", "blanchedalmond", "blue", "blueviolet", "brown", "burlywood", "cadetblue", "chartreuse", "chocolate", "coral", "cornflowerblue", "cornsilk", "crimson", "cyan", "darkblue", "darkcyan", "darkgoldenrod", "darkgray", "darkgreen", "darkkhaki", "darkmagenta", "darkolivegreen", "darkorange", "darkorchid", "darkred", "darksalmon", "darkseagreen", "darkslateblue", "darkslategray", "darkturquoise", "darkviolet", "deeppink", "deepskyblue", "dimgray", "dodgerblue", "firebrick", "floralwhite", "forestgreen", "fuchsia", "gainsboro", "ghostwhite", "gold", "goldenrod", "gray", "grey", "green", "greenyellow", "honeydew", "hotpink", "indianred", "indigo", "ivory", "khaki", "lavender", "lavenderblush", "lawngreen", "lemonchiffon", "lightblue", "lightcoral", "lightcyan", "lightgoldenrodyellow", "lightgray", "lightgreen", "lightpink", "lightsalmon", "lightseagreen", "lightskyblue", "lightslategray", "lightsteelblue", "lightyellow", "lime", "limegreen", "linen", "magenta", "maroon", "mediumaquamarine", "mediumblue", "mediumorchid", "mediumpurple", "mediumseagreen", "mediumslateblue", "mediumspringgreen", "mediumturquoise", "mediumvioletred", "midnightblue", "mintcream", "mistyrose", "moccasin", "navajowhite", "navy", "oldlace", "olive", "olivedrab", "orange", "orangered", "orchid", "palegoldenrod", "palegreen", "paleturquoise", "palevioletred", "papayawhip", "peachpuff", "peru", "pink", "plum", "powderblue", "purple", "red", "rosybrown", "royalblue", "saddlebrown", "salmon", "sandybrown", "seagreen", "seashell", "sienna", "silver", "skyblue", "slateblue", "slategray", "snow", "springgreen", "steelblue", "tan", "teal", "thistle", "tomato", "turquoise", "violet", "wheat", "white", "whitesmoke", "yellow", "yellowgreen"],
    colorKeywords = keySet(colorKeywords_);
  var valueKeywords_ = ["above", "absolute", "activeborder", "activecaption", "afar", "after-white-space", "ahead", "alias", "all", "all-scroll", "alternate", "always", "amharic", "amharic-abegede", "antialiased", "appworkspace", "arabic-indic", "armenian", "asterisks", "auto", "avoid", "avoid-column", "avoid-page", "avoid-region", "background", "backwards", "baseline", "below", "bidi-override", "binary", "bengali", "blink", "block", "block-axis", "bold", "bolder", "border", "border-box", "both", "bottom", "break", "break-all", "break-word", "button", "button-bevel", "buttonface", "buttonhighlight", "buttonshadow", "buttontext", "cambodian", "capitalize", "caps-lock-indicator", "caption", "captiontext", "caret", "cell", "center", "checkbox", "circle", "cjk-earthly-branch", "cjk-heavenly-stem", "cjk-ideographic", "clear", "clip", "close-quote", "col-resize", "collapse", "column", "compact", "condensed", "contain", "content", "content-box", "context-menu", "continuous", "copy", "cover", "crop", "cross", "crosshair", "currentcolor", "cursive", "dashed", "decimal", "decimal-leading-zero", "default", "default-button", "destination-atop", "destination-in", "destination-out", "destination-over", "devanagari", "disc", "discard", "document", "dot-dash", "dot-dot-dash", "dotted", "double", "down", "e-resize", "ease", "ease-in", "ease-in-out", "ease-out", "element", "ellipse", "ellipsis", "embed", "end", "ethiopic", "ethiopic-abegede", "ethiopic-abegede-am-et", "ethiopic-abegede-gez", "ethiopic-abegede-ti-er", "ethiopic-abegede-ti-et", "ethiopic-halehame-aa-er", "ethiopic-halehame-aa-et", "ethiopic-halehame-am-et", "ethiopic-halehame-gez", "ethiopic-halehame-om-et", "ethiopic-halehame-sid-et", "ethiopic-halehame-so-et", "ethiopic-halehame-ti-er", "ethiopic-halehame-ti-et", "ethiopic-halehame-tig", "ew-resize", "expanded", "extra-condensed", "extra-expanded", "fantasy", "fast", "fill", "fixed", "flat", "footnotes", "forwards", "from", "geometricPrecision", "georgian", "graytext", "groove", "gujarati", "gurmukhi", "hand", "hangul", "hangul-consonant", "hebrew", "help", "hidden", "hide", "higher", "highlight", "highlighttext", "hiragana", "hiragana-iroha", "horizontal", "hsl", "hsla", "icon", "ignore", "inactiveborder", "inactivecaption", "inactivecaptiontext", "infinite", "infobackground", "infotext", "inherit", "initial", "inline", "inline-axis", "inline-block", "inline-table", "inset", "inside", "intrinsic", "invert", "italic", "justify", "kannada", "katakana", "katakana-iroha", "keep-all", "khmer", "landscape", "lao", "large", "larger", "left", "level", "lighter", "line-through", "linear", "lines", "list-item", "listbox", "listitem", "local", "logical", "loud", "lower", "lower-alpha", "lower-armenian", "lower-greek", "lower-hexadecimal", "lower-latin", "lower-norwegian", "lower-roman", "lowercase", "ltr", "malayalam", "match", "media-controls-background", "media-current-time-display", "media-fullscreen-button", "media-mute-button", "media-play-button", "media-return-to-realtime-button", "media-rewind-button", "media-seek-back-button", "media-seek-forward-button", "media-slider", "media-sliderthumb", "media-time-remaining-display", "media-volume-slider", "media-volume-slider-container", "media-volume-sliderthumb", "medium", "menu", "menulist", "menulist-button", "menulist-text", "menulist-textfield", "menutext", "message-box", "middle", "min-intrinsic", "mix", "mongolian", "monospace", "move", "multiple", "myanmar", "n-resize", "narrower", "ne-resize", "nesw-resize", "no-close-quote", "no-drop", "no-open-quote", "no-repeat", "none", "normal", "not-allowed", "nowrap", "ns-resize", "nw-resize", "nwse-resize", "oblique", "octal", "open-quote", "optimizeLegibility", "optimizeSpeed", "oriya", "oromo", "outset", "outside", "outside-shape", "overlay", "overline", "padding", "padding-box", "painted", "page", "paused", "persian", "plus-darker", "plus-lighter", "pointer", "polygon", "portrait", "pre", "pre-line", "pre-wrap", "preserve-3d", "progress", "push-button", "radio", "read-only", "read-write", "read-write-plaintext-only", "rectangle", "region", "relative", "repeat", "repeat-x", "repeat-y", "reset", "reverse", "rgb", "rgba", "ridge", "right", "round", "row-resize", "rtl", "run-in", "running", "s-resize", "sans-serif", "scroll", "scrollbar", "se-resize", "searchfield", "searchfield-cancel-button", "searchfield-decoration", "searchfield-results-button", "searchfield-results-decoration", "semi-condensed", "semi-expanded", "separate", "serif", "show", "sidama", "single", "skip-white-space", "slide", "slider-horizontal", "slider-vertical", "sliderthumb-horizontal", "sliderthumb-vertical", "slow", "small", "small-caps", "small-caption", "smaller", "solid", "somali", "source-atop", "source-in", "source-out", "source-over", "space", "square", "square-button", "start", "static", "status-bar", "stretch", "stroke", "sub", "subpixel-antialiased", "super", "sw-resize", "table", "table-caption", "table-cell", "table-column", "table-column-group", "table-footer-group", "table-header-group", "table-row", "table-row-group", "telugu", "text", "text-bottom", "text-top", "textarea", "textfield", "thai", "thick", "thin", "threeddarkshadow", "threedface", "threedhighlight", "threedlightshadow", "threedshadow", "tibetan", "tigre", "tigrinya-er", "tigrinya-er-abegede", "tigrinya-et", "tigrinya-et-abegede", "to", "top", "transparent", "ultra-condensed", "ultra-expanded", "underline", "up", "upper-alpha", "upper-armenian", "upper-greek", "upper-hexadecimal", "upper-latin", "upper-norwegian", "upper-roman", "uppercase", "urdu", "url", "vertical", "vertical-text", "visible", "visibleFill", "visiblePainted", "visibleStroke", "visual", "w-resize", "wait", "wave", "wider", "window", "windowframe", "windowtext", "x-large", "x-small", "xor", "xx-large", "xx-small"],
    valueKeywords = keySet(valueKeywords_);
  var fontProperties_ = ["font-family", "src", "unicode-range", "font-variant", "font-feature-settings", "font-stretch", "font-weight", "font-style"],
    fontProperties = keySet(fontProperties_);
  var allWords = mediaTypes_.concat(mediaFeatures_).concat(propertyKeywords_).concat(colorKeywords_).concat(valueKeywords_);
  CodeMirror.registerHelper("hintWords", "css", allWords);
  function tokenCComment(stream, state) {
    var maybeEnd = false,
      ch;
    while ((ch = stream.next()) != null) {
      if (maybeEnd && ch == "/") {
        state.tokenize = null;
        break;
      }
      maybeEnd = ch == "*";
    }
    return ["comment", "comment"];
  }
  function tokenSGMLComment(stream, state) {
    if (stream.skipTo("-->")) {
      stream.match("-->");
      state.tokenize = null;
    } else {
      stream.skipToEnd();
    }
    return ["comment", "comment"];
  }
  CodeMirror.defineMIME("text/css", {
    mediaTypes: mediaTypes,
    mediaFeatures: mediaFeatures,
    propertyKeywords: propertyKeywords,
    colorKeywords: colorKeywords,
    valueKeywords: valueKeywords,
    fontProperties: fontProperties,
    tokenHooks: {
      "<": function (stream, state) {
        if (!stream.match("!--")) return false;
        state.tokenize = tokenSGMLComment;
        return tokenSGMLComment(stream, state);
      },
      "/": function (stream, state) {
        if (!stream.eat("*")) return false;
        state.tokenize = tokenCComment;
        return tokenCComment(stream, state);
      }
    },
    name: "css"
  });
  CodeMirror.defineMIME("text/x-scss", {
    mediaTypes: mediaTypes,
    mediaFeatures: mediaFeatures,
    propertyKeywords: propertyKeywords,
    colorKeywords: colorKeywords,
    valueKeywords: valueKeywords,
    fontProperties: fontProperties,
    allowNested: true,
    tokenHooks: {
      "/": function (stream, state) {
        if (stream.eat("/")) {
          stream.skipToEnd();
          return ["comment", "comment"];
        } else if (stream.eat("*")) {
          state.tokenize = tokenCComment;
          return tokenCComment(stream, state);
        } else {
          return ["operator", "operator"];
        }
      },
      ":": function (stream) {
        if (stream.match(/\s*{/)) return [null, "{"];
        return false;
      },
      $: function (stream) {
        stream.match(/^[\w-]+/);
        if (stream.match(/^\s*:/, false)) return ["variable-2", "variable-definition"];
        return ["variable-2", "variable"];
      },
      "#": function (stream) {
        if (!stream.eat("{")) return false;
        return [null, "interpolation"];
      }
    },
    name: "css",
    helperType: "scss"
  });
  CodeMirror.defineMIME("text/x-less", {
    mediaTypes: mediaTypes,
    mediaFeatures: mediaFeatures,
    propertyKeywords: propertyKeywords,
    colorKeywords: colorKeywords,
    valueKeywords: valueKeywords,
    fontProperties: fontProperties,
    allowNested: true,
    tokenHooks: {
      "/": function (stream, state) {
        if (stream.eat("/")) {
          stream.skipToEnd();
          return ["comment", "comment"];
        } else if (stream.eat("*")) {
          state.tokenize = tokenCComment;
          return tokenCComment(stream, state);
        } else {
          return ["operator", "operator"];
        }
      },
      "@": function (stream) {
        if (stream.match(/^(charset|document|font-face|import|keyframes|media|namespace|page|supports)\b/, false)) return false;
        stream.eatWhile(/[\w\\\-]/);
        if (stream.match(/^\s*:/, false)) return ["variable-2", "variable-definition"];
        return ["variable-2", "variable"];
      },
      "&": function () {
        return ["atom", "atom"];
      }
    },
    name: "css",
    helperType: "less"
  });
})();
CodeMirror.defineMode("diff", function () {
  var TOKEN_NAMES = {
    "+": "positive",
    "-": "negative",
    "@": "meta"
  };
  return {
    token: function (stream) {
      var tw_pos = stream.string.search(/[\t ]+?$/);
      if (!stream.sol() || tw_pos === 0) {
        stream.skipToEnd();
        return ("error " + (TOKEN_NAMES[stream.string.charAt(0)] || "")).replace(/ $/, "");
      }
      var token_name = TOKEN_NAMES[stream.peek()] || stream.skipToEnd();
      if (tw_pos === -1) {
        stream.skipToEnd();
      } else {
        stream.pos = tw_pos;
      }
      return token_name;
    }
  };
});
CodeMirror.defineMIME("text/x-diff", "diff");
CodeMirror.defineMode("edx_markdown", function (cmCfg, modeCfg) {
  var htmlFound = CodeMirror.mimeModes.hasOwnProperty("text/html");
  var htmlMode = CodeMirror.getMode(cmCfg, htmlFound ? "text/html" : "text/plain");
  var header = "header",
    code = "comment",
    quote = "quote",
    list = "string",
    hr = "hr",
    linktext = "link",
    linkhref = "string",
    em = "em",
    strong = "strong",
    emstrong = "emstrong";
  var hrRE = /^([*\-=_])(?:\s*\1){2,}\s*$/,
    ulRE = /^[*\-+]\s+/,
    olRE = /^[0-9]+\.\s+/,
    headerRE = /^(?:\={3,}|-{3,})$/,
    textRE = /^[^\[*_\\<>`]+/;
  function switchInline(stream, state, f) {
    state.f = state.inline = f;
    return f(stream, state);
  }
  function switchBlock(stream, state, f) {
    state.f = state.block = f;
    return f(stream, state);
  }
  function blankLine(state) {
    state.em = false;
    state.strong = false;
    if (!htmlFound && state.f == htmlBlock) {
      state.f = inlineNormal;
      state.block = blockNormal;
    }
    return null;
  }
  function escapeHtml(unsafe) {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function blockNormal(stream, state) {
    var match;
    if (state.indentationDiff >= 4) {
      state.indentation -= state.indentationDiff;
      stream.skipToEnd();
      return code;
    } else if (stream.eatSpace()) {
      return null;
    } else if (stream.peek() === "#" || stream.match(headerRE)) {
      state.header = true;
    } else if (stream.eat(">")) {
      state.indentation++;
      state.quote = true;
    } else if (stream.peek() === "[") {
      return switchInline(stream, state, footnoteLink);
    } else if (stream.match(hrRE, true)) {
      return hr;
    } else if (match = stream.match(ulRE, true) || stream.match(olRE, true)) {
      state.indentation += match[0].length;
      return list;
    }
    return switchInline(stream, state, state.inline);
  }
  function htmlBlock(stream, state) {
    var style = htmlMode.token(stream, state.htmlState);
    if (htmlFound && style === "tag" && state.htmlState.type !== "openTag" && !state.htmlState.context) {
      state.f = inlineNormal;
      state.block = blockNormal;
    }
    if (state.md_inside && stream.current().indexOf(">") != -1) {
      state.f = inlineNormal;
      state.block = blockNormal;
      state.htmlState.context = undefined;
    }
    return style;
  }
  function getType(state) {
    var styles = [];
    if (state.strong) {
      styles.push(state.em ? emstrong : strong);
    } else if (state.em) {
      styles.push(em);
    }
    if (state.header) {
      styles.push(header);
    }
    if (state.quote) {
      styles.push(quote);
    }
    return styles.length ? styles.join(" ") : null;
  }
  function handleText(stream, state) {
    if (stream.match(textRE, true)) {
      return getType(state);
    }
    return undefined;
  }
  function inlineNormal(stream, state) {
    var style = state.text(stream, state);
    if (typeof style !== "undefined") return style;
    var ch = stream.next();
    if (ch === "\\") {
      stream.next();
      return getType(state);
    }
    if (ch === "`") {
      return switchInline(stream, state, inlineElement(code, "`"));
    }
    if (ch === "[") {
      return switchInline(stream, state, linkText);
    }
    if (ch === "<" && stream.match(/^\w/, false)) {
      var md_inside = false;
      if (stream.string.indexOf(">") != -1) {
        var atts = stream.string.substring(1, stream.string.indexOf(">"));
        if (/markdown\s*=\s*('|"){0,1}1('|"){0,1}/.test(atts)) {
          state.md_inside = true;
        }
      }
      stream.backUp(1);
      return switchBlock(stream, state, htmlBlock);
    }
    if (ch === "<" && stream.match(/^\/\w*?>/)) {
      state.md_inside = false;
      return "tag";
    }
    var t = getType(state);
    if (ch === "*" || ch === "_") {
      if (stream.eat(ch)) {
        return (state.strong = !state.strong) ? getType(state) : t;
      }
      return (state.em = !state.em) ? getType(state) : t;
    }
    return getType(state);
  }
  function linkText(stream, state) {
    while (!stream.eol()) {
      var ch = stream.next();
      if (ch === "\\") stream.next();
      if (ch === "]") {
        state.inline = state.f = linkHref;
        return linktext;
      }
    }
    return linktext;
  }
  function linkHref(stream, state) {
    stream.eatSpace();
    var ch = stream.next();
    if (ch === "(" || ch === "[") {
      return switchInline(stream, state, inlineElement(linkhref, ch === "(" ? ")" : "]"));
    }
    return "error";
  }
  function footnoteLink(stream, state) {
    if (stream.match(/^[^\]]*\]:/, true)) {
      state.f = footnoteUrl;
      return linktext;
    }
    return switchInline(stream, state, inlineNormal);
  }
  function footnoteUrl(stream, state) {
    stream.eatSpace();
    stream.match(/^[^\s]+/, true);
    state.f = state.inline = inlineNormal;
    return linkhref;
  }
  function inlineRE(endChar) {
    if (!inlineRE[endChar]) {
      inlineRE[endChar] = new RegExp("^(?:[^\\\\\\" + endChar + "]|\\\\.)*(?:\\" + endChar + "|$)");
    }
    return inlineRE[endChar];
  }
  function inlineElement(type, endChar, next) {
    next = next || inlineNormal;
    return function (stream, state) {
      stream.match(inlineRE(endChar));
      state.inline = state.f = next;
      return type;
    };
  }
  return {
    startState: function () {
      return {
        f: blockNormal,
        block: blockNormal,
        htmlState: CodeMirror.startState(htmlMode),
        indentation: 0,
        inline: inlineNormal,
        text: handleText,
        em: false,
        strong: false,
        header: false,
        quote: false
      };
    },
    copyState: function (s) {
      return {
        f: s.f,
        block: s.block,
        htmlState: CodeMirror.copyState(htmlMode, s.htmlState),
        indentation: s.indentation,
        inline: s.inline,
        text: s.text,
        em: s.em,
        strong: s.strong,
        header: s.header,
        quote: s.quote,
        md_inside: s.md_inside
      };
    },
    token: function (stream, state) {
      if (stream.sol()) {
        if (stream.match(/^\s*$/, true)) {
          return blankLine(state);
        }
        state.header = false;
        state.quote = false;
        state.f = state.block;
        var indentation = stream.match(/^\s*/, true)[0].replace(/\t/g, "    ").length;
        state.indentationDiff = indentation - state.indentation;
        state.indentation = indentation;
        if (indentation > 0) {
          return null;
        }
      }
      return state.f(stream, state);
    },
    blankLine: blankLine,
    getType: getType
  };
}, "xml");
CodeMirror.defineMIME("text/x-markdown", "markdown");
(function () {
  CodeMirror.extendMode("css", {
    commentStart: "/*",
    commentEnd: "*/",
    newlineAfterToken: function (_type, content) {
      return /^[;{}]$/.test(content);
    }
  });
  CodeMirror.extendMode("javascript", {
    commentStart: "/*",
    commentEnd: "*/",
    newlineAfterToken: function (_type, content, textAfter, state) {
      if (this.jsonMode) {
        return /^[\[,{]$/.test(content) || /^}/.test(textAfter);
      } else {
        if (content == ";" && state.lexical && state.lexical.type == ")") return false;
        return /^[;{}]$/.test(content) && !/^;/.test(textAfter);
      }
    }
  });
  var inlineElements = /^(a|abbr|acronym|area|base|bdo|big|br|button|caption|cite|code|col|colgroup|dd|del|dfn|em|frame|hr|iframe|img|input|ins|kbd|label|legend|link|map|object|optgroup|option|param|q|samp|script|select|small|span|strong|sub|sup|textarea|tt|var)$/;
  CodeMirror.extendMode("xml", {
    commentStart: "<!--",
    commentEnd: "-->",
    newlineAfterToken: function (type, content, textAfter, state) {
      var inline = false;
      if (this.configuration == "html") inline = state.context ? inlineElements.test(state.context.tagName) : false;
      return !inline && (type == "tag" && />$/.test(content) && state.context || /^</.test(textAfter));
    }
  });
  CodeMirror.defineExtension("commentRange", function (isComment, from, to) {
    var cm = this,
      curMode = CodeMirror.innerMode(cm.getMode(), cm.getTokenAt(from).state).mode;
    cm.operation(function () {
      if (isComment) {
        cm.replaceRange(curMode.commentEnd, to);
        cm.replaceRange(curMode.commentStart, from);
        if (from.line == to.line && from.ch == to.ch) cm.setCursor(from.line, from.ch + curMode.commentStart.length);
      } else {
        var selText = cm.getRange(from, to);
        var startIndex = selText.indexOf(curMode.commentStart);
        var endIndex = selText.lastIndexOf(curMode.commentEnd);
        if (startIndex > -1 && endIndex > -1 && endIndex > startIndex) {
          selText = selText.substr(0, startIndex) + selText.substring(startIndex + curMode.commentStart.length, endIndex) + selText.substr(endIndex + curMode.commentEnd.length);
        }
        cm.replaceRange(selText, from, to);
      }
    });
  });
  CodeMirror.defineExtension("autoIndentRange", function (from, to) {
    var cmInstance = this;
    this.operation(function () {
      for (var i = from.line; i <= to.line; i++) {
        cmInstance.indentLine(i, "smart");
      }
    });
  });
  CodeMirror.defineExtension("autoFormatRange", function (from, to) {
    var cm = this;
    var outer = cm.getMode(),
      text = cm.getRange(from, to).split("\n");
    var state = CodeMirror.copyState(outer, cm.getTokenAt(from).state);
    var tabSize = cm.getOption("tabSize");
    var out = "",
      lines = 0,
      atSol = from.ch == 0;
    function newline() {
      out += "\n";
      atSol = true;
      ++lines;
    }
    for (var i = 0; i < text.length; ++i) {
      var stream = new CodeMirror.StringStream(text[i], tabSize);
      while (!stream.eol()) {
        var inner = CodeMirror.innerMode(outer, state);
        var style = outer.token(stream, state),
          cur = stream.current();
        stream.start = stream.pos;
        if (!atSol || /\S/.test(cur)) {
          out += cur;
          atSol = false;
        }
        if (!atSol && inner.mode.newlineAfterToken && inner.mode.newlineAfterToken(style, cur, stream.string.slice(stream.pos) || text[i + 1] || "", inner.state)) newline();
      }
      if (!stream.pos && outer.blankLine) outer.blankLine(state);
      if (!atSol && i < text.length - 1) newline();
    }
    cm.operation(function () {
      cm.replaceRange(out, from, to);
      for (var cur = from.line + 1, end = from.line + lines; cur <= end; ++cur) cm.indentLine(cur, "smart");
      cm.setSelection(from, cm.getCursor(false));
    });
  });
})();
CodeMirror.defineMode("htmlembedded", function (config, parserConfig) {
  var scriptStartRegex = parserConfig.scriptStartRegex || /^<%/i,
    scriptEndRegex = parserConfig.scriptEndRegex || /^%>/i;
  var scriptingMode, htmlMixedMode;
  function htmlDispatch(stream, state) {
    if (stream.match(scriptStartRegex, false)) {
      state.token = scriptingDispatch;
      return scriptingMode.token(stream, state.scriptState);
    } else return htmlMixedMode.token(stream, state.htmlState);
  }
  function scriptingDispatch(stream, state) {
    if (stream.match(scriptEndRegex, false)) {
      state.token = htmlDispatch;
      return htmlMixedMode.token(stream, state.htmlState);
    } else return scriptingMode.token(stream, state.scriptState);
  }
  return {
    startState: function () {
      scriptingMode = scriptingMode || CodeMirror.getMode(config, parserConfig.scriptingModeSpec);
      htmlMixedMode = htmlMixedMode || CodeMirror.getMode(config, "htmlmixed");
      return {
        token: parserConfig.startOpen ? scriptingDispatch : htmlDispatch,
        htmlState: CodeMirror.startState(htmlMixedMode),
        scriptState: CodeMirror.startState(scriptingMode)
      };
    },
    token: function (stream, state) {
      return state.token(stream, state);
    },
    indent: function (state, textAfter) {
      if (state.token == htmlDispatch) return htmlMixedMode.indent(state.htmlState, textAfter);else if (scriptingMode.indent) return scriptingMode.indent(state.scriptState, textAfter);
    },
    copyState: function (state) {
      return {
        token: state.token,
        htmlState: CodeMirror.copyState(htmlMixedMode, state.htmlState),
        scriptState: CodeMirror.copyState(scriptingMode, state.scriptState)
      };
    },
    innerMode: function (state) {
      if (state.token == scriptingDispatch) return {
        state: state.scriptState,
        mode: scriptingMode
      };else return {
        state: state.htmlState,
        mode: htmlMixedMode
      };
    }
  };
}, "htmlmixed");
CodeMirror.defineMIME("application/x-ejs", {
  name: "htmlembedded",
  scriptingModeSpec: "javascript"
});
CodeMirror.defineMIME("application/x-aspx", {
  name: "htmlembedded",
  scriptingModeSpec: "text/x-csharp"
});
CodeMirror.defineMIME("application/x-jsp", {
  name: "htmlembedded",
  scriptingModeSpec: "text/x-java"
});
CodeMirror.defineMIME("application/x-erb", {
  name: "htmlembedded",
  scriptingModeSpec: "ruby"
});
CodeMirror.defineMode("htmlmixed", function (config, parserConfig) {
  var htmlMode = CodeMirror.getMode(config, {
    name: "xml",
    htmlMode: true
  });
  var cssMode = CodeMirror.getMode(config, "css");
  var scriptTypes = [],
    scriptTypesConf = parserConfig && parserConfig.scriptTypes;
  scriptTypes.push({
    matches: /^(?:text|application)\/(?:x-)?(?:java|ecma)script$|^$/i,
    mode: CodeMirror.getMode(config, "javascript")
  });
  if (scriptTypesConf) for (var i = 0; i < scriptTypesConf.length; ++i) {
    var conf = scriptTypesConf[i];
    scriptTypes.push({
      matches: conf.matches,
      mode: conf.mode && CodeMirror.getMode(config, conf.mode)
    });
  }
  scriptTypes.push({
    matches: /./,
    mode: CodeMirror.getMode(config, "text/plain")
  });
  function html(stream, state) {
    var tagName = state.htmlState.tagName;
    var style = htmlMode.token(stream, state.htmlState);
    if (tagName == "script" && /\btag\b/.test(style) && stream.current() == ">") {
      var scriptType = stream.string.slice(Math.max(0, stream.pos - 100), stream.pos).match(/\btype\s*=\s*("[^"]+"|'[^']+'|\S+)[^<]*$/i);
      scriptType = scriptType ? scriptType[1] : "";
      if (scriptType && /[\"\']/.test(scriptType.charAt(0))) scriptType = scriptType.slice(1, scriptType.length - 1);
      for (var i = 0; i < scriptTypes.length; ++i) {
        var tp = scriptTypes[i];
        if (typeof tp.matches == "string" ? scriptType == tp.matches : tp.matches.test(scriptType)) {
          if (tp.mode) {
            state.token = script;
            state.localMode = tp.mode;
            state.localState = tp.mode.startState && tp.mode.startState(htmlMode.indent(state.htmlState, ""));
          }
          break;
        }
      }
    } else if (tagName == "style" && /\btag\b/.test(style) && stream.current() == ">") {
      state.token = css;
      state.localMode = cssMode;
      state.localState = cssMode.startState(htmlMode.indent(state.htmlState, ""));
    }
    return style;
  }
  function maybeBackup(stream, pat, style) {
    var cur = stream.current();
    var close = cur.search(pat),
      m;
    if (close > -1) stream.backUp(cur.length - close);else if (m = cur.match(/<\/?$/)) {
      stream.backUp(cur.length);
      if (!stream.match(pat, false)) stream.match(cur);
    }
    return style;
  }
  function script(stream, state) {
    if (stream.match(/^<\/\s*script\s*>/i, false)) {
      state.token = html;
      state.localState = state.localMode = null;
      return html(stream, state);
    }
    return maybeBackup(stream, /<\/\s*script\s*>/, state.localMode.token(stream, state.localState));
  }
  function css(stream, state) {
    if (stream.match(/^<\/\s*style\s*>/i, false)) {
      state.token = html;
      state.localState = state.localMode = null;
      return html(stream, state);
    }
    return maybeBackup(stream, /<\/\s*style\s*>/, cssMode.token(stream, state.localState));
  }
  return {
    startState: function () {
      var state = htmlMode.startState();
      return {
        token: html,
        localMode: null,
        localState: null,
        htmlState: state
      };
    },
    copyState: function (state) {
      if (state.localState) var local = CodeMirror.copyState(state.localMode, state.localState);
      return {
        token: state.token,
        localMode: state.localMode,
        localState: local,
        htmlState: CodeMirror.copyState(htmlMode, state.htmlState)
      };
    },
    token: function (stream, state) {
      return state.token(stream, state);
    },
    indent: function (state, textAfter) {
      if (!state.localMode || /^\s*<\//.test(textAfter)) return htmlMode.indent(state.htmlState, textAfter);else if (state.localMode.indent) return state.localMode.indent(state.localState, textAfter);else return CodeMirror.Pass;
    },
    innerMode: function (state) {
      return {
        state: state.localState || state.htmlState,
        mode: state.localMode || htmlMode
      };
    }
  };
}, "xml", "javascript", "css");
CodeMirror.defineMIME("text/html", "htmlmixed");
CodeMirror.defineMode("javascript", function (config, parserConfig) {
  var indentUnit = config.indentUnit;
  var statementIndent = parserConfig.statementIndent;
  var jsonMode = parserConfig.json;
  var isTS = parserConfig.typescript;
  var keywords = function () {
    function kw(type) {
      return {
        type: type,
        style: "keyword"
      };
    }
    var A = kw("keyword a"),
      B = kw("keyword b"),
      C = kw("keyword c");
    var operator = kw("operator"),
      atom = {
        type: "atom",
        style: "atom"
      };
    var jsKeywords = {
      if: kw("if"),
      while: A,
      with: A,
      else: B,
      do: B,
      try: B,
      finally: B,
      return: C,
      break: C,
      continue: C,
      new: C,
      delete: C,
      throw: C,
      debugger: C,
      var: kw("var"),
      const: kw("var"),
      let: kw("var"),
      function: kw("function"),
      catch: kw("catch"),
      for: kw("for"),
      switch: kw("switch"),
      case: kw("case"),
      default: kw("default"),
      in: operator,
      typeof: operator,
      instanceof: operator,
      true: atom,
      false: atom,
      null: atom,
      undefined: atom,
      NaN: atom,
      Infinity: atom,
      this: kw("this"),
      module: kw("module"),
      class: kw("class"),
      super: kw("atom"),
      yield: C,
      export: kw("export"),
      import: kw("import"),
      extends: C
    };
    if (isTS) {
      var type = {
        type: "variable",
        style: "variable-3"
      };
      var tsKeywords = {
        interface: kw("interface"),
        extends: kw("extends"),
        constructor: kw("constructor"),
        public: kw("public"),
        private: kw("private"),
        protected: kw("protected"),
        static: kw("static"),
        string: type,
        number: type,
        bool: type,
        any: type
      };
      for (var attr in tsKeywords) {
        jsKeywords[attr] = tsKeywords[attr];
      }
    }
    return jsKeywords;
  }();
  var isOperatorChar = /[+\-*&%=<>!?|~^]/;
  function readRegexp(stream) {
    var escaped = false,
      next,
      inSet = false;
    while ((next = stream.next()) != null) {
      if (!escaped) {
        if (next == "/" && !inSet) return;
        if (next == "[") inSet = true;else if (inSet && next == "]") inSet = false;
      }
      escaped = !escaped && next == "\\";
    }
  }
  var type, content;
  function ret(tp, style, cont) {
    type = tp;
    content = cont;
    return style;
  }
  function tokenBase(stream, state) {
    var ch = stream.next();
    if (ch == '"' || ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    } else if (ch == "." && stream.match(/^\d+(?:[eE][+\-]?\d+)?/)) {
      return ret("number", "number");
    } else if (ch == "." && stream.match("..")) {
      return ret("spread", "meta");
    } else if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
      return ret(ch);
    } else if (ch == "=" && stream.eat(">")) {
      return ret("=>", "operator");
    } else if (ch == "0" && stream.eat(/x/i)) {
      stream.eatWhile(/[\da-f]/i);
      return ret("number", "number");
    } else if (/\d/.test(ch)) {
      stream.match(/^\d*(?:\.\d*)?(?:[eE][+\-]?\d+)?/);
      return ret("number", "number");
    } else if (ch == "/") {
      if (stream.eat("*")) {
        state.tokenize = tokenComment;
        return tokenComment(stream, state);
      } else if (stream.eat("/")) {
        stream.skipToEnd();
        return ret("comment", "comment");
      } else if (state.lastType == "operator" || state.lastType == "keyword c" || state.lastType == "sof" || /^[\[{}\(,;:]$/.test(state.lastType)) {
        readRegexp(stream);
        stream.eatWhile(/[gimy]/);
        return ret("regexp", "string-2");
      } else {
        stream.eatWhile(isOperatorChar);
        return ret("operator", "operator", stream.current());
      }
    } else if (ch == "`") {
      state.tokenize = tokenQuasi;
      return tokenQuasi(stream, state);
    } else if (ch == "#") {
      stream.skipToEnd();
      return ret("error", "error");
    } else if (isOperatorChar.test(ch)) {
      stream.eatWhile(isOperatorChar);
      return ret("operator", "operator", stream.current());
    } else {
      stream.eatWhile(/[\w\$_]/);
      var word = stream.current(),
        known = keywords.propertyIsEnumerable(word) && keywords[word];
      return known && state.lastType != "." ? ret(known.type, known.style, word) : ret("variable", "variable", word);
    }
  }
  function tokenString(quote) {
    return function (stream, state) {
      var escaped = false,
        next;
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) break;
        escaped = !escaped && next == "\\";
      }
      if (!escaped) state.tokenize = tokenBase;
      return ret("string", "string");
    };
  }
  function tokenComment(stream, state) {
    var maybeEnd = false,
      ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = ch == "*";
    }
    return ret("comment", "comment");
  }
  function tokenQuasi(stream, state) {
    var escaped = false,
      next;
    while ((next = stream.next()) != null) {
      if (!escaped && (next == "`" || next == "$" && stream.eat("{"))) {
        state.tokenize = tokenBase;
        break;
      }
      escaped = !escaped && next == "\\";
    }
    return ret("quasi", "string-2", stream.current());
  }
  var brackets = "([{}])";
  function findFatArrow(stream, state) {
    if (state.fatArrowAt) state.fatArrowAt = null;
    var arrow = stream.string.indexOf("=>", stream.start);
    if (arrow < 0) return;
    var depth = 0,
      sawSomething = false;
    for (var pos = arrow - 1; pos >= 0; --pos) {
      var ch = stream.string.charAt(pos);
      var bracket = brackets.indexOf(ch);
      if (bracket >= 0 && bracket < 3) {
        if (!depth) {
          ++pos;
          break;
        }
        if (--depth == 0) break;
      } else if (bracket >= 3 && bracket < 6) {
        ++depth;
      } else if (/[$\w]/.test(ch)) {
        sawSomething = true;
      } else if (sawSomething && !depth) {
        ++pos;
        break;
      }
    }
    if (sawSomething && !depth) state.fatArrowAt = pos;
  }
  var atomicTypes = {
    atom: true,
    number: true,
    variable: true,
    string: true,
    regexp: true,
    this: true
  };
  function JSLexical(indented, column, type, align, prev, info) {
    this.indented = indented;
    this.column = column;
    this.type = type;
    this.prev = prev;
    this.info = info;
    if (align != null) this.align = align;
  }
  function inScope(state, varname) {
    for (var v = state.localVars; v; v = v.next) if (v.name == varname) return true;
    for (var cx = state.context; cx; cx = cx.prev) {
      for (var v = cx.vars; v; v = v.next) if (v.name == varname) return true;
    }
  }
  function parseJS(state, style, type, content, stream) {
    var cc = state.cc;
    cx.state = state;
    cx.stream = stream;
    cx.marked = null, cx.cc = cc;
    if (!state.lexical.hasOwnProperty("align")) state.lexical.align = true;
    while (true) {
      var combinator = cc.length ? cc.pop() : jsonMode ? expression : statement;
      if (combinator(type, content)) {
        while (cc.length && cc[cc.length - 1].lex) cc.pop()();
        if (cx.marked) return cx.marked;
        if (type == "variable" && inScope(state, content)) return "variable-2";
        return style;
      }
    }
  }
  var cx = {
    state: null,
    column: null,
    marked: null,
    cc: null
  };
  function pass() {
    for (var i = arguments.length - 1; i >= 0; i--) cx.cc.push(arguments[i]);
  }
  function cont() {
    pass.apply(null, arguments);
    return true;
  }
  function register(varname) {
    function inList(list) {
      for (var v = list; v; v = v.next) if (v.name == varname) return true;
      return false;
    }
    var state = cx.state;
    if (state.context) {
      cx.marked = "def";
      if (inList(state.localVars)) return;
      state.localVars = {
        name: varname,
        next: state.localVars
      };
    } else {
      if (inList(state.globalVars)) return;
      if (parserConfig.globalVars) state.globalVars = {
        name: varname,
        next: state.globalVars
      };
    }
  }
  var defaultVars = {
    name: "this",
    next: {
      name: "arguments"
    }
  };
  function pushcontext() {
    cx.state.context = {
      prev: cx.state.context,
      vars: cx.state.localVars
    };
    cx.state.localVars = defaultVars;
  }
  function popcontext() {
    cx.state.localVars = cx.state.context.vars;
    cx.state.context = cx.state.context.prev;
  }
  function pushlex(type, info) {
    var result = function () {
      var state = cx.state,
        indent = state.indented;
      if (state.lexical.type == "stat") indent = state.lexical.indented;
      state.lexical = new JSLexical(indent, cx.stream.column(), type, null, state.lexical, info);
    };
    result.lex = true;
    return result;
  }
  function poplex() {
    var state = cx.state;
    if (state.lexical.prev) {
      if (state.lexical.type == ")") state.indented = state.lexical.indented;
      state.lexical = state.lexical.prev;
    }
  }
  poplex.lex = true;
  function expect(wanted) {
    return function (type) {
      if (type == wanted) return cont();else if (wanted == ";") return pass();else return cont(arguments.callee);
    };
  }
  function statement(type, value) {
    if (type == "var") return cont(pushlex("vardef", value.length), vardef, expect(";"), poplex);
    if (type == "keyword a") return cont(pushlex("form"), expression, statement, poplex);
    if (type == "keyword b") return cont(pushlex("form"), statement, poplex);
    if (type == "{") return cont(pushlex("}"), block, poplex);
    if (type == ";") return cont();
    if (type == "if") return cont(pushlex("form"), expression, statement, poplex, maybeelse);
    if (type == "function") return cont(functiondef);
    if (type == "for") return cont(pushlex("form"), forspec, statement, poplex);
    if (type == "variable") return cont(pushlex("stat"), maybelabel);
    if (type == "switch") return cont(pushlex("form"), expression, pushlex("}", "switch"), expect("{"), block, poplex, poplex);
    if (type == "case") return cont(expression, expect(":"));
    if (type == "default") return cont(expect(":"));
    if (type == "catch") return cont(pushlex("form"), pushcontext, expect("("), funarg, expect(")"), statement, poplex, popcontext);
    if (type == "module") return cont(pushlex("form"), pushcontext, afterModule, popcontext, poplex);
    if (type == "class") return cont(pushlex("form"), className, objlit, poplex);
    if (type == "export") return cont(pushlex("form"), afterExport, poplex);
    if (type == "import") return cont(pushlex("form"), afterImport, poplex);
    return pass(pushlex("stat"), expression, expect(";"), poplex);
  }
  function expression(type) {
    return expressionInner(type, false);
  }
  function expressionNoComma(type) {
    return expressionInner(type, true);
  }
  function expressionInner(type, noComma) {
    if (cx.state.fatArrowAt == cx.stream.start) {
      var body = noComma ? arrowBodyNoComma : arrowBody;
      if (type == "(") return cont(pushcontext, pushlex(")"), commasep(pattern, ")"), poplex, expect("=>"), body, popcontext);else if (type == "variable") return pass(pushcontext, pattern, expect("=>"), body, popcontext);
    }
    var maybeop = noComma ? maybeoperatorNoComma : maybeoperatorComma;
    if (atomicTypes.hasOwnProperty(type)) return cont(maybeop);
    if (type == "function") return cont(functiondef);
    if (type == "keyword c") return cont(noComma ? maybeexpressionNoComma : maybeexpression);
    if (type == "(") return cont(pushlex(")"), maybeexpression, comprehension, expect(")"), poplex, maybeop);
    if (type == "operator" || type == "spread") return cont(noComma ? expressionNoComma : expression);
    if (type == "[") return cont(pushlex("]"), arrayLiteral, poplex, maybeop);
    if (type == "{") return contCommasep(objprop, "}", null, maybeop);
    return cont();
  }
  function maybeexpression(type) {
    if (type.match(/[;\}\)\],]/)) return pass();
    return pass(expression);
  }
  function maybeexpressionNoComma(type) {
    if (type.match(/[;\}\)\],]/)) return pass();
    return pass(expressionNoComma);
  }
  function maybeoperatorComma(type, value) {
    if (type == ",") return cont(expression);
    return maybeoperatorNoComma(type, value, false);
  }
  function maybeoperatorNoComma(type, value, noComma) {
    var me = noComma == false ? maybeoperatorComma : maybeoperatorNoComma;
    var expr = noComma == false ? expression : expressionNoComma;
    if (value == "=>") return cont(pushcontext, noComma ? arrowBodyNoComma : arrowBody, popcontext);
    if (type == "operator") {
      if (/\+\+|--/.test(value)) return cont(me);
      if (value == "?") return cont(expression, expect(":"), expr);
      return cont(expr);
    }
    if (type == "quasi") {
      cx.cc.push(me);
      return quasi(value);
    }
    if (type == ";") return;
    if (type == "(") return contCommasep(expressionNoComma, ")", "call", me);
    if (type == ".") return cont(property, me);
    if (type == "[") return cont(pushlex("]"), maybeexpression, expect("]"), poplex, me);
  }
  function quasi(value) {
    if (value.slice(value.length - 2) != "${") return cont();
    return cont(expression, continueQuasi);
  }
  function continueQuasi(type) {
    if (type == "}") {
      cx.marked = "string-2";
      cx.state.tokenize = tokenQuasi;
      return cont();
    }
  }
  function arrowBody(type) {
    findFatArrow(cx.stream, cx.state);
    if (type == "{") return pass(statement);
    return pass(expression);
  }
  function arrowBodyNoComma(type) {
    findFatArrow(cx.stream, cx.state);
    if (type == "{") return pass(statement);
    return pass(expressionNoComma);
  }
  function maybelabel(type) {
    if (type == ":") return cont(poplex, statement);
    return pass(maybeoperatorComma, expect(";"), poplex);
  }
  function property(type) {
    if (type == "variable") {
      cx.marked = "property";
      return cont();
    }
  }
  function objprop(type, value) {
    if (type == "variable") {
      cx.marked = "property";
      if (value == "get" || value == "set") return cont(getterSetter);
    } else if (type == "number" || type == "string") {
      cx.marked = type + " property";
    } else if (type == "[") {
      return cont(expression, expect("]"), afterprop);
    }
    if (atomicTypes.hasOwnProperty(type)) return cont(afterprop);
  }
  function getterSetter(type) {
    if (type != "variable") return pass(afterprop);
    cx.marked = "property";
    return cont(functiondef);
  }
  function afterprop(type) {
    if (type == ":") return cont(expressionNoComma);
    if (type == "(") return pass(functiondef);
  }
  function commasep(what, end) {
    function proceed(type) {
      if (type == ",") {
        var lex = cx.state.lexical;
        if (lex.info == "call") lex.pos = (lex.pos || 0) + 1;
        return cont(what, proceed);
      }
      if (type == end) return cont();
      return cont(expect(end));
    }
    return function (type) {
      if (type == end) return cont();
      return pass(what, proceed);
    };
  }
  function contCommasep(what, end, info) {
    for (var i = 3; i < arguments.length; i++) cx.cc.push(arguments[i]);
    return cont(pushlex(end, info), commasep(what, end), poplex);
  }
  function block(type) {
    if (type == "}") return cont();
    return pass(statement, block);
  }
  function maybetype(type) {
    if (isTS && type == ":") return cont(typedef);
  }
  function typedef(type) {
    if (type == "variable") {
      cx.marked = "variable-3";
      return cont();
    }
  }
  function vardef() {
    return pass(pattern, maybetype, maybeAssign, vardefCont);
  }
  function pattern(type, value) {
    if (type == "variable") {
      register(value);
      return cont();
    }
    if (type == "[") return contCommasep(pattern, "]");
    if (type == "{") return contCommasep(proppattern, "}");
  }
  function proppattern(type, value) {
    if (type == "variable" && !cx.stream.match(/^\s*:/, false)) {
      register(value);
      return cont(maybeAssign);
    }
    if (type == "variable") cx.marked = "property";
    return cont(expect(":"), pattern, maybeAssign);
  }
  function maybeAssign(_type, value) {
    if (value == "=") return cont(expressionNoComma);
  }
  function vardefCont(type) {
    if (type == ",") return cont(vardef);
  }
  function maybeelse(type, value) {
    if (type == "keyword b" && value == "else") return cont(pushlex("form"), statement, poplex);
  }
  function forspec(type) {
    if (type == "(") return cont(pushlex(")"), forspec1, expect(")"), poplex);
  }
  function forspec1(type) {
    if (type == "var") return cont(vardef, expect(";"), forspec2);
    if (type == ";") return cont(forspec2);
    if (type == "variable") return cont(formaybeinof);
    return pass(expression, expect(";"), forspec2);
  }
  function formaybeinof(_type, value) {
    if (value == "in" || value == "of") {
      cx.marked = "keyword";
      return cont(expression);
    }
    return cont(maybeoperatorComma, forspec2);
  }
  function forspec2(type, value) {
    if (type == ";") return cont(forspec3);
    if (value == "in" || value == "of") {
      cx.marked = "keyword";
      return cont(expression);
    }
    return pass(expression, expect(";"), forspec3);
  }
  function forspec3(type) {
    if (type != ")") cont(expression);
  }
  function functiondef(type, value) {
    if (value == "*") {
      cx.marked = "keyword";
      return cont(functiondef);
    }
    if (type == "variable") {
      register(value);
      return cont(functiondef);
    }
    if (type == "(") return cont(pushcontext, pushlex(")"), commasep(funarg, ")"), poplex, statement, popcontext);
  }
  function funarg(type) {
    if (type == "spread") return cont(funarg);
    return pass(pattern, maybetype);
  }
  function className(type, value) {
    if (type == "variable") {
      register(value);
      return cont(classNameAfter);
    }
  }
  function classNameAfter(_type, value) {
    if (value == "extends") return cont(expression);
  }
  function objlit(type) {
    if (type == "{") return contCommasep(objprop, "}");
  }
  function afterModule(type, value) {
    if (type == "string") return cont(statement);
    if (type == "variable") {
      register(value);
      return cont(maybeFrom);
    }
  }
  function afterExport(_type, value) {
    if (value == "*") {
      cx.marked = "keyword";
      return cont(maybeFrom, expect(";"));
    }
    if (value == "default") {
      cx.marked = "keyword";
      return cont(expression, expect(";"));
    }
    return pass(statement);
  }
  function afterImport(type) {
    if (type == "string") return cont();
    return pass(importSpec, maybeFrom);
  }
  function importSpec(type, value) {
    if (type == "{") return contCommasep(importSpec, "}");
    if (type == "variable") register(value);
    return cont();
  }
  function maybeFrom(_type, value) {
    if (value == "from") {
      cx.marked = "keyword";
      return cont(expression);
    }
  }
  function arrayLiteral(type) {
    if (type == "]") return cont();
    return pass(expressionNoComma, maybeArrayComprehension);
  }
  function maybeArrayComprehension(type) {
    if (type == "for") return pass(comprehension, expect("]"));
    if (type == ",") return cont(commasep(expressionNoComma, "]"));
    return pass(commasep(expressionNoComma, "]"));
  }
  function comprehension(type) {
    if (type == "for") return cont(forspec, comprehension);
    if (type == "if") return cont(expression, comprehension);
  }
  return {
    startState: function (basecolumn) {
      var state = {
        tokenize: tokenBase,
        lastType: "sof",
        cc: [],
        lexical: new JSLexical((basecolumn || 0) - indentUnit, 0, "block", false),
        localVars: parserConfig.localVars,
        context: parserConfig.localVars && {
          vars: parserConfig.localVars
        },
        indented: 0
      };
      if (parserConfig.globalVars) state.globalVars = parserConfig.globalVars;
      return state;
    },
    token: function (stream, state) {
      if (stream.sol()) {
        if (!state.lexical.hasOwnProperty("align")) state.lexical.align = false;
        state.indented = stream.indentation();
        findFatArrow(stream, state);
      }
      if (state.tokenize != tokenComment && stream.eatSpace()) return null;
      var style = state.tokenize(stream, state);
      if (type == "comment") return style;
      state.lastType = type == "operator" && (content == "++" || content == "--") ? "incdec" : type;
      return parseJS(state, style, type, content, stream);
    },
    indent: function (state, textAfter) {
      if (state.tokenize == tokenComment) return CodeMirror.Pass;
      if (state.tokenize != tokenBase) return 0;
      var firstChar = textAfter && textAfter.charAt(0),
        lexical = state.lexical;
      for (var i = state.cc.length - 1; i >= 0; --i) {
        var c = state.cc[i];
        if (c == poplex) lexical = lexical.prev;else if (c != maybeelse) break;
      }
      if (lexical.type == "stat" && firstChar == "}") lexical = lexical.prev;
      if (statementIndent && lexical.type == ")" && lexical.prev.type == "stat") lexical = lexical.prev;
      var type = lexical.type,
        closing = firstChar == type;
      if (type == "vardef") return lexical.indented + (state.lastType == "operator" || state.lastType == "," ? lexical.info + 1 : 0);else if (type == "form" && firstChar == "{") return lexical.indented;else if (type == "form") return lexical.indented + indentUnit;else if (type == "stat") return lexical.indented + (state.lastType == "operator" || state.lastType == "," ? statementIndent || indentUnit : 0);else if (lexical.info == "switch" && !closing && parserConfig.doubleIndentSwitch != false) return lexical.indented + (/^(?:case|default)\b/.test(textAfter) ? indentUnit : 2 * indentUnit);else if (lexical.align) return lexical.column + (closing ? 0 : 1);else return lexical.indented + (closing ? 0 : indentUnit);
    },
    electricChars: ":{}",
    blockCommentStart: jsonMode ? null : "/*",
    blockCommentEnd: jsonMode ? null : "*/",
    lineComment: jsonMode ? null : "//",
    fold: "brace",
    helperType: jsonMode ? "json" : "javascript",
    jsonMode: jsonMode
  };
});
CodeMirror.defineMIME("text/javascript", "javascript");
CodeMirror.defineMIME("text/ecmascript", "javascript");
CodeMirror.defineMIME("application/javascript", "javascript");
CodeMirror.defineMIME("application/ecmascript", "javascript");
CodeMirror.defineMIME("application/json", {
  name: "javascript",
  json: true
});
CodeMirror.defineMIME("application/x-json", {
  name: "javascript",
  json: true
});
CodeMirror.defineMIME("text/typescript", {
  name: "javascript",
  typescript: true
});
CodeMirror.defineMIME("application/typescript", {
  name: "javascript",
  typescript: true
});
(function () {
  var DEFAULT_MIN_CHARS = 2;
  var DEFAULT_TOKEN_STYLE = "matchhighlight";
  var DEFAULT_DELAY = 100;
  function State(options) {
    if (typeof options == "object") {
      this.minChars = options.minChars;
      this.style = options.style;
      this.showToken = options.showToken;
      this.delay = options.delay;
    }
    if (this.style == null) this.style = DEFAULT_TOKEN_STYLE;
    if (this.minChars == null) this.minChars = DEFAULT_MIN_CHARS;
    if (this.delay == null) this.delay = DEFAULT_DELAY;
    this.overlay = this.timeout = null;
  }
  CodeMirror.defineOption("highlightSelectionMatches", false, function (cm, val, old) {
    if (old && old != CodeMirror.Init) {
      var over = cm.state.matchHighlighter.overlay;
      if (over) cm.removeOverlay(over);
      clearTimeout(cm.state.matchHighlighter.timeout);
      cm.state.matchHighlighter = null;
      cm.off("cursorActivity", cursorActivity);
    }
    if (val) {
      cm.state.matchHighlighter = new State(val);
      highlightMatches(cm);
      cm.on("cursorActivity", cursorActivity);
    }
  });
  function cursorActivity(cm) {
    var state = cm.state.matchHighlighter;
    clearTimeout(state.timeout);
    state.timeout = setTimeout(function () {
      highlightMatches(cm);
    }, state.delay);
  }
  function highlightMatches(cm) {
    cm.operation(function () {
      var state = cm.state.matchHighlighter;
      if (state.overlay) {
        cm.removeOverlay(state.overlay);
        state.overlay = null;
      }
      if (!cm.somethingSelected() && state.showToken) {
        var re = state.showToken === true ? /[\w$]/ : state.showToken;
        var cur = cm.getCursor(),
          line = cm.getLine(cur.line),
          start = cur.ch,
          end = start;
        while (start && re.test(line.charAt(start - 1))) --start;
        while (end < line.length && re.test(line.charAt(end))) ++end;
        if (start < end) cm.addOverlay(state.overlay = makeOverlay(line.slice(start, end), re, state.style));
        return;
      }
      if (cm.getCursor("head").line != cm.getCursor("anchor").line) return;
      var selection = cm.getSelection().replace(/^\s+|\s+$/g, "");
      if (selection.length >= state.minChars) cm.addOverlay(state.overlay = makeOverlay(selection, false, state.style));
    });
  }
  function boundariesAround(stream, re) {
    return (!stream.start || !re.test(stream.string.charAt(stream.start - 1))) && (stream.pos == stream.string.length || !re.test(stream.string.charAt(stream.pos)));
  }
  function makeOverlay(query, hasBoundary, style) {
    return {
      token: function (stream) {
        if (stream.match(query) && (!hasBoundary || boundariesAround(stream, hasBoundary))) return style;
        stream.next();
        stream.skipTo(query.charAt(0)) || stream.skipToEnd();
      }
    };
  }
})();
CodeMirror.defineMode("python", function (conf, parserConf) {
  var ERRORCLASS = "error";
  function wordRegexp(words) {
    return new RegExp("^((" + words.join(")|(") + "))\\b");
  }
  var singleOperators = parserConf.singleOperators || new RegExp("^[\\+\\-\\*/%&|\\^~<>!]");
  var singleDelimiters = parserConf.singleDelimiters || new RegExp("^[\\(\\)\\[\\]\\{\\}@,:`=;\\.]");
  var doubleOperators = parserConf.doubleOperators || new RegExp("^((==)|(!=)|(<=)|(>=)|(<>)|(<<)|(>>)|(//)|(\\*\\*))");
  var doubleDelimiters = parserConf.doubleDelimiters || new RegExp("^((\\+=)|(\\-=)|(\\*=)|(%=)|(/=)|(&=)|(\\|=)|(\\^=))");
  var tripleDelimiters = parserConf.tripleDelimiters || new RegExp("^((//=)|(>>=)|(<<=)|(\\*\\*=))");
  var identifiers = parserConf.identifiers || new RegExp("^[_A-Za-z][_A-Za-z0-9]*");
  var hangingIndent = parserConf.hangingIndent || parserConf.indentUnit;
  var wordOperators = wordRegexp(["and", "or", "not", "is", "in"]);
  var commonkeywords = ["as", "assert", "break", "class", "continue", "def", "del", "elif", "else", "except", "finally", "for", "from", "global", "if", "import", "lambda", "pass", "raise", "return", "try", "while", "with", "yield"];
  var commonBuiltins = ["abs", "all", "any", "bin", "bool", "bytearray", "callable", "chr", "classmethod", "compile", "complex", "delattr", "dict", "dir", "divmod", "enumerate", "eval", "filter", "float", "format", "frozenset", "getattr", "globals", "hasattr", "hash", "help", "hex", "id", "input", "int", "isinstance", "issubclass", "iter", "len", "list", "locals", "map", "max", "memoryview", "min", "next", "object", "oct", "open", "ord", "pow", "property", "range", "repr", "reversed", "round", "set", "setattr", "slice", "sorted", "staticmethod", "str", "sum", "super", "tuple", "type", "vars", "zip", "__import__", "NotImplemented", "Ellipsis", "__debug__"];
  var py2 = {
    builtins: ["apply", "basestring", "buffer", "cmp", "coerce", "execfile", "file", "intern", "long", "raw_input", "reduce", "reload", "unichr", "unicode", "xrange", "False", "True", "None"],
    keywords: ["exec", "print"]
  };
  var py3 = {
    builtins: ["ascii", "bytes", "exec", "print"],
    keywords: ["nonlocal", "False", "True", "None"]
  };
  if (parserConf.extra_keywords != undefined) {
    commonkeywords = commonkeywords.concat(parserConf.extra_keywords);
  }
  if (parserConf.extra_builtins != undefined) {
    commonBuiltins = commonBuiltins.concat(parserConf.extra_builtins);
  }
  if (!!parserConf.version && parseInt(parserConf.version, 10) === 3) {
    commonkeywords = commonkeywords.concat(py3.keywords);
    commonBuiltins = commonBuiltins.concat(py3.builtins);
    var stringPrefixes = new RegExp("^(([rb]|(br))?('{3}|\"{3}|['\"]))", "i");
  } else {
    commonkeywords = commonkeywords.concat(py2.keywords);
    commonBuiltins = commonBuiltins.concat(py2.builtins);
    var stringPrefixes = new RegExp("^(([rub]|(ur)|(br))?('{3}|\"{3}|['\"]))", "i");
  }
  var keywords = wordRegexp(commonkeywords);
  var builtins = wordRegexp(commonBuiltins);
  var indentInfo = null;
  function tokenBase(stream, state) {
    if (stream.sol()) {
      var scopeOffset = state.scopes[0].offset;
      if (stream.eatSpace()) {
        var lineOffset = stream.indentation();
        if (lineOffset > scopeOffset) {
          indentInfo = "indent";
        } else if (lineOffset < scopeOffset) {
          indentInfo = "dedent";
        }
        return null;
      } else {
        if (scopeOffset > 0) {
          dedent(stream, state);
        }
      }
    }
    if (stream.eatSpace()) {
      return null;
    }
    var ch = stream.peek();
    if (ch === "#") {
      stream.skipToEnd();
      return "comment";
    }
    if (stream.match(/^[0-9\.]/, false)) {
      var floatLiteral = false;
      if (stream.match(/^\d*\.\d+(e[\+\-]?\d+)?/i)) {
        floatLiteral = true;
      }
      if (stream.match(/^\d+\.\d*/)) {
        floatLiteral = true;
      }
      if (stream.match(/^\.\d+/)) {
        floatLiteral = true;
      }
      if (floatLiteral) {
        stream.eat(/J/i);
        return "number";
      }
      var intLiteral = false;
      if (stream.match(/^0x[0-9a-f]+/i)) {
        intLiteral = true;
      }
      if (stream.match(/^0b[01]+/i)) {
        intLiteral = true;
      }
      if (stream.match(/^0o[0-7]+/i)) {
        intLiteral = true;
      }
      if (stream.match(/^[1-9]\d*(e[\+\-]?\d+)?/)) {
        stream.eat(/J/i);
        intLiteral = true;
      }
      if (stream.match(/^0(?![\dx])/i)) {
        intLiteral = true;
      }
      if (intLiteral) {
        stream.eat(/L/i);
        return "number";
      }
    }
    if (stream.match(stringPrefixes)) {
      state.tokenize = tokenStringFactory(stream.current());
      return state.tokenize(stream, state);
    }
    if (stream.match(tripleDelimiters) || stream.match(doubleDelimiters)) {
      return null;
    }
    if (stream.match(doubleOperators) || stream.match(singleOperators) || stream.match(wordOperators)) {
      return "operator";
    }
    if (stream.match(singleDelimiters)) {
      return null;
    }
    if (stream.match(keywords)) {
      return "keyword";
    }
    if (stream.match(builtins)) {
      return "builtin";
    }
    if (stream.match(identifiers)) {
      if (state.lastToken == "def" || state.lastToken == "class") {
        return "def";
      }
      return "variable";
    }
    stream.next();
    return ERRORCLASS;
  }
  function tokenStringFactory(delimiter) {
    while ("rub".indexOf(delimiter.charAt(0).toLowerCase()) >= 0) {
      delimiter = delimiter.substr(1);
    }
    var singleline = delimiter.length == 1;
    var OUTCLASS = "string";
    function tokenString(stream, state) {
      while (!stream.eol()) {
        stream.eatWhile(/[^'"\\]/);
        if (stream.eat("\\")) {
          stream.next();
          if (singleline && stream.eol()) {
            return OUTCLASS;
          }
        } else if (stream.match(delimiter)) {
          state.tokenize = tokenBase;
          return OUTCLASS;
        } else {
          stream.eat(/['"]/);
        }
      }
      if (singleline) {
        if (parserConf.singleLineStringErrors) {
          return ERRORCLASS;
        } else {
          state.tokenize = tokenBase;
        }
      }
      return OUTCLASS;
    }
    tokenString.isString = true;
    return tokenString;
  }
  function indent(stream, state, type) {
    type = type || "py";
    var indentUnit = 0;
    if (type === "py") {
      if (state.scopes[0].type !== "py") {
        state.scopes[0].offset = stream.indentation();
        return;
      }
      for (var i = 0; i < state.scopes.length; ++i) {
        if (state.scopes[i].type === "py") {
          indentUnit = state.scopes[i].offset + conf.indentUnit;
          break;
        }
      }
    } else if (stream.match(/\s*($|#)/, false)) {
      indentUnit = stream.indentation() + hangingIndent;
    } else {
      indentUnit = stream.column() + stream.current().length;
    }
    state.scopes.unshift({
      offset: indentUnit,
      type: type
    });
  }
  function dedent(stream, state, type) {
    type = type || "py";
    if (state.scopes.length == 1) return;
    if (state.scopes[0].type === "py") {
      var _indent = stream.indentation();
      var _indent_index = -1;
      for (var i = 0; i < state.scopes.length; ++i) {
        if (_indent === state.scopes[i].offset) {
          _indent_index = i;
          break;
        }
      }
      if (_indent_index === -1) {
        return true;
      }
      while (state.scopes[0].offset !== _indent) {
        state.scopes.shift();
      }
      return false;
    } else {
      if (type === "py") {
        state.scopes[0].offset = stream.indentation();
        return false;
      } else {
        if (state.scopes[0].type != type) {
          return true;
        }
        state.scopes.shift();
        return false;
      }
    }
  }
  function tokenLexer(stream, state) {
    indentInfo = null;
    var style = state.tokenize(stream, state);
    var current = stream.current();
    if (current === ".") {
      style = stream.match(identifiers, false) ? null : ERRORCLASS;
      if (style === null && state.lastStyle === "meta") {
        style = "meta";
      }
      return style;
    }
    if (current === "@") {
      return stream.match(identifiers, false) ? "meta" : ERRORCLASS;
    }
    if ((style === "variable" || style === "builtin") && state.lastStyle === "meta") {
      style = "meta";
    }
    if (current === "pass" || current === "return") {
      state.dedent += 1;
    }
    if (current === "lambda") state.lambda = true;
    if (current === ":" && !state.lambda && state.scopes[0].type == "py" || indentInfo === "indent") {
      indent(stream, state);
    }
    var delimiter_index = "[({".indexOf(current);
    if (delimiter_index !== -1) {
      indent(stream, state, "])}".slice(delimiter_index, delimiter_index + 1));
    }
    if (indentInfo === "dedent") {
      if (dedent(stream, state)) {
        return ERRORCLASS;
      }
    }
    delimiter_index = "])}".indexOf(current);
    if (delimiter_index !== -1) {
      if (dedent(stream, state, current)) {
        return ERRORCLASS;
      }
    }
    if (state.dedent > 0 && stream.eol() && state.scopes[0].type == "py") {
      if (state.scopes.length > 1) state.scopes.shift();
      state.dedent -= 1;
    }
    return style;
  }
  var external = {
    startState: function (basecolumn) {
      return {
        tokenize: tokenBase,
        scopes: [{
          offset: basecolumn || 0,
          type: "py"
        }],
        lastStyle: null,
        lastToken: null,
        lambda: false,
        dedent: 0
      };
    },
    token: function (stream, state) {
      var style = tokenLexer(stream, state);
      state.lastStyle = style;
      var current = stream.current();
      if (current && style) {
        state.lastToken = current;
      }
      if (stream.eol() && state.lambda) {
        state.lambda = false;
      }
      return style;
    },
    indent: function (state) {
      if (state.tokenize != tokenBase) {
        return state.tokenize.isString ? CodeMirror.Pass : 0;
      }
      return state.scopes[0].offset;
    },
    lineComment: "#",
    fold: "indent"
  };
  return external;
});
CodeMirror.defineMIME("text/x-python", "python");
(function () {
  "use strict";

  var words = function (str) {
    return str.split(" ");
  };
  CodeMirror.defineMIME("text/x-cython", {
    name: "python",
    extra_keywords: words("by cdef cimport cpdef ctypedef enum except" + "extern gil include nogil property public" + "readonly struct union DEF IF ELIF ELSE")
  });
})();
(function () {
  var Pos = CodeMirror.Pos;
  function SearchCursor(doc, query, pos, caseFold) {
    this.atOccurrence = false;
    this.doc = doc;
    if (caseFold == null && typeof query == "string") caseFold = false;
    pos = pos ? doc.clipPos(pos) : Pos(0, 0);
    this.pos = {
      from: pos,
      to: pos
    };
    if (typeof query != "string") {
      if (!query.global) query = new RegExp(query.source, query.ignoreCase ? "ig" : "g");
      this.matches = function (reverse, pos) {
        if (reverse) {
          query.lastIndex = 0;
          var line = doc.getLine(pos.line).slice(0, pos.ch),
            cutOff = 0,
            match,
            start;
          for (;;) {
            query.lastIndex = cutOff;
            var newMatch = query.exec(line);
            if (!newMatch) break;
            match = newMatch;
            start = match.index;
            cutOff = match.index + (match[0].length || 1);
            if (cutOff == line.length) break;
          }
          var matchLen = match && match[0].length || 0;
          if (!matchLen) {
            if (start == 0 && line.length == 0) {
              match = undefined;
            } else if (start != doc.getLine(pos.line).length) {
              matchLen++;
            }
          }
        } else {
          query.lastIndex = pos.ch;
          var line = doc.getLine(pos.line),
            match = query.exec(line);
          var matchLen = match && match[0].length || 0;
          var start = match && match.index;
          if (start + matchLen != line.length && !matchLen) matchLen = 1;
        }
        if (match && matchLen) return {
          from: Pos(pos.line, start),
          to: Pos(pos.line, start + matchLen),
          match: match
        };
      };
    } else {
      var origQuery = query;
      if (caseFold) query = query.toLowerCase();
      var fold = caseFold ? function (str) {
        return str.toLowerCase();
      } : function (str) {
        return str;
      };
      var target = query.split("\n");
      if (target.length == 1) {
        if (!query.length) {
          this.matches = function () {};
        } else {
          this.matches = function (reverse, pos) {
            if (reverse) {
              var orig = doc.getLine(pos.line).slice(0, pos.ch),
                line = fold(orig);
              var match = line.lastIndexOf(query);
              if (match > -1) {
                match = adjustPos(orig, line, match);
                return {
                  from: Pos(pos.line, match),
                  to: Pos(pos.line, match + origQuery.length)
                };
              }
            } else {
              var orig = doc.getLine(pos.line).slice(pos.ch),
                line = fold(orig);
              var match = line.indexOf(query);
              if (match > -1) {
                match = adjustPos(orig, line, match) + pos.ch;
                return {
                  from: Pos(pos.line, match),
                  to: Pos(pos.line, match + origQuery.length)
                };
              }
            }
          };
        }
      } else {
        var origTarget = origQuery.split("\n");
        this.matches = function (reverse, pos) {
          var last = target.length - 1;
          if (reverse) {
            if (pos.line - (target.length - 1) < doc.firstLine()) return;
            if (fold(doc.getLine(pos.line).slice(0, origTarget[last].length)) != target[target.length - 1]) return;
            var to = Pos(pos.line, origTarget[last].length);
            for (var ln = pos.line - 1, i = last - 1; i >= 1; --i, --ln) if (target[i] != fold(doc.getLine(ln))) return;
            var line = doc.getLine(ln),
              cut = line.length - origTarget[0].length;
            if (fold(line.slice(cut)) != target[0]) return;
            return {
              from: Pos(ln, cut),
              to: to
            };
          } else {
            if (pos.line + (target.length - 1) > doc.lastLine()) return;
            var line = doc.getLine(pos.line),
              cut = line.length - origTarget[0].length;
            if (fold(line.slice(cut)) != target[0]) return;
            var from = Pos(pos.line, cut);
            for (var ln = pos.line + 1, i = 1; i < last; ++i, ++ln) if (target[i] != fold(doc.getLine(ln))) return;
            if (doc.getLine(ln).slice(0, origTarget[last].length) != target[last]) return;
            return {
              from: from,
              to: Pos(ln, origTarget[last].length)
            };
          }
        };
      }
    }
  }
  SearchCursor.prototype = {
    findNext: function () {
      return this.find(false);
    },
    findPrevious: function () {
      return this.find(true);
    },
    find: function (reverse) {
      var self = this,
        pos = this.doc.clipPos(reverse ? this.pos.from : this.pos.to);
      function savePosAndFail(line) {
        var pos = Pos(line, 0);
        self.pos = {
          from: pos,
          to: pos
        };
        self.atOccurrence = false;
        return false;
      }
      for (;;) {
        if (this.pos = this.matches(reverse, pos)) {
          this.atOccurrence = true;
          return this.pos.match || true;
        }
        if (reverse) {
          if (!pos.line) return savePosAndFail(0);
          pos = Pos(pos.line - 1, this.doc.getLine(pos.line - 1).length);
        } else {
          var maxLine = this.doc.lineCount();
          if (pos.line == maxLine - 1) return savePosAndFail(maxLine);
          pos = Pos(pos.line + 1, 0);
        }
      }
    },
    from: function () {
      if (this.atOccurrence) return this.pos.from;
    },
    to: function () {
      if (this.atOccurrence) return this.pos.to;
    },
    replace: function (newText) {
      if (!this.atOccurrence) return;
      var lines = CodeMirror.splitLines(newText);
      this.doc.replaceRange(lines, this.pos.from, this.pos.to);
      this.pos.to = Pos(this.pos.from.line + lines.length - 1, lines[lines.length - 1].length + (lines.length == 1 ? this.pos.from.ch : 0));
    }
  };
  function adjustPos(orig, folded, pos) {
    if (orig.length == folded.length) return pos;
    for (var pos1 = Math.min(pos, orig.length);;) {
      var len1 = orig.slice(0, pos1).toLowerCase().length;
      if (len1 < pos) ++pos1;else if (len1 > pos) --pos1;else return pos1;
    }
  }
  CodeMirror.defineExtension("getSearchCursor", function (query, pos, caseFold) {
    return new SearchCursor(this.doc, query, pos, caseFold);
  });
  CodeMirror.defineDocExtension("getSearchCursor", function (query, pos, caseFold) {
    return new SearchCursor(this, query, pos, caseFold);
  });
})();
(function () {
  function searchOverlay(query, caseInsensitive) {
    var startChar;
    if (typeof query == "string") {
      startChar = query.charAt(0);
      query = new RegExp("^" + query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), caseInsensitive ? "i" : "");
    } else {
      query = new RegExp("^(?:" + query.source + ")", query.ignoreCase ? "i" : "");
    }
    if (typeof query == "string") return {
      token: function (stream) {
        if (stream.match(query)) return "searching";
        stream.next();
        stream.skipTo(query.charAt(0)) || stream.skipToEnd();
      }
    };
    return {
      token: function (stream) {
        if (stream.match(query)) return "searching";
        while (!stream.eol()) {
          stream.next();
          if (startChar) stream.skipTo(startChar) || stream.skipToEnd();
          if (stream.match(query, false)) break;
        }
      }
    };
  }
  function SearchState() {
    this.posFrom = this.posTo = this.query = null;
    this.overlay = null;
  }
  function getSearchState(cm) {
    return cm.state.search || (cm.state.search = new SearchState());
  }
  function queryCaseInsensitive(query) {
    return typeof query == "string" && query == query.toLowerCase();
  }
  function getSearchCursor(cm, query, pos) {
    return cm.getSearchCursor(query, pos, queryCaseInsensitive(query));
  }
  function dialog(cm, text, shortText, deflt, f) {
    if (cm.openDialog) cm.openDialog(text, f, {
      value: deflt
    });else f(prompt(shortText, deflt));
  }
  function confirmDialog(cm, text, shortText, fs) {
    if (cm.openConfirm) cm.openConfirm(text, fs);else if (confirm(shortText)) fs[0]();
  }
  function parseQuery(query) {
    var isRE = query.match(/^\/(.*)\/([a-z]*)$/);
    return isRE ? new RegExp(isRE[1], isRE[2].indexOf("i") == -1 ? "" : "i") : query;
  }
  var queryDialog = 'Search: <input type="text" style="width: 10em"/> <span style="color: #888">(Use /re/ syntax for regexp search)</span>';
  function doSearch(cm, rev) {
    var state = getSearchState(cm);
    if (state.query) return findNext(cm, rev);
    dialog(cm, queryDialog, "Search for:", cm.getSelection(), function (query) {
      cm.operation(function () {
        if (!query || state.query) return;
        state.query = parseQuery(query);
        cm.removeOverlay(state.overlay, queryCaseInsensitive(state.query));
        state.overlay = searchOverlay(state.query);
        cm.addOverlay(state.overlay);
        state.posFrom = state.posTo = cm.getCursor();
        findNext(cm, rev);
      });
    });
  }
  function findNext(cm, rev) {
    cm.operation(function () {
      var state = getSearchState(cm);
      var cursor = getSearchCursor(cm, state.query, rev ? state.posFrom : state.posTo);
      if (!cursor.find(rev)) {
        cursor = getSearchCursor(cm, state.query, rev ? CodeMirror.Pos(cm.lastLine()) : CodeMirror.Pos(cm.firstLine(), 0));
        if (!cursor.find(rev)) return;
      }
      cm.setSelection(cursor.from(), cursor.to());
      cm.scrollIntoView({
        from: cursor.from(),
        to: cursor.to()
      });
      state.posFrom = cursor.from();
      state.posTo = cursor.to();
    });
  }
  function clearSearch(cm) {
    cm.operation(function () {
      var state = getSearchState(cm);
      if (!state.query) return;
      state.query = null;
      cm.removeOverlay(state.overlay);
    });
  }
  var replaceQueryDialog = 'Replace: <input type="text" style="width: 10em"/> <span style="color: #888">(Use /re/ syntax for regexp search)</span>';
  var replacementQueryDialog = 'With: <input type="text" style="width: 10em"/>';
  var doReplaceConfirm = "Replace? <button>Yes</button> <button>No</button> <button>Stop</button>";
  function replace(cm, all) {
    dialog(cm, replaceQueryDialog, "Replace:", cm.getSelection(), function (query) {
      if (!query) return;
      query = parseQuery(query);
      dialog(cm, replacementQueryDialog, "Replace with:", "", function (text) {
        if (all) {
          cm.operation(function () {
            for (var cursor = getSearchCursor(cm, query); cursor.findNext();) {
              if (typeof query != "string") {
                var match = cm.getRange(cursor.from(), cursor.to()).match(query);
                cursor.replace(text.replace(/\$(\d)/, function (_, i) {
                  return match[i];
                }));
              } else cursor.replace(text);
            }
          });
        } else {
          clearSearch(cm);
          var cursor = getSearchCursor(cm, query, cm.getCursor());
          var advance = function () {
            var start = cursor.from(),
              match;
            if (!(match = cursor.findNext())) {
              cursor = getSearchCursor(cm, query);
              if (!(match = cursor.findNext()) || start && cursor.from().line == start.line && cursor.from().ch == start.ch) return;
            }
            cm.setSelection(cursor.from(), cursor.to());
            cm.scrollIntoView({
              from: cursor.from(),
              to: cursor.to()
            });
            confirmDialog(cm, doReplaceConfirm, "Replace?", [function () {
              doReplace(match);
            }, advance]);
          };
          var doReplace = function (match) {
            cursor.replace(typeof query == "string" ? text : text.replace(/\$(\d)/, function (_, i) {
              return match[i];
            }));
            advance();
          };
          advance();
        }
      });
    });
  }
  CodeMirror.commands.find = function (cm) {
    clearSearch(cm);
    doSearch(cm);
  };
  CodeMirror.commands.findNext = doSearch;
  CodeMirror.commands.findPrev = function (cm) {
    doSearch(cm, true);
  };
  CodeMirror.commands.clearSearch = clearSearch;
  CodeMirror.commands.replace = replace;
  CodeMirror.commands.replaceAll = function (cm) {
    replace(cm, true);
  };
})();
CodeMirror.defineMode("xml", function (config, parserConfig) {
  var indentUnit = config.indentUnit;
  var multilineTagIndentFactor = parserConfig.multilineTagIndentFactor || 1;
  var multilineTagIndentPastTag = parserConfig.multilineTagIndentPastTag || true;
  var Kludges = parserConfig.htmlMode ? {
    autoSelfClosers: {
      area: true,
      base: true,
      br: true,
      col: true,
      command: true,
      embed: true,
      frame: true,
      hr: true,
      img: true,
      input: true,
      keygen: true,
      link: true,
      meta: true,
      param: true,
      source: true,
      track: true,
      wbr: true
    },
    implicitlyClosed: {
      dd: true,
      li: true,
      optgroup: true,
      option: true,
      p: true,
      rp: true,
      rt: true,
      tbody: true,
      td: true,
      tfoot: true,
      th: true,
      tr: true
    },
    contextGrabbers: {
      dd: {
        dd: true,
        dt: true
      },
      dt: {
        dd: true,
        dt: true
      },
      li: {
        li: true
      },
      option: {
        option: true,
        optgroup: true
      },
      optgroup: {
        optgroup: true
      },
      p: {
        address: true,
        article: true,
        aside: true,
        blockquote: true,
        dir: true,
        div: true,
        dl: true,
        fieldset: true,
        footer: true,
        form: true,
        h1: true,
        h2: true,
        h3: true,
        h4: true,
        h5: true,
        h6: true,
        header: true,
        hgroup: true,
        hr: true,
        menu: true,
        nav: true,
        ol: true,
        p: true,
        pre: true,
        section: true,
        table: true,
        ul: true
      },
      rp: {
        rp: true,
        rt: true
      },
      rt: {
        rp: true,
        rt: true
      },
      tbody: {
        tbody: true,
        tfoot: true
      },
      td: {
        td: true,
        th: true
      },
      tfoot: {
        tbody: true
      },
      th: {
        td: true,
        th: true
      },
      thead: {
        tbody: true,
        tfoot: true
      },
      tr: {
        tr: true
      }
    },
    doNotIndent: {
      pre: true
    },
    allowUnquoted: true,
    allowMissing: true
  } : {
    autoSelfClosers: {},
    implicitlyClosed: {},
    contextGrabbers: {},
    doNotIndent: {},
    allowUnquoted: false,
    allowMissing: false
  };
  var alignCDATA = parserConfig.alignCDATA;
  var tagName, type, setStyle;
  function inText(stream, state) {
    function chain(parser) {
      state.tokenize = parser;
      return parser(stream, state);
    }
    var ch = stream.next();
    if (ch == "<") {
      if (stream.eat("!")) {
        if (stream.eat("[")) {
          if (stream.match("CDATA[")) return chain(inBlock("atom", "]]>"));else return null;
        } else if (stream.match("--")) {
          return chain(inBlock("comment", "-->"));
        } else if (stream.match("DOCTYPE", true, true)) {
          stream.eatWhile(/[\w\._\-]/);
          return chain(doctype(1));
        } else {
          return null;
        }
      } else if (stream.eat("?")) {
        stream.eatWhile(/[\w\._\-]/);
        state.tokenize = inBlock("meta", "?>");
        return "meta";
      } else {
        var isClose = stream.eat("/");
        tagName = "";
        var c;
        while (c = stream.eat(/[^\s\u00a0=<>\"\'\/?]/)) tagName += c;
        if (!tagName) return "tag error";
        type = isClose ? "closeTag" : "openTag";
        state.tokenize = inTag;
        return "tag";
      }
    } else if (ch == "&") {
      var ok;
      if (stream.eat("#")) {
        if (stream.eat("x")) {
          ok = stream.eatWhile(/[a-fA-F\d]/) && stream.eat(";");
        } else {
          ok = stream.eatWhile(/[\d]/) && stream.eat(";");
        }
      } else {
        ok = stream.eatWhile(/[\w\.\-:]/) && stream.eat(";");
      }
      return ok ? "atom" : "error";
    } else {
      stream.eatWhile(/[^&<]/);
      return null;
    }
  }
  function inTag(stream, state) {
    var ch = stream.next();
    if (ch == ">" || ch == "/" && stream.eat(">")) {
      state.tokenize = inText;
      type = ch == ">" ? "endTag" : "selfcloseTag";
      return "tag";
    } else if (ch == "=") {
      type = "equals";
      return null;
    } else if (ch == "<") {
      state.tokenize = inText;
      state.state = baseState;
      state.tagName = state.tagStart = null;
      var next = state.tokenize(stream, state);
      return next ? next + " error" : "error";
    } else if (/[\'\"]/.test(ch)) {
      state.tokenize = inAttribute(ch);
      state.stringStartCol = stream.column();
      return state.tokenize(stream, state);
    } else {
      stream.eatWhile(/[^\s\u00a0=<>\"\']/);
      return "word";
    }
  }
  function inAttribute(quote) {
    var closure = function (stream, state) {
      while (!stream.eol()) {
        if (stream.next() == quote) {
          state.tokenize = inTag;
          break;
        }
      }
      return "string";
    };
    closure.isInAttribute = true;
    return closure;
  }
  function inBlock(style, terminator) {
    return function (stream, state) {
      while (!stream.eol()) {
        if (stream.match(terminator)) {
          state.tokenize = inText;
          break;
        }
        stream.next();
      }
      return style;
    };
  }
  function doctype(depth) {
    return function (stream, state) {
      var ch;
      while ((ch = stream.next()) != null) {
        if (ch == "<") {
          state.tokenize = doctype(depth + 1);
          return state.tokenize(stream, state);
        } else if (ch == ">") {
          if (depth == 1) {
            state.tokenize = inText;
            break;
          } else {
            state.tokenize = doctype(depth - 1);
            return state.tokenize(stream, state);
          }
        }
      }
      return "meta";
    };
  }
  function Context(state, tagName, startOfLine) {
    this.prev = state.context;
    this.tagName = tagName;
    this.indent = state.indented;
    this.startOfLine = startOfLine;
    if (Kludges.doNotIndent.hasOwnProperty(tagName) || state.context && state.context.noIndent) this.noIndent = true;
  }
  function popContext(state) {
    if (state.context) state.context = state.context.prev;
  }
  function maybePopContext(state, nextTagName) {
    var parentTagName;
    while (true) {
      if (!state.context) {
        return;
      }
      parentTagName = state.context.tagName.toLowerCase();
      if (!Kludges.contextGrabbers.hasOwnProperty(parentTagName) || !Kludges.contextGrabbers[parentTagName].hasOwnProperty(nextTagName)) {
        return;
      }
      popContext(state);
    }
  }
  function baseState(type, stream, state) {
    if (type == "openTag") {
      state.tagName = tagName;
      state.tagStart = stream.column();
      return attrState;
    } else if (type == "closeTag") {
      var err = false;
      if (state.context) {
        if (state.context.tagName != tagName) {
          if (Kludges.implicitlyClosed.hasOwnProperty(state.context.tagName.toLowerCase())) popContext(state);
          err = !state.context || state.context.tagName != tagName;
        }
      } else {
        err = true;
      }
      if (err) setStyle = "error";
      return err ? closeStateErr : closeState;
    } else {
      return baseState;
    }
  }
  function closeState(type, _stream, state) {
    if (type != "endTag") {
      setStyle = "error";
      return closeState;
    }
    popContext(state);
    return baseState;
  }
  function closeStateErr(type, stream, state) {
    setStyle = "error";
    return closeState(type, stream, state);
  }
  function attrState(type, _stream, state) {
    if (type == "word") {
      setStyle = "attribute";
      return attrEqState;
    } else if (type == "endTag" || type == "selfcloseTag") {
      var tagName = state.tagName,
        tagStart = state.tagStart;
      state.tagName = state.tagStart = null;
      if (type == "selfcloseTag" || Kludges.autoSelfClosers.hasOwnProperty(tagName.toLowerCase())) {
        maybePopContext(state, tagName.toLowerCase());
      } else {
        maybePopContext(state, tagName.toLowerCase());
        state.context = new Context(state, tagName, tagStart == state.indented);
      }
      return baseState;
    }
    setStyle = "error";
    return attrState;
  }
  function attrEqState(type, stream, state) {
    if (type == "equals") return attrValueState;
    if (!Kludges.allowMissing) setStyle = "error";
    return attrState(type, stream, state);
  }
  function attrValueState(type, stream, state) {
    if (type == "string") return attrContinuedState;
    if (type == "word" && Kludges.allowUnquoted) {
      setStyle = "string";
      return attrState;
    }
    setStyle = "error";
    return attrState(type, stream, state);
  }
  function attrContinuedState(type, stream, state) {
    if (type == "string") return attrContinuedState;
    return attrState(type, stream, state);
  }
  return {
    startState: function () {
      return {
        tokenize: inText,
        state: baseState,
        indented: 0,
        tagName: null,
        tagStart: null,
        context: null
      };
    },
    token: function (stream, state) {
      if (!state.tagName && stream.sol()) state.indented = stream.indentation();
      if (stream.eatSpace()) return null;
      tagName = type = null;
      var style = state.tokenize(stream, state);
      if ((style || type) && style != "comment") {
        setStyle = null;
        state.state = state.state(type || style, stream, state);
        if (setStyle) style = setStyle == "error" ? style + " error" : setStyle;
      }
      return style;
    },
    indent: function (state, textAfter, fullLine) {
      var context = state.context;
      if (state.tokenize.isInAttribute) {
        return state.stringStartCol + 1;
      }
      if (context && context.noIndent) return CodeMirror.Pass;
      if (state.tokenize != inTag && state.tokenize != inText) return fullLine ? fullLine.match(/^(\s*)/)[0].length : 0;
      if (state.tagName) {
        if (multilineTagIndentPastTag) return state.tagStart + state.tagName.length + 2;else return state.tagStart + indentUnit * multilineTagIndentFactor;
      }
      if (alignCDATA && /<!\[CDATA\[/.test(textAfter)) return 0;
      if (context && /^<\//.test(textAfter)) context = context.prev;
      while (context && !context.startOfLine) context = context.prev;
      if (context) return context.indent + indentUnit;else return 0;
    },
    electricChars: "/",
    blockCommentStart: "<!--",
    blockCommentEnd: "-->",
    configuration: parserConfig.htmlMode ? "html" : "xml",
    helperType: parserConfig.htmlMode ? "html" : "xml"
  };
});
CodeMirror.defineMIME("text/xml", "xml");
CodeMirror.defineMIME("application/xml", "xml");
if (!CodeMirror.mimeModes.hasOwnProperty("text/html")) CodeMirror.defineMIME("text/html", {
  name: "xml",
  htmlMode: true
});
CodeMirror.defineMode("yaml", function () {
  var cons = ["true", "false", "on", "off", "yes", "no"];
  var keywordRegex = new RegExp("\\b((" + cons.join(")|(") + "))$", "i");
  return {
    token: function (stream, state) {
      var ch = stream.peek();
      var esc = state.escaped;
      state.escaped = false;
      if (ch == "#" && (stream.pos == 0 || /\s/.test(stream.string.charAt(stream.pos - 1)))) {
        stream.skipToEnd();
        return "comment";
      }
      if (state.literal && stream.indentation() > state.keyCol) {
        stream.skipToEnd();
        return "string";
      } else if (state.literal) {
        state.literal = false;
      }
      if (stream.sol()) {
        state.keyCol = 0;
        state.pair = false;
        state.pairStart = false;
        if (stream.match(/---/)) {
          return "def";
        }
        if (stream.match(/\.\.\./)) {
          return "def";
        }
        if (stream.match(/\s*-\s+/)) {
          return "meta";
        }
      }
      if (stream.match(/^(\{|\}|\[|\])/)) {
        if (ch == "{") state.inlinePairs++;else if (ch == "}") state.inlinePairs--;else if (ch == "[") state.inlineList++;else state.inlineList--;
        return "meta";
      }
      if (state.inlineList > 0 && !esc && ch == ",") {
        stream.next();
        return "meta";
      }
      if (state.inlinePairs > 0 && !esc && ch == ",") {
        state.keyCol = 0;
        state.pair = false;
        state.pairStart = false;
        stream.next();
        return "meta";
      }
      if (state.pairStart) {
        if (stream.match(/^\s*(\||\>)\s*/)) {
          state.literal = true;
          return "meta";
        }
        if (stream.match(/^\s*(\&|\*)[a-z0-9\._-]+\b/i)) {
          return "variable-2";
        }
        if (state.inlinePairs == 0 && stream.match(/^\s*-?[0-9\.\,]+\s?$/)) {
          return "number";
        }
        if (state.inlinePairs > 0 && stream.match(/^\s*-?[0-9\.\,]+\s?(?=(,|}))/)) {
          return "number";
        }
        if (stream.match(keywordRegex)) {
          return "keyword";
        }
      }
      if (!state.pair && stream.match(/^\s*\S+(?=\s*:($|\s))/i)) {
        state.pair = true;
        state.keyCol = stream.indentation();
        return "atom";
      }
      if (state.pair && stream.match(/^:\s*/)) {
        state.pairStart = true;
        return "meta";
      }
      state.pairStart = false;
      state.escaped = ch == "\\";
      stream.next();
      return null;
    },
    startState: function () {
      return {
        pair: false,
        pairStart: false,
        keyCol: 0,
        inlinePairs: 0,
        inlineList: 0,
        literal: false,
        escaped: false
      };
    }
  };
});
CodeMirror.defineMIME("text/x-yaml", "yaml");
(function () {
  function dialogDiv(cm, template, bottom) {
    var wrap = cm.getWrapperElement();
    var dialog;
    dialog = wrap.appendChild(document.createElement("div"));
    if (bottom) {
      dialog.className = "CodeMirror-dialog CodeMirror-dialog-bottom";
    } else {
      dialog.className = "CodeMirror-dialog CodeMirror-dialog-top";
    }
    if (typeof template == "string") {
      dialog.innerHTML = template;
    } else {
      dialog.appendChild(template);
    }
    return dialog;
  }
  function closeNotification(cm, newVal) {
    if (cm.state.currentNotificationClose) cm.state.currentNotificationClose();
    cm.state.currentNotificationClose = newVal;
  }
  CodeMirror.defineExtension("openDialog", function (template, callback, options) {
    closeNotification(this, null);
    var dialog = dialogDiv(this, template, options && options.bottom);
    var closed = false,
      me = this;
    function close() {
      if (closed) return;
      closed = true;
      dialog.parentNode.removeChild(dialog);
    }
    var inp = dialog.getElementsByTagName("input")[0],
      button;
    if (inp) {
      if (options && options.value) inp.value = options.value;
      CodeMirror.on(inp, "keydown", function (e) {
        if (options && options.onKeyDown && options.onKeyDown(e, inp.value, close)) {
          return;
        }
        if (e.keyCode == 13 || e.keyCode == 27) {
          CodeMirror.e_stop(e);
          close();
          me.focus();
          if (e.keyCode == 13) callback(inp.value);
        }
      });
      if (options && options.onKeyUp) {
        CodeMirror.on(inp, "keyup", function (e) {
          options.onKeyUp(e, inp.value, close);
        });
      }
      if (options && options.value) inp.value = options.value;
      inp.focus();
      CodeMirror.on(inp, "blur", close);
    } else if (button = dialog.getElementsByTagName("button")[0]) {
      CodeMirror.on(button, "click", function () {
        close();
        me.focus();
      });
      button.focus();
      CodeMirror.on(button, "blur", close);
    }
    return close;
  });
  CodeMirror.defineExtension("openConfirm", function (template, callbacks, options) {
    closeNotification(this, null);
    var dialog = dialogDiv(this, template, options && options.bottom);
    var buttons = dialog.getElementsByTagName("button");
    var closed = false,
      me = this,
      blurring = 1;
    function close() {
      if (closed) return;
      closed = true;
      dialog.parentNode.removeChild(dialog);
      me.focus();
    }
    buttons[0].focus();
    for (var i = 0; i < buttons.length; ++i) {
      var b = buttons[i];
      (function (callback) {
        CodeMirror.on(b, "click", function (e) {
          CodeMirror.e_preventDefault(e);
          close();
          if (callback) callback(me);
        });
      })(callbacks[i]);
      CodeMirror.on(b, "blur", function () {
        --blurring;
        setTimeout(function () {
          if (blurring <= 0) close();
        }, 200);
      });
      CodeMirror.on(b, "focus", function () {
        ++blurring;
      });
    }
  });
  CodeMirror.defineExtension("openNotification", function (template, options) {
    closeNotification(this, close);
    var dialog = dialogDiv(this, template, options && options.bottom);
    var duration = options && (options.duration === undefined ? 5e3 : options.duration);
    var closed = false,
      doneTimer;
    function close() {
      if (closed) return;
      closed = true;
      clearTimeout(doneTimer);
      dialog.parentNode.removeChild(dialog);
    }
    CodeMirror.on(dialog, "click", function (e) {
      CodeMirror.e_preventDefault(e);
      close();
    });
    if (duration) doneTimer = setTimeout(close, options.duration);
  });
})();

/*** EXPORTS FROM exports-loader ***/
module.exports = window.CodeMirror;

/***/ },

/***/ "./static/js/xmodule.js"
/*!******************************!*\
  !*** ./static/js/xmodule.js ***!
  \******************************/
(module, __unused_webpack_exports, __webpack_require__) {

/* provided dependency */ var _ = __webpack_require__(/*! underscore */ "underscore");
/* provided dependency */ var $ = __webpack_require__(/*! jquery */ "jquery");
/*** IMPORTS FROM imports-loader ***/
(function() {

(function() {
    'use strict';

    var XModule = {};

    XModule.Descriptor = (function() {
        /*
         * Bind the module to an element. This may be called multiple times,
         * if the element content has changed and so the module needs to be rebound
         *
         * @method: constructor
         * @param {html element} the .xmodule_edit section containing all of the descriptor content
         */
        var Descriptor = function(element) {
            this.element = element;
            this.update = _.bind(this.update, this);
        };

        /*
         * Register a callback method to be called when the state of this
         * descriptor is updated. The callback will be passed the results
         * of calling the save method on this descriptor.
         */
        Descriptor.prototype.onUpdate = function(callback) {
            if (!this.callbacks) {
                this.callbacks = [];
            }

            this.callbacks.push(callback);
        };

        /*
         * Notify registered callbacks that the state of this descriptor has changed
         */
        Descriptor.prototype.update = function() {
            var data, callbacks, i, length;

            data = this.save();
            callbacks = this.callbacks;
            length = callbacks.length;

            $.each(callbacks, function(index, callback) {
                callback(data);
            });
        };

        /*
         * Return the current state of the descriptor (to be written to the module store)
         *
         * @method: save
         * @returns {object} An object containing children and data attributes (both optional).
         *                   The contents of the attributes will be saved to the server
         */
        Descriptor.prototype.save = function() {
            return {};
        };

        return Descriptor;
    }());

    this.XBlockToXModuleShim = function(runtime, element, initArgs) {
        /*
         * Load a single module (either an edit module or a display module)
         * from the supplied element, which should have a data-type attribute
         * specifying the class to load
         */
        var moduleType, module;

        if (initArgs) {
            moduleType = initArgs['xmodule-type'];
        }
        if (!moduleType) {
            moduleType = $(element).data('type');
        }

        if (moduleType === 'None') {
            return;
        }

        try {
            module = new window[moduleType](element, runtime);

            if ($(element).hasClass('xmodule_edit')) {
                $(document).trigger('XModule.loaded.edit', [element, module]);
            }

            if ($(element).hasClass('xmodule_display')) {
                $(document).trigger('XModule.loaded.display', [element, module]);
            }

            return module;
        } catch (error) {
            console.error('Unable to load ' + moduleType + ': ' + error.message);
        }
    };

    // Export this module. We do it at the end when everything is ready
    // because some RequireJS scripts require this module. If
    // `window.XModule` appears as defined before this file has a chance
    // to execute fully, then there is a chance that RequireJS will execute
    // some script prematurely.
    this.XModule = XModule;
}).call(this);

}.call(window));

/*** EXPORTS FROM exports-loader ***/
module.exports = window.XModule;

/***/ },

/***/ "./static/js/collapsible.js"
/*!**********************************!*\
  !*** ./static/js/collapsible.js ***!
  \**********************************/
(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

/* provided dependency */ var $ = __webpack_require__(/*! jquery */ "jquery");
/* provided dependency */ var __webpack_provided_edx_dot_HtmlUtils = __webpack_require__(/*! edx-ui-toolkit/js/utils/html-utils */ "../../../node_modules/edx-ui-toolkit/src/js/utils/html-utils.js");
/*** IMPORTS FROM imports-loader ***/
(function() {

// eslint-disable-next-line no-shadow-restricted-names
(function (undefined) {
  "use strict";

  // [module Collapsible]
  //
  // [description]
  //     Set of library functions that provide a simple way to add
  //     collapsible functionality to elements.
  this.Collapsible = {
    setCollapsibles: setCollapsibles,
    toggleFull: toggleFull,
    toggleHint: toggleHint,
  };

  // eslint-disable-next-line no-useless-return
  return;

  // [function setCollapsibles]
  //
  // [description]
  //     Scan element's content for generic collapsible containers.
  //
  // [params]
  //     el: container
  function setCollapsibles(el) {
    var linkBottom, linkTop, short_custom;

    linkTop = '<a href="#" class="full full-top">See full output</a>';
    linkBottom = '<a href="#" class="full full-bottom">See full output</a>';

    // Standard longform + shortfom pattern.
    el.find(".longform").hide();
    el.find(".shortform").append(linkTop, linkBottom); // xss-lint: disable=javascript-jquery-append

    // Custom longform + shortform text pattern.
    short_custom = el.find(".shortform-custom");

    // Set up each one individually.
    short_custom.each(function (index, elt) {
      var close_text, open_text;

      open_text = $(elt).data("open-text");
      close_text = $(elt).data("close-text");
      __webpack_provided_edx_dot_HtmlUtils.append(
        $(elt),
        __webpack_provided_edx_dot_HtmlUtils.joinHtml(
          __webpack_provided_edx_dot_HtmlUtils.HTML("<a href='#' class='full-custom'>"),
          gettext(open_text),
          __webpack_provided_edx_dot_HtmlUtils.HTML("</a>"),
        ),
      );

      $(elt)
        .find(".full-custom")
        .click(function (event) {
          Collapsible.toggleFull(event, open_text, close_text);
        });
    });

    // Collapsible pattern.
    el.find(".collapsible header + section").hide();

    // Set up triggers.
    el.find(".full").click(function (event) {
      Collapsible.toggleFull(event, "See full output", "Hide output");
    });
    el.find(".collapsible header a").click(Collapsible.toggleHint);
  }

  // [function toggleFull]
  //
  // [description]
  //     Toggle the display of full text for a collapsible element.
  //
  // [params]
  //     event: jQuery event object associated with the event that
  //         triggered this callback function.
  //     open_text: text that should be displayed when the collapsible
  //         is open.
  //     close_text: text that should be displayed when the collapsible
  //         is closed.
  function toggleFull(event, open_text, close_text) {
    var $el, new_text, parent;

    event.preventDefault();

    parent = $(event.target).parent();
    parent.siblings().slideToggle();
    parent.parent().toggleClass("open");

    if ($(event.target).text() === open_text) {
      new_text = close_text;
    } else {
      new_text = open_text;
    }

    if ($(event.target).hasClass("full")) {
      $el = parent.find(".full");
    } else {
      $el = $(event.target);
    }

    $el.text(new_text);
  }

  // [function toggleHint]
  //
  // [description]
  //     Toggle the collapsible open to show the hint.
  //
  // [params]
  //     event: jQuery event object associated with the event that
  //         triggered this callback function.
  function toggleHint(event) {
    event.preventDefault();

    $(event.target).parent().siblings().slideToggle();
    $(event.target).parent().parent().toggleClass("open");
  }
}).call(this);

}.call(window));

/***/ },

/***/ "./static/js/display.js"
/*!******************************!*\
  !*** ./static/js/display.js ***!
  \******************************/
(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

/* provided dependency */ var $ = __webpack_require__(/*! jquery */ "jquery");
/* provided dependency */ var __webpack_provided_edx_dot_HtmlUtils = __webpack_require__(/*! edx-ui-toolkit/js/utils/html-utils */ "../../../node_modules/edx-ui-toolkit/src/js/utils/html-utils.js");
/* provided dependency */ var CodeMirror = __webpack_require__(/*! codemirror */ "./static/js/vendor/codemirror-compressed.js");
/*** IMPORTS FROM imports-loader ***/
(function() {

/* global MathJax, Collapsible, interpolate, JavascriptLoader, Logger, CodeMirror */
// Note: this code was originally converted from CoffeeScript, and thus follows some
// coding conventions that are discouraged by eslint. Some warnings have been suppressed
// to avoid substantial rewriting of the code. Allow the eslint suppressions to exceed
// the max line length of 120.
/* eslint max-len: ["error", 120, { "ignoreComments": true }] */

(function () {
  "use strict";

  var indexOfHelper =
    [].indexOf ||
    function (item) {
      var i, len;
      for (i = 0, len = this.length; i < len; i++) {
        if (i in this && this[i] === item) {
          return i;
        }
      }
      return -1;
    };

  this.Problem = function () {
    function Problem(runtime, element) {
      var that = this;
      this.hint_button = function () {
        return Problem.prototype.hint_button.apply(that, arguments);
      };
      this.enableSubmitButtonAfterTimeout = function () {
        return Problem.prototype.enableSubmitButtonAfterTimeout.apply(that, arguments);
      };
      this.enableSubmitButtonAfterResponse = function () {
        return Problem.prototype.enableSubmitButtonAfterResponse.apply(that, arguments);
      };
      this.enableSubmitButton = function (enable, changeText) {
        if (changeText === null || changeText === undefined) {
          changeText = true; // eslint-disable-line no-param-reassign
        }
        return Problem.prototype.enableSubmitButton.apply(that, arguments);
      };
      this.disableAllButtonsWhileRunning = function (
        operationCallback,
        isFromCheckOperation, // eslint-disable-line no-unused-vars
      ) {
        return Problem.prototype.disableAllButtonsWhileRunning.apply(that, arguments);
      };
      this.submitAnswersAndSubmitButton = function (bind) {
        if (bind === null || bind === undefined) {
          bind = false; // eslint-disable-line no-param-reassign
        }
        return Problem.prototype.submitAnswersAndSubmitButton.apply(that, arguments);
      };
      this.refreshAnswers = function () {
        return Problem.prototype.refreshAnswers.apply(that, arguments);
      };
      this.updateMathML = function (jax, el) {
        // eslint-disable-line no-unused-vars
        return Problem.prototype.updateMathML.apply(that, arguments);
      };
      this.refreshMath = function (event, el) {
        // eslint-disable-line no-unused-vars
        return Problem.prototype.refreshMath.apply(that, arguments);
      };
      this.save_internal = function () {
        return Problem.prototype.save_internal.apply(that, arguments);
      };
      this.save = function () {
        return Problem.prototype.save.apply(that, arguments);
      };
      this.gentle_alert = function (msg) {
        // eslint-disable-line no-unused-vars
        return Problem.prototype.gentle_alert.apply(that, arguments);
      };
      this.clear_all_notifications = function () {
        return Problem.prototype.clear_all_notifications.apply(that, arguments);
      };
      this.show = function () {
        return Problem.prototype.show.apply(that, arguments);
      };
      this.reset_internal = function () {
        return Problem.prototype.reset_internal.apply(that, arguments);
      };
      this.reset = function () {
        return Problem.prototype.reset.apply(that, arguments);
      };
      this.get_sr_status = function (contents) {
        // eslint-disable-line no-unused-vars
        return Problem.prototype.get_sr_status.apply(that, arguments);
      };
      this.submit_internal = function () {
        return Problem.prototype.submit_internal.apply(that, arguments);
      };
      this.submit = function () {
        return Problem.prototype.submit.apply(that, arguments);
      };
      this.submit_fd = function () {
        return Problem.prototype.submit_fd.apply(that, arguments);
      };
      this.focus_on_save_notification = function () {
        return Problem.prototype.focus_on_save_notification.apply(that, arguments);
      };
      this.focus_on_hint_notification = function () {
        return Problem.prototype.focus_on_hint_notification.apply(that, arguments);
      };
      this.focus_on_submit_notification = function () {
        return Problem.prototype.focus_on_submit_notification.apply(that, arguments);
      };
      this.focus_on_notification = function (type) {
        // eslint-disable-line no-unused-vars
        return Problem.prototype.focus_on_notification.apply(that, arguments);
      };
      this.scroll_to_problem_meta = function () {
        return Problem.prototype.scroll_to_problem_meta.apply(that, arguments);
      };
      this.submit_save_waitfor = function (callback) {
        // eslint-disable-line no-unused-vars
        return Problem.prototype.submit_save_waitfor.apply(that, arguments);
      };
      this.setupInputTypes = function () {
        return Problem.prototype.setupInputTypes.apply(that, arguments);
      };
      this.poll = function (
        prevTimeout,
        focusCallback, // eslint-disable-line no-unused-vars
      ) {
        return Problem.prototype.poll.apply(that, arguments);
      };
      this.queueing = function (focusCallback) {
        // eslint-disable-line no-unused-vars
        return Problem.prototype.queueing.apply(that, arguments);
      };
      this.forceUpdate = function (response) {
        // eslint-disable-line no-unused-vars
        return Problem.prototype.forceUpdate.apply(that, arguments);
      };
      this.updateProgress = function (response) {
        // eslint-disable-line no-unused-vars
        return Problem.prototype.updateProgress.apply(that, arguments);
      };
      this.renderProgressState = function () {
        return Problem.prototype.renderProgressState.apply(that, arguments);
      };
      this.bind = function () {
        return Problem.prototype.bind.apply(that, arguments);
      };
      this.el = $(element).find(".problems-wrapper");
      this.id = this.el.data("problem-id");
      this.element_id = this.el.attr("id");
      this.url = this.el.data("url");
      this.content = this.el.data("content");

      // has_timed_out and has_response are used to ensure that
      // we wait a minimum of ~ 1s before transitioning the submit
      // button from disabled to enabled
      this.has_timed_out = false;
      this.has_response = false;
      this.render(this.content);
    }

    Problem.prototype.$ = function (selector) {
      return $(selector, this.el);
    };

    Problem.prototype.bind = function () {
      var problemPrefix,
        that = this;
      if (typeof MathJax !== "undefined" && MathJax !== null) {
        this.el.find(".problem > div").each(function (index, element) {
          return MathJax.Hub.Queue(["Typeset", MathJax.Hub, element]);
        });
      }
      if (window.hasOwnProperty("update_schematics")) {
        window.update_schematics();
      }
      problemPrefix = this.element_id.replace(/problem_/, "");
      this.inputs = this.$('[id^="input_' + problemPrefix + '_"]');
      this.$("div.action button").click(this.refreshAnswers);
      this.reviewButton = this.$(".notification-btn.review-btn");
      this.reviewButton.click(this.scroll_to_problem_meta);
      this.submitButton = this.$(".action .submit");
      this.submitButtonLabel = this.$(".action .submit .submit-label");
      this.submitButtonSubmitText = this.submitButtonLabel.text();
      this.submitButtonSubmittingText = this.submitButton.data("submitting");
      this.submitButton.click(this.submit_fd);
      this.hintButton = this.$(".action .hint-button");
      this.hintButton.click(this.hint_button);
      this.resetButton = this.$(".action .reset");
      this.resetButton.click(this.reset);
      this.showButton = this.$(".action .show");
      this.showButton.click(this.show);
      this.saveButton = this.$(".action .save");
      this.saveNotification = this.$(".notification-save");
      this.showAnswerNotification = this.$(".notification-show-answer");
      this.saveButton.click(this.save);
      this.gentleAlertNotification = this.$(".notification-gentle-alert");
      this.submitNotification = this.$(".notification-submit");

      // Accessibility helper for sighted keyboard users to show <clarification> tooltips on focus:
      this.$(".clarification").focus(function (ev) {
        var icon;
        icon = $(ev.target).children("i");
        return window.globalTooltipManager.openTooltip(icon);
      });
      this.$(".clarification").blur(function () {
        return window.globalTooltipManager.hide();
      });
      this.$(".review-btn").focus(function (ev) {
        return $(ev.target).removeClass("sr");
      });
      this.$(".review-btn").blur(function (ev) {
        return $(ev.target).addClass("sr");
      });
      this.bindResetCorrectness();
      if (this.submitButton.length) {
        this.submitAnswersAndSubmitButton(true);
      }
      Collapsible.setCollapsibles(this.el);
      this.$("input.math").keyup(this.refreshMath);
      if (typeof MathJax !== "undefined" && MathJax !== null) {
        this.$("input.math").each(function (index, element) {
          return MathJax.Hub.Queue([that.refreshMath, null, element]);
        });
      }
    };

    Problem.prototype.renderProgressState = function () {
      var graded, progress, progressTemplate, curScore, totalScore, attemptsUsed;
      curScore = this.el.data("problem-score");
      totalScore = this.el.data("problem-total-possible");
      attemptsUsed = this.el.data("attempts-used");
      graded = this.el.data("graded");

      // The problem is ungraded if it's explicitly marked as such, or if the total possible score is 0
      if (graded === "True" && totalScore !== 0) {
        graded = true;
      } else {
        graded = false;
      }

      if (curScore === undefined || totalScore === undefined) {
        // Render an empty string.
        progressTemplate = "";
      } else if (curScore === null || curScore === "None") {
        // Render 'x point(s) possible (un/graded, results hidden)' if no current score provided.
        if (graded) {
          progressTemplate = ngettext(
            // Translators: {num_points} is the number of points possible (examples: 1, 3, 10).;
            "{num_points} point possible (graded, results hidden)",
            "{num_points} points possible (graded, results hidden)",
            totalScore,
          );
        } else {
          progressTemplate = ngettext(
            // Translators: {num_points} is the number of points possible (examples: 1, 3, 10).;
            "{num_points} point possible (ungraded, results hidden)",
            "{num_points} points possible (ungraded, results hidden)",
            totalScore,
          );
        }
      } else if ((attemptsUsed === 0 || totalScore === 0) && curScore === 0) {
        // Render 'x point(s) possible' if student has not yet attempted question
        // But if staff has overridden score to a non-zero number, show it
        if (graded) {
          progressTemplate = ngettext(
            // Translators: {num_points} is the number of points possible (examples: 1, 3, 10).;
            "{num_points} point possible (graded)",
            "{num_points} points possible (graded)",
            totalScore,
          );
        } else {
          progressTemplate = ngettext(
            // Translators: {num_points} is the number of points possible (examples: 1, 3, 10).;
            "{num_points} point possible (ungraded)",
            "{num_points} points possible (ungraded)",
            totalScore,
          );
        }
      } else {
        // Render 'x/y point(s)' if student has attempted question
        if (graded) {
          progressTemplate = ngettext(
            // This comment needs to be on one line to be properly scraped for the translators.
            // Translators: {earned} is the number of points earned. {possible} is the total number of points (examples: 0/1, 1/1, 2/3, 5/10). The total number of points will always be at least 1. We pluralize based on the total number of points (example: 0/1 point; 1/2 points);
            "{earned}/{possible} point (graded)",
            "{earned}/{possible} points (graded)",
            totalScore,
          );
        } else {
          progressTemplate = ngettext(
            // This comment needs to be on one line to be properly scraped for the translators.
            // Translators: {earned} is the number of points earned. {possible} is the total number of points (examples: 0/1, 1/1, 2/3, 5/10). The total number of points will always be at least 1. We pluralize based on the total number of points (example: 0/1 point; 1/2 points);
            "{earned}/{possible} point (ungraded)",
            "{earned}/{possible} points (ungraded)",
            totalScore,
          );
        }
      }
      progress = edx.StringUtils.interpolate(progressTemplate, {
        earned: curScore,
        num_points: totalScore,
        possible: totalScore,
      });
      return this.$(".problem-progress").text(progress);
    };

    Problem.prototype.updateProgress = function (response) {
      if (response.progress_changed) {
        this.el.data("problem-score", this.convertToFloat(response.current_score));
        this.el.data("problem-total-possible", this.convertToFloat(response.total_possible));
        this.el.data("attempts-used", response.attempts_used);
        this.el.trigger("progressChanged");
      }
      return this.renderProgressState();
    };

    Problem.prototype.convertToFloat = function (num) {
      if (typeof num !== "number" || !Number.isInteger(num)) {
        return num;
      }
      return num.toFixed(1);
    };

    Problem.prototype.forceUpdate = function (response) {
      this.el.data("problem-score", response.current_score);
      this.el.data("problem-total-possible", response.total_possible);
      this.el.data("attempts-used", response.attempts_used);
      this.el.trigger("progressChanged");
      return this.renderProgressState();
    };

    Problem.prototype.queueing = function (focusCallback) {
      var that = this;
      this.queued_items = this.$(".xqueue");
      this.num_queued_items = this.queued_items.length;
      if (this.num_queued_items > 0) {
        if (window.queuePollerID) {
          // Only one poller 'thread' per Problem
          window.clearTimeout(window.queuePollerID);
        }
        window.queuePollerID = window.setTimeout(function () {
          return that.poll(1000, focusCallback);
        }, 1000);
      }
    };

    Problem.prototype.poll = function (previousTimeout, focusCallback) {
      var that = this;
      return $.postWithPrefix("" + this.url + "/problem_get", function (response) {
        var newTimeout;
        // If queueing status changed, then render
        that.new_queued_items = $(response.html).find(".xqueue");
        if (that.new_queued_items.length !== that.num_queued_items) {
          __webpack_provided_edx_dot_HtmlUtils.setHtml(that.el, __webpack_provided_edx_dot_HtmlUtils.HTML(response.html))
            .promise()
            .done(function () {
              // eslint-disable-next-line no-void
              return typeof focusCallback === "function" ? focusCallback() : void 0;
            });
          JavascriptLoader.executeModuleScripts(that.el, function () {
            that.setupInputTypes();
            that.bind();
          });
        }
        that.num_queued_items = that.new_queued_items.length;
        if (that.num_queued_items === 0) {
          that.forceUpdate(response);
          delete window.queuePollerID;
        } else {
          newTimeout = previousTimeout * 2;
          // if the timeout is greather than 1 minute
          if (newTimeout >= 60000) {
            delete window.queuePollerID;
            that.gentle_alert(gettext("The grading process is still running. Refresh the page to see updates."));
          } else {
            window.queuePollerID = window.setTimeout(function () {
              return that.poll(newTimeout, focusCallback);
            }, newTimeout);
          }
        }
      });
    };

    /**
     * Use this if you want to make an ajax call on the input type object
     * static method so you don't have to instantiate a Problem in order to use it
     *
     * Input:
     *     url: the AJAX url of the problem
     *     inputId: the inputId of the input you would like to make the call on
     *         NOTE: the id is the ${id} part of "input_${id}" during rendering
     *             If this function is passed the entire prefixed id, the backend may have trouble
     *             finding the correct input
     *     dispatch: string that indicates how this data should be handled by the inputtype
     *     data: dictionary of data to send to the server
     *     callback: the function that will be called once the AJAX call has been completed.
     *          It will be passed a response object
     */
    Problem.inputAjax = function (url, inputId, dispatch, data, callback) {
      data.dispatch = dispatch; // eslint-disable-line no-param-reassign
      data.input_id = inputId; // eslint-disable-line no-param-reassign
      return $.postWithPrefix("" + url + "/input_ajax", data, callback);
    };

    Problem.prototype.render = function (content, focusCallback) {
      var that = this;
      if (content) {
        __webpack_provided_edx_dot_HtmlUtils.setHtml(this.el, __webpack_provided_edx_dot_HtmlUtils.HTML(content));
        return JavascriptLoader.executeModuleScripts(this.el, function () {
          that.setupInputTypes();
          that.bind();
          that.queueing(focusCallback);
          that.renderProgressState();
          // eslint-disable-next-line no-void
          return typeof focusCallback === "function" ? focusCallback() : void 0;
        });
      } else {
        return $.postWithPrefix("" + this.url + "/problem_get", function (response) {
          __webpack_provided_edx_dot_HtmlUtils.setHtml(that.el, __webpack_provided_edx_dot_HtmlUtils.HTML(response.html));
          return JavascriptLoader.executeModuleScripts(that.el, function () {
            that.setupInputTypes();
            that.bind();
            that.queueing();
            return that.forceUpdate(response);
          });
        });
      }
    };

    Problem.prototype.setupInputTypes = function () {
      var that = this;
      this.inputtypeDisplays = {};
      return this.el.find(".capa_inputtype").each(function (index, inputtype) {
        var classes, cls, id, setupMethod, i, len, results;
        classes = $(inputtype).attr("class").split(" ");
        id = $(inputtype).attr("id");
        results = [];
        for (i = 0, len = classes.length; i < len; i++) {
          cls = classes[i];
          setupMethod = that.inputtypeSetupMethods[cls];
          if (setupMethod != null) {
            results.push((that.inputtypeDisplays[id] = setupMethod(inputtype)));
          } else {
            // eslint-disable-next-line no-void
            results.push(void 0);
          }
        }
        return results;
      });
    };

    /**
     * If some function wants to be called before sending the answer to the
     * server, give it a chance to do so.
     *
     * submit_save_waitfor allows the callee to send alerts if the user's input is
     * invalid. To do so, the callee must throw an exception named "WaitforException".
     * This and any other errors or exceptions that arise from the callee are rethrown
     * and abort the submission.
     *
     * In order to use this feature, add a 'data-waitfor' attribute to the input,
     * and specify the function to be called by the submit button before sending off @answers
     */
    Problem.prototype.submit_save_waitfor = function (callback) {
      var flag,
        inp,
        i,
        len,
        ref,
        that = this;
      flag = false;
      ref = this.inputs;
      for (i = 0, len = ref.length; i < len; i++) {
        inp = ref[i];
        if ($(inp).is("input[waitfor]")) {
          try {
            $(inp).data("waitfor")(function () {
              that.refreshAnswers();
              return callback();
            });
          } catch (e) {
            if (e.name === "Waitfor Exception") {
              alert(e.message); // eslint-disable-line no-alert
            } else {
              alert(
                // eslint-disable-line no-alert
                gettext("Could not grade your answer. The submission was aborted."),
              );
            }
            throw e;
          }
          flag = true;
        } else {
          flag = false;
        }
      }
      return flag;
    };

    // Scroll to problem metadata and next focus is problem input
    Problem.prototype.scroll_to_problem_meta = function () {
      var questionTitle;
      questionTitle = this.$(".problem-header");
      if (questionTitle.length > 0) {
        $("html, body").animate(
          {
            scrollTop: questionTitle.offset().top,
          },
          500,
        );
        questionTitle.focus();
      }
    };

    Problem.prototype.focus_on_notification = function (type) {
      var notification;
      notification = this.$(".notification-" + type);
      if (notification.length > 0) {
        notification.focus();
      }
    };

    Problem.prototype.focus_on_submit_notification = function () {
      this.focus_on_notification("submit");
    };

    Problem.prototype.focus_on_hint_notification = function (hintIndex) {
      this.$(".notification-hint .notification-message > ol > li.hint-index-" + hintIndex).focus();
    };

    Problem.prototype.focus_on_save_notification = function () {
      this.focus_on_notification("save");
    };

    /**
     * 'submit_fd' uses FormData to allow file submissions in the 'problem_check' dispatch,
     *      in addition to simple querystring-based answers
     *
     * NOTE: The dispatch 'problem_check' is being singled out for the use of FormData;
     *       maybe preferable to consolidate all dispatches to use FormData
     */
    Problem.prototype.submit_fd = function () {
      var abortSubmission,
        error,
        errorHtml,
        errors,
        fd,
        fileNotSelected,
        fileTooLarge,
        maxFileSize,
        requiredFilesNotSubmitted,
        settings,
        timeoutId,
        unallowedFileSubmitted,
        i,
        len,
        that = this;

      // If there are no file inputs in the problem, we can fall back on submit.
      if (this.el.find("input:file").length === 0) {
        this.submit();
        return;
      }
      this.enableSubmitButton(false);
      if (!window.FormData) {
        alert(
          gettext(
            "Submission aborted! Sorry, your browser does not support file uploads. If you can, please use Chrome or Safari which have been verified to support file uploads.",
          ),
        ); // eslint-disable-line max-len, no-alert
        this.enableSubmitButton(true);
        return;
      }
      timeoutId = this.enableSubmitButtonAfterTimeout();
      fd = new FormData();

      // Sanity checks on submission
      maxFileSize = 4 * 1000 * 1000;
      fileTooLarge = false;
      fileNotSelected = false;
      requiredFilesNotSubmitted = false;
      unallowedFileSubmitted = false;

      errors = [];
      this.inputs.each(function (index, element) {
        var allowedFiles, file, maxSize, requiredFiles, loopI, loopLen, ref;
        if (element.type === "file") {
          requiredFiles = $(element).data("required_files");
          allowedFiles = $(element).data("allowed_files");
          ref = element.files;
          for (loopI = 0, loopLen = ref.length; loopI < loopLen; loopI++) {
            file = ref[loopI];
            if (allowedFiles.length !== 0 && indexOfHelper.call(allowedFiles, file.name) < 0) {
              unallowedFileSubmitted = true;
              errors.push(
                edx.StringUtils.interpolate(gettext("You submitted {filename}; only {allowedFiles} are allowed."), {
                  filename: file.name,
                  allowedFiles: allowedFiles,
                }),
              );
            }
            if (indexOfHelper.call(requiredFiles, file.name) >= 0) {
              requiredFiles.splice(requiredFiles.indexOf(file.name), 1);
            }
            if (file.size > maxFileSize) {
              fileTooLarge = true;
              maxSize = maxFileSize / (1000 * 1000);
              errors.push(
                edx.StringUtils.interpolate(gettext("Your file {filename} is too large (max size: {maxSize}MB)."), {
                  filename: file.name,
                  maxSize: maxSize,
                }),
              );
            }
            fd.append(element.id, file); // xss-lint: disable=javascript-jquery-append
          }
          if (element.files.length === 0) {
            fileNotSelected = true;
            // In case we want to allow submissions with no file
            fd.append(element.id, ""); // xss-lint: disable=javascript-jquery-append
          }
          if (requiredFiles.length !== 0) {
            requiredFilesNotSubmitted = true;
            errors.push(
              edx.StringUtils.interpolate(gettext("You did not submit the required files: {requiredFiles}."), {
                requiredFiles: requiredFiles,
              }),
            );
          }
        } else {
          fd.append(element.id, element.value); // xss-lint: disable=javascript-jquery-append
        }
      });
      if (fileNotSelected) {
        errors.push(gettext("You did not select any files to submit."));
      }
      errorHtml = "";
      for (i = 0, len = errors.length; i < len; i++) {
        error = errors[i];
        errorHtml = __webpack_provided_edx_dot_HtmlUtils.joinHtml(
          errorHtml,
          __webpack_provided_edx_dot_HtmlUtils.interpolateHtml(__webpack_provided_edx_dot_HtmlUtils.HTML("<li>{error}</li>"), { error: error }),
        );
      }
      errorHtml = __webpack_provided_edx_dot_HtmlUtils.interpolateHtml(__webpack_provided_edx_dot_HtmlUtils.HTML("<ul>{errors}</ul>"), { errors: errorHtml });
      this.gentle_alert(errorHtml.toString());
      abortSubmission = fileTooLarge || fileNotSelected || unallowedFileSubmitted || requiredFilesNotSubmitted;
      if (abortSubmission) {
        window.clearTimeout(timeoutId);
        this.enableSubmitButton(true);
      } else {
        settings = {
          type: "POST",
          data: fd,
          processData: false,
          contentType: false,
          complete: this.enableSubmitButtonAfterResponse,
          success: function (response) {
            switch (response.success) {
              case "submitted":
              case "incorrect":
              case "correct":
                that.render(response.contents);
                that.updateProgress(response);
                break;
              default:
                that.gentle_alert(response.success);
            }
            return Logger.log("problem_graded", [that.answers, response.contents], that.id);
          },
          error: function (response) {
            that.gentle_alert(response.responseJSON.success);
          },
        };
        $.ajaxWithPrefix("" + this.url + "/problem_check", settings);
      }
    };

    Problem.prototype.submit = function () {
      if (!this.submit_save_waitfor(this.submit_internal)) {
        this.disableAllButtonsWhileRunning(this.submit_internal, true);
      }
    };

    Problem.prototype.submit_internal = function () {
      var that = this;
      Logger.log("problem_check", this.answers);
      return $.postWithPrefix("" + this.url + "/problem_check", this.answers, function (response) {
        switch (response.success) {
          case "submitted":
          case "incorrect":
          case "correct":
            window.SR.readTexts(that.get_sr_status(response.contents));
            that.el.trigger("contentChanged", [that.id, response.contents, response]);
            that.render(response.contents, that.focus_on_submit_notification);
            that.updateProgress(response);
            // This is used by the Learning MFE to know when the Entrance Exam has been passed
            // for a user. The MFE is then able to respond appropriately.
            if (response.entrance_exam_passed) {
              window.parent.postMessage({ type: "entranceExam.passed" }, "*");
            }
            break;
          default:
            that.saveNotification.hide();
            that.gentle_alert(response.success);
        }
        return Logger.log("problem_graded", [that.answers, response.contents], that.id);
      });
    };

    /**
     * This method builds up an array of strings to send to the page screen-reader span.
     * It first gets all elements with class "status", and then looks to see if they are contained
     * in sections with aria-labels. If so, labels are prepended to the status element text.
     * If not, just the text of the status elements are returned.
     */
    Problem.prototype.get_sr_status = function (contents) {
      var addedStatus, ariaLabel, element, labeledStatus, parentSection, statusElement, template, i, len;
      statusElement = $(contents).find(".status");
      labeledStatus = [];
      for (i = 0, len = statusElement.length; i < len; i++) {
        element = statusElement[i];
        parentSection = $(element).closest(".wrapper-problem-response");
        addedStatus = false;
        if (parentSection) {
          ariaLabel = parentSection.attr("aria-label");
          if (ariaLabel) {
            // Translators: This is only translated to allow for reordering of label and associated status.;
            template = gettext("{label}: {status}");
            labeledStatus.push(
              edx.StringUtils.interpolate(template, {
                label: ariaLabel,
                status: $(element).text(),
              }),
            );
            addedStatus = true;
          }
        }
        if (!addedStatus) {
          labeledStatus.push($(element).text());
        }
      }
      return labeledStatus;
    };

    Problem.prototype.reset = function () {
      return this.disableAllButtonsWhileRunning(this.reset_internal, false);
    };

    Problem.prototype.reset_internal = function () {
      var that = this;
      Logger.log("problem_reset", this.answers);
      return $.postWithPrefix(
        "" + this.url + "/problem_reset",
        {
          id: this.id,
        },
        function (response) {
          if (response.success) {
            that.el.trigger("contentChanged", [that.id, response.html, response]);
            that.render(response.html, that.scroll_to_problem_meta);
            that.updateProgress(response);
            return window.SR.readText(gettext("This problem has been reset."));
          } else {
            return that.gentle_alert(response.msg);
          }
        },
      );
    };

    // TODO this needs modification to deal with javascript responses; perhaps we
    // need something where responsetypes can define their own behavior when show
    // is called.
    Problem.prototype.show = function () {
      var that = this;
      Logger.log("problem_show", {
        problem: this.id,
      });
      return $.postWithPrefix("" + this.url + "/problem_show", function (response) {
        var answers;
        answers = response.answers;
        $.each(answers, function (key, value) {
          var safeKey = key.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/\./g, "\\."); // fix for courses which use url_names with colons & periods, e.g. problem:question1, question1.1
          var answer;
          if (!$.isArray(value)) {
            answer = that.$("#answer_" + safeKey + ", #solution_" + safeKey);
            __webpack_provided_edx_dot_HtmlUtils.setHtml(answer, __webpack_provided_edx_dot_HtmlUtils.HTML(value));
            Collapsible.setCollapsibles(answer);

            // Sometimes, `value` is just a string containing a MathJax formula.
            // If this is the case, jQuery will throw an error in some corner cases
            // because of an incorrect selector. We setup a try..catch so that
            // the script doesn't break in such cases.
            //
            // We will fallback to the second `if statement` below, if an
            // error is thrown by jQuery.
            try {
              return $(value).find(".detailed-solution");
            } catch (e) {
              return {};
            }

            // TODO remove the above once everything is extracted into its own
            // inputtype functions.
          }
        });
        that.el.find(".capa_inputtype").each(function (index, inputtype) {
          var classes, cls, display, showMethod, i, len, results;
          classes = $(inputtype).attr("class").split(" ");
          results = [];
          for (i = 0, len = classes.length; i < len; i++) {
            cls = classes[i];
            display = that.inputtypeDisplays[$(inputtype).attr("id")];
            showMethod = that.inputtypeShowAnswerMethods[cls];
            if (showMethod != null) {
              results.push(showMethod(inputtype, display, answers, response.correct_status_html));
            } else {
              // eslint-disable-next-line no-void
              results.push(void 0);
            }
          }
          return results;
        });
        if (typeof MathJax !== "undefined" && MathJax !== null) {
          that.el.find(".problem > div").each(function (index, element) {
            return MathJax.Hub.Queue(["Typeset", MathJax.Hub, element]);
          });
        }
        that.el.find(".show").attr("disabled", "disabled");
        that.updateProgress(response);
        that.clear_all_notifications();
        that.showAnswerNotification.show();
        that.focus_on_notification("show-answer");
      });
    };

    Problem.prototype.clear_all_notifications = function () {
      this.submitNotification.remove();
      this.gentleAlertNotification.hide();
      this.saveNotification.hide();
      this.showAnswerNotification.hide();
    };

    Problem.prototype.gentle_alert = function (msg) {
      __webpack_provided_edx_dot_HtmlUtils.setHtml(this.el.find(".notification-gentle-alert .notification-message"), __webpack_provided_edx_dot_HtmlUtils.HTML(msg));
      this.clear_all_notifications();
      this.gentleAlertNotification.show();
      this.gentleAlertNotification.focus();
    };

    Problem.prototype.save = function () {
      if (!this.submit_save_waitfor(this.save_internal)) {
        this.disableAllButtonsWhileRunning(this.save_internal, false);
      }
    };

    Problem.prototype.save_internal = function () {
      var that = this;
      Logger.log("problem_save", this.answers);
      return $.postWithPrefix("" + this.url + "/problem_save", this.answers, function (response) {
        var saveMessage;
        saveMessage = response.msg;
        if (response.success) {
          that.el.trigger("contentChanged", [that.id, response.html, response]);
          __webpack_provided_edx_dot_HtmlUtils.setHtml(
            that.el.find(".notification-save .notification-message"),
            __webpack_provided_edx_dot_HtmlUtils.HTML(saveMessage),
          );
          that.clear_all_notifications();
          that.el.find(".wrapper-problem-response .message").hide();
          that.saveNotification.show();
          that.focus_on_save_notification();
        } else {
          that.gentle_alert(saveMessage);
        }
      });
    };

    Problem.prototype.refreshMath = function (event, element) {
      var elid, eqn, jax, mathjaxPreprocessor, preprocessorTag, target;
      if (!element) {
        element = event.target; // eslint-disable-line no-param-reassign
      }
      elid = element.id.replace(/^input_/, "");
      target = "display_" + elid;

      // MathJax preprocessor is loaded by 'setupInputTypes'
      preprocessorTag = "inputtype_" + elid;
      mathjaxPreprocessor = this.inputtypeDisplays[preprocessorTag];
      if (typeof MathJax !== "undefined" && MathJax !== null && MathJax.Hub.getAllJax(target)[0]) {
        jax = MathJax.Hub.getAllJax(target)[0];
        eqn = $(element).val();
        if (mathjaxPreprocessor) {
          eqn = mathjaxPreprocessor(eqn);
        }
        MathJax.Hub.Queue(["Text", jax, eqn], [this.updateMathML, jax, element]);
      }
    };

    Problem.prototype.updateMathML = function (jax, element) {
      try {
        $("#" + element.id + "_dynamath").val(jax.root.toMathML(""));
      } catch (exception) {
        if (!exception.restart) {
          throw exception;
        }
        if (typeof MathJax !== "undefined" && MathJax !== null) {
          MathJax.Callback.After([this.refreshMath, jax], exception.restart);
        }
      }
    };

    Problem.prototype.refreshAnswers = function () {
      this.$("input.schematic").each(function (index, element) {
        return element.schematic.update_value();
      });
      this.$(".CodeMirror").each(function (index, element) {
        if (element.CodeMirror.save) {
          element.CodeMirror.save();
        }
      });
      this.answers = this.inputs.serialize();
    };

    /**
     * Used to check available answers and if something is checked (or the answer is set in some textbox),
     * the "Submit" button becomes enabled. Otherwise it is disabled by default.
     *
     * Arguments:
     *    bind (boolean): used on the first check to attach event handlers to input fields
     *       to change "Submit" enable status in case of some manipulations with answers
     */
    Problem.prototype.submitAnswersAndSubmitButton = function (bind) {
      var answered,
        atLeastOneTextInputFound,
        oneTextInputFilled,
        that = this;
      if (bind === null || bind === undefined) {
        bind = false; // eslint-disable-line no-param-reassign
      }
      answered = true;
      atLeastOneTextInputFound = false;
      oneTextInputFilled = false;
      this.el.find("input:text").each(function (i, textField) {
        if ($(textField).is(":visible")) {
          atLeastOneTextInputFound = true;
          if ($(textField).val() !== "") {
            oneTextInputFilled = true;
          }
          if (bind) {
            $(textField).on("input", function () {
              that.saveNotification.hide();
              that.showAnswerNotification.hide();
              that.submitAnswersAndSubmitButton();
            });
          }
        }
      });
      if (atLeastOneTextInputFound && !oneTextInputFilled) {
        answered = false;
      }
      this.el.find(".choicegroup").each(function (i, choicegroupBlock) {
        var checked;
        checked = false;
        $(choicegroupBlock)
          .find("input[type=checkbox], input[type=radio]")
          .each(function (j, checkboxOrRadio) {
            if ($(checkboxOrRadio).is(":checked")) {
              checked = true;
            }
            if (bind) {
              $(checkboxOrRadio).on("click", function () {
                that.saveNotification.hide();
                that.el.find(".show").removeAttr("disabled");
                that.showAnswerNotification.hide();
                that.submitAnswersAndSubmitButton();
              });
            }
          });
        if (!checked) {
          answered = false;
        }
      });
      this.el.find("select").each(function (i, selectField) {
        var selectedOption = $(selectField).find("option:selected").text().trim();
        if (selectedOption === "Select an option") {
          answered = false;
        }
        if (bind) {
          $(selectField).on("change", function () {
            that.saveNotification.hide();
            that.showAnswerNotification.hide();
            that.submitAnswersAndSubmitButton();
          });
        }
      });
      if (answered) {
        return this.enableSubmitButton(true);
      } else {
        return this.enableSubmitButton(false, false);
      }
    };

    Problem.prototype.bindResetCorrectness = function () {
      // Loop through all input types.
      // Bind the reset functions at that scope.
      var $inputtypes,
        that = this;
      $inputtypes = this.el.find(".capa_inputtype").add(this.el.find(".inputtype"));
      return $inputtypes.each(function (index, inputtype) {
        var bindMethod, classes, cls, i, len, results;
        classes = $(inputtype).attr("class").split(" ");
        results = [];
        for (i = 0, len = classes.length; i < len; i++) {
          cls = classes[i];
          bindMethod = that.bindResetCorrectnessByInputtype[cls];
          if (bindMethod != null) {
            results.push(bindMethod(inputtype));
          } else {
            // eslint-disable-next-line no-void
            results.push(void 0);
          }
        }
        return results;
      });
    };

    // Find all places where each input type displays its correct-ness
    // Replace them with their original state--'unanswered'.
    Problem.prototype.bindResetCorrectnessByInputtype = {
      // These are run at the scope of the capa inputtype
      // They should set handlers on each <input> to reset the whole.
      formulaequationinput: function (element) {
        return $(element)
          .find("input")
          .on("input", function () {
            var $p;
            $p = $(element).find("span.status");
            $p.removeClass("correct incorrect submitted");
            return $p.parent().removeAttr("class").addClass("unsubmitted");
          });
      },
      choicegroup: function (element) {
        var $element, id;
        $element = $(element);
        id = $element.attr("id").match(/^inputtype_(.*)$/)[1];
        return $element.find("input").on("change", function () {
          var $status;
          $status = $("#status_" + id);
          if ($status[0]) {
            $status.removeAttr("class").addClass("status unanswered");
          } else {
            $("<span>", {
              class: "status unanswered",
              style: "display: inline-block;",
              id: "status_" + id,
            });
          }
          $element.find("label").find("span.status.correct").remove();
          return $element.find("label").removeAttr("class");
        });
      },
      "option-input": function (element) {
        var $select, id;
        $select = $(element).find("select");
        id = $select.attr("id").match(/^input_(.*)$/)[1];
        return $select.on("change", function () {
          return $("#status_" + id)
            .removeAttr("class")
            .addClass("unanswered")
            .find(".sr")
            .text(gettext("unsubmitted"));
        });
      },
      textline: function (element) {
        return $(element)
          .find("input")
          .on("input", function () {
            var $p;
            $p = $(element).find("span.status");
            $p.removeClass("correct incorrect submitted");
            return $p.parent().removeClass("correct incorrect").addClass("unsubmitted");
          });
      },
    };

    Problem.prototype.inputtypeSetupMethods = {
      "text-input-dynamath": function (element) {
        /*
                 Return: function (eqn) -> eqn that preprocesses the user formula input before
                 it is fed into MathJax. Return 'false' if no preprocessor specified
                 */
        var data, preprocessor, preprocessorClass, preprocessorClassName;
        data = $(element).find(".text-input-dynamath_data");
        preprocessorClassName = data.data("preprocessor");
        preprocessorClass = window[preprocessorClassName];
        if (preprocessorClass == null) {
          return false;
        } else {
          preprocessor = new preprocessorClass();
          return preprocessor.fn;
        }
      },
      cminput: function (container) {
        var CodeMirrorEditor, CodeMirrorTextArea, element, id, linenumbers, mode, spaces, tabsize;
        element = $(container).find("textarea");
        tabsize = element.data("tabsize");
        mode = element.data("mode");
        linenumbers = element.data("linenums");
        spaces = Array(parseInt(tabsize, 10) + 1).join(" ");
        CodeMirrorEditor = CodeMirror.fromTextArea(element[0], {
          lineNumbers: linenumbers,
          indentUnit: tabsize,
          tabSize: tabsize,
          mode: mode,
          matchBrackets: true,
          lineWrapping: true,
          indentWithTabs: false,
          smartIndent: false,
          extraKeys: {
            Esc: function () {
              $(".grader-status").focus();
              return false;
            },
            Tab: function (cm) {
              cm.replaceSelection(spaces, "end");
              return false;
            },
          },
        });
        id = element.attr("id").replace(/^input_/, "");
        CodeMirrorTextArea = CodeMirrorEditor.getInputField();
        CodeMirrorTextArea.setAttribute("id", "cm-textarea-" + id);
        CodeMirrorTextArea.setAttribute("aria-describedby", "cm-editor-exit-message-" + id + " status_" + id);
        return CodeMirrorEditor;
      },
    };

    Problem.prototype.inputtypeShowAnswerMethods = {
      choicegroup: function (element, display, answers, correctStatusHtml) {
        var answer, choice, inputId, i, len, results, $element, $inputLabel, $inputStatus;
        $element = $(element);
        inputId = $element.attr("id").replace(/inputtype_/, "");
        var safeId = inputId.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/\./g, "\\."); // fix for courses which use url_names with colons & periods, e.g. problem:question1, question1.1
        answer = answers[inputId];
        results = [];
        for (i = 0, len = answer.length; i < len; i++) {
          choice = answer[i];
          $inputLabel = $element.find("#input_" + safeId + "_" + choice + " + label");
          $inputStatus = $element.find("#status_" + safeId);
          // If the correct answer was already Submitted before "Show Answer" was selected,
          // the status HTML will already be present. Otherwise, inject the status HTML.

          // If the learner clicked a different answer after Submit, their submitted answers
          // will be marked as "unanswered". In that case, for correct answers update the
          // classes accordingly.
          if ($inputStatus.hasClass("unanswered")) {
            __webpack_provided_edx_dot_HtmlUtils.append($inputLabel, __webpack_provided_edx_dot_HtmlUtils.HTML(correctStatusHtml));
            $inputLabel.addClass("choicegroup_correct");
          } else if (!$inputLabel.hasClass("choicegroup_correct")) {
            // If the status HTML is not already present (due to clicking Submit), append
            // the status HTML for correct answers.
            __webpack_provided_edx_dot_HtmlUtils.append($inputLabel, __webpack_provided_edx_dot_HtmlUtils.HTML(correctStatusHtml));
            $inputLabel.removeClass("choicegroup_incorrect");
            results.push($inputLabel.addClass("choicegroup_correct"));
          }
        }
        return results;
      },
      choicetextgroup: function (element, display, answers) {
        var answer, choice, inputId, i, len, results, $element;
        $element = $(element);
        inputId = $element.attr("id").replace(/inputtype_/, "");
        answer = answers[inputId];
        results = [];
        for (i = 0, len = answer.length; i < len; i++) {
          choice = answer[i];
          results.push($element.find("section#forinput" + choice).addClass("choicetextgroup_show_correct"));
        }
        return results;
      },
      imageinput: function (element, display, answers) {
        // answers is a dict of (answer_id, answer_text) for each answer for this question.
        //
        // @Examples:
        // {'anwser_id': {
        //    'rectangle': '(10,10)-(20,30);(12,12)-(40,60)',
        //    'regions': '[[10,10], [30,30], [10, 30], [30, 10]]'
        // } }
        var canvas, container, id, types, context, $element;
        types = {
          rectangle: function (ctx, coords) {
            var rects, reg;
            reg = /^\(([0-9]+),([0-9]+)\)-\(([0-9]+),([0-9]+)\)$/;
            rects = coords.replace(/\s*/g, "").split(/;/);
            $.each(rects, function (index, rect) {
              var abs, height, points, width;
              abs = Math.abs;
              points = reg.exec(rect);
              if (points) {
                width = abs(points[3] - points[1]);
                height = abs(points[4] - points[2]);
                ctx.rect(points[1], points[2], width, height);
              }
            });
            ctx.stroke();
            return ctx.fill();
          },
          regions: function (ctx, coords) {
            var parseCoords;
            parseCoords = function (coordinates) {
              var reg;
              reg = JSON.parse(coordinates);

              // Regions is list of lists [region1, region2, region3, ...] where regionN
              // is disordered list of points: [[1,1], [100,100], [50,50], [20, 70]].
              // If there is only one region in the list, simpler notation can be used:
              // regions="[[10,10], [30,30], [10, 30], [30, 10]]" (without explicitly
              // setting outer list)
              if (typeof reg[0][0][0] === "undefined") {
                // we have [[1,2],[3,4],[5,6]] - single region
                // instead of [[[1,2],[3,4],[5,6], [[1,2],[3,4],[5,6]]]
                // or [[[1,2],[3,4],[5,6]]] - multiple regions syntax
                reg = [reg];
              }
              return reg;
            };
            return $.each(parseCoords(coords), function (index, region) {
              ctx.beginPath();
              $.each(region, function (idx, point) {
                if (idx === 0) {
                  return ctx.moveTo(point[0], point[1]);
                } else {
                  return ctx.lineTo(point[0], point[1]);
                }
              });
              ctx.closePath();
              ctx.stroke();
              return ctx.fill();
            });
          },
        };
        $element = $(element);
        id = $element.attr("id").replace(/inputtype_/, "");
        container = $element.find("#answer_" + id);
        canvas = document.createElement("canvas");
        canvas.width = container.data("width");
        canvas.height = container.data("height");
        if (canvas.getContext) {
          context = canvas.getContext("2d");
        } else {
          console.log("Canvas is not supported."); // eslint-disable-line no-console
        }
        context.fillStyle = "rgba(255,255,255,.3)";
        context.strokeStyle = "#FF0000";
        context.lineWidth = "2";
        if (answers[id]) {
          $.each(answers[id], function (key, value) {
            if (types[key] !== null && types[key] !== undefined && value) {
              types[key](context, value);
            }
          });
          __webpack_provided_edx_dot_HtmlUtils.setHtml(container, __webpack_provided_edx_dot_HtmlUtils.HTML(canvas));
        } else {
          console.log("Answer is absent for image input with id=" + id); // eslint-disable-line no-console
        }
      },
    };

    /**
     * Used to keep the buttons disabled while operationCallback is running.
     *
     * params:
     *      'operationCallback' is an operation to be run.
     *      isFromCheckOperation' is a boolean to keep track if 'operationCallback' was
     *           from submit, if so then text of submit button will be changed as well.
     *
     */
    Problem.prototype.disableAllButtonsWhileRunning = function (operationCallback, isFromCheckOperation) {
      var that = this;
      var allButtons = [this.resetButton, this.saveButton, this.showButton, this.hintButton, this.submitButton];
      var initiallyEnabledButtons = allButtons.filter(function (button) {
        return !button.attr("disabled");
      });
      this.enableButtons(initiallyEnabledButtons, false, isFromCheckOperation);
      return operationCallback().always(function () {
        return that.enableButtons(initiallyEnabledButtons, true, isFromCheckOperation);
      });
    };

    /**
     * Enables/disables buttons by removing/adding the disabled attribute. The submit button is checked
     *     separately due to the changing text it contains.
     *
     * params:
     *     'buttons' is an array of buttons that will have their 'disabled' attribute modified
     *     'enable' a boolean to either enable or disable the buttons passed in the first parameter
     *     'changeSubmitButtonText' is a boolean to keep track if operation was initiated
     *         from submit so that text of submit button will also be changed while disabling/enabling
     *         the submit button.
     */
    Problem.prototype.enableButtons = function (buttons, enable, changeSubmitButtonText) {
      var that = this;
      buttons.forEach(function (button) {
        if (button.hasClass("submit")) {
          that.enableSubmitButton(enable, changeSubmitButtonText);
        } else if (enable) {
          button.removeAttr("disabled");
        } else {
          button.attr({ disabled: "disabled" });
        }
      });
    };

    /**
     *  Used to disable submit button to reduce chance of accidental double-submissions.
     *
     * params:
     *     'enable' is a boolean to determine enabling/disabling of submit button.
     *     'changeText' is a boolean to determine if there is need to change the
     *         text of submit button as well.
     */
    Problem.prototype.enableSubmitButton = function (enable, changeText) {
      var submitCanBeEnabled;
      if (changeText === null || changeText === undefined) {
        changeText = true; // eslint-disable-line no-param-reassign
      }
      if (enable) {
        submitCanBeEnabled = this.submitButton.data("should-enable-submit-button") === "True";
        if (submitCanBeEnabled) {
          this.submitButton.removeAttr("disabled");
        }
        if (changeText) {
          this.submitButtonLabel.text(this.submitButtonSubmitText);
        }
      } else {
        this.submitButton.attr({ disabled: "disabled" });
        if (changeText) {
          this.submitButtonLabel.text(this.submitButtonSubmittingText);
        }
      }
    };

    Problem.prototype.enableSubmitButtonAfterResponse = function () {
      this.has_response = true;
      if (!this.has_timed_out) {
        // Server has returned response before our timeout.
        return this.enableSubmitButton(false);
      } else {
        return this.enableSubmitButton(true);
      }
    };

    Problem.prototype.enableSubmitButtonAfterTimeout = function () {
      var enableSubmitButton,
        that = this;
      this.has_timed_out = false;
      this.has_response = false;
      enableSubmitButton = function () {
        that.has_timed_out = true;
        if (that.has_response) {
          that.enableSubmitButton(true);
        }
      };
      return window.setTimeout(enableSubmitButton, 750);
    };

    Problem.prototype.hint_button = function () {
      // Store the index of the currently shown hint as an attribute.
      // Use that to compute the next hint number when the button is clicked.
      var hintContainer,
        hintIndex,
        nextIndex,
        that = this;
      hintContainer = this.$(".problem-hint");
      hintIndex = hintContainer.attr("hint_index");
      // eslint-disable-next-line no-void
      if (hintIndex === void 0) {
        nextIndex = 0;
      } else {
        nextIndex = parseInt(hintIndex, 10) + 1;
      }
      return $.postWithPrefix(
        "" + this.url + "/hint_button",
        {
          hint_index: nextIndex,
          input_id: this.id,
        },
        function (response) {
          var hintMsgContainer;
          if (response.success) {
            hintMsgContainer = that.$(".problem-hint .notification-message");
            hintContainer.attr("hint_index", response.hint_index);
            __webpack_provided_edx_dot_HtmlUtils.setHtml(hintMsgContainer, __webpack_provided_edx_dot_HtmlUtils.HTML(response.msg));
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, hintContainer[0]]);
            if (response.should_enable_next_hint) {
              that.hintButton.removeAttr("disabled");
            } else {
              that.hintButton.attr({ disabled: "disabled" });
            }
            that.el.find(".notification-hint").show();
            that.focus_on_hint_notification(nextIndex);
          } else {
            that.gentle_alert(response.msg);
          }
        },
      );
    };

    return Problem;
  }.call(this);
}).call(this);

}.call(window));

/***/ },

/***/ "./static/js/imageinput.js"
/*!*********************************!*\
  !*** ./static/js/imageinput.js ***!
  \*********************************/
(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

/* provided dependency */ var __webpack_provided_window_dot_jQuery = __webpack_require__(/*! jquery */ "jquery");
/*** IMPORTS FROM imports-loader ***/
(function() {

/**
 * Simple image input
 *
 *
 * Click on image. Update the coordinates of a dot on the image.
 * The new coordinates are the location of the click.
 */

/**
 * 'The wise adapt themselves to circumstances, as water molds itself to the
 * pitcher.'
 *
 * ~ Chinese Proverb
 */

// eslint-disable-next-line no-shadow-restricted-names
window.ImageInput = function ($, undefined) {
  var ImageInput = ImageInputConstructor;

  ImageInput.prototype = {
    constructor: ImageInputConstructor,
    clickHandler: clickHandler,
  };

  return ImageInput;

  function ImageInputConstructor(elementId) {
    this.el = $("#imageinput_" + elementId);
    this.crossEl = $("#cross_" + elementId);
    this.inputEl = $("#input_" + elementId);

    this.el.on("click", this.clickHandler.bind(this));
  }

  function clickHandler(event) {
    var offset = this.el.offset(),
      posX = event.offsetX ? event.offsetX : event.pageX - offset.left,
      posY = event.offsetY ? event.offsetY : event.pageY - offset.top,
      // To reduce differences between values returned by different kinds
      // of browsers, we round `posX` and `posY`.
      //
      // IE10: `posX` and `posY` - float.
      // Chrome, FF: `posX` and `posY` - integers.
      result = "[" + Math.round(posX) + "," + Math.round(posY) + "]";

    this.crossEl.css({
      left: posX - 15,
      top: posY - 15,
      visibility: "visible",
    });

    this.inputEl.val(result);
  }
}.call(this, __webpack_provided_window_dot_jQuery);

}.call(window));

/***/ },

/***/ "./static/js/javascript_loader.js"
/*!****************************************!*\
  !*** ./static/js/javascript_loader.js ***!
  \****************************************/
(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

/* provided dependency */ var $ = __webpack_require__(/*! jquery */ "jquery");
/*** IMPORTS FROM imports-loader ***/
(function() {

(function () {
  "use strict";

  this.JavascriptLoader = (function () {
    function JavascriptLoader() {}

    /**
     * Set of library functions that provide common interface for javascript loading
     * for all module types. All functionality provided by JavascriptLoader should take
     * place at module scope, i.e. don't run jQuery over entire page.
     *
     * executeModuleScripts:
     *     Scan the module ('el') for "script_placeholder"s, then:
     *
     *     1) Fetch each script from server
     *     2) Explicitly attach the script to the <head> of document
     *     3) Explicitly wait for each script to be loaded
     *     4) Return to callback function when all scripts loaded
     */
    JavascriptLoader.executeModuleScripts = function (el, callback) {
      var callbackCalled, completed, completionHandlerGenerator, loaded, placeholders;
      if (!callback) {
        callback = null; // eslint-disable-line no-param-reassign
      }
      placeholders = el.find(".script_placeholder");
      if (placeholders.length === 0) {
        if (callback !== null) {
          callback();
        }
        return [];
      }
      // TODO: Verify the execution order of multiple placeholders
      completed = (function () {
        var i, ref, results;
        results = [];
        for (i = 1, ref = placeholders.length; ref >= 1 ? i <= ref : i >= ref; ref >= 1 ? ++i : --i) {
          results.push(false);
        }
        return results;
      })();
      callbackCalled = false;
      completionHandlerGenerator = function (index) {
        return function () {
          var allComplete, flag, i, len;
          allComplete = true;
          completed[index] = true;
          for (i = 0, len = completed.length; i < len; i++) {
            flag = completed[i];
            if (!flag) {
              allComplete = false;
              break;
            }
          }
          if (allComplete && !callbackCalled) {
            callbackCalled = true;
            if (callback !== null) {
              return callback();
            }
          }
          return undefined;
        };
      };
      // Keep a map of what sources we're loaded from, and don't do it twice.
      loaded = {};
      return placeholders.each(function (index, placeholder) {
        var s, src, src_escaped;
        // TODO: Check if the script already exists in DOM. If so, (1) copy it
        // into memory; (2) delete the DOM script element; (3) reappend it.
        // This would prevent memory bloat and save a network request.
        src = $(placeholder).attr("data-src");
        if (/^\s*(javascript|data|vbscript):/i.test(src)) {
          console.warn("Blocked unsafe script source:", src);
          completionHandlerGenerator(index)();
          return $(placeholder).remove();
        }
        src_escaped = String(src || "")
          .replace(/</g, "%3C")
          .replace(/>/g, "%3E");
        if (!(src_escaped in loaded)) {
          loaded[src_escaped] = true;
          s = document.createElement("script");
          s.setAttribute("src", src_escaped);
          s.setAttribute("type", "text/javascript");
          s.onload = completionHandlerGenerator(index);
          // Need to use the DOM elements directly or the scripts won't execute properly.
          $("head")[0].appendChild(s);
        } else {
          // just call the completion callback directly, without reloading the file
          completionHandlerGenerator(index)();
        }
        return $(placeholder).remove();
      });
    };

    return JavascriptLoader;
  })();
}).call(this);

}.call(window));

/***/ },

/***/ "./static/js/schematic.js"
/*!********************************!*\
  !*** ./static/js/schematic.js ***!
  \********************************/
(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

/* provided dependency */ var $ = __webpack_require__(/*! jquery */ "jquery");
/* provided dependency */ var __webpack_provided_edx_dot_HtmlUtils = __webpack_require__(/*! edx-ui-toolkit/js/utils/html-utils */ "../../../node_modules/edx-ui-toolkit/src/js/utils/html-utils.js");
/*** IMPORTS FROM imports-loader ***/
(function() {

/* eslint-disable */

//////////////////////////////////////////////////////////////////////////////
//
//  Circuit simulator
//
//////////////////////////////////////////////////////////////////////////////

// Copyright (C) 2011 Massachusetts Institute of Technology

// create a circuit for simulation using "new cktsim.Circuit()"

// for modified nodal analysis (MNA) stamps see
// http://www.analog-electronics.eu/analog-electronics/modified-nodal-analysis/modified-nodal-analysis.xhtml

var cktsim = (function () {
  ///////////////////////////////////////////////////////////////////////////////
  //
  //  Circuit
  //
  //////////////////////////////////////////////////////////////////////////////

  // types of "nodes" in the linear system
  var T_VOLTAGE = 0;
  var T_CURRENT = 1;

  var v_newt_lim = 0.3; // Voltage limited Newton great for Mos/diodes
  var v_abstol = 1e-6; // Absolute voltage error tolerance
  var i_abstol = 1e-12; // Absolute current error tolerance
  var eps = 1.0e-12; // A very small number compared to one.
  var dc_max_iters = 1000; // max iterations before giving up
  var max_tran_iters = 20; // max iterations before giving up
  var time_step_increase_factor = 2.0; // How much can lte let timestep grow.
  var lte_step_decrease_factor = 8; // Limit lte one-iter timestep shrink.
  var nr_step_decrease_factor = 4; // Newton failure timestep shrink.
  var reltol = 0.0001; // Relative tol to max observed value
  var lterel = 10; // LTE/Newton tolerance ratio (> 10!)
  var res_check_abs = Math.sqrt(i_abstol); // Loose Newton residue check
  var res_check_rel = Math.sqrt(reltol); // Loose Newton residue check

  function Circuit() {
    this.node_map = [];
    this.ntypes = [];
    this.initial_conditions = [];
    this.devices = [];
    this.device_map = [];
    this.voltage_sources = [];
    this.current_sources = [];
    this.finalized = false;
    this.diddc = false;
    this.node_index = -1;
    this.periods = 1;
  }

  // index of ground node
  Circuit.prototype.gnd_node = function () {
    return -1;
  };

  // allocate a new node index
  Circuit.prototype.node = function (name, ntype, ic) {
    this.node_index += 1;
    if (name) this.node_map[name] = this.node_index;
    this.ntypes.push(ntype);
    this.initial_conditions.push(ic);
    return this.node_index;
  };

  // call to finalize the circuit in preparation for simulation
  Circuit.prototype.finalize = function () {
    if (!this.finalized) {
      this.finalized = true;
      this.N = this.node_index + 1; // number of nodes

      // give each device a chance to finalize itself
      for (var i = this.devices.length - 1; i >= 0; --i) this.devices[i].finalize(this);

      // set up augmented matrix and various temp vectors
      this.matrix = mat_make(this.N, this.N + 1);
      this.Gl = mat_make(this.N, this.N); // Matrix for linear conductances
      this.G = mat_make(this.N, this.N); // Complete conductance matrix
      this.C = mat_make(this.N, this.N); // Matrix for linear L's and C's

      this.soln_max = new Array(this.N); // max abs value seen for each unknown
      this.abstol = new Array(this.N);
      this.solution = new Array(this.N);
      this.rhs = new Array(this.N);
      for (var i = this.N - 1; i >= 0; --i) {
        this.soln_max[i] = 0.0;
        this.abstol[i] = this.ntypes[i] == T_VOLTAGE ? v_abstol : i_abstol;
        this.solution[i] = 0.0;
        this.rhs[i] = 0.0;
      }

      // Load up the linear elements once and for all
      for (var i = this.devices.length - 1; i >= 0; --i) {
        this.devices[i].load_linear(this);
      }

      // Check for voltage source loops.
      var n_vsrc = this.voltage_sources.length;
      if (n_vsrc > 0) {
        // At least one voltage source
        var GV = mat_make(n_vsrc, this.N); // Loop check
        for (var i = n_vsrc - 1; i >= 0; --i) {
          var branch = this.voltage_sources[i].branch;
          for (var j = this.N - 1; j >= 0; j--) GV[i][j] = this.Gl[branch][j];
        }
        var rGV = mat_rank(GV);
        if (rGV < n_vsrc) {
          alert(
            "Warning!!! Circuit has a voltage source loop or a source or current probe shorted by a wire, please remove the source or the wire causing the short.",
          );
          alert("Warning!!! Simulator might produce meaningless results or no result with illegal circuits.");
          return false;
        }
      }
    }
    return true;
  };

  // load circuit from JSON netlist (see schematic.js)
  Circuit.prototype.load_netlist = function (netlist) {
    // set up mapping for all ground connections
    for (var i = netlist.length - 1; i >= 0; --i) {
      var component = netlist[i];
      var type = component[0];
      if (type == "g") {
        var connections = component[3];
        this.node_map[connections[0]] = this.gnd_node();
      }
    }

    // process each component in the JSON netlist (see schematic.js for format)
    var found_ground = false;
    for (var i = netlist.length - 1; i >= 0; --i) {
      var component = netlist[i];
      var type = component[0];

      // ignore wires, ground connections, scope probes and view info
      if (type == "view" || type == "w" || type == "g" || type == "s" || type == "L") {
        continue;
      }

      var properties = component[2];
      var name = properties["name"];
      if (name == undefined || name == "") name = "_" + properties["_json_"].toString();

      // convert node names to circuit indicies
      var connections = component[3];
      for (var j = connections.length - 1; j >= 0; --j) {
        var node = connections[j];
        var index = this.node_map[node];
        if (index == undefined) index = this.node(node, T_VOLTAGE);
        else if (index == this.gnd_node()) found_ground = true;
        connections[j] = index;
      }

      // process the component
      if (type == "r")
        // resistor
        this.r(connections[0], connections[1], properties["r"], name);
      else if (type == "d")
        // diode
        this.d(connections[0], connections[1], properties["area"], properties["type"], name);
      else if (type == "c")
        // capacitor
        this.c(connections[0], connections[1], properties["c"], name);
      else if (type == "l")
        // inductor
        this.l(connections[0], connections[1], properties["l"], name);
      else if (type == "v")
        // voltage source
        this.v(connections[0], connections[1], properties["value"], name);
      else if (type == "i")
        // current source
        this.i(connections[0], connections[1], properties["value"], name);
      else if (type == "o")
        // op amp
        this.opamp(connections[0], connections[1], connections[2], connections[3], properties["A"], name);
      else if (type == "n")
        // n fet
        this.n(connections[0], connections[1], connections[2], properties["W/L"], name);
      else if (type == "p")
        // p fet
        this.p(connections[0], connections[1], connections[2], properties["W/L"], name);
      else if (type == "a")
        // current probe == 0-volt voltage source
        this.v(connections[0], connections[1], "0", name);
    }

    if (!found_ground) {
      // No ground on schematic
      alert("Please make at least one connection to ground  (inverted T symbol)");
      return false;
    }
    return true;
  };

  // if converges: updates this.solution, this.soln_max, returns iter count
  // otherwise: return undefined and set this.problem_node
  // Load should compute -f and df/dx (note the sign pattern!)
  Circuit.prototype.find_solution = function (load, maxiters) {
    var soln = this.solution;
    var rhs = this.rhs;
    var d_sol = [];
    var abssum_compare;
    var converged,
      abssum_old = 0,
      abssum_rhs;
    var use_limiting = false;
    var down_count = 0;
    var thresh;

    // iteratively solve until values convere or iteration limit exceeded
    for (var iter = 0; iter < maxiters; iter++) {
      // set up equations
      load(this, soln, rhs);

      // Compute norm of rhs, assume variables of v type go with eqns of i type
      abssum_rhs = 0;
      for (var i = this.N - 1; i >= 0; --i) if (this.ntypes[i] == T_VOLTAGE) abssum_rhs += Math.abs(rhs[i]);

      if (iter > 0 && use_limiting == false && abssum_old < abssum_rhs) {
        // Old rhsnorm was better, undo last iter and turn on limiting
        for (var i = this.N - 1; i >= 0; --i) soln[i] -= d_sol[i];
        iter -= 1;
        use_limiting = true;
      } else {
        // Compute the Newton delta
        d_sol = mat_solve_rq(this.matrix, rhs);

        // If norm going down for ten iters, stop limiting
        if (abssum_rhs < abssum_old) down_count += 1;
        else down_count = 0;
        if (down_count > 10) {
          use_limiting = false;
          down_count = 0;
        }

        // Update norm of rhs
        abssum_old = abssum_rhs;
      }

      // Update the worst case abssum for comparison.
      if (iter == 0 || abssum_rhs > abssum_compare) abssum_compare = abssum_rhs;

      // Check residue convergence, but loosely, and give up
      // on last iteration
      if (iter < maxiters - 1 && abssum_rhs > res_check_abs + res_check_rel * abssum_compare) converged = false;
      else converged = true;

      // Update solution and check delta convergence
      for (var i = this.N - 1; i >= 0; --i) {
        // Simple voltage step limiting to encourage Newton convergence
        if (use_limiting) {
          if (this.ntypes[i] == T_VOLTAGE) {
            d_sol[i] = d_sol[i] > v_newt_lim ? v_newt_lim : d_sol[i];
            d_sol[i] = d_sol[i] < -v_newt_lim ? -v_newt_lim : d_sol[i];
          }
        }
        soln[i] += d_sol[i];
        thresh = this.abstol[i] + reltol * this.soln_max[i];
        if (Math.abs(d_sol[i]) > thresh) {
          converged = false;
          this.problem_node = i;
        }
      }

      if (converged == true) {
        for (var i = this.N - 1; i >= 0; --i)
          if (Math.abs(soln[i]) > this.soln_max[i]) this.soln_max[i] = Math.abs(soln[i]);
        return iter + 1;
      }
    }
    return undefined;
  };

  // DC analysis
  Circuit.prototype.dc = function () {
    // Allocation matrices for linear part, etc.
    if (this.finalize() == false) return undefined;

    // Define -f and df/dx for Newton solver
    function load_dc(ckt, soln, rhs) {
      // rhs is initialized to -Gl * soln
      mat_v_mult(ckt.Gl, soln, rhs, -1.0);
      // G matrix is initialized with linear Gl
      mat_copy(ckt.Gl, ckt.G);
      // Now load up the nonlinear parts of rhs and G
      for (var i = ckt.devices.length - 1; i >= 0; --i) ckt.devices[i].load_dc(ckt, soln, rhs);
      // G matrix is copied in to the system matrix
      mat_copy(ckt.G, ckt.matrix);
    }

    // find the operating point
    var iterations = this.find_solution(load_dc, dc_max_iters);

    if (typeof iterations == "undefined") {
      // too many iterations
      if (this.current_sources.length > 0) {
        alert("Newton Method Failed, do your current sources have a conductive path to ground?");
      } else {
        alert("Newton Method Failed, it may be your circuit or it may be our simulator.");
      }

      return undefined;
    } else {
      // Note that a dc solution was computed
      this.diddc = true;
      // create solution dictionary
      var result = [];
      // capture node voltages
      for (var name in this.node_map) {
        var index = this.node_map[name];
        result[name] = index == -1 ? 0 : this.solution[index];
      }
      // capture branch currents from voltage sources
      for (var i = this.voltage_sources.length - 1; i >= 0; --i) {
        var v = this.voltage_sources[i];
        result["I(" + v.name + ")"] = this.solution[v.branch];
      }
      return result;
    }
  };

  // Transient analysis (needs work!)
  Circuit.prototype.tran = function (ntpts, tstart, tstop, probenames, no_dc) {
    // Define -f and df/dx for Newton solver
    function load_tran(ckt, soln, rhs) {
      // Crnt is initialized to -Gl * soln
      mat_v_mult(ckt.Gl, soln, ckt.c, -1.0);
      // G matrix is initialized with linear Gl
      mat_copy(ckt.Gl, ckt.G);
      // Now load up the nonlinear parts of crnt and G
      for (var i = ckt.devices.length - 1; i >= 0; --i) ckt.devices[i].load_tran(ckt, soln, ckt.c, ckt.time);
      // Exploit the fact that storage elements are linear
      mat_v_mult(ckt.C, soln, ckt.q, 1.0);
      // -rhs = c - dqdt
      for (var i = ckt.N - 1; i >= 0; --i) {
        var dqdt = ckt.alpha0 * ckt.q[i] + ckt.alpha1 * ckt.oldq[i] + ckt.alpha2 * ckt.old2q[i];
        rhs[i] = ckt.beta0[i] * ckt.c[i] + ckt.beta1[i] * ckt.oldc[i] - dqdt;
      }
      // matrix = beta0*G + alpha0*C.
      mat_scale_add(ckt.G, ckt.C, ckt.beta0, ckt.alpha0, ckt.matrix);
    }

    var p = new Array(3);
    function interp_coeffs(t, t0, t1, t2) {
      // Poly coefficients
      var dtt0 = t - t0;
      var dtt1 = t - t1;
      var dtt2 = t - t2;
      var dt0dt1 = t0 - t1;
      var dt0dt2 = t0 - t2;
      var dt1dt2 = t1 - t2;
      p[0] = (dtt1 * dtt2) / (dt0dt1 * dt0dt2);
      p[1] = (dtt0 * dtt2) / (-dt0dt1 * dt1dt2);
      p[2] = (dtt0 * dtt1) / (dt0dt2 * dt1dt2);
      return p;
    }

    function pick_step(ckt, step_index) {
      var min_shrink_factor = 1.0 / lte_step_decrease_factor;
      var max_growth_factor = time_step_increase_factor;
      var N = ckt.N;
      var p = interp_coeffs(ckt.time, ckt.oldt, ckt.old2t, ckt.old3t);
      var trapcoeff = (0.5 * (ckt.time - ckt.oldt)) / (ckt.time - ckt.old3t);
      var maxlteratio = 0.0;
      for (var i = ckt.N - 1; i >= 0; --i) {
        if (ckt.ltecheck[i]) {
          // Check lte on variable
          var pred = p[0] * ckt.oldsol[i] + p[1] * ckt.old2sol[i] + p[2] * ckt.old3sol[i];
          var lte = Math.abs(ckt.solution[i] - pred) * trapcoeff;
          var lteratio = lte / (lterel * (ckt.abstol[i] + reltol * ckt.soln_max[i]));
          maxlteratio = Math.max(maxlteratio, lteratio);
        }
      }
      var new_step;
      var lte_step_ratio = 1.0 / Math.pow(maxlteratio, 1 / 3); // Cube root because trap
      if (lte_step_ratio < 1.0) {
        // Shrink the timestep to make lte
        lte_step_ratio = Math.max(lte_step_ratio, min_shrink_factor);
        new_step = (ckt.time - ckt.oldt) * 0.75 * lte_step_ratio;
        new_step = Math.max(new_step, ckt.min_step);
      } else {
        lte_step_ratio = Math.min(lte_step_ratio, max_growth_factor);
        if (lte_step_ratio > 1.2)
          /* Increase timestep due to lte. */
          new_step = ((ckt.time - ckt.oldt) * lte_step_ratio) / 1.2;
        else new_step = ckt.time - ckt.oldt;
        new_step = Math.min(new_step, ckt.max_step);
      }
      return new_step;
    }

    // Standard to do a dc analysis before transient
    // Otherwise, do the setup also done in dc.
    no_dc = false;
    if (this.diddc == false && no_dc == false) {
      if (this.dc() == undefined) {
        // DC failed, realloc mats and vects.
        alert("DC failed, trying transient analysis from zero.");
        this.finalized = false; // Reset the finalization.
        if (this.finalize() == false) return undefined;
      }
    } else {
      if (this.finalize() == false)
        // Allocate matrices and vectors.
        return undefined;
    }

    // Tired of typing this, and using "with" generates hate mail.
    var N = this.N;

    // build array to hold list of results for each variable
    // last entry is for timepoints.
    var response = new Array(N + 1);
    for (var i = N; i >= 0; --i) response[i] = [];

    // Allocate back vectors for up to a second order method
    this.old3sol = new Array(this.N);
    this.old3q = new Array(this.N);
    this.old2sol = new Array(this.N);
    this.old2q = new Array(this.N);
    this.oldsol = new Array(this.N);
    this.oldq = new Array(this.N);
    this.q = new Array(this.N);
    this.oldc = new Array(this.N);
    this.c = new Array(this.N);
    this.alpha0 = 1.0;
    this.alpha1 = 0.0;
    this.alpha2 = 0.0;
    this.beta0 = new Array(this.N);
    this.beta1 = new Array(this.N);

    // Mark a set of algebraic variable (don't miss hidden ones!).
    this.ar = this.algebraic(this.C);

    // Non-algebraic variables and probe variables get lte
    this.ltecheck = new Array(this.N);
    for (var i = N; i >= 0; --i) this.ltecheck[i] = this.ar[i] == 0;

    for (var name in this.node_map) {
      var index = this.node_map[name];
      for (var i = probenames.length; i >= 0; --i) {
        if (name == probenames[i]) {
          this.ltecheck[index] = true;
          break;
        }
      }
    }

    // Check for periodic sources
    var period = tstop - tstart;
    for (var i = this.voltage_sources.length - 1; i >= 0; --i) {
      var per = this.voltage_sources[i].src.period;
      if (per > 0) period = Math.min(period, per);
    }
    for (var i = this.current_sources.length - 1; i >= 0; --i) {
      var per = this.current_sources[i].src.period;
      if (per > 0) period = Math.min(period, per);
    }
    this.periods = Math.ceil((tstop - tstart) / period);

    this.time = tstart;
    // ntpts adjusted by numbers of periods in input
    this.max_step = (tstop - tstart) / (this.periods * ntpts);
    this.min_step = this.max_step / 1e8;
    var new_step = this.max_step / 1e6;
    this.oldt = this.time - new_step;

    // Initialize old crnts, charges, and solutions.
    load_tran(this, this.solution, this.rhs);
    for (var i = N - 1; i >= 0; --i) {
      this.old3sol[i] = this.solution[i];
      this.old2sol[i] = this.solution[i];
      this.oldsol[i] = this.solution[i];
      this.old3q[i] = this.q[i];
      this.old2q[i] = this.q[i];
      this.oldq[i] = this.q[i];
      this.oldc[i] = this.c[i];
    }

    var beta0, beta1;
    // Start with two pseudo-Euler steps, maximum 50000 steps/period
    var max_nsteps = this.periods * 50000;
    for (var step_index = -3; step_index < max_nsteps; step_index++) {
      // Save the just computed solution, and move back q and c.
      for (var i = this.N - 1; i >= 0; --i) {
        if (step_index >= 0) response[i].push(this.solution[i]);
        this.oldc[i] = this.c[i];
        this.old3sol[i] = this.old2sol[i];
        this.old2sol[i] = this.oldsol[i];
        this.oldsol[i] = this.solution[i];
        this.old3q[i] = this.oldq[i];
        this.old2q[i] = this.oldq[i];
        this.oldq[i] = this.q[i];
      }

      if (step_index < 0) {
        // Take a prestep using BE
        this.old3t = this.old2t - (this.oldt - this.old2t);
        this.old2t = this.oldt - (tstart - this.oldt);
        this.oldt = tstart - (this.time - this.oldt);
        this.time = tstart;
        beta0 = 1.0;
        beta1 = 0.0;
      } else {
        // Take a regular step
        // Save the time, and rotate time wheel
        response[this.N].push(this.time);
        this.old3t = this.old2t;
        this.old2t = this.oldt;
        this.oldt = this.time;
        // Make sure we come smoothly in to the interval end.
        if (this.time >= tstop)
          break; // We're done.
        else if (this.time + new_step > tstop) this.time = tstop;
        else if (this.time + 1.5 * new_step > tstop) this.time += (2 / 3) * (tstop - this.time);
        else this.time += new_step;

        // Use trap (average old and new crnts.
        beta0 = 0.5;
        beta1 = 0.5;
      }

      // For trap rule, turn off current avging for algebraic eqns
      for (var i = this.N - 1; i >= 0; --i) {
        this.beta0[i] = beta0 + this.ar[i] * beta1;
        this.beta1[i] = (1.0 - this.ar[i]) * beta1;
      }

      // Loop to find NR converging timestep with okay LTE
      while (true) {
        // Set the timestep coefficients (alpha2 is for bdf2).
        this.alpha0 = 1.0 / (this.time - this.oldt);
        this.alpha1 = -this.alpha0;
        this.alpha2 = 0;

        // If timestep is 1/10,000th of tstop, just use BE.
        if (this.time - this.oldt < 1.0e-4 * tstop) {
          for (var i = this.N - 1; i >= 0; --i) {
            this.beta0[i] = 1.0;
            this.beta1[i] = 0.0;
          }
        }
        // Use Newton to compute the solution.
        var iterations = this.find_solution(load_tran, max_tran_iters);

        // If NR succeeds and stepsize is at min, accept and newstep=maxgrowth*minstep.
        // Else if Newton Fails, shrink step by a factor and try again
        // Else LTE picks new step, if bigger accept current step and go on.
        if (iterations != undefined && (step_index <= 0 || this.time - this.oldt < (1 + reltol) * this.min_step)) {
          if (step_index > 0) new_step = time_step_increase_factor * this.min_step;
          break;
        } else if (iterations == undefined) {
          // NR nonconvergence, shrink by factor
          this.time = this.oldt + (this.time - this.oldt) / nr_step_decrease_factor;
        } else {
          // Check the LTE and shrink step if needed.
          new_step = pick_step(this, step_index);
          if (new_step < (1.0 - reltol) * (this.time - this.oldt)) {
            this.time = this.oldt + new_step; // Try again
          } else break; // LTE okay, new_step for next step
        }
      }
    }

    // create solution dictionary
    var result = [];
    for (var name in this.node_map) {
      var index = this.node_map[name];
      result[name] = index == -1 ? 0 : response[index];
    }
    // capture branch currents from voltage sources
    for (var i = this.voltage_sources.length - 1; i >= 0; --i) {
      var v = this.voltage_sources[i];
      result["I(" + v.name + ")"] = response[v.branch];
    }

    result["_time_"] = response[this.N];
    return result;
  };

  // AC analysis: npts/decade for freqs in range [fstart,fstop]
  // result['_frequencies_'] = vector of log10(sample freqs)
  // result['xxx'] = vector of dB(response for node xxx)
  // NOTE: Normalization removed in schematic.js, jkw.
  Circuit.prototype.ac = function (npts, fstart, fstop, source_name) {
    if (this.dc() == undefined) {
      // DC failed, realloc mats and vects.
      return undefined;
    }

    var N = this.N;
    var G = this.G;
    var C = this.C;

    // Complex numbers, we're going to need a bigger boat
    var matrixac = mat_make(2 * N, 2 * N + 1);

    // Get the source used for ac
    if (this.device_map[source_name] === undefined) {
      alert("AC analysis refers to unknown source " + source_name);
      return "AC analysis failed, unknown source";
    }
    this.device_map[source_name].load_ac(this, this.rhs);

    // build array to hold list of magnitude and phases for each node
    // last entry is for frequency values
    var response = new Array(2 * N + 1);
    for (var i = 2 * N; i >= 0; --i) response[i] = [];

    // multiplicative frequency increase between freq points
    var delta_f = Math.exp(Math.LN10 / npts);

    var phase_offset = new Array(N);
    for (var i = N - 1; i >= 0; --i) phase_offset[i] = 0;

    var f = fstart;
    fstop *= 1.0001; // capture that last freq point!
    while (f <= fstop) {
      var omega = 2 * Math.PI * f;
      response[2 * N].push(f); // 2*N for magnitude and phase

      // Find complex x+jy that sats Gx-omega*Cy=rhs; omega*Cx+Gy=0
      // Note: solac[0:N-1]=x, solac[N:2N-1]=y
      for (var i = N - 1; i >= 0; --i) {
        // First the rhs, replicated for real and imaginary
        matrixac[i][2 * N] = this.rhs[i];
        matrixac[i + N][2 * N] = 0;

        for (var j = N - 1; j >= 0; --j) {
          matrixac[i][j] = G[i][j];
          matrixac[i + N][j + N] = G[i][j];
          matrixac[i][j + N] = -omega * C[i][j];
          matrixac[i + N][j] = omega * C[i][j];
        }
      }

      // Compute the small signal response
      var solac = mat_solve(matrixac);

      // Save magnitude and phase
      for (var i = N - 1; i >= 0; --i) {
        var mag = Math.sqrt(solac[i] * solac[i] + solac[i + N] * solac[i + N]);
        response[i].push(mag);

        // Avoid wrapping phase, add or sub 180 for each jump
        var phase = 180 * (Math.atan2(solac[i + N], solac[i]) / Math.PI);
        var phasei = response[i + N];
        var L = phasei.length;
        // Look for a one-step jump greater than 90 degrees
        if (L > 1) {
          var phase_jump = phase + phase_offset[i] - phasei[L - 1];
          if (phase_jump > 90) {
            phase_offset[i] -= 360;
          } else if (phase_jump < -90) {
            phase_offset[i] += 360;
          }
        }
        response[i + N].push(phase + phase_offset[i]);
      }
      f *= delta_f; // increment frequency
    }

    // create solution dictionary
    var result = [];
    for (var name in this.node_map) {
      var index = this.node_map[name];
      result[name] = index == -1 ? 0 : response[index];
      result[name + "_phase"] = index == -1 ? 0 : response[index + N];
    }
    result["_frequencies_"] = response[2 * N];
    return result;
  };

  // Helper for adding devices to a circuit, warns on duplicate device names.
  Circuit.prototype.add_device = function (d, name) {
    // Add device to list of devices and to device map
    this.devices.push(d);
    d.name = name;
    if (name) {
      if (this.device_map[name] === undefined) this.device_map[name] = d;
      else {
        alert("Warning: two circuit elements share the same name " + name);
        this.device_map[name] = d;
      }
    }
    return d;
  };

  Circuit.prototype.r = function (n1, n2, v, name) {
    // try to convert string value into numeric value, barf if we can't
    if (typeof v == "string") {
      v = parse_number(v, undefined);
      if (v === undefined) return undefined;
    }

    if (v != 0) {
      var d = new Resistor(n1, n2, v);
      return this.add_device(d, name);
    } else return this.v(n1, n2, "0", name); // zero resistance == 0V voltage source
  };

  Circuit.prototype.d = function (n1, n2, area, type, name) {
    // try to convert string value into numeric value, barf if we can't
    if (typeof area == "string") {
      area = parse_number(area, undefined);
      if (area === undefined) return undefined;
    }

    if (area != 0) {
      var d = new Diode(n1, n2, area, type);
      return this.add_device(d, name);
    } // zero area diodes discarded.
  };

  Circuit.prototype.c = function (n1, n2, v, name) {
    // try to convert string value into numeric value, barf if we can't
    if (typeof v == "string") {
      v = parse_number(v, undefined);
      if (v === undefined) return undefined;
    }
    var d = new Capacitor(n1, n2, v);
    return this.add_device(d, name);
  };

  Circuit.prototype.l = function (n1, n2, v, name) {
    // try to convert string value into numeric value, barf if we can't
    if (typeof v == "string") {
      v = parse_number(v, undefined);
      if (v === undefined) return undefined;
    }
    var branch = this.node(undefined, T_CURRENT);
    var d = new Inductor(n1, n2, branch, v);
    return this.add_device(d, name);
  };

  Circuit.prototype.v = function (n1, n2, v, name) {
    var branch = this.node(undefined, T_CURRENT);
    var d = new VSource(n1, n2, branch, v);
    this.voltage_sources.push(d);
    return this.add_device(d, name);
  };

  Circuit.prototype.i = function (n1, n2, v, name) {
    var d = new ISource(n1, n2, v);
    this.current_sources.push(d);
    return this.add_device(d, name);
  };

  Circuit.prototype.opamp = function (np, nn, no, ng, A, name) {
    var ratio;
    // try to convert string value into numeric value, barf if we can't
    if (typeof A == "string") {
      ratio = parse_number(A, undefined);
      if (A === undefined) return undefined;
    }
    var branch = this.node(undefined, T_CURRENT);
    var d = new Opamp(np, nn, no, ng, branch, A, name);
    return this.add_device(d, name);
  };

  Circuit.prototype.n = function (d, g, s, ratio, name) {
    // try to convert string value into numeric value, barf if we can't
    if (typeof ratio == "string") {
      ratio = parse_number(ratio, undefined);
      if (ratio === undefined) return undefined;
    }
    var d = new Fet(d, g, s, ratio, name, "n");
    return this.add_device(d, name);
  };

  Circuit.prototype.p = function (d, g, s, ratio, name) {
    // try to convert string value into numeric value, barf if we can't
    if (typeof ratio == "string") {
      ratio = parse_number(ratio, undefined);
      if (ratio === undefined) return undefined;
    }
    var d = new Fet(d, g, s, ratio, name, "p");
    return this.add_device(d, name);
  };

  ///////////////////////////////////////////////////////////////////////////////
  //
  //  Support for creating conductance and capacitance matrices associated with
  //  modified nodal analysis (unknowns are node voltages and inductor and voltage
  //  source currents).
  //  The linearized circuit is written as
  //          C d/dt x = G x + rhs
  //  x - vector of node voltages and element currents
  //  rhs - vector of source values
  //  C - Matrix whose values are capacitances and inductances, has many zero rows.
  //  G - Matrix whose values are conductances and +-1's.
  //
  ////////////////////////////////////////////////////////////////////////////////

  // add val component between two nodes to matrix M
  // Index of -1 refers to ground node
  Circuit.prototype.add_two_terminal = function (i, j, g, M) {
    if (i >= 0) {
      M[i][i] += g;
      if (j >= 0) {
        M[i][j] -= g;
        M[j][i] -= g;
        M[j][j] += g;
      }
    } else if (j >= 0) M[j][j] += g;
  };

  // add val component between two nodes to matrix M
  // Index of -1 refers to ground node
  Circuit.prototype.get_two_terminal = function (i, j, x) {
    var xi_minus_xj = 0;
    if (i >= 0) xi_minus_xj = x[i];
    if (j >= 0) xi_minus_xj -= x[j];
    return xi_minus_xj;
  };

  Circuit.prototype.add_conductance_l = function (i, j, g) {
    this.add_two_terminal(i, j, g, this.Gl);
  };

  Circuit.prototype.add_conductance = function (i, j, g) {
    this.add_two_terminal(i, j, g, this.G);
  };

  Circuit.prototype.add_capacitance = function (i, j, c) {
    this.add_two_terminal(i, j, c, this.C);
  };

  // add individual conductance to Gl matrix
  Circuit.prototype.add_to_Gl = function (i, j, g) {
    if (i >= 0 && j >= 0) this.Gl[i][j] += g;
  };

  // add individual conductance to Gl matrix
  Circuit.prototype.add_to_G = function (i, j, g) {
    if (i >= 0 && j >= 0) this.G[i][j] += g;
  };

  // add individual capacitance to C matrix
  Circuit.prototype.add_to_C = function (i, j, c) {
    if (i >= 0 && j >= 0) this.C[i][j] += c;
  };

  // add source info to rhs
  Circuit.prototype.add_to_rhs = function (i, v, rhs) {
    if (i >= 0) rhs[i] += v;
  };

  ///////////////////////////////////////////////////////////////////////////////
  //
  //  Generic matrix support - making, copying, factoring, rank, etc
  //  Note, Matrices are stored using nested javascript arrays.
  ////////////////////////////////////////////////////////////////////////////////

  // Allocate an NxM matrix
  function mat_make(N, M) {
    var mat = new Array(N);
    for (var i = N - 1; i >= 0; --i) {
      mat[i] = new Array(M);
      for (var j = M - 1; j >= 0; --j) {
        mat[i][j] = 0.0;
      }
    }
    return mat;
  }

  // Form b = scale*Mx
  function mat_v_mult(M, x, b, scale) {
    var n = M.length;
    var m = M[0].length;

    if (n != b.length || m != x.length) throw "Rows of M mismatched to b or cols mismatch to x.";

    for (var i = 0; i < n; i++) {
      var temp = 0;
      for (var j = 0; j < m; j++) temp += M[i][j] * x[j];
      b[i] = scale * temp; // Recall the neg in the name
    }
  }

  // C = scalea*A + scaleb*B, scalea, scaleb eithers numbers or arrays (row scaling)
  function mat_scale_add(A, B, scalea, scaleb, C) {
    var n = A.length;
    var m = A[0].length;

    if (n > B.length || m > B[0].length) throw "Row or columns of A to large for B";
    if (n > C.length || m > C[0].length) throw "Row or columns of A to large for C";
    if (typeof scalea == "number" && typeof scaleb == "number")
      for (var i = 0; i < n; i++) for (var j = 0; j < m; j++) C[i][j] = scalea * A[i][j] + scaleb * B[i][j];
    else if (typeof scaleb == "number" && scalea instanceof Array)
      for (var i = 0; i < n; i++) for (var j = 0; j < m; j++) C[i][j] = scalea[i] * A[i][j] + scaleb * B[i][j];
    else if ((typeof scaleb) instanceof Array && scalea instanceof Array)
      for (var i = 0; i < n; i++) for (var j = 0; j < m; j++) C[i][j] = scalea[i] * A[i][j] + scaleb[i] * B[i][j];
    else throw "scalea and scaleb must be scalars or Arrays";
  }

  // Returns a vector of ones and zeros, ones denote algebraic
  // variables (rows that can be removed without changing rank(M).
  Circuit.prototype.algebraic = function (M) {
    var Nr = M.length;
    var Mc = mat_make(Nr, Nr);
    mat_copy(M, Mc);
    var R = mat_rank(Mc);

    var one_if_alg = new Array(Nr);
    for (var row = 0; row < Nr; row++) {
      // psuedo gnd row small
      for (var col = Nr - 1; col >= 0; --col) Mc[row][col] = 0;
      if (mat_rank(Mc) == R)
        // Zeroing row left rank unchanged
        one_if_alg[row] = 1;
      else {
        // Zeroing row changed rank, put back
        for (var col = Nr - 1; col >= 0; --col) Mc[row][col] = M[row][col];
        one_if_alg[row] = 0;
      }
    }
    return one_if_alg;
  };

  // Copy A -> using the bounds of A
  function mat_copy(src, dest) {
    var n = src.length;
    var m = src[0].length;
    if (n > dest.length || m > dest[0].length) throw "Rows or cols > rows or cols of dest";

    for (var i = 0; i < n; i++) for (var j = 0; j < m; j++) dest[i][j] = src[i][j];
  }
  // Copy and transpose A -> using the bounds of A
  function mat_copy_transposed(src, dest) {
    var n = src.length;
    var m = src[0].length;
    if (n > dest[0].length || m > dest.length) throw "Rows or cols > cols or rows of dest";

    for (var i = 0; i < n; i++) for (var j = 0; j < m; j++) dest[j][i] = src[i][j];
  }

  // Uses GE to determine rank.
  function mat_rank(Mo) {
    var Nr = Mo.length; // Number of rows
    var Nc = Mo[0].length; // Number of columns
    var temp, i, j;
    // Make a copy to avoid overwriting
    var M = mat_make(Nr, Nc);
    mat_copy(Mo, M);

    // Find matrix maximum entry
    var max_abs_entry = 0;
    for (var row = Nr - 1; row >= 0; --row) {
      for (var col = Nr - 1; col >= 0; --col) {
        if (Math.abs(M[row][col]) > max_abs_entry) max_abs_entry = Math.abs(M[row][col]);
      }
    }

    // Gaussian elimination to find rank
    var the_rank = 0;
    var start_col = 0;
    for (var row = 0; row < Nr; row++) {
      // Search for first nonzero column in the remaining rows.
      for (var col = start_col; col < Nc; col++) {
        var max_v = Math.abs(M[row][col]);
        var max_row = row;
        for (var i = row + 1; i < Nr; i++) {
          temp = Math.abs(M[i][col]);
          if (temp > max_v) {
            max_v = temp;
            max_row = i;
          }
        }
        // if max_v non_zero, column is nonzero, eliminate in subsequent rows
        if (Math.abs(max_v) > eps * max_abs_entry) {
          start_col = col + 1;
          the_rank += 1;
          // Swap rows to get max in M[row][col]
          temp = M[row];
          M[row] = M[max_row];
          M[max_row] = temp;

          // now eliminate this column for all subsequent rows
          for (var i = row + 1; i < Nr; i++) {
            temp = M[i][col] / M[row][col]; // multiplier for current row
            if (temp != 0)
              // subtract
              for (var j = col; j < Nc; j++) M[i][j] -= M[row][j] * temp;
          }
          // Now move on to the next row
          break;
        }
      }
    }

    return the_rank;
  }

  // Solve Mx=b and return vector x using R^TQ^T factorization.
  // Multiplication by R^T implicit, should be null-space free soln.
  // M should have the extra column!
  // Almost everything is in-lined for speed, sigh.
  function mat_solve_rq(M, rhs) {
    var scale;
    var Nr = M.length; // Number of rows
    var Nc = M[0].length; // Number of columns

    // Copy the rhs in to the last column of M if one is given.
    if (rhs != null) {
      for (var row = Nr - 1; row >= 0; --row) M[row][Nc - 1] = rhs[row];
    }

    var mat_scale = 0; // Sets the scale for comparison to zero.
    var max_nonzero_row = Nr - 1; // Assumes M nonsingular.
    for (var row = 0; row < Nr; row++) {
      // Find largest row with largest 2-norm
      var max_row = row;
      var maxsumsq = 0;
      for (var rowp = row; rowp < Nr; rowp++) {
        var Mr = M[rowp];
        var sumsq = 0;
        for (
          var col = Nc - 2;
          col >= 0;
          --col // Last col=rhs
        )
          sumsq += Mr[col] * Mr[col];
        if (row == rowp || sumsq > maxsumsq) {
          max_row = rowp;
          maxsumsq = sumsq;
        }
      }
      if (max_row > row) {
        // Swap rows if not max row
        var temp = M[row];
        M[row] = M[max_row];
        M[max_row] = temp;
      }

      // Calculate row norm, save if this is first (largest)
      var row_norm = Math.sqrt(maxsumsq);
      if (row == 0) mat_scale = row_norm;

      // Check for all zero rows
      if (row_norm > mat_scale * eps) scale = 1.0 / row_norm;
      else {
        max_nonzero_row = row - 1; // Rest will be nullspace of M
        break;
      }

      // Nonzero row, eliminate from rows below
      var Mr = M[row];
      for (
        var col = Nc - 1;
        col >= 0;
        --col // Scale rhs also
      )
        Mr[col] *= scale;
      for (var rowp = row + 1; rowp < Nr; rowp++) {
        // Update.
        var Mrp = M[rowp];
        var inner = 0;
        for (
          var col = Nc - 2;
          col >= 0;
          --col // Project
        )
          inner += Mr[col] * Mrp[col];
        for (
          var col = Nc - 1;
          col >= 0;
          --col // Ortho (rhs also)
        )
          Mrp[col] -= inner * Mr[col];
      }
    }

    // Last Column of M has inv(R^T)*rhs.  Scale rows of Q to get x.
    var x = new Array(Nc - 1);
    for (var col = Nc - 2; col >= 0; --col) x[col] = 0;
    for (var row = max_nonzero_row; row >= 0; --row) {
      Mr = M[row];
      for (var col = Nc - 2; col >= 0; --col) {
        x[col] += Mr[col] * Mr[Nc - 1];
      }
    }

    return x;
  }

  // solve Mx=b and return vector x given augmented matrix M = [A | b]
  // Uses Gaussian elimination with partial pivoting
  function mat_solve(M, rhs) {
    var N = M.length; // augmented matrix M has N rows, N+1 columns
    var temp, i, j;

    // Copy the rhs in to the last column of M if one is given.
    if (rhs != null) {
      for (var row = 0; row < N; row++) M[row][N] = rhs[row];
    }

    // gaussian elimination
    for (var col = 0; col < N; col++) {
      // find pivot: largest abs(v) in this column of remaining rows
      var max_v = Math.abs(M[col][col]);
      var max_col = col;
      for (i = col + 1; i < N; i++) {
        temp = Math.abs(M[i][col]);
        if (temp > max_v) {
          max_v = temp;
          max_col = i;
        }
      }

      // if no value found, generate a small conductance to gnd
      // otherwise swap current row with pivot row
      if (max_v == 0) M[col][col] = eps;
      else {
        temp = M[col];
        M[col] = M[max_col];
        M[max_col] = temp;
      }

      // now eliminate this column for all subsequent rows
      for (i = col + 1; i < N; i++) {
        temp = M[i][col] / M[col][col]; // multiplier we'll use for current row
        if (temp != 0)
          // subtract current row from row we're working on
          // remember to process b too!
          for (j = col; j <= N; j++) M[i][j] -= M[col][j] * temp;
      }
    }

    // matrix is now upper triangular, so solve for elements of x starting
    // with the last row
    var x = new Array(N);
    for (i = N - 1; i >= 0; --i) {
      temp = M[i][N]; // grab b[i] from augmented matrix as RHS
      // subtract LHS term from RHS using known x values
      for (j = N - 1; j > i; --j) temp -= M[i][j] * x[j];
      // now compute new x value
      x[i] = temp / M[i][i];
    }

    return x;
  }

  // test solution code, expect x = [2,3,-1]
  //M = [[2,1,-1,8],[-3,-1,2,-11],[-2,1,2,-3]];
  //x = mat_solve(M);
  //y = 1;  // so we have place to set a breakpoint :)

  ///////////////////////////////////////////////////////////////////////////////
  //
  //  Device base class
  //
  ////////////////////////////////////////////////////////////////////////////////

  function Device() {}

  // complete initial set up of device
  Device.prototype.finalize = function () {};

  // Load the linear elements in to Gl and C
  Device.prototype.load_linear = function (ckt) {};

  // load linear system equations for dc analysis
  // (inductors shorted and capacitors opened)
  Device.prototype.load_dc = function (ckt, soln, rhs) {};

  // load linear system equations for tran analysis
  Device.prototype.load_tran = function (ckt, soln) {};

  // load linear system equations for ac analysis:
  // current sources open, voltage sources shorted
  // linear models at operating point for everyone else
  Device.prototype.load_ac = function (ckt, rhs) {};

  // return time of next breakpoint for the device
  Device.prototype.breakpoint = function (time) {
    return undefined;
  };

  ///////////////////////////////////////////////////////////////////////////////
  //
  //  Parse numbers in engineering notation
  //
  ///////////////////////////////////////////////////////////////////////////////

  // convert first character of argument into an integer
  function ord(ch) {
    return ch.charCodeAt(0);
  }

  // convert string argument to a number, accepting usual notations
  // (hex, octal, binary, decimal, floating point) plus engineering
  // scale factors (eg, 1k = 1000.0 = 1e3).
  // return default if argument couldn't be interpreted as a number
  function parse_number(s, default_v) {
    var slen = s.length;
    var multiplier = 1;
    var result = 0;
    var index = 0;

    // skip leading whitespace
    while (index < slen && s.charAt(index) <= " ") index += 1;
    if (index == slen) return default_v;

    // check for leading sign
    if (s.charAt(index) == "-") {
      multiplier = -1;
      index += 1;
    } else if (s.charAt(index) == "+") index += 1;
    var start = index; // remember where digits start

    // if leading digit is 0, check for hex, octal or binary notation
    if (index >= slen) return default_v;
    else if (s.charAt(index) == "0") {
      index += 1;
      if (index >= slen) return 0;
      if (s.charAt(index) == "x" || s.charAt(index) == "X") {
        // hex
        while (true) {
          index += 1;
          if (index >= slen) break;
          if (s.charAt(index) >= "0" && s.charAt(index) <= "9") result = result * 16 + ord(s.charAt(index)) - ord("0");
          else if (s.charAt(index) >= "A" && s.charAt(index) <= "F")
            result = result * 16 + ord(s.charAt(index)) - ord("A") + 10;
          else if (s.charAt(index) >= "a" && s.charAt(index) <= "f")
            result = result * 16 + ord(s.charAt(index)) - ord("a") + 10;
          else break;
        }
        return result * multiplier;
      } else if (s.charAt(index) == "b" || s.charAt(index) == "B") {
        // binary
        while (true) {
          index += 1;
          if (index >= slen) break;
          if (s.charAt(index) >= "0" && s.charAt(index) <= "1") result = result * 2 + ord(s.charAt(index)) - ord("0");
          else break;
        }
        return result * multiplier;
      } else if (s.charAt(index) != ".") {
        // octal
        while (true) {
          if (s.charAt(index) >= "0" && s.charAt(index) <= "7") result = result * 8 + ord(s.charAt(index)) - ord("0");
          else break;
          index += 1;
          if (index >= slen) break;
        }
        return result * multiplier;
      }
    }
    // read decimal integer or floating-point number
    while (true) {
      if (s.charAt(index) >= "0" && s.charAt(index) <= "9") result = result * 10 + ord(s.charAt(index)) - ord("0");
      else break;
      index += 1;
      if (index >= slen) break;
    }

    // fractional part?
    if (index < slen && s.charAt(index) == ".") {
      while (true) {
        index += 1;
        if (index >= slen) break;
        if (s.charAt(index) >= "0" && s.charAt(index) <= "9") {
          result = result * 10 + ord(s.charAt(index)) - ord("0");
          multiplier *= 0.1;
        } else break;
      }
    }

    // if we haven't seen any digits yet, don't check
    // for exponents or scale factors
    if (index == start) return default_v;

    // type of multiplier determines type of result:
    // multiplier is a float if we've seen digits past
    // a decimal point, otherwise it's an int or long.
    // Up to this point result is an int or long.
    result *= multiplier;

    // now check for exponent or engineering scale factor.  If there
    // is one, result will be a float.
    if (index < slen) {
      var scale = s.charAt(index);
      index += 1;
      if (scale == "e" || scale == "E") {
        var exponent = 0;
        multiplier = 10.0;
        if (index < slen) {
          if (s.charAt(index) == "+") index += 1;
          else if (s.charAt(index) == "-") {
            index += 1;
            multiplier = 0.1;
          }
        }
        while (index < slen) {
          if (s.charAt(index) >= "0" && s.charAt(index) <= "9") {
            exponent = exponent * 10 + ord(s.charAt(index)) - ord("0");
            index += 1;
          } else break;
        }
        while (exponent > 0) {
          exponent -= 1;
          result *= multiplier;
        }
      } else if (scale == "t" || scale == "T") result *= 1e12;
      else if (scale == "g" || scale == "G") result *= 1e9;
      else if (scale == "M") result *= 1e6;
      else if (scale == "k" || scale == "K") result *= 1e3;
      else if (scale == "m") result *= 1e-3;
      else if (scale == "u" || scale == "U") result *= 1e-6;
      else if (scale == "n" || scale == "N") result *= 1e-9;
      else if (scale == "p" || scale == "P") result *= 1e-12;
      else if (scale == "f" || scale == "F") result *= 1e-15;
    }
    // ignore any remaining chars, eg, 1kohms returns 1000
    return result;
  }

  Circuit.prototype.parse_number = parse_number; // make it easy to call from outside

  ///////////////////////////////////////////////////////////////////////////////
  //
  //  Sources
  //
  ///////////////////////////////////////////////////////////////////////////////

  // argument is a string describing the source's value (see comments for details)
  // source types: dc,step,square,triangle,sin,pulse,pwl,pwl_repeating

  // returns an object with the following attributes:
  //   fun -- name of source function
  //   args -- list of argument values
  //   value(t) -- compute source value at time t
  //   inflection_point(t) -- compute time after t when a time point is needed
  //   dc -- value at time 0
  //   period -- repeat period for periodic sources (0 if not periodic)

  function parse_source(v) {
    // generic parser: parse v as either <value> or <fun>(<value>,...)
    var src = {};
    src.period = 0; // Default not periodic
    src.value = function (t) {
      return 0;
    }; // overridden below
    src.inflection_point = function (t) {
      return undefined;
    }; // may be overridden below

    // see if there's a "(" in the description
    var index = v.indexOf("(");
    var ch;
    if (index >= 0) {
      src.fun = v.slice(0, index); // function name is before the "("
      src.args = []; // we'll push argument values onto this list
      var end = v.indexOf(")", index);
      if (end == -1) end = v.length;

      index += 1; // start parsing right after "("
      while (index < end) {
        // figure out where next argument value starts
        ch = v.charAt(index);
        if (ch <= " ") {
          index++;
          continue;
        }
        // and where it ends
        var arg_end = v.indexOf(",", index);
        if (arg_end == -1) arg_end = end;
        // parse and save result in our list of arg values
        src.args.push(parse_number(v.slice(index, arg_end), undefined));
        index = arg_end + 1;
      }
    } else {
      src.fun = "dc";
      src.args = [parse_number(v, 0)];
    }

    // post-processing for constant sources
    // dc(v)
    if (src.fun == "dc") {
      var v = arg_value(src.args, 0, 0);
      src.args = [v];
      src.value = function (t) {
        return v;
      }; // closure
    }

    // post-processing for impulse sources
    // impulse(height,width)
    else if (src.fun == "impulse") {
      var h = arg_value(src.args, 0, 1); // default height: 1
      var w = Math.abs(arg_value(src.args, 2, 1e-9)); // default width: 1ns
      src.args = [h, w]; // remember any defaulted values
      pwl_source(src, [0, 0, w / 2, h, w, 0], false);
    }

    // post-processing for step sources
    // step(v_init,v_plateau,t_delay,t_rise)
    else if (src.fun == "step") {
      var v1 = arg_value(src.args, 0, 0); // default init value: 0V
      var v2 = arg_value(src.args, 1, 1); // default plateau value: 1V
      var td = Math.max(0, arg_value(src.args, 2, 0)); // time step starts
      var tr = Math.abs(arg_value(src.args, 3, 1e-9)); // default rise time: 1ns
      src.args = [v1, v2, td, tr]; // remember any defaulted values
      pwl_source(src, [td, v1, td + tr, v2], false);
    }

    // post-processing for square wave
    // square(v_init,v_plateau,freq,duty_cycle)
    else if (src.fun == "square") {
      var v1 = arg_value(src.args, 0, 0); // default init value: 0V
      var v2 = arg_value(src.args, 1, 1); // default plateau value: 1V
      var freq = Math.abs(arg_value(src.args, 2, 1)); // default frequency: 1Hz
      var duty_cycle = Math.min(100, Math.abs(arg_value(src.args, 3, 50))); // default duty cycle: 0.5
      src.args = [v1, v2, freq, duty_cycle]; // remember any defaulted values

      var per = freq == 0 ? Infinity : 1 / freq;
      var t_change = 0.01 * per; // rise and fall time
      var t_pw = 0.01 * duty_cycle * 0.98 * per; // fraction of cycle minus rise and fall time
      pwl_source(src, [0, v1, t_change, v2, t_change + t_pw, v2, t_change + t_pw + t_change, v1, per, v1], true);
    }

    // post-processing for triangle
    // triangle(v_init,v_plateua,t_period)
    else if (src.fun == "triangle") {
      var v1 = arg_value(src.args, 0, 0); // default init value: 0V
      var v2 = arg_value(src.args, 1, 1); // default plateau value: 1V
      var freq = Math.abs(arg_value(src.args, 2, 1)); // default frequency: 1s
      src.args = [v1, v2, freq]; // remember any defaulted values

      var per = freq == 0 ? Infinity : 1 / freq;
      pwl_source(src, [0, v1, per / 2, v2, per, v1], true);
    }

    // post-processing for pwl and pwlr sources
    // pwl[r](t1,v1,t2,v2,...)
    else if (src.fun == "pwl" || src.fun == "pwl_repeating") {
      pwl_source(src, src.args, src.fun == "pwl_repeating");
    }

    // post-processing for pulsed sources
    // pulse(v_init,v_plateau,t_delay,t_rise,t_fall,t_width,t_period)
    else if (src.fun == "pulse") {
      var v1 = arg_value(src.args, 0, 0); // default init value: 0V
      var v2 = arg_value(src.args, 1, 1); // default plateau value: 1V
      var td = Math.max(0, arg_value(src.args, 2, 0)); // time pulse starts
      var tr = Math.abs(arg_value(src.args, 3, 1e-9)); // default rise time: 1ns
      var tf = Math.abs(arg_value(src.args, 4, 1e-9)); // default rise time: 1ns
      var pw = Math.abs(arg_value(src.args, 5, 1e9)); // default pulse width: "infinite"
      var per = Math.abs(arg_value(src.args, 6, 1e9)); // default period: "infinite"
      src.args = [v1, v2, td, tr, tf, pw, per];

      var t1 = td; // time when v1 -> v2 transition starts
      var t2 = t1 + tr; // time when v1 -> v2 transition ends
      var t3 = t2 + pw; // time when v2 -> v1 transition starts
      var t4 = t3 + tf; // time when v2 -> v1 transition ends

      pwl_source(src, [t1, v1, t2, v2, t3, v2, t4, v1, per, v1], true);
    }

    // post-processing for sinusoidal sources
    // sin(v_offset,v_amplitude,freq_hz,t_delay,phase_offset_degrees)
    else if (src.fun == "sin") {
      var voffset = arg_value(src.args, 0, 0); // default offset voltage: 0V
      var va = arg_value(src.args, 1, 1); // default amplitude: -1V to 1V
      var freq = Math.abs(arg_value(src.args, 2, 1)); // default frequency: 1Hz
      src.period = 1.0 / freq;

      var td = Math.max(0, arg_value(src.args, 3, 0)); // default time delay: 0sec
      var phase = arg_value(src.args, 4, 0); // default phase offset: 0 degrees
      src.args = [voffset, va, freq, td, phase];

      phase /= 360.0;

      // return value of source at time t
      src.value = function (t) {
        // closure
        if (t < td) return voffset + va * Math.sin(2 * Math.PI * phase);
        else return voffset + va * Math.sin(2 * Math.PI * (freq * (t - td) + phase));
      };

      // return time of next inflection point after time t
      src.inflection_point = function (t) {
        // closure
        if (t < td) return td;
        else return undefined;
      };
    }

    // object has all the necessary info to compute the source value and inflection points
    src.dc = src.value(0); // DC value is value at time 0
    return src;
  }

  function pwl_source(src, tv_pairs, repeat) {
    var nvals = tv_pairs.length;
    if (repeat) src.period = tv_pairs[nvals - 2]; // Repeat period of source
    if (nvals % 2 == 1) npts -= 1; // make sure it's even!

    if (nvals <= 2) {
      // handle degenerate case
      src.value = function (t) {
        return nvals == 2 ? tv_pairs[1] : 0;
      };
      src.inflection_point = function (t) {
        return undefined;
      };
    } else {
      src.value = function (t) {
        // closure
        if (repeat)
          // make time periodic if values are to be repeated
          t = Math.fmod(t, tv_pairs[nvals - 2]);
        var last_t = tv_pairs[0];
        var last_v = tv_pairs[1];
        if (t > last_t) {
          var next_t, next_v;
          for (var i = 2; i < nvals; i += 2) {
            next_t = tv_pairs[i];
            next_v = tv_pairs[i + 1];
            if (next_t > last_t)
              if (t < next_t)
                // defend against bogus tv pairs
                return last_v + ((next_v - last_v) * (t - last_t)) / (next_t - last_t);
            last_t = next_t;
            last_v = next_v;
          }
        }
        return last_v;
      };
      src.inflection_point = function (t) {
        // closure
        if (repeat)
          // make time periodic if values are to be repeated
          t = Math.fmod(t, tv_pairs[nvals - 2]);
        for (var i = 0; i < nvals; i += 2) {
          var next_t = tv_pairs[i];
          if (t < next_t) return next_t;
        }
        return undefined;
      };
    }
  }

  // helper function: return args[index] if present, else default_v
  function arg_value(args, index, default_v) {
    if (index < args.length) {
      var result = args[index];
      if (result === undefined) result = default_v;
      return result;
    } else return default_v;
  }

  // we need fmod in the Math library!
  Math.fmod = function (numerator, denominator) {
    var quotient = Math.floor(numerator / denominator);
    return numerator - quotient * denominator;
  };

  ///////////////////////////////////////////////////////////////////////////////
  //
  //  Sources
  //
  ///////////////////////////////////////////////////////////////////////////////

  function VSource(npos, nneg, branch, v) {
    Device.call(this);
    this.src = parse_source(v);
    this.npos = npos;
    this.nneg = nneg;
    this.branch = branch;
  }
  VSource.prototype = new Device();
  VSource.prototype.constructor = VSource;

  // load linear part for source evaluation
  VSource.prototype.load_linear = function (ckt) {
    // MNA stamp for independent voltage source
    ckt.add_to_Gl(this.branch, this.npos, 1.0);
    ckt.add_to_Gl(this.branch, this.nneg, -1.0);
    ckt.add_to_Gl(this.npos, this.branch, 1.0);
    ckt.add_to_Gl(this.nneg, this.branch, -1.0);
  };

  // Source voltage added to b.
  VSource.prototype.load_dc = function (ckt, soln, rhs) {
    ckt.add_to_rhs(this.branch, this.src.dc, rhs);
  };

  // Load time-dependent value for voltage source for tran
  VSource.prototype.load_tran = function (ckt, soln, rhs, time) {
    ckt.add_to_rhs(this.branch, this.src.value(time), rhs);
  };

  // return time of next breakpoint for the device
  VSource.prototype.breakpoint = function (time) {
    return this.src.inflection_point(time);
  };

  // small signal model ac value
  VSource.prototype.load_ac = function (ckt, rhs) {
    ckt.add_to_rhs(this.branch, 1.0, rhs);
  };

  function ISource(npos, nneg, v) {
    Device.call(this);
    this.src = parse_source(v);
    this.npos = npos;
    this.nneg = nneg;
  }
  ISource.prototype = new Device();
  ISource.prototype.constructor = ISource;

  ISource.prototype.load_linear = function (ckt) {
    // Current source is open when off, no linear contribution
  };

  // load linear system equations for dc analysis
  ISource.prototype.load_dc = function (ckt, soln, rhs) {
    var is = this.src.dc;

    // MNA stamp for independent current source
    ckt.add_to_rhs(this.npos, -is, rhs); // current flow into npos
    ckt.add_to_rhs(this.nneg, is, rhs); // and out of nneg
  };

  // load linear system equations for tran analysis (just like DC)
  ISource.prototype.load_tran = function (ckt, soln, rhs, time) {
    var is = this.src.value(time);

    // MNA stamp for independent current source
    ckt.add_to_rhs(this.npos, -is, rhs); // current flow into npos
    ckt.add_to_rhs(this.nneg, is, rhs); // and out of nneg
  };

  // return time of next breakpoint for the device
  ISource.prototype.breakpoint = function (time) {
    return this.src.inflection_point(time);
  };

  // small signal model: open circuit
  ISource.prototype.load_ac = function (ckt, rhs) {
    // MNA stamp for independent current source
    ckt.add_to_rhs(this.npos, -1.0, rhs); // current flow into npos
    ckt.add_to_rhs(this.nneg, 1.0, rhs); // and out of nneg
  };

  ///////////////////////////////////////////////////////////////////////////////
  //
  //  Resistor
  //
  ///////////////////////////////////////////////////////////////////////////////

  function Resistor(n1, n2, v) {
    Device.call(this);
    this.n1 = n1;
    this.n2 = n2;
    this.g = 1.0 / v;
  }
  Resistor.prototype = new Device();
  Resistor.prototype.constructor = Resistor;

  Resistor.prototype.load_linear = function (ckt) {
    // MNA stamp for admittance g
    ckt.add_conductance_l(this.n1, this.n2, this.g);
  };

  Resistor.prototype.load_dc = function (ckt) {
    // Nothing to see here, move along.
  };

  Resistor.prototype.load_tran = function (ckt, soln) {};

  Resistor.prototype.load_ac = function (ckt) {};

  ///////////////////////////////////////////////////////////////////////////////
  //
  //  Diode
  //
  ///////////////////////////////////////////////////////////////////////////////

  function Diode(n1, n2, v, type) {
    Device.call(this);
    this.anode = n1;
    this.cathode = n2;
    this.area = v;
    this.type = type; // 'normal' or 'ideal'
    this.is = 1.0e-14;
    this.ais = this.area * this.is;
    this.vt = type == "normal" ? 25.8e-3 : 0.1e-3; // 26mv or .1mv
    this.exp_arg_max = 50; // less than single precision max.
    this.exp_max = Math.exp(this.exp_arg_max);
  }
  Diode.prototype = new Device();
  Diode.prototype.constructor = Diode;

  Diode.prototype.load_linear = function (ckt) {
    // Diode is not linear, has no linear piece.
  };

  Diode.prototype.load_dc = function (ckt, soln, rhs) {
    var vd = ckt.get_two_terminal(this.anode, this.cathode, soln);
    var exp_arg = vd / this.vt;
    var temp1, temp2;
    // Estimate exponential with a quadratic if arg too big.
    var abs_exp_arg = Math.abs(exp_arg);
    var d_arg = abs_exp_arg - this.exp_arg_max;
    if (d_arg > 0) {
      var quad = 1 + d_arg + 0.5 * d_arg * d_arg;
      temp1 = this.exp_max * quad;
      temp2 = this.exp_max * (1 + d_arg);
    } else {
      temp1 = Math.exp(abs_exp_arg);
      temp2 = temp1;
    }
    if (exp_arg < 0) {
      // Use exp(-x) = 1.0/exp(x)
      temp1 = 1.0 / temp1;
      temp2 = temp1 * temp2 * temp1;
    }
    var id = this.ais * (temp1 - 1);
    var gd = this.ais * (temp2 / this.vt);

    // MNA stamp for independent current source
    ckt.add_to_rhs(this.anode, -id, rhs); // current flows into anode
    ckt.add_to_rhs(this.cathode, id, rhs); // and out of cathode
    ckt.add_conductance(this.anode, this.cathode, gd);
  };

  Diode.prototype.load_tran = function (ckt, soln, rhs, time) {
    this.load_dc(ckt, soln, rhs);
  };

  Diode.prototype.load_ac = function (ckt) {};

  ///////////////////////////////////////////////////////////////////////////////
  //
  //  Capacitor
  //
  ///////////////////////////////////////////////////////////////////////////////

  function Capacitor(n1, n2, v) {
    Device.call(this);
    this.n1 = n1;
    this.n2 = n2;
    this.value = v;
  }
  Capacitor.prototype = new Device();
  Capacitor.prototype.constructor = Capacitor;

  Capacitor.prototype.load_linear = function (ckt) {
    // MNA stamp for capacitance matrix
    ckt.add_capacitance(this.n1, this.n2, this.value);
  };

  Capacitor.prototype.load_dc = function (ckt, soln, rhs) {};

  Capacitor.prototype.load_ac = function (ckt) {};

  Capacitor.prototype.load_tran = function (ckt) {};

  ///////////////////////////////////////////////////////////////////////////////
  //
  //  Inductor
  //
  ///////////////////////////////////////////////////////////////////////////////

  function Inductor(n1, n2, branch, v) {
    Device.call(this);
    this.n1 = n1;
    this.n2 = n2;
    this.branch = branch;
    this.value = v;
  }
  Inductor.prototype = new Device();
  Inductor.prototype.constructor = Inductor;

  Inductor.prototype.load_linear = function (ckt) {
    // MNA stamp for inductor linear part
    // L on diag of C because L di/dt = v(n1) - v(n2)
    ckt.add_to_Gl(this.n1, this.branch, 1);
    ckt.add_to_Gl(this.n2, this.branch, -1);
    ckt.add_to_Gl(this.branch, this.n1, -1);
    ckt.add_to_Gl(this.branch, this.n2, 1);
    ckt.add_to_C(this.branch, this.branch, this.value);
  };

  Inductor.prototype.load_dc = function (ckt, soln, rhs) {
    // Inductor is a short at dc, so is linear.
  };

  Inductor.prototype.load_ac = function (ckt) {};

  Inductor.prototype.load_tran = function (ckt) {};

  ///////////////////////////////////////////////////////////////////////////////
  //
  //  Simple Voltage-Controlled Voltage Source Op Amp model
  //
  ///////////////////////////////////////////////////////////////////////////////

  function Opamp(np, nn, no, ng, branch, A, name) {
    Device.call(this);
    this.np = np;
    this.nn = nn;
    this.no = no;
    this.ng = ng;
    this.branch = branch;
    this.gain = A;
    this.name = name;
  }

  Opamp.prototype = new Device();
  Opamp.prototype.constructor = Opamp;
  Opamp.prototype.load_linear = function (ckt) {
    // MNA stamp for VCVS: 1/A(v(no) - v(ng)) - (v(np)-v(nn))) = 0.
    var invA = 1.0 / this.gain;
    ckt.add_to_Gl(this.no, this.branch, 1);
    ckt.add_to_Gl(this.ng, this.branch, -1);
    ckt.add_to_Gl(this.branch, this.no, invA);
    ckt.add_to_Gl(this.branch, this.ng, -invA);
    ckt.add_to_Gl(this.branch, this.np, -1);
    ckt.add_to_Gl(this.branch, this.nn, 1);
  };

  Opamp.prototype.load_dc = function (ckt, soln, rhs) {
    // Op-amp is linear.
  };

  Opamp.prototype.load_ac = function (ckt) {};

  Opamp.prototype.load_tran = function (ckt) {};

  ///////////////////////////////////////////////////////////////////////////////
  //
  //  Simplified MOS FET with no bulk connection and no body effect.
  //
  ///////////////////////////////////////////////////////////////////////////////

  function Fet(d, g, s, ratio, name, type) {
    Device.call(this);
    this.d = d;
    this.g = g;
    this.s = s;
    this.name = name;
    this.ratio = ratio;
    if (type != "n" && type != "p") {
      throw "fet type is not n or p";
    }
    this.type_sign = type == "n" ? 1 : -1;
    this.vt = 0.5;
    this.kp = 20e-6;
    this.beta = this.kp * this.ratio;
    this.lambda = 0.05;
  }
  Fet.prototype = new Device();
  Fet.prototype.constructor = Fet;

  Fet.prototype.load_linear = function (ckt) {
    // FET's are nonlinear, just like javascript progammers
  };

  Fet.prototype.load_dc = function (ckt, soln, rhs) {
    var vds = this.type_sign * ckt.get_two_terminal(this.d, this.s, soln);
    if (vds < 0) {
      // Drain and source have swapped roles
      var temp = this.d;
      this.d = this.s;
      this.s = temp;
      vds = this.type_sign * ckt.get_two_terminal(this.d, this.s, soln);
    }
    var vgs = this.type_sign * ckt.get_two_terminal(this.g, this.s, soln);
    var vgst = vgs - this.vt;
    var gmgs, ids, gds;
    if (vgst > 0.0) {
      // vgst < 0, transistor off, no subthreshold here.
      if (vgst < vds) {
        /* Saturation. */
        gmgs = this.beta * (1 + this.lambda * vds) * vgst;
        ids = this.type_sign * 0.5 * gmgs * vgst;
        gds = 0.5 * this.beta * vgst * vgst * this.lambda;
      } else {
        /* Linear region */
        gmgs = this.beta * (1 + this.lambda * vds);
        ids = this.type_sign * gmgs * vds * (vgst - 0.5 * vds);
        gds = gmgs * (vgst - vds) + this.beta * this.lambda * vds * (vgst - 0.5 * vds);
        gmgs *= vds;
      }
      ckt.add_to_rhs(this.d, -ids, rhs); // current flows into the drain
      ckt.add_to_rhs(this.s, ids, rhs); // and out the source
      ckt.add_conductance(this.d, this.s, gds);
      ckt.add_to_G(this.s, this.s, gmgs);
      ckt.add_to_G(this.d, this.s, -gmgs);
      ckt.add_to_G(this.d, this.g, gmgs);
      ckt.add_to_G(this.s, this.g, -gmgs);
    }
  };

  Fet.prototype.load_tran = function (ckt, soln, rhs) {
    this.load_dc(ckt, soln, rhs);
  };

  Fet.prototype.load_ac = function (ckt) {};

  ///////////////////////////////////////////////////////////////////////////////
  //
  //  Module definition
  //
  ///////////////////////////////////////////////////////////////////////////////
  var module = {
    Circuit: Circuit,
    parse_number: parse_number,
    parse_source: parse_source,
  };
  return module;
})();

/////////////////////////////////////////////////////////////////////////////
//
//  Simple schematic capture
//
////////////////////////////////////////////////////////////////////////////////

// Copyright (C) 2011 Massachusetts Institute of Technology

// add schematics to a document with
//
//   <input type="hidden" class="schematic" name="unique_form_id" value="JSON netlist..." .../>
//
// other attributes you can add to the input tag:
//   width -- width in pixels of diagram
//   height -- height in pixels of diagram
//   parts -- comma-separated list of parts for parts bin (see parts_map),
//            parts="" disables editing of diagram

// JSON schematic representation:
//  sch :=  [part, part, ...]
//  part := [type, coords, properties, connections]
//  type := string (see parts_map)
//  coords := [number, ...]  // (x,y,rot) or (x1,y1,x2,y2)
//  properties := {name: value, ...}
//  connections := [node, ...]   // one per connection point in canoncial order
//  node := string
// need a netlist? just use the part's type, properites and connections

// TO DO:
// - wire labels?
// - zoom/scroll canvas
// - rotate multiple objects around their center of mass
// - rubber band wires when moving components

// set up each schematic entry widget
function update_schematics() {
  // set up each schematic on the page
  var schematics = $(".schematic");
  for (var i = 0; i < schematics.length; ++i)
    if (schematics[i].getAttribute("loaded") != "true") {
      try {
        new schematic.Schematic(schematics[i]);
      } catch (err) {
        var msgdiv = document.createElement("div");
        msgdiv.style.border = "thick solid #FF0000";
        msgdiv.style.margins = "20px";
        msgdiv.style.padding = "20px";
        var msg = document.createTextNode(
          "Sorry, there a browser error in starting the schematic tool.  The tool is known to be compatible with the latest versions of Firefox and Chrome, which we recommend you use.",
        );
        msgdiv.appendChild(msg);
        schematics[i].parentNode.insertBefore(msgdiv, schematics[i]);
      }
      schematics[i].setAttribute("loaded", "true");
    }
}
window.update_schematics = update_schematics;

schematic = (function () {
  var background_style = "rgb(220,220,220)";
  var element_style = "rgb(255,255,255)";
  var thumb_style = "rgb(128,128,128)";
  var normal_style = "rgb(0,0,0)"; // default drawing color
  var component_style = "rgb(64,64,255)"; // color for unselected components
  var selected_style = "rgb(64,255,64)"; // highlight color for selected components
  var grid_style = "rgb(128,128,128)";
  var annotation_style = "rgb(255,64,64)"; // color for diagram annotations
  var property_size = 5; // point size for Component property text
  var annotation_size = 6; // point size for diagram annotations

  var parts_map = {
    g: [Ground, "Ground connection"],
    L: [Label, "Node label"],
    v: [VSource, "Voltage source"],
    i: [ISource, "Current source"],
    r: [Resistor, "Resistor"],
    c: [Capacitor, "Capacitor"],
    l: [Inductor, "Inductor"],
    o: [OpAmp, "Op Amp"],
    d: [Diode, "Diode"],
    n: [NFet, "NFet"],
    p: [PFet, "PFet"],
    s: [Probe, "Voltage Probe"],
    a: [Ammeter, "Current Probe"],
  };

  // global clipboard
  if (typeof sch_clipboard == "undefined") sch_clipboard = [];

  ///////////////////////////////////////////////////////////////////////////////
  //
  //  Schematic = diagram + parts bin + status area
  //
  ////////////////////////////////////////////////////////////////////////////////

  // setup a schematic by populating the <div> with the appropriate children
  function Schematic(input) {
    // set up diagram viewing parameters
    this.show_grid = true;
    this.grid = 8;
    this.scale = 2;
    this.origin_x = input.getAttribute("origin_x");
    if (this.origin_x == undefined) this.origin_x = 0;
    this.origin_y = input.getAttribute("origin_y");
    if (this.origin_y == undefined) this.origin_y = 0;
    this.cursor_x = 0;
    this.cursor_y = 0;
    this.window_list = []; // list of pop-up windows in increasing z order

    // use user-supplied list of parts if supplied
    // else just populate parts bin with all the parts
    this.edits_allowed = true;
    var parts = input.getAttribute("parts");
    if (parts == undefined || parts == "None") {
      parts = [];
      for (var p in parts_map) parts.push(p);
    } else if (parts == "") {
      this.edits_allowed = false;
      parts = [];
    } else parts = parts.split(",");

    // now add the parts to the parts bin
    this.parts_bin = [];
    for (var i = 0; i < parts.length; i++) {
      var part = new Part(this);
      var pm = parts_map[parts[i]];
      part.set_component(new pm[0](0, 0, 0), pm[1]);
      this.parts_bin.push(part);
    }

    // use user-supplied list of analyses, otherwise provide them all
    // analyses="" means no analyses
    var analyses = input.getAttribute("analyses");
    if (analyses == undefined || analyses == "None") analyses = ["dc", "ac", "tran"];
    else if (analyses == "") analyses = [];
    else analyses = analyses.split(",");

    if (parts.length == 0 && analyses.length == 0) this.diagram_only = true;
    else this.diagram_only = false;

    // see what we need to submit.  Expecting attribute of the form
    // submit_analyses="{'tran':[[node_name,t1,t2,t3],...],
    //                   'ac':[[node_name,f1,f2,...],...]}"
    var submit = input.getAttribute("submit_analyses");
    if (submit && submit.indexOf("{") != -1) this.submit_analyses = JSON.parse(submit);
    else this.submit_analyses = undefined;

    // toolbar
    this.tools = [];
    this.toolbar = [];

    /* DISABLE HELP BUTTON (target URL not consistent with multicourse hierarchy) -- SJSU
	    if (!this.diagram_only) {
		this.tools['help'] = this.add_tool(help_icon,'Help: display help page',this.help);
		this.enable_tool('help',true);
		this.toolbar.push(null);  // spacer
	    }
        END DISABLE HELP BUTTON -- SJSU */

    if (this.edits_allowed) {
      this.tools["grid"] = this.add_tool(grid_icon, "Grid: toggle grid display", this.toggle_grid);
      this.enable_tool("grid", true);
      this.tools["cut"] = this.add_tool(
        cut_icon,
        "Cut: move selected components from diagram to the clipboard",
        this.cut,
      );
      this.tools["copy"] = this.add_tool(copy_icon, "Copy: copy selected components into the clipboard", this.copy);
      this.tools["paste"] = this.add_tool(paste_icon, "Paste: copy clipboard into the diagram", this.paste);
      this.toolbar.push(null); // spacer
    }

    // simulation interface if cktsim.js is loaded
    if (typeof cktsim != "undefined") {
      if (analyses.indexOf("dc") != -1) {
        this.tools["dc"] = this.add_tool("DC", "DC Analysis", this.dc_analysis);
        this.enable_tool("dc", true);
        this.dc_max_iters = "1000"; // default values dc solution
      }

      if (analyses.indexOf("ac") != -1) {
        this.tools["ac"] = this.add_tool("AC", "AC Small-Signal Analysis", this.setup_ac_analysis);
        this.enable_tool("ac", true);
        this.ac_npts = "50"; // default values for AC Analysis
        this.ac_fstart = "10";
        this.ac_fstop = "1G";
        this.ac_source_name = undefined;
      }

      if (analyses.indexOf("tran") != -1) {
        this.tools["tran"] = this.add_tool("TRAN", "Transient Analysis", this.transient_analysis);
        this.enable_tool("tran", true);
        this.tran_npts = "100"; // default values for transient analysis
        this.tran_tstop = "1";
      }
    }

    // set up diagram canvas
    this.canvas = document.createElement("canvas");
    this.width = input.getAttribute("width");
    this.width = parseInt(this.width == undefined ? "400" : this.width);
    this.canvas.width = this.width;
    this.height = input.getAttribute("height");
    this.height = parseInt(this.height == undefined ? "300" : this.height);
    this.canvas.height = this.height;

    this.sctl_r = 16; // scrolling control parameters
    this.sctl_x = this.sctl_r + 8; // upper left
    this.sctl_y = this.sctl_r + 8;
    this.zctl_left = this.sctl_x - 8;
    this.zctl_top = this.sctl_y + this.sctl_r + 8;

    // repaint simply draws this buffer and then adds selected elements on top
    this.bg_image = document.createElement("canvas");
    this.bg_image.width = this.width;
    this.bg_image.height = this.height;

    if (!this.diagram_only) {
      this.canvas.tabIndex = 0; // so we get keystrokes
      this.canvas.style.borderStyle = "solid";
      this.canvas.style.borderWidth = "1px";
      this.canvas.style.borderColor = grid_style;
      this.canvas.style.outline = "none";
    }

    this.canvas.schematic = this;
    if (this.edits_allowed) {
      this.canvas.addEventListener("mousemove", schematic_mouse_move, false);
      this.canvas.addEventListener("mouseover", schematic_mouse_enter, false);
      this.canvas.addEventListener("mouseout", schematic_mouse_leave, false);
      this.canvas.addEventListener("mousedown", schematic_mouse_down, false);
      this.canvas.addEventListener("mouseup", schematic_mouse_up, false);
      this.canvas.addEventListener("mousewheel", schematic_mouse_wheel, false);
      this.canvas.addEventListener("DOMMouseScroll", schematic_mouse_wheel, false); // for FF
      this.canvas.addEventListener("dblclick", schematic_double_click, false);
      this.canvas.addEventListener("keydown", schematic_key_down, false);
      this.canvas.addEventListener("keyup", schematic_key_up, false);
    }

    // set up message area
    if (!this.diagram_only) {
      this.status_div = document.createElement("div");
      this.status = document.createTextNode("");
      this.status_div.appendChild(this.status);
      this.status_div.style.height = status_height + "px";
    } else this.status_div = undefined;

    this.connection_points = []; // location string => list of cp's
    this.components = [];
    this.dragging = false;
    this.select_rect = undefined;
    this.wire = undefined;
    this.operating_point = undefined; // result from DC analysis
    this.dc_results = undefined; // saved analysis results for submission
    this.ac_results = undefined; // saved analysis results for submission
    this.transient_results = undefined; // saved analysis results for submission

    // state of modifier keys
    this.ctrlKey = false;
    this.shiftKey = false;
    this.altKey = false;
    this.cmdKey = false;

    // make sure other code can find us!
    input.schematic = this;
    this.input = input;

    // set up DOM -- use nested tables to do the layout
    var table, tr, td;
    table = document.createElement("table");
    table.rules = "none";
    if (!this.diagram_only) {
      table.frame = "box";
      table.style.borderStyle = "solid";
      table.style.borderWidth = "2px";
      table.style.borderColor = normal_style;
      table.style.backgroundColor = background_style;
    }

    // add tools to DOM
    if (this.toolbar.length > 0) {
      tr = document.createElement("tr");
      table.appendChild(tr);
      td = document.createElement("td");
      td.style.verticalAlign = "top";
      td.colSpan = 2;
      tr.appendChild(td);
      for (var i = 0; i < this.toolbar.length; ++i) {
        var tool = this.toolbar[i];
        if (tool != null) td.appendChild(tool);
      }
    }

    // add canvas and parts bin to DOM
    tr = document.createElement("tr");
    table.appendChild(tr);

    td = document.createElement("td");
    tr.appendChild(td);
    var wrapper = document.createElement("div"); // for inserting pop-up windows
    td.appendChild(wrapper);
    wrapper.style.position = "relative"; // so we can position subwindows
    wrapper.appendChild(this.canvas);

    td = document.createElement("td");
    td.style.verticalAlign = "top";
    tr.appendChild(td);
    var parts_table = document.createElement("table");
    td.appendChild(parts_table);
    parts_table.rules = "none";
    parts_table.frame = "void";
    parts_table.cellPadding = "0";
    parts_table.cellSpacing = "0";

    // fill in parts_table
    var parts_per_column = Math.floor(this.height / (part_h + 5)); // mysterious extra padding
    for (var i = 0; i < parts_per_column; ++i) {
      tr = document.createElement("tr");
      parts_table.appendChild(tr);
      for (var j = i; j < this.parts_bin.length; j += parts_per_column) {
        td = document.createElement("td");
        tr.appendChild(td);
        td.appendChild(this.parts_bin[j].canvas);
      }
    }

    if (this.status_div != undefined) {
      tr = document.createElement("tr");
      table.appendChild(tr);
      td = document.createElement("td");
      tr.appendChild(td);
      td.colSpan = 2;
      td.appendChild(this.status_div);
    }

    // add to dom
    // avoid Chrome bug that changes to text cursor whenever
    // drag starts.  Just do this in schematic tool...
    var toplevel = document.createElement("div");
    toplevel.onselectstart = function () {
      return false;
    };
    toplevel.appendChild(table);
    this.input.parentNode.insertBefore(toplevel, this.input.nextSibling);

    // process initial contents of diagram
    this.load_schematic(this.input.getAttribute("value"), this.input.getAttribute("initial_value"));

    // start by centering diagram on the screen
    this.zoomall();
  }

  var part_w = 42; // size of a parts bin compartment
  var part_h = 42;
  var status_height = 18;

  Schematic.prototype.add_component = function (new_c) {
    this.components.push(new_c);
    // create undoable edit record here
  };

  Schematic.prototype.remove_component = function (c) {
    var index = this.components.indexOf(c);
    if (index != -1) this.components.splice(index, 1);
  };

  Schematic.prototype.find_connections = function (cp) {
    return this.connection_points[cp.location];
  };

  Schematic.prototype.add_connection_point = function (cp) {
    var cplist = this.connection_points[cp.location];
    if (cplist) cplist.push(cp);
    else {
      cplist = [cp];
      this.connection_points[cp.location] = cplist;
    }

    return cplist;
  };

  Schematic.prototype.remove_connection_point = function (cp, old_location) {
    // remove cp from list at old location
    var cplist = this.connection_points[old_location];
    if (cplist) {
      var index = cplist.indexOf(cp);
      if (index != -1) {
        cplist.splice(index, 1);
        // if no more connections at this location, remove
        // entry from array to keep our search time short
        if (cplist.length == 0) delete this.connection_points[old_location];
      }
    }
  };

  Schematic.prototype.update_connection_point = function (cp, old_location) {
    this.remove_connection_point(cp, old_location);
    return this.add_connection_point(cp);
  };

  Schematic.prototype.add_wire = function (x1, y1, x2, y2) {
    var new_wire = new Wire(x1, y1, x2, y2);
    new_wire.add(this);
    new_wire.move_end();
    return new_wire;
  };

  Schematic.prototype.split_wire = function (w, cp) {
    // remove bisected wire
    w.remove();

    // add two new wires with connection point cp in the middle
    this.add_wire(w.x, w.y, cp.x, cp.y);
    this.add_wire(w.x + w.dx, w.y + w.dy, cp.x, cp.y);
  };

  // see if connection points of component c split any wires
  Schematic.prototype.check_wires = function (c) {
    for (var i = 0; i < this.components.length; i++) {
      var cc = this.components[i];
      if (cc != c) {
        // don't check a component against itself
        // only wires will return non-null from a bisect call
        var cp = cc.bisect(c);
        if (cp) {
          // cc is a wire bisected by connection point cp
          this.split_wire(cc, cp);
          this.redraw_background();
        }
      }
    }
  };

  // see if there are any existing connection points that bisect wire w
  Schematic.prototype.check_connection_points = function (w) {
    for (var locn in this.connection_points) {
      var cplist = this.connection_points[locn];
      if (cplist && w.bisect_cp(cplist[0])) {
        this.split_wire(w, cplist[0]);
        this.redraw_background();

        // stop here, new wires introduced by split will do their own checks
        return;
      }
    }
  };

  // merge collinear wires sharing an end point
  Schematic.prototype.clean_up_wires = function () {
    for (var locn in this.connection_points) {
      var cplist = this.connection_points[locn];
      if (cplist && cplist.length == 2) {
        // found a connection with just two connections, see if they're wires
        var c1 = cplist[0].parent;
        var c2 = cplist[1].parent;
        if (c1.type == "w" && c2.type == "w") {
          var e1 = c1.other_end(cplist[0]);
          var e2 = c2.other_end(cplist[1]);
          var e3 = cplist[0]; // point shared by the two wires
          if (collinear(e1, e2, e3)) {
            c1.remove();
            c2.remove();
            this.add_wire(e1.x, e1.y, e2.x, e2.y);
          }
        }
      }
    }
  };

  Schematic.prototype.unselect_all = function (which) {
    this.operating_point = undefined; // remove annotations
    for (var i = this.components.length - 1; i >= 0; --i) if (i != which) this.components[i].set_select(false);
  };

  Schematic.prototype.drag_begin = function () {
    // let components know they're about to move
    for (var i = this.components.length - 1; i >= 0; --i) {
      var component = this.components[i];
      if (component.selected) component.move_begin();
    }

    // remember where drag started
    this.drag_x = this.cursor_x;
    this.drag_y = this.cursor_y;
    this.dragging = true;
  };

  Schematic.prototype.drag_end = function () {
    // let components know they're done moving
    for (var i = this.components.length - 1; i >= 0; --i) {
      var component = this.components[i];
      if (component.selected) component.move_end();
    }
    this.dragging = false;
    this.clean_up_wires();
    this.redraw_background();
  };

  Schematic.prototype.help = function () {
    window.open("/static/handouts/schematic_tutorial.pdf");
  };

  // zoom diagram around given coords
  Schematic.prototype.rescale = function (nscale, cx, cy) {
    if (cx == undefined) {
      // use current center point if no point has been specified
      cx = this.origin_x + this.width / (2 * this.scale);
      cy = this.origin_y + this.height / (2 * this.scale);
    }

    this.origin_x += cx * (this.scale - nscale);
    this.origin_y += cy * (this.scale - nscale);
    this.scale = nscale;
    this.redraw_background();
  };

  Schematic.prototype.toggle_grid = function () {
    this.show_grid = !this.show_grid;
    this.redraw_background();
  };

  var zoom_factor = 1.25; // scaling is some power of zoom_factor
  var zoom_min = 0.5;
  var zoom_max = 4.0;
  var origin_min = -200; // in grids
  var origin_max = 200;

  Schematic.prototype.zoomin = function () {
    var nscale = this.scale * zoom_factor;
    if (nscale < zoom_max) {
      // keep center of view unchanged
      this.origin_x += (this.width / 2) * (1.0 / this.scale - 1.0 / nscale);
      this.origin_y += (this.height / 2) * (1.0 / this.scale - 1.0 / nscale);
      this.scale = nscale;
      this.redraw_background();
    }
  };

  Schematic.prototype.zoomout = function () {
    var nscale = this.scale / zoom_factor;
    if (nscale > zoom_min) {
      // keep center of view unchanged
      this.origin_x += (this.width / 2) * (1.0 / this.scale - 1.0 / nscale);
      this.origin_y += (this.height / 2) * (1.0 / this.scale - 1.0 / nscale);
      this.scale = nscale;
      this.redraw_background();
    }
  };

  Schematic.prototype.zoomall = function () {
    // w,h for schematic including a 25% margin on all sides
    var sch_w = 1.5 * (this.bbox[2] - this.bbox[0]);
    var sch_h = 1.5 * (this.bbox[3] - this.bbox[1]);

    if (sch_w == 0 && sch_h == 0) {
      this.origin_x = 0;
      this.origin_y = 0;
      this.scale = 2;
    } else {
      // compute scales that would make schematic fit, choose smallest
      var scale_x = this.width / sch_w;
      var scale_y = this.height / sch_h;
      this.scale = Math.pow(zoom_factor, Math.ceil(Math.log(Math.min(scale_x, scale_y)) / Math.log(zoom_factor)));
      if (this.scale < zoom_min) this.scale = zoom_min;
      else if (this.scale > zoom_max) this.scale = zoom_max;

      // center the schematic
      this.origin_x = (this.bbox[2] + this.bbox[0]) / 2 - this.width / (2 * this.scale);
      this.origin_y = (this.bbox[3] + this.bbox[1]) / 2 - this.height / (2 * this.scale);
    }

    this.redraw_background();
  };

  Schematic.prototype.cut = function () {
    // clear previous contents
    sch_clipboard = [];

    // look for selected components, move them to clipboard.
    for (var i = this.components.length - 1; i >= 0; --i) {
      var c = this.components[i];
      if (c.selected) {
        c.remove();
        sch_clipboard.push(c);
      }
    }

    // update diagram view
    this.redraw();
  };

  Schematic.prototype.copy = function () {
    // clear previous contents
    sch_clipboard = [];

    // look for selected components, copy them to clipboard.
    for (var i = this.components.length - 1; i >= 0; --i) {
      var c = this.components[i];
      if (c.selected) sch_clipboard.push(c.clone(c.x, c.y));
    }
  };

  Schematic.prototype.paste = function () {
    // compute left,top of bounding box for origins of
    // components in the clipboard
    var left = undefined;
    var top = undefined;
    for (var i = sch_clipboard.length - 1; i >= 0; --i) {
      var c = sch_clipboard[i];
      left = left ? Math.min(left, c.x) : c.x;
      top = top ? Math.min(top, c.y) : c.y;
    }

    this.message("cursor " + this.cursor_x + "," + this.cursor_y);

    // clear current selections
    this.unselect_all(-1);
    this.redraw_background(); // so we see any components that got unselected

    // make clones of components on the clipboard, positioning
    // them relative to the cursor
    for (var i = sch_clipboard.length - 1; i >= 0; --i) {
      var c = sch_clipboard[i];
      var new_c = c.clone(this.cursor_x + (c.x - left), this.cursor_y + (c.y - top));
      new_c.set_select(true);
      new_c.add(this);
    }

    this.redraw();
  };

  ///////////////////////////////////////////////////////////////////////////////
  //
  //  Netlist and Simulation interface
  //
  ////////////////////////////////////////////////////////////////////////////////

  // load diagram from JSON representation
  Schematic.prototype.load_schematic = function (value, initial_value) {
    // use default value if no schematic info in value
    if (value == undefined || value.indexOf("[") == -1) value = initial_value;
    if (value && value.indexOf("[") != -1) {
      // convert string value into data structure
      var json = JSON.parse(value);

      // top level is a list of components
      for (var i = json.length - 1; i >= 0; --i) {
        var c = json[i];
        if (c[0] == "view") {
          this.ac_fstart = c[5];
          this.ac_fstop = c[6];
          this.ac_source_name = c[7];
          this.tran_npts = c[8];
          this.tran_tstop = c[9];
          this.dc_max_iters = c[10];
        } else if (c[0] == "w") {
          // wire
          this.add_wire(c[1][0], c[1][1], c[1][2], c[1][3]);
        } else if (c[0] == "dc") {
          this.dc_results = c[1];
        } else if (c[0] == "transient") {
          this.transient_results = c[1];
        } else if (c[0] == "ac") {
          this.ac_results = c[1];
        } else {
          // ordinary component
          //  c := [type, coords, properties, connections]
          var type = c[0];
          var coords = c[1];
          var properties = c[2];

          var part = new parts_map[type][0](coords[0], coords[1], coords[2]);
          for (var name in properties) part.properties[name] = properties[name];

          part.add(this);
        }
      }
    }

    this.redraw_background();
  };

  // label all the nodes in the circuit
  Schematic.prototype.label_connection_points = function () {
    // start by clearing all the connection point labels
    for (var i = this.components.length - 1; i >= 0; --i) this.components[i].clear_labels();

    // components are in charge of labeling their unlabeled connections.
    // labels given to connection points will propagate to coincident connection
    // points and across Wires.

    // let special components like GND label their connection(s)
    for (var i = this.components.length - 1; i >= 0; --i) this.components[i].add_default_labels();

    // now have components generate labels for unlabeled connections
    this.next_label = 0;
    for (var i = this.components.length - 1; i >= 0; --i) this.components[i].label_connections();
  };

  Schematic.prototype.get_next_label = function () {
    // generate next label in sequence
    this.next_label += 1;
    return this.next_label.toString();
  };

  // propagate label to coincident connection points
  Schematic.prototype.propagate_label = function (label, location) {
    var cplist = this.connection_points[location];
    for (var i = cplist.length - 1; i >= 0; --i) cplist[i].propagate_label(label);
  };

  // update the value field of our corresponding input field with JSON
  // representation of schematic
  Schematic.prototype.update_value = function () {
    // label connection points
    this.label_connection_points();

    // build JSON data structure, convert to string value for
    // input field
    this.input.value = JSON.stringify(this.json_with_analyses());
  };

  Schematic.prototype.json = function () {
    var json = [];

    // output all the components/wires in the diagram
    var n = this.components.length;
    for (var i = 0; i < n; i++) json.push(this.components[i].json(i));

    // capture the current view parameters
    json.push([
      "view",
      this.origin_x,
      this.origin_y,
      this.scale,
      this.ac_npts,
      this.ac_fstart,
      this.ac_fstop,
      this.ac_source_name,
      this.tran_npts,
      this.tran_tstop,
      this.dc_max_iters,
    ]);

    return json;
  };

  Schematic.prototype.json_with_analyses = function () {
    var json = this.json();

    if (this.dc_results != undefined) json.push(["dc", this.dc_results]);
    if (this.ac_results != undefined) json.push(["ac", this.ac_results]);
    if (this.transient_results != undefined) json.push(["transient", this.transient_results]);

    return json;
  };

  ///////////////////////////////////////////////////////////////////////////////
  //
  //  Simulation interface
  //
  ////////////////////////////////////////////////////////////////////////////////

  Schematic.prototype.extract_circuit = function () {
    // give all the circuit nodes a name, extract netlist
    this.label_connection_points();
    var netlist = this.json();

    // since we've done the heavy lifting, update input field value
    // so user can grab diagram if they want
    this.input.value = JSON.stringify(netlist);

    // create a circuit from the netlist
    var ckt = new cktsim.Circuit();
    if (ckt.load_netlist(netlist)) return ckt;
    else return null;
  };

  Schematic.prototype.dc_analysis = function () {
    // remove any previous annotations
    this.unselect_all(-1);
    this.redraw_background();

    var ckt = this.extract_circuit();
    if (ckt === null) return;

    // run the analysis
    this.operating_point = ckt.dc();

    if (this.operating_point != undefined) {
      // save a copy of the results for submission
      this.dc_results = {};
      for (var i in this.operating_point) this.dc_results[i] = this.operating_point[i];

      // display results on diagram
      this.redraw();
    }
  };

  // return a list of [color,node_label,offset,type] for each probe in the diagram
  // type == 'voltage' or 'current'
  Schematic.prototype.find_probes = function () {
    var result = [];
    var result = [];
    for (var i = this.components.length - 1; i >= 0; --i) {
      var c = this.components[i];
      var info = c.probe_info();
      if (info != undefined) result.push(c.probe_info());
    }
    return result;
  };

  // use a dialog to get AC analysis parameters
  Schematic.prototype.setup_ac_analysis = function () {
    this.unselect_all(-1);
    this.redraw_background();

    var npts_lbl = "Number of points/decade";
    var fstart_lbl = "Starting frequency (Hz)";
    var fstop_lbl = "Ending frequency (Hz)";
    var source_name_lbl = "Name of V or I source for ac";

    if (this.find_probes().length == 0) {
      alert("AC Analysis: there are no voltage probes in the diagram!");
      return;
    }

    var fields = [];
    fields[fstart_lbl] = build_input("text", 10, this.ac_fstart);
    fields[fstop_lbl] = build_input("text", 10, this.ac_fstop);
    fields[source_name_lbl] = build_input("text", 10, this.ac_source_name);

    var content = build_table(fields);
    content.fields = fields;
    content.sch = this;

    this.dialog("AC Analysis", content, function (content) {
      var sch = content.sch;

      // retrieve parameters, remember for next time
      sch.ac_fstart = content.fields[fstart_lbl].value;
      sch.ac_fstop = content.fields[fstop_lbl].value;
      sch.ac_source_name = content.fields[source_name_lbl].value;

      sch.ac_analysis(
        cktsim.parse_number(sch.ac_npts),
        cktsim.parse_number(sch.ac_fstart),
        cktsim.parse_number(sch.ac_fstop),
        sch.ac_source_name,
      );
    });
  };

  Schematic.prototype.ac_analysis = function (npts, fstart, fstop, ac_source_name) {
    var ckt = this.extract_circuit();
    if (ckt === null) return;
    var results = ckt.ac(npts, fstart, fstop, ac_source_name);

    if (typeof results == "string") this.message(results);
    else {
      var x_values = results["_frequencies_"];

      // x axis will be a log scale
      for (var i = x_values.length - 1; i >= 0; --i) x_values[i] = Math.log(x_values[i]) / Math.LN10;

      if (this.submit_analyses != undefined) {
        var submit = this.submit_analyses["ac"];
        if (submit != undefined) {
          // save a copy of the results for submission
          this.ac_results = {};

          // save requested values for each requested node
          for (var j = 0; j < submit.length; j++) {
            var flist = submit[j]; // [node_name,f1,f2,...]
            var node = flist[0];
            var values = results[node];
            var fvlist = [];
            // for each requested freq, interpolate response value
            for (var k = 1; k < flist.length; k++) {
              var f = flist[k];
              var v = interpolate(f, x_values, values);
              // convert to dB
              fvlist.push([f, v == undefined ? "undefined" : (20.0 * Math.log(v)) / Math.LN10]);
            }
            // save results as list of [f,response] paris
            this.ac_results[node] = fvlist;
          }
        }
      }

      // set up plot values for each node with a probe
      var y_values = []; // list of [color, result_array]
      var z_values = []; // list of [color, result_array]
      var probes = this.find_probes();
      var probe_maxv = [];
      var probe_color = [];

      // Check for probe with near zero transfer function and warn
      for (var i = probes.length - 1; i >= 0; --i) {
        if (probes[i][3] != "voltage") continue;
        probe_color[i] = probes[i][0];
        var label = probes[i][1];
        var v = results[label];
        probe_maxv[i] = array_max(v); // magnitudes always > 0
      }

      var all_max = array_max(probe_maxv);
      if (all_max < 1.0e-16) {
        alert("Zero ac response, -infinity on DB scale.");
      } else {
        for (var i = probes.length - 1; i >= 0; --i) {
          if (probes[i][3] != "voltage") continue;
          if (probe_maxv[i] / all_max < 1.0e-10) {
            alert("Near zero ac response, remove " + probe_color[i] + " probe");
            return;
          }
        }
      }

      for (var i = probes.length - 1; i >= 0; --i) {
        if (probes[i][3] != "voltage") continue;
        var color = probes[i][0];
        var label = probes[i][1];
        var offset = cktsim.parse_number(probes[i][2]);
        var v = results[label];
        // convert values into dB relative to source amplitude
        var v_max = 1;
        for (var j = v.length - 1; j >= 0; --j)
          // convert each value to dB relative to max
          v[j] = (20.0 * Math.log(v[j] / v_max)) / Math.LN10;
        y_values.push([color, offset, v]);

        var v = results[label + "_phase"];
        z_values.push([color, 0, v]);
      }

      // graph the result and display in a window
      var graph2 = this.graph(x_values, "log(Frequency in Hz)", z_values, "degrees");
      this.window("AC Analysis - Phase", graph2);
      var graph1 = this.graph(x_values, "log(Frequency in Hz)", y_values, "dB");
      this.window("AC Analysis - Magnitude", graph1, 50);
    }
  };

  Schematic.prototype.transient_analysis = function () {
    this.unselect_all(-1);
    this.redraw_background();

    var npts_lbl = "Minimum number of timepoints";
    var tstop_lbl = "Stop Time (seconds)";
    var probes = this.find_probes();
    if (probes.length == 0) {
      alert("Transient Analysis: there are no probes in the diagram!");
      return;
    }

    var fields = [];
    fields[tstop_lbl] = build_input("text", 10, this.tran_tstop);

    var content = build_table(fields);
    content.fields = fields;
    content.sch = this;

    this.dialog("Transient Analysis", content, function (content) {
      var sch = content.sch;
      var ckt = sch.extract_circuit();
      if (ckt === null) return;

      // retrieve parameters, remember for next time
      sch.tran_tstop = content.fields[tstop_lbl].value;

      // gather a list of nodes that are being probed.  These
      // will be added to the list of nodes checked during the
      // LTE calculations in transient analysis
      var probe_list = sch.find_probes();
      var probe_names = new Array(probe_list.length);
      for (var i = probe_list.length - 1; i >= 0; --i) probe_names[i] = probe_list[i][1];

      // run the analysis
      var results = ckt.tran(ckt.parse_number(sch.tran_npts), 0, ckt.parse_number(sch.tran_tstop), probe_names, false);

      if (typeof results == "string") sch.message(results);
      else {
        if (sch.submit_analyses != undefined) {
          var submit = sch.submit_analyses["tran"];
          if (submit != undefined) {
            // save a copy of the results for submission
            sch.transient_results = {};
            var times = results["_time_"];

            // save requested values for each requested node
            for (var j = 0; j < submit.length; j++) {
              var tlist = submit[j]; // [node_name,t1,t2,...]
              var node = tlist[0];
              var values = results[node];
              var tvlist = [];
              // for each requested time, interpolate waveform value
              for (var k = 1; k < tlist.length; k++) {
                var t = tlist[k];
                var v = interpolate(t, times, values);
                tvlist.push([t, v == undefined ? "undefined" : v]);
              }
              // save results as list of [t,value] pairs
              sch.transient_results[node] = tvlist;
            }
          }
        }

        var x_values = results["_time_"];
        var x_legend = "Time";

        // set up plot values for each node with a probe
        var v_values = []; // voltage values: list of [color, result_array]
        var i_values = []; // current values: list of [color, result_array]
        var probes = sch.find_probes();

        for (var i = probes.length - 1; i >= 0; --i) {
          var color = probes[i][0];
          var label = probes[i][1];
          var offset = cktsim.parse_number(probes[i][2]);
          var v = results[label];
          if (v == undefined) {
            alert(
              "The " +
                color +
                " probe is connected to node " +
                '"' +
                label +
                '"' +
                " which is not an actual circuit node",
            );
          } else if (probes[i][3] == "voltage") {
            if (color == "x-axis") {
              x_values = v;
              x_legend = "Voltage";
            } else v_values.push([color, offset, v]);
          } else {
            if (color == "x-axis") {
              x_values = v;
              x_legend = "Current";
            } else i_values.push([color, offset, v]);
          }
        }

        // graph the result and display in a window
        var graph = sch.graph(x_values, x_legend, v_values, "Voltage", i_values, "Current");
        sch.window("Results of Transient Analysis", graph);
      }
    });
  };

  // t is the time at which we want a value
  // times is a list of timepoints from the simulation
  function interpolate(t, times, values) {
    if (values == undefined) return undefined;

    for (var i = 0; i < times.length; i++)
      if (t < times[i]) {
        // t falls between times[i-1] and times[i]
        var t1 = i == 0 ? times[0] : times[i - 1];
        var t2 = times[i];

        if (t2 == undefined) return undefined;

        var v1 = i == 0 ? values[0] : values[i - 1];
        var v2 = values[i];
        var v = v1;
        if (t != t1) v += ((t - t1) * (v2 - v1)) / (t2 - t1);
        return v;
      }
  }

  // external interface for setting the property value of a named component
  Schematic.prototype.set_property = function (component_name, property, value) {
    this.unselect_all(-1);

    for (var i = this.components.length - 1; i >= 0; --i) {
      var component = this.components[i];
      if (component.properties["name"] == component_name) {
        component.properties[property] = value.toString();
        break;
      }
    }

    this.redraw_background();
  };

  ///////////////////////////////////////////////////////////////////////////////
  //
  //  Drawing support -- deals with scaling and scrolling of diagrama
  //
  ////////////////////////////////////////////////////////////////////////////////

  // here to redraw background image containing static portions of the schematic.
  // Also redraws dynamic portion.
  Schematic.prototype.redraw_background = function () {
    var c = this.bg_image.getContext("2d");

    c.lineCap = "round";

    // paint background color
    c.fillStyle = element_style;
    c.fillRect(0, 0, this.width, this.height);

    if (!this.diagram_only && this.show_grid) {
      // grid
      c.strokeStyle = grid_style;
      var first_x = this.origin_x;
      var last_x = first_x + this.width / this.scale;
      var first_y = this.origin_y;
      var last_y = first_y + this.height / this.scale;

      for (var i = this.grid * Math.ceil(first_x / this.grid); i < last_x; i += this.grid)
        this.draw_line(c, i, first_y, i, last_y, 0.1);

      for (var i = this.grid * Math.ceil(first_y / this.grid); i < last_y; i += this.grid)
        this.draw_line(c, first_x, i, last_x, i, 0.1);
    }

    // unselected components
    var min_x = Infinity; // compute bounding box for diagram
    var max_x = -Infinity;
    var min_y = Infinity;
    var max_y = -Infinity;
    for (var i = this.components.length - 1; i >= 0; --i) {
      var component = this.components[i];
      if (!component.selected) {
        component.draw(c);
        min_x = Math.min(component.bbox[0], min_x);
        max_x = Math.max(component.bbox[2], max_x);
        min_y = Math.min(component.bbox[1], min_y);
        max_y = Math.max(component.bbox[3], max_y);
      }
    }
    this.unsel_bbox = [min_x, min_y, max_x, max_y];
    this.redraw(); // background changed, redraw on screen
  };

  // redraw what user sees = static image + dynamic parts
  Schematic.prototype.redraw = function () {
    var c = this.canvas.getContext("2d");

    // put static image in the background
    c.drawImage(this.bg_image, 0, 0);

    // selected components
    var min_x = this.unsel_bbox[0]; // compute bounding box for diagram
    var max_x = this.unsel_bbox[2];
    var min_y = this.unsel_bbox[1];
    var max_y = this.unsel_bbox[3];
    var selections = false;
    for (var i = this.components.length - 1; i >= 0; --i) {
      var component = this.components[i];
      if (component.selected) {
        component.draw(c);
        selections = true;
        min_x = Math.min(component.bbox[0], min_x);
        max_x = Math.max(component.bbox[2], max_x);
        min_y = Math.min(component.bbox[1], min_y);
        max_y = Math.max(component.bbox[3], max_y);
      }
    }
    if (min_x == Infinity) this.bbox = [0, 0, 0, 0];
    else this.bbox = [min_x, min_y, max_x, max_y];
    this.enable_tool("cut", selections);
    this.enable_tool("copy", selections);
    this.enable_tool("paste", sch_clipboard.length > 0);

    // connection points: draw one at each location
    for (var location in this.connection_points) {
      var cplist = this.connection_points[location];
      cplist[0].draw(c, cplist.length);
    }

    // draw new wire
    if (this.wire) {
      var r = this.wire;
      c.strokeStyle = selected_style;
      this.draw_line(c, r[0], r[1], r[2], r[3], 1);
    }

    // draw selection rectangle
    if (this.select_rect) {
      var r = this.select_rect;
      c.lineWidth = 1;
      c.strokeStyle = selected_style;
      c.beginPath();
      c.moveTo(r[0], r[1]);
      c.lineTo(r[0], r[3]);
      c.lineTo(r[2], r[3]);
      c.lineTo(r[2], r[1]);
      c.lineTo(r[0], r[1]);
      c.stroke();
    }

    // display operating point results
    if (this.operating_point) {
      if (typeof this.operating_point == "string") this.message(this.operating_point);
      else {
        // make a copy of the operating_point info so we can mess with it
        var temp = [];
        for (var i in this.operating_point) temp[i] = this.operating_point[i];

        // run through connection points displaying (once) the voltage
        // for each electrical node
        for (var location in this.connection_points) this.connection_points[location][0].display_voltage(c, temp);

        // let components display branch current info if available
        for (var i = this.components.length - 1; i >= 0; --i) this.components[i].display_current(c, temp);
      }
    }

    // add scrolling/zooming control
    if (!this.diagram_only) {
      var r = this.sctl_r;
      var x = this.sctl_x;
      var y = this.sctl_y;

      // circle with border
      c.fillStyle = element_style;
      c.beginPath();
      c.arc(x, y, r, 0, 2 * Math.PI);
      c.fill();

      c.strokeStyle = grid_style;
      c.lineWidth = 0.5;
      c.beginPath();
      c.arc(x, y, r, 0, 2 * Math.PI);
      c.stroke();

      // direction markers for scroll
      c.lineWidth = 3;
      c.beginPath();

      c.moveTo(x + 4, y - r + 8); // north
      c.lineTo(x, y - r + 4);
      c.lineTo(x - 4, y - r + 8);

      c.moveTo(x + r - 8, y + 4); // east
      c.lineTo(x + r - 4, y);
      c.lineTo(x + r - 8, y - 4);

      c.moveTo(x + 4, y + r - 8); // south
      c.lineTo(x, y + r - 4);
      c.lineTo(x - 4, y + r - 8);

      c.moveTo(x - r + 8, y + 4); // west
      c.lineTo(x - r + 4, y);
      c.lineTo(x - r + 8, y - 4);

      c.stroke();

      // zoom control
      x = this.zctl_left;
      y = this.zctl_top;
      c.lineWidth = 0.5;
      c.fillStyle = element_style; // background
      c.fillRect(x, y, 16, 48);
      c.strokeStyle = grid_style; // border
      c.strokeRect(x, y, 16, 48);
      c.lineWidth = 1.0;
      c.beginPath();
      // zoom in label
      c.moveTo(x + 4, y + 8);
      c.lineTo(x + 12, y + 8);
      c.moveTo(x + 8, y + 4);
      c.lineTo(x + 8, y + 12);
      // zoom out label
      c.moveTo(x + 4, y + 24);
      c.lineTo(x + 12, y + 24);
      // surround label
      c.strokeRect(x + 4, y + 36, 8, 8);
      c.stroke();
    }
  };

  // draws a cross cursor
  Schematic.prototype.cross_cursor = function (c, x, y) {
    this.draw_line(c, x - this.grid, y, x + this.grid, y, 1);
    this.draw_line(c, x, y - this.grid, x, y + this.grid, 1);
  };

  Schematic.prototype.moveTo = function (c, x, y) {
    c.moveTo((x - this.origin_x) * this.scale, (y - this.origin_y) * this.scale);
  };

  Schematic.prototype.lineTo = function (c, x, y) {
    c.lineTo((x - this.origin_x) * this.scale, (y - this.origin_y) * this.scale);
  };

  Schematic.prototype.draw_line = function (c, x1, y1, x2, y2, width) {
    c.lineWidth = width * this.scale;
    c.beginPath();
    c.moveTo((x1 - this.origin_x) * this.scale, (y1 - this.origin_y) * this.scale);
    c.lineTo((x2 - this.origin_x) * this.scale, (y2 - this.origin_y) * this.scale);
    c.stroke();
  };

  Schematic.prototype.draw_arc = function (c, x, y, radius, start_radians, end_radians, anticlockwise, width, filled) {
    c.lineWidth = width * this.scale;
    c.beginPath();
    c.arc(
      (x - this.origin_x) * this.scale,
      (y - this.origin_y) * this.scale,
      radius * this.scale,
      start_radians,
      end_radians,
      anticlockwise,
    );
    if (filled) c.fill();
    else c.stroke();
  };

  Schematic.prototype.draw_text = function (c, text, x, y, size) {
    c.font = size * this.scale + "pt sans-serif";
    c.fillText(text, (x - this.origin_x) * this.scale, (y - this.origin_y) * this.scale);
  };

  // add method to canvas to compute relative coords for event
  try {
    if (HTMLCanvasElement)
      HTMLCanvasElement.prototype.relMouseCoords = function (event) {
        // run up the DOM tree to figure out coords for top,left of canvas
        var totalOffsetX = 0;
        var totalOffsetY = 0;
        var currentElement = this;
        do {
          totalOffsetX += currentElement.offsetLeft;
          totalOffsetY += currentElement.offsetTop;
        } while ((currentElement = currentElement.offsetParent));

        // now compute relative position of click within the canvas
        this.mouse_x = event.pageX - totalOffsetX;
        this.mouse_y = event.pageY - totalOffsetY;
        this.page_x = event.pageX;
        this.page_y = event.pageY;
      };
  } catch (err) {
    // ignore
  }

  ///////////////////////////////////////////////////////////////////////////////
  //
  //  Event handling
  //
  ////////////////////////////////////////////////////////////////////////////////

  // process keystrokes, consuming those that are meaningful to us
  function schematic_key_down(event) {
    if (!event) event = window.event;
    var sch = window.event ? event.srcElement.schematic : event.target.schematic;
    var code = event.keyCode;

    // keep track of modifier key state
    if (code == 16) sch.shiftKey = true;
    else if (code == 17) sch.ctrlKey = true;
    else if (code == 18) sch.altKey = true;
    else if (code == 91) sch.cmdKey = true;
    // backspace or delete: delete selected components
    else if (code == 8 || code == 46) {
      // delete selected components
      for (var i = sch.components.length - 1; i >= 0; --i) {
        var component = sch.components[i];
        if (component.selected) component.remove();
      }
      sch.clean_up_wires();
      sch.redraw_background();
      event.preventDefault();
      return false;
    }

    // cmd/ctrl x: cut
    else if ((sch.ctrlKey || sch.cmdKey) && code == 88) {
      sch.cut();
      event.preventDefault();
      return false;
    }

    // cmd/ctrl c: copy
    else if ((sch.ctrlKey || sch.cmdKey) && code == 67) {
      sch.copy();
      event.preventDefault();
      return false;
    }

    // cmd/ctrl v: paste
    else if ((sch.ctrlKey || sch.cmdKey) && code == 86) {
      sch.paste();
      event.preventDefault();
      return false;
    }

    // 'r': rotate component
    else if (!sch.ctrlKey && !sch.altKey && !sch.cmdKey && code == 82) {
      // rotate
      for (var i = sch.components.length - 1; i >= 0; --i) {
        var component = sch.components[i];
        if (component.selected) {
          component.rotate(1);
          sch.check_wires(component);
        }
      }
      sch.clean_up_wires();
      sch.redraw_background();
      event.preventDefault();
      return false;
    } else return true;

    // consume keystroke
    sch.redraw();
    event.preventDefault();
    return false;
  }

  function schematic_key_up(event) {
    if (!event) event = window.event;
    var sch = window.event ? event.srcElement.schematic : event.target.schematic;
    var code = event.keyCode;

    if (code == 16) sch.shiftKey = false;
    else if (code == 17) sch.ctrlKey = false;
    else if (code == 18) sch.altKey = false;
    else if (code == 91) sch.cmdKey = false;
  }

  function schematic_mouse_enter(event) {
    if (!event) event = window.event;
    var sch = window.event ? event.srcElement.schematic : event.target.schematic;

    // see if user has selected a new part
    if (sch.new_part) {
      // grab incoming part, turn off selection of parts bin
      var part = sch.new_part;
      sch.new_part = undefined;
      part.select(false);

      // unselect everything else in the schematic, add part and select it
      sch.unselect_all(-1);
      sch.redraw_background(); // so we see any components that got unselected

      // make a clone of the component in the parts bin
      part = part.component.clone(sch.cursor_x, sch.cursor_y);
      part.add(sch); // add it to schematic
      part.set_select(true);

      // and start dragging it
      sch.drag_begin();
    }

    sch.drawCursor = true;
    sch.redraw();
    sch.canvas.focus(); // capture key strokes
    return false;
  }

  function schematic_mouse_leave(event) {
    if (!event) event = window.event;
    var sch = window.event ? event.srcElement.schematic : event.target.schematic;
    sch.drawCursor = false;
    sch.redraw();
    return false;
  }

  function schematic_mouse_down(event) {
    if (!event) event = window.event;
    else event.preventDefault();
    var sch = window.event ? event.srcElement.schematic : event.target.schematic;

    // determine where event happened in schematic coordinates
    sch.canvas.relMouseCoords(event);

    var mx = sch.canvas.mouse_x;
    var my = sch.canvas.mouse_y;
    var sx = mx - sch.sctl_x;
    var sy = my - sch.sctl_y;
    var zx = mx - sch.zctl_left;
    var zy = my - sch.zctl_top;
    if (sx * sx + sy * sy <= sch.sctl_r * sch.sctl_r) {
      // click in scrolling control
      // click on scrolling control, check which quadrant
      if (Math.abs(sy) > Math.abs(sx)) {
        // N or S
        var delta = this.height / 8;
        if (sy > 0) delta = -delta;
        var temp = sch.origin_y - delta;
        if (temp > origin_min * sch.grid && temp < origin_max * sch.grid) sch.origin_y = temp;
      } else {
        // E or W
        var delta = this.width / 8;
        if (sx < 0) delta = -delta;
        var temp = sch.origin_x + delta;
        if (temp > origin_min * sch.grid && temp < origin_max * sch.grid) sch.origin_x = temp;
      }
    } else if (zx >= 0 && zx < 16 && zy >= 0 && zy < 48) {
      // click in zoom control
      if (zy < 16) sch.zoomin();
      else if (zy < 32) sch.zoomout();
      else sch.zoomall();
    } else {
      var x = mx / sch.scale + sch.origin_x;
      var y = my / sch.scale + sch.origin_y;
      sch.cursor_x = Math.round(x / sch.grid) * sch.grid;
      sch.cursor_y = Math.round(y / sch.grid) * sch.grid;

      // is mouse over a connection point?  If so, start dragging a wire
      var cplist = sch.connection_points[sch.cursor_x + "," + sch.cursor_y];
      if (cplist && !event.shiftKey) {
        sch.unselect_all(-1);
        sch.wire = [sch.cursor_x, sch.cursor_y, sch.cursor_x, sch.cursor_y];
      } else {
        // give all components a shot at processing the selection event
        var which = -1;
        for (var i = sch.components.length - 1; i >= 0; --i)
          if (sch.components[i].select(x, y, event.shiftKey)) {
            if (sch.components[i].selected) {
              sch.drag_begin();
              which = i; // keep track of component we found
            }
            break;
          }
        // did we just click on a previously selected component?
        var reselect = which != -1 && sch.components[which].was_previously_selected;

        if (!event.shiftKey) {
          // if shift key isn't pressed and we didn't click on component
          // that was already selected, unselect everyone except component
          // we just clicked on
          if (!reselect) sch.unselect_all(which);

          // if there's nothing to drag, set up a selection rectangle
          if (!sch.dragging)
            sch.select_rect = [sch.canvas.mouse_x, sch.canvas.mouse_y, sch.canvas.mouse_x, sch.canvas.mouse_y];
        }
      }
    }

    sch.redraw_background();
    return false;
  }

  function schematic_mouse_move(event) {
    if (!event) event = window.event;
    var sch = window.event ? event.srcElement.schematic : event.target.schematic;

    sch.canvas.relMouseCoords(event);
    var x = sch.canvas.mouse_x / sch.scale + sch.origin_x;
    var y = sch.canvas.mouse_y / sch.scale + sch.origin_y;
    sch.cursor_x = Math.round(x / sch.grid) * sch.grid;
    sch.cursor_y = Math.round(y / sch.grid) * sch.grid;

    if (sch.wire) {
      // update new wire end point
      sch.wire[2] = sch.cursor_x;
      sch.wire[3] = sch.cursor_y;
    } else if (sch.dragging) {
      // see how far we moved
      var dx = sch.cursor_x - sch.drag_x;
      var dy = sch.cursor_y - sch.drag_y;
      if (dx != 0 || dy != 0) {
        // update position for next time
        sch.drag_x = sch.cursor_x;
        sch.drag_y = sch.cursor_y;

        // give all components a shot at processing the event
        for (var i = sch.components.length - 1; i >= 0; --i) {
          var component = sch.components[i];
          if (component.selected) component.move(dx, dy);
        }
      }
    } else if (sch.select_rect) {
      // update moving corner of selection rectangle
      sch.select_rect[2] = sch.canvas.mouse_x;
      sch.select_rect[3] = sch.canvas.mouse_y;
    }

    // just redraw dynamic components
    sch.redraw();

    return false;
  }

  function schematic_mouse_up(event) {
    if (!event) event = window.event;
    else event.preventDefault();
    var sch = window.event ? event.srcElement.schematic : event.target.schematic;

    // drawing a new wire
    if (sch.wire) {
      var r = sch.wire;
      sch.wire = undefined;

      if (r[0] != r[2] || r[1] != r[3]) {
        // insert wire component
        sch.add_wire(r[0], r[1], r[2], r[3]);
        sch.clean_up_wires();
        sch.redraw_background();
      } else sch.redraw();
    }

    // dragging
    if (sch.dragging) sch.drag_end();

    // selection rectangle
    if (sch.select_rect) {
      var r = sch.select_rect;

      // if select_rect is a point, we've already dealt with selection
      // in mouse_down handler
      if (r[0] != r[2] || r[1] != r[3]) {
        // convert to schematic coordinates
        var s = [
          r[0] / sch.scale + sch.origin_x,
          r[1] / sch.scale + sch.origin_y,
          r[2] / sch.scale + sch.origin_x,
          r[3] / sch.scale + sch.origin_y,
        ];
        canonicalize(s);

        if (!event.shiftKey) sch.unselect_all();

        // select components that intersect selection rectangle
        for (var i = sch.components.length - 1; i >= 0; --i) sch.components[i].select_rect(s, event.shiftKey);
      }

      sch.select_rect = undefined;
      sch.redraw_background();
    }
    return false;
  }

  function schematic_mouse_wheel(event) {
    if (!event) event = window.event;
    else event.preventDefault();
    var sch = window.event ? event.srcElement.schematic : event.target.schematic;

    var delta = 0;
    if (event.wheelDelta) delta = event.wheelDelta;
    else if (event.detail) delta = -event.detail;

    if (delta) {
      var nscale = delta > 0 ? sch.scale * zoom_factor : sch.scale / zoom_factor;

      if (nscale > zoom_min && nscale < zoom_max) {
        // zoom around current mouse position
        sch.canvas.relMouseCoords(event);
        var s = 1.0 / sch.scale - 1.0 / nscale;
        sch.origin_x += sch.canvas.mouse_x * s;
        sch.origin_y += sch.canvas.mouse_y * s;
        sch.scale = nscale;
        sch.redraw_background();
      }
    }
  }

  function schematic_double_click(event) {
    if (!event) event = window.event;
    else event.preventDefault();
    var sch = window.event ? event.srcElement.schematic : event.target.schematic;

    // determine where event happened in schematic coordinates
    sch.canvas.relMouseCoords(event);
    var x = sch.canvas.mouse_x / sch.scale + sch.origin_x;
    var y = sch.canvas.mouse_y / sch.scale + sch.origin_y;
    sch.cursor_x = Math.round(x / sch.grid) * sch.grid;
    sch.cursor_y = Math.round(y / sch.grid) * sch.grid;

    // see if we double-clicked a component.  If so, edit it's properties
    for (var i = sch.components.length - 1; i >= 0; --i) if (sch.components[i].edit_properties(x, y)) break;

    return false;
  }

  ///////////////////////////////////////////////////////////////////////////////
  //
  //  Status message and dialogs
  //
  ////////////////////////////////////////////////////////////////////////////////

  Schematic.prototype.message = function (message) {
    this.status.nodeValue = message;
  };

  Schematic.prototype.append_message = function (message) {
    this.status.nodeValue += " / " + message;
  };

  // set up a dialog with specified title, content and two buttons at
  // the bottom: OK and Cancel.  If Cancel is clicked, dialog goes away
  // and we're done.  If OK is clicked, dialog goes away and the
  // callback function is called with the content as an argument (so
  // that the values of any fields can be captured).
  Schematic.prototype.dialog = function (title, content, callback) {
    // create the div for the top level of the dialog, add to DOM
    var dialog = document.createElement("div");
    dialog.sch = this;
    dialog.content = content;
    dialog.callback = callback;

    // look for property input fields in the content and give
    // them a keypress listener that interprets ENTER as
    // clicking OK.
    var plist = content.getElementsByClassName("property");
    for (var i = plist.length - 1; i >= 0; --i) {
      var field = plist[i];
      field.dialog = dialog; // help event handler find us...
      field.addEventListener("keypress", dialog_check_for_ENTER, false);
    }

    // div to hold the content
    var body = document.createElement("div");
    content.style.marginBotton = "5px";
    body.appendChild(content);
    body.style.padding = "5px";
    dialog.appendChild(body);

    var ok_button = document.createElement("span");
    ok_button.appendChild(document.createTextNode("OK"));
    ok_button.dialog = dialog; // for the handler to use
    ok_button.addEventListener("click", dialog_okay, false);
    ok_button.style.display = "inline";
    ok_button.style.border = "1px solid";
    ok_button.style.padding = "5px";
    ok_button.style.margin = "10px";

    var cancel_button = document.createElement("span");
    cancel_button.appendChild(document.createTextNode("Cancel"));
    cancel_button.dialog = dialog; // for the handler to use
    cancel_button.addEventListener("click", dialog_cancel, false);
    cancel_button.style.display = "inline";
    cancel_button.style.border = "1px solid";
    cancel_button.style.padding = "5px";
    cancel_button.style.margin = "10px";

    // div to hold the two buttons
    var buttons = document.createElement("div");
    buttons.style.textAlign = "center";
    buttons.appendChild(ok_button);
    buttons.appendChild(cancel_button);
    buttons.style.padding = "5px";
    buttons.style.margin = "10px";
    dialog.appendChild(buttons);

    // put into an overlay window
    this.window(title, dialog);
  };

  function dialog_cancel(event) {
    if (!event) event = window.event;
    var dialog = window.event ? event.srcElement.dialog : event.target.dialog;

    window_close(dialog.win);
  }

  function dialog_okay(event) {
    if (!event) event = window.event;
    var dialog = window.event ? event.srcElement.dialog : event.target.dialog;

    window_close(dialog.win);

    if (dialog.callback) dialog.callback(dialog.content);
  }

  // callback for keypress in input fields: if user typed ENTER, act
  // like they clicked OK button.
  function dialog_check_for_ENTER(event) {
    var key = window.event ? window.event.keyCode : event.keyCode;
    if (key == 13) dialog_okay(event);
  }

  ///////////////////////////////////////////////////////////////////////////////
  //
  //  Draggable, resizeable, closeable window
  //
  ////////////////////////////////////////////////////////////////////////////////

  // build a 2-column HTML table from an associative array (keys as text in
  // column 1, values in column 2).
  function build_table(a) {
    var tbl = document.createElement("table");

    // build a row for each element in associative array
    for (var i in a) {
      var label = document.createTextNode(i + ": ");
      var col1 = document.createElement("td");
      col1.appendChild(label);
      var col2 = document.createElement("td");
      col2.appendChild(a[i]);
      var row = document.createElement("tr");
      row.appendChild(col1);
      row.appendChild(col2);
      row.style.verticalAlign = "center";
      tbl.appendChild(row);
    }

    return tbl;
  }

  function build_input(type, size, value) {
    var input = document.createElement("input");
    input.type = type;
    input.size = size;
    input.className = "property"; // make this easier to find later
    if (value == undefined) input.value = "";
    else input.value = value.toString();
    return input;
  }

  // build a select widget using the strings found in the options array
  function build_select(options, selected) {
    var select = document.createElement("select");
    for (var i = 0; i < options.length; i++) {
      var option = document.createElement("option");
      option.text = options[i];
      select.add(option);
      if (options[i] == selected) select.selectedIndex = i;
    }
    return select;
  }

  Schematic.prototype.window = function (title, content, offset) {
    // create the div for the top level of the window
    var win = document.createElement("div");
    win.sch = this;
    win.content = content;
    win.drag_x = undefined;
    win.draw_y = undefined;

    // div to hold the title
    var head = document.createElement("div");
    head.style.backgroundColor = "black";
    head.style.color = "white";
    head.style.textAlign = "center";
    head.style.padding = "5px";
    head.appendChild(document.createTextNode(title));
    head.win = win;
    win.head = head;

    var close_button = new Image();
    close_button.src = close_icon;
    close_button.style.cssFloat = "right";
    close_button.addEventListener("click", window_close_button, false);
    close_button.win = win;
    head.appendChild(close_button);

    win.appendChild(head);

    // capture mouse events in title bar
    head.addEventListener("mousedown", window_mouse_down, false);

    // div to hold the content
    //var body = document.createElement('div');
    //body.appendChild(content);
    win.appendChild(content);
    content.win = win; // so content can contact us

    // compute location relative to canvas
    if (offset == undefined) offset = 0;
    win.left = this.canvas.mouse_x + offset;
    win.top = this.canvas.mouse_y + offset;

    // add to DOM
    win.style.background = "white";
    win.style.position = "absolute";
    win.style.left = win.left + "px";
    win.style.top = win.top + "px";
    win.style.border = "2px solid";

    this.canvas.parentNode.insertBefore(win, this.canvas);
    bring_to_front(win, true);
  };

  // adjust zIndex of pop-up window so that it is in front
  function bring_to_front(win, insert) {
    var wlist = win.sch.window_list;
    var i = wlist.indexOf(win);

    // remove from current position (if any) in window list
    if (i != -1) wlist.splice(i, 1);

    // if requested, add to end of window list
    if (insert) wlist.push(win);

    // adjust all zIndex values
    for (i = 0; i < wlist.length; i += 1) wlist[i].style.zIndex = 1000 + i;
  }

  // close the window
  function window_close(win) {
    // remove the window from the top-level div of the schematic
    win.parentNode.removeChild(win);

    // remove from list of pop-up windows
    bring_to_front(win, false);
  }

  function window_close_button(event) {
    if (!event) event = window.event;
    var src = window.event ? event.srcElement : event.target;
    window_close(src.win);
  }

  // capture mouse events in title bar of window
  function window_mouse_down(event) {
    if (!event) event = window.event;
    var src = window.event ? event.srcElement : event.target;
    var win = src.win;

    bring_to_front(win, true);

    // add handlers to document so we capture them no matter what
    document.addEventListener("mousemove", window_mouse_move, false);
    document.addEventListener("mouseup", window_mouse_up, false);
    document.tracking_window = win;

    // remember where mouse is so we can compute dx,dy during drag
    win.drag_x = event.pageX;
    win.drag_y = event.pageY;

    return false;
  }

  function window_mouse_up(event) {
    var win = document.tracking_window;

    // show's over folks...
    document.removeEventListener("mousemove", window_mouse_move, false);
    document.removeEventListener("mouseup", window_mouse_up, false);
    document.tracking_window = undefined;
    win.drag_x = undefined;
    win.drag_y = undefined;
    return true; // consume event
  }

  function window_mouse_move(event) {
    var win = document.tracking_window;

    if (win.drag_x) {
      var dx = event.pageX - win.drag_x;
      var dy = event.pageY - win.drag_y;

      // move the window
      win.left += dx;
      win.top += dy;
      win.style.left = win.left + "px";
      win.style.top = win.top + "px";

      // update reference point
      win.drag_x += dx;
      win.drag_y += dy;

      return true; // consume event
    }
  }

  ///////////////////////////////////////////////////////////////////////////////
  //
  //  Toolbar
  //
  ////////////////////////////////////////////////////////////////////////////////

  Schematic.prototype.add_tool = function (icon, tip, callback) {
    var tool, child, label, hidden;

    tool = document.createElement("button");
    child = document.createElement("img");
    label = document.createElement("span");
    hidden = document.createElement("span");

    tool.style.backgroundImage = "none";
    tool.setAttribute("title", tip);
    label.innerHTML = tip;
    label.classList.add("sr");
    hidden.setAttribute("aria-hidden", "true");

    if (icon.search("data:image") != -1) {
      child.setAttribute("src", icon);
      child.setAttribute("alt", "");
      tool.appendChild(child);
    } else {
      tool.style.font = "small-caps small sans-serif";
      hidden.innerHTML = icon;
      tool.appendChild(hidden);
      tool.appendChild(label);
    }

    // decorate tool
    tool.style.height = "32px";
    tool.style.width = "auto";
    tool.style.verticalAlign = "top";

    // set up event processing
    tool.addEventListener("mouseover", tool_enter, false);
    tool.addEventListener("mouseout", tool_leave, false);
    tool.addEventListener("click", tool_click, false);

    // add to toolbar
    tool.sch = this;
    tool.tip = tip;
    tool.callback = callback;
    this.toolbar.push(tool);

    tool.enabled = false;

    return tool;
  };

  Schematic.prototype.enable_tool = function (tname, which) {
    var tool = this.tools[tname];

    if (tool != undefined) {
      tool.removeAttribute("disabled");
      tool.enabled = which;

      // if disabling tool, remove border and tip
      if (!which) {
        tool.sch.message("");
        tool.setAttribute("disabled", "true");
      }
    }
  };

  // highlight tool button by turning on border, changing background
  function tool_enter(event) {
    if (!event) event = window.event;
    var tool = event.target;
    if (event.target.tagName.toLowerCase() == "img" || event.target.tagName.toLowerCase() == "span") {
      tool = event.target.parentNode;
    }
    if (tool.enabled) {
      tool.sch.message(tool.tip);
    }
    event.stopPropagation();
  }

  // unhighlight tool button by turning off border, reverting to normal background
  function tool_leave(event) {
    if (!event) event = window.event;
    var tool = event.target;
    if (event.target.tagName.toLowerCase() == "img" || event.target.tagName.toLowerCase() == "span") {
      tool = event.target.parentNode;
    }
    if (tool.enabled) {
      tool.sch.message("");
    }
    event.stopPropagation();
  }

  // handle click on a tool
  function tool_click(event) {
    if (!event) event = window.event;
    var tool = event.target;
    if (event.target.tagName.toLowerCase() == "img" || event.target.tagName.toLowerCase() == "span") {
      tool = event.target.parentNode;
    }
    if (tool.enabled) {
      tool.sch.canvas.relMouseCoords(event); // so we can position pop-up window correctly
      tool.callback.call(tool.sch);
    }
    event.stopPropagation();
  }

  var help_icon =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAABgFBMVEUARMwAZsz///8AM5kGqP+s1/8AeuARp/8AZ803qPsAXNYAdNwAZcxZuv9auf99xv8AdNoEd9uTzP8AYsgAivQTl/cAj/V9xf8Ad90AeN5PtP8AUMoAj/oRiOgprf84qfwAb9UAifAAdtwAf+UAgOYActgAk/oAie8cqP8AbtQAXtkXof8AatBNuP8AbdMAgukXcOEAXdcAlP0AhuwJmv0prv8YceGCyP8AbtUAZd8elvMAZcsAW9Ucpv8AjfM3sP8AiO4AWdNOuP8AddsPgeIAhOoAbdT///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABH5RCxAAAASHRSTlP//////////////////////////////////////////////////////////////////////////////////////////////wCc7PJgAAAAAWJLR0R/SL9x5QAAAAlwSFlzAAAASAAAAEgARslrPgAAAAl2cEFnAAAAEAAAABAAXMatwwAAAK5JREFUGNM1zwcOwjAMBVAHQ9PFbIG27L333pve/0bEBr5kyf9JkWIIKYLDK3CNcZgUiE0QFIuuu89kBIHIDy5TUOmXSknBsFxDRAXMJ4FIZOeqA41lxQVB+w/1L9RyO+B+fLwJ7q/OOUfd9FvDkQJDmyyuoLqWGtsVBq3RnAHcUlXbNgSEWPY8n570dH2F6h94Sqe3BAdd7xKEKKVTACg4UuL3OMQoB/F3LRGF1w/Arhm2Q9w2ZQAAACV0RVh0Y3JlYXRlLWRhdGUAMjAwOC0xMC0yM1QxMTo1ODozNiswODowMKkTWd4AAAAldEVYdG1vZGlmeS1kYXRlADIwMDgtMTAtMjNUMTE6NTk6NTArMDg6MDC833hpAAAAAElFTkSuQmCC";

  var cut_icon =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH1QocFh0xaEFkXgAAArRJREFUOMuFk11Ik1EYx59z3nevr9vUfaXbbPgVaHjRVRB0YZRJV0XeZCIRaGmWWKhpgZAElaV9gYgQlBjoEPRKkCS6DAK1MG0zNvJj7zZ1m+51X+92zttNzmFa5+78/w8//s/znIMg5TzrfXIOAN7zPO9tunm7dI/Xz7LspTvNrbpUHadeGIYZu9XYrI1Go8t9/a87Uz0Fq7hw5nS55sWrnk8HAggh/E+HHdfV1lcQQo7t6E97HpeZc82m7ZCIKKUnDgRgjENLS7+AT0tDsVisdCcFy7JThYWF4HF7KKXU8a8EFTabDVZdK6iutr44kUic6nnePVBSUqJAgMHhdAAAWA8E3G299xljvLy4aAc+jUeSJB3X6/TXZAqwvrFGAWCiraXj4YEAAABKaeXCjwV5bc0DjTeaVPFEHIliEObm5iQA6Npb/xegraVjGmM8ZF+00WBwC2s0GhDcgizL8ru2lo7p/wL+pJianZnGTqcD0jkeMt8ORhBCb/arRXuFMaOxl1B6Pb65qSblZTIz+REVGHNAIHQLITRQ6fG07wsYM5k6437/g6MmEyQoRd6tTdkX3h5mZVRVkJ3D8BxHJVkG5/o6KLKyrla63UPJFsbN5hrJ5+sqNhrpwsrKVDASlgJBEdfEaU2UIzqWwTQQEhOO1dUPR/R6EvP5BsfN5t2XOmowCPNFRWSEYe4DAMxYLCGrUpnY8UcYhnzJNQcBAIYxbv+Wn09GDQZhd4ixmF6SJFJFyKMJleqlgmV5hLE9OWmOm1Hz6arJjIy+y5R2gyxTIMSwC+A4Qa1UMl/z8mImna5pXhC8iszMK8mPpNU2fHe5Ng4fOtQwa7HECKUYMA4AADAAANVarc/l95/0SxIbAJA5tfrsRUFI7twqiu7q7GyPNxDI8YfDGl8k4lOoVOetouj+DaDzOgfcNME8AAAAAElFTkSuQmCC";

  var copy_icon =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAAd0lEQVQ4y9WTsQ7AIAhE7wj//69dHKWLJqSlFOtUFpXA8SAIbBrHaR9yAAA6L2bvGiRvPtltQa+OqMrFPCo1jFhoRytBmXgqUCH5GUEkWCbova8TeBORfBNJVpYIrbVJdwDjY5hjJfk4vFnAzMDxiEqmo/fJAHACspMyA7UYnWgAAAAASUVORK5CYII=";

  var paste_icon =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAABZElEQVQ4y6WSMUsDMRiGn6RteoJSENS5oCdFR3+D0MHBciA4uujiVrq0o1NBcBEEFycXRzcnf4GDINTiL7BTr9LeJdfGoaX0ei21+MFHAsn7fG9eAjOqXCwoz/NKgAWs53mlcrGgZt0VE3s7fdhsfgHguttztTHA5+0ZjUaDzdM7HEeRy60C0G7/EASa78cLXNelcPkw1qYnkVprfN/n+6aEUgqlFFJKjDForclms2itYzZigH6/Tz6fp9PpAFC8fp3h/J2rw42P2ksLADkNMMbgOA6O4wzfZW2sAWovrb3janUn4cAYgzGGRWWtRQjRPKpUdmOAKIrGgCiK5gKEGGb/XK9/JhwEQUC32yUMw7nTJ0ExQK/Xw/d9BoPBeMqiigHCMEQIQSqV+pM4AbCAXEKcAGAtKSn/AYCE/UVZpIEVYA1ASkkmkxl/mqfzg5ExG1tP7t8AtoAOwDqwP4pgmd4H1n8B+QWeF/d+HLAAAAAASUVORK5CYII=";

  var close_icon =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACOUlEQVR42m2TzWtTQRTF30ysxE9E0VZKaapBa1OJxtRAW7XVGOrCKijFIEqXbgQFwf/BTReia7GUuBEUF5Y2YiMKKn6iKEqRom1DtAsjStGaGX9v3iQ+Y4Z35t6ZOfe8uXdmhFPVDqRSktYvpBzAxphaBQpKqSdalTLYO7fHxnWZL/zBfclkWAbksBBip7cmHEGvDd3raFlVUoOj2Wz+H4H9vT0RGQhMMLHGkxaienduuJV6p0ql5PjdiRlD2rurO0jwM9zWWnG1dPhyWql9ht3T1XmKwEtAaLNVMUT3AFyBsAz7g9lBbBc4+zcb54joTnQIKeRDZjrcvyNQxG9A5Bd2NwIZ+Gn8e2AxmHNFbTbXRWc8FoRcJLjObtDtbjB3DLtALZbws3l8d/0aOOzLZlYktkfX4eS9epuiehlqZ+TRi5cny8zEtuhVVo/7eabW8a2RFdivwlbPbu079uDT129yZYEd7W17oNzCXe4rdFHE2lrd0SRosbX5TXAK5EAd5NPYi9gF0AtGwSIrcN9IRTeFLxB8zp7RPAExMAUxAw7h3wRpdh+SQjzHBm0KZ4xA+8aWRgivzLU16TvuLZsB8UqyjvMYNDOu98rgfEQ8UklmS6hpQCs9ghuwdShfSKF9Ezb/n5x939upT7mKwOamRogqjchlhit9R+XbhGlfeGgn3k/Pjv33mNwWXl8f4sWdJ+Yow9W+JTetYSkDQ5P5wuear7HcNjSs5Upqd60ZLAXfwPSHwpyu5v4BhpTicEl0i9QAAAAASUVORK5CYII=";

  var grid_icon =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAAAMklEQVQ4y2NkYGD4z0ABYGFgYGD4/x/VDEZGRqLFmCixnYGBYRAYwMgwGoijgTgsAhEAq84fH/l+ELYAAAAASUVORK5CYII=";

  ///////////////////////////////////////////////////////////////////////////////
  //
  //  Graphing
  //
  ///////////////////////////////////////////////////////////////////////////////

  // add dashed lines!
  // from http://davidowens.wordpress.com/2010/09/07/html-5-canvas-and-dashed-lines/
  try {
    if (CanvasRenderingContext2D)
      CanvasRenderingContext2D.prototype.dashedLineTo = function (fromX, fromY, toX, toY, pattern) {
        // Our growth rate for our line can be one of the following:
        //   (+,+), (+,-), (-,+), (-,-)
        // Because of this, our algorithm needs to understand if the x-coord and
        // y-coord should be getting smaller or larger and properly cap the values
        // based on (x,y).
        var lt = function (a, b) {
          return a <= b;
        };
        var gt = function (a, b) {
          return a >= b;
        };
        var capmin = function (a, b) {
          return Math.min(a, b);
        };
        var capmax = function (a, b) {
          return Math.max(a, b);
        };
        var checkX = { thereYet: gt, cap: capmin };
        var checkY = { thereYet: gt, cap: capmin };

        if (fromY - toY > 0) {
          checkY.thereYet = lt;
          checkY.cap = capmax;
        }
        if (fromX - toX > 0) {
          checkX.thereYet = lt;
          checkX.cap = capmax;
        }

        this.moveTo(fromX, fromY);
        var offsetX = fromX;
        var offsetY = fromY;
        var idx = 0,
          dash = true;
        while (!(checkX.thereYet(offsetX, toX) && checkY.thereYet(offsetY, toY))) {
          var ang = Math.atan2(toY - fromY, toX - fromX);
          var len = pattern[idx];

          offsetX = checkX.cap(toX, offsetX + Math.cos(ang) * len);
          offsetY = checkY.cap(toY, offsetY + Math.sin(ang) * len);

          if (dash) this.lineTo(offsetX, offsetY);
          else this.moveTo(offsetX, offsetY);

          idx = (idx + 1) % pattern.length;
          dash = !dash;
        }
      };
  } catch (err) {
    //noop
  }
  // given a range of values, return a new range [vmin',vmax'] where the limits
  // have been chosen "nicely".  Taken from matplotlib.ticker.LinearLocator
  function view_limits(vmin, vmax) {
    // deal with degenerate case...
    if (vmin == vmax) {
      if (vmin == 0) {
        vmin = -0.5;
        vmax = 0.5;
      } else {
        vmin = vmin > 0 ? 0.9 * vmin : 1.1 * vmin;
        vmax = vmax > 0 ? 1.1 * vmax : 0.9 * vmax;
      }
    }

    var log_range = Math.log(vmax - vmin) / Math.LN10;
    var exponent = Math.floor(log_range);
    //if (log_range - exponent < 0.5) exponent -= 1;
    var scale = Math.pow(10, -exponent);
    vmin = Math.floor(scale * vmin) / scale;
    vmax = Math.ceil(scale * vmax) / scale;

    return [vmin, vmax, 1.0 / scale];
  }

  function engineering_notation(n, nplaces, trim) {
    if (n == 0) return "0";
    if (n == undefined) return "undefined";
    if (trim == undefined) trim = true;

    var sign = n < 0 ? -1 : 1;
    var log10 = Math.log(sign * n) / Math.LN10;
    var exp = Math.floor(log10 / 3); // powers of 1000
    var mantissa = sign * Math.pow(10, log10 - 3 * exp);

    // keep specified number of places following decimal point
    var mstring = (mantissa + sign * 0.5 * Math.pow(10, -nplaces)).toString();
    var mlen = mstring.length;
    var endindex = mstring.indexOf(".");
    if (endindex != -1) {
      if (nplaces > 0) {
        endindex += nplaces + 1;
        if (endindex > mlen) endindex = mlen;
        if (trim) {
          while (mstring.charAt(endindex - 1) == "0") endindex -= 1;
          if (mstring.charAt(endindex - 1) == ".") endindex -= 1;
        }
      }
      if (endindex < mlen) mstring = mstring.substring(0, endindex);
    }

    switch (exp) {
      case -5:
        return mstring + "f";
      case -4:
        return mstring + "p";
      case -3:
        return mstring + "n";
      case -2:
        return mstring + "u";
      case -1:
        return mstring + "m";
      case 0:
        return mstring;
      case 1:
        return mstring + "K";
      case 2:
        return mstring + "M";
      case 3:
        return mstring + "G";
    }

    // don't have a good suffix, so just print the number
    return n.toString();
  }

  var grid_pattern = [1, 2];
  var cursor_pattern = [5, 5];

  // x_values is an array of x coordinates for each of the plots
  // y_values is an array of [color, value_array], one entry for each plot on left vertical axis
  // z_values is an array of [color, value_array], one entry for each plot on right vertical axis
  Schematic.prototype.graph = function (x_values, x_legend, y_values, y_legend, z_values, z_legend) {
    var pwidth = 400; // dimensions of actual plot
    var pheight = 300; // dimensions of actual plot
    var left_margin = y_values != undefined && y_values.length > 0 ? 55 : 25;
    var top_margin = 25;
    var right_margin = z_values != undefined && z_values.length > 0 ? 55 : 25;
    var bottom_margin = 45;
    var tick_length = 5;

    var w = pwidth + left_margin + right_margin;
    var h = pheight + top_margin + bottom_margin;

    var canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    // the graph itself will be drawn here and this image will be copied
    // onto canvas, where it can be overlayed with mouse cursors, etc.
    var bg_image = document.createElement("canvas");
    bg_image.width = w;
    bg_image.height = h;
    canvas.bg_image = bg_image; // so we can find it during event handling

    // start by painting an opaque background
    var c = bg_image.getContext("2d");
    c.fillStyle = background_style;
    c.fillRect(0, 0, w, h);
    c.fillStyle = element_style;
    c.fillRect(left_margin, top_margin, pwidth, pheight);

    // figure out scaling for plots
    var x_min = array_min(x_values);
    var x_max = array_max(x_values);
    var x_limits = view_limits(x_min, x_max);
    x_min = x_limits[0];
    x_max = x_limits[1];
    var x_scale = pwidth / (x_max - x_min);

    function plot_x(x) {
      return (x - x_min) * x_scale + left_margin;
    }

    // draw x grid
    c.strokeStyle = grid_style;
    c.lineWidth = 1;
    c.fillStyle = normal_style;
    c.font = "10pt sans-serif";
    c.textAlign = "center";
    c.textBaseline = "top";
    var end = top_margin + pheight;
    for (var x = x_min; x <= x_max; x += x_limits[2]) {
      var temp = plot_x(x) + 0.5; // keep lines crisp!

      // grid line
      c.beginPath();
      if (x == x_min) {
        c.moveTo(temp, top_margin);
        c.lineTo(temp, end);
      } else c.dashedLineTo(temp, top_margin, temp, end, grid_pattern);
      c.stroke();

      // tick mark
      c.beginPath();
      c.moveTo(temp, end);
      c.lineTo(temp, end + tick_length);
      c.stroke();
      c.fillText(engineering_notation(x, 2), temp, end + tick_length);
    }

    if (y_values != undefined && y_values.length > 0) {
      var y_min = Infinity;
      var y_max = -Infinity;
      var plot;
      for (plot = y_values.length - 1; plot >= 0; --plot) {
        var values = y_values[plot][2];
        if (values == undefined) continue; // no data points
        var offset = y_values[plot][1];
        var temp = array_min(values) + offset;
        if (temp < y_min) y_min = temp;
        temp = array_max(values) + offset;
        if (temp > y_max) y_max = temp;
      }
      var y_limits = view_limits(y_min, y_max);
      y_min = y_limits[0];
      y_max = y_limits[1];
      var y_scale = pheight / (y_max - y_min);

      function plot_y(y) {
        return (y_max - y) * y_scale + top_margin;
      }

      // draw y grid
      c.textAlign = "right";
      c.textBaseline = "middle";
      for (var y = y_min; y <= y_max; y += y_limits[2]) {
        if (Math.abs(y / y_max) < 0.001) y = 0.0; // Just 3 digits
        var temp = plot_y(y) + 0.5; // keep lines crisp!

        // grid line
        c.beginPath();
        if (y == y_min) {
          c.moveTo(left_margin, temp);
          c.lineTo(left_margin + pwidth, temp);
        } else c.dashedLineTo(left_margin, temp, left_margin + pwidth, temp, grid_pattern);
        c.stroke();

        // tick mark
        c.beginPath();
        c.moveTo(left_margin - tick_length, temp);
        c.lineTo(left_margin, temp);
        c.stroke();
        c.fillText(engineering_notation(y, 2), left_margin - tick_length - 2, temp);
      }

      // now draw each plot
      var x, y;
      var nx, ny;
      c.lineWidth = 3;
      c.lineCap = "round";
      for (plot = y_values.length - 1; plot >= 0; --plot) {
        var color = probe_colors_rgb[y_values[plot][0]];
        if (color == undefined) continue; // no plot color (== x-axis)
        c.strokeStyle = color;
        var values = y_values[plot][2];
        if (values == undefined) continue; // no data points
        var offset = y_values[plot][1];

        x = plot_x(x_values[0]);
        y = plot_y(values[0] + offset);
        c.beginPath();
        c.moveTo(x, y);
        for (var i = 1; i < x_values.length; i++) {
          nx = plot_x(x_values[i]);
          ny = plot_y(values[i] + offset);
          c.lineTo(nx, ny);
          x = nx;
          y = ny;
          if (i % 100 == 99) {
            // too many lineTo's cause canvas to break
            c.stroke();
            c.beginPath();
            c.moveTo(x, y);
          }
        }
        c.stroke();
      }
    }

    if (z_values != undefined && z_values.length > 0) {
      var z_min = Infinity;
      var z_max = -Infinity;
      for (plot = z_values.length - 1; plot >= 0; --plot) {
        var values = z_values[plot][2];
        if (values == undefined) continue; // no data points
        var offset = z_values[plot][1];
        var temp = array_min(values) + offset;
        if (temp < z_min) z_min = temp;
        temp = array_max(values) + offset;
        if (temp > z_max) z_max = temp;
      }
      var z_limits = view_limits(z_min, z_max);
      z_min = z_limits[0];
      z_max = z_limits[1];
      var z_scale = pheight / (z_max - z_min);

      function plot_z(z) {
        return (z_max - z) * z_scale + top_margin;
      }

      // draw z ticks
      c.textAlign = "left";
      c.textBaseline = "middle";
      c.lineWidth = 1;
      c.strokeStyle = normal_style;
      var tick_length_half = Math.floor(tick_length / 2);
      var tick_delta = tick_length - tick_length_half;
      for (var z = z_min; z <= z_max; z += z_limits[2]) {
        if (Math.abs(z / z_max) < 0.001) z = 0.0; // Just 3 digits
        var temp = plot_z(z) + 0.5; // keep lines crisp!

        // tick mark
        c.beginPath();
        c.moveTo(left_margin + pwidth - tick_length_half, temp);
        c.lineTo(left_margin + pwidth + tick_delta, temp);
        c.stroke();
        c.fillText(engineering_notation(z, 2), left_margin + pwidth + tick_length + 2, temp);
      }

      var z;
      var nz;
      c.lineWidth = 3;
      for (plot = z_values.length - 1; plot >= 0; --plot) {
        var color = probe_colors_rgb[z_values[plot][0]];
        if (color == undefined) continue; // no plot color (== x-axis)
        c.strokeStyle = color;
        var values = z_values[plot][2];
        if (values == undefined) continue; // no data points
        var offset = z_values[plot][1];

        x = plot_x(x_values[0]);
        z = plot_z(values[0] + offset);
        c.beginPath();
        c.moveTo(x, z);
        for (var i = 1; i < x_values.length; i++) {
          nx = plot_x(x_values[i]);
          nz = plot_z(values[i] + offset);
          c.lineTo(nx, nz);
          x = nx;
          z = nz;
          if (i % 100 == 99) {
            // too many lineTo's cause canvas to break
            c.stroke();
            c.beginPath();
            c.moveTo(x, z);
          }
        }
        c.stroke();
      }
    }

    // draw legends
    c.font = "12pt sans-serif";
    c.textAlign = "center";
    c.textBaseline = "bottom";
    c.fillText(x_legend, left_margin + pwidth / 2, h - 5);

    if (y_values != undefined && y_values.length > 0) {
      c.textBaseline = "top";
      c.save();
      c.translate(5, top_margin + pheight / 2);
      c.rotate(-Math.PI / 2);
      c.fillText(y_legend, 0, 0);
      c.restore();
    }

    if (z_values != undefined && z_values.length > 0) {
      c.textBaseline = "bottom";
      c.save();
      c.translate(w - 5, top_margin + pheight / 2);
      c.rotate(-Math.PI / 2);
      c.fillText(z_legend, 0, 0);
      c.restore();
    }

    // save info need for interactions with the graph
    canvas.x_values = x_values;
    canvas.y_values = y_values;
    canvas.z_values = z_values;
    canvas.x_legend = x_legend;
    canvas.y_legend = y_legend;
    canvas.z_legend = y_legend;
    canvas.x_min = x_min;
    canvas.x_scale = x_scale;
    canvas.y_min = y_min;
    canvas.y_scale = y_scale;
    canvas.z_min = z_min;
    canvas.z_scale = z_scale;
    canvas.left_margin = left_margin;
    canvas.top_margin = top_margin;
    canvas.pwidth = pwidth;
    canvas.pheight = pheight;
    canvas.tick_length = tick_length;

    canvas.cursor1_x = undefined;
    canvas.cursor2_x = undefined;
    canvas.sch = this;

    // do something useful when user mouses over graph
    canvas.addEventListener("mousemove", graph_mouse_move, false);

    // return our masterpiece
    redraw_plot(canvas);
    return canvas;
  };

  function array_max(a) {
    var max = -Infinity;
    for (var i = a.length - 1; i >= 0; --i) if (a[i] > max) max = a[i];
    return max;
  }

  function array_min(a) {
    var min = Infinity;
    for (var i = a.length - 1; i >= 0; --i) if (a[i] < min) min = a[i];
    return min;
  }

  function plot_cursor(c, graph, cursor_x, left_margin) {
    // draw dashed vertical marker that follows mouse
    var x = graph.left_margin + cursor_x;
    var end_y = graph.top_margin + graph.pheight + graph.tick_length;
    c.strokeStyle = grid_style;
    c.lineWidth = 1;
    c.beginPath();
    c.dashedLineTo(x, graph.top_margin, x, end_y, cursor_pattern);
    c.stroke();

    // add x label at bottom of marker
    var graph_x = cursor_x / graph.x_scale + graph.x_min;
    c.font = "10pt sans-serif";
    c.textAlign = "center";
    c.textBaseline = "top";
    c.fillStyle = background_style;
    c.fillText("\u2588\u2588\u2588\u2588\u2588", x, end_y);
    c.fillStyle = normal_style;
    c.fillText(engineering_notation(graph_x, 3, false), x, end_y);

    // compute which points marker is between
    var x_values = graph.x_values;
    var len = x_values.length;
    var index = 0;
    while (index < len && graph_x >= x_values[index]) index += 1;
    var x1 = index == 0 ? x_values[0] : x_values[index - 1];
    var x2 = x_values[index];

    if (x2 != undefined) {
      // for each plot, interpolate and output value at intersection with marker
      c.textAlign = "left";
      var tx = graph.left_margin + left_margin;
      var ty = graph.top_margin;
      if (graph.y_values != undefined) {
        for (var plot = 0; plot < graph.y_values.length; plot++) {
          var values = graph.y_values[plot][2];
          var color = probe_colors_rgb[graph.y_values[plot][0]];
          if (values == undefined || color == undefined) continue; // no data points or x-axis

          // interpolate signal value at graph_x using values[index-1] and values[index]
          var y1 = index == 0 ? values[0] : values[index - 1];
          var y2 = values[index];
          var y = y1;
          if (graph_x != x1) y += ((graph_x - x1) * (y2 - y1)) / (x2 - x1);

          // annotate plot with value of signal at marker
          c.fillStyle = element_style;
          c.fillText("\u2588\u2588\u2588\u2588\u2588", tx - 3, ty);
          c.fillStyle = color;
          c.fillText(engineering_notation(y, 3, false), tx, ty);
          ty += 14;
        }
      }

      c.textAlign = "right";
      if (graph.z_values != undefined) {
        var tx = graph.left_margin + graph.pwidth - left_margin;
        var ty = graph.top_margin;
        for (var plot = 0; plot < graph.z_values.length; plot++) {
          var values = graph.z_values[plot][2];
          var color = probe_colors_rgb[graph.z_values[plot][0]];
          if (values == undefined || color == undefined) continue; // no data points or x-axis

          // interpolate signal value at graph_x using values[index-1] and values[index]
          var z1 = index == 0 ? values[0] : values[index - 1];
          var z2 = values[index];
          var z = z1;
          if (graph_x != x1) z += ((graph_x - x1) * (z2 - z1)) / (x2 - x1);

          // annotate plot with value of signal at marker
          c.fillStyle = element_style;
          c.fillText("\u2588\u2588\u2588\u2588\u2588", tx + 3, ty);
          c.fillStyle = color;
          c.fillText(engineering_notation(z, 3, false), tx, ty);
          ty += 14;
        }
      }
    }
  }

  function redraw_plot(graph) {
    var c = graph.getContext("2d");
    c.drawImage(graph.bg_image, 0, 0);

    if (graph.cursor1_x != undefined) plot_cursor(c, graph, graph.cursor1_x, 4);
    if (graph.cursor2_x != undefined) plot_cursor(c, graph, graph.cursor2_x, 30);

    /*
	    if (graph.cursor1_x != undefined) {
		// draw dashed vertical marker that follows mouse
		var x = graph.left_margin + graph.cursor1_x;
		var end_y = graph.top_margin + graph.pheight + graph.tick_length;
		c.strokeStyle = grid_style;
		c.lineWidth = 1;
		c.beginPath();
		c.dashedLineTo(x,graph.top_margin,x,end_y,cursor_pattern);
		c.stroke();

		// add x label at bottom of marker
		var graph_x = graph.cursor1_x/graph.x_scale + graph.x_min;
		c.font = '10pt sans-serif';
		c.textAlign = 'center';
		c.textBaseline = 'top';
		c.fillStyle = background_style;
		c.fillText('\u2588\u2588\u2588\u2588\u2588',x,end_y);
		c.fillStyle = normal_style;
		c.fillText(engineering_notation(graph_x,3,false),x,end_y);

		// compute which points marker is between
		var x_values = graph.x_values;
		var len = x_values.length;
		var index = 0;
		while (index < len && graph_x >= x_values[index]) index += 1;
		var x1 = (index == 0) ? x_values[0] : x_values[index-1];
		var x2 = x_values[index];

		if (x2 != undefined) {
		    // for each plot, interpolate and output value at intersection with marker
		    c.textAlign = 'left';
		    var tx = graph.left_margin + 4;
		    var ty = graph.top_margin;
		    for (var plot = 0; plot < graph.y_values.length; plot++) {
			var values = graph.y_values[plot][1];

			// interpolate signal value at graph_x using values[index-1] and values[index]
			var y1 = (index == 0) ? values[0] : values[index-1];
			var y2 = values[index];
			var y = y1;
			if (graph_x != x1) y += (graph_x - x1)*(y2 - y1)/(x2 - x1);

			// annotate plot with value of signal at marker
			c.fillStyle = element_style;
			c.fillText('\u2588\u2588\u2588\u2588\u2588',tx-3,ty);
			c.fillStyle = probe_colors_rgb[graph.y_values[plot][0]];
			c.fillText(engineering_notation(y,3,false),tx,ty);
			ty += 14;
		    }
		}
	    }
	    */
  }

  function graph_mouse_move(event) {
    if (!event) event = window.event;
    var g = window.event ? event.srcElement : event.target;

    g.relMouseCoords(event);
    // not sure yet where the 3,-3 offset correction comes from (borders? padding?)
    var gx = g.mouse_x - g.left_margin - 3;
    var gy = g.pheight - (g.mouse_y - g.top_margin) + 3;
    if (gx >= 0 && gx <= g.pwidth && gy >= 0 && gy <= g.pheight) {
      //g.sch.message('button: '+event.button+', which: '+event.which);
      g.cursor1_x = gx;
    } else {
      g.cursor1_x = undefined;
      g.cursor2_x = undefined;
    }

    redraw_plot(g);
  }

  ///////////////////////////////////////////////////////////////////////////////
  //
  //  Parts bin
  //
  ////////////////////////////////////////////////////////////////////////////////

  // one instance will be created for each part in the parts bin
  function Part(sch) {
    this.sch = sch;
    this.component = undefined;
    this.selected = false;

    // set up canvas
    this.canvas = document.createElement("canvas");
    this.canvas.style.borderStyle = "solid";
    this.canvas.style.borderWidth = "1px";
    this.canvas.style.borderColor = background_style;
    //this.canvas.style.position = 'absolute';
    this.canvas.style.cursor = "default";
    this.canvas.height = part_w;
    this.canvas.width = part_h;
    this.canvas.xpart = this;

    this.canvas.addEventListener("mouseover", part_enter, false);
    this.canvas.addEventListener("mouseout", part_leave, false);
    this.canvas.addEventListener("mousedown", part_mouse_down, false);
    this.canvas.addEventListener("mouseup", part_mouse_up, false);

    // make the part "clickable" by registering a dummy click handler
    // this should make things work on the iPad
    this.canvas.addEventListener("click", function () {}, false);
  }

  Part.prototype.set_location = function (left, top) {
    this.canvas.style.left = left + "px";
    this.canvas.style.top = top + "px";
  };

  Part.prototype.right = function () {
    return this.canvas.offsetLeft + this.canvas.offsetWidth;
  };

  Part.prototype.bottom = function () {
    return this.canvas.offsetTop + this.canvas.offsetHeight;
  };

  Part.prototype.set_component = function (component, tip) {
    component.sch = this;
    this.component = component;
    this.tip = tip;

    // figure out scaling and centering of parts icon
    var b = component.bounding_box;
    var dx = b[2] - b[0];
    var dy = b[3] - b[1];
    this.scale = 0.8; //Math.min(part_w/(1.2*dx),part_h/(1.2*dy));
    this.origin_x = b[0] + dx / 2.0 - part_w / (2.0 * this.scale);
    this.origin_y = b[1] + dy / 2.0 - part_h / (2.0 * this.scale);

    this.redraw();
  };

  Part.prototype.redraw = function (part) {
    var c = this.canvas.getContext("2d");

    // paint background color
    c.fillStyle = this.selected ? selected_style : background_style;
    c.fillRect(0, 0, part_w, part_h);

    if (this.component) this.component.draw(c);
  };

  Part.prototype.select = function (which) {
    this.selected = which;
    this.redraw();
  };

  Part.prototype.update_connection_point = function (cp, old_location) {
    // no connection points in the parts bin
  };

  Part.prototype.moveTo = function (c, x, y) {
    c.moveTo((x - this.origin_x) * this.scale, (y - this.origin_y) * this.scale);
  };

  Part.prototype.lineTo = function (c, x, y) {
    c.lineTo((x - this.origin_x) * this.scale, (y - this.origin_y) * this.scale);
  };

  Part.prototype.draw_line = function (c, x1, y1, x2, y2, width) {
    c.lineWidth = width * this.scale;
    c.beginPath();
    c.moveTo((x1 - this.origin_x) * this.scale, (y1 - this.origin_y) * this.scale);
    c.lineTo((x2 - this.origin_x) * this.scale, (y2 - this.origin_y) * this.scale);
    c.stroke();
  };

  Part.prototype.draw_arc = function (c, x, y, radius, start_radians, end_radians, anticlockwise, width, filled) {
    c.lineWidth = width * this.scale;
    c.beginPath();
    c.arc(
      (x - this.origin_x) * this.scale,
      (y - this.origin_y) * this.scale,
      radius * this.scale,
      start_radians,
      end_radians,
      anticlockwise,
    );
    if (filled) c.fill();
    else c.stroke();
  };

  Part.prototype.draw_text = function (c, text, x, y, size) {
    // no text displayed for the parts icon
  };

  function part_enter(event) {
    if (!event) event = window.event;
    var canvas = window.event ? event.srcElement : event.target;
    var part = canvas.xpart;

    // avoid Chrome bug that changes to text cursor whenever
    // drag starts.  We'll restore the default handler at
    // the appropriate point so behavior in other parts of
    // the document are unaffected.
    //part.sch.saved_onselectstart = document.onselectstart;
    //document.onselectstart = function () { return false; };

    canvas.style.borderColor = normal_style;
    part.sch.message(part.tip + ": drag onto diagram to insert");
    return false;
  }

  function part_leave(event) {
    if (!event) event = window.event;
    var canvas = window.event ? event.srcElement : event.target;
    var part = canvas.xpart;

    if (typeof part.sch.new_part == "undefined") {
      // leaving with no part selected?  revert handler
      //document.onselectstart = part.sch.saved_onselectstart;
    }

    canvas.style.borderColor = background_style;
    part.sch.message("");
    return false;
  }

  function part_mouse_down(event) {
    if (!event) event = window.event;
    var part = window.event ? event.srcElement.xpart : event.target.xpart;

    part.select(true);
    part.sch.new_part = part;
    return false;
  }

  function part_mouse_up(event) {
    if (!event) event = window.event;
    var part = window.event ? event.srcElement.xpart : event.target.xpart;

    part.select(false);
    part.sch.new_part = undefined;
    return false;
  }

  ////////////////////////////////////////////////////////////////////////////////
  //
  //  Rectangle helper functions
  //
  ////////////////////////////////////////////////////////////////////////////////

  // rect is an array of the form [left,top,right,bottom]

  // ensure left < right, top < bottom
  function canonicalize(r) {
    var temp;

    // canonicalize bounding box
    if (r[0] > r[2]) {
      temp = r[0];
      r[0] = r[2];
      r[2] = temp;
    }
    if (r[1] > r[3]) {
      temp = r[1];
      r[1] = r[3];
      r[3] = temp;
    }
  }

  function between(x, x1, x2) {
    return x1 <= x && x <= x2;
  }

  function inside(rect, x, y) {
    return between(x, rect[0], rect[2]) && between(y, rect[1], rect[3]);
  }

  // only works for manhattan rectangles
  function intersect(r1, r2) {
    // look for non-intersection, negate result
    var result = !(r2[0] > r1[2] || r2[2] < r1[0] || r2[1] > r1[3] || r2[3] < r1[1]);

    // if I try to return the above expression, javascript returns undefined!!!
    return result;
  }

  ////////////////////////////////////////////////////////////////////////////////
  //
  //  Component base class
  //
  ////////////////////////////////////////////////////////////////////////////////

  function Component(type, x, y, rotation) {
    this.sch = undefined;
    this.type = type;
    this.x = x;
    this.y = y;
    this.rotation = rotation;
    this.selected = false;
    this.properties = [];
    this.bounding_box = [0, 0, 0, 0]; // in device coords [left,top,right,bottom]
    this.bbox = this.bounding_box; // in absolute coords
    this.connections = [];
  }

  Component.prototype.json = function (index) {
    this.properties["_json_"] = index; // remember where we are in the JSON list

    var props = {};
    for (var p in this.properties) props[p] = this.properties[p];

    var conns = [];
    for (var i = 0; i < this.connections.length; i++) conns.push(this.connections[i].json());

    var json = [this.type, [this.x, this.y, this.rotation], props, conns];
    return json;
  };

  Component.prototype.add_connection = function (offset_x, offset_y) {
    this.connections.push(new ConnectionPoint(this, offset_x, offset_y));
  };

  Component.prototype.update_coords = function () {
    var x = this.x;
    var y = this.y;

    // update bbox
    var b = this.bounding_box;
    this.bbox[0] = this.transform_x(b[0], b[1]) + x;
    this.bbox[1] = this.transform_y(b[0], b[1]) + y;
    this.bbox[2] = this.transform_x(b[2], b[3]) + x;
    this.bbox[3] = this.transform_y(b[2], b[3]) + y;
    canonicalize(this.bbox);

    // update connections
    for (var i = this.connections.length - 1; i >= 0; --i) this.connections[i].update_location();
  };

  Component.prototype.rotate = function (amount) {
    var old_rotation = this.rotation;
    this.rotation = (this.rotation + amount) % 8;
    this.update_coords();

    // create an undoable edit record here
    // using old_rotation
  };

  Component.prototype.move_begin = function () {
    // remember where we started this move
    this.move_x = this.x;
    this.move_y = this.y;
  };

  Component.prototype.move = function (dx, dy) {
    // update coordinates
    this.x += dx;
    this.y += dy;
    this.update_coords();
  };

  Component.prototype.move_end = function () {
    var dx = this.x - this.move_x;
    var dy = this.y - this.move_y;

    if (dx != 0 || dy != 0) {
      // create an undoable edit record here

      this.sch.check_wires(this);
    }
  };

  Component.prototype.add = function (sch) {
    this.sch = sch; // we now belong to a schematic!
    sch.add_component(this);
    this.update_coords();
  };

  Component.prototype.remove = function () {
    // remove connection points from schematic
    for (var i = this.connections.length - 1; i >= 0; --i) {
      var cp = this.connections[i];
      this.sch.remove_connection_point(cp, cp.location);
    }

    // remove component from schematic
    this.sch.remove_component(this);
    this.sch = undefined;

    // create an undoable edit record here
  };

  Component.prototype.transform_x = function (x, y) {
    var rot = this.rotation;
    if (rot == 0 || rot == 6) return x;
    else if (rot == 1 || rot == 5) return -y;
    else if (rot == 2 || rot == 4) return -x;
    else return y;
  };

  Component.prototype.transform_y = function (x, y) {
    var rot = this.rotation;
    if (rot == 1 || rot == 7) return x;
    else if (rot == 2 || rot == 6) return -y;
    else if (rot == 3 || rot == 5) return -x;
    else return y;
  };

  Component.prototype.moveTo = function (c, x, y) {
    var nx = this.transform_x(x, y) + this.x;
    var ny = this.transform_y(x, y) + this.y;
    this.sch.moveTo(c, nx, ny);
  };

  Component.prototype.lineTo = function (c, x, y) {
    var nx = this.transform_x(x, y) + this.x;
    var ny = this.transform_y(x, y) + this.y;
    this.sch.lineTo(c, nx, ny);
  };

  Component.prototype.draw_line = function (c, x1, y1, x2, y2) {
    c.strokeStyle = this.selected ? selected_style : this.type == "w" ? normal_style : component_style;
    var nx1 = this.transform_x(x1, y1) + this.x;
    var ny1 = this.transform_y(x1, y1) + this.y;
    var nx2 = this.transform_x(x2, y2) + this.x;
    var ny2 = this.transform_y(x2, y2) + this.y;
    this.sch.draw_line(c, nx1, ny1, nx2, ny2, 1);
  };

  Component.prototype.draw_circle = function (c, x, y, radius, filled) {
    if (filled) c.fillStyle = this.selected ? selected_style : normal_style;
    else c.strokeStyle = this.selected ? selected_style : this.type == "w" ? normal_style : component_style;
    var nx = this.transform_x(x, y) + this.x;
    var ny = this.transform_y(x, y) + this.y;

    this.sch.draw_arc(c, nx, ny, radius, 0, 2 * Math.PI, false, 1, filled);
  };

  var rot_angle = [
    0.0, // NORTH (identity)
    Math.PI / 2, // EAST (rot270)
    Math.PI, // SOUTH (rot180)
    (3 * Math.PI) / 2, // WEST (rot90)
    0.0, // RNORTH (negy)
    Math.PI / 2, // REAST (int-neg)
    Math.PI, // RSOUTH (negx)
    (3 * Math.PI) / 2, // RWEST (int-pos)
  ];

  Component.prototype.draw_arc = function (c, x, y, radius, start_radians, end_radians) {
    c.strokeStyle = this.selected ? selected_style : this.type == "w" ? normal_style : component_style;
    var nx = this.transform_x(x, y) + this.x;
    var ny = this.transform_y(x, y) + this.y;
    this.sch.draw_arc(
      c,
      nx,
      ny,
      radius,
      start_radians + rot_angle[this.rotation],
      end_radians + rot_angle[this.rotation],
      false,
      1,
      false,
    );
  };

  Component.prototype.draw = function (c) {
    /*
	    for (var i = this.connections.length - 1; i >= 0; --i) {
		var cp = this.connections[i];
		cp.draw_x(c);
	    }
	    */
  };

  // result of rotating an alignment [rot*9 + align]
  var aOrient = [
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8, // NORTH (identity)
    2,
    5,
    8,
    1,
    4,
    7,
    0,
    3,
    6, // EAST (rot270)
    8,
    7,
    6,
    5,
    4,
    3,
    2,
    1,
    0, // SOUTH (rot180)
    6,
    3,
    0,
    7,
    4,
    1,
    8,
    5,
    3, // WEST (rot90)
    2,
    1,
    0,
    5,
    4,
    3,
    8,
    7,
    6, // RNORTH (negy)
    8,
    5,
    2,
    7,
    4,
    1,
    6,
    3,
    0, // REAST (int-neg)
    6,
    7,
    8,
    3,
    4,
    5,
    0,
    1,
    2, // RSOUTH (negx)
    0,
    3,
    6,
    1,
    4,
    7,
    2,
    5,
    8, // RWEST (int-pos)
  ];

  var textAlign = ["left", "center", "right", "left", "center", "right", "left", "center", "right"];

  var textBaseline = ["top", "top", "top", "middle", "middle", "middle", "bottom", "bottom", "bottom"];

  Component.prototype.draw_text = function (c, text, x, y, alignment, size, fill) {
    var a = aOrient[this.rotation * 9 + alignment];
    c.textAlign = textAlign[a];
    c.textBaseline = textBaseline[a];
    if (fill == undefined) c.fillStyle = this.selected ? selected_style : normal_style;
    else c.fillStyle = fill;
    this.sch.draw_text(c, text, this.transform_x(x, y) + this.x, this.transform_y(x, y) + this.y, size);
  };

  Component.prototype.set_select = function (which) {
    if (which != this.selected) {
      this.selected = which;
      // create an undoable edit record here
    }
  };

  Component.prototype.select = function (x, y, shiftKey) {
    this.was_previously_selected = this.selected;
    if (this.near(x, y)) {
      this.set_select(shiftKey ? !this.selected : true);
      return true;
    } else return false;
  };

  Component.prototype.select_rect = function (s) {
    this.was_previously_selected = this.selected;
    if (intersect(this.bbox, s)) this.set_select(true);
  };

  // if connection point of component c bisects the
  // wire represented by this compononent, return that
  // connection point.  Otherwise return null.
  Component.prototype.bisect = function (c) {
    return null;
  };

  // does mouse click fall on this component?
  Component.prototype.near = function (x, y) {
    return inside(this.bbox, x, y);
  };

  Component.prototype.edit_properties = function (x, y) {
    if (this.near(x, y)) {
      // make an <input> widget for each property
      var fields = [];
      for (var i in this.properties)
        // underscore at beginning of property name => system property
        if (i.charAt(0) != "_") fields[i] = build_input("text", 10, this.properties[i]);

      var content = build_table(fields);
      content.fields = fields;
      content.component = this;

      this.sch.dialog("Edit Properties", content, function (content) {
        for (var i in content.fields) content.component.properties[i] = content.fields[i].value;
        content.component.sch.redraw_background();
      });
      return true;
    } else return false;
  };

  Component.prototype.clear_labels = function () {
    for (var i = this.connections.length - 1; i >= 0; --i) {
      this.connections[i].clear_label();
    }
  };

  // default action: don't propagate label
  Component.prototype.propagate_label = function (label) {};

  // give components a chance to generate default labels for their connection(s)
  // default action: do nothing
  Component.prototype.add_default_labels = function () {};

  // component should generate labels for all unlabeled connections
  Component.prototype.label_connections = function () {
    for (var i = this.connections.length - 1; i >= 0; --i) {
      var cp = this.connections[i];
      if (!cp.label) cp.propagate_label(this.sch.get_next_label());
    }
  };

  // default behavior: no probe info
  Component.prototype.probe_info = function () {
    return undefined;
  };

  // default behavior: nothing to display for DC analysis
  Component.prototype.display_current = function (c, vmap) {};

  ////////////////////////////////////////////////////////////////////////////////
  //
  //  Connection point
  //
  ////////////////////////////////////////////////////////////////////////////////

  var connection_point_radius = 2;

  function ConnectionPoint(parent, x, y) {
    this.parent = parent;
    this.offset_x = x;
    this.offset_y = y;
    this.location = "";
    this.update_location();
    this.label = undefined;
  }

  ConnectionPoint.prototype.toString = function () {
    return edx.StringUtils.interpolate("<ConnectionPoint ({offset_x},{offset_y}) {parent}>", {
      offset_x: this.offset_x,
      offset_y: this.offset_y,
      parent: __webpack_provided_edx_dot_HtmlUtils.ensureHTML(this.parent.toString()),
    });
  };

  ConnectionPoint.prototype.json = function () {
    return this.label;
  };

  ConnectionPoint.prototype.clear_label = function () {
    this.label = undefined;
  };

  ConnectionPoint.prototype.propagate_label = function (label) {
    // should we check if existing label is the same?  it should be...

    if (this.label === undefined) {
      // label this connection point
      this.label = label;

      // propagate label to coincident connection points
      this.parent.sch.propagate_label(label, this.location);

      // possibly label other cp's for this device?
      this.parent.propagate_label(label);
    } else if (this.label != "0" && label != "0" && this.label != label)
      alert("Node has two conflicting labels: " + this.label + ", " + label);
  };

  ConnectionPoint.prototype.update_location = function () {
    // update location string which we use as a key to find coincident connection points
    var old_location = this.location;
    var parent = this.parent;
    var nx = parent.transform_x(this.offset_x, this.offset_y) + parent.x;
    var ny = parent.transform_y(this.offset_x, this.offset_y) + parent.y;
    this.x = nx;
    this.y = ny;
    this.location = nx + "," + ny;

    // add ourselves to the connection list for the new location
    if (parent.sch) parent.sch.update_connection_point(this, old_location);
  };

  ConnectionPoint.prototype.coincident = function (x, y) {
    return this.x == x && this.y == y;
  };

  ConnectionPoint.prototype.draw = function (c, n) {
    if (n != 2) this.parent.draw_circle(c, this.offset_x, this.offset_y, connection_point_radius, n > 2);
  };

  ConnectionPoint.prototype.draw_x = function (c) {
    this.parent.draw_line(c, this.offset_x - 2, this.offset_y - 2, this.offset_x + 2, this.offset_y + 2, grid_style);
    this.parent.draw_line(c, this.offset_x + 2, this.offset_y - 2, this.offset_x - 2, this.offset_y + 2, grid_style);
  };

  ConnectionPoint.prototype.display_voltage = function (c, vmap) {
    var v = vmap[this.label];
    if (v != undefined) {
      var label = v.toFixed(2) + "V";

      // first draw some solid blocks in the background
      c.globalAlpha = 0.85;
      this.parent.draw_text(c, "\u2588\u2588\u2588", this.offset_x, this.offset_y, 4, annotation_size, element_style);
      c.globalAlpha = 1.0;

      // display the node voltage at this connection point
      this.parent.draw_text(c, label, this.offset_x, this.offset_y, 4, annotation_size, annotation_style);

      // only display each node voltage once
      delete vmap[this.label];
    }
  };

  // see if three connection points are collinear
  function collinear(p1, p2, p3) {
    // from http://mathworld.wolfram.com/Collinear.html
    var area = p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y);
    return area == 0;
  }

  ////////////////////////////////////////////////////////////////////////////////
  //
  //  Wire
  //
  ////////////////////////////////////////////////////////////////////////////////

  var near_distance = 2; // how close to wire counts as "near by"

  function Wire(x1, y1, x2, y2) {
    // arbitrarily call x1,y1 the origin
    Component.call(this, "w", x1, y1, 0);
    this.dx = x2 - x1;
    this.dy = y2 - y1;
    this.add_connection(0, 0);
    this.add_connection(this.dx, this.dy);

    // compute bounding box (expanded slightly)
    var r = [0, 0, this.dx, this.dy];
    canonicalize(r);
    r[0] -= near_distance;
    r[1] -= near_distance;
    r[2] += near_distance;
    r[3] += near_distance;
    this.bounding_box = r;
    this.update_coords(); // update bbox

    // used in selection calculations
    this.len = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
  }
  Wire.prototype = new Component();
  Wire.prototype.constructor = Wire;

  Wire.prototype.toString = function () {
    return edx.StringUtils.interpolate("<Wire ({x},{y}) ({x_plus_dx},{y_plus_dy})>", {
      x: this.x,
      y: this.y,
      x_plus_dx: this.x + this.dx,
      y_plus_dy: this.y + this.dy,
    });
  };

  // return connection point at other end of wire from specified cp
  Wire.prototype.other_end = function (cp) {
    if (cp == this.connections[0]) return this.connections[1];
    else if (cp == this.connections[1]) return this.connections[0];
    else return undefined;
  };

  Wire.prototype.json = function (index) {
    var json = ["w", [this.x, this.y, this.x + this.dx, this.y + this.dy]];
    return json;
  };

  Wire.prototype.draw = function (c) {
    this.draw_line(c, 0, 0, this.dx, this.dy);
  };

  Wire.prototype.clone = function (x, y) {
    return new Wire(x, y, x + this.dx, y + this.dy);
  };

  Wire.prototype.near = function (x, y) {
    // crude check: (x,y) within expanded bounding box of wire
    if (inside(this.bbox, x, y)) {
      // compute distance between x,y and nearst point on line
      // http://www.allegro.cc/forums/thread/589720
      var D = Math.abs((x - this.x) * this.dy - (y - this.y) * this.dx) / this.len;
      if (D <= near_distance) return true;
    }
    return false;
  };

  // selection rectangle selects wire only if it includes
  // one of the end points
  Wire.prototype.select_rect = function (s) {
    this.was_previously_selected = this.selected;
    if (inside(s, this.x, this.y) || inside(s, this.x + this.dx, this.y + this.dy)) this.set_select(true);
  };

  // if connection point cp bisects the
  // wire represented by this compononent, return true
  Wire.prototype.bisect_cp = function (cp) {
    var x = cp.x;
    var y = cp.y;

    // crude check: (x,y) within expanded bounding box of wire
    if (inside(this.bbox, x, y)) {
      // compute distance between x,y and nearst point on line
      // http://www.allegro.cc/forums/thread/589720
      var D = Math.abs((x - this.x) * this.dy - (y - this.y) * this.dx) / this.len;
      // final check: ensure point isn't an end point of the wire
      if (D < 1 && !this.connections[0].coincident(x, y) && !this.connections[1].coincident(x, y)) return true;
    }
    return false;
  };

  // if some connection point of component c bisects the
  // wire represented by this compononent, return that
  // connection point.  Otherwise return null.
  Wire.prototype.bisect = function (c) {
    if (c == undefined) return;
    for (var i = c.connections.length - 1; i >= 0; --i) {
      var cp = c.connections[i];
      if (this.bisect_cp(cp)) return cp;
    }
    return null;
  };

  Wire.prototype.move_end = function () {
    // look for wires bisected by this wire
    this.sch.check_wires(this);

    // look for connection points that might bisect us
    this.sch.check_connection_points(this);
  };

  // wires "conduct" their label to the other end
  Wire.prototype.propagate_label = function (label) {
    // don't worry about relabeling a cp, it won't recurse!
    this.connections[0].propagate_label(label);
    this.connections[1].propagate_label(label);
  };

  // Wires have no properties to edit
  Wire.prototype.edit_properties = function (x, y) {
    return false;
  };

  // some actual component will start the labeling of electrical nodes,
  // so do nothing here
  Wire.prototype.label_connections = function () {};

  ////////////////////////////////////////////////////////////////////////////////
  //
  //  Ground
  //
  ////////////////////////////////////////////////////////////////////////////////

  function Ground(x, y, rotation) {
    Component.call(this, "g", x, y, rotation);
    this.add_connection(0, 0);
    this.bounding_box = [-6, 0, 6, 8];
    this.update_coords();
  }
  Ground.prototype = new Component();
  Ground.prototype.constructor = Ground;

  Ground.prototype.toString = function () {
    return edx.StringUtils.interpolate("<Ground ({x},{y})>", {
      x: this.x,
      y: this.y,
    });
  };

  Ground.prototype.draw = function (c) {
    Component.prototype.draw.call(this, c); // give superclass a shot
    this.draw_line(c, 0, 0, 0, 8);
    this.draw_line(c, -6, 8, 6, 8);
  };

  Ground.prototype.clone = function (x, y) {
    return new Ground(x, y, this.rotation);
  };

  // Grounds no properties to edit
  Ground.prototype.edit_properties = function (x, y) {
    return false;
  };

  // give components a chance to generate a label for their connection(s)
  // default action: do nothing
  Ground.prototype.add_default_labels = function () {
    this.connections[0].propagate_label("0"); // canonical label for GND node
  };

  ////////////////////////////////////////////////////////////////////////////////
  //
  //  Label
  //
  ////////////////////////////////////////////////////////////////////////////////

  function Label(x, y, rotation, label) {
    Component.call(this, "L", x, y, rotation);
    this.properties["label"] = label ? label : "???";
    this.add_connection(0, 0);
    this.bounding_box = [-2, 0, 2, 8];
    this.update_coords();
  }
  Label.prototype = new Component();
  Label.prototype.constructor = Label;

  Label.prototype.toString = function () {
    return edx.StringUtils.interpolate("<Label ({x},{y})>", {
      x: this.x,
      y: this.y,
    });
  };

  Label.prototype.draw = function (c) {
    Component.prototype.draw.call(this, c); // give superclass a shot
    this.draw_line(c, 0, 0, 0, 8);
    this.draw_text(c, this.properties["label"], 0, 9, 1, property_size);
  };

  Label.prototype.clone = function (x, y) {
    return new Label(x, y, this.rotation, this.properties["label"]);
  };

  // give components a chance to generate a label for their connection(s)
  // default action: do nothing
  Label.prototype.add_default_labels = function () {
    this.connections[0].propagate_label(this.properties["label"]);
  };

  ////////////////////////////////////////////////////////////////////////////////
  //
  //  Voltage Probe
  //
  ////////////////////////////////////////////////////////////////////////////////

  var probe_colors = ["red", "green", "blue", "cyan", "magenta", "yellow", "black", "x-axis"];
  var probe_colors_rgb = {
    red: "rgb(255,64,64)",
    green: "rgb(64,255,64)",
    blue: "rgb(64,64,255)",
    cyan: "rgb(64,255,255)",
    magenta: "rgb(255,64,255)",
    yellow: "rgb(255,255,64)",
    black: "rgb(0,0,0)",
    "x-axis": undefined,
  };

  function Probe(x, y, rotation, color, offset) {
    Component.call(this, "s", x, y, rotation);
    this.add_connection(0, 0);
    this.properties["color"] = color ? color : "cyan";
    this.properties["offset"] = offset == undefined || offset == "" ? "0" : offset;
    this.bounding_box = [0, 0, 27, -21];
    this.update_coords();
  }
  Probe.prototype = new Component();
  Probe.prototype.constructor = Probe;

  Probe.prototype.toString = function () {
    return edx.StringUtils.interpolate("<Probe ({x},{y})>", {
      x: this.x,
      y: this.y,
    });
  };

  Probe.prototype.draw = function (c) {
    // draw outline
    this.draw_line(c, 0, 0, 4, -4);
    this.draw_line(c, 2, -6, 6, -2);
    this.draw_line(c, 2, -6, 17, -21);
    this.draw_line(c, 6, -2, 21, -17);
    this.draw_line(c, 17, -21, 21, -17);
    this.draw_arc(c, 19, -11, 8, (3 * Math.PI) / 2, 0);

    // fill body with plot color
    var color = probe_colors_rgb[this.properties["color"]];
    if (color != undefined) {
      c.fillStyle = color;
      c.beginPath();
      this.moveTo(c, 2, -6);
      this.lineTo(c, 6, -2);
      this.lineTo(c, 21, -17);
      this.lineTo(c, 17, -21);
      this.lineTo(c, 2, -6);
      c.fill();
    } else {
      this.draw_text(c, this.properties["color"], 27, -11, 1, property_size);
    }
  };

  Probe.prototype.clone = function (x, y) {
    return new Probe(x, y, this.rotation, this.properties["color"], this.properties["offset"]);
  };

  Probe.prototype.edit_properties = function (x, y) {
    if (inside(this.bbox, x, y)) {
      var fields = [];
      fields["Plot color"] = build_select(probe_colors, this.properties["color"]);
      fields["Plot offset"] = build_input("text", 10, this.properties["offset"]);

      var content = build_table(fields);
      content.fields = fields;
      content.component = this;

      this.sch.dialog("Edit Properties", content, function (content) {
        var color_choice = content.fields["Plot color"];
        content.component.properties["color"] = probe_colors[color_choice.selectedIndex];
        content.component.properties["offset"] = content.fields["Plot offset"].value;
        content.component.sch.redraw_background();
      });
      return true;
    } else return false;
  };

  // return [color, node_label, offset, type] for this probe
  Probe.prototype.probe_info = function () {
    var color = this.properties["color"];
    var offset = this.properties["offset"];
    if (offset == undefined || offset == "") offset = "0";
    return [color, this.connections[0].label, offset, "voltage"];
  };

  ////////////////////////////////////////////////////////////////////////////////
  //
  //  Ammeter Probe
  //
  ////////////////////////////////////////////////////////////////////////////////

  function Ammeter(x, y, rotation, color, offset) {
    Component.call(this, "a", x, y, rotation);
    this.add_connection(0, 0); // pos
    this.add_connection(16, 0); // neg
    this.properties["color"] = color ? color : "magenta";
    this.properties["offset"] = offset == undefined || offset == "" ? "0" : offset;
    this.bounding_box = [-3, 0, 16, 3];
    this.update_coords();
  }
  Ammeter.prototype = new Component();
  Ammeter.prototype.constructor = Ammeter;

  Ammeter.prototype.toString = function () {
    return edx.StringUtils.interpolate("<Ammeter ({x},{y})>", {
      x: this.x,
      y: this.y,
    });
  };

  Ammeter.prototype.move_end = function () {
    Component.prototype.move_end.call(this); // do the normal processing

    // special for current probes: see if probe has been placed
    // in the middle of wire, creating three wire segments one
    // of which is shorting the two terminals of the probe.  If
    // so, auto remove the shorting segment.
    var e1 = this.connections[0].location;
    var e2 = this.connections[1].location;
    var cplist = this.sch.find_connections(this.connections[0]);
    for (var i = cplist.length - 1; i >= 0; --i) {
      var c = cplist[i].parent; // a component connected to ammeter terminal
      // look for a wire whose end points match those of the ammeter
      if (c.type == "w") {
        var c_e1 = c.connections[0].location;
        var c_e2 = c.connections[1].location;
        if ((e1 == c_e1 && c2 == c_e2) || (e1 == c_e2 && e2 == c_e1)) {
          c.remove();
          break;
        }
      }
    }
  };

  Ammeter.prototype.draw = function (c) {
    this.draw_line(c, 0, 0, 16, 0);

    // draw chevron in probe color
    c.strokeStyle = probe_colors_rgb[this.properties["color"]];
    if (c.strokeStyle != undefined) {
      c.beginPath();
      this.moveTo(c, 6, -3);
      this.lineTo(c, 10, 0);
      this.lineTo(c, 6, 3);
      c.stroke();
    }
  };

  Ammeter.prototype.clone = function (x, y) {
    return new Ammeter(x, y, this.rotation, this.properties["color"], this.properties["offset"]);
  };

  // share code with voltage probe
  Ammeter.prototype.edit_properties = Probe.prototype.edit_properties;

  Ammeter.prototype.label = function () {
    var name = this.properties["name"];
    var label = "I(" + (name ? name : "_" + this.properties["_json_"]) + ")";
    return label;
  };

  // display current for DC analysis
  Ammeter.prototype.display_current = function (c, vmap) {
    var label = this.label();
    var v = vmap[label];
    if (v != undefined) {
      var i = engineering_notation(v, 2) + "A";
      this.draw_text(c, i, 8, -5, 7, annotation_size, annotation_style);

      // only display each current once
      delete vmap[label];
    }
  };

  // return [color, current_label, offset, type] for this probe
  Ammeter.prototype.probe_info = function () {
    var color = this.properties["color"];
    var offset = this.properties["offset"];
    if (offset == undefined || offset == "") offset = "0";
    return [color, this.label(), offset, "current"];
  };

  ////////////////////////////////////////////////////////////////////////////////
  //
  //  Resistor
  //
  ////////////////////////////////////////////////////////////////////////////////

  function Resistor(x, y, rotation, name, r) {
    Component.call(this, "r", x, y, rotation);
    this.properties["name"] = name;
    this.properties["r"] = r ? r : "1";
    this.add_connection(0, 0);
    this.add_connection(0, 48);
    this.bounding_box = [-5, 0, 5, 48];
    this.update_coords();
  }
  Resistor.prototype = new Component();
  Resistor.prototype.constructor = Resistor;

  Resistor.prototype.toString = function () {
    return edx.StringUtils.interpolate("<Resistor {r} ({x},{y})>", {
      r: this.properties["r"],
      x: this.x,
      y: this.y,
    });
  };

  Resistor.prototype.draw = function (c) {
    Component.prototype.draw.call(this, c); // give superclass a shot
    this.draw_line(c, 0, 0, 0, 12);
    this.draw_line(c, 0, 12, 4, 14);
    this.draw_line(c, 4, 14, -4, 18);
    this.draw_line(c, -4, 18, 4, 22);
    this.draw_line(c, 4, 22, -4, 26);
    this.draw_line(c, -4, 26, 4, 30);
    this.draw_line(c, 4, 30, -4, 34);
    this.draw_line(c, -4, 34, 0, 36);
    this.draw_line(c, 0, 36, 0, 48);
    if (this.properties["r"]) this.draw_text(c, this.properties["r"] + "\u03A9", 5, 24, 3, property_size);
    if (this.properties["name"]) this.draw_text(c, this.properties["name"], -5, 24, 5, property_size);
  };

  Resistor.prototype.clone = function (x, y) {
    return new Resistor(x, y, this.rotation, this.properties["name"], this.properties["r"]);
  };

  ////////////////////////////////////////////////////////////////////////////////
  //
  //  Capacitor
  //
  ////////////////////////////////////////////////////////////////////////////////

  function Capacitor(x, y, rotation, name, c) {
    Component.call(this, "c", x, y, rotation);
    this.properties["name"] = name;
    this.properties["c"] = c ? c : "1p";
    this.add_connection(0, 0);
    this.add_connection(0, 48);
    this.bounding_box = [-8, 0, 8, 48];
    this.update_coords();
  }
  Capacitor.prototype = new Component();
  Capacitor.prototype.constructor = Capacitor;

  Capacitor.prototype.toString = function () {
    return edx.StringUtils.interpolate("<Capacitor {r} ({x},{y})>", {
      r: this.properties["r"],
      x: this.x,
      y: this.y,
    });
  };

  Capacitor.prototype.draw = function (c) {
    Component.prototype.draw.call(this, c); // give superclass a shot
    this.draw_line(c, 0, 0, 0, 22);
    this.draw_line(c, -8, 22, 8, 22);
    this.draw_line(c, -8, 26, 8, 26);
    this.draw_line(c, 0, 26, 0, 48);
    if (this.properties["c"]) this.draw_text(c, this.properties["c"] + "F", 9, 24, 3, property_size);
    if (this.properties["name"]) this.draw_text(c, this.properties["name"], -9, 24, 5, property_size);
  };

  Capacitor.prototype.clone = function (x, y) {
    return new Capacitor(x, y, this.rotation, this.properties["name"], this.properties["c"]);
  };

  ////////////////////////////////////////////////////////////////////////////////
  //
  //  Inductor
  //
  ////////////////////////////////////////////////////////////////////////////////

  function Inductor(x, y, rotation, name, l) {
    Component.call(this, "l", x, y, rotation);
    this.properties["name"] = name;
    this.properties["l"] = l ? l : "1n";
    this.add_connection(0, 0);
    this.add_connection(0, 48);
    this.bounding_box = [-4, 0, 5, 48];
    this.update_coords();
  }
  Inductor.prototype = new Component();
  Inductor.prototype.constructor = Inductor;

  Inductor.prototype.toString = function () {
    return edx.StringUtils.interpolate("<Inductor {l}, ({x},{y})>", {
      l: this.properties["l"],
      x: this.x,
      y: this.y,
    });
  };

  Inductor.prototype.draw = function (c) {
    Component.prototype.draw.call(this, c); // give superclass a shot
    this.draw_line(c, 0, 0, 0, 14);
    this.draw_arc(c, 0, 18, 4, (6 * Math.PI) / 4, (3 * Math.PI) / 4);
    this.draw_arc(c, 0, 24, 4, (5 * Math.PI) / 4, (3 * Math.PI) / 4);
    this.draw_arc(c, 0, 30, 4, (5 * Math.PI) / 4, (2 * Math.PI) / 4);
    this.draw_line(c, 0, 34, 0, 48);

    if (this.properties["l"]) this.draw_text(c, this.properties["l"] + "H", 6, 24, 3, property_size);
    if (this.properties["name"]) this.draw_text(c, this.properties["name"], -3, 24, 5, property_size);
  };

  Inductor.prototype.clone = function (x, y) {
    return new Inductor(x, y, this.rotation, this.properties["name"], this.properties["l"]);
  };

  ////////////////////////////////////////////////////////////////////////////////
  //
  //  Diode
  //
  ////////////////////////////////////////////////////////////////////////////////

  var diode_types = ["normal", "ideal"];

  function Diode(x, y, rotation, name, area, type) {
    Component.call(this, "d", x, y, rotation);
    this.properties["name"] = name;
    this.properties["area"] = area ? area : "1";
    this.properties["type"] = type ? type : "normal";
    this.add_connection(0, 0); // anode
    this.add_connection(0, 48); // cathode
    this.bounding_box = type == "ideal" ? [-12, 0, 12, 48] : [-8, 0, 8, 48];
    this.update_coords();
  }
  Diode.prototype = new Component();
  Diode.prototype.constructor = Diode;

  Diode.prototype.toString = function () {
    return edx.StringUtils.interpolate("<Diode {area} ({x},{y})>", {
      area: this.properties["area"],
      x: this.x,
      y: this.y,
    });
  };

  Diode.prototype.draw = function (c) {
    Component.prototype.draw.call(this, c); // give superclass a shot
    this.draw_line(c, 0, 0, 0, 16);
    this.draw_line(c, -8, 16, 8, 16);
    this.draw_line(c, -8, 16, 0, 32);
    this.draw_line(c, 8, 16, 0, 32);
    this.draw_line(c, -8, 32, 8, 32);
    this.draw_line(c, 0, 32, 0, 48);

    if (this.properties["type"] == "ideal") {
      // put a box around an ideal diode
      this.draw_line(c, -10, 12, 10, 12);
      this.draw_line(c, -10, 12, -10, 36);
      this.draw_line(c, 10, 12, 10, 36);
      this.draw_line(c, -10, 36, 10, 36);
    }

    if (this.properties["area"]) this.draw_text(c, this.properties["area"], 10, 24, 3, property_size);
    if (this.properties["name"]) this.draw_text(c, this.properties["name"], -10, 24, 5, property_size);
  };

  Diode.prototype.clone = function (x, y) {
    return new Diode(x, y, this.rotation, this.properties["name"], this.properties["area"], this.properties["type"]);
  };

  Diode.prototype.edit_properties = function (x, y) {
    if (inside(this.bbox, x, y)) {
      var fields = [];
      fields["name"] = build_input("text", 10, this.properties["name"]);
      fields["area"] = build_input("text", 10, this.properties["area"]);
      fields["type"] = build_select(diode_types, this.properties["type"]);

      var content = build_table(fields);
      content.fields = fields;
      content.component = this;

      this.sch.dialog("Edit Properties", content, function (content) {
        content.component.properties["name"] = content.fields["name"].value;
        content.component.properties["area"] = content.fields["area"].value;
        content.component.properties["type"] = diode_types[content.fields["type"].selectedIndex];
        content.component.sch.redraw_background();
      });
      return true;
    } else return false;
  };

  ////////////////////////////////////////////////////////////////////////////////
  //
  //  N-channel Mosfet
  //
  ////////////////////////////////////////////////////////////////////////////////

  function NFet(x, y, rotation, name, w_over_l) {
    Component.call(this, "n", x, y, rotation);
    this.properties["name"] = name;
    this.properties["W/L"] = w_over_l ? w_over_l : "2";
    this.add_connection(0, 0); // drain
    this.add_connection(-24, 24); // gate
    this.add_connection(0, 48); // source
    this.bounding_box = [-24, 0, 8, 48];
    this.update_coords();
  }
  NFet.prototype = new Component();
  NFet.prototype.constructor = NFet;

  NFet.prototype.toString = function () {
    return edx.StringUtils.interpolate("<NFet {W_L} ({x},{y})>", {
      W_L: this.properties["W/L"],
      x: this.x,
      y: this.y,
    });
  };

  NFet.prototype.draw = function (c) {
    Component.prototype.draw.call(this, c); // give superclass a shot
    this.draw_line(c, 0, 0, 0, 16);
    this.draw_line(c, -8, 16, 0, 16);
    this.draw_line(c, -8, 16, -8, 32);
    this.draw_line(c, -8, 32, 0, 32);
    this.draw_line(c, 0, 32, 0, 48);
    this.draw_line(c, -24, 24, -12, 24);
    this.draw_line(c, -12, 16, -12, 32);

    var dim = this.properties["W/L"];
    if (this.properties["name"]) {
      this.draw_text(c, this.properties["name"], 2, 22, 6, property_size);
      this.draw_text(c, dim, 2, 26, 0, property_size);
    } else this.draw_text(c, dim, 2, 24, 3, property_size);
  };

  NFet.prototype.clone = function (x, y) {
    return new NFet(x, y, this.rotation, this.properties["name"], this.properties["W/L"]);
  };

  ////////////////////////////////////////////////////////////////////////////////
  //
  //  P-channel Mosfet
  //
  ////////////////////////////////////////////////////////////////////////////////

  function PFet(x, y, rotation, name, w_over_l) {
    Component.call(this, "p", x, y, rotation);
    this.properties["name"] = name;
    this.properties["W/L"] = w_over_l ? w_over_l : "2";
    this.add_connection(0, 0); // drain
    this.add_connection(-24, 24); // gate
    this.add_connection(0, 48); // source
    this.bounding_box = [-24, 0, 8, 48];
    this.update_coords();
  }
  PFet.prototype = new Component();
  PFet.prototype.constructor = PFet;

  PFet.prototype.toString = function () {
    return edx.StringUtils.interpolate("<PFet {W_L} ({x},{y})>", {
      W_L: this.properties["W/L"],
      x: this.x,
      y: this.y,
    });
  };

  PFet.prototype.draw = function (c) {
    Component.prototype.draw.call(this, c); // give superclass a shot
    this.draw_line(c, 0, 0, 0, 16);
    this.draw_line(c, -8, 16, 0, 16);
    this.draw_line(c, -8, 16, -8, 32);
    this.draw_line(c, -8, 32, 0, 32);
    this.draw_line(c, 0, 32, 0, 48);
    this.draw_line(c, -24, 24, -16, 24);
    this.draw_circle(c, -14, 24, 2, false);
    this.draw_line(c, -12, 16, -12, 32);

    var dim = this.properties["W/L"];
    if (this.properties["name"]) {
      this.draw_text(c, this.properties["name"], 2, 22, 6, property_size);
      this.draw_text(c, dim, 2, 26, 0, property_size);
    } else this.draw_text(c, dim, 2, 24, 3, property_size);
  };

  PFet.prototype.clone = function (x, y) {
    return new PFet(x, y, this.rotation, this.properties["name"], this.properties["W/L"]);
  };

  ////////////////////////////////////////////////////////////////////////////////
  //
  //  Op Amp
  //
  ////////////////////////////////////////////////////////////////////////////////

  function OpAmp(x, y, rotation, name, A) {
    Component.call(this, "o", x, y, rotation);
    this.properties["name"] = name;
    this.properties["A"] = A ? A : "30000";
    this.add_connection(0, 0); // +
    this.add_connection(0, 16); // -
    this.add_connection(48, 8); // output
    this.add_connection(24, 32); // ground
    this.bounding_box = [0, -8, 48, 32];
    this.update_coords();
  }
  OpAmp.prototype = new Component();
  OpAmp.prototype.constructor = OpAmp;

  OpAmp.prototype.toString = function () {
    return edx.StringUtils.interpolate("<OpAmp{A} ({x},{y})>", {
      A: this.properties["A"],
      x: this.x,
      y: this.y,
    });
  };

  OpAmp.prototype.draw = function (c) {
    Component.prototype.draw.call(this, c); // give superclass a shot
    // triangle
    this.draw_line(c, 8, -8, 8, 24);
    this.draw_line(c, 8, -8, 40, 8);
    this.draw_line(c, 8, 24, 40, 8);
    // inputs and output
    this.draw_line(c, 0, 0, 8, 0);
    this.draw_line(c, 0, 16, 8, 16);
    this.draw_text(c, "gnd", 37, 18, property_size);
    this.draw_line(c, 40, 8, 48, 8);
    this.draw_line(c, 24, 16, 24, 32);
    // + and -
    this.draw_line(c, 10, 0, 16, 0);
    this.draw_line(c, 13, -3, 13, 3);
    this.draw_line(c, 10, 16, 16, 16);

    if (this.properties["name"]) this.draw_text(c, this.properties["name"], 32, 16, 0, property_size);
  };

  OpAmp.prototype.clone = function (x, y) {
    return new OpAmp(x, y, this.rotation, this.properties["name"], this.properties["A"]);
  };

  ////////////////////////////////////////////////////////////////////////////////
  //
  //  Source
  //
  ////////////////////////////////////////////////////////////////////////////////

  function Source(x, y, rotation, name, type, value) {
    Component.call(this, type, x, y, rotation);
    this.properties["name"] = name;
    if (value == undefined) value = "dc(1)";
    this.properties["value"] = value;
    this.add_connection(0, 0);
    this.add_connection(0, 48);
    this.bounding_box = [-12, 0, 12, 48];
    this.update_coords();
    this.content = document.createElement("div"); // used by edit_properties
  }
  Source.prototype = new Component();
  Source.prototype.constructor = Source;

  Source.prototype.toString = function () {
    return edx.StringUtils.interpolate("<{type}source {params} ({x},{y})>", {
      type: this.type,
      params: this.properties["params"],
      x: this.x,
      y: this.y,
    });
  };

  Source.prototype.draw = function (c) {
    Component.prototype.draw.call(this, c); // give superclass a shot
    this.draw_line(c, 0, 0, 0, 12);
    this.draw_circle(c, 0, 24, 12, false);
    this.draw_line(c, 0, 36, 0, 48);

    if (this.type == "v") {
      // voltage source
      // draw + and -
      this.draw_line(c, 0, 15, 0, 21);
      this.draw_line(c, -3, 18, 3, 18);
      this.draw_line(c, -3, 30, 3, 30);
    } else if (this.type == "i") {
      // current source
      // draw arrow: pos to neg
      this.draw_line(c, 0, 15, 0, 32);
      this.draw_line(c, -3, 26, 0, 32);
      this.draw_line(c, 3, 26, 0, 32);
    }

    if (this.properties["name"]) this.draw_text(c, this.properties["name"], -13, 24, 5, property_size);
    if (this.properties["value"]) this.draw_text(c, this.properties["value"], 13, 24, 3, property_size);
  };

  // map source function name to labels for each source parameter
  var source_functions = {
    dc: ["DC value"],

    impulse: ["Height", "Width (secs)"],

    step: ["Initial value", "Plateau value", "Delay until step (secs)", "Rise time (secs)"],

    square: ["Initial value", "Plateau value", "Frequency (Hz)", "Duty cycle (%)"],

    triangle: ["Initial value", "Plateau value", "Frequency (Hz)"],

    pwl: ["Comma-separated list of alternating times and values"],

    pwl_repeating: ["Comma-separated list of alternating times and values"],

    pulse: [
      "Initial value",
      "Plateau value",
      "Delay until pulse (secs)",
      "Time for first transition (secs)",
      "Time for second transition (secs)",
      "Pulse width (secs)",
      "Period (secs)",
    ],

    sin: ["Offset value", "Amplitude", "Frequency (Hz)", "Delay until sin starts (secs)", "Phase offset (degrees)"],
  };

  // build property editor div
  Source.prototype.build_content = function (src) {
    // make an <input> widget for each property
    var fields = [];
    fields["name"] = build_input("text", 10, this.properties["name"]);

    if (src == undefined) {
      fields["value"] = this.properties["value"];
    } else {
      // fancy version: add select tag for source type
      var src_types = [];
      for (var t in source_functions) src_types.push(t);
      var type_select = build_select(src_types, src.fun);
      type_select.component = this;
      type_select.addEventListener("change", source_type_changed, false);
      fields["type"] = type_select;

      if (src.fun == "pwl" || src.run == "pwl_repeating") {
        var v = "";
        var first = true;
        for (var i = 0; i < src.args.length; i++) {
          if (first) first = false;
          else v += ",";
          v += engineering_notation(src.args[i], 3);
          if (i % 2 == 0) v += "s";
        }
        fields[source_functions[src.fun][0]] = build_input("text", 30, v);
      } else {
        // followed separate input tag for each parameter
        var labels = source_functions[src.fun];
        for (var i = 0; i < labels.length; i++) {
          var v = engineering_notation(src.args[i], 3);
          fields[labels[i]] = build_input("text", 10, v);
        }
      }
    }

    var div = this.content;
    if (div.hasChildNodes()) div.removeChild(div.firstChild); // remove table of input fields
    div.appendChild(build_table(fields));
    div.fields = fields;
    div.component = this;
    return div;
  };

  function source_type_changed(event) {
    if (!event) event = window.event;
    var select = window.event ? event.srcElement : event.target;

    // see where to get source parameters from
    var type = select.options[select.selectedIndex].value;
    var src = undefined;
    if (this.src != undefined && type == this.src.fun) src = this.src;
    else if (typeof cktsim != "undefined") src = cktsim.parse_source(type + "()");

    select.component.build_content(src);
  }

  Source.prototype.edit_properties = function (x, y) {
    if (this.near(x, y)) {
      this.src = undefined;
      if (typeof cktsim != "undefined") this.src = cktsim.parse_source(this.properties["value"]);
      var content = this.build_content(this.src);

      this.sch.dialog("Edit Properties", content, function (content) {
        var c = content.component;
        var fields = content.fields;

        var first = true;
        var value = "";
        for (var label in fields) {
          if (label == "name") c.properties["name"] = fields["name"].value;
          else if (label == "value") {
            // if unknown source type
            value = fields["value"].value;
            c.sch.redraw_background();
            return;
          } else if (label == "type") {
            var select = fields["type"];
            value = select.options[select.selectedIndex].value + "(";
          } else {
            if (first) first = false;
            else value += ",";
            value += fields[label].value;
          }
        }
        c.properties["value"] = value + ")";
        c.sch.redraw_background();
      });
      return true;
    } else return false;
  };

  function VSource(x, y, rotation, name, value) {
    Source.call(this, x, y, rotation, name, "v", value);
    this.type = "v";
  }
  VSource.prototype = new Component();
  VSource.prototype.constructor = VSource;
  VSource.prototype.toString = Source.prototype.toString;
  VSource.prototype.draw = Source.prototype.draw;
  VSource.prototype.clone = Source.prototype.clone;
  VSource.prototype.build_content = Source.prototype.build_content;
  VSource.prototype.edit_properties = Source.prototype.edit_properties;

  // display current for DC analysis
  VSource.prototype.display_current = function (c, vmap) {
    var name = this.properties["name"];
    var label = "I(" + (name ? name : "_" + this.properties["_json_"]) + ")";
    var v = vmap[label];
    if (v != undefined) {
      // first draw some solid blocks in the background
      c.globalAlpha = 0.5;
      this.draw_text(c, "\u2588\u2588\u2588", -8, 8, 4, annotation_size, element_style);
      c.globalAlpha = 1.0;

      // display the element current
      var i = engineering_notation(v, 2) + "A";
      this.draw_text(c, i, -3, 5, 5, annotation_size, annotation_style);
      // draw arrow for current
      this.draw_line(c, -3, 4, 0, 8);
      this.draw_line(c, 3, 4, 0, 8);
      // only display each current once
      delete vmap[label];
    }
  };

  VSource.prototype.clone = function (x, y) {
    return new VSource(x, y, this.rotation, this.properties["name"], this.properties["value"]);
  };

  function ISource(x, y, rotation, name, value) {
    Source.call(this, x, y, rotation, name, "i", value);
    this.type = "i";
  }
  ISource.prototype = new Component();
  ISource.prototype.constructor = ISource;
  ISource.prototype.toString = Source.prototype.toString;
  ISource.prototype.draw = Source.prototype.draw;
  ISource.prototype.clone = Source.prototype.clone;
  ISource.prototype.build_content = Source.prototype.build_content;
  ISource.prototype.edit_properties = Source.prototype.edit_properties;

  ISource.prototype.clone = function (x, y) {
    return new ISource(x, y, this.rotation, this.properties["name"], this.properties["value"]);
  };

  ///////////////////////////////////////////////////////////////////////////////
  //
  //  JQuery slider support for setting a component value
  //
  ///////////////////////////////////////////////////////////////////////////////

  function component_slider(event, ui) {
    var sname = $(this).slider("option", "schematic");

    // set value of specified component
    var cname = $(this).slider("option", "component");
    var pname = $(this).slider("option", "property");
    var suffix = $(this).slider("option", "suffix");
    if (typeof suffix != "string") suffix = "";

    var v = ui.value;
    $(this).slider("value", v); // move slider's indicator

    var choices = $(this).slider("option", "choices");
    if (choices instanceof Array) v = choices[v];

    // selector may match several schematics
    $("." + sname).each(function (index, element) {
      element.schematic.set_property(cname, pname, v.toString() + suffix);
    });

    // perform requested analysis
    var analysis = $(this).slider("option", "analysis");
    if (analysis == "dc")
      $("." + sname).each(function (index, element) {
        element.schematic.dc_analysis();
      });

    return false;
  }

  ///////////////////////////////////////////////////////////////////////////////
  //
  //  Module definition
  //
  ///////////////////////////////////////////////////////////////////////////////

  var module = {
    Schematic: Schematic,
    component_slider: component_slider,
  };
  return module;
})();

}.call(window));

/***/ },

/***/ "underscore"
/*!********************!*\
  !*** external "_" ***!
  \********************/
(module) {

"use strict";
module.exports = window["_"];

/***/ },

/***/ "jquery"
/*!*************************!*\
  !*** external "jQuery" ***!
  \*************************/
(module) {

"use strict";
module.exports = window["jQuery"];

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Check if module exists (development only)
/******/ 		if (__webpack_modules__[moduleId] === undefined) {
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/amd define */
/******/ 	(() => {
/******/ 		__webpack_require__.amdD = function () {
/******/ 			throw new Error('define cannot be used indirect');
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	__webpack_require__("./static/js/xmodule.js");
/******/ 	__webpack_require__("./static/js/javascript_loader.js");
/******/ 	__webpack_require__("./static/js/display.js");
/******/ 	__webpack_require__("./static/js/collapsible.js");
/******/ 	__webpack_require__("./static/js/imageinput.js");
/******/ 	var __webpack_exports__ = __webpack_require__("./static/js/schematic.js");
/******/ 	var __webpack_export_target__ = window;
/******/ 	for(var __webpack_i__ in __webpack_exports__) __webpack_export_target__[__webpack_i__] = __webpack_exports__[__webpack_i__];
/******/ 	if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ 	
/******/ })()
;
//# sourceMappingURL=ProblemBlockDisplay.js.map