// repeatedly, every x minutes, send a message as server
variable("chatmessage", "text", "The message to send", "This server give a hug to you all, every 30 minutes");
variable("minutes", "number", "How often this should be sent, in minutes", 30);

if (context == "update") {
    var storageKey = "lastsend";
    var lastSend = storage.get(storageKey) || 0;
    var unixtime = new Date().getTime() / 1000;
    if (lastSend <= unixtime) {
        storage.set(storageKey, unixtime + 60 * minutes);
        say(chatmessage);
    }
}