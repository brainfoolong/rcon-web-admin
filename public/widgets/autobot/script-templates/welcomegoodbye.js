// just say hello and goodbye to users
if(context == "connect") {
    say("Welcome " + user.name);
}
if(context == "disconnect") {
    say("Good bye " + user.name);
}