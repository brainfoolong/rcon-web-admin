"use strict";

Widget.register(function (widget) {

    var titleEl = $('<div class="form-group has-feedback input-group form-inline">' +
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
    var programSelect = $('<div class="spacer"></div><div class="program-select">' +
        '<select class="selectpicker" data-live-search="true">' +
        '<option value="" data-keep="1">' + widget.t("list.programs") + '</option>' +
        '<option value="-" data-keep="1">' + widget.t("new.program") + '</option>' +
        '</select>' +
        '</div>');
    var editor = $('<div class="editor">');

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
            if (messageData !== true) {
                note(messageData.replace(/\n/g, "<br/>"), "danger");
                return;
            }
            widget.backend("save", {
                "id": editId,
                "script": script,
                "title": title,
                "active": titleEl.find("select").val() == "yes"
            }, function (messageData) {
                editId = messageData.id;
                loadProgram(editId);
                updatePrograms(function () {
                    programSelect.find("select").selectpicker("val", editId);
                    Storage.set("widget.chatbot.id", editId);
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
     * @param {string} id
     */
    var loadProgram = function (id) {
        actionBtns.find(".btn.delete").toggleClass("hidden", id === null);
        widget.backend("load", {"id": id}, function (messageData) {
            programSelect.find("select").selectpicker("val", id);
            titleEl.find("input").val(messageData ? messageData.title : "");
            titleEl.find("select").selectpicker("val", !messageData || messageData.active ? "yes" : "no");
            aceSession.setValue(messageData ? messageData.script : "");
            Storage.set("widget.chatbot.id", id);
            actionBtns.find(".btn.save").addClass("hidden");
        });
    };

    /**
     * Update the programs select list
     * @param {function=} callback
     */
    var updatePrograms = function (callback) {
        // load existing programs
        widget.backend("list", null, function (messageData) {
            var s = programSelect.find("select");
            s.find("option").not("[data-keep]").remove();
            $.each(messageData, function (programKey, programValue) {
                s.append($('<option>').attr("value", programValue.id).html(programValue.title));
            });
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
            ace.config.set('basePath', 'widgets/chatbot/ace');
            aceEditor.setOptions({
                fontSize: "14px"
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
        };
        if (!window.ace) {
            $.getScript("widgets/chatbot/ace/ace.js", aceCallback);
        } else {
            aceCallback();
        }

        widget.content.on("change", ".program-select select", function (ev) {
            editId = $(this).val();
            if (editId.length) {
                if (editId === "-") {
                    editId = null;
                }
                loadProgram(editId);
            }
        }).on("change input", function (ev) {
            actionBtns.find(".btn.save").removeClass("hidden");
        });

        widget.content.append(titleEl);
        widget.content.append(editor);
        widget.content.append(programSelect);
        widget.content.append(actionBtns);
        widget.content.find(".selectpicker").selectpicker();

        updatePrograms(function () {
            editId = Storage.get("widget.chatbot.id");
            if (editId) {
                loadProgram(editId);
            }
        });

        actionBtns.find(".btn.save").on("click", saveProgram);
        actionBtns.find(".btn.delete").on("click", function () {
            if (confirm(widget.t("sure"))) {
                deleteProgram(editId);
            }
        });
    };
});