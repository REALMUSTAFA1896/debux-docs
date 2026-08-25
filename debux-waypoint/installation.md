# Installation

There is no database, no item and no dependency you have to install first. This is a drop-in.

## 1. Drop it in

Put the `debux-waypoint` folder in your resources directory. We recommend a `[debux]` folder so every
DebuX resource starts together:

```
resources/
└── [debux]/
    └── debux-waypoint/
```

The interface is already compiled and ships inside the folder, and so do the voice clips for all ten
languages. There is nothing to build.

## 2. server.cfg

Start `debux-waypoint` **after** ox_lib and after your framework:

```cfg
ensure ox_lib
ensure qbx_core

ensure [debux]
```

On ESX or QBCore the middle line is `ensure es_extended` or `ensure qb-core` instead. On standalone
there is nothing to put above it at all:

```cfg
ensure [debux]
```

Framework detection reads which resources are **started** at the moment `debux-waypoint` starts. If
it starts first it finds nothing running, falls back to standalone, and every player is treated as
logged in with no job — which is fine until you switch `Config.RequireJob` on, at which point nobody
can use the resource.

## 3. Dependencies

| Resource | Required | What breaks without it |
| --- | --- | --- |
| ox_lib | No | Notifications fall back to the framework's own, or to the GTA feed on standalone |
| Qbox / QBCore / ESX | No | Nothing. Standalone arms immediately and skips the login wait |
| oxmysql, a target, an inventory | No | Not used at all |

If you want ox_lib notifications off even though ox_lib is running, set `Config.UseOxLib = false`.

## 4. Set your language

The language is set in `config.lua`, not through a convar:

```lua
Config.Locale = 'tr'
```

Ships with ten: `en, tr, de, fr, es, pt, ru, pl, it, nl`. One file per language under `locales/`,
covering the panel text and the notifications, plus a matching folder of voice clips for each.

**This is only the starting language.** The first time a player picks a language in the panel, their
choice is written to their own machine and yours stops applying to them. Changing `Config.Locale`
later moves new players only.

A locale code with no file falls back to English rather than erroring, so a typo here looks like
"nothing happened".

## 5. Start the server

Two things print. First the resource's own start line:

```
========================================
  DebuX - Waypoint v1.0.0
  AR Navigation Kit
  Framework: auto
========================================
```

> The `Framework:` line repeats what you put in `Config.Framework` — it is not the result of
> detection. Detection happens on the client, so a server console saying `auto` is normal and tells
> you nothing about what was actually found.

Then, about three seconds later, the version check:

```
══════════════════════════════════════════════════════════════════
│ DEBUX WAYPOINT  v1.0.0
│
│ Up to date
══════════════════════════════════════════════════════════════════
```

When a newer build has been published it says so instead, with the download link and the list of
changes:

```
══════════════════════════════════════════════════════════════════
│ DEBUX WAYPOINT  v1.0.0
│
│ Update available  →  v1.1.0
│ Download  https://debux.tebex.io/
│
│ What changed
│   • ...
══════════════════════════════════════════════════════════════════
```

If your server has no outbound internet, or GitHub is unreachable, neither banner appears at all —
the check fails silently by design and nothing else is affected.

There is no console command to re-run the check. It runs once, three seconds after the resource
starts, and restarting the resource is the only way to run it again.

## 6. First-run check

Set a waypoint on the map and get in a car.

| Check | Expected |
| --- | --- |
| Waypoint set, in a vehicle | Chevrons on the road within about a second, plus the HUD elements |
| `/waypoint` or `F7` | The settings panel opens and the mouse is released |
| Switch a tab's toggle off | That element disappears immediately, without closing the panel |
| Change the language in the panel | Panel text and the next spoken prompt both change |
| Drive to the waypoint | *"You have arrived"*, the waypoint clears itself, everything disappears |
| Remove the waypoint mid-route | Everything disappears at once |
| Restart the client | The player's colours, styles and language are still there |

If the chevrons never appear but the HUD does, you are on foot — chevrons are vehicle-only until you
turn `Config.Perf.onFootChevrons` on.

## 7. Rebind the key (optional)

The key is registered through FiveM's own keymapping, so `F7` is only the default:

```lua
Config.Keybind = 'F7'
```

Players can rebind it themselves under **Settings → Key Bindings → FiveM**, and once they have, their
binding wins over anything you set here. To take the key away entirely and leave only the command:

```lua
Config.Keybind = false
```

> Setting `Config.Command = false` removes the keybind as well. The keymapping is registered against
> the command name, so with no command there is nothing to bind and the panel becomes unreachable.

## 8. Restrict it to certain jobs (optional)

Off by default. To gate the whole resource:

```lua
Config.RequireJob = { 'police', 'ambulance' }
```

This is not just the panel — the waypoint scanner checks it too, so players outside the list get no
AR route at all, and opening the panel tells them *"You are not allowed to use this"*.

Job names must match your framework exactly, `police` and not `Police`. On standalone there are no
jobs, so this locks everyone out.
