# Configuration

There are two config files and the split matters.

`config.lua` is a **shared script**. Every value in it is sent to every player who connects, and any
one of them can read it out of their own client. That is fine for prices, coordinates and camera
angles, and it is exactly why none of your keys are in there.

`config.server.lua` is loaded in `server_scripts` only. Nothing in it ever leaves your machine. Your
upload token, your Discord log webhook, your Steam Web API key and your Discord bot token all live
there and nowhere else.

The pose list is a third file, `animation.lua`, next to `config.lua`.

> **Never move anything out of `config.server.lua` into `config.lua`.** A webhook URL pulled out of a
> client can be used to spam or scrape your Discord, and an upload token can be used to fill your
> storage quota with someone else's files.

## General

```lua
Config.Framework = 'auto'
Config.Locale    = 'en'
Config.Currency  = '$'
Config.UseTarget = true
```

| Setting | Default | What it changes |
| --- | --- | --- |
| `Framework` | `'auto'` | Auto tries `qbx_core`, then `qb-core`, then `es_extended`, then gives up and runs standalone. Force it with `'qbx'`, `'qb'`, `'esx'` or `'standalone'` if you run a renamed core or detection picks wrong. |
| `Locale` | `'en'` | The language of the **interface**. See [Language](#language) — the notifications are a separate setting. |
| `Currency` | `'$'` | Prefix only, in front of the booth price and in the Discord log. Prices are always whole numbers. |
| `UseTarget` | `true` | Uses ox_target or qb-target if either is running. `false` forces the `[E]` prompt everywhere — **and takes the gallery away with it**, because the gallery is a target option and has no `[E]` path. |

**On standalone there is no money and no job.** A priced booth charges nothing, and a booth with a
`job` on it can never be entered by anybody, because there is nothing to match the job against.

## Language

Two settings, and they are not the same one.

```lua
Config.Locale = 'tr'          -- config.lua: the interface
```

```cfg
setr ox:locale "tr"           -- server.cfg: notifications, [E] prompt, target labels
```

The interface reads `locales/<Config.Locale>.json` straight out of the resource. Everything drawn by
the game rather than the panel goes through ox_lib, which has its own language setting — the
`ox:locale` convar, or each player's own choice inside ox_lib if you leave `ox:userLocales` on.

Set both to the same code. A missing file falls back to `locales/en.json` in both cases, which is why
a typo in either one looks like it was ignored rather than erroring.

Ships with ten: `en, tr, de, fr, es, it, pt, pl, ru, nl`. One file per language, covering the panel,
the notifications and the pose names, so there is no second place to keep in sync.

## Brand

```lua
Config.Brand = {
    name = 'DEBUX.SHP',
    tag  = 'Studio',
}
```

Your name across the top of every screen, and a handwritten line under it. Leave either one empty to
hide that line.

> **The handwritten font has letters only — there are no numerals in it.** A digit in `tag` does not
> come out as a digit, it comes out as a decorative mark. Keep `tag` to words. `name` is set in a
> different face and takes anything, including numbers and punctuation.

## Player pictures

```lua
Config.Avatar = {
    source = 'none',       -- 'none' | 'steam' | 'discord'
    cache  = 30,
}
```

| Setting | Default | What it changes |
| --- | --- | --- |
| `source` | `'none'` | Where the round picture beside the player's name comes from. `'none'` draws a plain circle and never makes a request. |
| `cache` | `30` | Minutes a picture is remembered before it is looked up again. Cleared when the player disconnects. Minimum is 1. |

The picture is shown beside the player's name on the booth screen and the gallery, next to every
entry in the nearby-players list, and on the invite card the other player sees.

The keys live in `config.server.lua`, because either one of them in a shared file would be readable
by every player:

```lua
Config.Avatar = {
    steamKey     = '',
    discordToken = '',
}
```

**Steam.** Get a Web API key from [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey)
— it is free and takes a minute. The player has to be connected through Steam for their account to be
found; a player on a licence-only connection has no Steam identifier and gets the plain circle.

**Discord.** Create an application at
[discord.com/developers](https://discord.com/developers/applications), add a bot to it, and paste the
**bot token** here — not the client secret, not a webhook. The bot does not have to be in your
Discord server, but the player has to be connected through Discord.

A lookup that fails, times out after 2.5 seconds, or returns nothing falls back to the plain circle.
It never blocks the screen from opening.

## Camera

```lua
Config.Camera = {
    offset   = vector3(-1.86, 0.05, 2.61),
    lookAt   = vector3(0.0, 0.0, 1.05),
    fov      = 56.0,

    axis     = 'z',

    spin     = true,
    turns    = 1.0,
    easing   = true,
    reverse  = false,

    shake    = 0.0,
}
```

| Setting | Default | What it changes |
| --- | --- | --- |
| `offset` | `vector3(-1.86, 0.05, 2.61)` | Where the lens sits **on the arm**, in the arm's own axes — `x` right, `y` forward, `z` up, in metres. It rides the arm, so when the arm turns the shot turns with it. |
| `lookAt` | `vector3(0.0, 0.0, 1.05)` | What the lens points at, measured from the middle of the booth. That is where the subject stands, and it does not move while the arm goes round. `z = 1.05` is roughly chest height. |
| `fov` | `56.0` | Field of view. Lower is tighter. Anything between `12` and `90` behaves sensibly. |
| `axis` | `'z'` | Which axis the arm turns on. See below. |
| `spin` | `true` | `false` locks the arm still and films the whole take from one spot. |
| `turns` | `1.0` | Full turns across one take. `0.5` is a half circle, `2.0` goes round twice. Multiplied by the speed preset's own `orbit`. |
| `easing` | `true` | Eases in and out instead of a constant sweep, so the arm starts and stops smoothly. |
| `reverse` | `false` | Turns the other way. |
| `shake` | `0.0` | A slow drift added to the lens position, for a handheld feel. `0` is locked off, `0.15` is subtle, past `0.5` it looks like an earthquake. |

### axis

`'z'` sweeps the lens horizontally around the subject, which is what the arm that ships with this
resource needs, and what almost every rig wants.

`'x'` and `'y'` tip the arm end over end instead. They exist for a model whose pivot was built on a
different axis. **If you swap in your own arm and it somersaults over the player instead of circling
them, that is what these are for** — try each and keep the one that circles.

## Recording

```lua
Config.Recording = {
    duration   = 12,
    countdown  = 3,

    width      = 1920,
    height     = 1080,
    fps        = 60,
    bitrate    = 12000000,

    music = {
        file   = '',
        volume = 0.7,
    },

    speeds = {
        { key = 'slow',   orbit = 0.45, timeScale = 0.55 },
        { key = 'normal', orbit = 1.00, timeScale = 1.00 },
        { key = 'fast',   orbit = 1.90, timeScale = 1.00 },
    },
    defaultSpeed = 'normal',

    hideHud   = true,
}
```

| Setting | Default | What it changes |
| --- | --- | --- |
| `duration` | `12` | Seconds of video. **Clamped to 3–30** on both the client and the server, so a value outside that range is quietly pulled back into it. |
| `countdown` | `3` | Seconds of on-screen countdown before recording starts, with a tick each second. `0` starts immediately. |
| `width` / `height` | `1920` / `1080` | The **maximum** size of the clip. The capture is the size of the player's own game window, scaled down to fit inside these. It is never scaled up, so a player on a small window produces a small file whatever you put here. |
| `fps` | `60` | Frames per second asked of the capture. |
| `bitrate` | `12000000` | Bits per second — 12 Mbit/s. Twelve seconds at that rate is roughly 18 MB. This is the number to lower first if your provider rejects the file. |
| `defaultSpeed` | `'normal'` | Which speed is selected when the screen opens. Must be one of the `key` values below. |
| `hideHud` | `true` | Hides the game HUD and the radar for the length of the take, so they are not in the picture. |

### Speeds

Each entry is a button on the booth screen. `key` is also the locale key, `speed_<key>`, in every
file under `locales/`.

| Key | What it does |
| --- | --- |
| `orbit` | Multiplies how far the arm travels in one take. `0.45` covers under half a circle in the same twelve seconds, which is what makes slow motion look slow. |
| `timeScale` | The game's own time scale while filming. `0.55` genuinely slows the world down, so the water, the traffic and the player's own clothes move slowly in the finished clip. |

The clip is **not** re-encoded afterwards. What the camera saw is what comes out, which is why the
slow-motion setting has to slow the game down rather than the file.

Adding a fourth entry gives you a fourth button, but it needs a matching `speed_<key>` line in every
locale file or the button shows the raw key.

### Music

```lua
music = { file = 'assets/booth.mp3', volume = 0.7 }
```

The take is silent unless you set this. GTA's own audio cannot be captured — the layer that records
the picture has no access to it — so a track of your own is the only way to get sound into a clip.

`file` is a path inside the interface's own folder, relative to it: an `.mp3` or `.ogg` sitting in
`web/dist/assets/` is `'assets/booth.mp3'`. `volume` is `0.0`–`1.0`. Empty means a silent take.

The track plays out loud during the take as well as being mixed into the video, so the player hears
what they are filming to.

> Use music you are allowed to distribute — the file ends up inside every clip your players share.
> If you want a track and cannot get the file into that folder, open a ticket rather than working
> around it.

## Props and the rig

```lua
Config.Props = {
    base = 'melwia-debuxbase',
    arm  = 'melwia-debuxtripot',

    groundOffset = -0.7,
    standOffset  = 0.77,

    sweepRadius  = 3.0,
}
```

| Setting | Default | What it changes |
| --- | --- | --- |
| `base` | `'melwia-debuxbase'` | The platform. It is put down once and never moves. |
| `arm` | `'melwia-debuxtripot'` | The arm. It goes down on the exact same spot — the two are already lined up inside the models, so nothing is nudged — and it is the only thing that turns. The camera is bolted to it. |
| `groundOffset` | `-0.7` | Metres the rig drops from the booth coordinate. **Booth coordinates are pasted straight from your own player position**, and that position is your chest, not your feet — this is what puts the platform on the floor instead of floating in mid-air. |
| `standOffset` | `0.77` | Metres the subject steps **up** from that same coordinate, so they stand on top of the platform rather than inside it. Measured from the model: the platform surface sits 0.77 m above the rig's own origin. Change it only if you swap the platform for a model of a different height. |
| `sweepRadius` | `3.0` | Metres. On start the resource looks for leftover rig props near each booth and clears them before it puts fresh ones down. `0` turns the sweep off. |

Both `base` and `arm` also take a list, `{ 'first_choice', 'fallback' }`, and the first model that
loads is used.

**The sweep is deliberately narrow.** It only ever deletes an object that is one of the two models
above, was placed by a script rather than by the map, and is standing within `sweepRadius` of a booth
in your list. That is what stops a crash or a hard restart leaving a second arm standing in the
world. It cannot touch a prop from your map or from another resource.

Setting a booth's own `prop` to `false` spawns nothing there, which is what you want if the booth is
already built into your map.

## Booths

One entry per booth in the world.

```lua
Config.Booths = {
    {
        label  = 'Vespucci Beach',
        coords = vector4(-1580.4390, -1051.9424, 13.0177, 85.1268),
        prop   = true,
        price  = 0,
        job    = nil,
        blip   = true,
    },
}
```

| Key | What it does |
| --- | --- |
| `label` | Shown on the booth screen, stored on the take, and posted to the Discord log |
| `coords` | `vector4`, pasted straight from your own player position. The fourth value is the heading — the way the rig faces, and the way the subject is turned when the take starts |
| `prop` | `true` spawns the platform and the arm. `false` spawns nothing, for a booth already in your map |
| `price` | What a player pays per take. `0` is free. Taken from cash first, then bank |
| `job` | A job name that staffs the booth. `nil` for a public booth |
| `blip` | `false` hides only this booth's blip |

The interaction reaches 2 metres. The server independently checks the player is within 6 metres
before it opens anything or starts a take, so a booth cannot be used from across the street however
the screen was opened.

**A booth is locked while it is in use.** A second player gets *The booth is in use* until the first
one finishes. The lock releases when the take finishes or is cancelled, and on its own after the take
length plus the countdown plus 45 seconds if a client disappears mid-take.

### Staffed booths

Put a job name on a booth and it stops being self-service:

```lua
job = 'reporter',
```

Anyone **without** that job, or with it but off duty, gets a screen telling them the booth is staffed,
who runs it, and how many of them are on shift right now. They cannot start a take themselves.

Someone with the job and on duty opens the ordinary booth screen, pays nothing, and films. The price a
customer would have paid goes to that job's society account through `debux-bank`, Renewed-Banking,
qb-banking or `esx_addonaccount`, whichever is running.

Job names must match your framework exactly — `reporter`, not `Reporter`. ESX has no duty flag, so on
ESX anyone holding the job counts as on shift.

> **The price is the one in `config.lua`.** An operator cannot set or change it from inside the game
> in 1.0.0.

## Couples

```lua
Config.Couple = {
    enabled     = true,
    radius      = 12.0,
    inviteTime  = 20,
}
```

| Setting | Default | What it changes |
| --- | --- | --- |
| `enabled` | `true` | `false` removes the couple tab, the nearby list and every couple pose. |
| `radius` | `12.0` | Metres. How far away a partner may be to show up in the nearby list — and re-checked on the server when the invite is actually sent, so walking away in between cancels it. |
| `inviteTime` | `20` | Seconds before an invite expires. The invited player's card shows the window, and the sender is told when it lapses. |

> If you change `inviteTime`, change the `invite_wait` line in your locale files too — the English
> one reads *"%s has 30 seconds to accept"*, with the number written into the sentence rather than
> filled in from the config.

The invite card shows the pose, the speed and the length, so the invited player knows what they are
agreeing to. Declining tells the sender. An accepted partner is held for ten minutes, which is what
lets the pair walk to the platform before filming.

## Poses

The list is `animation.lua`, next to `config.lua`. One entry looks like this:

```lua
{
    key = 'peace', icon = 'hand-peace',
    dict = 'mp_player_int_upperpeace_sign', clip = 'mp_player_int_peace_sign', flag = 49,
},
```

| Key | What it does |
| --- | --- |
| `key` | Also the locale key, `pose_<key>`, in every file under `locales/` |
| `icon` | Which pictogram the panel draws next to it |
| `dict` / `clip` | The animation. `dict = false` means the subject just stands there, which is a real choice |
| `flag` | `49` loops the clip and leaves the upper body free. `1` loops the whole body |
| `couple` | `true` needs two people, and a `partner = { dict, clip }` beside it for the second animation |
| `free` | `true` hands the controls back — nothing is played, nothing is frozen, and the subject walks around while the rig films |

Seventeen ship: ten that work solo — nine posed plus freemode — and seven that need a partner. `freemode` is the exception —
`couple = 'either'`, so it appears in both tabs.

**Freemode really is free.** The player keeps their controls for the whole take and can walk out of
frame if they want. The only keys held down are the pause and Esc keys, so nobody drops the game menu
into the middle of their own clip.

Adding a pose is that entry plus a `pose_<key>` line in each locale file. A pose with no locale line
shows its own key on the button.

## Gallery

```lua
Config.Gallery = {
    keepDays    = 30,
    perPlayer   = 24,
    allowDelete = true,
}
```

| Setting | Default | What it changes |
| --- | --- | --- |
| `keepDays` | `30` | Rows older than this are deleted **when the resource starts**, not on a timer. `0` keeps them forever. The number is shown to players at the bottom of their gallery. |
| `perPlayer` | `24` | How many takes one player keeps. The oldest are dropped as new ones land, immediately after each take. |
| `allowDelete` | `true` | `false` removes the delete button, and refuses the request on the server as well. |

Deleting is scoped to the owner inside the query itself, so a player cannot delete someone else's
take by sending a different id.

**Only the link is stored.** Deleting a row deletes your record of the take, not the file — that
lives with your upload provider and has to be removed there if you need it gone.

## Blips

```lua
Config.Blips = {
    enabled    = true,
    sprite     = 184,
    colour     = 27,
    scale      = 0.72,
    display    = 4,
    shortRange = true,
    label      = '360 Studio',
}
```

`enabled = false` hides every booth blip at once. To hide one booth only, set `blip = false` on that
entry in `Config.Booths`.

---

# config.server.lua

Loaded in `server_scripts` only. Nothing in this file reaches a player.

## Uploads

```lua
Config.Upload = {
    provider = 'fivemanage',

    fivemanage = {
        videoToken = '',
        url        = 'https://api.fivemanage.com/api/v2/video',
    },

    webhook = '',

    custom = {
        url     = '',
        field   = 'file',
        headers = {},
    },
}
```

| Provider | What it needs |
| --- | --- |
| `'fivemanage'` | `videoToken` — the **video** token from fivemanage.com → Media → API keys. Fivemanage issues one token per media type, and an image token will not upload a video |
| `'webhook'` | `webhook` — a Discord webhook URL, or any URL that accepts a multipart POST |
| `'custom'` | `url`, the form field name the endpoint expects (`field`), and any `headers` it needs |

**A take will not start if uploads are not configured.** The booth screen says *UPLOADS ARE OFF · ASK
AN ADMIN* and the server refuses the start, rather than letting a player film for twelve seconds and
then telling them it was for nothing.

The file is posted from the player's own client, not from your server. Whatever you point this at has
to accept a cross-origin POST from the game and answer with the link — a JSON body carrying
`data.url`, `url`, `link`, `image` or `attachments[0].url`, or a plain-text body starting with
`http`. The upload gives up after 25 seconds.

Only the URL that comes back is sent to your server, and only after it is checked: it has to start
with `http://` or `https://` and be under 255 characters.

## Discord log

```lua
Config.Logs = {
    enabled = false,
    webhook = '',
}
```

Off by default. Turned on, three things are posted as embeds:

| Event | Colour | Carries |
| --- | --- | --- |
| **Take saved** | Purple | Player name and identifier, booth, pose, speed, length, what was paid, the partner's identifier if there was one, and the link — set as the embed link, so the clip is one click away |
| **cancelled** | Grey | Player name and identifier, and which booth |
| **deleted** | Grey | Player name and identifier, and which take id was removed |

Posts as **DEBUX 360 Studio**. A webhook that does not start with `http` is treated as unset and
nothing is posted at all, which is the quiet failure to check first if your channel stays empty.

> Every take posted here carries a working link to the video. Put the webhook in a staff channel.
