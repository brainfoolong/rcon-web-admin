"use strict";

var Widget = require(__dirname + "/../../../src/widget");
var hash = require(__dirname + "/../../../src/hash");
var vm = require('vm');

var widget = new Widget();

/**
 * On receive a server message
 * @param {RconServer} server
 * @param {RconMessage} message
 */
widget.onServerMessage = function (server, message) {
    var chatMsg = message.body.match(/^\[CHAT\] (.*?)\[([0-9]+)\/([0-9]+)\] \: (.*)/i);
    if (chatMsg) {
        var programs = widget.storage.get(server, "programs") || {};
        for (var programsIndex in programs) {
            if (programs.hasOwnProperty(programsIndex)) {
                var programsRow = programs[programsIndex];
                if (programsRow.active) {
                    widget.executeUserScript(server, programsRow.script, chatMsg[1], chatMsg[4], message.timestamp, false);
                }
            }
        }
    }
};


/**
 * On frontend message
 * @param {RconServer} server
 * @param {WebSocketUser} user
 * @param {string} action The action
 * @param {*} messageData Any message data received from frontend
 * @param {function} callback Pass an object as message data response for the frontend
 */
widget.onFrontendMessage = function (server, user, action, messageData, callback) {
    var programs = {};
    switch (action) {
        case "save":
            var id = messageData.id || hash.random(64);
            programs = widget.storage.get(server, "programs") || {};
            programs[id] = {
                "id": id,
                "script": messageData.script,
                "title": messageData.title,
                "active": messageData.active
            };
            widget.storage.set(server, "programs", programs);
            callback(this, programs[id]);
            break;
        case "delete":
            programs = widget.storage.get(server, "programs");
            if (programs && typeof programs[messageData.id] != "undefined") {
                delete programs[messageData.id];
                widget.storage.set(server, "programs", programs);
                callback(this, true);
                return;
            }
            callback(this, false);
            break;
        case "load":
            programs = widget.storage.get(server, "programs");
            if (programs && typeof programs[messageData.id] != "undefined") {
                callback(this, programs[messageData.id]);
                return;
            }
            callback(this, false);
            break;
        case "list":
            callback(this, widget.storage.get(server, "programs") || {});
            break;
        case "validate-script":
            callback(this, widget.executeUserScript(server, messageData.script, "testuser", "testmessage", new Date(), true));
            break;
    }
};

/**
 * Execute a user script
 * @param {RconServer} server
 * @param {string} script
 * @param {string} user
 * @param {string} message
 * @param {Date} timestamp
 * @param {boolean} simulate
 */
widget.executeUserScript = function (server, script, user, message, timestamp, simulate) {
    var sandbox = {
        "user": user,
        "message": message,
        "timestamp": timestamp,
        "say": function (sayMessage) {
            server.cmd("say " + sayMessage, null, true, function () {

            });
        },
        "cmd": function (cmdMessage) {
            server.cmd(cmdMessage, null, true, function () {

            });
        },
        "storage": {
            "get": function (key) {
                return widget.storage.get(server, "chatbot.userscript." + key);
            },
            "set": function (key, value, lifetime) {
                return widget.storage.set(server, "chatbot.userscript." + key, value, lifetime);
            }
        }
    };
    if (simulate) {
        sandbox.say = function () {

        };
        sandbox.cmd = function () {

        };
    }
    var vmScript = new vm.Script(script, {"timeout": 10});
    var context = new vm.createContext(sandbox);
    try {
        vmScript.runInContext(context);
        return true;
    } catch (e) {
        var s = e.stack.split("\n");
        var line = s[1].match(/\:([0-9]+\:[0-9]+)$/);
        return e.message + " on line " + (line ? line[1] : "");
    }
};

module.exports = widget;