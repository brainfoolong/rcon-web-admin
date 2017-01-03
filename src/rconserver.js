"use strict";

var Rcon = require(__dirname + "/rcon");
var Widget = require(__dirname + "/widget");
var db = require(__dirname + "/db");
var fs = require("fs");

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
    /** @type {string} */
    this.serverDbFolder = __dirname + "/../db/server_" + self.id;
    /** @type {string} */
    this.serverLogFile = this.serverDbFolder + "/messages.log";
    /** @type {number|null} */
    this.widgetIv = null;

    // require this here to not get a loop because websocketuser itself require the RconServer module
    var WebSocketUser = require(__dirname + "/websocketuser");

    /**
     * Temove this instance from server list
     * @param {boolean=} disconnect If true also do call disconnect
     */
    this.removeInstance = function (disconnect) {
        if (disconnect) {
            self.con.disconnect();
        } else {
            clearInterval(self.widgetIv);
            self.con = null;
            self.connected = false;
            delete RconServer.instances[self.id];
        }
    };

    /**
     * Send a command
     * @param {string} cmd
     * @param {WebSocketUser|null} user
     * @param {boolean} log If true than log this message to the server log file
     * @param {function} callback
     */
    this.cmd = function (cmd, user, log, callback) {
        if (this.connected) {
            this.con.send(cmd, user, log, function (result) {
                callback(result.toString());
            });
            return;
        }
        callback(false);
    };

    /**
     * Check if log is too big, cut it if necessary
     */
    this.logRoll = function () {
        try {
            var fileData = this.getLogData();
            // keep 1mb of logs and start progress if over 1.3mb
            var max = 1024 * 1024;
            if (fileData.length > max * 1.3) {
                fileData = fileData.toString().substr(-max);
                // find last first line end
                var i = fileData.indexOf("\n");
                if (i > -1) {
                    fileData = fileData.substr(i);
                }
                fs.writeFileSync(this.serverLogFile, fileData);
            }
        } catch (e) {

        }
    };

    /**
     * Get log messages
     * @return {Buffer}
     */
    this.getLogData = function () {
        try {
            return fs.readFileSync(this.serverLogFile).toString();
        } catch (e) {
            return new Buffer(0);
        }
    };

    /**
     * On receive a rcon socket message
     * @param {RconMessage} rconMessage
     */
    this.onServerMessage = function (rconMessage) {
        // if log is disabled or body is null than stop here
        if (rconMessage.log !== true || rconMessage.body.length == 0) return;
        var rconMessageJson = {
            "type": rconMessage.type,
            "body": rconMessage.body,
            "user": rconMessage.user ? rconMessage.user.userData.username : null,
            "server": rconMessage.server.id,
            "timestamp": rconMessage.timestamp.toString()
        };
        // push this message to all connected clients that have access to this server
        for (var i in WebSocketUser.instances) {
            var user = WebSocketUser.instances[i];
            var server = user.getServerById(self.id);
            if (server) {
                user.send("serverMessage", rconMessageJson);
            }
        }
        // also send to all active widgets
        Widget.callMethodForAllWidgetsIfActive("onServerMessage", this, rconMessage);
        // log to disk
        try {
            if (rconMessage.log === true) {
                fs.appendFileSync(this.serverLogFile, JSON.stringify(rconMessageJson) + "\n", "utf8");
            }
        } catch (e) {

        }
    };

    /**
     * Simulate the onServerMessage event by passing a simple string message
     * @param {string} message
     * @param {WebSocketUser=} user
     */
    this.injectServerMessage = function (message, user) {
        this.onServerMessage({
            "id": -1,
            "type": Rcon.SERVERDATA_RESPONSE_VALUE,
            "size": message.length,
            "log": true,
            "timestamp": new Date(),
            "user": user || null,
            "server": this,
            "body": message
        });
    };

    // on disconnect remove server from instances
    this.con.on("disconnect", function () {
        self.removeInstance();
    });

    // connect to server
    this.con.connect(function (err) {
        if (err) {
            console.trace(err);
            return;
        }
        // authenticate
        self.injectServerMessage("Rcon authentication by rcon web admin...");
        self.con.send(self.serverData.rcon_password, null, true, function (success) {
            self.injectServerMessage("Rcon authentication " + (success ? "successfull" : "invalid"));
            if (!success) {
                console.error("Invalid rcon password for server " + self.serverData.name + ":" + self.serverData.rcon_port);
                return;
            }
            self.connected = true;
            Widget.callMethodForAllWidgetsIfActive("onServerConnected", self);
        }, Rcon.SERVERDATA_AUTH);

        // catch errors
        self.con.on("error", function (err) {
            console.trace(err);
        });

        // on receive message
        self.con.on("message", function (rconMessage) {
            rconMessage.server = self;
            self.onServerMessage(rconMessage);
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
        for (var i in servers) {
            RconServer.get(servers[i].id);
        }
    }
};

/**
 * Get the server instance for given id
 * Connect to server if not yet connected
 * @param {string} id
 * @return {RconServer|null}
 */
RconServer.get = function (id) {
    if (RconServer.instances[id]) {
        return RconServer.instances[id];
    }
    var serverData = db.get("servers").get(id).cloneDeep().value();
    if (serverData) {
        RconServer.instances[id] = new RconServer(id, serverData);
        return RconServer.instances[id];
    }
    return null;
};

// connect to all servers and create an interval
RconServer.connectAll();
// check each x seconds connect to each server in the list
// if already connected than nothing happen
setInterval(RconServer.connectAll, 10000);

module.exports = RconServer;