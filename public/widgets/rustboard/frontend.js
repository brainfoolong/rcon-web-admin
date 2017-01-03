"use strict";

Widget.register(function (widget) {
    var playerlist = $('<div class="playerlist"><table class="table table-striped table-condensed table-bordered"><thead>' +
        '<tr>' +
        '<th>Id</th>' +
        '<th>Name</th>' +
        '<th>Time</th>' +
        '<th>IP</th>' +
        '<th></th>' +
        '</tr></thead><tbody></tbody></table></div>');
    var icons = $('<div class="icons"><div class="row">' +
        '<div class="icon host col-md-6"><span class="glyphicon glyphicon-home"></span> <span class="text"></span></div>' +
        '<div class="icon players col-md-6"><span class="glyphicon glyphicon-user"></span> <span class="text"></span></div>' +
        '</div>' +
        '<div class="row">' +
        '<div class="icon version col-md-6"><span class="glyphicon glyphicon-info-sign"></span> <span class="text"></span></div>' +
        '<div class="icon map col-md-6"><span class="glyphicon glyphicon-picture"></span> <span class="text"></span></div>' +
        '</div></div>');

    var updatePlayerlist = function () {
        widget.cmd("status", function (messageData) {
            var tbody = playerlist.find("tbody");
            tbody.html('');
            var msplit = messageData.split("\n");
            if (!msplit) return;
            var hostname = msplit[0].split(":", 2);
            var version = msplit[1].split(":", 2);
            var map = msplit[2].split(":", 2);
            var players = msplit[3].split(":", 2);
            icons.find(".host .text").html(hostname[1]);
            icons.find(".players .text").html(players[1]);
            icons.find(".version .text").html("Version " + version[1]);
            icons.find(".map .text").html(map[1]);
            msplit = msplit.slice(6);
            for (var i = 0; i < msplit.length; i++) {
                var line = msplit[i];
                var linesplit = line.match(/^([0-9]+)\s+"(.*?)"\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)/);
                if (linesplit) {
                    var time = parseFloat(linesplit[4].replace(/[^0-9\.]/g, ""));
                    time = parseInt((time / 60)) + "m";
                    var tr = $('<tr>');
                    tr.attr("data-id", linesplit[1]);
                    tr.append($('<td class="id">').text(linesplit[1]));
                    tr.append($('<td class="name">').text(linesplit[2]));
                    tr.append($('<td class="time">').text(time));
                    tr.append($('<td class="ip">').text(linesplit[5]));
                    tr.append($('<td class="actions">').html('<select>' +
                        '<option value="">Action</option>' +
                        '<option value="kick">Kick</option>' +
                        '<option value="ban">Ban</option>' +
                        '</select>'));
                    tbody.append(tr);
                }
            }
            tbody.find("td").wrapInner('<div>');
            tbody.find("select").selectpicker();
        })
    };

    /**
     * On initialization
     */
    widget.onInit = function () {
        widget.content.on("change", "tbody select", function () {
            var v = this.value;
            if (v.length) {
                $(this).selectpicker("val", "");
                var id = $(this).closest("tr").attr("data-id");
                Modal.prompt(widget.t("kickban.reason"), "", function (reason) {
                    if (reason !== false) {
                        widget.cmd(v + " " + id + " " + reason, function () {
                            updatePlayerlist();
                        });
                    }
                });
            }
        });
        widget.content.append(icons);
        widget.content.append(playerlist);
        updatePlayerlist();
        Interval.create("widget.rustboard.status", function () {
            if (View.current == "index") {
                updatePlayerlist();
            }
        }, 30000);
    };
});