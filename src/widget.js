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
    var self = this;
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
     * The widgets options cached
     * @type {{}}
     */
    this.optionsCache = {};
    /**
     * The widgets storage cached
     * @type {{}}
     */
    this.storageCache = {};

    /**
     * On lowdb instance for this widget for a given server
     * @param {RconServer} server
     * @returns {LoDashWrapper}
     */
    this.getDbEntry = function (server) {
        var wdb = db.get("widgets", "server_" + server.id).get("list");
        var found = wdb.find({
            "name": this.name
        });
        if (found.size()) {
            return found;
        }
        return null;
    };

    /**
     * The widget storage
     * @type {{}}
     */
    this.storage = {};

    /**
     * Get the storage object for given server
     * @param {RconServer} server
     * @return {{}}
     */
    this.storage.getObject = function (server) {
        if (typeof self.storageCache[server.id] == "undefined") {
            self.storageCache[server.id] = {};
            var entry = self.getDbEntry(server);
            if (entry) {
                self.storageCache[server.id] = entry.get("storage").cloneDeep().value();
            }
        }
        return self.storageCache[server.id];
    };

    /**
     * Set a value in the widget storage
     * @param {RconServer} server
     * @param {string} key
     * @param {*} value
     */
    this.storage.set = function (server, key, value) {
        var data = this.getObject(server);
        data[key] = value;
        var entry = self.getDbEntry(server);
        if (entry) {
            entry.set("storage", data).value();
        }
    };

    /**
     * Get a value from the widget storage
     * @param {RconServer} server
     * @param {string} key
     * @returns {*|null} Null if not found
     */
    this.storage.get = function (server, key) {
        return this.getObject(server)[key] || null;
    };

    /**
     * The widget options
     * @type {{}}
     */
    this.options = {};

    /**
     * Get the options object for given server
     * @param {RconServer} server
     * @return {{}}
     */
    this.options.getObject = function (server) {
        if (typeof self.optionsCache[server.id] == "undefined") {
            self.optionsCache[server.id] = null;
            var entry = self.getDbEntry(server);
            if (entry) {
                self.optionsCache[server.id] = entry.get("options").cloneDeep().value();
            }
        }
        return self.optionsCache[server.id];
    };

    /**
     * Set an option value
     * @param {RconServer} server
     * @param {string} key
     * @param {*} value
     */
    this.options.set = function (server, key, value) {
        var option = self.manifest.options[key];
        console.log(self.manifest, option, key);
        if (option) {
            if (option.type == "switch") value = value === "1" || value === true;
            if (option.type == "number") value = parseFloat(value);
            var data = this.getObject(server);
            data[key] = value;
            var entry = self.getDbEntry(server);
            if (entry) {
                entry.set("options", data).value();
            }
        }
    };

    /**
     * Get value of an option
     * @param {RconServer} server
     * @param {string} key
     * @returns {*|null} Null if not found
     */
    this.options.get = function (server, key) {
        return this.getObject(server)[key] || null;
    };

    /**
     * On rcon server has successfully connected and authenticated
     * @param {RconServer} server
     */
    this.onServerConnected = function (server) {
        // override this function in the child widget
    };

    /**
     * On widget update cycle - Fired every 10 seconds for each server
     * @param {RconServer} server
     */
    this.onUpdate = function (server) {
        // override this function in the child widget
    };

    /**
     * On frontend message
     * @param {RconServer} server
     * @param {WebSocketUser} user
     * @param {*} messageData Any message data received from frontend
     * @param {function} callback Pass an object as message data response for the frontend
     */
    this.onFrontendMessage = function (server, user, messageData, callback) {
        // override this function in the child widget
    };

    /**
     * On receive a server message
     * @param {RconServer} server
     * @param {RconMessage} message
     */
    this.onServerMessage = function (server, message) {
        // override this function in the child widget
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
        for (var widgetsIndex in widgets) {
            if (widgets.hasOwnProperty(widgetsIndex)) {
                var widgetsRow = widgets[widgetsIndex];
                var entry = widgetsRow.getDbEntry(server);
                if (entry) {
                    widgetsRow[method].apply(widgetsRow, Array.prototype.slice.call(arguments, 1));
                }
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
    var WebSocketUser = require(__dirname + "/websocketuser");
    for (var serverIndex in RconServer.instances) {
        if (RconServer.instances.hasOwnProperty(serverIndex)) {
            var server = RconServer.instances[serverIndex];
            Widget.callMethodForAllWidgetsIfActive("onUpdate", server);
        }
    }
    // send a ping to the frontend for all user's that have a server currently opened on the dashboard
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