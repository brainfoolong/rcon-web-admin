"use strict";
onLoad(function () {

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