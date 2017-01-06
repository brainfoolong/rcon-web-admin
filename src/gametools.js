"use strict";

var steamapi = require(__dirname + "/steamapi");

/**
 * Some helper stuff for several games
 */
var gametools = {};

/**
 * For rust
 */
gametools.rust = {};

/**
 * The cached server status
 * @type {{}}
 * @private
 */
gametools.rust._serverstatus = {};

/**
 * Get the rust serverstatus
 * @param {RconServer} server
 * @param {boolean} forceUpdate
 * @param {function} callback
 */
gametools.rust.serverstatus = function (server, forceUpdate, callback) {
    // cached for 10 seconds if not forced
    // to prevent many widgets calling this and spam the server
    if (!forceUpdate && gametools.rust._serverstatus[server.id] && new Date(gametools.rust._serverstatus[server.id].timestamp).getTime() / 1000 > new Date() / 1000 - 10) {
        return callback(gametools.rust._serverstatus[server.id]);
    }
    gametools.rust._serverstatus[server.id] = null;
    server.cmd("status", null, false, function (statusData) {
        if (!statusData) statusData = "";
        var statusDataLines = statusData.split("\n");
        if (!statusDataLines || statusDataLines.length < 3) {
            callback(null);
            return;
        }
        var hostname = statusDataLines[0].split(":", 2);
        var version = statusDataLines[1].split(":", 2);
        var map = statusDataLines[2].split(":", 2);
        var players = statusDataLines[3].split(":", 2);

        var newStatus = {
            "server": {
                "hostname": hostname[1] ? hostname[1].trim() : "",
                "players": players[1] ? players[1].trim() : "",
                "version": version[1] ? version[1].trim() : "",
                "map": map[1] ? map[1].trim() : ""
            },
            "players": {
                "onlineCount": 0,
                "bannedCount": 0,
                "online": {},
                "banned": {}
            }
        };
        server.cmd("playerlist", null, false, function (playerlistData) {
            var playerlist = [];
            try {
                playerlist = JSON.parse(playerlistData);
            } catch (e) {
            }
            var playerlistObject = {};
            var ids = [];
            for (var i = 0; i < playerlist.length; i++) {
                var player = playerlist[i];
                var playerLower = {};
                for (var playerIndex in player) {
                    if (player.hasOwnProperty(playerIndex)) {
                        playerLower[playerIndex.toLowerCase()] = player[playerIndex];
                    }
                }
                playerLower.vacstatus = {};
                playerlistObject[playerLower.steamid] = playerLower;
                ids.push(playerLower.steamid);
            }
            newStatus.players.onlineCount = playerlist.length;
            newStatus.players.online = playerlistObject;
            steamapi.request("bans", ids, function (banStatus) {
                for (var banIndex in banStatus) {
                    if (banStatus.hasOwnProperty(banIndex)) {
                        var banRow = banStatus[banIndex];
                        var status = "ok";
                        var newBanRow = {};
                        for (var steamIndex in banRow) {
                            if (banRow.hasOwnProperty(steamIndex)) {
                                var steamValue = banRow[steamIndex];
                                steamIndex = steamIndex.toLowerCase();
                                if (steamIndex == "economyban") steamValue = steamValue != "none";
                                if (steamIndex != "timestamp" && steamIndex != "steamid" && steamValue) {
                                    status = "suspicious";
                                }
                                newBanRow[steamIndex] = steamValue;
                            }
                        }
                        newBanRow.status = status;
                        newStatus.players.online[newBanRow.steamid].vacstatus = newBanRow;
                    }
                }

                // get bans from server
                server.cmd("bans", null, false, function (messageData) {
                    if (messageData) {
                        // fix for 64bit integer
                        messageData = messageData.replace(/(\"steamid\"\s*:\s*)([0-9]+)/g, function (all) {
                            return all.replace(/[0-9]+/, "\"$&\"")
                        });
                        try {
                            var bans = JSON.parse(messageData);
                            newStatus.players.bannedCount = bans.length;
                            for (var i = 0; i < bans.length; i++) {
                                newStatus.players.banned[bans[i].steamid] = bans[i];
                            }
                        } catch (e) {

                        }
                    }
                    newStatus.timestamp = new Date();
                    gametools.rust._serverstatus[server.id] = newStatus;
                    callback(newStatus);
                });
            });
        });
    });
};

module.exports = gametools;