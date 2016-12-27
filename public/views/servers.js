"use strict";
View.register("servers", function (messageData) {
    if (messageData.editData) {
        populateForm($("form").filter("[name='servers']"), messageData.editData);
        $(".btn.delete").removeClass("hidden").on("click", function (ev) {
            if (!confirm(t("sure"))) {
                ev.stopPropagation();
            }
        });
    }
    // write to table
    var tbody = $("table.data-table tbody");
    for (var i in messageData.servers) {
        var server = messageData.servers[i];
        tbody.append('<tr>' +
            '<td>' + server.game.toUpperCase() + '</td>' +
            '<td>' + server.name + '</td>' +
            '<td>' + server.port + '</td>' +
            '<td>' + server.rcon_port + '</td>' +
            '<td><a href="#servers" data-message="' + btoa(JSON.stringify({id: server.id})) + '" data-translate="edit" ' +
            'class="btn btn-info btn-sm page-link"></a></td>' +
            '</tr>');
    }
});