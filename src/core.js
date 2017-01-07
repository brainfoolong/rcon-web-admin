"use strict";

var request = require(__dirname + "/request");
/**
 * Core
 * @type {object}
 */
var core = {};

/** @type {string} */
core.latestVersion = "";

/**
 * Fetch latest version for the core
 */
core.fetchLatestVersion = function () {
    request.get("https://raw.githubusercontent.com/brainfoolong/rcon-web-admin/master/package.json", false, function (content) {
        if (content) {
            var manifest = JSON.parse(content);
            if (manifest && manifest.version) {
                core.latestVersion = manifest.version;
            }
        }
    });
};

// fetch latest version each hour
setInterval(core.fetchLatestVersion, 1000 * 60 * 60);
// and call 5 second after server startup
setTimeout(core.fetchLatestVersion, 5000);


module.exports = core;