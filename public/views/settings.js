"use strict";
View.register("settings", function (messageData) {

    /**
     * Show server logs modal
     */
    var showRawServerLogs = function () {
        Socket.send("view", {
            "view": "settings",
            "action": "logfiles"
        }, function (messageData) {
            var el = $('<div>');
            var files = messageData.files || [];
            files.sort(function (a, b) {
                if (new Date(a.time) > new Date(b.time)) {
                    return -1;
                } else {
                    return 1;
                }
            });
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                el.append(
                    '<div data-id="' + file.file + '">' +
                    '<div class="btn btn-info download btn-sm">' +
                    'Log ' + file.file + ' ' + (file.size / 1024 / 1024).toFixed(3) + 'MB (Last modified: ' + new Date(file.time).toLocaleString() + ')' +
                    '</div>' +
                    '</div>'
                );
            }
            el.on("click", ".btn.download", function () {
                var id = $(this).parent().attr("data-id");
                Socket.send("view", {
                    "view": "settings",
                    "action": "download",
                    "file": id
                }, function (messageData) {
                    downloadFile(messageData.content, id);
                });
            });
            Modal.alert(el);
        });
    };

    var btn = $(".btn.update");
    btn.on("click", function () {
        var e = $(this);
        Modal.confirm(t("widgets.update.confirm"), function (success) {
            if (success) {
                e.remove();
                note(t("widgets.update.progress"), "info", 6000);
                Socket.send("view", {
                    "view": "settings",
                    "action": "update"
                }, function (data) {
                    note(data.message, data.type, 10000);
                });
            }
        });
    });
    btn = $(".btn.download");
    btn.on("click", function () {
        showRawServerLogs();
    });
});
