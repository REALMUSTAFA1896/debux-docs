# Troubleshooting

> **Read this first.** Almost everything here is per player, not per server. Settings are stored on
> each player's own machine, so "it works for me but not for him" is the normal shape of a problem
> with this resource. Before changing `config.lua`, have the player open the panel and press
> **Reset** — that puts them back on your defaults and rules out half of this page.

## Nothing appears when a waypoint is set

**No chevrons, no HUD, no voice, no error.** Work through these in order.

The master switch is off for that player. General tab → *Activate Entire System*. With it off the
waypoint scanner itself stops running, so nothing downstream can fire.

`Config.RequireJob` is set and the player's job is not in it. The gate is checked by the scanner as
well as by the panel, so an unauthorised player gets no route at all rather than an error. Job names
must match your framework exactly — `police`, not `Police`.

You are on standalone with `Config.RequireJob` set to a list. There are no jobs on standalone, so the
check can never pass and the resource is dark for everyone. Set it back to `false`.

The player never finished loading. The resource waits for the framework to report the player as
logged in before it loads their settings at all. On QBCore that means a citizen id; if the player is
stuck at a character selection or a multicharacter screen that never completes, nothing arms. Have
them rejoin.

The waypoint is not a real waypoint. The resource watches the player's own map waypoint. A marker
another script drew with its own blip is not one, and will not be picked up.

**It works, but only after several seconds.** That is the scan interval. The waypoint is looked for
roughly once a second and the first route build follows it — one to two seconds from setting the
waypoint to seeing chevrons is normal.

## The HUD is there but the chevrons are not

**The player is on foot.** Chevrons are vehicle-only by default. To draw them on foot as well:

```lua
Config.Perf.onFootChevrons = true
```

Expect them to run alongside the player rather than under them — a pedestrian is rarely on the road
the route follows.

**`fadeStart` is at or above `chevronDrawDist`.** The fade is calculated across the gap between the
two, so this is not a cosmetic mistake: equal values divide by zero, and a higher `fadeStart` makes
the alpha negative and drops every chevron. Defaults are `90.0` and `140.0`; keep the gap.

**`cullDist` is lower than `chevronDrawDist`.** The cull is a hard straight-line limit applied first,
so whichever is lower is your real draw distance. Defaults are `150.0` and `140.0`.

**`minAhead` is too large.** Everything inside that radius is skipped so the arrows do not render
through the bonnet. Raised past twenty metres or so it starts eating the whole visible stretch.

## The chevrons are in the wrong place

**They are in the oncoming lane.** The route snaps to the road centreline, and the lane shift is what
moves them across. Find the right value live, then paste it in:

```
/wplane 3.0
```

Positive is right of travel, negative is left. The command prints the value for
`Config.Chevrons.laneOffset`. Wide multi-lane roads may want `4.0`–`5.0`; narrow country roads look
better nearer `2.0`.

**They point backwards, or lean the wrong way through corners.** Two separate settings, and it is
worth doing them in this order. Flip the sign first:

```
/wparrow flip
```

Then rotate until they point forward down the road:

```
/wparrow 180
```

Both print what to put in `Config.Chevrons.arrowSign` and `arrowRotation`. The overrides are
per-client and last until the resource restarts, so put them in `config.lua` once you are happy.

**They float above the road, or sink into it.** First try `Config.Chevrons.height` — `0.25` is the
default, and a small nudge either way fixes plain z-fighting.

If instead they are metres out, the ground probe is being rejected. A probe landing more than
`snapTolerance` (`16.0`) from the routed height is treated as a bridge deck or a tunnel roof and
thrown away, keeping the routed height. That is deliberate — raising it towards the height of your
tallest overpass will start snapping chevrons onto the wrong deck instead.

**They are briefly wrong after a fast teleport.** Ground probes need map collision to be streamed in.
A chevron whose probe fails is retried for five frames and then drawn at its routed height anyway, so
it is never lost, but it can sit slightly off the surface for a moment. It corrects itself on the
next route rebuild.

**They stop before the destination.** By design past `Config.Perf.routeAheadDist` (`600.0`). The
route is only pathed that far ahead and is deliberately left open-ended rather than drawing a
straight line across the map through buildings. It extends as the player drives.

**They cut across a field.** The pathfinder found no road node in that direction and stepped straight
towards the destination instead. This happens with waypoints dropped off-road, on water, or inside a
large interior. Nothing is broken — the route resumes hugging roads as soon as there is a road to
hug.

## The destination marker is in the sky or under the ground

The destination's height is probed from the ground beneath it. For a waypoint on the other side of
the map that ground is not streamed in yet, the probe finds nothing, and the player's own height is
used as a placeholder — a waypoint set at sea level while the player is on Chiliad would otherwise
leave the marker roughly 700 metres up.

The height is re-probed automatically once the player gets within 350 metres, so it corrects itself
on approach without any action. If a marker is still wrong inside that range, the destination is
somewhere with no ground to probe — over water, inside an interior, or under a map hole.

This affects the destination marker and the remaining-distance figure, which is measured in 3D from
the same height. The chevrons are projected onto the road independently and are never affected.

## Turn instructions are wrong

**A dead-straight road keeps announcing turns.** Something in `Config.Turns` has been lowered.
Restore `deadBand` to `32.0` and `baseline` to `32.0` first — those two do more work than everything
else in the block. Route vertices sit a couple of metres off the centreline, and below a 32-metre
baseline that sideways jitter alone measures as a 30–40° corner.

Raising `Config.Perf.routeRefreshMs` also helps, for a reason that reads backwards: a corner must
survive a full route rebuild before it is published, so **fewer** rebuilds mean steadier turn calls.

**Turns are announced too late.** Raise `maxLook` above `300.0` so corners are found further out, and
drop `holdSamples` from `3` to `2` so a confirmed corner reaches the HUD sooner. Do not drop it to
`1` — that is the setting that lets a single noisy update through.

**A real turn is never announced at all.** Three usual causes:

- The corner is inside `minLook` (`12.0`). The player is already in it, and an instruction would be
  too late to act on.
- The corner is softer than `deadBand`. A long motorway sweep genuinely is not a turn.
- `matchRadius` (`40.0`) has been lowered, so the same corner measured slightly differently on the
  next rebuild counts as a new one and the sample count never reaches `holdSamples`.

**It always says straight on a short trip.** A route with fewer than five sampled nodes has no corner
search at all — under about forty metres of road there is nothing to measure. The distance and the
marker still work.

**Left and right are swapped.** This is not a config problem and there is no setting for it. Check
the player is not reading the mini turn-box while facing backwards in the vehicle.

## The voice

**Silent for everyone.** `Config.Voice.enabled` is `false`. That is the master switch and it
overrides each player's own toggle.

**Silent for one player.** Their own voice toggle on the General tab, or the volume slider at zero,
or the master system switch off — the voice is gated behind `activeSystem` as well.

**It only ever says "ahead left" or "ahead right", never a distance.** `Config.Voice.cues.far` is
above `525.0`. The distance clips only exist at 50-metre steps up to 500, and beyond that there is
nothing to play, so the prompt falls back to the version without a number. Bring `far` back under
500.

**A prompt is skipped.** `minGap` (`2200` ms) drops anything that lands too soon after the previous
prompt — it does not queue it. Two corners close together will cost you one of the four prompts. If
that happens constantly, either lower `minGap` or widen the gap between `cues.near` and `cues.turn`.

**The voice is in the wrong language.** By default it follows whatever the player picked in the
panel, not `Config.Locale`. To force one language for everyone regardless:

```lua
Config.Voice.followUiLang = false
Config.Voice.lang         = 'en'
```

**"Recalculating" repeats constantly.** `Config.Perf.routeRecalcDist` (`14.0`) is too tight for your
roads — a wide overtake or a multi-lane junction is being read as leaving the route. Raise it. There
is a 10-second floor on the line itself, so it can never fire more often than that.

## The panel

**`/waypoint` and `F7` do nothing.** `Config.Command` is `false`, which removes the keybind with it,
because the key is registered against the command name. There is no way to have one without the
other.

If the command is set, the player has failed `Config.RequireJob` — they will see *"You are not
allowed to use this"* rather than nothing.

If neither, the key is bound to something else. Have the player check Settings → Key Bindings →
FiveM. A player's own binding overrides `Config.Keybind`, and once they have rebound it, changing the
config does not move them back.

**The mouse is stuck after an error.** Restart the resource — focus is released on stop. If it
happens repeatedly, open the NUI dev tools (F8 → `nui_devtools`) and read the console before
restarting.

**Panel text shows raw keys like `activeColor` or `noAccess`.** A key is missing from that language's
JSON file. **There is no per-key fallback to English in this resource** — a missing key prints its own
name. Only a completely missing or unparseable file falls back to `locales/en.json` as a whole. Copy
the missing line across from the English file.

**A language is missing from the picker.** Its JSON file failed to parse. The picker is built by
reading every file under `locales/` at start and skipping the ones that do not decode, so a stray
comma or a smart quote silently removes a language. Validate the file and restart the resource.

**The language does not change.** It is not `Config.Locale` — that only applies to players who have
never chosen one. Everyone else is on the language stored on their own machine. Press **Reset** in
the panel, or change it in the panel.

## Settings

**I changed `Config.Defaults` and nothing happened.** Defaults only apply to players with no saved
settings. Everyone else keeps what they had until they press **Reset**. There is no server-side way
to push a look out to players.

The one exception is a key that did not exist before: a genuinely new top-level entry in
`Config.Defaults` is filled in for existing players too, so an update that adds an element does not
need a reset.

**A player lost all their settings.** They joined from a different machine, reinstalled FiveM, or
cleared their game cache. Settings live in client KVP on the machine, not on your server, and there
is nothing to restore from.

**Colours look wrong.** `globalColor` and every per-element colour must be a six-digit hex with the
`#`, like `'#A855F7'`. Anything shorter or malformed falls back to the default purple rather than
erroring, which is why a three-digit shorthand looks like it was ignored.

**Turning the Marker element off did not remove the chevrons.** Correct — the chevrons take the
Marker element's *colour* but are not gated by its *toggle*. To remove chevrons, use the master
switch or take the player out of a vehicle.

## Notifications

**They look like the wrong style.** ox_lib is used when it is running. To force the framework's own
notification instead:

```lua
Config.UseOxLib = false
```

On standalone with `UseOxLib = false` there is nothing left but the GTA feed ticker, which is what
you will see.

## Arrival

**It fires while the player is still driving past.** `Config.ArriveRadius` (`18.0`) is a
straight-line 3D distance. A waypoint dropped on a multi-storey car park or an overpass will trigger
from the level below it. Lower the radius, or accept it — there is no road-distance version of this
check.

**It never fires.** The waypoint is somewhere the player cannot physically get within 18 metres of,
usually inside a building or out at sea. The route will keep pointing at it forever. Clearing the
waypoint manually is the way out.

## Performance

If the chevron loop is the cost, in the order that helps most:

```lua
Config.Chevrons.spacing      = 12.0   -- fewer markers per metre of road
Config.Perf.chevronDrawDist  = 100.0  -- less road paved at once
Config.Chevrons.fadeStart    = 60.0   -- keep the gap to chevronDrawDist
```

If the route rebuild is the cost:

```lua
Config.Perf.routeRefreshMs = 1500     -- also makes turn calls steadier
Config.Perf.nodeStep       = 10.0     -- fewer nodes sampled per rebuild
Config.Perf.routeAheadDist = 400.0    -- path less road ahead
```

Do not push `nodeStep` below `5.0` — the sampler starts re-snapping to the same road node and stalls
the walk.

A visible hitch the moment a route is built is `snapPerFrame` doing its job the other way round:
lower it to spread the ground probes over more frames, raise it to make a new route settle faster.

Remember every one of these loops is idle with no waypoint set. If you are measuring the resource
with nothing marked on the map, you are measuring nothing.

## The version banner

**It never appears.** The check runs once, three seconds after start, and fails silently when it
cannot reach GitHub — no outbound internet, a firewall, or a DNS problem. Nothing else is affected;
the resource does not need it. There is no command to run it again, so restarting the resource is the
only way to retry.

## Getting help

Open a ticket in the [Discord](https://discord.gg/DrTFQj5hcZ) with the resource version from the
banner, your framework, the **full** console error from F8 as well as the server console, and what
you changed in `config.lua`. If it is a chevron problem, include the output of `/wplane` and
`/wparrow` — the two lines they print say more than a screenshot does.
