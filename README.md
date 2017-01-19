# RCON Web Admin | Alpha

RCON Web Admin as a powerful web interface to control your RCON server, e.g: for Rust game servers, but not limited to. Every RCON server will work.

The most powerful feature is that this web admin can run on a server, raspberry pi or another device that is online 24/7. It does all jobs for you, even if you are not connected to the interface. You can install it almost everywhere.

So imagine you've set-up rcon web admin so that it check users for high ping, VAC status or chat filter. The RCON web admin does it 24/7 for you, no need to have a tool opened all the time.

**Notice:** Currently this all is in alpha state and as with all software it need more tests to be stable. If you're interested, please help me with tests and your time. Also almost all things are currently tested for rust game servers. But the system is built to support every rcon server, like counterstrike, minecraft, etc...

`if(youLikeThisRepository === true && spendMeSomeRedBullOrCoffee === true) echo I would really appriciate that` https://www.paypal.me/brainfoolong

## Features

* Full administration via your browser, it's just a website
* Unlimited users and servers, Admin roles can manage servers, users can use the dashboard
* Powerful widget system - Developers can add new features for the dashboard easily
* Responsible - The frontend is designed for every device, desktop or smartphone.
* Run on every device that can install node.js
* So many more... Give it a try

## Supported/tested games

* Rust
* Counter-Strike: Go
* Minecraft

## Widgets 
The widgets are powerful, they deserve an extra header here. All dashboard things are written in widgets. From the simplest to the most powerful tool, widgets are the way to go. They are some sort of "High level" programs inside the rcon web admin. You don't have to dig much into the code to write widgets. It's basically HTML and JS.

## Installation Windows
* Download and install node.js (https://nodejs.org)
* Download zip repository and unpack wherever you want
* Open command line and goto unpacked folder (root of the application where the `package.json` is)

Run following commands

    npm install
    node src/main.js install-core-widgets
    
# Installation Linux
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
    
# Installation Raspberry pi
See FAQ bellow.
    
## Start/Stop on Linux

    sh startscripts/start-linux.sh start
    sh startscripts/start-linux.sh stop
    sh startscripts/start-linux.sh restart
    
## Start/Stop on Windows - Close cmd window to close

    startscripts/start-windows.bat
    
Then goto: http://yourserverip:4326 (You can also use your hostname instead of ip).
To modify the :326 port or allowed hosts, have a look in the `config.template.js` file in the root folder.

## Boot scripts

On linux you can start the rcon web admin with your server start. For example on ubuntu you can simply add a `crontab -e` line. Do this with the user you want to start the script with, not `sudo`.
    
    @reboot /path/to/startscripts/start-linux.sh start

## Widget developers

Goto https://github.com/brainfoolong/rcon-web-admin/tree/master/public/widgets for more information.

## Installation FAQ

Linux: If you've installed it and `node` as not available but `nodejs` is, than create a symlink with 

    sudo ln -s `which nodejs` /usr/bin/node
    
RaspberryPi: You may not be able to run the server or `npm install`, or the node modules do not download. This will be because of a very old npm/nodejs version (for old raspberry pi for example). So you have to update nodejs and npm to a new version. **Warning**: This will delete old nodejs and npm installation. Make some backups before you do this.

    sudo apt-get purge nodejs npm
    ## Pi2 | wget https://nodejs.org/dist/v6.9.3/node-v6.9.3-linux-armv7l.tar.xz -O node.tar.xz
    ## Pi A/A+, B/B+ und Zero (ARMv6) | wget https://nodejs.org/dist/v6.9.3/node-v6.9.3-linux-armv6l.tar.xz -O node.tar.xz
    tar -xvf node.tar.xz
    cd node-v6.9.3-linux-armv*
    sudo cp -R * /usr/local/
    