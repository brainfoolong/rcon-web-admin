"use strict";
View.register("index", function (messageData) {
    var c = $("#content");
    var pickServer = c.find(".pick-server");
    c.off(".index").on("change.index", ".pick-server", function () {
        if ($(this).val().length) {
            Storage.set("server", $(this).val());
            View.load("index", {"server": $(this).val()});
        }
    });
    if (!messageData.server && Storage.get("server")) {
        View.load("index", {"server": Storage.get("server")});
    }
    if (messageData.myServers) {
        for (var i in messageData.myServers) {
            var server = messageData.myServers[i];
            pickServer.append($('<option></option>').attr("value", server.id).text(server.name));
        }
    }
    if (messageData.server) {
        pickServer.val(messageData.server);
    }
    Socket.onMessage(function (responseData) {
        console.log(responseData);
    });
    console.log(messageData);
    return;
    console.log("load");
    Socket.send("server-messages", {"id": "6ea5cf8aaa5b6912b9858d00f5502764"}, function (data) {
        console.log(data);
    });
    Socket.onMessage("console", function (responseData) {
        console.log(responseData);
    });
    Socket.send("cmd", {"id": "6ea5cf8aaa5b6912b9858d00f5502764", "cmd": "status"}, function (data) {
        console.log(data);
        Socket.send("cmd", {"id": "d38a7cf28d7f2a3f0cf2c26b70897fd5", "cmd": "save"}, function (data) {
            console.log(data);
        });
    });
});