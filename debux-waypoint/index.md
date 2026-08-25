# Debux Waypoint

An AR navigation kit. The player marks a point on the map the way they always have, and the route
appears in the world instead of only on the minimap — flat chevrons lying on the tarmac, a floating
compass above the car, a distance meter, a mini turn-box, the street name, and a marker standing on
the destination. A voice reads the turns out in the player's own language.

There is no item, no database and no job to set up. Set a waypoint, drive.

Works on **Qbox, QBCore, ESX and standalone** with no edits — the framework is detected when the
resource starts.

## What a player does

**Sets a waypoint.** Anywhere on the map, in the normal way. Within about a second the route is built
and the AR elements come up. Removing the waypoint takes them all away again.

**Follows the road, not a straight line.** The path is sampled from the game's own vehicle-node graph
and scored against the game's own road pathfinder at every step, so it turns where the minimap GPS
line turns rather than pointing through buildings. The chevrons are shifted into the right-hand lane
and re-projected onto the road surface, so they sit on the tarmac at junctions and over crests.

**Hears the turns.** *"In 300 meters, turn right"*, then *"in 100 meters, turn right"*, then *"turn
right"*, and *"you have arrived"* at the end. Straying off the route plays *"recalculating"*. The
lines are stitched from recorded clips, one set per language, so the grammar is right in all ten.

**Tunes it themselves.** `/waypoint` or `F7` opens a settings panel with six tabs — Address, Meter,
M.Meter, Arrow, Marker and General. Each element can be switched off on its own, given its own
colour, and given one of three design styles. General holds the master switch, the global colour, an
in-vehicle-only toggle, the voice switch and its volume, and the language picker.

**Keeps it.** Everything a player changes is saved on their own machine through client KVP. There is
no database and nothing to migrate — a player's look follows them across restarts, and two players on
the same server can run completely different setups.

**Arrives.** Inside `Config.ArriveRadius` of the destination the waypoint is cleared for them, the
voice says so, and a notification confirms it.

## What it needs

| Dependency | Required |
| --- | --- |
| [ox_lib](https://github.com/overextended/ox_lib) | Optional — used for notifications only |
| A framework (Qbox, QBCore, ESX) | Optional — standalone works |
| Database | None. Player settings live in client KVP |
| Target resource | None. There is nothing in the world to interact with |

No SQL, no items, no inventory integration, no dependencies you have to install first. Dropping the
folder in and starting it is the whole install.

## Framework support

| Framework | Detected by | Used for |
| --- | --- | --- |
| Qbox | `qbx_core` | Login state before the resource arms, job name for `Config.RequireJob`, notifications |
| QBCore | `qb-core` | Same |
| ESX | `es_extended` | Same |
| Standalone | Nothing else running | Arms immediately, no job, notifications go to the GTA feed |

Detection runs in that order and reads which resources are **started** at the moment
`debux-waypoint` starts. `Config.Framework` overrides it if the guess is wrong.

**On standalone there is no job.** `Bridge.GetJobName` returns nothing, so `Config.RequireJob` can
never match and the whole resource stays dark for everyone. Leave `Config.RequireJob = false` unless
you run a framework.

## Interface

React and Vite. The compiled bundle ships with the resource and is served straight from it, so **you
do not need Node to run this** — there is nothing to build and nothing to install.

Fonts and the voice clips are bundled. Nothing is fetched from a CDN at runtime, so the panel looks
and sounds the same on a server with no outbound internet.

## Languages

Ten, all switchable live from the panel: `en, tr, de, fr, es, pt, ru, pl, it, nl`. One JSON file per
language under `locales/`, and a matching folder of voice clips for each — the voice follows the
panel language by default, so a player who switches to Turkish is spoken to in Turkish from the next
prompt onward.

`Config.Locale` is only the starting language. The moment a player picks one in the panel their
choice is stored on their machine and `Config.Locale` stops applying to them.

## Performance notes

Every AR loop is gated behind an active waypoint. With no waypoint set, the chevron thread, the HUD
thread and the voice thread are all idling on long waits and nothing is drawn or computed.

The three tuning knobs that matter are `Config.Perf.routeRefreshMs` (how often the route is rebuilt),
`Config.Perf.routeAheadDist` (how far ahead it is pathed at all) and `Config.Perf.chevronDrawDist`
(how much of it is drawn). A cross-map waypoint costs the same as a short one, because the route is
only ever built out to `routeAheadDist` and re-extended as the player moves.

Chevrons draw only inside a vehicle unless `Config.Perf.onFootChevrons` is turned on.

## Turn detection

Route vertices are snapped vehicle nodes, and those sit a couple of metres off the true centreline.
Measured over a short baseline, that sideways jitter reads as a 30–40° corner — which is why naive
implementations announce turns on a dead-straight motorway.

`Config.Turns` exists to filter it out: a corner is measured over a long baseline, has to still hold
its new bearing well past the corner, has to be seen several updates running, and has to survive at
least one full route rebuild before it reaches the HUD or the voice. Anything unconfirmed reports
*straight*, which means a straight road produces no instruction at all. See
[Configuration](./configuration.md#turn-detection).
