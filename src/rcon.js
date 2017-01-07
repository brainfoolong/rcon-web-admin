"use strict";

var net = require("net");
var events = require("events");
var base64 = require(__dirname + "/base64");

/**
 * RCON socket connection
 */
function Rcon(host, port, server) {
    events.EventEmitter.call(this);

    /**
     * Server hostname.
     * @type {string}
     */
    this.host = host;

    /**
     * Server RCON port.
     * @type {number}
     */
    this.port = port;

    /**
     * The server instance
     * @type {RconServer}
     */
    this.server = server;

    /**
     * Next packet id.
     * @type {number}
     */
    this.packetId = 1;

    /**
     * The auth callback
     * @type {function|null}
     */
    this.authCallback = null;

    /**
     * Callback store.
     * @type {[]}
     */
    this.callbacks = [];

    /**
     * RCON connection.
     * @type {net.Socket}
     */
    this.socket = null;

    /**
     * Receive data buffer
     * @type {Buffer}
     */
    this.dataBuffer = new Buffer(0);

    /**
     * The received body buffer
     * @type string
     */
    this.bodyBuffer = new Buffer(0);

    /**
     * Send queue
     * @type {Array}
     */
    this.queue = [];

    /**
     * If send is blocked
     * @type {boolean}
     */
    this.sendBlocked = false;

    /**
     * Process queue send
     */
    this.processQueue = function () {
        if (!this.queue.length) return;
        // a minimal delay because sending multiple request quickly will swallow some of them
        var self = this;
        var nextQueue = self.queue.shift();
        self.send.apply(self, nextQueue);
    };
}

Rcon.prototype = Object.create(events.EventEmitter.prototype);

Rcon.SERVERDATA_RESPONSE_VALUE = 0;
Rcon.SERVERDATA_AUTH_RESPONSE = 2;
Rcon.SERVERDATA_EXECCOMMAND = 2;
Rcon.SERVERDATA_AUTH = 3;
Rcon.SERVERDATA_LOG = 4;

/**
 * Get next packetid
 * @return {number}
 */
Rcon.prototype.nextPacketId = function () {
    var id = this.packetId;
    id = ((id + 1) & 0xFFFFFFFF) | 0;
    if (id === -1) id++;
    if (id === 0) id++;
    return id;
};

/**
 * Connect to server
 * @param {function=} callback
 * @returns {boolean} false if connection already established
 */
Rcon.prototype.connect = function (callback) {
    if (this.socket) return false;
    var self = this;

    this.socket = new net.Socket();
    // initial timeout is 10 seconds, if server is connected than unset this timeout
    this.socket.setTimeout(10 * 1000);

    this.socket.on("error", function (err) {
        if (callback) callback(err);
        this.disconnect();
    }.bind(this));

    this.socket.on("timeout", function () {
        var serverName = self.server.serverData.host + ":" + self.server.serverData.rcon_port;
        console.error(new Date(), "RconServer [" + serverName + "]: Connection timed out");
        this.disconnect();
    }.bind(this));

    this.socket.on("end", function () {
        this.disconnect();
    }.bind(this));

    this.socket.connect(this.port, this.host, function (err) {
        this.socket.setTimeout(0);
        this.socket.on("data", function (data) {
            this.dataBuffer = Buffer.concat([this.dataBuffer, data]);
            this._data();
        }.bind(this));
        if (callback) callback(null);
        this.emit("connect");
    }.bind(this));
    return true;
};

/**
 * Send a commant to the server
 * @param {string|Buffer} cmd Command to execute
 * @param {WebSocketUser|null} user
 * @param {boolean} log If true than log this message to the server log file
 * @param {function} callback Callback
 * @param {number=} type Message type
 */
Rcon.prototype.send = function (cmd, user, log, callback, type) {
    // it could happen that we send multiple requests at once without receiving data inbetween
    // this will swallow the send request
    // we fix this by queue send requests and processing them only after we received some data
    if (this.sendBlocked) {
        this.queue.push(Array.prototype.slice.call(arguments));
        return;
    }
    this.sendBlocked = true;
    if (typeof type !== 'number') {
        type = Rcon.SERVERDATA_EXECCOMMAND;
    }
    if (!this.socket) {
        process.nextTick(function () {
            var err = new Error("Not connected");
            callback(err);
            this.emit("error", err);
        });
        return;
    }
    if (!Buffer.isBuffer(cmd)) {
        cmd = new Buffer(cmd);
    }
    // for auth request we handle a special callback
    if (type == Rcon.SERVERDATA_AUTH) {
        this.authCallback = callback;
    } else {
        this.callbacks.push({
            "callback": callback,
            "user": user,
            "log": log
        });
    }
    // write request
    var self = this;
    self.socket.write(self._pack(this.packetId, type, cmd), null, function () {
        self.packetId = self.nextPacketId();
        // write an extra empty request to be able to find multipart message boundings
        if (type != Rcon.SERVERDATA_AUTH) {
            self.socket.write(self._pack(self.packetId, Rcon.SERVERDATA_RESPONSE_VALUE, new Buffer(0)));
            self.packetId = self.nextPacketId();
        }
    });
};

/**
 * Disconnect
 * @returns {boolean} false if already disconnected
 */
Rcon.prototype.disconnect = function () {
    if (!this.socket) return false;
    this.socket.removeAllListeners();
    // blind error handler, we don't care about those error's anymore
    // if we don't add this, it will result in uncatched error
    this.socket.on("error", function () {

    });
    this.socket.end();
    this.socket = null;
    this.emit("disconnect");
    return true;
};

/**
 * On receive a data message from socket
 * @link https://developer.valvesoftware.com/wiki/Source_RCON_Protocol
 * @private
 */
Rcon.prototype._data = function () {
    var serverName = this.server.serverData.host + ":" + this.server.serverData.rcon_port;
    while (this.dataBuffer.length >= 12) {
        var size = this.dataBuffer.readInt32LE(0);
        if (this.dataBuffer.length < 4 + size) break;
        var response = {
            "size": size,
            "id": this.dataBuffer.readInt32LE(4),
            "type": this.dataBuffer.readInt32LE(8),
            "body": this.dataBuffer.slice(12, 4 + size - 2),
            "user": null,
            "timestamp": new Date(),
            "log": true
        };

        // console.log("response", response.id, response.type, response.body.length);

        // SERVERDATA_RESPONSE_VALUE is the response to SERVERDATA_EXECCOMMAND
        // so we collect buffer information everytime we have such a request
        if (response.id >= 0 && response.type == Rcon.SERVERDATA_RESPONSE_VALUE) {
            this.bodyBuffer = Buffer.concat([this.bodyBuffer, response.body]);
        }

        // auth response is special handled, just callback if success auth or not
        if (response.type == Rcon.SERVERDATA_AUTH_RESPONSE) {
            if (this.authCallback) this.authCallback(response.id !== -1);
        } else if (response.type == Rcon.SERVERDATA_RESPONSE_VALUE && response.body.length === 0) {
            // if we receive an empty package than the SERVERDATA_EXECCOMMAND is finally done
            var cb = this.callbacks.shift();
            if (cb) {
                try {
                    if (cb.callback) cb.callback(base64.decode(this.bodyBuffer.toString("base64")));
                } catch (e) {
                    console.error(new Date(), "RconServer [" + serverName + "]: send callback error", e, e.stack);
                }
                this.bodyBuffer = new Buffer(0);
            }
            this.sendBlocked = false;
            this.processQueue();
        }
        // do buffer to base64 and than manually with our own decode function to utf8
        // node buffer does it in the wrong way
        response.body = base64.decode(response.body.toString("base64"));
        // just pipe each raw response to the event listener
        this.emit("message", response);

        // reduce buffer and go ahead in while
        this.dataBuffer = this.dataBuffer.slice(4 + size, this.dataBuffer.length);
    }
};

/**
 * Create a packet to send to server
 * @param {number} id
 * @param {number} type
 * @param {Buffer} body
 * @returns {Buffer}
 * @private
 */
Rcon.prototype._pack = function (id, type, body) {
    var buf = new Buffer(body.length + 14);
    buf.writeInt32LE(body.length + 10, 0);
    buf.writeInt32LE(id, 4);
    buf.writeInt32LE(type, 8);
    body.copy(buf, 12);
    buf[buf.length - 2] = 0;
    buf[buf.length - 1] = 0;
    return buf;
};

/**
 * The rcon message response data
 * @typedef {object} RconMessage
 * @property {number} id Response id
 * @property {number} size Response size
 * @property {number} type Response type
 * @property {string} body Response body
 * @property {boolean} log Indicates if this should be logged to disk
 * @property {Date} timestamp The timestamp
 * @property {WebSocketUser|null} user The user that have made the request for this response
 * @property {RconServer} server The server for this message
 */

module.exports = Rcon;