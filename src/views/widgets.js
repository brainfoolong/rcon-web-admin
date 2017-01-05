"use strict";

var Widget = require(__dirname + "/../widget");

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
        callback({redirect: "index", "note": ["access.denied", "danger"]});
        return;
    }
    var widget = null;
    switch (messageData.action) {
        case "update":
            widget = Widget.get(messageData.widget);
            if (widget) {
                Widget.install(messageData.widget, callback);
                return;
            }
            callback(false);
            break;
        case "delete":
            widget = Widget.get(messageData.widget);
            if (widget) {
                Widget.delete(widget.id);
                return;
            }
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
                "widgets": widgets,
                "defaultWidgets": Widget.defaultWidgets
            });
    }
}

module.exports = View;