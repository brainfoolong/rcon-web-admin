"use strict";

var os = require("os");
var exec = require('child_process').exec;
var fs = require("fs");

/**
 * The view
 * @param {WebSocketUser} user
 * @param {object} messageData
 * @param {function} callback
 * @constructor
 */
function View(user, messageData, callback) {
    // access denied for everyone except admin
    if (!user.userData || !user.userData.admin) {
        callback({redirect: "index", "note": {"message": "login.failed", "type": "danger"}});
        return;
    }
    var logdir = __dirname + "/../../logs";
    if (messageData.action == "update") {
        if (os.platform() != "linux") {
            callback({"message": "settings.update.error.platform", "type": "danger"});
            return;
        }
        var dir = __dirname + "/../..";
        exec("cd " + dir + " && sh startscripts/start-linux.sh stop && node src/main.js update-core && startscripts/start-linux.sh start", null, function () {
            callback({"message": "widgets.update.progress", "type": "info"});
        });
        return;
    }
    if (messageData.action == "logfiles") {
        fs.stat(logdir, function (err) {
            if (err) {
                if (callback) callback();
                return;
            }
            fs.readdir(logdir, function (err, files) {
                var filesArr = [];
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    if (file.substr(0, 1) == ".") continue;
                    try {
                        var stats = fs.statSync(logdir + "/" + file);
                        filesArr.push({"file": file, "time": stats.mtime, "size": stats.size});
                    } catch (e) {

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
                    fs.unlink(logdir + "/" + filesArr[j].file, function () {
                      
                    });
                    delete filesArr[i];
                }
                if (callback) callback({"files": filesArr});
            });
        });
        return;
    }
    if (messageData.action == "download") {
        var file = logdir + "/" + messageData.file.replace(/\/\\/g, "");
        fs.stat(file, function (err) {
            if (err) {
                callback({"content": ""});
                return;
            }
            fs.readFile(file, "utf8", function (err, data) {
                if (data.length > 1024 * 1024) {
                    data = data.substr(-(1024 * 1024 * 0.8));
                    fs.writeFile(file, data, function () {

                    });
                }
                callback({"content": data});
            });
        });
        return;
    }
    callback();
}

module.exports = View;