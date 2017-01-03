"use strict";

var Widget = require(__dirname + "/../../../src/widget");
var WebSocketUser = require(__dirname + "/../../../src/websocketuser");
var hash = require(__dirname + "/../../../src/hash");
var vm = require('vm');

var widget = new Widget();

/**
 * On receive a server message
 * @param {RconServer} server
 * @param {RconMessage} message
 */
widget.onServerMessage = function (server, message) {
    var sandboxData = {
        "context": message.type === 4 ? "serverMessageLog" : "serverMessage",
        "message": message.body,
        "username": null,
        "userid": null
    };
    var chatMsg = message.body.match(/^\[CHAT\] (.*?)\[([0-9]+)\/([0-9]+)\] \: (.*)/i);
    if (chatMsg) {
        sandboxData.context = "chat";
        sandboxData.username = chatMsg[1];
        sandboxData.userid = chatMsg[3];
        sandboxData.message = chatMsg[4];
    }
    widget.executeAllScripts(server, sandboxData);
};

/**
 * On widget update cycle - Fired every 10 seconds for each server
 * @param {RconServer} server
 */
widget.onUpdate = function (server) {
    widget.executeAllScripts(server, {"context": "update"});
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
            var id = messageData.id || hash.random(12);
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
            callback(this, widget.executeUserScript(server, "test", messageData.script, true, {"context": "test"}));
            break;
    }
};

/**
 * Execute all active scripts
 * @param {RconServer} server
 * @param {object} sandboxData
 */
widget.executeAllScripts = function (server, sandboxData) {
    var programs = widget.storage.get(server, "programs") || {};
    for (var programsIndex in programs) {
        if (programs.hasOwnProperty(programsIndex)) {
            var programsRow = programs[programsIndex];
            if (programsRow.active) {
                // execute script and send a message to all connected users
                // send a message to all connected users
                var result = widget.executeUserScript(server, programsRow.id, programsRow.script, false, sandboxData);
                result.program = {
                    "id": programsRow.id,
                    "title": programsRow.title
                };
                var users = WebSocketUser.instances;
                for (var usersIndex in users) {
                    if (users.hasOwnProperty(usersIndex)) {
                        var usersRow = users[usersIndex];
                        if (usersRow.server && server.id == usersRow.server.id) {
                            usersRow.send("autobotExecutedScript", result);
                        }
                    }
                }
            }
        }
    }
};

/**
 * Execute a user script
 * @param {RconServer} server
 * @param {string} programId
 * @param {string} script
 * @param {boolean} simulate
 * @param {object} sandboxData
 */
widget.executeUserScript = function (server, programId, script, simulate, sandboxData) {
    var logs = [];
    sandboxData.say = function (message) {
        server.cmd("say " + message, null, true, function () {

        });
    };
    sandboxData.cmd = function (message) {
        server.cmd(message, null, true, function () {

        });
    };
    sandboxData.log = function () {
        logs.push(Array.prototype.slice.call(arguments));
    };
    sandboxData.storage = {
        "get": function (key) {
            return widget.storage.get(server, "autobot." + programId + "." + key);
        },
        "set": function (key, value, lifetime) {
            return widget.storage.set(server, "autobot." + programId + "." + key, value, lifetime);
        }
    };
    if (simulate) {
        sandboxData.say = function () {

        };
        sandboxData.cmd = function () {

        };
        sandboxData.storage.get = function () {
            return null;
        };
        sandboxData.storage.set = function () {
            return null;
        };
    }
    var vmScript = new vm.Script(script, {"timeout": 5});
    var context = new vm.createContext(sandboxData);
    try {
        vmScript.runInContext(context);
        return {
            "logs": logs
        };
    } catch (e) {
        var s = e.stack.split("\n");
        var line = s[1].match(/\:([0-9]+\:[0-9]+)$/);
        return {
            "error": e.message + " on line " + (line ? line[1] : "")
        };
    }
};

module.exports = widget;