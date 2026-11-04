# Caffeinate

Open with `herdr-app do mod.open --name caffeinate`. Selecting a mode applies it and closes the dialog.

The mod owns only Herdr Core terminals labelled `herdr.caffeinate=true`.

`On` runs `/usr/bin/caffeinate -dimsu` until you choose `Off`. `Agent` runs the same command only while `hc ls --json` reports an agent with `status: "working"`. It keeps monitoring after the dialog and Herdr window close because Herdr Core owns the labelled terminal.

The implementation targets macOS. If `caffeinate` is unavailable, the mod displays the Core error.
