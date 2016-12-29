"use strict";

var db = require(__dirname + "/../db");
var fs = require("fs");
var hash = require(__dirname + "/../hash");
var Widget = require(__dirname + "/../widget");

/**
 * The view
 * @param {WebSocketUser} user
 * @param {object} messageData
 * @param {function} callback
 * @constructor
 */
var View = function (user, messageData, callback) {
    var myServers = {};
    var currentServer = user.getServerById(messageData.server);
    var widgets = {};
    var servers = db.get("servers").cloneDeep().value();
    var wdb = null;
    if (currentServer) wdb = db.get("widgets", "server_" + messageData.server);
    var deeperCallback = function (sendMessageData) {
        sendMessageData.widgets = widgets;
        sendMessageData.myServers = myServers;
        if (currentServer) {
            sendMessageData.myWidgets = wdb.get("array").filter({
                "user": user.userData.id
            }).cloneDeep().value();
            if (sendMessageData.myWidgets) {
                for (var i in sendMessageData.myWidgets) {
                    sendMessageData.myWidgets[i].manifest = sendMessageData.widgets[sendMessageData.myWidgets[i].name];
                }
            }
            sendMessageData.server = messageData.server;
            sendMessageData.serverConnected = currentServer && currentServer.connected;
        }
        callback(sendMessageData);
    };

    // get servers that i am allowed to see
    (function () {
        for (var i in servers) {
            var server = servers[i];
            var users = server.users.split(",");
            if (users) {
                for (var id in users) {
                    if (users[id] == user.userData.username) {
                        myServers[i] = {
                            "id": server.id,
                            "name": server.name,
                            "game": server.game
                        }
                    }
                }
            }
        }
    })();
    // get all widgets
    (function () {
        var allWidgets = Widget.getAllWidgets();
        for (var allWidgetsIndex in allWidgets) {
            if (allWidgets.hasOwnProperty(allWidgetsIndex)) {
                var allWidgetsRow = allWidgets[allWidgetsIndex];
                widgets[allWidgetsRow.name] = allWidgetsRow.manifest;
            }
        }
    })();

    // widget actions
    if (messageData.action == "widget") {
        if (user.userData !== null && currentServer) {
            switch (messageData.type) {
                case "add":
                    var widgetId = "w" + hash.random(64);
                    wdb.get("array").push({
                        "id": widgetId,
                        "name": messageData.name,
                        "user": user.userData.id,
                        "position": 0,
                        "data": {},
                        "options": {}
                    }).value();
                    deeperCallback({"widget": widgetId});
                    break;
                case "remove":
                    wdb.get("array").remove({
                        "id": messageData.widget,
                        "user": user.userData.id
                    }).value();
                    deeperCallback({});
                    break;
                case "option":
                    var widgetEntry = wdb.get("array").find({
                        "id": messageData.widget,
                        "user": user.userData.id
                    });
                    var options = widgetEntry.get("options").value();
                    options[messageData.option] = messageData.value;
                    widgetEntry.set("options", options).value();
                    deeperCallback({});
                    break;
                default:
                    deeperCallback({});

            }
            return;
        }
        deeperCallback({});
        return;
    }
    deeperCallback({});
};

module.exports = View;