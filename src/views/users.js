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
function View(user, messageData, callback) {
    var users = db.get("users").cloneDeep().value();
    var deeperCallback = function (sendMessageData) {
        sendMessageData.users = users;
        if(messageData.id){
            sendMessageData.editData = db.get("users").get(messageData.id).cloneDeep().value();
        }
        callback(sendMessageData);
    }
    // access denied if users are in database and user is not admin
    if (Object.keys(users).length && (!user.userData || !user.userData.admin)) {
        callback({redirect: "index", "note": ["access.denied", "danger"]});
        return;
    }
    // on save
    if (messageData.form == "users" && messageData.btn == "save") {
        var formData = messageData.formData;
        var id = messageData.id || hash.random(32);
        var hasAdmin = formData.admin == "yes";
        if (!hasAdmin) {
            for (var userId in users) {
                if (users.hasOwnProperty(userId)) {
                    if (users[userId].admin) {
                        hasAdmin = true;
                        break;
                    }
                }
            }
        }
        if (!hasAdmin) {
            deeperCallback({"note": ["users.missing.admin", "danger"]});
            return;
        }
        if ((!messageData.id && !formData.password1) || (formData.password1 != formData.password2)) {
            deeperCallback({"note": ["users.error.pwmatch", "danger"]});
            return;
        }
        var userData = users[id] || {};
        if (formData.password1) {
            userData.password = hash.saltedMd5(formData.password1);
        }
        userData.id = id;
        userData.username = formData.username;
        userData.admin = formData.admin == "yes";
        userData.loginHash = hash.random(64);
        db.get("users").set(id, userData).value();
        deeperCallback({
            "sessionUserData": {"username": userData.username, "loginHash": userData.loginHash},
            "login": !user.userData || user.userData.id == id,
            "initial" : Object.keys(users).length == 0,
            "note": ["saved", "success"],
            "resetForm": true
        });
        return;
    }
    // just pipe to frontend
    deeperCallback({});
};

module.exports = View;