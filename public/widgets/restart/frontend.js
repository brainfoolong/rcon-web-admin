"use strict";

Widget.register(function (widget) {
    var btn = $('<span class="glyphicon glyphicon-refresh"></span>');

    /**
     * On initialization
     */
    widget.onInit = function () {
        widget.content.append(btn);
        widget.content.on("click", function () {
            if (confirm(widget.t("sure"))) {
                var seconds = 0;
                widget.cmd("restart " + seconds);
                note(widget.t("restart.scheduled", {"seconds": seconds}), "success");
            }
        })
    };

    /**
     * On backend update
     */
    widget.onBackendUpdate = function () {

    };

    /**
     * On widget option update
     * @param {string} key
     * @param {*} value
     */
    widget.onOptionUpdate = function (key, value) {

    };
});