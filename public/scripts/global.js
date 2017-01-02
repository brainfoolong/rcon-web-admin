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
 * @param {number=} delay
 */
function note(message, type, delay) {
    if (delay === -1) delay = 99999999;
    $.notify({
        "message": t(message)
    }, {
        "type": typeof type == "undefined" ? "info" : type,
        placement: {
            from: "top",
            align: "center"
        },
        "delay": delay || 5000,
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

/**
 * Escape html characters for secure dom injection
 * @param {string} string
 * @return {string}
 */
function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
        return escapeHtml.map[s];
    });
}

/**
 * The escape html mapping
 * @type {{}}
 */
escapeHtml.map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
};

$(function () {
    if (typeof WebSocket == "undefined") {
        note("Your browser is not supported in this application (Outdated Browser). Please upgrade to the newest version");
        return;
    }
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
    var body = $("body");
    var hasTouch = true == ("ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch);
    body.addClass(hasTouch ? "no-touch" : "touch");
    // bind tooltips
    $(document).tooltip({
        "selector": '[title]',
        "container": "body"
    }).on("inserted.bs.tooltip", function (ev) {
        var tt = $("#" + $(ev.target).attr("aria-describedby"));
        var i = tt.find(".tooltip-inner");
        i.html(t(i.html()));
        // hide if we are on mobile touch device
        if(hasTouch){
            setTimeout(function () {
                $(ev.target).trigger("mouseout");
            }, 1000);
        }
    });
    // socket stuff
    Socket.connectAndLoadView();
});

$(window).on("popstate", function (ev) {
    // if the state is the page you expect, pull the name and load it.
    if (ev.originalEvent.state && ev.originalEvent.state.hash) {
        var hashData = View.getViewDataByHash("#" + ev.originalEvent.state.hash);
        View.load(hashData.view, hashData.messageData);
    }
});

// here we have defined all possible callbacks just for the sake of IDE auto completion

/**
 * Node Message Callback
 * @callback NodeMessageCallback
 * @param {{action: string, messageData: *, callbackId: =int}} responseData
 */