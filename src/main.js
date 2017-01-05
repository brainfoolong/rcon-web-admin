"use strict";
/**
 * Main script
 */
Error.stackTraceLimit = Infinity;

require(__dirname + "/routes");
require(__dirname + "/rconserver");
require(__dirname + "/websocketmgr");
var Widget = require(__dirname + "/widget");
var steamapi = require(__dirname + "/steamapi");
var config = require(__dirname + "/config");

if (config.autoWidgetUpdate) {
    // install/update all default widgets on startup
    for (var i = 0; i < Widget.defaultWidgets.length; i++) {
        var repository = Widget.defaultWidgets[i];
        Widget.install(repository);
    }
}