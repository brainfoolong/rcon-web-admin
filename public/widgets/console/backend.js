"use strict";

var Widget = require(__dirname + "/../../../src/widget");
var fs = require("fs");

var widget = new Widget();

/**
 * All available commands for the server
 * @type {{variables: [], commands: []}}
 */
widget.availableCommands = {"variables": [], "commands": []};

/**
 * Get logfiles, sorted by id
 *
 * @return {object[]}
 */
widget.getLogfiles = function (server, callback) {
    var dir = server.serverDbFolder + "/console/log";
    fs.stat(dir, function (err) {
        if (err) {
            if (callback) callback([]);
            return;
        }
        fs.readdir(dir, function (err, files) {
            var filesArr = [];
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                try{
                    var stats = fs.statSync(dir + "/" + file);
                    filesArr.push({"file": parseInt(file), "time": stats.mtime, "size": stats.size});
                }catch(e){

                }
            }
            filesArr.sort(function (a, b) {
                if (a.file > b.file) {
                    return -1;
                } else {
                    return 1;
                }
            });
            for (var j = 10; j < filesArr.length; j++) {
                fs.unlink(dir + "/" + filesArr[j].file);
                delete filesArr[i];
            }
            if (callback) callback(filesArr);
        });
    });
};

/**
 * On rcon server has successfully connected and authenticated
 * @param {RconServer} server
 */
widget.onServerConnected = function (server) {
    // get available commands on server connect, ignore the log
    server.cmd("find .", null, false, function (data) {
        var key = "variables";
        var lines = data.split("\n");
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.toLowerCase() == "commands:") {
                key = "commands";
            }
            if (line.substr(0, 1) != " ") continue;
            widget.availableCommands[key].push(line.substr(1));
        }
    });
};

/**
 * On receive a server message
 * @param {RconServer} server
 * @param {RconMessage} message
 */
widget.onServerMessage = function (server, message) {
    var logfileId = widget.storage.get(server, "logfile.id") || 0;
    var logfilePath = server.serverDbFolder + "/console";
    fs.mkdir(logfilePath, 777, function () {
        logfilePath += "/log";
        fs.mkdir(logfilePath, 777, function () {
            logfilePath += "/";
            fs.stat(logfilePath + logfileId, function (err, stats) {
                if (err || stats.size > 1024 * 1024) {
                    logfileId++;
                    widget.storage.set(server, "logfile.id", logfileId);
                    // call this to remove old files when creating a new id
                    widget.getLogfiles(server);
                }
                fs.appendFile(
                    logfilePath + logfileId,
                    "[" + message.timestamp.toLocaleString() + "] " + JSON.stringify(message.body) + "\n"
                );
            });
        });
    });
};

/**
 * On frontend message
 * @param {RconServer} server
 * @param {WebSocketUser} user
 * @param {string} action The action
 * @param {*} messageData Any message data received from frontend
 * @param {function} callback Pass an object as message data response for the frontend
 */
widget.onFrontendMessage = function (server, user, action, messageData, callback) {
    switch (action) {
        case "logfileDelete":
            var file = server.serverDbFolder + "/console/log/" + messageData.id.replace(/[^0-9]/g, "");
            fs.unlink(file);
            break;
        case "logfileGet":
            var file = server.serverDbFolder + "/console/log/" + messageData.id.replace(/[^0-9]/g, "");
            fs.stat(file, function (err) {
                if (err) {
                    callback(widget, "");
                    return;
                }
                fs.readFile(file, "utf8", function (err, data) {
                    callback(widget, data);
                });
            });
            break;
        case "logfiles":
            widget.getLogfiles(server, function (files) {
                callback(widget, files);
            });
            break;
        case "commands":
            callback(this, widget.availableCommands);
            break;
    }
};

module.exports = widget;