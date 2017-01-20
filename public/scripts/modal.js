"use strict";

/**
 * Modal handling
 */
var Modal = {};

/**
 * Show alert box
 * @param {string|JQuery} message
 * @param {function=} callback
 */
Modal.alert = function (message, callback) {
    var e = $("#alert");
    e.modal().one("hidden.bs.modal", callback).find(".modal-body").html(message);
    e.find(".btn").on("click", function () {
            e.modal("hide");
        }
    );
    e.find(".selectpicker").selectpicker();
};

/**
 * Show confirm box
 * @param {string|JQuery} message
 * @param {function=} callback
 */
Modal.confirm = function (message, callback) {
    var e = $("#confirm");
    e.modal().one("hidden.bs.modal", function () {
            if (callback) callback(false);
        }
    ).find(".modal-body").html(message);
    e.find(".btn-primary").on("click", function () {
            if (callback) callback(true);
            callback = null;
            e.modal("hide");
        }
    );
    e.find(".btn-default").on("click", function () {
            if (callback) callback(false);
            callback = null;
            e.modal("hide");
        }
    );
    e.find(".selectpicker").selectpicker();
};

/**
 * Show confirm box
 * @param {string|JQuery} message
 * @param {string} placeholder
 * @param {function=} callback
 */
Modal.prompt = function (message, placeholder, callback) {
    var e = $("#prompt");
    e.modal().one("hidden.bs.modal", function () {
            if (callback) callback(false);
        }
    ).find(".modal-body .message").html(message);
    var i = e.find(".modal-body input");
    i.val('');
    i.off("keyup").on("keyup", function (ev) {
        if (ev.keyCode == 13) {
            if (callback) callback(i.val());
            callback = null;
            e.modal("hide");
        }
    });
    i.attr("placeholder", placeholder);
    e.find(".btn-primary").on("click", function () {
            if (callback) callback(i.val());
            callback = null;
            e.modal("hide");
        }
    );
    e.find(".btn-default").on("click", function () {
            if (callback) callback(false);
            callback = null;
            e.modal("hide");
        }
    );
    i.focus();
    e.find(".selectpicker").selectpicker();
};