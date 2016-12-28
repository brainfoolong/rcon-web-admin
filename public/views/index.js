"use strict";
View.register("index", function (messageData, firstLoad) {
    var self = this;

    /** @type {string} */
    self.server = messageData.server;

    var c = $("#content");
    var pickServer = c.find(".pick-server");
    var addWidget = c.find(".add-widget");

    // load/reload all widgets
    var loadAllWidgets = function () {
        if (!self.server) {
            return;
        }
        Socket.send("view", {
            "view": "index",
            "action": "widget",
            "type": "list",
            "server": self.server
        }, function (data) {
            var allWidgets = $("#content").find(".widget");
            if (!data.myWidgets) {
                return;
            }
            for (var i in data.myWidgets) {
                (function () {
                    var widgetCallback = function (widget) {
                        widget.onUpdate();
                    };
                    var widgetData = data.myWidgets[i];
                    allWidgets = allWidgets.not("#" + widgetData.id);
                    if (typeof Widget.widgets[widgetData.id] != "undefined") {
                        Widget.widgets[widgetData.id].data = widgetData;
                        widgetCallback(Widget.widgets[widgetData.id]);
                    } else {
                        $.getScript("widgets/" + widgetData.name + "/script.js", function () {
                            var widget = new Widget(widgetData.name);
                            Widget.widgets[widgetData.id] = widget;
                            widget.id = widgetData.id;
                            widget.server = self.server;
                            widget.data = widgetData;
                            // some html stuff
                            widget.container = $("#content").find(".templates .widget").clone().attr("id", widget.id);
                            widget.container.addClass("widget-" + widget.name);
                            widget.container.find(".widget-title").text(widget.t("title"));
                            widget.content = widget.container.find(".widget-content");
                            // create options
                            if (widget.data.manifest.options) {
                                var optionsEl = widget.container.find(".widget-options .options");
                                for (var i in widget.data.manifest.options) {
                                    var option = widget.data.manifest.options[i];
                                    var optionEl = $("#content").find(".templates .option." + option.type);
                                    optionEl.attr("data-id", i);
                                    if (optionEl.length) {
                                        optionEl.find("strong").html(widget.t("option." + i + ".title"));
                                        optionEl.find("small").html(widget.t("option." + i + ".info"));
                                        optionsEl.append(optionEl);
                                        var input = optionEl.find("input");
                                        if (option.type == "number") {
                                            if (typeof option.min == "number") {
                                                input.attr("min", optionEl.min);
                                            }
                                            if (typeof option.max == "number") {
                                                input.attr("max", optionEl.max);
                                            }
                                            if (typeof option.step == "number") {
                                                input.attr("step", optionEl.step);
                                            }
                                        }
                                        if (option.type == "text" || option.type == "number") {
                                            if (typeof option.default != "undefined") {
                                                input.attr("placeholder", option.default);
                                            }
                                            input.val(widget.getOptionValue(i));
                                        }
                                        if (option.type == "switch") {
                                            input = optionEl.find("select");
                                            input.val(widget.getOptionValue(i) ? "1" : "0").selectpicker("refresh");
                                        }
                                    }
                                }
                            }
                            $("#content").find(".widgets").append(widget.container);
                            $("head").append('<link type="text/css" href="widgets/' + widgetData.name + '/style.css" ' +
                                'rel="stylesheet" media="all" id="css-' + widgetData.id + '">');
                            Widget.registerCallback(widget);
                            Widget.registerCallback = null;
                            widget.onInit();
                            widgetCallback(widget);
                        });
                    }
                })();
            }
            // remove all widgets that are not in mywidgets list anymore
            allWidgets.each(function () {
                var widget = Widget.widgets[$(this).attr("id")];
                if (widget) {
                    widget.remove();
                }
            });
        });
    };

    // load all widgets periodically if we've set a server and when we are on current page
    if (firstLoad) {
        this.widgetIv = setInterval(function () {
            if (View.current == "index" && self.server) {
                loadAllWidgets();
            }
        }, 5000);
    }

    // bind some events
    c.off(".index").on("change.index", ".pick-server", function () {
        if ($(this).val().length) {
            Storage.set("server", $(this).val());
            View.load("index", {"server": $(this).val()});
        }
    }).on("change.index", ".add-widget", function () {
        if (self.server && $(this).val().length) {
            Socket.send("view", {
                "view": "index",
                "action": "widget",
                "type": "add",
                "server": self.server,
                "name": $(this).val()
            }, function () {
                loadAllWidgets();
            });
            $(this).val('').selectpicker("refresh");
        }
    }).on("click.index", ".widget-delete", function () {
        if (self.server && confirm(t("sure"))) {
            var widget = Widget.getByElement(this);
            if (widget) {
                Socket.send("view", {
                    "view": "index",
                    "action": "widget",
                    "type": "remove",
                    "server": self.server,
                    "widget": widget.id
                }, function () {
                    widget.remove();
                });

            }
        }
    });

    // if no server is selected, select the last selected
    if (!messageData.server && Storage.get("server")) {
        View.load("index", {"server": Storage.get("server")});
    }
    // list all my servers
    if (messageData.myServers) {
        for (var i in messageData.myServers) {
            var server = messageData.myServers[i];
            pickServer.append($('<option></option>').attr("value", server.id).text(server.name));
        }
    }
    // if server is selected
    if (self.server) {
        pickServer.val(self.server);
        loadAllWidgets();
    }
    // add widgets to the selectbox
    if (messageData.widgets && self.server) {
        for (var i in messageData.widgets) {
            // create fake widget to get some helpful methods
            var widget = new Widget("");
            widget.data = {};
            widget.data.manifest = messageData.widgets[i];
            // check if widget is compatible with this server
            if (
                widget.data.manifest.compatibleGames !== "all"
                && widget.data.manifest.compatibleGames.indexOf(messageData.myServers[self.server].game) === -1
            ) {
                continue;
            }
            addWidget.append($('<option></option>').attr("value", i).text(widget.t("title")));
        }
    }
});