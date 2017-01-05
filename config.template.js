/**
 * User configuration
 * Copy to config.js to enable it
 */
var config = {
    /**
     * The host to bind the webinterface to
     * null if you want allow every hostname
     */
    "host" : null,

    /**
     * The port for the server and websocket
     * The given number is the one for the webinterface
     * Notice that both given number and the number+1 will be required
     */
    "port" : 4310,

    /**
     * Is automatic widget update enabled on server start
     * If you disable this before first server start you will have no widgets installed
     */
    "autoWidgetUpdate" : true
};

module.exports = config;