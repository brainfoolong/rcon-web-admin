"use strict";

var https = require("https");
var db = require(__dirname + "/db");

/**
 * Steam utils
 */
var steamapi = {};

/**
 * Get player bans for given ids
 * @param {string[]} ids
 * @param {function} callback
 */
steamapi.getPlayerBans = function (ids, callback) {
    var res = {};
    var sdb = db.get("steamapi");
    var missingIds = [];
    for (var i = 0; i < ids.length; i++) {
        var id = ids[i];
        var playerData = sdb.get(id).value();
        if (playerData && playerData.ban && playerData.ban.timestamp >= ((new Date().getTime() / 1000) - 86400)) {
            res[id] = playerData.ban;
        } else {
            missingIds.push(id);
        }
    }
    if (missingIds.length) {
        https.get("https://0x.at/steamapi/api.php?action=bans&ids=" + missingIds.join(","), function (result) {
            var body = '';
            result.on('data', function (chunk) {
                body += chunk;
            });
            result.on('end', function () {
                try {
                    var data = JSON.parse(body);
                    for (var i = 0; i < data.players.length; i++) {
                        var banData = data.players[i];
                        banData.timestamp = new Date().getTime() / 1000;
                        var playerData = sdb.get(banData.SteamId).value() || {};
                        playerData.ban = banData;
                        sdb.set(banData.SteamId, playerData).value();
                        res[banData.SteamId] = banData;
                    }
                    callback(res);
                }
                catch(e){
                    callback(res);
                }
            });
        });
    } else {
        callback(res);
    }
};

steamapi.getPlayerBans(["76561198351490334"], function (data) {
    console.log(data);
});

module.exports = steamapi;