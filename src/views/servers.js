"use strict";

var db = require(__dirname + "/../db");
var fs = require("fs");
var hash = require(__dirname + "/../hash");
var RconServer = require(__dirname + "/../rconserver");
var fstools = require(__dirname + "/../fstools");

/**
 * The view
 * @param {WebSocketUser} user
 * @param {object} messageData
 * @param {function} callback
 * @constructor
 */
var View = function (user, messageData, callback) {
    // access denied for everyone except admin
    if (!user.userData || !user.userData.admin) {
        callback({redirect: "index", "note": {"message": "access.denied", "type": "danger"}});
        return;
    }

    var deeperCallback = function (sendMessageData) {
        // just pipe to frontend
        var users = [];
        var usersObject = db.get("users").value();
        for (var userIndex in usersObject) {
            if (usersObject.hasOwnProperty(userIndex)) {
                var userRow = usersObject[userIndex];
                users.push(userRow.username);
            }
        }
        sendMessageData.servers = db.get("servers").cloneDeep().value();
        if (messageData.id) {
            sendMessageData.editData = sendMessageData.servers[messageData.id];
        }
        sendMessageData.users = users;
        callback(sendMessageData);
    };

    var servers = null;
    var server = null;
    // on delete
    if (messageData.form == "servers" && messageData.btn == "delete") {
        server = RconServer.get(messageData.id);
        if (server) {
            server.removeInstance(true);
            servers = db.get("servers").getState();
            delete servers[messageData.id];
            db.get("servers").setState(servers);
            // delete server folder
            var dir = __dirname + "/../../db/server_" + messageData.id;
            if (fs.existsSync(dir)) {
                fstools.deleteRecursive(dir);
            }
            deeperCallback({
                "note": {"message": "deleted", "type": "success"},
                "redirect": "servers"
            });
        }
        return;
    }
    // on save
    if (messageData.form == "servers" && messageData.btn == "save") {
        var formData = messageData.formData;
        var id = messageData.id || hash.random(32);
        servers = db.get("servers").cloneDeep().value();
        var serverData = servers[id] || {};
        serverData.id = id;
        serverData.game = formData.game;
        serverData.name = formData.name;
        serverData.host = formData.host;
        serverData.users = formData.users;
        serverData.web = formData.web == "yes";
        serverData.active = formData.active == "yes";
        serverData.rcon_port = parseInt(formData.rcon_port);
        serverData.rcon_password = formData.rcon_password;
        db.get("servers").set(id, serverData).value();

        if (messageData.id) {
            // reload server if edited
            server = user.getServerById(messageData.id);
            if (server) {
                server.con.on("disconnect", function () {
                    RconServer.connectAll();
                });
                server.removeInstance(true);
            }
        } else {
            // create server folder
            fs.mkdirSync(__dirname + "/../../db/server_" + id, 0o777);
        }
        messageData.id = null;
        deeperCallback({
            "note": {"message": "saved", "type": "success"},
            "redirect": "servers"
        });
        return;
    }
    deeperCallback({});
};

module.exports = View;