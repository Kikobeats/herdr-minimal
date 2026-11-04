#!/bin/sh

mode=$1

if [ "$mode" = "on" ]; then
  exec /usr/bin/caffeinate -dimsu
fi

if [ "$mode" != "agent" ]; then
  exit 64
fi

awake_pid=""

stop_awake() {
  if [ -n "$awake_pid" ]; then
    kill "$awake_pid" 2>/dev/null
    wait "$awake_pid" 2>/dev/null
    awake_pid=""
  fi
}

trap 'stop_awake; exit 0' HUP INT TERM
trap stop_awake EXIT

while true; do
  if hc ls --json 2>/dev/null | plutil -extract terminals json -o - - 2>/dev/null | grep -q '"status":"working"'; then
    if [ -z "$awake_pid" ] || ! kill -0 "$awake_pid" 2>/dev/null; then
      /usr/bin/caffeinate -dimsu &
      awake_pid=$!
    fi
  else
    stop_awake
  fi
  sleep 2
done
