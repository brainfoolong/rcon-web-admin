"use strict";

var fs = require("fs");

/**
 * Default configuration
 * Override with local config.js file in root
 */
var config = {
    "host": null,
    "websocketUrlSsl": null,
    "websocketUrl": null,
    "port": 4326
};

// load config.js if exist
if (fs.existsSync(__dirname + "/../config.js")) {
    var configLocal = require(__dirname + "/../config.js");
    for(var i in configLocal){
        config[i] = configLocal[i];
    }
}

module.exports = config;