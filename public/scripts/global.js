"use strict";

var rwa = {};

// some values that will be set in the main layout view
rwa.translations = {};
rwa.language = "";
rwa.rootUrl = "";
rwa.settings = {};
rwa.version = "";
rwa.userWebsocketHash = "";

/**
 * Socket connection stuff
 */
rwa.socket = {};

/** @type {WebSocket} */
rwa.socket.con = null;

/** @type {function[]} */
rwa.socket.callbacks = [];

/** @type {object} */
rwa.socket.queue = [];

/** @type {object[]} */
rwa.socket.onMessageEvents = {};

/**
 * Bind a callback to be triggered everytime a message is received
 * @param {string} id Just an identifier to later use offMessage to remove this callback
 * @param {nodeMessageCallback} callback
 */
rwa.socket.onMessage = function (id, callback) {
    rwa.socket.onMessageEvents[id] = callback;
};

/**
 * Unbind a previously added callback with given event name
 * @param {string} id The identifier used in onMessage
 */
rwa.socket.offMessage = function (id) {
    rwa.socket.onMessageEvents[id] = null;
};

/**
 * Connect to websocket
 * @param {function} callback If connection is established
 */
rwa.socket.connect = function (callback) {
    var con = new WebSocket('ws://localhost:4325');
    con.onopen = function () {
        rwa.socket.con = con;
        rwa.socket.send("init", null, function (messageData) {
            callback(messageData);
            // send all messages in the queue
            for (var i in rwa.socket.queue) {
                var q = rwa.socket.queue[i];
                rwa.socket.send(q.action, q.messageData, q.callback);
            }
            rwa.socket.queue = [];
        });
    };

    con.onerror = function (error) {
        console.error('WebSocket Error ' + error);
    };

    con.onmessage = function (e) {
        if (e.data) {
            try {
                var data = JSON.parse(e.data);
                if (data.action) {
                    if (typeof data.callbackId != "undefined") {
                        rwa.socket.callbacks[data.callbackId](data.messageData);
                        rwa.socket.callbacks[data.callbackId] = null;
                    }
                    for (var i in rwa.socket.onMessageEvents) {
                        if (rwa.socket.onMessageEvents.hasOwnProperty(i)) {
                            var cb = rwa.socket.onMessageEvents[i];
                            if (typeof cb == "function") cb(data);
                        }
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }
    };

    con.onclose = function (e) {
        rwa.socket.con = null;
    };
};

/**
 * Send a command to the backend
 * @param {string} action
 * @param {=object} messageData
 * @param {=function} callback
 */
rwa.socket.send = function (action, messageData, callback) {
    if (!callback) callback = function () {
    };
    if (typeof messageData == "undefined") {
        messageData = null;
    }
    // if connection not yet established add to queue
    if (rwa.socket.con === null) {
        rwa.socket.queue.push({
            "action": action,
            "messageData": messageData,
            "callback": callback
        });
        return;
    }
    var data = {
        "action": action,
        "callbackId": rwa.socket.callbacks.length,
        "messageData": messageData,
        "userWebsocketHash": rwa.userWebsocketHash
    };
    rwa.socket.callbacks.push(callback);
    rwa.socket.con.send(JSON.stringify(data));
};

$(document).ready(function () {

    $.notify({
        // options
        message: 'Hello World'
    },{
        // settings
        type: 'danger',
        placement: {
            from: "top",
            align: "center"
        },
    });

    // do some hamburger and navigation magic
    var trigger = $('.hamburger'),
        overlay = $('.overlay'),
        isClosed = false;

    trigger.click(function () {
        hamburger_cross();
    });

    function hamburger_cross() {

        if (isClosed == true) {
            overlay.hide();
            trigger.removeClass('is-open');
            trigger.addClass('is-closed');
            isClosed = false;
        } else {
            overlay.show();
            trigger.removeClass('is-closed');
            trigger.addClass('is-open');
            isClosed = true;
        }
    }

    $('[data-toggle="offcanvas"]').click(function () {
        $('#wrapper').toggleClass('toggled');
    });

    // init selectpicker
    $('.selectpicker').selectpicker();

    // remove the page-container spinner and show content
    $(".spinner-container").remove();
    $(".page-content").removeClass("hidden");

    checkForUpdate(function (data) {
        if (data && data.version != rwa.version) {
            $(".top-logo .update").removeClass("hidden");
        }
    });

    // connect socket if user is online
    if (rwa.userWebsocketHash.length) {
        rwa.socket.connect(function () {

        });
    }
});

/**
 * Translate
 *
 * @param {string} key
 * @param {=object} parameters
 * @return string
 */
function t(key, parameters) {
    var value = key;
    if (typeof rwa.translations[rwa.language] !== "undefined"
        && typeof rwa.translations[rwa.language][key] !== "undefined") {
        value = rwa.translations[rwa.language][key];
    } else {
        if (typeof rwa.translations["en"][key] !== "undefined") {
            value = rwa.translations["en"][key];
        }
    }
    if (parameters) {
        for (var i in parameters) {
            value = value.replace(new RegExp("{" + i + "}", "ig"),
                parameters[i]);
        }
    }
    return value;
}

/**
 * Display a loading spinner in a given element
 * @param {string|jQuery} el
 */
function spinner(el) {
    el = $(el);
    el.append('<div class="spinner">' +
        '<div class="bounce1"></div>' +
        '<div class="bounce2"></div>' +
        '<div class="bounce3"></div>' +
        '</div>');
}

/**
 * Get url query parameter
 * @param {string} name
 * @returns {string}
 */
function getParameterByName(name) {
    var url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return "";
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

/**
 * Check for version update
 * @param {=function} callback
 */
function checkForUpdate(callback) {
    $.getJSON(rwa.rootUrl + "/index.php/settings?check-update=1", callback);
}

/**
 *
 * @type {{action: string, messageData: {}, callbackId: number}}
 */
var data = {
    action : "",
    messageData : {},
    callbackId : 1
}

// here we have defined all possible callbacks just for the sake of IDE auto completion

/**
 * Node Message Callback
 * @callback nodeMessageCallback
 * @param {{action: string, messageData: *, callbackId: =int}} responseData
 */