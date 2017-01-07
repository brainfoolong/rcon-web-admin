#!/bin/sh

BASEDIR=$(dirname "$0")
cd "${BASEDIR}"

case "$1" in
	start)
		if [ -e rconwebadmin.pid ]; then
			if ( kill -0 $(cat rconwebadmin.pid) 2> /dev/null ); then
				echo "The server is already running, try restart or stop"
				exit 1
			else
				echo "rconwebadmin.pid found, but no server running. Possibly your previously started server crashed"
				echo "Please view the logfile for details."
				rm rconwebadmin.pid
			fi
		fi
		if [ "${UID}" = "0" ]; then
			echo WARNING ! For security reasons we advise: DO NOT RUN THE SERVER AS ROOT
			c=1
			while [ "$c" -le 10 ]; do
				echo -n "!"
				sleep 1
				c=$(($c+1))
			done
			echo "!"
		fi
		echo "Starting the RCON web admin server"
		node ../src/main.js start > ../logs/output.log 2> ../logs/error.log &
		PID=$!
		ps -p ${PID} > /dev/null 2>&1
		if [ "$?" -ne "0" ]; then
			echo "RCON web admin server could not start"
		else
			echo $PID > rconwebadmin.pid
			echo "RCON web admin server started, for details please view the log file"
		fi
	;;
	stop)
		if [ -e rconwebadmin.pid ]; then
			echo -n "Stopping the RCON web admin server"
			if ( kill -TERM $(cat rconwebadmin.pid) 2> /dev/null ); then
				c=1
				while [ "$c" -le 300 ]; do
					if ( kill -0 $(cat rconwebadmin.pid) 2> /dev/null ); then
						echo -n "."
						sleep 1
					else
						break
					fi
					c=$(($c+1))
				done
			fi
			if ( kill -0 $(cat rconwebadmin.pid) 2> /dev/null ); then
				echo "Server is not shutting down cleanly - killing"
				kill -KILL $(cat rconwebadmin.pid)
			else
				echo "done"
			fi
			rm rconwebadmin.pid
		else
			echo "No server running (rconwebadmin.pid is missing)"
			exit 7
		fi
	;;
	restart)
		sh start-linux.sh stop && sh start-linux.sh start || exit 1
	;;
	status)
		if [ -e rconwebadmin.pid ]; then
			if ( kill -0 $(cat rconwebadmin.pid) 2> /dev/null ); then
				echo "Server is running"
			else
				echo "Server seems to have died"
			fi
		else
			echo "No server running (rconwebadmin.pid is missing)"
		fi
	;;
	*)
		echo "Usage: ${0} {start|stop|restart|status}"
		exit 2
esac
exit 0