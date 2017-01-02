"use strict";

var Widget = require(__dirname + "/../../../src/widget");

var widget = new Widget();

/**
 * On rcon server has successfully connected and authenticated
 * @param {RconServer} server
 */
widget.onServerConnected = function (server) {

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

};

/**
 * On widget update cycle - Fired every 10 seconds for each server
 * @param {RconServer} server
 */
widget.onUpdate = function (server) {

};

module.exports = widget;