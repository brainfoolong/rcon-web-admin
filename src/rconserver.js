"use strict";

var Rcon = require(__dirname + "/rcon");
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
    this.serverLogFile = __dirname + "/../db/serverlog_" + self.id + ".log";

    // require this here to not get a loop because websocketuser itself require the RconServer module
    var WebSocketUser = require(__dirname + "/websocketuser");

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
        } else {
            self.con = null;
            self.connected = false;
            delete RconServer.instances[self.id];
        }
    };

    /**
     * Send a command
     * @param {string} cmd
     * @param {string|null} username
     * @param {function} callback
     */
    this.send = function (cmd, username, callback) {
        if (this.connected) {
            this.con.send(cmd, self.id, username, function (result) {
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
            // keep 1mb of logs
            var max = 1024 * 1024;
            if (fileData.length > max) {
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
     * Log message to disk and notify each connected user
     * @param {string} message
     * @param {string=} username
     */
    this.logMessage = function (message, username) {
        var msg = {
            "server": self.id,
            "timestamp": new Date().toString(),
            "message": message,
            "username": username
        };
        // push this message to all connected clients that have access to this server
        for (var i in WebSocketUser.instances) {
            var user = WebSocketUser.instances[i];
            var server = user.getServerById(self.id);
            if (server) {
                user.send("server-message", msg);
            }
        }
        // log to disk
        fs.appendFileSync(this.serverLogFile, JSON.stringify(msg) + "\n", "utf8");
    };

    // connect to server
    this.con.connect(function (err) {
        if (err) {
            console.trace(err);
            return;
        }
        // authenticate
        self.con.send(self.serverData.rcon_password, self.id, null, function (success) {
            if (!success) {
                console.error("Invalid rcon password for server " + self.serverData.name + ":" + self.serverData.rcon_port);
                return;
            }
            self.connected = true;
        }, Rcon.SERVERDATA_AUTH);

        // catch errors
        self.con.on("error", function (err) {
            console.trace(err);
        });

        // on receive message
        self.con.on("message", function (data) {
            var str = data.body.toString();
            if (str && str.length) {
                self.logMessage(str);
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