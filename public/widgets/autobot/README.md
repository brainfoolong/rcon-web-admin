# Autobot Widget

The name is program. Automate commands, schedule commands, simply do "if this than that". You can listen for events, such as incoming chat message, player join. You can do some periodic tasks like sending a server message out every 30 minutes or restart server each day at 06:00 am. You can do an auto-kick/auto-ban feature. We provide many examples for you in this readme to get started. Fully scriptable with, easy to use, all time best, javascript. It's basically a widget in a widget in the rcon web admin, magic, isn't it?

## Templates

There are a lot of ready to start templates that you can choose from. Use this templates also to see what all is possible and how you can do something.
    
## Pre-defined variables

You can use this pre-defined variables in your script.

* context

    Defines in which context this script execution is currently in.  
    * ***update*** = Everytime the backend call the update procedure. Every 10 seconds.
    * ***chat*** = When an user send a chat message.
    * ***connect*** = A player connected to the server.
    * ***disconnect*** = A player disconnected from the server.
    * ***ban*** = A player got banned from server.
    * ***kick*** = A player got kicked from server.
    * ***unban*** = A player got unbanned from server.
    * ***serverMessage*** = A raw rcon message.
    * ***serverMessageLog*** = A raw rcon message log. This is used by some games, like Rust.
    
* message
    
    The raw string message from the server. Just use `log(message)` to see what you get.
    
* user.name, user.id
    
    Automatic filtered data from the raw message. Only available if context is `chat, connect, disconnect, ban(name only), kick(name only)`.
   
* chatMessage
    
    Only set when context is `chat`. Contains the raq chat message.

## Pre-defined methods

You can use this methods to send a chat message or to execute any command you like.

* **say(message, callback)** = say a chat message as server, the callback will be called when say command have been executed
* **cmd(cmd, callback)** = execute any rcon command, the callback will be called when the command have been executed
* **storage.set(key, value, lifetime)** = set value in permanent storage, lifetime in seconds, ommit if no timeout
* **storage.get(key)** = get value from permanent storage
* **variable(name, type, label, defaultValue)** 
    * Add a variable to the script interface. This could be used to allow the script define UI form elements where the user can enter the variable values. See templates for examples.
    * **name** = The name of the variable that than can be used in the script
    * **type** = The variable type, available types: switch, number, text
    * **defaultValue** = The default value of the variable if the user don't change it
* **rust.serverstatus(callback)** = Get a full serverstatus inclusive all players for the server.
    
## FAQ

* Every script will be executed each 10 seconds and also everytime a server message has been received. Keep script's simple.
* Script execution will terminate after 5 seconds. Don't use intervals or timeouts.
* Some games ommit chat messages with a beginning slash. If you wish to add a user command feature, use a beginning hashtag, like in the `#nextwipe` example.
* Use `log()` for debugging. Open up the browser console (`F12`) when you write a script. Every `log()` call will show up in the browser console. Also any error will show up in the console as well.