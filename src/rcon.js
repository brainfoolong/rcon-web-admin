"use strict";

var net = require("net");
var events = require("events");

/**
 * RCON socket connection
 */
function Rcon(host, port) {
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
     * @type object[]
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
     * Just an empty buffer to compare
     * @type {Buffer}
     */
    this.emptyBuffer = new Buffer(0);
};

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
    this.socket = new net.Socket();

    this.socket.on("error", function (err) {
        if (callback) callback(err);
        this.disconnect();
    }.bind(this));

    this.socket.on("end", function () {
        this.disconnect();
    }.bind(this));

    this.socket.connect(this.port, this.host, function (err) {
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
 * @param {string} server
 * @param {string|null} username
 * @param {function} callback Callback
 * @param {number=} type Message type
 */
Rcon.prototype.send = function (cmd, server, username, callback, type) {
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
        cmd = new Buffer(cmd, "ascii");
    }
    // for auth request we handle a special callback
    if (type == Rcon.SERVERDATA_AUTH) {
        this.authCallback = callback;
    } else {
        if (callback) {
            this.callbacks.push({
                "id": this.packetId,
                "server": server,
                "callback": callback,
                "username": username
            });
        }
    }
    // write request
    this.socket.write(this._pack(this.packetId, type, cmd));
    this.packetId = this.nextPacketId();

    // write extra empty request to be able to find multipart message boundings
    if (type != Rcon.SERVERDATA_AUTH) {
        this.socket.write(this._pack(this.packetId, Rcon.SERVERDATA_RESPONSE_VALUE, new Buffer(0)));
        this.packetId = this.nextPacketId();
    }

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
    while (this.dataBuffer.length >= 12) {

        var size = this.dataBuffer.readInt32LE(0);
        if (this.dataBuffer.length < 4 + size) break;

        var id = this.dataBuffer.readInt32LE(4);
        var type = this.dataBuffer.readInt32LE(8);
        var body = this.dataBuffer.slice(12, 4 + size - 2);

        this.bodyBuffer = Buffer.concat([this.bodyBuffer, body]);
        if (type == Rcon.SERVERDATA_AUTH_RESPONSE) {
            if (this.authCallback) this.authCallback(id !== -1);
        } else if (type == Rcon.SERVERDATA_RESPONSE_VALUE && body.length === 0) {
            if (this.callbacks.length) {
                var cb = this.callbacks.shift();
                cb.callback(this.bodyBuffer);
                //var RconServer = require(__dirname + "/rconserver");
                //var server = RconServer.get(cb.server);
                // if (this.bodyBuffer.length) server.logMessage(this.bodyBuffer.toString(), cb.username);
                this.bodyBuffer = new Buffer(0);
                //this.dataBuffer = this.dataBuffer.slice(4 + size, this.dataBuffer.length);
                //continue;
            }
        }
        // just pipe each not catched raw body to the event listener
        this.emit("message", {
            size: size,
            id: id,
            type: type,
            body: body
        });

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
}

module.exports = Rcon;