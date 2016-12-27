"use strict";

/**
 * Just get a translation value for given key
 * @param {string} key
 * @param {object=} params
 * @return {string}
 */
function t(key, params) {
    return lang.get(key, params)
}

/**
 * Display a loading spinner in a given element
 * @param {string|jQuery} el
 */
function spinner(el) {
    el = $(el);
    el.html('<div class="spinner">' +
        '<div class="bounce1"></div>' +
        '<div class="bounce2"></div>' +
        '<div class="bounce3"></div>' +
        '</div>');
}

/**
 * Show a note message on top
 * @param {string} message
 * @param {string=} type
 */
function note(message, type) {
    $.notify({
        "message": t(message)
    }, {
        "type": typeof type == "undefined" ? "info" : type,
        placement: {
            from: "top",
            align: "center"
        },
    });
}

/**
 * Populate form data properties
 * @param {jQuery} form
 * @param {object} data
 */
function populateForm(form, data) {
    if (!form || !form.length) return;
    $.each(data, function (key, value) {
        var ctrl = $('[name=' + key + ']', form);
        switch (ctrl.prop("type")) {
            case "select":
                $(this).val(value).selectpicker("refresh");
                break;
            case "radio":
            case "checkbox":
                ctrl.each(function () {
                    if ($(this).attr('value') == value) $(this).attr("checked", value);
                });
                break;
            default:
                ctrl.val(value);
        }
    });
}

$(document).ready(function () {
    // do some hamburger and navigation magic
    (function () {
        var trigger = $('.hamburger'),
            overlay = $('.overlay'),
            isClosed = false;

        trigger.click(function () {
            hamburger_cross();
        });

        function hamburger_cross() {

            if (isClosed == true) {
                overlay.hide();
                trigger.removeClass('is-open');
                trigger.addClass('is-closed');
                isClosed = false;
            } else {
                overlay.show();
                trigger.removeClass('is-closed');
                trigger.addClass('is-open');
                isClosed = true;
            }
        }

        $('[data-toggle="offcanvas"]').click(function () {
            $('#wrapper').toggleClass('toggled');
        });
    })();

    Socket.connectAndLoadView();
});

// delegate events
$(document).on("click", ".page-link", function (ev) {
    // onclick pagelink
    ev.stopPropagation();
    ev.preventDefault();
    $(".hamburger.is-open").trigger("click");
    var messageData = null;
    var hash = $(this).attr("href").substr(1);
    if ($(this).attr("data-message")) {
        messageData = JSON.parse(atob($(this).attr("data-message")));
        window.location.hash = "#" + hash + "-" + $(this).attr("data-message");
    } else {
        window.location.hash = "#" + hash;
    }
    View.load(hash, messageData);
}).on("click", ".submit-form", function () {
    // onclick form submit btn
    var f = $(this).closest("form");
    var name = f.attr("name");
    if (f[0].checkValidity()) {
        var data = {};
        var formData = f.serializeArray();
        for (var i in formData) {
            data[formData[i].name] = formData[i].value;
        }
        var view = f.attr("data-view");
        var messageData = {
            "form": name,
            "btn": $(this).attr("data-name"),
            "formData": data
        };
        // if view not given, just use the current view
        if (!view) {
            var hashData = View.getViewDataByHash();
            view = hashData.view;
            if (hashData.messageData) {
                $.extend(messageData, hashData.messageData);
            }
        }
        // send data to view
        View.load(view, messageData, function (viewData) {
            // just filling data back into form if request does not do reset the form
            if (!viewData.resetForm) {
                populateForm($("#content").find("form").filter("[name='" + name + "']"), data);
            }
        });
    } else {
        // on validation error trigger a fake submit button to enable validation UI popup
        $(this).after('<input type="submit">');
        $(this).next().trigger("click").remove();
    }
});

// here we have defined all possible callbacks just for the sake of IDE auto completion

/**
 * Node Message Callback
 * @callback nodeMessageCallback
 * @param {{action: string, messageData: *, callbackId: =int}} responseData
 */