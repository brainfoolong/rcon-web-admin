#!/bin/sh
### BEGIN INIT INFO
# Provides: RCON Web Admin
# Required-Start: $local_fs $network
# Required-Stop: $local_fs $network
# Default-Start: 2 3 4 5
# Default-Stop: 0 1 6
# Description: RCON Web Admin
### END INIT INFO

 #####
DIR=$(dirname $0)
###### RCON web admin server start/stop script ######
case "$1" in
start)
"${DIR}/start-linux.sh" start
;;
stop)
"${DIR}/start-linux.sh" stop
;;
restart)
"${DIR}/start-linux.sh" restart
;;
status)
"${DIR}/start-linux.sh" status
;;
*)
echo "Usage: {start|stop|restart|status}" >&2
exit 1
;;
esac
exit 0