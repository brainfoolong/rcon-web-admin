"use strict";
/**
 * Translations
 */

var lang = {};

/**
 * Just get a translation value for given key
 * @param {string} key
 * @param {object=} params
 * @return {string}
 */
lang.get = function (key, params) {
    var v = key;
    if (typeof lang.values[lang.language] != "undefined" && typeof lang.values[lang.language][key] != "undefined") {
        v = lang.values[lang.language][key];
    } else if (typeof lang.values["en"] != "undefined" && typeof lang.values["en"][key] != "undefined") {
        v = lang.values["en"][key];
    }
    if (typeof params != "undefined") {
        for (var i in params) {
            if (params.hasOwnProperty(i)) {
                v = v.replace(new RegExp("{" + i + "}", "ig"), params[i]);
            }
        }
    }
    return v;
};

/**
 * Replace all placeholders in html with proper translation values
 * @param {JQuery} el The element to replace values in
 * @param {Widget=} widget If given than use the t() function of the widget
 */
lang.replaceInHtml = function (el, widget) {
    var get = widget ? widget.t : lang.get;
    var elements = el.find("[data-translate]");
    elements.each(function () {
        $(this).html(get($(this).attr("data-translate")));
    });
    elements.removeAttr("data-translate");
    elements = el.find("[data-translate-property]");
    elements.each(function () {
        var s = $(this).attr("data-translate-property").split(",");
        $(this).attr(s[0], get(s[1]));
    });
    elements.removeAttr("data-translate-property");
};

/**
 * The translation values
 * @type {object.<string, object<string, string>>}
 */
lang.values = {"en": {}, "de": {}};

// en values
lang.values.en = {
    "users.title": "User Control Center",
    "users.username.title": "Username",
    "users.username.info": "Only A-Z, Numbers, - and _ allowed",
    "users.password.title": "Password",
    "users.password.info": "Repeat it if changed, could be empty when you edit an user. Will be saved as hash",
    "users.admin.title": "Administrator",
    "users.admin.info": "Admin can manage everything, User is only allowed to manage own assigned servers",
    "users.restrictcommands.title": "Restrict access to server commands",
    "users.restrictcommands.info": "Comma separated list of server commands (regex allowed) that this user cannot execute",
    "users.restrictwidgets.title": "Disable widgets",
    "users.restrictwidgets.info": "The user cannot see this widgets in the dashboard. Neither use or add.",
    "users.readonlyoptions.title": "Read-only widget options",
    "users.readonlyoptions.info": "The user cannot change options in the widgets options tab",
    "users.error.pwmatch": "Password did not match",
    "users.missing.admin": "At least one administrator must exist in user database",
    "settings.title": "Settings",
    "servers.title": "Server Management",
    "servers.name.title": "Name",
    "servers.name.info": "Set an individual name for this server, appear in lists",
    "servers.game.title": "Game",
    "servers.game.info": "Select a specific game for this server",
    "servers.game.other": "Other",
    "servers.host.title": "Server Host",
    "servers.host.info": "IP or domain",
    "servers.rcon_port.title": "RCON Port",
    "servers.rcon_port.info": "The port to the RCON interface",
    "servers.rcon_password.title": "RCON Password",
    "servers.rcon_password.info": "Will be stored as cleartext in database. Required to run background " +
    "cronjobs for scheduled tasks. Don't panic, it's not readable without server access." +
    "The one that means 'rcon.password' in console",
    "servers.active.title": "Active",
    "servers.active.info": "If no than this server is not available in the dashboard and do not execute any backend jobs",
    "servers.webrcon.title": "Web Rcon",
    "servers.webrcon.info": "Especially Rust provide a Web Rcon interface. This must be yes if server is started with rcon.web 1. If available, this feature should be used because of a way better performance and stability.",
    "servers.users.title": "Assigned users",
    "servers.users.info": "Only the given user's will see this server",
    "delete.confirm": "Are you sure? This cannot be undone!",
    "login.remember": "Remember me",
    "login.title": "Welcome",
    "login.success": "Hello",
    "login.failed": "Login failed",
    "logout.title": "Bye bye",
    "logout": "Logout",
    "index.pickserver": "Pick a server",
    "index.addwidget": "Add a widget",
    "index.noserver": "Please choose a server",
    "index.nowidgets": "No widgets added, time to start with it.",
    "index.serveroffline": "The current selected server is not available anymore. Maybe gone offline?",
    "index.widget.delete": "Delete this widget",
    "index.widget.size.title": "Widget size",
    "index.widget.size.info": "The size in the layout.",
    "index.widget.size.value.small": "Small | 3 per row",
    "index.widget.size.value.medium": "Medium | 2 per row",
    "index.widget.size.value.large": "Large | 1 per row",
    "index.widget.position.title": "Widget position",
    "index.widget.position.info": "The layout position for this widget in ascending order.",
    "index.widget.layout.save": "You need to reload the page to see the changes",
    "index.tooltip.options": "Options",
    "index.tooltip.layout": "Layout",
    "index.tooltip.readme": "Readme",
    "index.tooltip.content": "Widget",
    "index.tooltip.newversion": "A new version is available",
    "index.widget.error.id": "Widget.id must begin with an a-z character and should only contain: a-z, 0-9, -, _",
    "index.widget.add.error": "Widget not added, it does already exist or you don't have access to it",
    "server.disconnect": "Rcon server disconnected",
    "widgets.title": "Widgets",
    "widgets.installed": "Installed widgets",
    "widgets.games": "Available for those games",
    "widgets.update.available": "Update to version {version}",
    "widgets.update.anyway": "No update available - Update anyway?",
    "widgets.update.error.platform": "One click update is not supported on this platform. Please shutdown server and run 'node main.js update-all-widgets' manually on the command line.",
    "widgets.update.done": "Widget update done",
    "widgets.update.confirm": "Warning: Always make a backup before doing this, in case of any error. The server will shutdown, install the update, and restart automatically. Be aware that, in case of any errors, you might need to startup your server manually.",
    "widgets.update.progress": "Update in progress, you will receive a message that the server is gone. It should load up again automatically",
    "settings.update": "Update Rcon Web Admin",
    "settings.update.done": "Update done. You have to restart the server manually right now.",
    "settings.update.btn": "Update now",
    "settings.logs": "RCON Web Admin logfiles",
    "settings.logs.info": "If anything is going wrong you will probably find some useful debug information in this logs.",
    "settings.log.download": "Download logfiles",
    "settings.update.error.platform": "One click update is not supported on this platform. Please shutdown server and run 'node main.js update-core' manually on the command line.",
    "core.update": "Update available",
    "widget.update": "Widget update available",
    "server.cmd.restricted": "You are not allowed to execute this server command",
    "server.options.restricted": "You are not allowed to edit options",
    "server.widget.restricted": "You are not allowed to use this widget",
    "dashboard": "Dashboard",
    "cancel": "Cancel",
    "save": "Save",
    "save.edited": "Save edited data",
    "saved": "Saved",
    "delete": "Delete",
    "deleted": "Deleted",
    "edit": "Edit",
    "edited": "Edited",
    "submit": "Submit",
    "submitted": "Submitted",
    "yes": "Yes",
    "no": "No",
    "on": "On",
    "off": "Off",
    "sure": "Are you sure?",
    "modal.ok": "Ok",
    "modal.accept": "Accept",
    "modal.cancel": "Cancel",
    "modal.title.alert": "Information",
    "modal.title.confirm": "Confirmation",
    "modal.title.prompt": "Prompt",
    "access.denied": "Access denied",
    "socket.disconnect": "Connection to backend closed, automatically trying to reconnect in 5 seconds..."
};

// de values
lang.values.de = {
    "users.title": "Benutzerverwaltung",
    "users.username.title": "Benutzername",
    "users.username.info": "Nur A-Z, Nummern, - und _ erlaubt",
    "users.password.title": "Passwort",
    "users.password.info": "Wiederholen falls es geändert wird, leerlassen wenn keine Änderung erwünscht. Wird als Hash gespeichert.",
    "users.admin.title": "Administrator",
    "users.admin.info": "Admins können alles sehen und bearbeiten. Benutzer können nur ihre zugeordneten Server und Befehle sehen/ausführen",
    "users.restrictcommands.title": "Beschränke Zugriff auf Serverbefehle",
    "users.restrictcommands.info": "Komma separierte Liste von Serverbefehlen (Regex erlaubt) die der Nutzer nicht ausführen darf",
    "users.restrictwidgets.title": "Deaktivierte Widgets",
    "users.restrictwidgets.info": "Die hier angegebenen Widgets können vom Nutzer nicht gewählt oder gesehen werden",
    "users.readonlyoptions.title": "Read-Only Widget Optionen",
    "users.readonlyoptions.info": "Der Nutzer kann Widgets zwar sehen aber keine Optionen im Optionen Tab editieren",
    "users.error.pwmatch": "Passwörter stimmen nicht überein",
    "users.missing.admin": "Mindestens ein Administrator muss existieren",
    "settings.title": "Einstellungen",
    "servers.title": "Server Management",
    "servers.name.title": "Name",
    "servers.name.info": "Benenne deinen Server, erscheint so in der Liste",
    "servers.game.title": "Spiel",
    "servers.game.info": "Wähle ein Spiel für deinen Server",
    "servers.game.other": "Andere",
    "servers.host.title": "Server Host",
    "servers.host.info": "IP oder Domain",
    "servers.rcon_port.title": "RCON Port",
    "servers.rcon_port.info": "Der Port zum RCON Interface",
    "servers.rcon_password.title": "RCON Passwort",
    "servers.rcon_password.info": "Wird als Klartext gespeichert. Nötig um Hintergundjobs auszuführen und geplante Tasks (Autobot zb.) zu erledigen. Keine Panik, das Passwort ist im Interface nie wieder sichtbar.",
    "servers.active.title": "Aktiv",
    "servers.active.info": "Falls nein dann wird der Server nirgends mehr aufscheinen und Hintergrund Jobs werden auch nicht mehr ausgeführt.",
    "servers.webrcon.title": "Web Rcon",
    "servers.webrcon.info": "Speziell Rust bietet ein Web Rcon Option. Falls du das auf deinem Server aktiviert hast dann musst du hier die Option aktivieren. Wenn möglich, aktiviere das auf deinem Server, es ist stabiler und hat bessere Performance für das RCON Interface.",
    "servers.users.title": "Zugeordnete Benutzer",
    "servers.users.info": "Nur die gewählten Benutzer haben Zugriff auf diesen Server",
    "delete.confirm": "Bist du sicher? Das kann nicht rückgängig gemacht werden!",
    "login.remember": "Eingeloggt bleiben",
    "login.title": "Willkommen",
    "login.success": "Willkommen, Servus, Grias di",
    "login.failed": "Login fehlgeschlagen",
    "logout.title": "Tschüss, Pfiati",
    "logout": "Ausloggen",
    "index.pickserver": "Wähle einen Server",
    "index.addwidget": "Widget hinzufügen",
    "index.noserver": "Kein Server gewählt",
    "index.nowidgets": "Keine Widgets hinzugefügt, Zeit wirds",
    "index.serveroffline": "Der aktuell gewählte Server ist nicht mehr verfügbar, vielleicht ging er Offline?",
    "index.widget.delete": "Widget löschen",
    "index.widget.size.title": "Widget Größe",
    "index.widget.size.info": "Die Größe im Layout.",
    "index.widget.size.value.small": "Klein | 3 pro Reihe",
    "index.widget.size.value.medium": "Mittel | 2 pro Reihe",
    "index.widget.size.value.large": "Groß | 1 pro Reihe",
    "index.widget.position.title": "Widget Position",
    "index.widget.position.info": "Die Position im Layout. Sortierung ist aufsteigend.",
    "index.widget.layout.save": "Du musst die Seite neu laden um die Änderungen zu sehen",
    "index.tooltip.options": "Optionen",
    "index.tooltip.layout": "Layout",
    "index.tooltip.readme": "Readme",
    "index.tooltip.content": "Widget",
    "index.tooltip.newversion": "Neue Version ist verfügbar",
    "index.widget.error.id": "Widget.id muss mit a-z beginnen und darf nur folgende Zeichen beinhalten: a-z, 0-9, -, _",
    "index.widget.add.error": "Widget nicht hinzugefügt, es existiert bereits oder du hast keinen Zugriff darauf",
    "server.disconnect": "Rcon server Verbindungsabbruch",
    "widgets.title": "Widgets",
    "widgets.installed": "Installierte Widgets",
    "widgets.games": "Verfügbar für folgende Spiele",
    "widgets.update.available": "Auf Version {version} aktualisieren",
    "widgets.update.anyway": "Kein Update verfügbar - Trotzdem aktualisieren?",
    "widgets.update.error.platform": "One-Click Update ist auf dieser Platform nicht verfübar. Stoppe den Server und führe 'node main.js update-all-widgets' aus.",
    "widgets.update.done": "Widget update erfolgreich",
    "widgets.update.confirm": "Warnung: Immer ein Backup machen bevor du das ausführst, für den Fall eines Fehlers. RCON Web Admin wird beendet, Updates werden installiert und RCON Web Admin wird automatisch neu gestartet. Sei dir darüber klar, dass im Fehlerfall du manuell den Node Server wieder starten musst.",
    "widgets.update.progress": "Update wird ausgeführt. Du wirst gleich eine Disconnet Meldung sehen. Das Interface sollte automatisch neu laden wenn das Update fertig ist",
    "settings.update": "Update Rcon Web Admin",
    "settings.update.btn": "Jetzt aktualisieren",
    "settings.logs": "RCON Web Admin Logdateien",
    "settings.logs.info": "Falls irgendwas nicht so funktioniert wie erwartet dann findest du hier vielleicht hilfreiche Debug Meldungen.",
    "settings.log.download": "Logs downloaden",
    "settings.update.error.platform": "One-Click Update ist auf dieser Platform nicht verfübar. Stoppe den Server und führe 'node main.js update-core' aus.",
    "core.update": "Update verfügbar",
    "widget.update": "Widget Update verfügbar",
    "server.cmd.restricted": "Du darfst diesen Serverbefehl nicht ausführen",
    "server.options.restricted": "Du darfst die Optionen nicht bearbeiten",
    "server.widget.restricted": "Du darfst dieses Widget nicht benutzen",
    "dashboard": "Dashboard",
    "cancel": "Abbrechen",
    "save": "Speichern",
    "save.edited": "Bearbeitung speichern",
    "saved": "Gespeichert",
    "delete": "Löschen",
    "deleted": "Gelöscht",
    "edit": "Bearbeiten",
    "edited": "Bearbeited",
    "submit": "Absenden",
    "submitted": "Abgesendet",
    "yes": "Ja",
    "no": "Nein",
    "on": "On",
    "off": "Off",
    "sure": "Bist du sicher?",
    "modal.ok": "Ok",
    "modal.accept": "Akzeptieren",
    "modal.cancel": "Abbrechen",
    "modal.title.alert": "Informationen",
    "modal.title.confirm": "Bestätigung",
    "modal.title.prompt": "Warten auf Eingabe",
    "access.denied": "Zugriff verweigert",
    "socket.disconnect": "Verbindung zum Backend geschlossen, erneuter Verbindungsversuch in 5 Sekunden..."
};

/**
 * The current language, default to en
 * @type {string}
 */
lang.language = "en";

// check for a other supported language depending on the users defined languages
if (navigator.languages) {
    (function () {
        for (var i = 0; i < navigator.languages.length; i++) {
            var l = navigator.languages[i];
            if (typeof lang.values[l] != "undefined") {
                lang.language = l;
                break;
            }
        }
    })();
}