"use strict";
/**
 * Express routes, url handling
 */

var express = require('express');
var path = require('path');
const app = express();

app.get("/", function (req, res) {
    res.sendFile(path.resolve(__dirname + "/../public/index.html"));
});

app.use(express.static(__dirname + "/../public"));

app.listen(4326, function () {

});
