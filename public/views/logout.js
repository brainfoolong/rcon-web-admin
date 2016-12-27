"use strict";
View.register("logout", function () {
    Storage.set("loginName", null, true);
    Storage.set("loginHash", null, true);
    Storage.set("loginName", null, false);
    Storage.set("loginHash", null, false);
    View.load("index");
});