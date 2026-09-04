# Installation

Two things need a decision before a player can film anything: where the upload goes, and where the
booth stands. Everything else is a drop-in.

## 1. Drop it in

Put the `debux-360studio` folder in your resources directory. We recommend a `[debux]` folder so
every DebuX resource starts together:

```
resources/
└── [debux]/
    └── debux-360studio/
```

The interface is already compiled and ships inside the folder, and so do the platform and arm models.
There is nothing to build.

## 2. Database

One table, `debux_360_takes`, created automatically the first time the resource starts. There is no
SQL file, nothing to import and nothing to run by hand.

If your MySQL user cannot run `CREATE TABLE`, you will see this in the server console and the gallery
will be empty forever:

```
[debux-360studio] the table could not be created: ...
```

Grant the user `CREATE` and restart the resource. Nothing else in your database is touched.

The table holds one row per finished take: the owner, the partner if there was one, the pose, the
speed, the booth, the link, the length and the timestamp. **The video itself is never stored in your
database** — only the URL your upload provider gave back.

## 3. server.cfg

Start it **after** ox_lib, oxmysql and your framework:

```cfg
ensure ox_lib
ensure oxmysql
ensure qbx_core

ensure [debux]
```

On ESX or QBCore the framework line is `ensure es_extended` or `ensure qb-core` instead. On
standalone there is no framework line at all.

Framework detection reads which resources are **started** at the moment `debux-360studio` starts. If
it starts first it finds nothing running and falls back to standalone, which means no jobs and no
money — a staffed booth can never be entered and a priced booth is free.

## 4. Set up the upload

**This is the one thing that has to be done before anyone can film.** With no upload configured the
booth screen says *UPLOADS ARE OFF · ASK AN ADMIN* and the start button refuses.

Open `config.server.lua` — the server-only file, so nothing in it ever reaches a player:

```lua
Config.Upload = {
    provider = 'fivemanage',

    fivemanage = {
        videoToken = 'YOUR_VIDEO_TOKEN',
        url        = 'https://api.fivemanage.com/api/v2/video',
    },

    webhook = '',

    custom = { url = '', field = 'file', headers = {} },
}
```

| Provider | What to put in |
| --- | --- |
| `'fivemanage'` | A **video** token from fivemanage.com → Media → API keys. Fivemanage issues a separate token per media type; an image token will not upload a video |
| `'webhook'` | A Discord webhook URL, or any URL that accepts a multipart POST |
| `'custom'` | Your own endpoint, the form field name it expects, and any headers it needs |

Whatever you point it at has to accept a cross-origin POST from the game client and answer with the
link. A URL is read out of `data.url`, `url`, `link`, `image` or `attachments[0].url` in a JSON
response, or a plain-text body that starts with `http`. Anything else counts as a failed upload.

> **A Discord webhook has a file size limit**, and twelve seconds at 12 Mbit/s is well past the
> default 8 MB. If you use one, drop `Config.Recording.bitrate` and `duration` until the clip fits,
> or use a provider built for it. See [Configuration](./configuration.md#recording).

## 5. Set your language

Open `config.lua`:

```lua
Config.Locale = 'tr'
```

Ships with ten: `en, tr, de, fr, es, it, pt, pl, ru, nl`. A code with no file under `locales/` falls
back to English rather than erroring, so a typo here looks like "nothing happened".

This drives the **interface**. The notifications, the `[E]` prompt and the target labels go through
ox_lib and follow ox_lib's own language instead:

```cfg
setr ox:locale "tr"
```

Set both, to the same code, or you will end up with a Turkish panel and English notifications. See
[Configuration](./configuration.md#language).

## 6. Place your first booth

Stand in the game exactly where you want the platform, facing the way you want it to face, and copy
your own coordinates. Paste them in as they come — `Config.Props.groundOffset` is what drops the rig
from your chest height onto the floor:

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

The fourth number is the heading, which is the direction the rig faces and the direction the subject
is turned to when the take starts. Restart the resource and walk back to it.

If the platform sits in the ground or floats, adjust `Config.Props.groundOffset`. If the player
stands inside the platform rather than on it, adjust `Config.Props.standOffset` — see
[Configuration](./configuration.md#props-and-the-rig). Both are already correct for the platform that
ships with the resource, so you only touch them on a slope or with a model of your own.

## 7. Start the server

About three seconds after start you get the version check:

```
══════════════════════════════════════════════════════════════════
│ DEBUX 360 STUDIO  v1.0.0
│
│ Up to date
══════════════════════════════════════════════════════════════════
```

When a newer build has been published it says so instead, with the download link and what changed. If
your server has no outbound internet, or GitHub is unreachable, nothing is printed at all — the check
fails silently by design and nothing else is affected.

Each client also prints one line to its own console (F8) as it comes up, which is the quickest way to
confirm detection:

```
[debux-360studio] client up, framework = qbx, target = ox_target
```

`target = nil` there means no target resource was found, or `Config.UseTarget` is `false`.

## 8. First-run check

| Check | Expected |
| --- | --- |
| Walk to the booth | The platform and the arm are standing there |
| Target option, or `[E]` | The booth screen opens with your brand at the top |
| Pick a pose, press start | Countdown, then the arm turns a full circle around you |
| Wait for *SAVING* | *Your take is ready* |
| `SELECT * FROM debux_360_takes` | One row, with a link in `url` |
| Open that link in a browser | The clip plays |
| Target → *Your takes* | The gallery, with the take in it |

If the booth screen says *UPLOADS ARE OFF*, go back to step 4. If the arm is there but the camera
looks at the sky, go back to step 7.

## 9. Tell your players to reconnect

**Streamed assets only reach a client when it connects.** Anyone who was already in the server while
you were installing this will not have the platform or the arm — they will walk up to an empty patch
of ground with a working target option on it.

A resource restart does not fix that. They have to fully reconnect. The same applies every time you
change anything under `stream/`.
