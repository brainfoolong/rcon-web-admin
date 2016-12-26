"use strict";
$(function () {
    // just reload datafiles in the backend everytime something has changed on this page
    if(getParameterByName("message").length){
        rwa.socket.send("datafile-reload", {"file" : "settings"});
    }

    // set all setting values
    (function () {
        if (rwa.settings) {
            for (var i in rwa.settings) {
                var f = $("form").find("[name='setting[" + i + "]']");
                if (f.hasClass("selectpicker")) {
                    f.selectpicker("val", rwa.settings[i]);
                } else {
                    f.val(rwa.settings[i]);
                }
            }
        }
    })();
});