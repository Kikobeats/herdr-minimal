#!/bin/sh

set -eu

root=$(CDPATH=''; export CDPATH; cd "$(dirname "$0")/.." && pwd)
test_home=$(mktemp -d /tmp/minimal-install-test.XXXXXX)
conflict_home=$(mktemp -d /tmp/minimal-install-conflict.XXXXXX)

sh "$root/tools/install.sh" --home "$test_home" install
test -f "$test_home/layouts/minimal.json"
test -f "$test_home/mods/caffeinate/main.js"
test -d "$test_home/mods/workspace-status-awake"
test -d "$test_home/mods/blobatar-spaces/avatars"
sh "$root/tools/install.sh" --home "$test_home" status

if sh "$root/tools/install.sh" --home; then
  exit 1
fi

printf '%s\n' "changed" >> "$test_home/layouts/minimal.json"
sh "$root/tools/install.sh" --home "$test_home" update
cmp "$root/layouts/minimal.json" "$test_home/layouts/minimal.json"
test -d "$test_home/.minimal-layout-backups"

mkdir -p "$conflict_home/layouts"
printf '%s\n' "unowned" > "$conflict_home/layouts/minimal.json"
if sh "$root/tools/install.sh" --home "$conflict_home" install; then
  exit 1
fi

sh "$root/tools/install.sh" --home "$test_home" uninstall
test ! -e "$test_home/layouts/minimal.json"
test -d "$test_home/.minimal-layout-backups"

printf '%s\n' "ok: install, status, update backup, collision refusal, and uninstall backup passed."
printf '%s\n' "temporary homes retained at $test_home and $conflict_home"
