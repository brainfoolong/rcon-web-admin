"use strict";

/**
 * Widget Management
 */
var Widget = {};

/**
 * All registeres widgets
 * @type {[]}
 */
Widget.widgets = [];

/**
 * Register a widget handler
 * @param {function} handler
 */
Widget.register = function (handler) {
    Widget.widgets.push(handler);
};