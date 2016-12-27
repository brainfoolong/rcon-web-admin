"use strict";
/**
 * Node server to connect with websocket and rcon
 */

require(__dirname + "/routes");

var fs = require("fs");
var db = require(__dirname + "/db");
var WebSocketServer = require("ws").Server;
var Rcon = require(__dirname + "/rcon");
var pjson = require(__dirname + "/../package.json");

/**
 * A single server instance
 * @param {string} id
 * @param {object} serverData
 * @constructor
 */
function RconServer(id, serverData) {
    /** @type {RconServer} */
    var self = this;
    /** @type {string} */
    this.id = id;
    /** @type {object} */
    this.serverData = serverData;
    /** @type {Rcon} */
    this.con = new Rcon(serverData.host, serverData.rcon_port);
    /** @type {boolean} */
    this.connected = false;
    /** @type {{timestamp:string, message : string}} */
    this.messages = [];

    // on disconnect remove server from instances
    this.con.on("disconnect", function () {
        self.removeInstance();
    });

    /**
     * Temove this instance from server list
     * @param {boolean=} disconnect If true also do call disconnect
     */
    this.removeInstance = function (disconnect) {
        if (disconnect) {
            self.con.disconnect();
        }
        self.connected = false;
        RconServer.instances[id] = self;
    };

    /**
     * Send a command
     * @param {string} cmd
     * @param {function} callback
     */
    this.send = function (cmd, callback) {
        if (this.connected) {
            this.con.send(cmd, function (err, result) {
                if (err) {
                    console.error(err);
                    callback(false);
                    return;
                }
                callback(result.toString());
            });
            return;
        }
        callback(false);
    };

    this.con.connect(function (err) {
        if (err) {
            console.error(err);
            return;
        }
        self.con.send(self.serverData.rcon_password, function (err) {

            if (err) {
                console.error(err);
                return;
            }
            self.connected = true;
        }, Rcon.SERVERDATA_AUTH);

        self.con.on("message", function (data) {
            var str = data.body.toString();
            if (str && str.length) {
                var msg = {
                    "timestamp": new Date().toString(),
                    "message": str
                };
                self.messages.push(msg);
                self.messages = self.messages.slice(-200);
                // push this message to all connected clients that have access to this server
                for (var i in WebSocketUser.instances) {
                    const user = WebSocketUser.instances[i];
                    user.getServerById(self.id, function (server) {
                        if (server) {
                            user.send("server-message", msg);
                        }
                    });
                }
            }
        });
    });
}

/**
 * All opened server instances
 * @type {object<string, RconServer>}
 */
RconServer.instances = {};

/**
 * Connect to each servers in our pool
 */
RconServer.connectAll = function () {
    var servers = db.get("servers").value();
    if (servers) {
        for (var id in servers) {
            if (servers.hasOwnProperty(id)) {
                RconServer.get(id, function () {

                });
            }
        }
    }
};

/**
 * Get the server instance for given id
 * Connect to server if not yet connected
 * @param {string} id
 * @param {RconServerCallback} callback
 */
RconServer.get = function (id, callback) {
    if (typeof RconServer.instances[id] != "undefined") {
        callback(RconServer.instances[id]);
        return;
    }
    var serverData = dbServers.get(id).value();
    if (serverData) {
        RconServer.instances[id] = new RconServer(id, serverData);
        callback(RconServer.instances[id]);
        return;
    }
    callback(null);
};

// connect to all servers and create an interval
RconServer.connectAll();
// check each x seconds connect to each server in the list
// if already connected than nothing happen
setInterval(RconServer.connectAll, 10000);


/**
 * Some tools for web socket server management
 */
var WebSocketMgr = {};

/**
 * The socket server itself
 * @type {null|WebSocketServer}
 */
WebSocketMgr.server = null;

/**
 * Start the websocket server
 */
WebSocketMgr.startServer = function () {
    try {
        if (WebSocketMgr.server === null) {
            WebSocketMgr.server = new WebSocketServer({port: 4325});
            WebSocketMgr.server.on('connection', function connection(ws) {
                var user = new WebSocketUser(ws);
                ws.on('message', function incoming(message) {
                    try {
                        user.onMessage(JSON.parse(message));
                    } catch (e) {
                        console.error(e);
                    }
                });
                ws.on("close", function () {
                    try {
                        user.onMessage({"action": "closed"});
                    } catch (e) {
                        console.error(e);
                    }
                });
            });
            // if for some reason the server went down, restart it some seconds later
            WebSocketMgr.server.on('close', function close() {
                WebSocketMgr.server = null;
                WebSocketUser.instances = [];
            });
        }
    } catch (e) {
        console.error(e);
    }
};

// start websocket server and create an interval
WebSocketMgr.startServer();
// check each x seconds if the server is down and try to restart it
setInterval(WebSocketMgr.startServer, 10000);


/**
 * A single websocket user
 * @constructor
 */
var WebSocketUser = function (socket) {
    /** @type {WebSocketUser} */
    var self = this;
    /** @type {number|null} */
    this.id = null;
    /** @type {WebSocket} */
    this.socket = socket;
    /** @type {object} */
    this.userData = null;

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
                    if (!Object.keys(db.get("users").cloneDeep().value()).length) {
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
};

/**
 * All user instances
 * @type []
 */
WebSocketUser.instances = [];

// here we have defined all possible callbacks just for the sake of IDE auto completion

/**
 * RconServer Calback
 * @callback RconServerCallback
 * @param {RconServer|null} server
 */