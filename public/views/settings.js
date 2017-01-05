"use strict";
View.register("settings", function (messageData) {
    $(".btn.update").on("click", function () {
        Modal.confirm(t("settings.confirm"), function (success) {
            $(".btn.update").remove();
            Socket.send("view", {
                "view": "settings",
                "action": "update"
            }, function (data) {
                note(t("settings.update.done"), "success");
            });
        });
    });
});
