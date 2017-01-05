"use strict";

var exec = require('child_process').exec;

/**
 * The view
 * @param {WebSocketUser} user
 * @param {object} messageData
 * @param {function} callback
 * @constructor
 */
function View(user, messageData, callback) {
    // access denied for everyone except admin
    if (!user.userData || !user.userData.admin) {
        callback({redirect: "index", "note": ["access.denied", "danger"]});
        return;
    }
    console.log(messageData);
    if (messageData.action == "update") {
        exec("cd " + __dirname + "/../.. && git pull", null, function () {
            callback();
        });
        return;
    }
    callback();
};

module.exports = View;