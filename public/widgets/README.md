# Widget development

Widgets are designed to have the best high level api so you can easily extend and use features of rcon web admin. There are already some core widgets from which you can start learning.

## A new widget
Creating a new widget is straight forward. Just copy one of the existing widgets. Rename the copied folder. Modify the `manifest.json` to your needs. `id` must be the folder name. Restart the server and you should see the widget in the dashboard.

## Documentation for widgets
The widget class itself have a good code documentation. Here you can see what functions you can use or override. 
* For backend: https://github.com/brainfoolong/rcon-web-admin/blob/master/src/widget.js
* For frontend: https://github.com/brainfoolong/rcon-web-admin/blob/master/public/scripts/widget.js

## Widget as core widget
If you've developed a widget and you think it's good for a core widget than you have to deal with following requirements for your widget.

* MIT License
* Public github repository

## List of core widgets
* https://github.com/brainfoolong/rwa-autobot
* https://github.com/brainfoolong/rwa-console
* https://github.com/brainfoolong/rwa-rustboard


## Tips
* Everytime you change something in the `backend.js` you must restart the server.
* Everytime you change something in the `frontend.js` you must reload (F5) the frontend page.

## More help coming soon
Currently there is no more help.

