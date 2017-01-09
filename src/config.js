"use strict";

var fs = require("fs");

/**
 * Default configuration
 * Override with local config.js file in root
 */
var config = {
    "host": null,
    "port": 4326
};

// load config.js if exist
if (fs.existsSync(__dirname + "/../config.js")) {
    config = require(__dirname + "/../config.js");
}

module.exports = config;