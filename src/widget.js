"use strict";

var fs = require("fs");
var db = require(__dirname + "/db");
var exec = require('child_process').exec;

/**
 * A widget
 * @param {string} id
 * @constructor
 */
function Widget(id) {
    /** @type {Widget} */
    var self = this;
    /**
     * The widget internal name
     * @type {string}
     */
    this.id = id;
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
            "id": this.id
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
                self.storageCache[server.id] = entry.get("storage").cloneDeep().value() || {};
            }
        }
        return self.storageCache[server.id];
    };

    /**
     * Set a value in the widget storage
     * @param {RconServer} server
     * @param {string} key
     * @param {*} value
     * @param {number=} lifetime Lifetime of the stored data in seconds, ommit if not timeout
     */
    this.storage.set = function (server, key, value, lifetime) {
        var data = this.getObject(server);
        data[key] = value;
        data[key + ".lifetime"] = lifetime ? (new Date().getTime() / 1000) + lifetime : -1;
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
        var data = this.getObject(server)[key];
        if (typeof data == "undefined") return null;
        var lifetime = this.getObject(server)[key + ".lifetime"];
        if (lifetime > -1) {
            // if lifetime has ended than return null
            if (lifetime < new Date().getTime() / 1000) return null;
        }
        return data;
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
     * On widget update cycle - Fired every 30 seconds for each server
     * @param {RconServer} server
     */
    this.onUpdate = function (server) {
        // override this function in the child widget
    };

    /**
     * On frontend message
     * @param {RconServer} server
     * @param {WebSocketUser} user
     * @param {string} action The action
     * @param {*} messageData Any message data received from frontend
     * @param {function} callback Pass an object as message data response for the frontend
     */
    this.onFrontendMessage = function (server, user, action, messageData, callback) {
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
 * The default widget repositories, that will be installed on first installation
 * @type {Array}
 */
Widget.defaultWidgets = [
    "brainfoolong/rwa-autobot"
];

/**
 * Install a widget from a git repository
 * If already exist try to update
 * @param {string} repository
 */
Widget.install = function (repository) {
    var dir = __dirname + "/../public/widgets";
    var repoDir = dir + "/" + repository;
    if (fs.existsSync(repoDir)) {
        exec("cd " + repoDir + " && git pull origin master");
    } else {
        exec("cd " + dir + " && git clone https://github.com/brainfoolong/" + repository + ".git");
    }
};

/**
 * Get a list of all widget ids
 * @return {string[]}
 */
Widget.getAllWidgetIds = function () {
    var dir = __dirname + "/../public/widgets";
    return fs.readdirSync(dir);
};

/**
 * Get a list of all widget instances - Try to load all not loaded instances
 * @return {{string: Widget}}
 */
Widget.getAllWidgets = function () {
    var ids = Widget.getAllWidgetIds();
    var widgets = {};
    for (var i = 0; i < ids.length; i++) {
        var id = ids[i];
        var widget = Widget.get(id);
        if (widget) {
            widgets[id] = widget;
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
 * Get a single widget by id
 * @param {string} id
 * @return {Widget|null}
 */
Widget.get = function (id) {
    if (typeof Widget.widgets[id] == "undefined") {
        Widget.widgets[id] = null;
        var dir = __dirname + "/../public/widgets/" + id;
        var widget = require(dir + "/backend");
        if (widget) {
            widget.id = id;
            widget.manifest = require(dir + "/manifest.json");
            Widget.widgets[id] = widget;
        }
    }
    return Widget.widgets[id];
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
    for (var i = 0; i < WebSocketUser.instances.length; i++) {
        var user = WebSocketUser.instances[i];
        if (!user || !user.server) continue;
        user.send("widgetUpdateDone", {"server": user.server.id});
    }
};

// each 30 seconds call the updates for each active widget
setInterval(Widget.updateAllActive, 30000);
// and call 5 second after server startup
setTimeout(Widget.updateAllActive, 5000);

module.exports = Widget;