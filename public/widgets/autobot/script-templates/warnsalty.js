// warn users that say 'fuck' multiple times, kick if he does it multiple times over a period of x seconds
variable("lifetime", "number", "The time span how long the counter should keep it's value", 300);
variable("times", "number", "How many times an user can violate a rule before kick", 3);
variable("filter", "text", "Filter for given words, regex allowed", "fuck");

if (context == "chat" && chatMessage.match(new RegExp(filter, "i"))) {
    var storageKey = "abuse.user." + user.id;
    var count = storage.get(storageKey) || 0;
    count++;
    storage.set(storageKey, count, lifetime);
    if (count > times) {
        // notice this callback, you must wait for the say command to finish
        say("Sorry " + user.name + ", get a kick for your saltyness");
        cmd("kick " + user.id);
    } else {
        say("Keep your language friendly, you've done that " + count + " times");
    }
}