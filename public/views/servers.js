"use strict";
$(function () {
    if (getParameterByName("reload")) {
        rwa.socket.send("server-reload", {"id": getParameterByName("reload")});
    }
});