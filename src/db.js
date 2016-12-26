"use strict";
/**
 * LowDB management
 */

var Low = require("lowdb");
const crypto = require('crypto');

var Db = {};

/**
 * Instances for files
 * @type {object<string, Low>}
 * @private
 */
Db._instances = {};

/**
 * Get lowdb instance
 * @param {string} file
 * @returns {Low}
 */
Db.get = function (file) {
    if (typeof Db._instances[file] != "undefined") {
        return Db._instances[file];
    }
    var inst = Low(__dirname + '/../db/' + file + '.json');
    Db._instances[file] = inst;
    // if getting settings than set some defaults
    inst.defaults({"salt": crypto.randomBytes(64).toString('hex')});
    return Db._instances[file];
};

module.exports = Db;