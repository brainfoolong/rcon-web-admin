"use strict";

/**
 * The view
 * @param {WebSocketUser} user
 * @param {object} messageData
 * @param {function} callback
 * @constructor
 */
var View = function (user, messageData, callback) {
    user.userData = null;
    callback({"note": ["logout.title", "success"]});
};

module.exports = View;