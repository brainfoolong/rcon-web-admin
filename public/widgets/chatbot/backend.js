"use strict";

var Widget = require(__dirname + "/../../../src/widget");

var widget = new Widget();

/**
 * On receive a server message
 * @param {RconServer} server
 * @param {RconMessage} message
 */
widget.onServerMessage = function (server,  message) {
    var chatMsg = message.body.match(/^\[CHAT\] (.*?)\[([0-9]+)\/([0-9]+)\] \: (.*)/i);
    if (chatMsg) {

    }
};

module.exports = widget;