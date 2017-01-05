"use strict";
View.register("widgets", function (messageData) {
    var widgetTpl = $(".widget-row");
    var container = $(".widgets-installed");
    for (var widgetIndex in messageData.widgets) {
        if (messageData.widgets.hasOwnProperty(widgetIndex)) {
            var widgetRow = messageData.widgets[widgetIndex];
            var widgetEl = widgetTpl.clone().removeClass("hidden");
            var widget = new Widget(widgetIndex);
            widget.data = {
                "manifest": widgetRow
            };
            widgetEl.attr("data-id", widgetIndex);
            widgetEl.find("strong").text(widget.t("name") + " v" + widgetRow.version);
            widgetEl.find("a.github").attr("href", "https://github.com/" + widgetRow.repository);
            widgetEl.find("small").text(widget.t("description"));
            widgetEl.find(".games .text").text(widgetRow.compatibleGames == "all" ? "All" : widgetRow.compatibleGames.join(", "));
            for (var i = 0; i < messageData.defaultWidgets.length; i++) {
                var repository = messageData.defaultWidgets[i];
                if (repository.match(new RegExp("/" + widgetIndex, "i"))) {
                    widgetTpl.find(".actions .delete").remove();
                    break;
                }
            }
            container.append(widgetEl);
        }
    }
    container.on("click", ".update", function () {

    });
    container.on("click", ".delete", function () {
        Modal.confirm(t("sure"), function (success) {
            if(success){

            }
        });
    });
});