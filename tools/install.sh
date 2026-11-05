#!/bin/sh

set -eu

root=$(CDPATH=''; export CDPATH; cd "$(dirname "$0")/.." && pwd)
app_home=${HERDR_APP_HOME:-${XDG_CONFIG_HOME:-$HOME/.config}/herdr-app}
command_name=""
switch_layout=0

usage() {
  printf '%s\n' "Usage: tools/install.sh [--home PATH] [--switch] install|update|uninstall|status"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --home)
      [ "$#" -ge 2 ] || {
        usage >&2
        exit 2
      }
      app_home=$2
      shift 2
      ;;
    --switch)
      switch_layout=1
      shift
      ;;
    install|update|uninstall|status)
      command_name=$1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      usage >&2
      exit 2
      ;;
  esac
done

[ -n "$command_name" ] || {
  usage >&2
  exit 2
}

marker_dir="$app_home/.minimal-layout"
marker_file="$marker_dir/installed"
backup_root="$app_home/.minimal-layout-backups"
timestamp="$(date +%Y%m%d-%H%M%S)-$$"

layout_target="$app_home/layouts/minimal.json"
mod_names="caffeinate workspace-status-awake no-brand-chrome blobatar-spaces"

targets_exist() {
  [ -e "$layout_target" ] && return 0
  for mod_name in $mod_names; do
    [ -e "$app_home/mods/$mod_name" ] && return 0
  done
  return 1
}

copy_layout() {
  mkdir -p "$app_home/layouts" "$app_home/mods" "$marker_dir"
  cp "$root/layouts/minimal.json" "$layout_target"
  for mod_name in $mod_names; do
    if [ "$mod_name" = "blobatar-spaces" ]; then
      mkdir -p "$app_home/mods/$mod_name"
      cp "$root/mods/$mod_name/main.js" "$root/mods/$mod_name/mod.json" "$app_home/mods/$mod_name"
      mkdir -p "$app_home/mods/$mod_name/avatars"
    else
      cp -R "$root/mods/$mod_name" "$app_home/mods/$mod_name"
    fi
  done
  printf '%s\n' "minimal" > "$marker_file"
}

backup_targets() {
  backup_dir="$backup_root/$timestamp"
  mkdir -p "$backup_dir/layouts" "$backup_dir/mods"
  [ -e "$layout_target" ] && mv "$layout_target" "$backup_dir/layouts/minimal.json"
  for mod_name in $mod_names; do
    [ -e "$app_home/mods/$mod_name" ] && mv "$app_home/mods/$mod_name" "$backup_dir/mods/$mod_name"
  done
  printf '%s\n' "$backup_dir"
}

switch_to_layout() {
  [ "$switch_layout" -eq 1 ] || return 0
  command -v herdr-app >/dev/null 2>&1 || {
    printf '%s\n' "minimal installer: Herdr is not available, so the layout was not switched." >&2
    return 0
  }
  HERDR_APP_HOME="$app_home" herdr-app 'do' layout.switch '{"name":"minimal"}'
}

case "$command_name" in
  install)
    if targets_exist; then
      printf '%s\n' "minimal installer: a target already exists. Use update only after an earlier Minimal install." >&2
      exit 1
    fi
    copy_layout
    switch_to_layout
    printf '%s\n' "minimal installer: installed in $app_home"
    ;;
  update)
    [ -f "$marker_file" ] || {
      printf '%s\n' "minimal installer: no prior Minimal install is recorded in $app_home." >&2
      exit 1
    }
    backup_dir=$(backup_targets)
    copy_layout
    switch_to_layout
    printf '%s\n' "minimal installer: updated in $app_home; previous files moved to $backup_dir"
    ;;
  uninstall)
    [ -f "$marker_file" ] || {
      printf '%s\n' "minimal installer: no prior Minimal install is recorded in $app_home." >&2
      exit 1
    }
    backup_dir=$(backup_targets)
    mv "$marker_file" "$backup_dir/.minimal-installed"
    rmdir "$marker_dir" 2>/dev/null || true
    printf '%s\n' "minimal installer: removed from $app_home; previous files moved to $backup_dir"
    ;;
  status)
    if [ -f "$marker_file" ]; then
      printf '%s\n' "minimal installer: installed in $app_home"
      exit 0
    fi
    printf '%s\n' "minimal installer: not installed in $app_home"
    exit 1
    ;;
esac
