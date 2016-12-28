"use strict";
/**
 * Main script
 */

Error.stackTraceLimit = Infinity;

require(__dirname + "/routes");
require(__dirname + "/rconserver");
require(__dirname + "/websocketmgr");