"use strict";
View.register("index", function (messageData) {

    var c = $("#content");
    var pickServer = c.find(".pick-server");
    var addWidget = c.find(".add-widget");
    var rowContainer = c.find(".grid-row-container");
    var sessionUserData = messageData.sessionUserData;

    /**
     * load all new widgets and remove deprecated ones
     */
    var loadAllWidgets = function () {
        if (!messageData.server) {
            return;
        }
        Socket.send("view", {
            "view": "index",
            "action": "widget",
            "type": "list",
            "server": messageData.server
        }, function (data) {
            if (!pingDataCheck(data)) return;
            sessionUserData = data.sessionUserData;
            // set max attribute for layout position
            $(".widget-layout .option").filter("[data-id='position']").find("input").attr("max", data.myWidgets.length - 1);
            // sort widgets by the position
            data.myWidgets.sort(function (a, b) {
                if (a.position > b.position) {
                    return 1;
                } else if (a.position < b.position) {
                    return -1;
                } else {
                    return 0;
                }
            });
            var allWidgets = rowContainer.find(".widget");
            for (var i = 0; i < data.myWidgets.length; i++) {
                var widgetData = data.myWidgets[i];
                // ignore widget from the list if restricted
                if (sessionUserData.restrictwidgets && sessionUserData.restrictwidgets.indexOf(widgetData.id) > -1) {
                    continue;
                }
                // if widget is no added than load it
                var widgetEl = allWidgets.filter("#widget-" + widgetData.id);
                if (!widgetEl.length) {
                    loadWidget(widgetData);
                } else {
                    allWidgets = allWidgets.not(widgetEl);
                }
            }
            // remove all widgets that are not in mywidgets list anymore
            allWidgets.each(function () {
                var widget = Widget.getByElement(this);
                if (widget) {
                    widget.remove();
                }
            });
            sortWidgetElements();
            collapsable(c);
            dismissable(c);
        });
    };

    /**
     * Load a widget
     * @param {object} widgetData
     */
    var loadWidget = function (widgetData) {
        try {
            var widget = new Widget(widgetData.id);
            Widget.widgets[widgetData.id] = widget;
            widget.id = widgetData.id;
            widget.server = messageData.server;
            widget.serverData = messageData.myServers[messageData.server];
            widget.data = widgetData;
            if (!widgetData.id.match(/^[a-z]/) || widgetData.id.match(/[^a-z0-9-_]/)) {
                Modal.alert(t("index.widget.error.id"));
            }
            widget.container = c.find(".templates .widget").clone();
            widget.container
                .attr("data-id", widget.id)
                .attr("data-size", widgetData.size)
                .attr("id", "widget-" + widget.id)
                .addClass("widget-" + widget.id);
            widget.container.find(".widget-title")
                .attr("data-collapsable-target", "widget.content." + widget.id)
                .append($('<span>').text(widget.t("name")));
            widget.container.find(".widget-content")
                .attr("data-collapsable-id", "widget.content." + widget.id);

            // copy to hidden widgets form, set position later
            $(".widgets-unsorted").append(widget.container);
            widget.content = widget.container.find(".widget-content");

            // fill layout option values
            var values = {"size": widget.data.size, "position": widget.data.position};
            $.each(values, function (valueKey, valueValue) {
                var input = widget.container.find(".widget-layout .option")
                    .filter("[data-id='" + valueKey + "']").find(":input");
                // limit to select only compatible sizes
                if (valueKey == "size") {
                    $.each(widget.data.manifest.compatibleSizes, function (sizeKey, sizeValue) {
                        input.append($('<option>').attr("value", sizeValue)
                            .html(t("index.widget.size.value." + sizeValue)));
                    });
                }
                // set default value
                input.val(valueValue);
                // instantiate selectpicker
                if (input.is("select")) input.selectpicker();
            });

            var options = widget.data.manifest.options;
            // create options html
            var optionsEl = widget.container.find(".widget-options .options");
            for (var optionIndex in options) {
                if (options.hasOwnProperty(optionIndex)) {
                    var optionRow = options[optionIndex];
                    optionsEl.append(
                        option.createHtmlFromData(
                            optionIndex,
                            widget.t("option." + optionIndex + ".title"),
                            widget.t("option." + optionIndex + ".info"),
                            widget.options.get(optionIndex),
                            optionRow
                        )
                    );
                }
            }
            $("head").append('<link type="text/css" href="widgets/' + widgetData.id + '/style.css" ' +
                'rel="stylesheet" media="all" id="css-' + widgetData.id + '">');

            // load readme
            $.get("widgets/" + widgetData.id + "/README.md", function (data) {
                var container = widget.container.find(".widget-readme");
                container.html(new showdown.Converter().makeHtml(data));
                container.find("img").remove();
                container.prepend('<div class="github-info">' +
                    '<a href="https://github.com/' + widget.data.manifest.repository + '" ' +
                    'target="_blank">Version ' + widget.data.manifest.version + ' on Github</a></div>')
            });

            // load template and frontend javascript
            $.get("widgets/" + widgetData.id + "/template.html", function (templateData) {
                widget.templateEl = $('<div>').append(templateData);
                $.getScript("widgets/" + widgetData.id + "/frontend.js", function () {
                    if (Widget.registerCallback[widget.id]) Widget.registerCallback[widget.id](widget);
                    widget.onInit();
                    widget.bindSocketListener();
                });
            });
        } catch (e) {
            console.error("Load widget error", e);
        }
    };

    /**
     * Sort the widget elements from unsorted container
     */
    var sortWidgetElements = function () {
        // for each type we must begin a new row
        // for large type we have only one column per row
        // for medium we have two columns per row
        // for small we have three columns per row
        var count = 1;
        var lastSize = null;
        var container = null;
        var widgets = $(".widgets-unsorted").children();
        widgets.each(function () {
            var size = $(this).attr("data-size");
            var max = 1;
            if (size == "medium") max = 2;
            if (size == "small") max = 3;
            if (lastSize !== size || count >= max) {
                count = 1;
                container = $('.templates .grid-row.' + size).clone();
                rowContainer.append(container);
            }
            // append the widget to the grid
            container.find(".grid-column").eq(count - 1).append(this);
            lastSize = size;
            count++;
        });
        // delete old containers
        rowContainer.find(".grid-row").each(function () {
            if (!$(this).find(".widget").length) {
                $(this).remove();
            }
        });
    };

    /**
     * helper for click on options or layout icons
     * @param {Widget} widget
     * @param {string} area
     */
    var showArea = function (widget, area) {
        widget.container.find(".widget-content, .widget-options, .widget-layout, .widget-readme").addClass("hidden");
        widget.container.find(".widget-" + area).removeClass("hidden");
        widget.container.attr("data-area", area);
    };

    /**
     * Check the data we've got from ping
     * @param {object} data
     */
    var pingDataCheck = function (data) {
        // if server is down for some reason, reload view
        if (!data.server) {
            View.changeHash("index");
            View.load("index");
            note("index.serveroffline", "danger", -1);
            return false;
        }
        if (!data.myWidgets) {
            rowContainer.html(t("index.nowidgets"));
            return false;
        }
        return true;
    };

    // bind some events
    c.off(".index").on("change.index", ".pick-server", function () {
        if ($(this).val().length) {
            View.changeHash("index-" + View.getAttributeMessage({"server": $(this).val()}));
            View.load("index", {"server": $(this).val()});
        }
    }).on("change.index", ".add-widget", function () {
        if (messageData.server && $(this).val().length) {
            var widgetId = $(this).val();
            Socket.send("view", {
                "view": "index",
                "action": "widget",
                "type": "add",
                "server": messageData.server,
                "widget": widgetId
            }, function (responseData) {
                if (!responseData.widget) {
                    note(t("index.widget.add.error"), "danger");
                    return;
                }
                loadAllWidgets();
            });
            $(this).val('').selectpicker("refresh");

        }
    }).on("click.index", ".widget-delete", function () {
        if (sessionUserData.readonlyoptions) {
            note("server.options.restricted", "danger");
        } else {
            if (messageData.server) {
                var widget = Widget.getByElement(this);
                Modal.confirm(t("sure"), function (success) {
                    if (success) {
                        if (widget) {
                            Socket.send("view", {
                                "view": "index",
                                "action": "widget",
                                "type": "remove",
                                "server": messageData.server,
                                "widget": widget.id
                            }, function () {
                                widget.remove();
                            });
                        }
                    }
                });
            }
        }
    }).on("click.index", ".widget .widget-icons .icon", function (ev) {
        ev.stopPropagation();
        showArea(Widget.getByElement(this), $(this).attr("data-id"));
    }).on("input.index change.index keyup.index", ".widget-options .option :input", function (ev) {
        var e = $(this);
        clearTimeout(e.data("optionTimeout"));
        e.data("optionTimeout", setTimeout(function () {
            if (sessionUserData.readonlyoptions) {
                note("server.options.restricted", "danger");
            } else {
                var widget = Widget.getByElement(e);
                var o = e.closest(".option");
                var id = o.attr("data-id");
                widget.options.set(id, option.htmlValueToDb(o.attr("data-type"), e.val()));
                note("saved", "success");
            }
        }, ev.type == "keyup" && ev.keyCode == 13 ? 0 : 600));
    }).on("click.index", ".widget-layout .save-layout", function () {
        var widget = Widget.getByElement(this);
        note("index.widget.layout.save", "success");
        var options = widget.container.find(".widget-layout .option");
        Socket.send("view", {
            "view": "index",
            "action": "widget",
            "type": "layout",
            "server": messageData.server,
            "widget": widget.id,
            "values": {
                "size": options.filter("[data-id='size']").find("select").val(),
                "position": parseInt(options.filter("[data-id='position']").find("input").val()),
            }
        });
    });

    // list all my servers
    if (messageData.myServers) {
        for (var i in messageData.myServers) {
            var server = messageData.myServers[i];
            pickServer.append($('<option></option>').attr("value", server.id).text(server.name));
        }
    }

    // check if server is selected via hash
    var hashData = View.getViewDataByHash();
    if (hashData.messageData && hashData.messageData.server) {
        pickServer.val(hashData.messageData.server);
    }

    // if server is selected
    Interval.destroy("index.server.ping");
    Socket.offMessage("index.disconnect");
    if (messageData.server) {
        // ping the server each 30 seconds for some checks
        Interval.create("index.server.ping", function () {
            var hashData = View.getViewDataByHash();
            // destroy interval if we are not in the right context anymore
            if (View.current != "index" || !hashData || !hashData.messageData.server) {
                Interval.destroy("index.server.ping");
                Socket.offMessage("index.disconnect");
                return;
            }
            loadAllWidgets();
        }, 30000);
        // bind disconnect check
        Socket.onMessage("index.disconnect", function (messageData) {
            if (messageData.action == "serverDisconnect" && messageData.server == messageData.serverid) {
                pingDataCheck({});
            }
        });
        loadAllWidgets();
    } else {
        rowContainer.html(t(!hashData.messageData ? "index.noserver" : "index.serveroffline"));
    }

    // add widgets to the selectbox
    if (messageData.widgets && messageData.server) {
        for (var i in messageData.widgets) {
            // create fake widget to get some helpful methods
            var widget = new Widget("");
            widget.data = {};
            widget.data.manifest = messageData.widgets[i];
            if (messageData.sessionUserData.admin && widget.data.manifest._latestVersion && widget.data.manifest._latestVersion != widget.data.manifest.version) {
                $(".top-logo .widget-update").removeClass("hidden");
            }
            // check if widget is compatible with this server
            if (
                widget.data.manifest.compatibleGames !== "all"
                && widget.data.manifest.compatibleGames.indexOf(messageData.myServers[messageData.server].game) === -1
            ) {
                continue;
            }
            addWidget.append($('<option></option>').attr("value", i).text(widget.t("name")));
        }
    }
});