"use strict";

var fs = require("fs");
var db = require(__dirname + "/db");

/**
 * A widget
 * @param {string} name
 * @constructor
 */
function Widget(name) {
    /** @type {Widget} */

    /**
     * The widget internal name
     * @type {string}
     */
    this.name = name;
    /**
     * The widget manifest data
     * @type {{}}
     */
    this.manifest = {};

    /**
     * On rcon server has successfully connected and authenticated
     * @param {RconServer} server
     */
    this.onServerConnected = function (server) {
        console.error("Please override 'onServerConnected' function of widget " + this.name);
    };

    /**
     * On widget update cycle - Fired every 10 seconds for each server
     * @param {RconServer} server
     */
    this.onUpdate = function (server) {
        console.error("Please override 'onUpdate' function of widget " + this.name);
    };

    /**
     * On frontend message
     * @param {RconServer} server
     * @param {WebSocketUser} user
     * @param {*} messageData Any message data received from frontend
     * @param {function} callback Pass an object as message data response for the frontend
     */
    this.onFrontendMessage = function (server, user, messageData, callback) {
        console.error("Please override 'onFrontendMessage' function of widget " + this.name);
    };
}

/**
 * All widgets
 * @type {{string: Widget}}
 */
Widget.widgets = {};

/**
 * Get a list of all widget names
 * @return {string[]}
 */
Widget.getAllWidgetNames = function () {
    var dir = __dirname + "/../public/widgets";
    return fs.readdirSync(dir);
};

/**
 * Get a list of all widget instances - Try to load all not loaded instances
 * @return {{string: Widget}}
 */
Widget.getAllWidgets = function () {
    var names = Widget.getAllWidgetNames();
    var widgets = {};
    for (var i = 0; i < names.length; i++) {
        var name = names[i];
        var widget = Widget.get(name);
        if (widget) {
            widgets[name] = widget;
        }
    }
    return widgets;
};

/**
 * Call a specific method for all widgets if the widget is active/enabled in the server's widget list
 * Pass all remaining arguments directly to the call
 * @param {string} method
 * @param {RconServer} server
 */
Widget.callMethodForAllWidgetsIfActive = function (method, server) {
    try {
        var widgets = Widget.getAllWidgets();
        var wdb = db.get("widgets", "server_" + server.id).get("list");
        for (var widgetsIndex in widgets) {
            if (widgets.hasOwnProperty(widgetsIndex)) {
                var widgetsRow = widgets[widgetsIndex];
                var found = wdb.find({
                    "name": widgetsRow.name
                });
                if (found.value()) {
                    widgetsRow[method].apply(widgetsRow, Array.prototype.slice.call(arguments, 1));
                }
            }
        }
    } catch (e) {
        console.error(e.stack);
    }
};

/**
 * Call a specific method for all widgets
 * Pass all remaining arguments directly to the call
 * @param {string} method
 */
Widget.callMethodForAllWidgets = function (method) {
    try {
        var widgets = Widget.getAllWidgets();
        for (var widgetsIndex in widgets) {
            if (widgets.hasOwnProperty(widgetsIndex)) {
                var widgetsRow = widgets[widgetsIndex];
                widgetsRow[method].apply(widgetsRow, Array.prototype.slice.call(arguments, 1));
            }
        }
    } catch (e) {
        console.error(e.stack);
    }
};

/**
 * Get a single widget by name
 * @param {string} name
 * @return {Widget|null}
 */
Widget.get = function (name) {
    if (typeof Widget.widgets[name] == "undefined") {
        Widget.widgets[name] = null;
        var dir = __dirname + "/../public/widgets/" + name;
        var widget = require(dir + "/backend");
        if (widget) {
            widget.manifest = require(dir + "/manifest.json");
            widget.name = name;
            Widget.widgets[name] = widget;
        }
    }
    return Widget.widgets[name];
};

/**
 * Call onUpdate methods for all active widgets for all connected servers
 */
Widget.updateAllActive = function () {
    var RconServer = require(__dirname + "/rconserver");
    for (var serverIndex in RconServer.instances) {
        if (RconServer.instances.hasOwnProperty(serverIndex)) {
            var server = RconServer.instances[serverIndex];
            Widget.callMethodForAllWidgetsIfActive("onUpdate", server);
        }
    }
    // send a ping to the frontend for all user's that have a server currently opened on the dashboard
    var WebSocketUser = require(__dirname + "/websocketuser");
    var users = WebSocketUser.instances;
    for (var usersIndex in users) {
        if (users.hasOwnProperty(usersIndex)) {
            var usersRow = users[usersIndex];
            if (usersRow.server) {
                usersRow.send("widget-update-done", {"server": usersRow.server.id});
            }
        }
    }
};

// each 10 seconds call the updates for each active widget
setInterval(Widget.updateAllActive, 10000);
// and call 1 second after server startup
setTimeout(Widget.updateAllActive, 1000);

module.exports = Widget;