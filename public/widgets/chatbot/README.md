# Chatbot Widget

Do something when an user send a chat message in-game. It's fully scriptable via javascript.

## Example: Echobot
    
    say("Echobot: " + message);
    
## Example: Next wipe date

    if(message == "#nextwipe") {
        say("Next wipe on 22.02.2022");
    }
    
## Example: Warn user for salty language, count up variable

    if(message.match(/fuck/i)) {
        var storageKey = "abuse.user." + user;
        var count = storage.get(storageKey) || 0;
        count++;
        storage.set(storageKey, count, 10);
        if(count > 3) {
            say("Sorry dude "+user+", get a ban for your saltyness");
        }else{
            say("Keep your language friendly, you've done that "+count+" times");
        }
    }
    
    
## Pre-defined variables

You can use this variables in your script, we pass it to the script scope when executing.

    user // the user that sent the chat message
    message // the chat message
    timestamp // the javascript date instance when the server received the chat message

## Pre-defined methods

You can use this methods to send a chat message or to execute any command you like.

    say(message) // say a message as server
    cmd(cmd) // execute any rcon command
    storage.set(key, value, lifetime) // set value in permanent storage, lifetime in seconds, ommit if no timeout
    storage.get(key) // get value from permanent storage
    
## Tips

* Script execution will terminate after 10 seconds. Don't use intervals or timeouts.
* For some games a chat message with a slash at beginning will never be catched. Use a hashtag for user trigger commands like #nextwipe