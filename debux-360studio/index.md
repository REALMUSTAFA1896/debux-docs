# Debux 360 Studio

A 360 video booth. The player steps onto a platform, a camera rig on a motorised arm swings round
them, and twelve seconds later they have a video with a link they can paste anywhere. Solo or as a
pair, seventeen poses including a freemode that hands the controls back, three speeds, and a personal
gallery they come back to.

Booths are free, priced, or run by a job. The clip is uploaded to your own provider and only the link
is kept in your database.

Works on **Qbox, QBCore, ESX and standalone** with no edits — the framework is detected when the
resource starts.

## What a player does

**Walks up to a booth.** A target option, or `[E]` if you do not run a target resource. The platform
and the arm are real props standing in the world, so a player can see the booth before they reach it.

**Picks a pose and a speed.** Sixteen animated poses plus a freemode that plays nothing at all and
leaves the player walking around while the arm films them. Three speeds — slow motion, normal, fast —
which change how fast the arm actually moves and, for slow motion, the game's own time scale with it.
The clip is not re-encoded afterwards, so what the camera saw is what comes out.

**Films with someone.** Seven of the poses need two people. The player picks a partner from a list of
whoever is standing nearby, an invite card lands on that player's screen, and the take starts once
they accept. Freemode works either way.

**Watches it back.** The gallery holds their last takes with the pose, the speed, the booth and how
long ago it was. Copy the link, or delete the take.

**Pays, or does not.** Each booth carries its own price. A booth with a `job` on it is staffed
instead: the person holding that job films for free and the money goes to the society account.

## What it needs

| Dependency | Required |
| --- | --- |
| [ox_lib](https://github.com/overextended/ox_lib) | Yes |
| [oxmysql](https://github.com/overextended/oxmysql) | Yes |
| ox_target or qb-target | Optional — falls back to an `[E]` prompt, but see below |
| An upload provider | Yes. A take will not start without one |

MySQL/MariaDB. The one table it uses is created automatically on first start — there is no SQL file
to import and nothing to run by hand.

> **The gallery is a target option.** With no target resource running, the `[E]` prompt opens the
> booth and nothing opens the gallery. If you are on `[E]` and you want players to reach their takes,
> install ox_target or qb-target. See [Troubleshooting](./troubleshooting.md#the-gallery-cannot-be-opened).

## Framework support

| Framework | Detected by | Used for |
| --- | --- | --- |
| Qbox | `qbx_core` | Citizen id, character name, job and duty state, taking the booth fee |
| QBCore | `qb-core` | Same |
| ESX | `es_extended` | Same. ESX has no duty flag, so an ESX player with the job always counts as on shift |
| Standalone | Nothing else running | Runs, but there are no jobs and no money — every booth is free and a `job` on a booth can never be matched |

Detection reads which resources are **started** at the moment `debux-360studio` starts, in that
order. `Config.Framework` overrides it if the guess is wrong.

Society payouts for staffed booths go to `debux-bank`, Renewed-Banking, qb-banking or
`esx_addonaccount`, whichever is running, in that order.

## What actually gets recorded

The picture is captured from the game view by the interface layer and written as a WebM. Two things
follow from that and both are worth knowing before you set anything:

**The take is silent unless you give it a track.** GTA's own audio cannot be captured — the layer
that records the picture has no access to it. `Config.Recording.music` mixes a file of your own into
the clip instead.

**`width` and `height` are ceilings, not targets.** The capture is the size of the player's own game
window, scaled down to fit inside those numbers if it is bigger. A player running at 1600×900 gets a
1600×900 clip out of a 1920×1080 setting; nothing is ever scaled up.

The finished file is posted straight from the player's own client to your upload provider. It never
passes through your server, and your server never stores the video — only the URL that comes back.

## Interface

The interface ships compiled with the resource and is served straight from it. There is nothing to
build and nothing to install.

Fonts and images are embedded. Nothing is fetched from a CDN at runtime, so the panel looks the same
on a server with no outbound internet.

`Config.Brand` puts your own name and a handwritten line at the top of every screen.

## Player pictures

`Config.Avatar` puts a real profile picture beside the player's name — on the booth screen, on the
gallery, on the nearby-players list and on the invite card. Steam or Discord, your pick, and the key
that fetches it lives in `config.server.lua` so it never reaches a client. Left on `'none'` the
interface draws a plain circle and no request is ever made.

## Languages

Ten: `en, tr, de, fr, es, it, pt, pl, ru, nl`. One JSON file per language under `locales/`, covering
the interface, the notifications, the `[E]` prompt and the target labels.

`Config.Locale` drives the interface. The notifications and prompts go through ox_lib and follow
**ox_lib's** language, which is a separate setting — see
[Configuration](./configuration.md#language).

## Stream assets

The platform and the arm are shipped with the resource as streamed models, along with their texture
dictionary and a type file.

> **Streamed assets only reach a client when it connects.** Restarting the resource does not push a
> new model out to players who are already in the server. After adding or changing anything under
> `stream/`, everyone has to fully reconnect before they can see it — a `/restart` leaves them
> looking at nothing where the booth should be.
