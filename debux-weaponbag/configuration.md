# Configuration

Everything lives in `config.lua`. There is no second config file — the webhook URL is in the same
file as everything else, which matters, so read [Discord webhook](#discord-webhook) before you fill
it in.

The language is **not** set here. It comes from the ox_lib locale convar in `server.cfg`:

```cfg
setr ox:locale "tr"
```

Ships with `en, tr, de, fr, es, it, pt, pl, ru, nl`. Missing keys fall back to English.

## General

```lua
Config.Debug              = false
Config.InteractDistance   = 2.0
Config.DistanceTolerance  = 1.5
Config.MaxPlaceDistance   = 6.0
```

| Setting | Default | What it changes |
| --- | --- | --- |
| `Debug` | `false` | Prints every place, pickup, store and take to the server console, with the raw metadata. Useful when a bag is losing its contents; noisy otherwise. |
| `InteractDistance` | `2.0` | Metres. Sets the target zone radius on the bag, and the server's own distance check when it opens. |
| `DistanceTolerance` | `1.5` | Extra metres the server allows on top of `InteractDistance` before it refuses with *"You are too far away"*. Absorbs the gap between what the client sees and where the server thinks the player is. Lowering it to `0` will produce false rejections on a laggy server. |
| `MaxPlaceDistance` | `6.0` | Metres. The furthest from the player a bag is allowed to land. Checked on the server when the bag is placed; if it fails, the item is returned with its contents intact. This is an anti-cheat bound, not a gameplay setting — `Config.Bag.ReachMax` is what a legitimate player can actually reach. |

## Inventory and target

```lua
Config.Inventory = 'auto'
Config.Target    = 'auto'
Config.KeepWeaponMetadata = true
```

| Setting | Default | What it changes |
| --- | --- | --- |
| `Inventory` | `'auto'` | Detects, in order: `ox_inventory`, `qs-inventory`, `codem-inventory`, `tgiann-inventory`, then `qb-inventory` (which also covers `lj-inventory` and `ps-inventory`). If none are running and the framework is ESX, it falls back to `esx`. Set it by hand only for a renamed fork. |
| `Target` | `'auto'` | Detects `ox_target`, then `qb-target`, then `qtarget`. |
| `KeepWeaponMetadata` | `true` | Carries ammo, attachments, serial numbers and durability with a weapon as it moves in and out of the bag, and lets a loaded bag be picked up. |

::: danger Turning KeepWeaponMetadata off stops loaded bags being picked up
Contents are stored on the item when a bag is picked up, and metadata is the only place to put them.
With `KeepWeaponMetadata = false` — or on a classic ESX inventory, which has no metadata at all — a
bag with anything in it is refused with *"Empty the bag before picking it up"*. Nothing is lost, but
the player has to unload the bag by hand before it can be carried.
:::

Detection reads which resources are running at the moment `debux-weaponbag` starts, so it must be
started after your inventory and your target. Check the startup banner to see what it picked.

## The bag item and model

```lua
Config.Bag = {
    Item  = 'weaponbag',
    Model = 'prop_big_bag_01',
    ModelFallbacks = {
        'prop_big_bag_01',
        'hei_p_m_bag_var22_arm_s',
        'prop_cs_heist_bag_01',
        'ba_prop_battle_bag_01a',
        'prop_michael_backpack',
        'prop_ld_case_01',
        'prop_mil_crate_01',
    },
}
```

| Setting | Default | What it changes |
| --- | --- | --- |
| `Item` | `'weaponbag'` | The inventory item name. Change it and you must change your inventory's item entry too. |
| `Model` | `'prop_big_bag_01'` | The object that appears in the world. Put your own streamed model here if you have one. `false` skips straight to the fallback list. |
| `ModelFallbacks` | seven props | Tried in order; the first that exists on the server wins. The chosen model is printed to the client console on start. |

The model chosen here is only the object in the world. The picture inside the interface is fixed and
unrelated — changing one does not change the other.

::: warning No usable model means the bag cannot be placed
If neither `Model` nor any fallback exists, the client prints *"no usable bag model"* on start and
using the item fails with *"The bag model is missing on this server"*. Placed bags already in the
database are also invisible, because there is nothing to spawn — they are not deleted, and they come
back as soon as a working model exists.
:::

## Placement

```lua
PlaceDistance = 1.2,
SnapToGround  = true,

RotateStep     = 15.0,
RotateStepFine = 3.0,
HeightStep     = 0.05,
HeightStepFine = 0.01,
HeightMin      = -0.50,
HeightMax      = 1.60,
ReachStep      = 0.10,
ReachStepFine  = 0.02,
ReachMin       = 0.60,
ReachMax       = 2.60,
ShowReadout    = true,
PreviewAlpha   = 160,
PreviewBlocked = true,

BlockInVehicle = true,
BlockInWater   = true,
```

| Setting | Default | What it changes |
| --- | --- | --- |
| `PlaceDistance` | `1.2` | Metres in front of the player the preview starts at, and where `G` resets it to. |
| `SnapToGround` | `true` | Drops the preview onto the surface below it. |
| `RotateStep` | `15.0` | Degrees per mouse wheel notch. |
| `RotateStepFine` | `3.0` | Degrees per notch while `SHIFT` is held. |
| `HeightStep` | `0.05` | Metres per frame while the up or down arrow is held. |
| `HeightStepFine` | `0.01` | The same while `SHIFT` is held. |
| `HeightMin` | `-0.50` | Lowest the bag can be lifted or sunk relative to the ground under it. |
| `HeightMax` | `1.60` | Highest — enough to reach a table top or a car boot. |
| `ReachStep` | `0.10` | Metres per frame while the left or right arrow is held. |
| `ReachStepFine` | `0.02` | The same while `SHIFT` is held. |
| `ReachMin` | `0.60` | Closest the bag can be pulled in. |
| `ReachMax` | `2.60` | Furthest it can be pushed out. Keep this below `Config.MaxPlaceDistance` or a legitimate placement can be rejected by the server. |
| `ShowReadout` | `true` | Adds the live rotation and height figures under the control hint. |
| `PreviewAlpha` | `160` | Preview transparency, `0`–`255`. |
| `PreviewBlocked` | `true` | Fades the preview to 35% of `PreviewAlpha` where the bag cannot be dropped. |
| `BlockInVehicle` | `true` | Refuses placement while the player is in a vehicle. |
| `BlockInWater` | `true` | Refuses placement while the player is in water. |

Placement is also refused while the player is falling or ragdolled, which is not configurable.

::: danger SnapToGround = false makes placement impossible
The confirm key only works when the ground under the preview has been found, and the ground is only
looked for when `SnapToGround` is `true`. Setting it to `false` leaves the preview permanently in the
blocked state — `E` does nothing but show *"You cannot place the bag here"*, and the only way out is
`X`. Leave it on.
:::

### Controls during placement

These are not configurable. They are listed in the locale files under `place_hint` if you want to
reword the on-screen hint.

| Key | Action |
| --- | --- |
| `E` | Place the bag |
| `X` | Cancel |
| Mouse wheel | Turn |
| Arrow up / down | Raise / lower |
| Arrow left / right | Push away / pull in |
| `SHIFT` (held) | Use the Fine step for all of the above |
| `G` | Reset rotation, height and distance |

## Animations

```lua
PlaceAnim  = { dict = 'pickup_object', clip = 'putdown_low', duration = 1400 },
PickupAnim = { dict = 'pickup_object', clip = 'pickup_low',  duration = 1400 },
```

| Key | What it does |
| --- | --- |
| `dict` | Animation dictionary, requested on demand |
| `clip` | Clip name inside that dictionary |
| `duration` | Milliseconds. This is also how long the script waits before it talks to the server, so it is the real delay the player feels. |

The animation is played before the server is asked to place or pick up, so a failure — a full
inventory, say — happens after the player has already crouched.

## Sounds

```lua
Sounds = {
    Enabled = true,
    Volume  = 0.55,
    ErrorSound = { name = 'ERROR', set = 'HUD_FRONTEND_DEFAULT_SOUNDSET' },
},
```

| Setting | Default | What it changes |
| --- | --- | --- |
| `Enabled` | `true` | Turns off both the interface sounds and the error beep. |
| `Volume` | `0.55` | `0` silent to `1` full. Applies to the interface sounds only. |
| `ErrorSound` | `ERROR` / `HUD_FRONTEND_DEFAULT_SOUNDSET` | Played by the game, not the interface, and only when the bag is **closed** — an open bag plays its own denial sound instead. Both `name` and `set` must be real GTA sounds or nothing is heard. |

The five interface sounds ship with the resource and are played by the interface itself, so there is
no `interact-sound` or `xsound` to install.

## Despawning abandoned bags

```lua
Despawn       = 0,
DespawnRadius = 60.0,
DespawnCheck  = 30,
```

| Setting | Default | What it changes |
| --- | --- | --- |
| `Despawn` | `0` | Seconds an unattended bag survives before it is deleted. `0` disables it entirely. |
| `DespawnRadius` | `60.0` | Metres. Any player this close counts as someone being around, and resets the timer. |
| `DespawnCheck` | `30` | Seconds between sweeps. Values below `10` are clamped to `10`. |

The timer only runs while nobody is within `DespawnRadius`, and it is kept in memory, so a server
restart starts every bag's countdown again. Bags themselves always survive a restart.

::: danger Despawn deletes the contents with the bag
This is not a "return it to the owner" timer. When it fires, the row is deleted from
`debux_weaponbags` and every weapon inside the bag is gone with it. There is no webhook for a
despawn and no notification to the owner. Leave it at `0` unless players are genuinely littering the
map, and if you do turn it on, pick a number in hours rather than minutes.
:::

## Pockets

```lua
{ id = 'primary_1', accepts = { 'primary' },
  ui = { x = 14.0, y = 8.0, w = 16.7, h = 77.0, rotate = -90, scale = 0.92 } },

{ id = 'ammo_1', accepts = { 'ammo', 'attachment' }, stack = 500,
  ui = { x = 56.0, y = 63.5, w = 8.3, h = 21.5, rotate = -90, scale = 0.72 } },
```

| Key | What it does |
| --- | --- |
| `id` | Unique name. Also the locale key — `slot_primary_1` — and the key the contents are stored under in the database. |
| `accepts` | Which categories fit. A pocket that lists more than one takes any of them. |
| `ui.x`, `ui.y` | Top-left corner of the pocket, as a percentage of the bag picture. |
| `ui.w`, `ui.h` | Width and height, as a percentage of the bag picture. |
| `ui.rotate` | Degrees the weapon picture is turned, so it lies along the pocket instead of across it. |
| `ui.scale` | How much of the pocket the picture fills, `0`–`1`. |
| `stack` | How many units the pocket holds. Ammunition counts in rounds. Omit it and the pocket holds one. |

Ten pockets ship by default: two `primary`, one `smg` (which also takes a `primary`), three
`sidearm`, one `melee`, two ammo/attachment pockets holding 500, and one ammo/throwable pocket
holding 50.

Adding a pocket is one entry here plus a `slot_<id>` line in every locale file you use. The interface
lays itself out from this list, so nothing needs rebuilding.

::: danger Removing or renaming a pocket loses what is in it
Contents are stored against the pocket id. When a bag is picked up and put back down, everything is
re-checked against the current `Config.Slots` — anything whose pocket id no longer exists, or that no
longer fits the pocket it was in, is silently dropped and does not come back. Bags already on the
ground keep the orphaned entries in the database, but the interface cannot show them and the player
cannot take them out, while they still count towards the bag being full.

Make players empty their bags before you change `Config.Slots` on a live server.
:::

## Categories

```lua
Config.CategoryRules = {
    { category = 'primary',    contains = { 'rifle', 'carbine', 'shotgun', 'sniper', 'mg', 'rpg', 'launcher', 'railgun', 'minigun' } },
    { category = 'smg',        contains = { 'smg', 'mp5', 'uzi', 'tec', 'gusenberg', 'machinepistol' } },
    { category = 'sidearm',    contains = { 'pistol', 'revolver', 'snspistol', 'vintagepistol', 'flaregun', 'stungun', 'raypistol' } },
    { category = 'melee',      contains = { 'knife', 'bat', 'crowbar', 'hammer', 'machete', 'hatchet', 'wrench', 'poolcue', 'golfclub', 'dagger', 'switchblade', 'knuckle', 'battleaxe', 'nightstick', 'stone_hatchet' } },
    { category = 'throwable',  contains = { 'grenade', 'molotov', 'stickybomb', 'pipebomb', 'bzgas', 'smokegrenade', 'flare', 'ball', 'snowball', 'proxmine' } },
    { category = 'ammo',       contains = { 'ammo-', 'ammo_' } },
    { category = 'attachment', contains = { 'at_', 'attachment', 'suppressor', 'scope', 'clip', 'grip', 'flashlight' } },
}
```

Matching runs on the lowercased item name, as a plain substring, and **the first rule that matches
wins**. Order decides ties, and it decides more of them than it looks.

::: warning Submachine guns are categorised as primary
The `primary` rule contains the needle `mg`, meant for `weapon_combatmg`. `smg` also contains `mg`,
and `primary` is checked first — so `weapon_smg`, `weapon_microsmg`, `weapon_assaultsmg` and
`weapon_minismg` all come out as `primary`, not `smg`. In practice they still fit the SMG pocket,
because it accepts both categories, but they also take up a full-length rifle pocket and they are
labelled *Primary* in the interface.

If you want them separated, name them explicitly:

```lua
Config.CategoryOverrides = {
    ['weapon_smg']        = 'smg',
    ['weapon_microsmg']   = 'smg',
    ['weapon_assaultsmg'] = 'smg',
    ['weapon_minismg']    = 'smg',
}
```

Overrides are checked before any rule, so this wins.
:::

Anything that matches no rule falls to `Config.DefaultCategory` — `weapon_combatpdw`, for one, which
is why it turns up as a sidearm.

Only items named `weapon_*` are ever considered, plus anything the ammunition check recognises — a
name starting `ammo-` or `ammo_`, ending `-ammo` or `_ammo`, or exactly `ammo`. Everything else in
the player's inventory is ignored and never appears in the list beside the bag.

```lua
Config.CategoryOverrides = {
    ['weapon_musket']        = 'primary',
    ['weapon_marksmanrifle'] = 'primary',
    ['weapon_machinepistol'] = 'smg',
    ['weapon_pistol50']      = 'sidearm',
}
```

Overrides are checked before the rules, so this is where addon weapons and anything the substring
matching gets wrong belong. Both the full name and the name without its `weapon_` prefix are looked
up, so `['musket']` works as well as `['weapon_musket']`.

```lua
Config.DefaultCategory = 'sidearm'
```

Where a `weapon_*` item matches no rule at all. `false` refuses it outright, so it never appears in
the list.

::: warning Categories are cached until restart
The category worked out for an item name is remembered for the lifetime of the resource. Editing
`Config.CategoryRules` or `Config.CategoryOverrides` and reloading the config is not enough — restart
the resource.
:::

Every category you use needs a `cat_<name>` line in your locale files, or the interface shows the raw
key.

## Capacity

```lua
Config.Capacity = {
    MaxWeight = 30.0,
    MaxItems  = 10,
}
```

| Setting | Default | What it changes |
| --- | --- | --- |
| `MaxWeight` | `30.0` | Total weight the bag holds. Item weights come from your own inventory. |
| `MaxItems` | `10` | Hard cap on filled pockets. There is no point setting it above the number of pockets. |

::: warning MaxWeight is in whatever unit your inventory uses
Only ox_inventory weights are converted — it stores grams, and they are divided by 1000, so `30.0`
really is 30 kg. Every other inventory's weight is taken exactly as it is written in your items file.
A qb-core item at `weight = 2500` counts as 2500 against a limit of `30.0`, so the first weapon
stored fails with *"The bag cannot take any more weight"*. On those inventories, set `MaxWeight` in
the same unit as your items file — `30000` for the same effective 30 kg. The figure shown in the
interface is labelled `kg` either way.
:::

Lowering `MaxItems` below what a bag already holds does not empty it, but the next time that bag is
picked up and put back down only the first `MaxItems` entries survive, and which ones those are is
not predictable.

## Permissions

```lua
Config.Permissions = {
    PublicAccess    = false,
    InspectJobs     = { 'police', 'sheriff', 'bcso' },
    InspectMinGrade = 0,
    InspectCanTake  = true,
    AnyoneCanPickUp = false,
    UseAce          = false,
    Ace             = 'debux.weaponbag',
}
```

A bag belongs to whoever placed it. Every setting here widens that.

| Setting | Default | What it changes |
| --- | --- | --- |
| `PublicAccess` | `false` | `true` lets anyone standing near a bag open it and take things out of it. |
| `InspectJobs` | police, sheriff, bcso | Job names that can open **any** bag, for searches. The name must match exactly — `police`, not `Police`. An empty list disables it. |
| `InspectMinGrade` | `0` | Minimum job grade for those jobs. `0` means every grade. |
| `InspectCanTake` | `true` | `false` lets those jobs look but neither take nor store. The interface shows *"You may look, but not take anything out"*. |
| `AnyoneCanPickUp` | `false` | `true` lets any player carry off any bag. |
| `UseAce` | `false` | Turns on the ace check. Off by default, so the ace does nothing until you set this. |
| `Ace` | `'debux.weaponbag'` | The ace object checked. Renamed from `bupa.weaponbag`. |

The ace is checked in the same place as the inspect jobs, so a player who holds it gets the same
rights: open any bag, and — because picking up also accepts an inspector — pick up any bag. It works
on standalone, where there are no jobs at all.

```cfg
add_ace group.admin debux.weaponbag allow
```

::: danger AnyoneCanPickUp means anyone can walk off with a full bag
Picking a bag up transfers it and everything inside it to the person doing the picking. With
`AnyoneCanPickUp = true` that is any player who finds it, with no job check and no ownership check.
Combined with `PublicAccess = true` it also means anyone can empty a bag on the spot. Both are
deliberate options, but neither is recoverable — there is no log of who took what unless you have the
webhook on.
:::

## Interface

```lua
Config.UI = {
    Accent        = '#A855F7',
    Watermark     = true,
    CloseOnEscape = true,
    ImagePath     = false,
}
```

| Setting | Default | What it changes |
| --- | --- | --- |
| `Accent` | `'#A855F7'` | The accent colour throughout the interface. Must be a six-digit hex colour with the `#`. |
| `Watermark` | `true` | Sent to the interface, but the shipped build does not read it. Changing it makes no visible difference. |
| `CloseOnEscape` | `true` | `false` stops `Escape` closing the bag; the `ESC` button in the corner still works. |
| `ImagePath` | `false` | Where weapon pictures are loaded from. `false` derives it from the detected inventory. Set it for a renamed fork, e.g. `'nui://my-inventory/html/images/'`. |

`Accent` now derives its own hover and pressed shades — the hover is the colour 12% lighter, the
pressed state 15% darker — so setting one value recolours every button, highlight and progress bar
consistently. There is nothing else to change and no CSS to edit.

A three-digit hex like `#A5F` is not parsed and is passed through unchanged, which will not produce
the shades. Use the full six digits.

## Discord webhook

```lua
Config.Webhook = {
    Enabled  = false,
    Url      = '',
    Username = 'DebuX Weapon Bag',
    Avatar   = '',

    Log = {
        Place  = true,
        Pickup = true,
        Store  = true,
        Take   = true,
        Open   = false,
        Raid   = true,
    },

    Colors = {
        Place  = 11032055,
        Pickup = 11032055,
        Store  = 11032055,
        Take   = 15680580,
        Open   = 11032055,
        Raid   = 15680580,
    },

    Footer = 'DebuX Weapon Bag',
}
```

| Setting | Default | What it changes |
| --- | --- | --- |
| `Enabled` | `false` | Master switch. An empty `Url` also disables it. |
| `Url` | `''` | Discord webhook URL. |
| `Username` | `'DebuX Weapon Bag'` | Name the message is posted under. Empty uses the webhook's own name. |
| `Avatar` | `''` | Avatar URL. Empty uses the webhook's own. |
| `Log.Place` | `true` | A bag was put down. |
| `Log.Pickup` | `true` | A bag was picked back up. |
| `Log.Store` | `true` | Something went into a bag. |
| `Log.Take` | `true` | Something came out of a bag. |
| `Log.Open` | `false` | Someone opened a bag. Off by default because it fires on every open, including the owner's. |
| `Log.Raid` | `true` | An inspector — a job on `InspectJobs`, or the ace — opened a bag that was not theirs. Logged instead of `Open`, never as well as. |
| `Colors.*` | decimal | Embed colour per event, as a decimal, not hex. |
| `Footer` | `'DebuX Weapon Bag'` | Footer text. Empty removes the footer. |

Every message carries the player's name, server id and citizen id, the bag number and its owner's
name, and how full the bag is afterwards. Store and take messages also name the weapon and the
pocket.

A despawn is not logged, and neither is a bag deleted directly from the database.

::: danger config.lua is a shared script
Everything in `config.lua` is sent to every connected player, and that includes your webhook URL.
Anyone who can read the client cache can pull it out and use it to spam or scrape the channel. If
that matters to you, use a webhook in a channel you do not mind losing, and be ready to rotate it.
:::

## Advanced

```lua
Config.Table = 'debux_weaponbags'
```

The MySQL table. It is created on first start, and if you change this name the importer rewrites both
the table and its index before running, so automatic creation still works.

::: warning Changing this on a live server hides every existing bag
The name is read once when the resource starts, and every query uses it. Point it at a different
table and the bags in the old one are not deleted, but they stop existing as far as the resource is
concerned and the world objects vanish. Point it back and they return.

This is also the supported way to upgrade from the previous release without touching your database:
set it to `'bupa_weaponbags'`. See
[Installation](./installation#upgrading-from-the-previous-release).
:::

```lua
Config.SlotMap = {}
```

Built from `Config.Slots` when the config loads. Do not edit it, and do not add entries to it — it is
a lookup, not a setting.
