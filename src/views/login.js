"use strict";

var db = require(__dirname + "/../db");
var hash = require(__dirname + "/../hash");

/**
 * The view
 * @param {WebSocketUser} user
 * @param {object} messageData
 * @param {function} callback
 * @constructor
 */
var View = function (user, messageData, callback) {
    if (messageData.form == "login" && messageData.btn == "login") {
        var formData = messageData.formData;
        if (formData.username && formData.password) {
            var pwHash = hash.saltedMd5(formData.password);
            var userData = db.get("users").find({
                "username": formData.username,
                "password": pwHash
            }).cloneDeep().value();
            if (userData) {
                callback({
                    "sessionUserData": {"username": userData.username, "loginHash": userData.loginHash},
                    "login": formData.remember == "yes" ? "local" : "session",
                    "note": {"message": "login.success", "type": "success"}
                });
                return;
            }
        }
        callback({"note": {"message": "login.failed", "type": "danger"}, "redirect": "login"});
        return;
    }
    callback({});
};

module.exports = View;