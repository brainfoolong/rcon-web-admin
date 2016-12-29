"use strict";
View.register("index", function (messageData, firstLoad) {

    var self = this;

    /** @type {string} */
    self.server = messageData.server;

    var c = $("#content");
    var pickServer = c.find(".pick-server");
    var addWidget = c.find(".add-widget");

    var updateDragAndDrop = function () {
        var container = c.find(".gridrows-container");
        container.find(".widget.ui-draggable").draggable("destroy");
        container.find(".grid-column.ui-droppable").droppable("destroy");
        if (container.hasClass("toggled")) {
            container.find(".widget").draggable({
                "handle": ".widget-title",
                "revert": "invalid",
                "scroll" : false
            });
            container.find(".grid-column").droppable({
                "accept": ".widget",
                "revert": "invalid",
                "tolerance" : "pointer",
                "activate": function (ev, ui) {
                    ui.draggable.data("pos", {
                        "columnId": ui.draggable.closest(".grid-column").attr("data-id"),
                        "rowId": ui.draggable.closest(".gridrows").attr("data-id"),
                    });
                },
                "drop": function (ev, ui) {
                    var oldPos = ui.draggable.data("pos");
                    var newPos = {
                        "columnId": $(this).attr("data-id"),
                        "rowId": $(this).closest(".gridrows").attr("data-id"),
                    };
                    Socket.send("view", {
                        "view": "index",
                        "action": "widget",
                        "type": "position",
                        "oldPos": oldPos,
                        "newPos": newPos,
                        "server": self.server,
                        "widget": widget.id
                    }, loadAllWidgets);
                    var widgetA = ui.draggable;
                    var widgetB = $(this).find(".widget");
                    if(widgetA.length){
                        Widget.getByElement(widgetA).remove();
                    }
                    if(widgetB.length){
                        Widget.getByElement(widgetB).remove();
                    }
                }
            });
        }
    };

    // load all new widgets and remove deprecated ones
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
            // if server is down for some reason, reload view
            if (!data.server) {
                Storage.set("server", null);
                View.changeHash("index");
                View.load("index");
                note("index.serveroffline", "danger", -1);
                return;
            }
            var allWidgets = c.find(".widget");
            if (!data.myWidgets) {
                return;
            }
            c.find(".grid-column").removeClass("has-widget");
            for (var i in data.myWidgets) {
                (function () {
                    // correctly positioning the widgets, maybe the position have changed since an update
                    var snapWidget = function (widget) {
                        c.find(".gridrows-container").children()
                            .filter("[data-id='" + widget.data.rowId + "']")
                            .find(".grid-column").filter("[data-id='" + widget.data.columnId + "']")
                            .append(widget.container).addClass("has-widget");
                        updateDragAndDrop();
                    };
                    var widgetData = data.myWidgets[i];
                    allWidgets = allWidgets.not("#" + widgetData.id);
                    if (typeof Widget.widgets[widgetData.id] != "undefined") {
                        var widget = Widget.widgets[widgetData.id];
                        widget.data = widgetData;
                        snapWidget(widget);
                    } else {
                        $.getScript("widgets/" + widgetData.name + "/frontend.js", function () {
                            var widget = new Widget(widgetData.name);
                            Widget.widgets[widgetData.id] = widget;
                            widget.id = widgetData.id;
                            widget.server = self.server;
                            widget.data = widgetData;
                            // some html stuff
                            widget.container = c.find(".templates .widget").clone().attr("id", widget.id);
                            widget.container.addClass("widget-" + widget.name);
                            widget.container.find(".widget-title").text(widget.t("title"));
                            widget.content = widget.container.find(".widget-content");
                            // create options
                            if (widget.data.manifest.options) {
                                var optionsEl = widget.container.find(".widget-options .options");
                                for (var i in widget.data.manifest.options) {
                                    var option = widget.data.manifest.options[i];
                                    var optionEl = c.find(".templates .option." + option.type).clone();
                                    if (optionEl.length) {
                                        optionEl.attr("data-id", i);
                                        optionEl.find("strong").html(widget.t("option." + i + ".title"));
                                        optionEl.find("small").html(widget.t("option." + i + ".info"));
                                        optionsEl.append(optionEl);
                                        var input = optionEl.find("input");
                                        if (option.type == "number") {
                                            if (typeof option.min == "number") {
                                                input.attr("min", option.min);
                                            }
                                            if (typeof option.max == "number") {
                                                input.attr("max", option.max);
                                            }
                                            if (typeof option.step == "number") {
                                                input.attr("step", option.step);
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
                                            input.val(widget.getOptionValue(i) ? "1" : "0").selectpicker();
                                        }
                                    }
                                }
                            }
                            snapWidget(widget);
                            $("head").append('<link type="text/css" href="widgets/' + widgetData.name + '/style.css" ' +
                                'rel="stylesheet" media="all" id="css-' + widgetData.id + '">');
                            Widget.registerCallback(widget);
                            Widget.registerCallback = null;
                            widget.onInit();
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
                "name": $(this).val(),
                "columnId": $(this).closest(".grid-column").attr("data-id"),
                "rowId": $(this).closest(".gridrows").attr("data-id")
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
    }).on("click.index", ".gridrows .new-widget", function () {
        $(this).append(addWidget.closest(".bootstrap-select"));
    }).on("click.index", ".grid-toggle", function () {
        var container = c.find(".gridrows-container");
        container.toggleClass("toggled");
        updateDragAndDrop();
    });

    (function () {
        // copy gridrow multiple times
        var gridrows = c.find(".templates .gridrows");
        gridrows.find(".grid-column").append('<div class="new-widget">' +
            '<div><div class="glyphicon glyphicon-plus"></div></div></div>');
        for (var i = 0; i < 10; i++) {
            c.find(".gridrows-container").append(gridrows.clone().attr("data-id", i));
        }
    })();

    // list all my servers
    if (messageData.myServers) {
        for (var i in messageData.myServers) {
            var server = messageData.myServers[i];
            pickServer.append($('<option></option>').attr("value", server.id).text(server.name));
        }
    }

    // check if server is selected via hash
    var hashData = View.getViewDataByHash();
    if (!hashData.messageData || !hashData.messageData.server) {
        var savedServer = Storage.get("server");
        if (savedServer) {
            View.changeHash("index-" + View.getAttributeMessage({server: savedServer}));
            View.load("index", {"server": savedServer});
            return;
        }
    } else {
        pickServer.val(hashData.messageData.server);
    }

    // if server is selected
    if (self.server) {
        loadAllWidgets();
    } else {
        c.find(".gridrows-container").html(t(!hashData.messageData ? "index.noserver" : "index.serveroffline"));
    }

    if (!messageData.gridrows) {

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