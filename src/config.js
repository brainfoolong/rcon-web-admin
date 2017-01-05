"use strict";

var fs = require("fs");

/**
 * Default configuration
 * Override with local config.js file in root
 */
var config = {
    /**
     * The host to bind the webinterface to
     * null if you want allow every hostname
     */
    "host" : null,

    /**
     * The port for the server and websocket
     * The given number is the one for the webinterface
     * Notice that both given number and the number+1 will be required
     */
    "port" : 4326
};

// load config.js if exist
if (fs.existsSync(__dirname + "/../config.js")) {
    config = require(__dirname + "/../config.js");
}

module.exports = config;