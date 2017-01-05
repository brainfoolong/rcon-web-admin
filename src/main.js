"use strict";
/**
 * Main script
 */
Error.stackTraceLimit = Infinity;

require(__dirname + "/routes");

var RconServer = require(__dirname + "/rconserver");
var WebSocketMgr = require(__dirname + "/websocketmgr");
var Widget = require(__dirname + "/widget");
var steamapi = require(__dirname + "/steamapi");

// install/update all default widgets on startup
for (var i = 0; i < Widget.defaultWidgets.length; i++) {
    var repository = Widget[i];

}