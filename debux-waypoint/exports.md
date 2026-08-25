# Exports, events & commands

This resource has **no exports and no network events**. Nothing is registered for other scripts to
call, and nothing is sent between client and server while it runs — the whole thing is client-side
apart from the start banner and the version check.

That is intentional. There is no state worth reaching: the route is rebuilt from scratch roughly once
a second on the client that needs it, and a player's settings live on that player's own machine.

## Commands

| Command | Where | What it does |
| --- | --- | --- |
| `/waypoint` | Client | Toggles the settings panel. The name comes from `Config.Command`; `false` removes it. |
| `/wplane <metres>` | Client | Sets the chevron lane offset live, for calibration. |
| `/wparrow flip` | Client | Flips the chevron heading sign live. |
| `/wparrow <degrees>` | Client | Sets the chevron rotation live. |

There is no console command to re-run the version check, and no admin command of any kind. The
version check runs once, three seconds after the resource starts.

`/waypoint` refuses to open for a player who fails `Config.RequireJob`, with *"You are not allowed to
use this"*. The two calibration commands have no permission check at all — see below.

### Keybind

```lua
Config.Keybind = 'F7'
```

Registered through FiveM's own keymapping, against the command name, described as **Open Waypoint
settings**. Players can rebind it under Settings → Key Bindings → FiveM, and their binding wins over
the config.

Because the mapping is registered against the command, `Config.Command = false` also removes the
keybind. There is no way to have the key without the command.

## Calibration commands

`/wplane` and `/wparrow` exist because chevron orientation depends on how the marker is drawn, and
the only honest way to get it right is to look at it. Both change the running client immediately and
print the value to paste into `config.lua`.

```
/wplane 3.0
```

```
[debux-waypoint] laneOffset = 3.0   (put this in config.lua Config.Chevrons.laneOffset)
```

Positive is right of the direction of travel, negative is left, `0` is the centreline. Called with no
number, or with something that is not a number, it prints its usage instead:

```
[debux-waypoint] usage: /wplane <metres>   (+ = right lane, - = left, 0 = centre)
```

```
/wparrow flip
/wparrow 180
```

```
[debux-waypoint] arrowSign = 1   (put this in config.lua Config.Chevrons.arrowSign)
[debux-waypoint] arrowRotation = 180   (put this in config.lua Config.Chevrons.arrowRotation)
```

`flip` toggles the heading sign, which fixes mirrored arrows. The numeric form rotates them; `0`,
`90`, `180` and `270` are the useful values. Anything else prints the usage line.

Both print to the **client** console, so read them in F8 and not in the server console.

> **These are not restricted.** They are plain client commands with no ace check, so any player can
> run them. What they change is only that player's own chevrons, only until the resource restarts,
> and nothing about it is replicated or saved — but the commands do exist in every player's chat
> autocomplete. Nothing is exposed by them beyond the numbers printed above.

`/wplane` rebuilds the chevron line immediately so the new offset is visible without waiting for the
next route refresh. `/wparrow` takes effect on the next drawn frame.

## NUI callbacks

What the settings panel sends back to the client. Listed for reference; they are internal to the
resource and there is nothing to wire up.

| Callback | Payload | Effect |
| --- | --- | --- |
| `close` | none | Closes the panel and releases the mouse |
| `save` | the full settings table | Applies and writes to KVP, notifies *"Settings saved"* |
| `update` | the full settings table | Applies and writes to KVP silently — this is what makes changes visible as you drag a slider |
| `reset` | none | Restores `Config.Defaults`, writes to KVP, returns the fresh table |
| `setLang` | `{ lang = 'tr' }` | Stores the language, reloads the locale file, returns it |

Only keys that exist in `Config.Defaults` are applied from `save` and `update`. Anything else in the
payload is dropped, so an unknown key can never end up in a player's saved settings.

## Messages sent to the interface

| Action | When | Carries |
| --- | --- | --- |
| `init` | The panel opens | Current settings, `Config.Swatches`, the active locale file, the list of available languages, the current language code, the detected framework name |
| `setOpen` | The panel opens and closes | `open = true` / `false` |
| `frame` | Every frame while a waypoint is active | Per-element enabled flag, style, colour, and the screen-space and text values for the marker, meter, mini-meter, address and arrow |
| `voice` | A prompt is due | The clip key, the language folder to take it from, and the player's volume |

`frame` is also sent once with `active = false` when the waypoint goes away, which is what clears the
HUD. Nothing is sent at all while no waypoint is set.

## Stored data

Two client KVP keys, per player, on that player's own machine:

| Key | Contains |
| --- | --- |
| `debux_waypoint_settings` | The whole settings table as JSON |
| `debux_waypoint_lang` | The chosen language code |

Nothing is written server-side and there is no database. A player who reinstalls FiveM, or joins from
a different machine, starts again from `Config.Defaults` and `Config.Locale`.

New top-level keys added to `Config.Defaults` are filled in for players who already have saved
settings, so an update that adds an element does not need a reset. Changing the value of a key they
already have does not reach them — pressing **Reset** in the panel is the only way.

## What is deliberately not exported

**Setting a waypoint from another script.** There is no need for one. The resource watches for the
player's own waypoint blip and picks it up within about a second, so `SetNewWaypoint` from your own
script already starts the AR route with nothing else to call.

**Reading the route.** It is rebuilt roughly once a second from the client's current position and is
only valid for the frame it was produced in. Anything reading it would be reading a snapshot that is
already out of date.

**Changing a player's settings from the server.** They are stored on the player's machine by design,
which is what avoids a database. There is no channel to push a value down.

## Arrival behaviour

When the player comes within `Config.ArriveRadius` of the destination, the resource calls
`SetWaypointOff()` itself. If you have your own script that reacts to the waypoint being cleared,
expect it to fire on arrival.
