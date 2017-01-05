"use strict";
View.register("settings", function (messageData) {
    var btn = $(".btn.update");
    btn.on("click", function () {
        Modal.confirm(t("settings.confirm"), function (success) {
            if(success){
                spinner($(".settings"));
                Socket.send("view", {
                    "view": "settings",
                    "action": "update"
                }, function () {
                    $(".settings").find(".spinner").remove();
                    note(t("settings.update.done"), "success");
                });
            }
        });
    });
});
