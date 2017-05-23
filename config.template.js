/**
 * User configuration
 * Copy to config.js to enable it
 */
var config = {
    /**
     * The host to bind the webinterface to
     * null if you want allow every hostname
     */
    "host": null,

    /**
     * The full wss:// url to the websocket
     * Null if default, only required to change when you proxy your application
     */
    "websocketUrlSsl": null,

    /**
     * The full ws://
     * Null if default, only required to change when you proxy your application
     */
    "websocketUrl": null,

    /**
     * The port for the server and websocket
     * The given number is the one for the webinterface
     * The given number + 1 is the websocket port
     * Notice that both given number and the number+1 will be required
     */
    "port": 4326
};

module.exports = config;