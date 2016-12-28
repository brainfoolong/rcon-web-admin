"use strict";

/**
 * Socket stuff
 */
var Socket = {};

/** @type {WebSocket} */
Socket.con = null;

/** @type {function[]} */
Socket.callbacks = [];

/** @type {object} */
Socket.queue = [];

/** @type {[]} */
Socket.onMessageEvents = [];

/**
 * Bind a callback to be triggered everytime a message is received
 * @param {NodeMessageCallback} callback
 */
Socket.onMessage = function (callback) {
    Socket.onMessageEvents.push(callback);
};
/**
 * Unbind a callback
 * @param {NodeMessageCallback} callback
 */
Socket.offMessage = function (callback) {
    var index = Socket.onMessageEvents.indexOf(callback);
    if(index > -1){
        Socket.onMessageEvents.slice(index, 1);
    }
};

/**
 * Connect to websocket
 * @param {function=} callback If connection is established
 */
Socket.connect = function (callback) {
    var con = new WebSocket('ws://localhost:4325');
    /**
     * On open connection
     */
    con.onopen = function () {
        Socket.con = con;
        // send init ping to backend
        Socket.send("init", null, function () {
            if (callback) callback();
            // send all messages in the queue
            for (var i in Socket.queue) {
                var q = Socket.queue[i];
                Socket.send(q.action, q.messageData, q.callback);
            }
            Socket.queue = [];
        });
    };

    /**
     * On websocket error
     * @param error
     */
    con.onerror = function (error) {
        console.error('WebSocket Error ' + error);
    };

    /**
     * On message received from backend
     */
    con.onmessage = function (e) {
        if (e.data) {
            try {
                var data = JSON.parse(e.data);
                if (data.action) {
                    if (typeof data.callbackId != "undefined") {
                        if (Socket.callbacks[data.callbackId] === null) {
                            console.error("No socket callback for id " + data.callbackId + ", maybe dupe callback in backend?");
                        } else {
                            Socket.callbacks[data.callbackId](data.messageData);
                            Socket.callbacks[data.callbackId] = null;
                        }
                    }
                    for (var i in Socket.onMessageEvents) {
                        if (Socket.onMessageEvents.hasOwnProperty(i)) {
                            var cb = Socket.onMessageEvents[i];
                            if (typeof cb == "function") cb(data);
                        }
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }
    };

    /**
     * On connection close
     */
    con.onclose = function () {
        Socket.con = null;
        // try reconnect
        note("socket.disconnect", "danger");
        spinner("#content");
        setTimeout(function () {
            Socket.connectAndLoadView();
        }, 5000);
    };
};

/**
 * Connect to socket and load view for current url hash
 */
Socket.connectAndLoadView = function () {
    Socket.connect(function () {
        var view = "index";
        var messageData = null;
        if (window.location.hash) {
            var hashData = View.getViewDataByHash();
            view = hashData.view;
            if (hashData.messageData) messageData = hashData.messageData;
        }
        View.load(view, messageData);
    });
};

/**
 * Send a command to the backend
 * @param {string} action
 * @param {object=} messageData
 * @param {function=} callback
 */
Socket.send = function (action, messageData, callback) {
    if (!callback) callback = function () {
    };
    if (typeof messageData == "undefined") {
        messageData = null;
    }
    // if connection not yet established add to queue
    if (Socket.con === null) {
        Socket.queue.push({
            "action": action,
            "messageData": messageData,
            "callback": callback
        });
        return;
    }
    var data = {
        "action": action,
        "callbackId": Socket.callbacks.length,
        "messageData": messageData,
        "loginName": Storage.get("loginName"),
        "loginHash": Storage.get("loginHash")
    };
    Socket.callbacks.push(callback);
    Socket.con.send(JSON.stringify(data));
};