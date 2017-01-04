"use strict";

var Widget = require(__dirname + "/../../../src/widget");
var steamapi = require(__dirname + "/../../../src/steamapi");

var widget = new Widget();

/**
 * On frontend message
 * @param {RconServer} server
 * @param {WebSocketUser} user
 * @param {string} action The action
 * @param {*} messageData Any message data received from frontend
 * @param {function} callback Pass an object as message data response for the frontend
 */
widget.onFrontendMessage = function (server, user, action, messageData, callback) {
    switch (action) {
        case "banstatus":
            steamapi.request("bans", messageData.ids, function (result) {
                callback(widget, result);
            });
            break;
    }
};

module.exports = widget;