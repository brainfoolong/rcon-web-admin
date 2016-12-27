"use strict";

/**
 * Simple view management
 */
var View = {};

/**
 * All registeres views
 * @type {object}
 */
View.views = {};

/**
 * Register a view handler
 * @param {string} name
 * @param {function} handler
 */
View.register = function (name, handler) {
    View.views[name] = handler;
};

/**
 * Get view data by current hash
 * @param {string=} hash
 * @returns {{view: string, messageData: *}}
 */
View.getViewDataByHash = function (hash) {
    var messageData = null;
    var view = null;
    hash = hash || window.location.hash;
    if (hash) {
        view = hash.substr(1);
        var viewSplit = view.split("-");
        view = viewSplit[0];
        if (viewSplit[1]) {
            messageData = JSON.parse(atob(viewSplit[1]));
        }
    }
    return {"view": view, "messageData": messageData};
};

/**
 * Change current hash in url, using pushState to be later able to detect back button
 * @param {string} newHash
 */
View.changeHash = function (newHash) {
    if (window.location.hash != "#" + newHash) {
        history.pushState({hash: newHash}, null, window.location.href.replace(/\#.*/ig, "") + "#" + newHash);
    }
};

/**
 * Get json message string for use in html links
 * @param {object} data
 * @returns {string}
 */
View.getJsonMessage = function (data) {
    return btoa(JSON.stringify(data));
};

/**
 * Load given view
 * @param {string} view
 * @param {object=} messageData
 * @param {function=} callback
 */
View.load = function (view, messageData, callback) {
    var initialMessageData = messageData;
    if (!messageData) messageData = {};
    messageData.view = view;
    var c = $("#content");
    c.html('');
    spinner(c);
    Socket.send("view", messageData, function (viewData) {
        if (viewData.note) {
            note(viewData.note[0], viewData.note[1]);
        }
        var loadCallback = function () {
            var hash = viewData.view;
            // only change the hash if no form data has been sent back or if redirect is given
            if (viewData.redirect) {
                View.changeHash(viewData.redirect);
            } else if (!viewData.form) {
                if (!viewData.form && initialMessageData) {
                    hash = hash + "-" + View.getJsonMessage(initialMessageData);
                }
                View.changeHash(hash);
            }
            $.get("views/" + viewData.view + ".html", function (htmlData) {
                c.html(htmlData);
                // set body classes for login and admin checks
                var b = $("body");
                b.removeClass("is-not-logged-in is-logged-in is-not-admin is-admin");
                if (viewData.sessionUserData) {
                    b.addClass("is-logged-in");
                    if (viewData.sessionUserData.admin) {
                        b.addClass("is-admin");
                    } else {
                        b.addClass("is-not-admin");
                    }
                } else {
                    b.addClass("is-not-logged-in is-not-admin");
                }
                // load view
                View.views[viewData.view](viewData);
                if (callback) callback(viewData);
                // replace language keys
                lang.replaceInHtml();
                // init selectpicker
                $('.selectpicker').selectpicker();
            });
        };
        if (typeof View.views[viewData.view] == "undefined") {
            $.getScript("views/" + viewData.view + ".js", loadCallback);
        } else {
            loadCallback();
        }
    });
};