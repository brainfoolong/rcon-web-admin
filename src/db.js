"use strict";

var Low = require("lowdb");
var hash = require(__dirname + "/hash");

/**
 * LowDB helper
 */
var db = {};

/**
 * The db defaults
 * @type {object<string, *>}
 * @private
 */
db._defaults = {
    "users": {},
    "servers": {},
    "settings": {"salt": hash.random(64)}
};

/**
 * Get lowdb instance
 * @param {string} file
 * @returns {Low}
 */
db.get = function (file) {
    var inst = Low(__dirname + '/../db/' + file + '.json');
    // if getting settings than set some defaults
    if (typeof db._defaults[file] != "undefined") {
        inst.defaults(db._defaults[file]);
    }
    return inst;
};

module.exports = db;