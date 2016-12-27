"use strict";

var db = require(__dirname + "/db");

/**
 * A single websocket user
 * @constructor
 */
function WebSocketUser(socket) {
    /** @type {WebSocketUser} */
    var self = this;
    /** @type {number|null} */
    this.id = null;
    /** @type {WebSocket} */
    this.socket = socket;
    /** @type {object} */
    this.userData = null;

    // require this here to not get a loop because rconserver itself require the websocketuser module
    var RconServer = require(__dirname + "/rconserver");

    /**
     * Send message to client
     * @param {string} action
     * @param {=object} messageData
     * @param {=int} callbackId
     */
    this.send = function (action, messageData, callbackId) {
        if (self.socket) {
            if (typeof messageData == "undefined") {
                messageData = null;
            }
            var data = {
                "action": action,
                "messageData": messageData
            };
            if (typeof callbackId == "number") {
                data.callbackId = callbackId;
            }
            self.socket.send(JSON.stringify(data));
        }
    };

    /**
     * On receive message from socket
     * @param {object} responseData
     */
    this.onMessage = function (responseData) {
        // this will be called when message verification is done
        var verificationDone = function () {
            // just send a message to the user for the callback in the frontend
            var sendCallback = function (sendMessageData) {
                if (!sendMessageData) sendMessageData = {};
                if (!sendMessageData.sessionUserData && self.userData !== null) {
                    sendMessageData.sessionUserData = {
                        "username": self.userData.username,
                        "loginHash": self.userData.loginHash,
                        "admin": self.userData.admin
                    };
                }
                self.send(responseData.action, sendMessageData, responseData.callbackId);
            };
            var messageData = responseData.messageData;
            switch (responseData.action) {
                case "view":
                    if (!db.get("users").size().value()) {
                        // if no user exist, force user admin panel
                        messageData.view = "users";
                    } else if (self.userData === null) {
                        // if not logged in, force login page
                        messageData.view = "login";
                    }
                    var View = require(__dirname + "/views/" + messageData.view);
                    View(self, messageData, function (viewData) {
                        if (!viewData) viewData = {};
                        viewData.view = messageData.view;
                        if (viewData.redirect) {
                            viewData.view = viewData.redirect;
                        }
                        if (messageData.form) {
                            viewData.form = messageData.form;
                        }
                        if (messageData.btn) {
                            viewData.btn = messageData.btn;
                        }
                        sendCallback(viewData);
                    });
                    break;
                case "server-reload":
                    if (self.userData && self.userData.admin) {
                        self.getServerById(messageData.id, function (server) {
                            if (server) {
                                server.removeInstance(true);
                                RconServer.connectAll();
                                sendCallback(true);
                                return;
                            }
                            sendCallback(false);
                        });
                        return;
                    }
                    sendCallback(false);
                    break;
                case "server-messages":
                    self.getServerById(messageData.id, function (server) {
                        if (server) {
                            sendCallback(server.messages);
                            return;
                        }
                        sendCallback(false);
                    });
                    break;
                case "cmd":
                    self.getServerById(messageData.id, function (server) {
                        if (server) {
                            server.send(messageData.cmd, function (serverMessage) {
                                sendCallback(serverMessage);
                            });
                            return;
                        }
                        sendCallback(false);
                    });
                    break;
                case "closed":
                    delete WebSocketUser.instances[self.id];
                    self.socket = null;
                    self.userData = null;
                    break;
                default:
                    sendCallback();
                    break;
            }
        };

        // everytime a request comes in, validate the user
        // after that go ahead with message processing
        var users = db.get("users").get().cloneDeep().value();
        // invalidate userdata and check against stored users
        self.userData = null;
        if (responseData.loginHash && responseData.loginName) {
            var userData = db.get("users").find({
                "username": responseData.loginName,
                "loginHash": responseData.loginHash
            }).cloneDeep().value();
            if (userData) {
                self.userData = userData;
                // add instance of this is a complete new user
                if (self.id === null) {
                    self.id = WebSocketUser.instances.length;
                    WebSocketUser.instances.push(self);
                }
                verificationDone();
                return;
            }
        }
        verificationDone();
    };

    /**
     * Get a server instance by id, only if this user is in the list of assigned users
     * Admins can get all server instances
     * @param {string} id
     * @param {RconServerCallback} callback
     */
    this.getServerById = function (id, callback) {
        if (self.userData === null) {
            callback(null);
            return;
        }
        RconServer.get(id, function (server) {
            if (!server) {
                callback(null);
                return;
            }
            if (self.userData && self.userData.admin) {
                callback(server);
                return;
            }
            var users = server.serverData.users.split(",");
            if (users) {
                for (var id in users) {
                    if (users[id] == self.userData.username) {
                        callback(server);
                        return;
                    }
                }
            }
            callback(null);
        });
    };
}

/**
 * All user instances
 * @type []
 */
WebSocketUser.instances = [];

module.exports = WebSocketUser;