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
 * @returns {{view: string, messageData: *}}
 */
View.getViewDataByHash = function () {
    var messageData = null;
    var view = null;
    if (window.location.hash) {
        view = window.location.hash.substr(1);
        var viewSplit = view.split("-");
        view = viewSplit[0];
        if (viewSplit[1]) {
            messageData = JSON.parse(atob(viewSplit[1]));
        }
    }
    return {"view": view, "messageData": messageData};
};

/**
 * Load given view
 * @param {string} view
 * @param {object=} messageData
 * @param {function=} callback
 */
View.load = function (view, messageData, callback) {
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
            // change hash if view is different
            var hashData = View.getViewDataByHash();
            if (!hashData.view || viewData.view != hashData.view) {
                window.location.hash = "#" + viewData.view;
            }
            if (viewData.redirect) {
                window.location.hash = "#" + viewData.redirect;
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