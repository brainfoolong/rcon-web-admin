// display next wipe date when an user enter #nextwipe in chat
variable("chatmessage", "text", "Next wipe on 22.02.2022");

if (context == "chat" && message == "#nextwipe") {
    say(chatmessage);
}