"use strict";
$(function () {
    // just reload datafiles in the backend everytime something has changed on this page
    if(getParameterByName("message").length){
        rwa.socket.send("users-reload");
    }
});