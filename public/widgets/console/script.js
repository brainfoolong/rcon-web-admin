"use strict";

Widget.register(function (widget) {
    var consoleEl = $('<div class="console">');
    var cmdEl = $('<div class="cmd form-group has-feedback input-group">' +
        '<span class="input-group-addon"><i class="glyphicon glyphicon-chevron-right"></i></span>' +
        '<input type="search" class="form-control" placeholder="' + widget.t("input.cmd") + '">' +
        '</div>');
    var searchEl = $('<div class="search form-group has-feedback input-group">' +
        '<span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span>' +
        '<input type="search" class="form-control" placeholder="' + widget.t("input.search") + '">' +
        '</div>');
    var cmdSelect = $('<div class="cmd-select">' +
        '<select class="selectpicker"></select>' +
        '</div>');

    /**
     * Add a message to console
     * @param {string} message
     * @param {Date} timestamp
     * @param {string=} username
     */
    var addMessage = function (message, timestamp, username) {
        var e = $('<div class="message">' +
            '<div class="timestamp"></div>' +
            '<div class="text"></div>' +
            '</div>'
        );
        var tsText = timestamp.toLocaleString();
        if (username) tsText += " | " + username;
        e.find(".text").html(escapeHtml(message));
        e.find(".timestamp").html(tsText);
        e.data("text", message).data("timestamp", tsText);
        consoleEl.append(e);
        setTimeout(function () {
            var elem = consoleEl[0];
            elem.scrollTop = elem.scrollHeight;
        }, 50);
    };

    /**
     * Reload server log
     */
    var reloadServerLog = function () {
        consoleEl.html('');
        var data = {};
        if (widget.getOptionValue("limit")) {
            data.limit = widget.getOptionValue("limitNr");
        }
        widget.send("server-log", data, function (messageData) {
            var logData = messageData.log.split("\n");
            for (var i in logData) {
                try {
                    var m = JSON.parse(logData[i]);
                    addMessage(m.message, new Date(m.timestamp), m.username);
                } catch (e) {

                }
            }
        });
    };

    /**
     * On initialization
     */
    widget.onInit = function () {
        // get all available command and list in the cmd select
        widget.cmd("status", function (message) {
            // console.log(message);
        });

        widget.content.on("keydown", ".cmd input", function (ev) {
            if (ev.keyCode == 9) {
                ev.preventDefault();
            }
        });
        widget.content.on("keyup", ".cmd input", function (ev) {
            if (ev.keyCode == 27) {
                this.value = "";
            }
            console.log(ev.keyCode);
            if (ev.keyCode == 13) {

            }
        });
        widget.content.on("input", ".search input", function () {
            var messages = widget.content.find(".console .message");
            if (this.value.length <= 1) {
                messages.removeClass("hidden").each(function () {
                    $(this).find(".text").html($(this).data("text"));
                    $(this).find(".timestamp").html($(this).data("timestamp"));
                });
            } else {
                var s = this.value.trim().split(" ");
                var sRegex = s;
                for (var i in sRegex) {
                    sRegex[i] = {
                        "regex": new RegExp(sRegex[i].replace(/[^0-9a-z\/\*]/ig, "\\$&").replace(/\*/ig, ".*?"), "ig"),
                        "val": s[i]
                    };
                }
                messages.addClass("hidden").each(function () {
                    var f = $(this);
                    var value = f.find("*").text();
                    var elements = [
                        {"el": f.find(".timestamp"), "value": f.data("timestamp")},
                        {"el": f.find(".text"), "value": f.data("text")}
                    ];
                    for (var i in elements) {
                        var data = elements[i];
                        var html = data.value;
                        var matches = [];
                        var fail = false;
                        sRegex.forEach(function (val) {
                            var m = value.match(val.regex);
                            if (!value.match(val.regex)) {
                                fail = true;
                                return true;
                            } else {
                                matches.push(m[0]);
                                html = html.replace(val.regex, "_" + (matches.length - 1) + "_");
                            }
                        });
                        if (!fail) f.removeClass("hidden");
                        for (var i in matches) {
                            html = html.replace(new RegExp("_" + i + "_", "ig"), '<span class="match">' + matches[i] + '</span>');
                        }
                        data.el.html(html);
                    }
                });
            }
            var elem = consoleEl[0];
            elem.scrollTop = elem.scrollHeight;
        });
        widget.content.append(consoleEl);
        widget.content.append(searchEl)
        widget.content.append(cmdEl);
        widget.content.append(cmdSelect);
        cmdSelect.children().selectpicker();
        widget.onMessage(addMessage);
        reloadServerLog();
    };

    /**
     * On update
     */
    widget.onUpdate = function () {

    };

    /**
     * On widget option update
     * @param {string} key
     * @param {*} value
     */
    widget.onOptionUpdate = function (key, value) {
        if (key == "limit" || key == "limitNr") {
            reloadServerLog();
        }
    };
});