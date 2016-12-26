"use strict";
$(function () {
    rwa.socket.send("server-messages", {"id" : "6ea5cf8aaa5b6912b9858d00f5502764"}, function (data) {
        console.log(data);
    });
    rwa.socket.onMessage("console", function (responseData) {
        console.log(responseData);
    });
    rwa.socket.send("cmd", {"id" : "6ea5cf8aaa5b6912b9858d00f5502764", "cmd" : "status"}, function (data) {
        console.log(data);
        rwa.socket.send("cmd", {"id" : "d38a7cf28d7f2a3f0cf2c26b70897fd5", "cmd" : "save"}, function (data) {
            console.log(data);
        });
    });
});