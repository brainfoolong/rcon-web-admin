# RCON Web Admin

RCON Web Admin as a powerful web interface to control your RCON server. Every RCON server will work.

The most powerful feature is that this web admin can run on a server, raspberry pi or another device that is online 24/7. It does all jobs for you, even if you are not connected to the interface. You can install it almost everywhere.

So imagine you've set-up rcon web admin so that it check users for high ping, VAC status or chat filter. The RCON web admin does it 24/7 for you, no need to have a tool opened all the time.

# Support me
If you like to buy some coffee, i will appriciate it. You can do this on [Patreon](https://www.patreon.com/brainfoolong) or via [PayPal](https://www.paypal.me/brainfoolong)

## Features

* Full administration via your browser, it's just a website
* Unlimited users and servers, Admin roles can manage servers, users can use the dashboard
* Ever more fine granulated user permissions to restrict access to specific server commands and interface features. If you want a user that only can use the 'say' command, you can do it.
* Powerful widget system - Developers can add new features for the dashboard easily
* Responsible - The frontend is designed for every device, desktop or smartphone.
* Run on every device that can install *node.js*
* Multilanguage interface
* One-Click update for the core and all installed widgets
* rcon.web support (Even better as normal RCON sockets because of better stability)
* Core widgets and their top features
  * Console - Provide a console interface to directly use rcon web commands in the most low level form
  * Autobot - For advanced users, a programmatic interface to write your own little code with high level features
  * Rustboard - A dedicated widget for the game 'Rust', provides a lot usefull tools such as playerlist, banlist, chat, kick/ban/admins/mods, steam information incl. VAC ban checks, and a lot more
  * Timed Commands - As the name say, you can easily schedule any server command you want to execute on a specific date or time.
* So many more... Give it a try

## Supported/tested games

* Rust (Most tested at the moment)
* Counter-Strike: Go (Basic tests with the console widget)
* Minecraft (Basic tests with the console widget)
* Note: Every other RCON supporting game server will work, it's just untested but console widget is generic for all games

## Widgets 
The widgets are powerful, they deserve an extra header here. All dashboard things are written in widgets. From the simplest to the most powerful tool, widgets are the way to go. They are some sort of "High level" programs inside the rcon web admin. You don't have to dig much into the code to write widgets. It's basically HTML and JS.

## Installation Windows
* Download and install node.js (https://nodejs.org)
* Download zip repository and unpack wherever you want
* Open command line and goto unpacked folder (root of the application where the `package.json` is)

Run following commands

    npm install
    node src/main.js install-core-widgets
    
## Installation Linux
Just run all of this commands in the shell. **Note**: Never run this application as root via `sudo`, it is not required. Also never install this application in a webserver directory than can be accessed from the web. The application create an own webserver with limited access to the public folder.

    sudo apt-get install nodejs npm
    sudo npm update npm -g
    wget https://codeload.github.com/brainfoolong/rcon-web-admin/zip/master -O rcon-web-admin.zip
    unzip rcon-web-admin.zip
    mv rcon-web-admin-master rcon-web-admin
    cd rcon-web-admin
    npm install
    node src/main.js install-core-widgets
    chmod 0755 -R startscripts *
    
## Installation Raspberry pi
Same as linux. You may not be able to run the server or `npm install`, or even the node modules do not download. This will be because of a very old npm/nodejs version (for old raspberry pi for example). So you have to update nodejs and npm to a new version. **Warning**: This will delete old nodejs and npm installation. Make some backups before you do this.

    sudo apt-get purge nodejs npm
    ## Pi2 | wget https://nodejs.org/dist/v6.9.3/node-v6.9.3-linux-armv7l.tar.xz -O node.tar.xz
    ## Pi A/A+, B/B+ und Zero (ARMv6) | wget https://nodejs.org/dist/v6.9.3/node-v6.9.3-linux-armv6l.tar.xz -O node.tar.xz
    tar -xvf node.tar.xz
    cd node-v6.9.3-linux-armv*

## Installation Docker
[itzg](https://hub.docker.com/r/itzg/) have made a great docker container for rcon web admin. If you prefer docker, you can do it with https://hub.docker.com/r/itzg/rcon/
    
## Start/Stop on Linux

    sh startscripts/start-linux.sh start
    sh startscripts/start-linux.sh stop
    sh startscripts/start-linux.sh restart
    
## Start/Stop on Windows - Close cmd window to close

    startscripts/start-windows.bat
    
## Open in browser
Goto: http://yourserverip:4326 (You can also use your hostname instead of ip).
To modify the :4326 port or allowed hosts, have a look in the `config.template.js` file in the root folder.

## Boot scripts

On linux you can start the rcon web admin with your server start. For example on ubuntu you can simply add a `crontab -e` line. Do this with the user you want to start the script with, not `sudo`.
    
    @reboot /path/to/startscripts/start-linux.sh start

## Widget developers

Goto https://github.com/brainfoolong/rcon-web-admin/tree/master/public/widgets for more information.

## Troubleshooting

Linux: If you've installed it and `node` as not available but `nodejs` is, than create a symlink with 

    sudo ln -s `which nodejs` /usr/bin/node    
