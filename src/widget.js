"use strict";

var fs = require("fs");
var db = require(__dirname + "/db");
var request = require(__dirname + "/request");
var fstools = require(__dirname + "/fstools");

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
        if (found.size().value()) {
            return found;
        }
        return null;
    };

    /**
     * Send a message to all connected frontend widgets
     * @param {RconServer} server
     * @param {*} message
     */
    this.sendMessageToFrontend = function (server, message) {
        var WebSocketUser = require(__dirname + "/websocketuser");
        for (var i = 0; i < WebSocketUser.instances.length; i++) {
            var user = WebSocketUser.instances[i];
            if (!user || !user.server) continue;
            user.send("widgetBackendMessage", {"server": user.server.id, "widget": self.id, "message": message});
        }
    };

    /**
     * The widget storage
     * @type {{}}
     */
    this.storage = {};

    /**
     * Get the storage object for given server
     * @param {RconServer} server
     * @return {object|null}
     */
    this.storage.getObject = function (server) {
        var RconServer = require(__dirname + "/rconserver");
        if (server instanceof RconServer === false) {
            console.trace("Widget.storage methods require a RconServer instance as first parameter");
            return null;
        }
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
        if (!data) return null;
        data[key] = value;
        data[key + ".lifetime"] = lifetime && lifetime > -1 ? (new Date().getTime() / 1000) + lifetime : -1;
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
        var data = this.getObject(server);
        if (!data || typeof data[key] == "undefined" || data[key] === null) return null;
        var lifetime = data[key + ".lifetime"];
        if (lifetime > -1) {
            // if lifetime has ended than return null
            if (lifetime < new Date().getTime() / 1000) return null;
        }
        return data[key];
    };

    /**
     * The widget options
     * @type {{}}
     */
    this.options = {};

    /**
     * Get the options object for given server
     * @param {RconServer} server
     * @return {object|null}
     */
    this.options.getObject = function (server) {
        var RconServer = require(__dirname + "/rconserver");
        if (server instanceof RconServer === false) {
            console.trace("Widget.options methods require a RconServer instance as first parameter");
            return null;
        }
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
        var data = this.getObject(server);
        if (!data) return null;
        var option = self.manifest.options[key];
        if (option) {
            if (option.type == "switch") value = value === "1" || value === true;
            if (option.type == "number") value = parseFloat(value);
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
     * @returns {*} Return the manifest default value if no saved value has been found
     */
    this.options.get = function (server, key) {
        var data = this.getObject(server);
        var value = data && data[key] !== null && typeof data[key] != "undefined" ? data[key] : null;
        if (value === null) {
            var option = self.manifest.options[key];
            if (option) {
                value = option.default;
            }
        }
        return value;
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

    /**
     * Fired when widget is added to a server dashboard
     * @param {RconServer} server
     */
    this.onWidgetAdded = function (server) {
        // override this function in the child widget
    };
}

/**
 * All widgets
 * @type {{string: Widget}}
 */
Widget.widgets = {};

/**
 * All existing widget ids
 * @type {Array|null}
 */
Widget.widgetIds = null;

/**
 * Install a widget from a git repository
 * If already exist try to update
 * @param {string} repository
 * @param {function=} callback
 */
Widget.install = function (repository, callback) {
    var unzip = require("unzip");
    var dir = fs.realpathSync(__dirname + "/../public/widgets");
    dir = dir.replace(/\\/g, "/");
    var id = repository.split("/")[1];
    var repoDir = dir + "/" + id;
    if (fs.existsSync(repoDir)) {
        // delete existing folder
        fstools.deleteRecursive(repoDir);
    }
    fs.mkdir(repoDir, 777, function (err) {
        if (err) {
            console.error("Cannot create widget directory", err);
            callback(false);
            return;
        }
        request.get("https://codeload.github.com/" + repository + "/zip/master", true, function (contents) {
            if (!contents.length) {
                console.error("Cannot load widget repository zip file");
                callback(false);
                return;
            }
            fs.writeFile(repoDir + "/master.zip", contents, {"mode": 777}, function () {
                fs.createReadStream(repoDir + "/master.zip").pipe(unzip.Parse()).on('entry', function (entry) {
                    var fileName = entry.path.split("/").slice(1).join("/");
                    if (!fileName.length) return;
                    var path = repoDir + "/" + fileName;
                    if (entry.type == "Directory") {
                        fs.mkdirSync(path, 777);
                        entry.autodrain();
                    } else {
                        entry.pipe(fs.createWriteStream(path));
                    }
                }).on("close", function () {
                    fs.unlinkSync(repoDir + "/master.zip");
                    callback(true);
                });
            });
        });
    });
};

/**
 * Fully delete a widget from the disk
 * @param {string} id
 * @param {function=} callback
 */
Widget.delete = function (id, callback) {
    var widget = Widget.get(id);
    if (widget) {
        fstools.deleteRecursive(__dirname + "/../public/widgets/" + id);
        // delete all entries with this widget in the server widgets
        var RconServer = require(__dirname + "/rconserver");
        for (var serverIndex in RconServer.instances) {
            if (RconServer.instances.hasOwnProperty(serverIndex)) {
                var server = RconServer.instances[serverIndex];
                var list = db.get("widgets", "server_" + server.id).get("list").values();
                if (list) {
                    var newList = [];
                    for (var i = 0; i < list.length; i++) {
                        var widgetEntry = list[i];
                        if (widgetEntry.id !== id) newList.push(widgetEntry);
                    }
                    db.get("widgets", "server_" + server.id).set("list", newList).value();
                }
            }
        }
    }
    callback();
};

/**
 * Get a list of all widget ids
 * @return {string[]}
 */
Widget.getAllWidgetIds = function () {
    if (Widget.widgetIds === null) {
        Widget.widgetIds = [];
        var dir = __dirname + "/../public/widgets";
        var files = fs.readdirSync(dir);
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (file.match(/^(\.|README.md)/i)) continue;
            Widget.widgetIds.push(file);
        }
    }
    return Widget.widgetIds;
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
        console.error(new Date(), e.stack);
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
        if (fs.existsSync(dir + "/backend.js")) {
            // invalidate require cache also before fetching
            // because it's possible that the widget code has been reloaded
            delete require.cache[dir + "/backend"];
            var widget = require(dir + "/backend");
            if (widget) {
                widget.id = id;
                widget.manifest = require(dir + "/manifest.json");
                Widget.widgets[id] = widget;
            }
        }
    }
    return Widget.widgets[id];
};

/**
 * Call onUpdate methods for all active widgets for all connected servers
 */
Widget.updateAllActive = function () {
    try {
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
    } catch (e) {
        console.error(new Date(), "Widget update all active error", e);
    }
};


/**
 * Fetch latest versions for all installed widgets
 * Stored it into widget.manifest._latestVersion
 */
Widget.fetchLatestVersions = function () {
    var widgets = Widget.getAllWidgetIds();
    for (var i = 0; i < widgets.length; i++) {
        (function (widget) {
            if (widget) {
                request.get("https://raw.githubusercontent.com/" + widget.manifest.repository + "/master/manifest.json", false, function (content) {
                    if (content) {
                        var manifest = JSON.parse(content);
                        if (manifest && manifest.version) {
                            widget.manifest._latestVersion = manifest.version;
                        }
                    }
                });
            }
        })(Widget.get(widgets[i]));
    }
};

// each 30 seconds call the updates for each active widget
setInterval(Widget.updateAllActive, 30000);
// and call 5 second after server startup
setTimeout(Widget.updateAllActive, 5000);

// fetch latest version each hour
setInterval(Widget.updateAllActive, 1000 * 60 * 60);
// and call 5 second after server startup
setTimeout(Widget.fetchLatestVersions, 5000);


module.exports = Widget;