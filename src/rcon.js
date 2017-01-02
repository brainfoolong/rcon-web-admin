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
     * @type {{}}
     */
    this.callbacks = {};

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
     * The last valid response id
     * @type {number}
     */
    this.lastResponseId = 0;
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
 * @param {WebSocketUser|null} user
 * @param {boolean} log If true than log this message to the server log file
 * @param {function} callback Callback
 * @param {number=} type Message type
 */
Rcon.prototype.send = function (cmd, user, log, callback, type) {
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
        this.callbacks[this.packetId] = {
            "callback": callback,
            "user": user,
            "log": log
        };
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
        var response = {
            "size": size,
            "id": this.dataBuffer.readInt32LE(4),
            "type": this.dataBuffer.readInt32LE(8),
            "body": this.dataBuffer.slice(12, 4 + size - 2),
            "user" : null,
            "timestamp" : new Date(),
            "log" : true
        };

        // SERVERDATA_RESPONSE_VALUE is the response to SERVERDATA_EXECCOMMAND
        // so we collect buffer information everytime we have such a request
        if (response.id > 0 && response.type == Rcon.SERVERDATA_RESPONSE_VALUE) {
            this.lastResponseId = response.id;
            this.bodyBuffer = Buffer.concat([this.bodyBuffer, response.body]);
        }

        // get user to the response if possible
        if (response.id > 0 && typeof this.callbacks[response.id] != "undefined") {
            response.user = this.callbacks[response.id].user || null;
            response.log = this.callbacks[response.id].log === true;
        }

        // auth response is special handled, just callback if success auth or not
        if (response.type == Rcon.SERVERDATA_AUTH_RESPONSE) {
            if (this.authCallback) this.authCallback(response.id !== -1);
        }
        // if we receive an empty package than the SERVERDATA_EXECCOMMAND is finally done
        if (response.type == Rcon.SERVERDATA_RESPONSE_VALUE && response.body.length === 0 && this.lastResponseId > 0) {
            if (typeof this.callbacks[this.lastResponseId] != "undefined") {
                var cb = this.callbacks[this.lastResponseId];
                delete this.callbacks[this.lastResponseId];
                if (cb.callback) cb.callback(this.bodyBuffer);
                this.bodyBuffer = new Buffer(0);
                this.lastResponseId = 0;
            }
        }
        response.body = response.body.toString();
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