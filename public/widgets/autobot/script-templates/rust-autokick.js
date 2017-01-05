// automatically kick players for vac bans or high pings
variable("vackick", "switch", "Automatically kick vac banned users", true);
variable("pingkick", "switch", "Automatically kick high ping users", true);
variable("pingmax", "number", "Maximum allowed ping", 400);
variable("pingwarn", "number", "Warn user x times before kick", 3);

if (context == "update") {
    // only check each 2 minutes
    var now = new Date().getTime() / 1000;
    var lastCheck = storage.get("lastcheck") || 0;
    if (lastCheck < now - 120) {
        storage.set("lastcheck", now);
        rust.serverstatus(function (serverstatus) {
            if (!serverstatus) return;
            for (var steamId in serverstatus.players.online) {
                var playerData = serverstatus.players.online[steamId];
                if (vackick && playerData.vacstatus && playerData.vacstatus.vacbanned) {
                    cmd("kick " + steamId + " \"Automatic kick -> VAC Banned\"");
                }
                if (pingkick) {
                    if (playerData.ping > pingmax) {
                        var pingCount = storage.get("pingcount." + steamId) || 0;
                        pingCount++;
                        if (pingCount > pingwarn) {
                            pingCount = null;
                            cmd("kick " + steamId + " \"Automatic kick -> Ping to high (max." + pingmax + ")\"");
                        }
                        storage.set("pingcount." + steamId, pingCount);
                    } else {
                        storage.set("pingcount." + steamId, null);
                    }
                }
            }
        });
    }
}