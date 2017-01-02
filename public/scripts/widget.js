"use strict";

/**
 * Widget Management
 */
function Widget(name) {
    /** @type {Widget} */
    var self = this;
    /** @type {string} */
    this.server = "";
    /** @type {string} */
    this.name = name;
    /** @type {string} */
    this.id = "";
    /** @type {NodeMessageCallback[]} */
    this.socketMessageHandlers = [];
    /** @type {jQuery} */
    this.container = null;
    /** @type {jQuery} */
    this.content = null;
    /** @type {object} */
    this.data = null;

    /**
     * On widget init
     */
    this.onInit = function () {
        console.error("Please override 'onInit' function of widget " + this.name);
    };

    /**
     * Fired after the backend widget have done it's onUpdate cycle
     */
    this.onBackendUpdate = function () {
        console.error("Please override 'onBackendUpdate' function of widget " + this.name);
    };

    /**
     * On widget option update
     * @param {string} key
     * @param {*} value
     */
    this.onOptionUpdate = function (key, value) {
        console.error("Please override 'onOptionUpdate' function of widget " + this.name);
    };

    /**
     * Bind a callback when the rcon server send a message
     * @param {function} callback
     */
    this.onRconMessage = function (callback) {
        var socketCallback = function (data) {
            if (data.action == "server-message" && self.server == data.messageData.server) {
                callback(data.messageData);
            }
        };
        Socket.onMessage(socketCallback);
        this.socketMessageHandlers.push(socketCallback);
    };

    /**
     * Send a raw command to the server
     * @param {string} action
     * @param {object=} messageData
     * @param {function=} callback
     */
    this.send = function (action, messageData, callback) {
        if (!messageData) messageData = {};
        messageData.server = self.server;
        Socket.send(action, messageData, function (data) {
            if (callback) callback(data);
        });
    };

    /**
     * Send a rcon command directly to the server
     * @param {string} cmd
     * @param {function=} callback
     */
    this.cmd = function (cmd, callback) {
        this.send("cmd", {"cmd": cmd}, function (data) {
            if (callback) callback(data.message);
        });
    };

    /**
     * Send a message to the backend script
     * @param {string} action
     * @param {*} messageData
     * @param {function=} callback
     */
    this.backend = function (action, messageData, callback) {
        this.send("widget", {
            "widgetAction": action,
            "widgetMessageData": messageData,
            "widget": self.id
        }, function (responseData) {
            if (callback) callback(responseData.widgetMessageData);
        });
    };

    /**
     * Get a locale translation value from widgets manifest
     * @param {string} key
     * @param {object=} params
     * @return {string}
     */
    this.t = function (key, params) {
        var v = key;
        var locale = self.data.manifest.locale;
        if (!locale) {
            return key;
        }
        if (typeof locale[lang.language] != "undefined" && typeof locale[lang.language][key] != "undefined") {
            v = locale[lang.language][key];
        } else if (typeof locale["en"] != "undefined" && typeof locale["en"][key] != "undefined") {
            v = locale["en"][key];
        }
        if (typeof params != "undefined") {
            for (var i in params) {
                if (params.hasOwnProperty(i)) {
                    v = v.replace(new RegExp("{" + i + "}", "ig"), params[i]);
                }
            }
        }
        return v;
    };

    /**
     * Set an option value
     * @param {string} key
     * @param {*} value
     * @param {function=} callback
     */
    this.setOptionValue = function (key, value, callback) {
        var option = this.data.manifest.options[key];
        if (option) {
            if (option.type == "switch") value = value === "1" || value === true;
            if (option.type == "number") value = parseFloat(value);
            this.send("view", {
                "view": "index",
                "action": "widget",
                "widget": this.id,
                "type": "option",
                "option": key,
                "value": value
            }, function () {
                if (callback) callback();
                self.data.options[key] = value;
                self.onOptionUpdate(key, value);
            });
        }
    };

    /**
     * Get value of a defined manifest option
     * @param {string} key
     * @returns {*|null} Null if not found
     */
    this.getOptionValue = function (key) {
        if (self.data.options && typeof self.data.options[key] != "undefined") {
            return self.data.options[key];
        }
        if (self.data.manifest.options && typeof self.data.manifest.options[key] != "undefined") {
            return self.data.manifest.options[key].default;
        }
        return null;
    };

    /**
     * Create an interval, automatically destroy previous interval if exist
     * @param {string} id
     * @param {function} func
     * @param {number} step
     */
    this.createInterval = function (id, func, step) {
        Interval.create("widget." + self.name + "." + id, func, step);
    };

    /**
     * Destroy an interval
     * @param {string} id
     */
    this.destroyInterval = function (id) {
        Interval.destroy("widget." + self.name + "." + id);
    };

    /**
     * Delete the widget and drop all data and handlers
     */
    this.remove = function () {
        for (var i in this.socketMessageHandlers) {
            Socket.offMessage(this.socketMessageHandlers[i]);
        }
        delete Widget.widgets[this.id];
        this.container.remove();
    };

    // bind a message handler to call the update method when the backend send that request
    (function () {
        var socketCallback = function (data) {
            if (data.action == "widget-update-done" && self.server == data.messageData.server) {
                self.onBackendUpdate();
            }
        };
        Socket.onMessage(socketCallback);
        self.socketMessageHandlers.push(socketCallback);
    })();
}

/**
 * The register callback
 * @type {WidgetRegisterCallback|null}
 */
Widget.registerCallback = null;

/**
 * All widgets
 * @type {{string: Widget}}
 */
Widget.widgets = {};

/**
 * Get widget by given html element
 * @param {string|jQuery} el
 * @return {Widget|null}
 */
Widget.getByElement = function (el) {
    var w = $(el).closest(".widget");
    if (w.length) {
        if (typeof Widget.widgets[w.attr("id")] != "undefined") {
            return Widget.widgets[w.attr("id")];
        }
    }
    return null;
};

/**
 * Register a callback
 * @param {WidgetRegisterCallback} callback
 */
Widget.register = function (callback) {
    Widget.registerCallback = callback;
};

/**
 * The timeout for a option change
 * @type {number}
 */
Widget._optionChangeTimeout = null;

/**
 * Widget Register Callback
 * @callback WidgetRegisterCallback
 * @param {Widget} widget
 */