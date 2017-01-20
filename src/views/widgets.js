"use strict";

var Widget = require(__dirname + "/../widget");
var os = require("os");
var exec = require('child_process').exec;

/**
 * The view
 * @param {WebSocketUser} user
 * @param {object} messageData
 * @param {function} callback
 * @constructor
 */
function View(user, messageData, callback) {
    // access denied for everyone except admin
    if (!user.userData || !user.userData.admin) {
        callback({redirect: "index", "note": {"message": "access.denied", "type": "danger"}});
        return;
    }
    var widget = null;
    var dir = __dirname + "/../..";
    switch (messageData.action) {
        case "install":
            if (os.platform() != "linux") {
                callback({"message": "widgets.install.error.platform", "type": "danger"});
                return;
            }
            exec("cd " + dir + " && sh startscripts/start-linux.sh stop && node src/main.js install-widget " + messageData.widget + " && startscripts/start-linux.sh start", null, function () {
                callback({"message": "widgets.update.progress", "type": "info"});
            });
            break;
        case "update":
            widget = Widget.get(messageData.widget);
            if (os.platform() != "linux" || !widget) {
                callback({"message": "widgets.update.error.platform", "type": "danger"});
                return;
            }
            exec("cd " + dir + " && sh startscripts/start-linux.sh stop && node src/main.js install-widget " + widget.manifest.repository + " && startscripts/start-linux.sh start", null, function () {
                callback({"message": "widgets.update.progress", "type": "info"});
            });
            break;
        default:
            var widgets = {};
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
            callback({
                "widgets": widgets
            });
    }
}

module.exports = View;