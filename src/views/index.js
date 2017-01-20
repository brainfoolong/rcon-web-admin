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
    if (currentServer && !currentServer.connected) currentServer = null;
    var widgets = {};
    var servers = db.get("servers").cloneDeep().value();
    var wdb = null;
    if (currentServer) wdb = db.get("widgets", "server_" + messageData.server);
    var deeperCallback = function (sendMessageData) {
        sendMessageData.widgets = widgets;
        sendMessageData.myServers = myServers;
        if (currentServer) {
            var myWidgets = wdb.get("list").cloneDeep().value();
            sendMessageData.gridrows = wdb.get("gridrows").value();
            sendMessageData.myWidgets = [];
            if (myWidgets) {
                for (var i = 0; i < myWidgets.length; i++) {
                    var widgetData = myWidgets[i];
                    var widget = Widget.get(widgetData.id);
                    if (widget) {
                        widgetData.manifest = sendMessageData.widgets[widget.id];
                        sendMessageData.myWidgets.push(widgetData);
                    }
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
            if (server.active === false) continue;
            var found = user.userData.admin;
            var users = server.users;
            if (users) {
                for (var j = 0; j < users.length; j++) {
                    if (users[j] == user.userData.username) {
                        found = true;
                    }
                }
            }
            if (found) {
                myServers[i] = {
                    "id": server.id,
                    "name": server.name,
                    "game": server.game
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
                widgets[allWidgetsRow.id] = allWidgetsRow.manifest;
            }
        }
    })();
    // widget actions
    if (messageData.action == "widget") {
        var widgetEntry = null;
        var widget = null;
        if (user.userData !== null && currentServer) {
            switch (messageData.type) {
                case "add":
                    if (user.userData.restrictwidgets && user.userData.restrictwidgets.indexOf(messageData.widget) > -1) {
                        deeperCallback({"note": {"message": "server.widget.restricted", "type": "danger"}});
                        return;
                    }
                    var list = wdb.get("list");
                    widget = Widget.get(messageData.widget);
                    if (widget) {
                        var widgetId = widget.id;
                        if (list.find({"id": widget.id}).size().value()) {
                            widgetId = null;
                        } else {
                            list.push({
                                "id": widgetId,
                                "position": list.size().value(),
                                "size": widget.manifest.compatibleSizes[0],
                                "options": {},
                                "storage": {}
                            }).value();
                            Widget.callMethodForAllWidgetsIfActive(
                                "onWidgetAdded",
                                currentServer
                            );
                        }
                    }
                    deeperCallback({"widget": widgetId});
                    break;
                case "remove":
                    if (user.userData.readonlyoptions || user.userData.restrictwidgets && user.userData.restrictwidgets.indexOf(messageData.widget) > -1) {
                        deeperCallback({"note": {"message": "server.widget.restricted", "type": "danger"}});
                        return;
                    }
                    widget = Widget.get(messageData.widget);
                    if (widget) {
                        wdb.get("list").remove({
                            "id": messageData.widget
                        }).value();
                        delete widget.storageCache[currentServer.id];
                        delete widget.optionsCache[currentServer.id];
                    }
                    deeperCallback({});
                    break;
                case "layout":
                    widgetEntry = wdb.get("list").find({
                        "id": messageData.widget
                    });
                    if (widgetEntry.size().value()) {
                        for (var messageDataIndex in messageData.values) {
                            if (messageData.values.hasOwnProperty(messageDataIndex)) {
                                widgetEntry.set(messageDataIndex, messageData.values[messageDataIndex]).value();
                            }
                        }
                    }
                    deeperCallback({});
                    break;
                case "storage":
                    widget = Widget.get(messageData.widget);
                    if (widget) {
                        widget.storage.set(currentServer, messageData.key, messageData.value, messageData.lifetime);
                    }
                    deeperCallback({});
                    break;
                case "option":
                    if (user.userData.readonlyoptions) {
                        deeperCallback({"note": {"message": "server.options.restricted", "type": "danger"}});
                        return;
                    }
                    widget = Widget.get(messageData.widget);
                    if (widget) {
                        widget.options.set(currentServer, messageData.option, messageData.value);
                    }
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