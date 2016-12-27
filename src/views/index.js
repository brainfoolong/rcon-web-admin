"use strict";

var db = require(__dirname + "/../db");
var fs = require("fs");

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
    var widgets = [];
    var servers = db.get("servers").cloneDeep().value();
    var deeperCallback = function (sendMessageData) {
        sendMessageData.myServers = myServers;
        sendMessageData.server = messageData.server;
        sendMessageData.serverConnected = currentServer && currentServer.connected;
        callback(sendMessageData);
    };
    (function () {
        // get servers that i am allowed to see
        for (var i in servers) {
            var server = servers[i];
            var users = server.users.split(",");
            if (users) {
                for (var id in users) {
                    if (users[id] == user.userData.username) {
                        myServers[i] = {
                            "id": server.id,
                            "name": server.name
                        }
                    }
                }
            }
        }
    })();
    (function () {
        // get all widgets
        var dir = __dirname + "/../../public/widgets";
        var widgetFolders = fs.readdirSync(dir);
        for (var i in widgetFolders) {
            var folder = widgetFolders[i];
            var manifest = require(dir + "/" + folder + "/manifest.json");
            widgets.push({
                "folder": folder,
                "manifest": manifest
            });
        }
    })();
    deeperCallback({});
};

module.exports = View;