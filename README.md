# RCON Web Admin

<img src="https://brainfoolong.github.io/rcon-web-admin/images/screenshots/dashboard.jpg" width="19%"><img src="https://brainfoolong.github.io/rcon-web-admin/images/screenshots/autobot.jpg" width="19%"><img src="https://brainfoolong.github.io/rcon-web-admin/images/screenshots/server-management.jpg" width="19%"><img src="https://brainfoolong.github.io/rcon-web-admin/images/screenshots/ucc.jpg" width="19%"><img src="https://brainfoolong.github.io/rcon-web-admin/images/screenshots/widgets.jpg" width="19%">

RCON Web Admin as a powerful web interface to control your RCON server, e.g: for Rust game servers, but not limited to. Every RCON server will work.

The most powerful feature is that this web admin can run on a server, raspberry pi or another device that is online 24/7. It does all jobs for you, even if you are not connected to the interface. You can install this almost everywhere.

So imagine you've set-up rcon web admin so that it check users for high ping, VAC status or chat filter. The RCON web admin does it 24/7 for you, no need to have a tool opened all the time.

## Features

* Full administration via your browser, it's just a website
* Unlimited users and servers, Admin roles can manage servers, users can use the dashboard
* Powerful widget system - Developers can add new features for the dashboard easily
* Responsible - The frontend is designed for every device, desktop or smartphone.
* Run on every device that can install node.js
* So many more... Give it a try

## Widgets 
The widgets are so powerful, they deserve an extra header here. All dashboard things are written in widgets. From the simplest to the most powerful tool, widgets are the way to go. There are some core widgets, most noticable `autobot`. That can do so many jobs for you. As mentioned above, setup scripts that kick high pings automatically, that kick vac banned people, that say hello to new users, the periodically send chat messages, that ...

Core widgets are automatically kept up2date with their github repositories, or you can trigger updates easily in the interface.

## Requirements
It is required to have `npm`, `node` and `git` properly installed.
* https://nodejs.org
* https://git-scm.com/downloads

On linux you may execute this to git the newest verions of required packages.

    sudo apt-get install nodejs npm git
    sudo npm update npm -g

Installation FAQ see bellow.

## Installation

    git clone https://github.com/brainfoolong/rcon-web-admin.git
    cd rcon-web-admin
    npm update
    node src/main.js install-core-widgets
    chmod 0755 -R startscripts *
    
## Start/Stop on linux

    sh startscripts/start-linux.sh start
    sh startscripts/start-linux.sh stop
    sh startscripts/start-linux.sh restart
    
## Start/Stop on windows - Close cmd window to close

    startscripts/start-windows.bat
    
Then goto: http://yourserverip:4326 (You can also use your hostname instead of ip).
To modify the :4326 port or allowed hosts, have a look in the `config.template.js` file in the root folder.

## Startup/Shutdown scripts

For linux you can start the rcon web admin with your server start. For example on ubuntu symlink `startscripts/runscript-linux.sh` to `/etc/rc2.d/S01Rconwebadmin` for automatic boot with server start.

    Linux : startscripts/start-linux.sh (start/stop/restart/status)

## Widget developers
Goto https://github.com/brainfoolong/rcon-web-admin/tree/master/public/widgets for more information.

## Installation FAQ
    
Linux: If you've installed it and `node` as not available but `nodejs` is, than create a symlink with 

    sudo ln -s `which nodejs` /usr/bin/node
    
RaspberryPi: You may not be able to run the server or `npm update` that is required bellow, or the node modules do not download. This will be because of a very old npm/nodejs version (for old raspberry pi for example). So you have to update nodejs and npm to a new version. **Warning**: This will delete old nodejs and npm installation. Make some backups before you do this.

    sudo apt-get purge nodejs npm
    ## Pi2 -> wget https://nodejs.org/dist/v6.9.3/node-v6.9.3-linux-armv7l.tar.xz -O node.tar.xz
    ## Pi A/A+, B/B+ und Zero (ARMv6) -> wget https://nodejs.org/dist/v6.9.3/node-v6.9.3-linux-armv6l.tar.xz -O node.tar.xz
    tar -xvf node.tar.xz
    cd node-v6.9.3-linux-armv*
    sudo cp -R * /usr/local/
    