"use strict";
/**
 * Main script
 */
Error.stackTraceLimit = Infinity;

var mode = process.argv[2];
if (!mode) {
    process.stdout.write("Usage: node main.js start|update-all-widgets|install-widget|install-core-widgets");
    process.exit(1);
    return;
}

if (mode == "start") {
    require(__dirname + "/routes");
    require(__dirname + "/rconserver");
    require(__dirname + "/websocketmgr");
    require(__dirname + "/steamapi");
    require(__dirname + "/config");
    return;
}

var Widget = require(__dirname + "/widget");

// update all existing widgets
if (mode == "update-all-widgets") {
    var widgets = Widget.getAllWidgetIds();
    var cbCount = 0;
    for (var i = 0; i < widgets.length; i++) {
        var widget = Widget.get(widgets[i]);
        if (widget && widget.manifest) {
            (function (widget) {
                Widget.install(widget.manifest.repository, function (success) {
                    process.stdout.write("Widget " + widget.manifest.repository + " " + (success ? "successfully updated" : "error") + "\n");
                    cbCount++;
                    if (cbCount == widgets.length) {
                        process.exit(1);
                    }
                });
            })(widget);
        }
    }
}

// update core
if (mode == "update-core") {
    process.exit(1);
}

// update/install a single widget
if (mode == "install-widget") {
    var widgetRepository = process.argv[3];
    if (!widgetRepository) {
        process.stdout.write("Usage: node main.js install-widget widgetRepositoryHere");
        return;
    }
    Widget.install(widgetRepository, function (success) {
        process.stdout.write("Widget " + widgetRepository + " " + (success ? "successfully installed" : "error") + "\n");
        process.exit(success ? 1 : 0);
    });
}

// install core widgets
if (mode == "install-core-widgets") {
    var coreWidgets = [
        "brainfoolong/rwa-autobot",
        "brainfoolong/rwa-console",
        "brainfoolong/rwa-restart",
        "brainfoolong/rwa-rustboard",
        "brainfoolong/rwa-shutdown"
    ];
    var cbCount = 0;
    for (var i = 0; i < coreWidgets.length; i++) {
        (function (index) {
            Widget.install(coreWidgets[index], function (success) {
                process.stdout.write("Widget " + coreWidgets[index] + " " + (success ? "successfully installed" : "error") + "\n");
                cbCount++;
                if (cbCount == coreWidgets.length) {
                    process.exit(1);
                }
            });
        })(i);
    }
}