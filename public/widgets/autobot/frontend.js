"use strict";

Widget.register(function (widget) {

    var titleEl = $('<div class="form-group has-feedback input-group form-inline collapsable-target" data-collapsable-id="autobot.editor">' +
        '<input type="text" class="form-control" placeholder="' + widget.t("title.placeholder") + '">' +
        '<select class="selectpicker">' +
        '<option value="yes" selected>' + widget.t("program.enabled") + '</option>' +
        '<option value="no">' + widget.t("program.disabled") + '</option>' +
        '</select>' +
        '</div>');
    var actionBtns = $('<div class="spacer"></div><div>' +
        '<span class="btn btn-info hidden save">' + widget.t("save.changes") + '</span>' +
        '<span class="btn btn-danger hidden delete">' + widget.t("delete.program") + '</span>' +
        '</div>');
    var programSelect = $(
        '<h2 class="collapsable-trigger" data-collapsable-target="autobot.list">' + widget.t("list") + '</h2>' +
        '<div class="collapsable-target program-select" data-collapsable-id="autobot.list">' +
        '<select class="selectpicker">' +
        '<option value="" data-keep="1">' + widget.t("list.programs") + '</option>' +
        '<option value="-" data-keep="1">' + widget.t("new.program") + '</option>' +
        '</select>' +
        '</div><div class="spacer"></div>');
    var editorHeader = $($('<h2 class="collapsable-trigger" data-collapsable-target="autobot.editor">').text(widget.t("editor")));
    var editor = $('<div class="editor collapsable-target" data-collapsable-id="autobot.editor">');
    var options = $('<h2 class="collapsable-trigger" data-collapsable-target="autobot.options">' + widget.t("variables") + '</h2>' +
        '<div class="options collapsable-target" data-collapsable-id="autobot.options"><div></div></div>');

    var scriptTemplates = ["echobot", "nextwipe", "repeatchat", "restart", "rust-autokick", "warnsalty", "welcomegoodbye"];

    var aceEditor = null;
    var aceSession = null;
    var editId = null;

    /**
     * Save the current program
     */
    var saveProgram = function () {
        var title = titleEl.find("input").val().trim();
        if (!title.length) {
            note(widget.t("missing.title"), "danger");
            return;
        }

        var script = aceSession.getValue().trim();
        if (!script.length) {
            note(widget.t("missing.script"), "danger");
            return;
        }
        widget.backend("validate-script", {"script": script}, function (messageData) {
            if (messageData.error) {
                note(messageData.error.replace(/\n/g, "<br/>"), "danger");
                return;
            }
            var variableValues = {};
            options.find(".option").each(function () {
                var type = $(this).attr("data-type");
                var value = $(this).find("input").val();
                if ($(this).find("select").length) value = $(this).find("select").val();
                variableValues[$(this).attr("data-id")] = option.htmlValueToDb(
                    type,
                    value
                );
            });
            widget.backend("save", {
                "id": editId,
                "script": script,
                "title": title,
                "active": titleEl.find("select").val() == "yes",
                "variableValues": variableValues
            }, function (messageData) {
                editId = messageData.id;
                loadProgram(editId);
                updatePrograms(function () {
                    programSelect.find("select").selectpicker("val", editId);
                    Storage.set("widget.autobot.id", editId);
                    note(widget.t("saved"), "success");
                });
            });
        });
    };

    /**
     * Delete a program
     * @param {string} id
     */
    var deleteProgram = function (id) {
        editId = null;
        loadProgram(editId);
        widget.backend("delete", {"id": id}, function () {
            updatePrograms();
        });
    };

    /**
     * Load a program into interface
     * @param {string|null} id
     */
    var loadProgram = function (id) {
        var tplSplit = id ? id.split("_") : null;
        if (tplSplit && tplSplit.length > 1) {
            $.ajax({
                "url": "widgets/autobot/script-templates/" + tplSplit[1] + ".js",
                "dataType": "text",
                "success": function (content) {
                    aceSession.setValue(content);
                    aceEditor.renderer.updateFull();
                    programSelect.find("select").selectpicker("val", editId);
                }
            });

            return;
        }
        actionBtns.find(".btn.delete").toggleClass("hidden", id === null);
        widget.backend("load", {"id": id}, function (messageData) {
            programSelect.find("select").selectpicker("val", id);
            titleEl.find("input").val(messageData ? messageData.title : "");
            titleEl.find("select").selectpicker("val", !messageData || messageData.active ? "yes" : "no");
            aceSession.setValue(messageData ? messageData.script : "");
            aceEditor.renderer.updateFull();
            Storage.set("widget.autobot.id", id);
            actionBtns.find(".btn.save").addClass("hidden");

            // add options for variables
            var c = options.children("div");
            c.html('');
            var haveOptions = false;
            for (var varIndex in messageData.variables) {
                if (messageData.variables.hasOwnProperty(varIndex)) {
                    haveOptions = true;
                    var varRow = messageData.variables[varIndex];
                    var value =
                        typeof messageData.variableValues[varIndex] != "undefined"
                        && messageData.variableValues[varIndex] !== null
                            ? messageData.variableValues[varIndex] : varRow.default;
                    c.append(option.createHtmlFromData(varIndex, varRow.label, null, value, varRow));
                }
            }
            options.addClass("hidden");
            if (haveOptions) {
                options.removeClass("hidden");
            }
        });
    };

    /**
     * Update the programs select list
     * @param {function=} callback
     */
    var updatePrograms = function (callback) {
        widget.backend("list", null, function (messageData) {
            var s = programSelect.find("select");
            s.find("option").not("[data-keep]").remove();
            $.each(messageData, function (programKey, programValue) {
                s.append($('<option>').attr("value", programValue.id).html(programValue.title));
            });
            // append templates
            for (var i = 0; i < scriptTemplates.length; i++) {
                var tpl = scriptTemplates[i];
                s.append($('<option>').attr("value", "tpl_" + tpl).html(widget.t("template") + ": " + tpl));
            }

            s.selectpicker("refresh");
            if (callback) callback();
        });
    };

    /**
     * On initialization
     */
    widget.onInit = function () {
        var aceCallback = function () {
            aceEditor = ace.edit(editor[0]);
            aceEditor.$blockScrolling = Infinity;
            aceSession = aceEditor.getSession();
            ace.config.set('basePath', 'widgets/autobot/ace');
            aceEditor.setOptions({
                fontSize: "12px"
            });
            aceEditor.setTheme("ace/theme/monokai");
            aceSession.setMode("ace/mode/javascript");
            aceEditor.commands.addCommand({
                name: 'save',
                bindKey: {win: "Ctrl-S", "mac": "Cmd-S"},
                exec: saveProgram
            });
            aceEditor.on("change", function () {
                actionBtns.find(".btn.save").removeClass("hidden");
            });

            // update programs after ace is ready
            updatePrograms(function () {
                editId = Storage.get("widget.autobot.id");
                if (editId) {
                    loadProgram(editId);
                }
            });
        };
        if (!window.ace) {
            $.getScript("widgets/autobot/ace/ace.js", aceCallback);
        } else {
            aceCallback();
        }

        widget.content.on("change", ".program-select select", function (ev) {
            var v = $(this).val();
            if (v.length) {
                if (v === "-") {
                    editId = null;
                } else if (!v.match("tpl_")) {
                    editId = v;
                }
                loadProgram(v);
            }
        }).on("change input", function (ev) {
            actionBtns.find(".btn.save").removeClass("hidden");
        });

        widget.content.append(programSelect);
        widget.content.append(editorHeader);
        widget.content.append(titleEl);
        widget.content.append(editor);
        widget.content.append(options);
        widget.content.append(actionBtns);
        widget.content.find(".selectpicker").selectpicker();

        actionBtns.find(".btn.save").on("click", saveProgram);
        actionBtns.find(".btn.delete").on("click", function () {
            if (confirm(widget.t("sure"))) {
                deleteProgram(editId);
            }
        });

        collapsable(widget.content);

        Socket.onMessage("autobot", function (data) {
            if (data.action == "autobotExecutedScript") {
                if (data.messageData.logs) {
                    var logs = data.messageData.logs;
                    for (var i = 0; i < logs.length; i++) {
                        var log = logs[i];
                        log.unshift("Autobot execution log for '" + data.messageData.program.title + "'");
                        console.log.apply(this, log);
                    }
                }
                if (data.messageData.error) {
                    console.error(
                        "Autobot execution error for '" + data.messageData.program.title + "'",
                        data.messageData.error
                    );
                }
            }
        });
    };
});