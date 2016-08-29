/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2012 Google Inc.
 * https://blockly.googlecode.com/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Utility methods.
 * These methods are not specific to Blockly.Cake, and could be factored out if
 * a JavaScript framework such as Closure were used.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.Cake.utils');


/**
 * Add a CSS class to a element.
 * Similar to Closure's goog.dom.classes.add, except it handles SVG elements.
 * @param {!Element} element DOM element to add class to.
 * @param {string} className Name of class to add.
 * @private
 */
Blockly.Cake.addClass_ = function(element, className) {
  var classes = element.getAttribute('class') || '';
  if ((' ' + classes + ' ').indexOf(' ' + className + ' ') == -1) {
    if (classes) {
      classes += ' ';
    }
    element.setAttribute('class', classes + className);
  }
};

/**
 * Remove a CSS class from a element.
 * Similar to Closure's goog.dom.classes.remove, except it handles SVG elements.
 * @param {!Element} element DOM element to remove class from.
 * @param {string} className Name of class to remove.
 * @private
 */
Blockly.Cake.removeClass_ = function(element, className) {
  var classes = element.getAttribute('class');
  if ((' ' + classes + ' ').indexOf(' ' + className + ' ') != -1) {
    var classList = classes.split(/\s+/);
    for (var i = 0; i < classList.length; i++) {
      if (!classList[i] || classList[i] == className) {
        classList.splice(i, 1);
        i--;
      }
    }
    if (classList.length) {
      element.setAttribute('class', classList.join(' '));
    } else {
      element.removeAttribute('class');
    }
  }
};

/**
 * Bind an event to a function call.
 * @param {!Node} node Node upon which to listen.
 * @param {string} name Event name to listen to (e.g. 'mousedown').
 * @param {Object} thisObject The value of 'this' in the function.
 * @param {!Function} func Function to call when event is triggered.
 * @return {!Array.<!Array>} Opaque data that can be passed to unbindEvent_.
 * @private
 */
Blockly.Cake.bindEvent_ = function(node, name, thisObject, func) {
  var wrapFunc = function(e) {
    func.apply(thisObject, arguments);
  };
  node.addEventListener(name, wrapFunc, false);
  var bindData = [[node, name, wrapFunc]];
  // Add equivalent touch event.
  if (name in Blockly.Cake.bindEvent_.TOUCH_MAP) {
    wrapFunc = function(e) {
      // Punt on multitouch events.
      if (e.changedTouches.length == 1) {
        // Map the touch event's properties to the event.
        var touchPoint = e.changedTouches[0];
        e.clientX = touchPoint.clientX;
        e.clientY = touchPoint.clientY;
      }
      func.apply(thisObject, arguments);
      // Stop the browser from scrolling/zooming the page
      e.preventDefault();
    };
    node.addEventListener(Blockly.Cake.bindEvent_.TOUCH_MAP[name],
                             wrapFunc, false);
    bindData.push([node, Blockly.Cake.bindEvent_.TOUCH_MAP[name], wrapFunc]);
  }
  return bindData;
};

/**
 * The TOUCH_MAP lookup dictionary specifies additional touch events to fire,
 * in conjunction with mouse events.
 * @type {Object}
 */
Blockly.Cake.bindEvent_.TOUCH_MAP = {};
if ('ontouchstart' in document.documentElement) {
  Blockly.Cake.bindEvent_.TOUCH_MAP = {
    'mousedown': 'touchstart',
    'mousemove': 'touchmove',
    'mouseup': 'touchend'
  };
}

/**
 * Unbind one or more events event from a function call.
 * @param {!Array.<!Array>} bindData Opaque data from bindEvent_.  This list is
 *     emptied during the course of calling this function.
 * @return {!Function} The function call.
 * @private
 */
Blockly.Cake.unbindEvent_ = function(bindData) {
  while (bindData.length) {
    var bindDatum = bindData.pop();
    var node = bindDatum[0];
    var name = bindDatum[1];
    var func = bindDatum[2];
    node.removeEventListener(name, func, false);
  }
  return func;
};

/**
 * Fire a synthetic event synchronously.
 * @param {!EventTarget} node The event's target node.
 * @param {string} eventName Name of event (e.g. 'click').
 */
Blockly.Cake.fireUiEventNow = function(node, eventName) {
  var doc = document;
  if (doc.createEvent) {
    // W3
    var evt = doc.createEvent('UIEvents');
    evt.initEvent(eventName, true, true);  // event type, bubbling, cancelable
    node.dispatchEvent(evt);
  } else if (doc.createEventObject) {
    // MSIE
    var evt = doc.createEventObject();
    node.fireEvent('on' + eventName, evt);
  } else {
    throw 'FireEvent: No event creation mechanism.';
  }
};

/**
 * Fire a synthetic event asynchronously.
 * @param {!EventTarget} node The event's target node.
 * @param {string} eventName Name of event (e.g. 'click').
 */
Blockly.Cake.fireUiEvent = function(node, eventName) {
  var fire = function() {
    Blockly.Cake.fireUiEventNow(node, eventName);
  }
  setTimeout(fire, 0);
};

/**
 * Don't do anything for this event, just halt propagation.
 * @param {!Event} e An event.
 */
Blockly.Cake.noEvent = function(e) {
  // This event has been handled.  No need to bubble up to the document.
  e.preventDefault();
  e.stopPropagation();
};

/**
 * Return the coordinates of the top-left corner of this element relative to
 * its parent.
 * @param {!Element} element Element to find the coordinates of.
 * @return {!Object} Object with .x and .y properties.
 * @private
 */
Blockly.Cake.getRelativeXY_ = function(element) {
  var xy = {x: 0, y: 0};
  // First, check for x and y attributes.
  var x = element.getAttribute('x');
  if (x) {
    xy.x = parseInt(x, 10);
  }
  var y = element.getAttribute('y');
  if (y) {
    xy.y = parseInt(y, 10);
  }
  // Second, check for transform="translate(...)" attribute.
  var transform = element.getAttribute('transform');
  // Note that Firefox and IE (9,10) return 'translate(12)' instead of
  // 'translate(12, 0)'.
  // Note that IE (9,10) returns 'translate(16 8)' instead of
  // 'translate(16, 8)'.
  var r = transform &&
          transform.match(/translate\(\s*([-\d.]+)([ ,]\s*([-\d.]+)\s*\))?/);
  if (r) {
    xy.x += parseInt(r[1], 10);
    if (r[3]) {
      xy.y += parseInt(r[3], 10);
    }
  }
  return xy;
};

/**
 * Return the absolute coordinates of the top-left corner of this element.
 * The origin (0,0) is the top-left corner of the Blockly.Cake svg.
 * @param {!Element} element Element to find the coordinates of.
 * @return {!Object} Object with .x and .y properties.
 * @private
 */
Blockly.Cake.getSvgXY_ = function(element) {
  var x = 0;
  var y = 0;
  do {
    // Loop through this block and every parent.
    var xy = Blockly.Cake.getRelativeXY_(element);
    x += xy.x;
    y += xy.y;
    element = element.parentNode;
  } while (element && element != Blockly.Cake.svg);
  return {x: x, y: y};
};

/**
 * Return the absolute coordinates of the top-left corner of this element.
 * The origin (0,0) is the top-left corner of the page body.
 * @param {!Element} element Element to find the coordinates of.
 * @return {!Object} Object with .x and .y properties.
 * @private
 */
Blockly.Cake.getAbsoluteXY_ = function(element) {
  var xy = Blockly.Cake.getSvgXY_(element);
  return Blockly.Cake.convertCoordinates(xy.x, xy.y, false);
};

/**
 * Helper method for creating SVG elements.
 * @param {string} name Element's tag name.
 * @param {!Object} attrs Dictionary of attribute names and values.
 * @param {Element=} opt_parent Optional parent on which to append the element.
 * @return {!SVGElement} Newly created SVG element.
 */
Blockly.Cake.createSvgElement = function(name, attrs, opt_parent) {
  var e = /** @type {!SVGElement} */ (
      document.createElementNS(Blockly.Cake.SVG_NS, name));
  for (var key in attrs) {
    e.setAttribute(key, attrs[key]);
  }
  // IE defines a unique attribute "runtimeStyle", it is NOT applied to
  // elements created with createElementNS. However, Closure checks for IE
  // and assumes the presence of the attribute and crashes.
  if (document.body.runtimeStyle) {  // Indicates presence of IE-only attr.
    e.runtimeStyle = e.currentStyle = e.style;
  }
  if (opt_parent) {
    opt_parent.appendChild(e);
  }
  return e;
};

/**
 * Is this event a right-click?
 * @param {!Event} e Mouse event.
 * @return {boolean} True if right-click.
 */
Blockly.Cake.isRightButton = function(e) {
  // Control-clicking in WebKit on Mac OS X fails to change button to 2.
  return e.button == 2 || e.ctrlKey;
};

/**
 * Convert between HTML coordinates and SVG coordinates.
 * @param {number} x X input coordinate.
 * @param {number} y Y input coordinate.
 * @param {boolean} toSvg True to convert to SVG coordinates.
 *     False to convert to mouse/HTML coordinates.
 * @return {!Object} Object with x and y properties in output coordinates.
 */
Blockly.Cake.convertCoordinates = function(x, y, toSvg) {
  if (toSvg) {
    x -= window.scrollX || window.pageXOffset;
    y -= window.scrollY || window.pageYOffset;
  }
  var svgPoint = Blockly.Cake.svg.createSVGPoint();
  svgPoint.x = x;
  svgPoint.y = y;
  var matrix = Blockly.Cake.svg.getScreenCTM();
  if (toSvg) {
    matrix = matrix.inverse();
  }
  var xy = svgPoint.matrixTransform(matrix);
  if (!toSvg) {
    xy.x += window.scrollX || window.pageXOffset;
    xy.y += window.scrollY || window.pageYOffset;
  }
  return xy;
};

/**
 * Return the converted coordinates of the given mouse event.
 * The origin (0,0) is the top-left corner of the Blockly.Cake svg.
 * @param {!Event} e Mouse event.
 * @return {!Object} Object with .x and .y properties.
 */
Blockly.Cake.mouseToSvg = function(e) {
  var scrollX = window.scrollX || window.pageXOffset;
  var scrollY = window.scrollY || window.pageYOffset;
  return Blockly.Cake.convertCoordinates(e.clientX + scrollX,
                                    e.clientY + scrollY, true);
};

/**
 * Given an array of strings, return the length of the shortest one.
 * @param {!Array.<string>} array Array of strings.
 * @return {number} Length of shortest string.
 */
Blockly.Cake.shortestStringLength = function(array) {
  if (!array.length) {
    return 0;
  }
  var len = array[0].length;
  for (var i = 1; i < array.length; i++) {
    len = Math.min(len, array[i].length);
  }
  return len;
};

/**
 * Given an array of strings, return the length of the common prefix.
 * Words may not be split.  Any space after a word is included in the length.
 * @param {!Array.<string>} array Array of strings.
 * @param {?number} opt_shortest Length of shortest string.
 * @return {number} Length of common prefix.
 */
Blockly.Cake.commonWordPrefix = function(array, opt_shortest) {
  if (!array.length) {
    return 0;
  } else if (array.length == 1) {
    return array[0].length;
  }
  var wordPrefix = 0;
  var max = opt_shortest || Blockly.Cake.shortestStringLength(array);
  for (var len = 0; len < max; len++) {
    var letter = array[0][len];
    for (var i = 1; i < array.length; i++) {
      if (letter != array[i][len]) {
        return wordPrefix;
      }
    }
    if (letter == ' ') {
      wordPrefix = len + 1;
    }
  }
  for (var i = 1; i < array.length; i++) {
    var letter = array[i][len];
    if (letter && letter != ' ') {
      return wordPrefix;
    }
  }
  return max;
};

/**
 * Given an array of strings, return the length of the common suffix.
 * Words may not be split.  Any space after a word is included in the length.
 * @param {!Array.<string>} array Array of strings.
 * @param {?number} opt_shortest Length of shortest string.
 * @return {number} Length of common suffix.
 */
Blockly.Cake.commonWordSuffix = function(array, opt_shortest) {
  if (!array.length) {
    return 0;
  } else if (array.length == 1) {
    return array[0].length;
  }
  var wordPrefix = 0;
  var max = opt_shortest || Blockly.Cake.shortestStringLength(array);
  for (var len = 0; len < max; len++) {
    var letter = array[0].substr(-len - 1, 1);
    for (var i = 1; i < array.length; i++) {
      if (letter != array[i].substr(-len - 1, 1)) {
        return wordPrefix;
      }
    }
    if (letter == ' ') {
      wordPrefix = len + 1;
    }
  }
  for (var i = 1; i < array.length; i++) {
    var letter = array[i].charAt(array[i].length - len - 1);
    if (letter && letter != ' ') {
      return wordPrefix;
    }
  }
  return max;
};

/**
 * Is the given string a number (includes negative and decimals).
 * @param {string} str Input string.
 * @return {boolean} True if number, false otherwise.
 */
Blockly.Cake.isNumber = function(str) {
  return !!str.match(/^\s*-?\d+(\.\d+)?\s*$/);
};
