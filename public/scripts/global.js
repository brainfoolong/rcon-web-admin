"use strict";

/**
 * Socket connection stuff
 */
var Socket = {};

/** @type {WebSocket} */
Socket.con = null;

/** @type {function[]} */
Socket.callbacks = [];

/** @type {object} */
Socket.queue = [];

/** @type {object[]} */
Socket.onMessageEvents = {};

/**
 * Bind a callback to be triggered everytime a message is received
 * @param {string} id Just an identifier to later use offMessage to remove this callback
 * @param {nodeMessageCallback} callback
 */
Socket.onMessage = function (id, callback) {
    Socket.onMessageEvents[id] = callback;
};

/**
 * Unbind a previously added callback with given event name
 * @param {string} id The identifier used in onMessage
 */
Socket.offMessage = function (id) {
    Socket.onMessageEvents[id] = null;
};

/**
 * Connect to websocket
 * @param {function=} callback If connection is established
 */
Socket.connect = function (callback) {
    var con = new WebSocket('ws://localhost:4325');
    con.onopen = function () {
        Socket.con = con;
        Socket.send("init", null, function (messageData) {
            if (callback) callback(messageData);
            // send all messages in the queue
            for (var i in Socket.queue) {
                var q = Socket.queue[i];
                Socket.send(q.action, q.messageData, q.callback);
            }
            Socket.queue = [];
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
                        Socket.callbacks[data.callbackId](data.messageData);
                        Socket.callbacks[data.callbackId] = null;
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

    con.onclose = function (e) {
        Socket.con = null;
    };
};

/**
 * Send a command to the backend
 * @param {string} action
 * @param {=object} messageData
 * @param {=function} callback
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
        "login_name": Storage.get("login_name"),
        "loing_hash": Storage.get("login_hash")
    };
    Socket.callbacks.push(callback);
    Socket.con.send(JSON.stringify(data));
};

/**
 * Storage handling
 */
var Storage = {};

/**
 * Get data from storage
 * @param {string} key
 * @param {boolean=} session
 * @returns {*}
 */
Storage.get = function (key, session) {
    var storage = session ? sessionStorage : localStorage;
    var value = storage.getItem(key);
    return value !== null ? JSON.parse(value) : null;
};

/**
 * Set data in storage
 * @param {string} key
 * @param {*} value
 * @param {boolean=} session
 */
Storage.set = function (key, value, session) {
    var storage = session ? sessionStorage : localStorage;
    if (value === null) {
        storage.removeItem(key);
    } else {
        storage.setItem(key, JSON.stringify(value))
    }
};

/**
 * Just get a translation value for given key
 * @param {string} key
 * @param {object=} params
 * @return {string}
 */
function t(key, params) {
    return lang.get(key, params)
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
 * Show a note message on top
 * @param {string} message
 * @param {string=} type
 */
function note(message, type) {
    $.notify({
        "message": message
    }, {
        "type": typeof type == "undefined" ? "info" : type,
        placement: {
            from: "top",
            align: "center"
        },
    });
}

/**
 * Load a view
 * @param {string} view
 * @param {object=} messageData
 * @param {function=} callback
 */
function loadView(view, messageData, callback) {
    spinner("#content");
    if (!messageData) {
        messageData = {};
    }
    messageData.view = view;
    Socket.send("view", messageData, function (viewData) {
        console.log(viewData);
        $.get("views/" + view + ".html", function (htmlData) {
            var c = $("#content");
            c.html(htmlData);
            lang.replaceInHtml();
            $('.selectpicker').selectpicker();
            $.getJSON("views/" + view + ".js?callback=onLoad", function (viewResponseData) {
                if (callback) callback(viewResponseData);
            });
        });
    });
}

$(document).ready(function () {
    // do some hamburger and navigation magic
    (function () {
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
    })();

    // connect socket if user is online
    Socket.connect();

    var view = "index";
    if (window.location.hash) {
        view = window.location.hash.substr(1);
    }
    loadView(view);
});

$(document).on("click", ".page-link", function () {
    $(".hamburger.is-open").trigger("click");
    var view = $(this).attr("href");
    loadView(view.substr(1));
});

// here we have defined all possible callbacks just for the sake of IDE auto completion

/**
 * Node Message Callback
 * @callback nodeMessageCallback
 * @param {{action: string, messageData: *, callbackId: =int}} responseData
 */