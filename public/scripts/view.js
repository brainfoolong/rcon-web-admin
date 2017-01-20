"use strict";

/**
 * Simple view management
 */
var View = {};

/**
 * The most recent loaded view
 * @type {string}
 */
View.current = "";

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
            messageData = View.parseAttributeMessage(viewSplit[1]);
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
View.getAttributeMessage = function (data) {
    var msg = [];
    for (var dataIndex in data) {
        if (data.hasOwnProperty(dataIndex)) {
            var dataRow = data[dataIndex];
            msg.push(dataIndex + ":" + dataRow);
        }
    }
    return msg.join(",");
};

/**
 * Parse a attribute message to object
 * @param {string} str
 * @returns {{}}
 */
View.parseAttributeMessage = function (str) {
    var strSpl = str.split(",");
    var o = {};
    for (var i = 0; i < strSpl.length; i++) {
        var param = strSpl[i];
        var m = param.split(":", 2);
        o[m[0]] = m[1];
    }
    return o;
};

/**
 * Load given view
 * @param {string} view
 * @param {object=} messageData
 * @param {function=} callback
 */
View.load = function (view, messageData, callback) {
    // remove all widgets on loading a view
    for (var widgetIndex in Widget.widgets) {
        if (Widget.widgets.hasOwnProperty(widgetIndex)) {
            var widgetRow = Widget.widgets[widgetIndex];
            widgetRow.remove();
        }
    }

    if (!messageData) messageData = {};
    messageData.view = view;
    var c = $("#content");
    c.html('');
    spinner(c);
    Socket.send("view", messageData, function (viewData) {
        var loadCallback = function (firstLoad) {
            var hash = viewData.view;
            // only change the hash if no form data has been sent back or if redirect is given
            if (viewData.redirect) {
                View.changeHash(viewData.redirect);
            }
            $.get("views/" + viewData.view + ".html", function (htmlData) {
                View.current = viewData.view;
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
                View.views[viewData.view](viewData, firstLoad);
                if (callback) callback(viewData);
                // replace language keys
                lang.replaceInHtml(c);
                // init selectpicker
                $('.selectpicker').selectpicker();
                collapsable(c);
                dismissable(c);
            });
        };
        if (typeof View.views[viewData.view] == "undefined") {
            $.getScript("views/" + viewData.view + ".js", function () {
                loadCallback(true);
            });
        } else {
            loadCallback(false);
        }
    });
};

// delegate events
$(document).on("click", ".page-link", function (ev) {
    // onclick pagelink
    ev.stopPropagation();
    ev.preventDefault();
    $(".hamburger.is-open").trigger("click");
    var messageData = null;
    var hash = $(this).attr("href").substr(1);
    var msg = $(this).attr("data-message");
    if (msg) {
        messageData = View.parseAttributeMessage(msg);
        View.changeHash(hash + "-" + msg);
    } else {
        View.changeHash(hash);
    }
    View.load(hash, messageData);
}).on("click submit-form", ".submit-form", function () {
    // onclick form submit btn
    var f = $(this).closest("form");
    var name = f.attr("name");
    if (f[0].checkValidity()) {
        var data = {};
        f.find(":input").filter("[name]").each(function () {
            if ($(this).closest(".dropdown-toggle, .dropdown-menu").length) return true;
            data[$(this).attr("name")] = $(this).val();
        });
        var view = f.attr("data-view");
        var messageData = {
            "form": name,
            "btn": $(this).attr("data-name"),
            "formData": data
        };
        // if view not given, just use the current view
        if (!view) {
            var hashData = View.getViewDataByHash();
            view = hashData.view;
            if (hashData.messageData) {
                $.extend(messageData, hashData.messageData);
            }
        }
        // send data to view
        View.load(view, messageData, function (viewData) {
            // just filling data back into form if no redirect is going on
            if (!viewData.redirect) {
                populateForm($("#content").find("form").filter("[name='" + name + "']"), data);
            }
        });
    } else {
        // on validation error trigger a fake submit button to enable validation UI popup
        $(this).after('<input type="submit">');
        $(this).next().trigger("click").remove();
    }
});