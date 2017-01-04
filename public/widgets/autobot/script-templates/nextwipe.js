// display next wipe date when an user enter #nextwipe in chat
variable("sendmessage", "text", "The message to send", "Next wipe on 22.02.2022");

if (context == "chat" && chatMessage == "#nextwipe") {
    say(sendmessage);
}