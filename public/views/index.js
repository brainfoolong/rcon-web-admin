"use strict";
View.register("index", function (messageData) {
    $("#content").off(".index").on("change.index", ".pick-server", function () {
        View.load()
    });
    return;
    console.log("load");
    Socket.send("server-messages", {"id" : "6ea5cf8aaa5b6912b9858d00f5502764"}, function (data) {
        console.log(data);
    });
    Socket.onMessage("console", function (responseData) {
        console.log(responseData);
    });
    Socket.send("cmd", {"id" : "6ea5cf8aaa5b6912b9858d00f5502764", "cmd" : "status"}, function (data) {
        console.log(data);
        Socket.send("cmd", {"id" : "d38a7cf28d7f2a3f0cf2c26b70897fd5", "cmd" : "save"}, function (data) {
            console.log(data);
        });
    });
});