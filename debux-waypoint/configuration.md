# Configuration

Everything lives in `config.lua`. There is no second config file, no convar and no database table —
the language is set here too, unlike some of our other resources.

A player's own choices are stored on their machine and **override most of the look section**. Read
[Default look](#default-look) before you spend time tuning colours nobody will see.

## General

```lua
Config.Locale       = 'en'
Config.Framework    = 'auto'
Config.UseOxLib     = 'auto'

Config.Command      = 'waypoint'
Config.Keybind      = 'F7'
Config.RequireJob   = false

Config.Units        = 'metric'
Config.MaxDistance  = 6000.0
Config.ArriveRadius = 18.0
```

| Setting | Default | What it changes |
| --- | --- | --- |
| `Locale` | `'en'` | The starting language for players who have never opened the panel. One of `en, tr, de, fr, es, pt, ru, pl, it, nl`. A code with no file under `locales/` silently falls back to English. |
| `Framework` | `'auto'` | Auto tries `qbx_core`, then `qb-core`, then `es_extended`, then gives up and runs standalone. Set `'qbx'`, `'qb'`, `'esx'` or `'standalone'` by hand only if you run a renamed core or want to force standalone behaviour on a framework server. |
| `UseOxLib` | `'auto'` | Whether notifications go through `lib.notify`. `'auto'` uses it when ox_lib is running. `false` forces the framework's own notification, or the GTA feed on standalone. |
| `Command` | `'waypoint'` | The chat command that toggles the panel. `false` removes it **and the keybind with it** — see below. |
| `Keybind` | `'F7'` | The default key. Players can rebind it in FiveM's key bindings, and once they do their choice wins. `false` leaves only the command. |
| `RequireJob` | `false` | A list of job names, e.g. `{ 'police' }`, that gates the entire resource — not only the panel. Everyone else gets no route, no chevrons and no HUD. |
| `Units` | `'metric'` | `'metric'` shows metres under 1 km and kilometres above. `'imperial'` shows feet under a mile and miles above. Affects both the distance meter and the mini turn-box. The spoken distances are unaffected — the clips are metric in every language. |
| `MaxDistance` | `6000.0` | Straight-line distance to the destination past which the road chevrons stop drawing entirely. A cheap way to keep the AR layer off long cross-map trips until the player is close. `0` disables the limit. Per-chevron range is separate — see `Config.Chevrons.cullDist`. |
| `ArriveRadius` | `18.0` | Straight-line metres from the destination at which the waypoint clears itself, the arrival voice plays and the notification fires. This is a 3D distance, so a destination on the floor above or below counts as arrived when the player passes under it. Raise it for a server where waypoints are usually dropped on a building rather than a door. |

> **`Config.Command = false` also disables the key.** The keybind is registered against the command
> name, so with no command there is nothing to bind, and the settings panel becomes unreachable for
> everyone. If you want the key only, keep the command and tell players not to type it.

## Performance

Every loop below is idle unless a waypoint is active.

```lua
Config.Perf = {
    routeRefreshMs   = 1000,
    routeRecalcDist  = 14.0,
    hudFps           = 30,
    chevronDrawDist  = 140.0,
    onFootChevrons   = false,
    nodeStep         = 8.0,
    maxRouteNodes    = 1200,
    routeAheadDist   = 600.0,
}
```

| Setting | Default | What it changes |
| --- | --- | --- |
| `routeRefreshMs` | `1000` | Milliseconds between route rebuilds. Each rebuild re-walks the road graph from the player's current position, which is the expensive part of this resource. Lowering it makes the route follow the player more tightly and makes turn calls **less** stable — a corner must survive a rebuild before it is announced, so more rebuilds mean more chances to lose it. |
| `routeRecalcDist` | `14.0` | Metres from the nearest route point at which the route is rebuilt immediately, without waiting for the timer. This is also what triggers the *"recalculating"* voice line. Lower it and a wide overtake will start announcing recalculations. |
| `hudFps` | `30` | How many times a second the world-to-screen HUD data is pushed to the interface. The interface smooths between frames, so `30` looks identical to every-frame and costs a fraction as much. Capped at `60`; `0` pushes every frame. |
| `chevronDrawDist` | `140.0` | Metres **measured along the route** — how much of the road ahead is paved with chevrons. Must stay above `Config.Chevrons.fadeStart` or the fade maths breaks (see below). |
| `onFootChevrons` | `false` | Draws the road chevrons on foot as well. Off by default because a pedestrian is rarely on the road the route follows, so the arrows appear to run alongside the player rather than under them. |
| `nodeStep` | `8.0` | Metres between sampled road nodes when the route is built. Smaller hugs the road more tightly and costs proportionally more work per rebuild; larger cuts corners and can skip a junction entirely. Below about `5.0` the sampler starts re-snapping to the same node and stalls. |
| `maxRouteNodes` | `1200` | Hard cap on sampled nodes per rebuild. A safety limit, not a tuning knob — with the default `nodeStep` it is never reached before `routeAheadDist` stops the walk. |
| `routeAheadDist` | `600.0` | Metres of road actually pathed ahead of the player. This is what makes a cross-map waypoint cost the same as a short one. Below this distance the route closes onto the destination; above it the route is deliberately left open-ended rather than drawing a straight line across the map through buildings. |

**Turning `onFootChevrons` on interacts with the player's own settings.** A player with *Only in
vehicle* switched on in the panel loses the HUD elements on foot but keeps the chevrons, because that
toggle is read by the HUD and not by the chevron loop.

## Turn detection

This block is the fix for false turn calls on straight roads. Route vertices are snapped vehicle
nodes, and those sit a couple of metres off the true centreline — over a short baseline that sideways
jitter alone measures as a 30–40° corner.

```lua
Config.Turns = {
    baseline    = 32.0,
    confirmArc  = 60.0,
    deadBand    = 32.0,
    releaseBand = 20.0,
    holdSamples = 3,
    matchRadius = 40.0,
    minLook     = 12.0,
    maxLook     = 300.0,
}
```

| Setting | Default | What it changes |
| --- | --- | --- |
| `baseline` | `32.0` | Metres of road sampled on each side of a candidate corner before its angle is measured. This is the single most important value here: the longer the baseline, the more node jitter averages out. A vertex that cannot gather this much road on both sides — near the start or the end of the route — produces no bearing and is skipped entirely. |
| `confirmArc` | `60.0` | Metres past the corner the new bearing must still hold. A real junction keeps its new heading; jitter swings straight back, and measured over this arc it collapses to nearly zero. |
| `deadBand` | `32.0` | Degrees. Below this the road is declared **straight** and no instruction is produced at all. Lowering it is the fastest way to bring the false turns back. |
| `releaseBand` | `20.0` | Degrees the long-arc confirmation must still show. Deliberately lower than `deadBand` — a genuine corner is allowed to soften over 60 m without being thrown away, but it must still bend the same way. |
| `holdSamples` | `3` | How many consecutive updates the same corner must appear in before it is published. The turn loop runs a little under three times a second, so this is roughly a second of agreement. |
| `matchRadius` | `40.0` | Metres within which two readings count as the same corner rather than a new one. Too small and a corner re-measured slightly differently on the next rebuild resets the sample count and never confirms. |
| `minLook` | `12.0` | Metres. Corners closer than this are ignored — the player is already in them and an instruction would arrive too late to act on. |
| `maxLook` | `300.0` | Metres. The search stops here, so a turn further ahead than this reports as *straight* until the player closes in. |

A confirmed corner also has to survive at least one full route rebuild before it reaches the HUD or
the voice, which is not configurable. Until then the previous instruction is held if it agrees, and
*straight* is reported if it does not.

**If turns are announced late**, raise `maxLook` and lower `holdSamples`. **If false turns come
back**, raise `deadBand` and `baseline` first, in that order — they do far more work than the rest.

## Default look

```lua
Config.Defaults = {
    activeSystem   = true,
    vehicleOnly    = false,
    globalColor    = '#A855F7',
    voice          = { enabled = true, volume = 0.85 },

    meter   = { enabled = true,  color = nil,       style = 'radar'  },
    mmeter  = { enabled = true,  color = nil,       style = 'box'    },
    arrow   = { enabled = true,  color = nil,       style = 'classic'},
    marker  = { enabled = true,  color = nil,       style = 'pulse'  },
    address = { enabled = true,  color = nil,       style = 'modern' },
}
```

| Setting | Default | What it changes |
| --- | --- | --- |
| `activeSystem` | `true` | The master switch, shown as *Activate Entire System* on the General tab. Off means no route, no chevrons, no HUD and no voice — the waypoint scanner itself stops running. |
| `vehicleOnly` | `false` | Hides the HUD elements while the player is on foot. Does not affect the chevrons, which are vehicle-only by their own rule. |
| `globalColor` | `'#A855F7'` | Used by every element whose own `color` is `nil`. Six-digit hex with the `#`; anything else falls back to the same purple. |
| `voice.enabled` | `true` | The player's own voice switch. `Config.Voice.enabled` below can override it off, but not on. |
| `voice.volume` | `0.85` | `0.0`–`1.0`. |

Each of the five elements takes the same three keys:

| Element | Panel tab | Default style | Styles available |
| --- | --- | --- | --- |
| `meter` | Meter | `'radar'` | `radar`, `line`, `icon` |
| `mmeter` | M.Meter | `'box'` | `float`, `box`, `glass` |
| `arrow` | Arrow | `'classic'` | `hover`, `neon`, `classic` |
| `marker` | Marker | `'pulse'` | `pulse`, `beam`, `static` |
| `address` | Address | `'modern'` | `modern`, `sharp`, `minimal` |

`color = nil` means the element inherits `globalColor`. Put a hex string there to pin it.

> **These are defaults for players who have never opened the panel.** Settings are saved per player
> in client KVP the first time anything is changed. After that, editing `Config.Defaults` moves new
> players only — existing players keep what they had until they press **Reset** in the panel. There
> is no server-side way to push a new look out.

**The road chevrons take the Marker element's colour**, not a colour of their own, and they are drawn
whether or not the Marker element is switched on. A player who turns Marker off loses the pillar
standing on the destination but keeps chevrons in the colour they set for it.

## Voice guidance

```lua
Config.Voice = {
    enabled      = true,
    followUiLang = true,
    lang         = 'en',
    cues = {
        far  = 320.0,
        near = 110.0,
        turn = 26.0,
    },
    minGap = 2200,
}
```

| Setting | Default | What it changes |
| --- | --- | --- |
| `enabled` | `true` | Server-side master switch. `false` silences the voice for everyone regardless of what each player has set in the panel. |
| `followUiLang` | `true` | The voice speaks in whatever language the player picked in the panel. `false` forces `Config.Voice.lang` for everyone, so the panel can be Turkish while the voice stays English. |
| `lang` | `'en'` | Only read when `followUiLang` is `false`. |
| `cues.far` | `320.0` | Metres before the turn at which the first prompt plays. |
| `cues.near` | `110.0` | Metres for the second prompt. Must be below `cues.far`, or the middle prompt is never reached. |
| `cues.turn` | `26.0` | Metres at which the bare *"turn left" / "turn right"* plays. |
| `minGap` | `2200` | Milliseconds between any two spoken prompts. Nothing queues — a prompt suppressed by this gap is dropped, not delayed, so a cue that lands too close behind another is simply never heard. |

The distance prompts are stitched from recorded clips at 50-metre steps between 50 and 500. Whatever
you put in `cues.far` and `cues.near` is rounded to the nearest of those, so `320.0` plays *"in 300
metres"*. **Above 525 metres there is no clip**, and the prompt falls back to a plain *"ahead left" /
"ahead right"* with no distance in it — raising `cues.far` past that point makes the first prompt
vaguer rather than earlier.

Each prompt fires once per corner. *"Recalculating"* has its own 10-second floor on top of `minGap`,
so a player weaving off the route does not get spammed with it.

## Colour swatches

```lua
Config.Swatches = {
    '#A855F7', '#9ae600', '#ec4899', '#ffffff', '#f59e0b', '#8b5cf6', '#22d3ee',
}
```

The quick-pick colours in the panel, in order — the first is the one shown as active. Players are not
limited to these; the panel also takes a custom hex. Adding or removing entries changes the row, and
the list is read fresh every time the panel is opened, so a config change shows up on the next open
without a client restart.

## Road chevrons

The flat arrows lying on the tarmac. This block also holds the ground-snapping fix — route vertices
carry the Z of whatever produced them (the ped sitting inside a car, or the previous node on a
dead-reckoned step), which is never the road surface, so every chevron is re-projected onto the road
before it is drawn.

```lua
Config.Chevrons = {
    spacing       = 8.0,
    size          = 2.4,
    height        = 0.25,
    minAhead      = 10.0,
    fadeStart     = 90.0,

    arrowSign     = -1,
    arrowRotation = 180.0,
    laneOffset    = 3.0,

    snapDist      = 160.0,
    snapTolerance = 16.0,
    snapPerFrame  = 8,
    cullDist      = 150.0,

    texture       = false,
}
```

### Shape and spacing

| Setting | Default | What it changes |
| --- | --- | --- |
| `spacing` | `8.0` | Metres between chevrons along the route. Halving it doubles the number drawn every frame — this is the main cost of the chevron loop. |
| `size` | `2.4` | Marker size, roughly a lane and a half wide at the default. |
| `height` | `0.25` | Metres above the projected road surface. Raise it if chevrons z-fight with the tarmac; lower it if they look like they are floating. |
| `minAhead` | `10.0` | Metres of dead zone around the player where nothing is drawn, so a chevron never renders through the bonnet or the character. |
| `fadeStart` | `90.0` | Metres along the route at which chevrons start fading out, reaching zero at `Config.Perf.chevronDrawDist`. |

> **`fadeStart` must stay below `Config.Perf.chevronDrawDist`.** The fade is calculated across the
> gap between the two. Set them equal and the maths divides by zero; set `fadeStart` higher and the
> alpha goes negative, so every chevron past it is dropped and the route appears to stop short.

### Orientation and lane

| Setting | Default | What it changes |
| --- | --- | --- |
| `arrowSign` | `-1` | `1` or `-1`. The sign applied to each chevron's heading. Wrong sign means the arrows are mirrored — they lean the wrong way through corners. |
| `arrowRotation` | `180.0` | Degrees added on top, normally `0`, `90`, `180` or `270`. Wrong value means the arrows point backwards or sideways along an otherwise correct route. |
| `laneOffset` | `3.0` | Metres the chevrons are shifted to the right of the direction of travel. The route snaps to the road centreline and GTA drives on the right, so without this the arrows sit in the oncoming lane. Negative shifts left; `0.0` keeps them on the centreline. |

These three are calibrated live, in game, without restarting — see
[Exports & commands](./exports.md#calibration-commands) for `/wparrow` and `/wplane`. Both print the
value to paste back into this block. The overrides they set are per-client and last only until the
resource restarts.

### Ground snapping

| Setting | Default | What it changes |
| --- | --- | --- |
| `snapDist` | `160.0` | Metres within which the ground is probed for a chevron. Beyond it the ground is not looked for at all, because map collision that far out may not be streamed in and the probe would return nothing useful. |
| `snapTolerance` | `16.0` | Metres. A ground probe that lands further than this from the routed height is rejected and the routed height kept — that is a bridge deck above or a tunnel roof below, not the road the route is on. Raising it towards the height of your tallest overpass will start teleporting chevrons onto the wrong deck. |
| `snapPerFrame` | `8` | Maximum ground probes per frame. A freshly built route can have seventy chevrons in range at once, and probing all of them in one frame is a visible hitch. Raising it makes a new route settle faster at the cost of that spike. |
| `cullDist` | `150.0` | Straight-line metres. A hard cull applied before anything else — nothing is drawn past it whatever the along-route figures say. Keep it at or above `Config.Perf.chevronDrawDist` or it, not that setting, becomes the real draw distance. |

A chevron is only drawn once it has actually been projected onto the road. If collision has not
streamed in yet, the probe is retried for five frames and then the chevron is drawn at its routed
height anyway, so it can never vanish permanently — it may briefly sit slightly off the surface after
a fast teleport into an unstreamed area.

### Texture

| Setting | Default | What it changes |
| --- | --- | --- |
| `texture` | `false` | Optional texture drawn on the chevrons. `false` draws the plain marker. |

To use one, give it a streamed texture dictionary and the name of a texture inside it:

```lua
Config.Chevrons.texture = { dict = 'commonmenu', name = 'common_medal' }
```

The dictionary is requested and only handed to the marker once it has finished loading — until then
the plain marker is drawn, so a dictionary that does not exist on your server means the chevrons stay
untextured rather than disappearing. Both `dict` and `name` must be present or the whole setting is
ignored.
