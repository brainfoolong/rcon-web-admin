"use strict";
View.register("widgets", function (messageData) {
    var widgetTpl = $(".widget-row");
    var container = $(".widgets-installed");

    for (var widgetIndex in messageData.widgets) {
        if (messageData.widgets.hasOwnProperty(widgetIndex)) {
            var widgetRow = messageData.widgets[widgetIndex];
            var widgetEl = widgetTpl.clone().removeClass("hidden");
            var widget = new Widget(widgetIndex);
            var newVersion = widgetRow._latestVersion && widgetRow._latestVersion != widgetRow.version;
            widget.data = {
                "manifest": widgetRow
            };
            widgetEl.attr("data-id", widgetIndex);
            widgetEl.find("strong").text(widget.t("name") + " v" + widgetRow.version);
            widgetEl.find("a.github").attr("href", "https://github.com/" + widgetRow.repository);
            widgetEl.find("small").text(widget.t("description"));
            widgetEl.find(".games .text").text(widgetRow.compatibleGames == "all" ? "All" : widgetRow.compatibleGames.join(", "));
            widgetEl.find(".update").text(t(newVersion ? "widgets.update.available" : "widgets.update.anyway", {"version": widgetRow._latestVersion})).removeClass("hidden");
            if (!newVersion) {
                widgetEl.find(".update").addClass("btn-default").removeClass("btn-info");
            }
            container.append(widgetEl);
        }
    }
    container.on("click", ".update", function () {
        var e = $(this).closest(".widget-row");
        var btn = $(this);
        var id = e.attr("data-id");
        Modal.confirm(t("widgets.update.confirm"), function (success) {
            if (success) {
                btn.remove();
                note(t("widgets.update.progress"), "info", 6000);
                Socket.send("view", {
                    "view": "widgets",
                    "action": "update",
                    "widget": id
                }, function (data) {
                    note(data.message, data.type, 10000);
                });
            }
        });
    })
    $("#content").on("click", ".install", function () {
        var repo = $("#content").find(".widget-url").val();
        if (repo.length && repo.match(/https:\/\/github\.com\/(.*?)\/(.*)/)) {
            var id = repo.match(/https:\/\/github\.com\/([^\/]+\/[^\/\?\#]+)/)[1];
            $.getJSON("https://raw.githubusercontent.com/" + id + "/master/manifest.json", function (data) {
                if (!data || !data.version || !data.compatibleGames || !data.repository) {
                    note(t("widgets.install.invalid"), "danger");
                    return;
                }
                Modal.confirm(t("sure"), function (success) {
                    if (success) {
                        Socket.send("view", {
                            "view": "widgets",
                            "action": "install",
                            "widget": id
                        }, function (data) {
                            note(data.message, data.type, 10000);
                        });
                    }
                });
            });
        } else {
            note(t("widgets.install.invalid"), "danger");
        }
    });
});