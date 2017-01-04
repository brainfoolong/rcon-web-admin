// restart server each day at 10:00 morning
// be warned: if you don't have clear conditions when the command will fire, than you probably and up in a reboot loop
// when you write it for your own, do some dry runs with log("restart") instead of the real restart command
// and check if your script is working nicely
// allow also for variable restart warning time
variable("restarttime", "number", "Display warning in chat x seconds before the server really restarts", 300);

if (context == "update") {
    var storageKey = "lastrestart";
    var thisDay = new Date().getDay();
    var thisHour = new Date().getHours();
    var thisMinute = new Date().getMinutes();
    var lastRestart = storage.get(storageKey) || thisDay;
    if (!storage.get(storageKey)) storage.set(storageKey, thisDay);
    // only go in when 10 o'clock and only between the first 5 minutes
    // so in worst case this script only fires 5 minutes a day
    if (thisHour == 10 && thisMinute <= 5 && lastRestart != thisDay) {
        storage.set(storageKey, thisDay);
        cmd("restart " + restarttime);
    }
}