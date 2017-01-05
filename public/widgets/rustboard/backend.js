"use strict";

var Widget = require(__dirname + "/../../../src/widget");
var gametools = require(__dirname + "/../../../src/gametools");

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
        case "serverstatus":
            gametools.rust.serverstatus(server, function (result) {
                callback(widget, result);
            });
            break;
    }
};

module.exports = widget;