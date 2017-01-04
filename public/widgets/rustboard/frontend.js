"use strict";

Widget.register(function (widget) {
    var icons = $('<h2 class="collapsable-trigger" data-collapsable-target="rustboard.serverstatus">' + widget.t("serverstatus") + '</h2>' +
        '<div class="icons collapsable-target" data-collapsable-id="rustboard.serverstatus"><div class="row">' +
        '<div class="icon host col-md-6"><span class="glyphicon glyphicon-home"></span> <span class="text"></span></div>' +
        '<div class="icon players col-md-6"><span class="glyphicon glyphicon-user"></span> <span class="text"></span></div>' +
        '</div>' +
        '<div class="row">' +
        '<div class="icon version col-md-6"><span class="glyphicon glyphicon-info-sign"></span> <span class="text"></span></div>' +
        '<div class="icon map col-md-6"><span class="glyphicon glyphicon-picture"></span> <span class="text"></span></div>' +
        '</div></div>');
    var playerlist = $('<div class="playerlist">' +
        '<h2 class="collapsable-trigger" data-collapsable-target="rustboard.playerlist">' + widget.t("playerlist") + ' <span class="count"></span></h2>' +
        '<table class="table table-striped table-condensed table-bordered collapsable-target" data-collapsable-id="rustboard.playerlist"><thead>' +
        '<tr>' +
        '<th>Id</th>' +
        '<th>Name</th>' +
        '<th>Time</th>' +
        '<th>IP</th>' +
        '<th>VacStats</th>' +
        '<th></th>' +
        '</tr></thead><tbody></tbody></table></div>');
    var banlist = $('<div class="banlist">' +
        '<h2 class="collapsable-trigger" data-collapsable-target="rustboard.banlist">' + widget.t("banlist") + ' <span class="count"></span></h2>' +
        '<table class="table table-striped table-condensed table-bordered collapsable-target" data-collapsable-id="rustboard.banlist"><thead>' +
        '<tr>' +
        '<th>Id</th>' +
        '<th>Name</th>' +
        '<th>Notes</th>' +
        '<th></th>' +
        '</tr></thead><tbody></tbody></table></div>');

    var updatePlayerlist = function () {
        widget.cmd("status", function (messageData) {
            var tbody = playerlist.find("tbody");
            tbody.html('');
            var msplit = messageData.split("\n");
            if (!msplit || msplit.length < 3) return;
            var hostname = msplit[0].split(":", 2);
            var version = msplit[1].split(":", 2);
            var map = msplit[2].split(":", 2);
            var players = msplit[3].split(":", 2);
            icons.find(".host .text").html(hostname[1]);
            icons.find(".players .text").html(players[1]);
            icons.find(".version .text").html("Version " + version[1]);
            icons.find(".map .text").html(map[1]);
            msplit = msplit.slice(6);
            var ids = [];
            var count = 0;
            for (var i = 0; i < msplit.length; i++) {
                var line = msplit[i];
                var linesplit = line.match(/^([0-9]+)\s+"(.*?)"\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)/);
                if (linesplit) {
                    var time = parseFloat(linesplit[4].replace(/[^0-9\.]/g, ""));
                    time = parseInt((time / 60)) + "m";
                    ids.push(linesplit[1]);
                    var tr = $('<tr>');
                    tr.attr("data-id", linesplit[1]);
                    tr.append($('<td class="id">').text(linesplit[1]));
                    tr.append($('<td class="name">').text(linesplit[2]));
                    tr.append($('<td class="time">').text(time));
                    tr.append($('<td class="ip">').text(linesplit[5]));
                    tr.append($('<td class="vacbans">'));
                    tr.append($('<td class="actions">').html('<select>' +
                        '<option value="">Action</option>' +
                        '<option value="kick">Kick</option>' +
                        '<option value="ban">Ban</option>' +
                        '</select>'));
                    tbody.append(tr);
                    count++;
                }
            }
            playerlist.find(".count").text("(" + count + ")");
            tbody.find("td").wrapInner('<div>');
            tbody.find("select").selectpicker();
            // get vacbanstatus
            if (ids.length) {
                widget.backend("banstatus", {"ids": ids}, function (messageData) {
                    $.each(messageData, function (steamKey, steamValue) {
                        var tooltipHtml = [];
                        var icon = "ok";
                        $.each(steamValue, function (key, value) {
                            key = key.toLowerCase();
                            if (key == "economyban") value = value != "none";
                            tooltipHtml.push(key + ": " + value);
                            if (key != "timestamp" && key != "steamid" && value) {
                                icon = "remove";
                            }
                        });
                        tbody.find("tr").filter("[data-id='" + steamKey + "']")
                            .find("td.vacbans").html('<span class="glyphicon glyphicon-' + icon + '-circle"></span>')
                            .attr("data-tooltip", tooltipHtml.join("<br/>"));
                    });
                });
            }
            widget.cmd("bans", function (messageData) {
                var tbody = banlist.find("tbody");
                tbody.html('');
                // fix for 64bit integer
                messageData = messageData.replace(/(\"steamid\"\s*:\s*)([0-9]+)/g, function (all) {
                    return all.replace(/[0-9]+/, "\"$&\"")
                });
                var bans = JSON.parse(messageData);
                for (var i = 0; i < bans.length; i++) {
                    var ban = bans[i];
                    var tr = $('<tr>');
                    tr.attr("data-id", ban.steamid);
                    tr.append($('<td class="id">').text(ban.steamid));
                    tr.append($('<td class="name">').text(ban.username));
                    tr.append($('<td class="notes">').text(ban.notes));
                    tr.append($('<td class="actions">').html('<select>' +
                        '<option value="">Action</option>' +
                        '<option value="unban">Unban</option>' +
                        '</select>'));
                    tbody.append(tr);
                }
                banlist.find(".count").text("(" + bans.length + ")");
                tbody.find("select").selectpicker();
            });
        });
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
                if (v == "unban") {
                    widget.cmd(v + " " + id, function () {
                        updatePlayerlist();
                    });
                } else {
                    Modal.prompt(widget.t("kickban.reason"), "", function (reason) {
                        if (reason !== false) {
                            widget.cmd(v + " " + id + " \"" + reason + "\"", function () {
                                updatePlayerlist();
                            });
                        }
                    });
                }
            }
        });
        widget.content.append(icons);
        widget.content.append(playerlist);
        widget.content.append(banlist);
        collapsable(widget.content);
        updatePlayerlist();
    };

    // update playerlist when backend updates are done
    widget.onBackendUpdate = function () {
        updatePlayerlist();
    };
});