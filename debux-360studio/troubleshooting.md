# Troubleshooting

> **Read this first.** Two things account for most first-day problems with this resource, and neither
> looks like what it is. If the booth is not there, see [the props](#the-booth-is-not-there) — a
> resource restart does not push streamed models out to players who are already connected. If the
> start button refuses, see [uploads](#uploads-are-off) — a take will not begin until an upload
> provider is configured.

## The booth is not there

**Nothing is standing at the coordinates, but the target option works.** The player is missing the
models. Streamed assets only reach a client when it **connects** — restarting the resource does not
send them out. Everyone who was in the server while you installed or updated the resource has to
fully reconnect. There is no way around this and it is not specific to this script.

The same applies every time you change anything under `stream/`.

**Nothing is standing there for anyone, including a fresh connection.** Look at the client console
(F8) as you walk up:

```
[debux-360studio] melwia-debuxtripot never loaded (hash ...) - valid=false inCd=false
```

`valid=false` means the model is not on this server at all — the stream folder is missing, was not
packed with the resource, or `Config.Props.arm` has a typo in it. `valid=true` with the arm still
missing means the model exists but did not stream in within eight seconds, which usually means the
server is under load or the folder is very large.

You will also see this, which is the same problem said differently:

```
[debux-360studio] Vespucci Beach has no rig, the arm model did not load
```

**It is not there on purpose.** `prop = false` on that booth entry spawns nothing. That is the
setting for a booth already built into your map.

## The booth is in the ground, or in the air

**The platform is buried or floating.** `Config.Props.groundOffset` — `-0.7` by default. Booth
coordinates are pasted from your own player position, which is your chest and not your feet, so
something has to take the difference out. Nudge it by 0.1 at a time; the platform is put on the
ground properly where the game can find ground, and dropped at the offset where it cannot.

**The player stands inside the platform rather than on it.** `Config.Props.standOffset` — `0.77`,
measured from the model that ships with the resource. Only change it if you have swapped the platform
for one of a different height.

**A second arm is standing next to the first.** A crash or a hard restart left the old one behind.
The sweep on start clears leftovers within `Config.Props.sweepRadius` (`3.0` m) of a booth, so a
leftover further out than that survives. Raise the radius, or delete the object by hand once.

The sweep only ever touches an object that is one of your two rig models, was placed by a script
rather than by the map, and is inside that radius, so raising it cannot eat your map props.

## Nothing happens at the booth

**No target option and no `[E]`.** Check the client console line printed on start:

```
[debux-360studio] client up, framework = qbx, target = ox_target
```

`target = nil` means no target resource was found, or `Config.UseTarget` is `false` — in which case
you should be getting the `[E]` prompt within 2 metres instead. If you get neither, the player is
further from the booth coordinate than they look; the interaction is 2 metres from the coordinate you
put in the config, not from the edge of the platform.

**The target option is there but the screen says there is no booth.** The server checks the player is
within 6 metres of the booth coordinate before it opens anything. If you moved a booth, move its
`coords` — a target zone you added yourself somewhere else will fail this check.

**It says the booth is in use.** Somebody else is filming. The lock releases when they finish or
cancel, when they disconnect, or on its own after the take length plus the countdown plus 45 seconds
if their client vanishes mid-take. If a booth is stuck beyond that, restart the resource — the lock
is in memory and nothing about it is stored.

## The gallery cannot be opened

**There is no `[E]` path to the gallery.** It is a target option, *Your takes*, and that is the only
way in. With no target resource running, or `Config.UseTarget = false`, players can film but cannot
watch anything back.

Install ox_target or qb-target if you want players to reach their takes.

**The target option is there but nothing opens.** *You have not filmed anything yet* is a
notification, not a screen — the gallery does not open when it is empty.

## Uploads are off

**The booth screen says UPLOADS ARE OFF · ASK AN ADMIN and the start button does nothing.** No upload
provider is configured. Open `config.server.lua` and fill in the one matching
`Config.Upload.provider`:

- `'fivemanage'` needs `fivemanage.videoToken` — the **video** token, not an image token
- `'webhook'` needs `webhook`
- `'custom'` needs `custom.url`

An empty token, an empty webhook or an empty custom URL all count as not configured. This is checked
before the take starts on purpose, so nobody films for twelve seconds and then finds out.

## The upload did not go through

The take ran, the screen said *SAVING*, and then *The upload did not go through*.

**The file is too big for the provider.** Twelve seconds at 12 Mbit/s is roughly 18 MB, which is past
a plain Discord webhook's limit. Lower `Config.Recording.bitrate`, or `duration`, or both:

```lua
Config.Recording.bitrate  = 4000000
Config.Recording.duration = 8
```

**The endpoint rejected the request.** The file is posted from the player's own client, so the
endpoint has to accept a cross-origin POST from the game. Fivemanage does. Your own endpoint may need
CORS headers before it will.

**The token is wrong for the media type.** Fivemanage issues a separate token per media type. An
image token against the video endpoint fails every time, and looks exactly like this.

**The answer was not understood.** A link is read out of `data.url`, `url`, `link`, `image` or
`attachments[0].url` in a JSON response, or a plain-text body starting with `http`. Anything else
counts as a failure even though the file may well have uploaded.

**It took too long.** The upload is abandoned after 25 seconds, and the client stops waiting for the
whole capture after 30. A player on a slow connection uploading 18 MB will hit that.

> **The fee is taken when the take starts, and a failed upload does not give it back.** Leave
> `price = 0` on your booths until you have watched a clip come back with a working link.

## The camera is wrong

**The arm somersaults over the player instead of circling them.** `Config.Camera.axis`. `'z'` is what
the arm that ships with this resource needs. `'x'` and `'y'` exist for a model built on a different
pivot — try each and keep the one that circles.

**The shot is pointing at the sky, the floor, or somebody's knees.** `Config.Camera.lookAt` is
measured from the middle of the booth, not from the lens, and `z = 1.05` is roughly chest height on a
standing player. Raise or lower that one number first — the values that ship are lined up with the
arm that ships, so this only drifts after you have moved the lens or swapped the model.

**The lens clips through the arm, or the arm is in the shot.** `Config.Camera.offset` is measured in
the arm's own axes and rides with it, so a value that looks right when the arm is at zero can be
inside the model half a turn later. Film one test take and watch the whole rotation before you settle
on a number.

**Nothing moves during the take.** `Config.Camera.spin = false` films from one spot. That is a
setting, not a fault.

**It goes round too fast or not far enough.** `Config.Camera.turns` is the number of full turns per
take, multiplied by the speed preset's `orbit`. Slow motion covers less than half a circle on purpose
— that is what makes it read as slow.

## The clip itself

**It is silent.** Expected. GTA's own audio cannot be captured — the layer that records the picture
has no access to it. `Config.Recording.music` mixes a track of your own into the take instead. Left
empty, every clip is silent.

**It is smaller than the resolution I set.** `width` and `height` are ceilings. The capture is the
size of the player's own game window, scaled down to fit inside them and never scaled up. A player
running the game in a 1280×720 window gets a 1280×720 clip out of a 1920×1080 setting.

**It is shorter or longer than I asked for.** `Config.Recording.duration` is clamped to 3–30 seconds
on both the client and the server. Anything outside that is pulled back into range without a warning.

**The HUD is in the picture.** `Config.Recording.hideHud` hides the game HUD and radar for the length
of the take. Anything drawn by another resource — a custom HUD, a nameplate script, a speedometer —
is not covered by it and will be in the shot.

**In freemode the player walked out of shot.** That is what freemode is. The controls are handed back
for the whole take and the camera stays pointed at the middle of the platform. The only keys held
down are pause and Esc, so the game menu cannot end up in the clip.

## Couple takes

**Nobody is in the nearby list.** The other player has to be within `Config.Couple.radius` (`12.0` m)
of the person opening the panel. The distance is checked again on the server when the invite is sent,
so walking away in between cancels it with *Nobody nearby to film with*.

**The couple tab is missing entirely.** `Config.Couple.enabled = false`.

**The invite never arrives.** The invited player is already in a booth screen or already filming — an
invite is dropped rather than queued if they are busy. Have them close what they have open.

**The invite expired.** `Config.Couple.inviteTime`, 20 seconds by default. Note the English card text
says *"30 seconds"* in the sentence rather than reading the config; change it in your locale files if
you change the setting.

**"%s walked off" and the take goes ahead solo.** The partner accepted, then left the area or
disconnected before the take started. The pose still plays for whoever is left, which is why a
one-person hug looks strange. Cancel and start again.

**The two of them are too close together, or too far apart.** The gap is part of the pose itself, not
a setting — each couple entry in `animation.lua` carries its own `scene` offset, because a hug and a
handshake need different gaps.

## Staffed booths

**Nobody can use the booth at all.** A `job` on a booth means only someone holding that job **and on
duty** can start a take. Everyone else gets the staffed screen. If nobody has the job, the booth is
dead — check the name matches your framework exactly, `reporter` and not `Reporter`.

**Nobody can use it on standalone.** There are no jobs on standalone, so the check can never pass.
Leave `job = nil` unless you run a framework.

**An ESX operator counts as on duty when they are not.** ESX has no duty flag. Anyone holding the job
is treated as on shift.

**The society was not paid.** The payout goes to `debux-bank`, Renewed-Banking, qb-banking or
`esx_addonaccount`, whichever is running, in that order. With none of them running there is nowhere
to put the money and the fee is simply taken from the customer.

## Money

**A player was charged twice.** They were not — the fee is taken once, when the take starts, and only
if the booth's `price` is above zero and they are not the operator. Check the Discord log, which
records what was paid on every take.

**A player was charged and got nothing.** The fee is taken at the start of the take and is not
returned if the upload later fails. Keep `price = 0` until you have confirmed uploads work end to
end.

**Nobody is charged anything.** On standalone there is no money system, so every booth is free
whatever the price says.

## The interface

**The player's picture is a plain circle.** In order of likelihood: `Config.Avatar.source` is
`'none'`; the key in `config.server.lua` is empty; that player is not connected through the service
you chose — a licence-only connection has no Steam identifier, and a player who joined without
Discord has no Discord id; or the lookup timed out. Any of them falls back to the plain circle rather
than erroring.

Switching `source` does not clear the cache. Wait out `Config.Avatar.cache` minutes, or restart the
resource.

**Digits in the brand line come out as scribbles.** The handwritten font used for `Config.Brand.tag`
has letters only — no numerals. Keep `tag` to words. `name` is a different face and takes anything.

**A label shows a raw key like `act_accept`.** That key is missing from the locale file being used.
There is no per-key fallback to English — a missing key prints its own name; only a completely
missing or unparseable file falls back to `locales/en.json` as a whole. Copy the missing line into
your language's file.

**The panel is in one language and the notifications in another.** They are two settings.
`Config.Locale` drives the interface; the notifications, the `[E]` prompt and the target labels go
through ox_lib and follow `setr ox:locale` (or each player's own ox_lib language, if you leave
`ox:userLocales` on). Set both.

**The mouse is stuck after an error.** Restart the resource — focus is released when it stops. If it
happens repeatedly, open the NUI dev tools (F8 → `nui_devtools`) and read the console before
restarting.

**The screen is blank.** Same place to look. A JavaScript error there is almost always a locale file
that does not parse — validate the JSON for the language you set.

## The database

**The gallery is always empty and no rows ever appear.** Look for this on start:

```
[debux-360studio] the table could not be created: ...
```

Your MySQL user cannot run `CREATE TABLE`. Grant it and restart the resource. There is no SQL file to
import instead — the table creates itself or it does not exist.

**Old takes vanished.** `Config.Gallery.keepDays` (`30`) deletes rows older than that **when the
resource starts**, and prints how many it cleared. `0` keeps them forever.

**A player only ever has 24 takes.** `Config.Gallery.perPlayer`. The oldest is dropped as each new one
lands.

**A take was deleted but the video still plays.** Only the link is stored. The file lives with your
upload provider and has to be removed there.

## Discord logs

**Nothing is posted.** `Config.Logs.enabled` is `false`, or the webhook does not start with `http` —
a malformed URL is treated as unset and nothing is attempted at all. Both live in
`config.server.lua`, not in `config.lua`.

**Somebody is sharing takes out of the log channel.** Every *Take saved* embed carries a working link
to the video. That channel should be staff-only.

## The version banner

**It never appears.** The check runs once, three seconds after start, and fails silently when it
cannot reach GitHub — no outbound internet, a firewall, or a DNS problem. Nothing else is affected;
the resource does not need it. There is no command to run it again, so restarting the resource is the
only way to retry.

## Getting help

Open a ticket in the [Discord](https://discord.gg/DrTFQj5hcZ) with the resource version from the
banner, your framework, your upload provider, the **full** console error from F8 as well as the server
console, and what you changed in `config.lua`. If it is a camera problem, include your whole
`Config.Camera` block — those numbers say more than a screenshot does.
