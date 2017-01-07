"use strict";

var http = require("http");
var https = require("https");
var url = require("url");

/**
 * Simple requests
 */
var request = {};

/**
 * Get contents for url
 * @param {string} u
 * @param {boolean} binary
 * @param {function} callback
 */
request.get = function (u, binary, callback) {
    var useHttp = u.match(/^https/) ? https : http;
    var options = url.parse(u);
    options.headers = {
        "Accept-language": "en",
        "User-Agent": "Mozilla/5.0 (iPad; U; CPU OS 3_2 like Mac OS X; en-us) AppleWebKit/531.21.10 (KHTML, like Gecko) Version/4.0.4 Mobile/7B334b Safari/531.21.102011-10-16 20:23:10",
        "encoding": null
    };
    var req = useHttp.get(options, function (result) {
        var body = binary ? [] : '';
        result.on('data', function (chunk) {
            if (binary) body.push(chunk);
            else body += chunk;
        });
        result.on('end', function () {
            try {
                callback(binary ? Buffer.concat(body) : body);
            } catch (e) {
                console.error("http request callback error", e);
            }
        });
    });
    req.on('error', function (err) {
        console.error("http request error", err);
        callback(null);
    });
};

module.exports = request;