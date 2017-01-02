# Console widget

Read and control the command line rcon console of your server. You will have access to all rcon commands and you are able to execute all commands. This is the most powerful thing you can do with RCON but it also requires some knowledge about the commands.

# Features
* Persistent serverlog - Will be stay even after server restart's
* Execute rcon commands
* See all available commands
* Some advanced filter's for serverlogs

# Limits

The persistent serverlog contains a maximum of 1MB of logs. If this limit has been reached than all old messages will be truncated from the log files. It really make no sense to display more than this limit of data in the frontend UI, it will already lag as hell with that limit.