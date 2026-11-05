# Minimal

Minimal is a dark Herdr workspace with a quiet left sidebar, two terminal panes, a narrow bottom status bar, and a coffee-cup control that keeps a Mac awake. It retains Herdr's tabs, agent list, Files panel, and Changes panel while removing the product brand from the top of the sidebar.

![Minimal](preview.png)

## What you see

The window is a dark two-column workspace. A 268 px left sidebar starts with a 46 px plain chrome bar, then Spaces above Agents. The center begins with a 42 px tab bar, followed by framed terminal panes with 10 px corners and 8 px gaps. A hidden 368 px right panel can show Files or Changes. The 28 px status bar across the bottom shows the current computer, branch, agent count, a coffee-cup icon, and the command-palette hint.

The coffee cup becomes bright while Caffeinate is on or waiting for working agents. Click it to open the Caffeinate dialog. The dialog offers On, Agent, and Off. Selecting one closes the dialog immediately.

## How it behaves

Spaces are grouped by machine. Blobatar avatars are downloaded from `blobatar.dev` the first time each space name appears, then saved under `mods/blobatar-spaces/avatars/`. The spaces list reads Git status locally and on connected machines to display repository, branch, and ahead or behind state.

Agents remain Herdr's shipped list. Working agents appear in the status bar count. The Caffeinate Agent mode polls `hc ls --json` every two seconds. When any agent reports `working`, it runs `/usr/bin/caffeinate -dimsu`. When none report `working`, it stops that process and macOS resumes its normal sleep behavior. On runs `caffeinate` continuously. Off stops only the labelled Core terminal owned by this layout.

The sidebar can collapse into a rail. The top-left chrome supplies search and sidebar controls. The right panel is hidden by default and retains its current Files or Changes selection.

## Built from

`layouts/minimal.json` is a clone of Herdr's `main` layout. Its root is a row containing `sidebar` and `work`. `sidebar` contains `no-brand-chrome`, `blobatar-spaces`, and Herdr's shipped `agents` mod. `work` contains the shipped `tabs` mod, an active-tab block with Herdr's shipped `pane` header, a hidden stack containing the shipped `files` and `changes` mods, and `workspace-status-awake`.

`mods/no-brand-chrome/` is a clone of `workspace-chrome`. `mods/blobatar-spaces/` is a clone of `spaces`. `mods/workspace-status-awake/` is a clone of `workspace-status` with the Caffeinate launcher. `mods/caffeinate/` contains the Caffeinate dialog, its Core-terminal lifecycle logic, and `caffeinate.sh`.

The layout calls `mod.open` for Caffeinate. Caffeinate uses `hc get`, `hc run`, and `hc kill` to own a terminal named `herdr-caffeinate` with the label `herdr.caffeinate=true`.

`tools/install.sh` installs the layout into a Herdr home. It supports `install`, `update`, `uninstall`, and `status`, plus `--home PATH` and `--switch`. `tools/test-install.sh` verifies all installer commands against temporary app homes.

## Watch out

This layout is for macOS because `/usr/bin/caffeinate` is macOS-specific. The Caffeinate launcher requires `hc` and a live Herdr Core. It persists the selected mode in shared state under `caffeinate.mode`.

The Blobatar Spaces mod reaches `https://blobatar.dev` to download avatar SVGs. It also runs Git status commands in the displayed repositories. The Caffeinate mod runs a local shell script and starts or stops a labelled terminal. Neither mod sends terminal content to a network service.

The layout depends on Herdr's shipped `agents`, `tabs`, `pane`, `files`, and `changes` mods. Do not rename those references. If a person's installation already has a layout or custom mod with the same name, Herdr's importer must rename the incoming file or folder and every affected `mod` reference.

The installer refuses to overwrite an existing target unless a prior Minimal install marker exists. Update and uninstall move their managed files into `.minimal-layout-backups` under the selected Herdr home.

## Done when

Run `herdr-app check mods/caffeinate` and `herdr-app check mods/workspace-status-awake` successfully. Switch to the `minimal` layout and confirm the bottom coffee cup appears. Click it, select Agent, and confirm the dialog closes. While an agent is working, `hc get --json herdr-caffeinate` reports the `herdr.caffeinate=true` label. Select Off and confirm that command no longer finds the worker.

Run `sh tools/test-install.sh`. It must report a successful install, status, update backup, collision refusal, and uninstall backup.
