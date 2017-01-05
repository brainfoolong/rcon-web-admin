"use strict";

var Widget = require(__dirname + "/../../../src/widget");
var WebSocketUser = require(__dirname + "/../../../src/websocketuser");
var hash = require(__dirname + "/../../../src/hash");
var vm = require('vm');
var gametools = require(__dirname + "/../../../src/gametools");

var widget = new Widget();

/**
 * On receive a server message
 * @param {RconServer} server
 * @param {RconMessage} message
 */
widget.onServerMessage = function (server, message) {
    var sandboxData = {
        "context": message.type === 4 ? "serverMessageLog" : "serverMessage",
        "message": message.body
    };
    var chatMsg = message.body.match(/^\[CHAT\] (.*?)\[([0-9]+)\/([0-9]+)\] \: (.*)/i);
    var joinMsg = message.body.match(/([0-9]+)\/([0-9]+)\/(.*?) (joined|disconnect)/i);
    var banKickMsg = message.body.match(/^(banned|kicked):(.*)/i);
    var unbanMsg = message.body.match(/^Unbanned User:(.*)/i);
    if (chatMsg) {
        sandboxData.context = "chat";
        sandboxData.user = {
            name: chatMsg[1],
            id: chatMsg[3]
        };
        sandboxData.chatMessage = chatMsg[4];
    } else if (joinMsg) {
        sandboxData.context = joinMsg[4] == "joined" ? "connect" : "disconnect";
        sandboxData.user = {
            name: joinMsg[3],
            id: joinMsg[2]
        };
    } else if (banKickMsg) {
        sandboxData.context = banKickMsg[1].toLowerCase() == "banned" ? "ban" : "kick";
        sandboxData.user = {
            name: banKickMsg[2].trim()
        };
    } else if (unbanMsg) {
        sandboxData.context = "unban";
        sandboxData.user = {
            id: unbanMsg[1].trim()
        };
    }
    widget.executeAllScripts(server, sandboxData);
};

/**
 * On widget update cycle - Fired every 30 seconds for each server
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
                "active": messageData.active,
                "variables": {},
                "variableValues": messageData.variableValues
            };
            widget.storage.set(server, "programs", programs);
            widget.executeUserScript(server, id, messageData.script, {"context": "validate"});
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
            callback(this, widget.executeUserScript(server, "", messageData.script, {"context": "validate"}));
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
                var sandboxDataCopy = JSON.parse(JSON.stringify(sandboxData));
                for (var varIndex in programsRow.variables) {
                    if (programsRow.variables.hasOwnProperty(varIndex)) {
                        var varRow = programsRow.variables[varIndex];
                        sandboxDataCopy[varIndex] = varRow.default;
                        if (typeof programsRow.variableValues[varIndex] != "undefined"
                            && programsRow.variableValues[varIndex] !== null) {
                            sandboxDataCopy[varIndex] = programsRow.variableValues[varIndex];
                        }
                    }
                }
                var result = widget.executeUserScript(server, programsRow.id, programsRow.script, sandboxDataCopy);
                result.program = {
                    "id": programsRow.id,
                    "title": programsRow.title
                };
                for (var i = 0; i < WebSocketUser.instances.length; i++) {
                    var user = WebSocketUser.instances[i];
                    if (!user || !user.server || server.id !== user.server.id) continue;
                    user.send("autobotExecutedScript", result);
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
 * @param {object} sandboxData
 */
widget.executeUserScript = function (server, programId, script, sandboxData) {
    var logs = [];
    /**
     * Say something as server
     * @param {string} message
     * @param {function=} callback
     */
    sandboxData.say = function (message, callback) {
        server.cmd("say " + message, null, true, function () {
            if (callback) callback();
        });
    };
    /**
     * Send a command
     * @param {string} message
     * @param {function=} callback
     */
    sandboxData.cmd = function (message, callback) {
        server.cmd(message, null, true, function () {
            if (callback) callback();
        });
    };
    /**
     * Log for browser console
     */
    sandboxData.log = function () {
        logs.push(Array.prototype.slice.call(arguments));
    };
    /**
     * Define an interface variable
     * @param {string} name
     * @param {string} type
     * @param {string} label
     * @param {*} defaultValue
     */
    sandboxData.variable = function (name, type, label, defaultValue) {
        if (typeof sandboxData[name] != "undefined") {
            throw new Error("Variable '" + name + "' already used in this script, choose another name");
        }
        var programs = widget.storage.get(server, "programs") || {};
        if (typeof programs[programId] != "undefined") {
            var program = programs[programId];
            program.variables = program.variables || {};
            program.variableValues = program.variableValues || {};
            program.variables[name] = {
                "type": type,
                "label": label,
                "default": defaultValue
            };
            widget.storage.set(server, "programs", programs);
        }
    };
    sandboxData.storage = {
        "get": function (key) {
            return widget.storage.get(server, "autobot." + programId + "." + key);
        },
        "set": function (key, value, lifetime) {
            return widget.storage.set(server, "autobot." + programId + "." + key, value, lifetime);
        }
    };
    sandboxData.rust = {};
    sandboxData.rust.serverstatus = function (callback) {
        if (server.serverData.game != "rust") {
            callback(null);
            return;
        }
        gametools.rust.serverstatus(server, callback);
    };
    var empty = function () {

    };
    if (sandboxData.context == "validate") {
        sandboxData.say = empty;
        sandboxData.cmd = empty;
        sandboxData.storage.get = empty;
        sandboxData.storage.set = empty;
        sandboxData.rust.serverstatus = empty;
    } else {
        sandboxData.variable = empty;
    }
    try {
        var vmScript = new vm.Script(script, {"timeout": 5});
        var context = new vm.createContext(sandboxData);
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