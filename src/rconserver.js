"use strict";

var Rcon = require(__dirname + "/rcon");
var db = require(__dirname + "/db");

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
    this.messages = []

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
        }else{
            self.connected = false;
            delete RconServer.instances[self.id];
        }
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
        for (var i in servers) {
            RconServer.get(servers[i].id, function () {

            });
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
    if (RconServer.instances[id]) {
        callback(RconServer.instances[id]);
        return;
    }
    var serverData = db.get("servers").get(id).cloneDeep().value();
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

// here we have defined all possible callbacks just for the sake of IDE auto completion
/**
 * RconServer Calback
 * @callback RconServerCallback
 * @param {RconServer|null} server
 */

module.exports = RconServer;