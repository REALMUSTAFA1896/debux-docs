# Exports, events & commands

This resource has **no exports**. Nothing is registered for another script to call, in either
direction.

That is deliberate rather than an omission. Everything it does is bounded by a booth: a player walks
up to one, films, and the link goes in a table. There is no balance to read, no state another
resource would want to hold, and nothing that makes sense to trigger from somewhere the player is not
standing. It is self-contained.

If you want a take to show up somewhere else — a phone app, a website, a Discord channel — read the
table or turn the Discord log on. Both are described below.

## Commands

The resource registers **no commands at all**. There is no admin command, no command to open the
booth or the gallery, and no console command to re-run the version check — that runs once, three
seconds after the resource starts. The booth and the gallery are reached by walking up to a booth.

## The booth and the gallery

Both are opened by walking up to a booth:

| Reached by | Booth | Gallery |
| --- | --- | --- |
| ox_target / qb-target | *Use the 360 booth* | *Your takes* |
| `[E]` prompt | Yes | **No** |

With no target resource running, or `Config.UseTarget = false`, there is no way for a player to reach
their gallery. See [Troubleshooting](./troubleshooting.md#the-gallery-cannot-be-opened).

## Server callbacks

Everything the interface asks for goes through ox_lib callbacks. They are listed for reference; they
are internal to the resource and there is nothing to wire up.

| Callback | What it does |
| --- | --- |
| `debux-360studio:server:open` | Opens a booth. Checks the booth exists, that the player is within 6 metres of it, that it is not already in use, and whether they are the operator |
| `debux-360studio:server:nearby` | The list of players within `Config.Couple.radius`, nearest first |
| `debux-360studio:server:invite` | Sends a couple invite. Re-checks the distance |
| `debux-360studio:server:answer` | Accept or decline. Checks the invite has not expired |
| `debux-360studio:server:start` | Locks the booth, checks the job gate, checks uploads are configured, and takes the fee |
| `debux-360studio:server:uploadTarget` | Hands the client the upload URL and headers. Refuses unless that player has a take running |
| `debux-360studio:server:finish` | Validates the URL, writes the row, posts the Discord log, trims to `Config.Gallery.perPlayer` |
| `debux-360studio:server:cancel` | Releases the booth and logs it |
| `debux-360studio:server:gallery` | That player's own takes |
| `debux-360studio:server:delete` | Deletes one take, scoped to the owner in the query |

**Every one of them re-checks on the server.** The booth index, the pose, the speed and the URL that
come back from a client are all validated before anything is written — an unknown pose falls back to
`stand`, an unknown speed to `defaultSpeed`, and a URL that is not `http(s)` and under 255 characters
is rejected as a failed upload. A callback that throws prints the error server-side and answers with a
generic failure rather than leaving the player's screen hanging.

## Client events

Two net events, both sent by this resource to its own client script. They carry no authority — they
open a screen, and everything the screen then asks for is checked again server-side.

| Event | Sent when |
| --- | --- |
| `debux-360studio:client:invited` | Somebody invited this player into a couple take. Opens the invite card |
| `debux-360studio:client:partnerReady` | The invited player accepted |
| `debux-360studio:client:notify` | A notification, by locale key, from the server |

## Stored data

One table, `debux_360_takes`, created automatically on first start.

| Column | Holds |
| --- | --- |
| `owner` | The citizen id, or the identifier on standalone |
| `partner` | The other player's identifier on a couple take, otherwise null |
| `pose`, `speed` | The keys, not the labels |
| `booth` | The booth's `label` at the time |
| `url` | The link the upload provider gave back |
| `duration` | Seconds |
| `created_at` | Timestamp |

**The video is not in your database.** Only the link is. Reading the table is the supported way to
show takes somewhere else:

```sql
SELECT url, pose, created_at FROM debux_360_takes WHERE owner = ? ORDER BY id DESC LIMIT 10;
```

Nothing else in your database is touched.

## What is deliberately not exported

**Starting a take from another script.** A take needs the player standing on a specific platform, in
front of a specific arm, with a booth locked to them and a fee taken. There is no meaningful way to
start one from somewhere else, and an export that skipped the checks would be a free take from
anywhere on the map.

**Opening the gallery from another script.** For the same reason the booth check exists — it is a
place in the world, not a menu. If you want the gallery on a phone instead, the table above is the
honest way to build it.

**Deleting or writing takes from outside.** Deletion is scoped to the owner inside the SQL, and rows
are only written after the server has validated the URL it is being handed. An export around either
would be a way past both.
