"use strict";
View.register("settings", function (messageData) {
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
});
