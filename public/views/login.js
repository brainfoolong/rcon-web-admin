"use strict";
View.register("login", function (messageData) {
    if (messageData.sessionUserData && messageData.login) {
        var session = messageData.login == "session";
        Storage.set("loginName", messageData.sessionUserData.username, session);
        Storage.set("loginHash", messageData.sessionUserData.loginHash, session);
        View.load("index");
    }
});