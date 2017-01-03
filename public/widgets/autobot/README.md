# Autobot Widget

The name is program. Automate commands, schedule commands, simply do "if this than that". You can listen for events, such as incoming chat message, player join. You can do some periodic tasks like sending a server message out every 30 minutes or restart server each day at 06:00 am. You can do an auto-kick/auto-ban feature. We provide many examples for you in this readme to get started. Fully scriptable with, easy to use, all time best, javascript.

## Example: Simple echobot
    
    if(context == "chat") {
        say("Echobot: " + message);
    }
    
## Example: Next wipe date when user enter #nextwipe

    if(context == "chat" && message == "#nextwipe") {
        say("Next wipe on 22.02.2022");
    }
    
## Example: Warn/Kick user for salty language, count up variable

    if(context == "chat" && message.match(/fuck/i)) {
        var storageKey = "abuse.user." + user.id;
        var count = storage.get(storageKey) || 0;
        count++;
        storage.set(storageKey, count, 10);
        if(count > 3) {
            // notice this callback, you must wait for the say command to finish
            say("Sorry " + user.name + ", get a kick for your saltyness", function() {
                cmd("kick " + user.id);
            });
        }else{
            say("Keep your language friendly, you've done that "+count+" times");
        }
    }
    
## Example: Send a server chat message every 30 minutes

    if(context == "update") {
        var storageKey = "lastsend";
        var lastSend = storage.get(storageKey) || 0;
        var unixtime = new Date().getTime() / 1000;
        if(lastSend <= unixtime) {
            storage.set(storageKey, unixtime + 60 * 30);
            say("This server give a hug to you all, every 30 minutes");
        }
    }
    
## Example: Schedule server restart every day at 10:00

    if(context == "update") {
        var storageKey = "lastrestart";
        var thisDay = new Date().getDay();
        var thisHour = new Date().getHours();
        var lastRestart = storage.get(storageKey) || thisDay;
        if(thisHour == 10) {
            storage.set(storageKey, thisDay);
            cmd("restart 300");
        }
    }
    
## Example: Say hello and goodbye to connect and disconnect

    if(context == "connect") {
        say("Welcome " + user.name);
    }
    if(context == "disconnect") {
        say("Good bye " + user.name);
    }
    
## Pre-defined variables

You can use this pre-defined variables in your script.

* context

    Defines in which context this script execution is currently in.  
    * ***update*** = Everytime the backend call the update procedure. Every 10 seconds.
    * ***chat*** = When an user send a chat message.
    * ***connect*** = A player connected to the server.
    * ***disconnect*** = A player disconnected from the server.
    * ***serverMessage*** = A raw rcon message.
    * ***serverMessageLog*** = A raw rcon message log. This is used by some games, like Rust.
    
* message
    
    The raw string message from the server. Just use `log(message)` to see what you get.
    
* user.name, user.id
    
    Automatic filtered data from the raw message. Only available if context is `chat, connect, disconnect`.

## Pre-defined methods

You can use this methods to send a chat message or to execute any command you like.

* **say(message, callback)** = say a chat message as server, the callback will be called when say command have been executed
* **cmd(cmd, callback)** = execute any rcon command, the callback will be called when the command have been executed
* **storage.set(key, value, lifetime)** = set value in permanent storage, lifetime in seconds, ommit if no timeout
* **storage.get(key)** = get value from permanent storage
    
## FAQ

* Every script will be executed each 10 seconds and also everytime a server message has been received. Keep script's simple.
* Script execution will terminate after 5 seconds. Don't use intervals or timeouts.
* Some games ommit chat messages with a beginning slash. If you wish to add a user command feature, use a beginning hashtag, like in the `#nextwipe` example.
* Use `log()` for debugging. Open up the browser console (`F12`) when you write a script. Every `log()` call will show up in the browser console. Also any error will show up in the console as well.