"use strict";

var http = require("http");
var https = require("https");

/**
 * Simple requests
 */
var request = {};

/**
 * Get contents for url
 * @param {string} url
 * @param {function} callback
 */
request.get = function (url, callback) {
    var useHttp = url.match(/^https/) ? https : http;
    var req = useHttp.get(url, function (result) {
        var body = '';
        result.on('data', function (chunk) {
            body += chunk;
        });
        result.on('end', function () {
            callback(body);
        });
    });
    req.on('error', function () {
        callback(null);
    });
};

module.exports = request;