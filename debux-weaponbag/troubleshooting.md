# Troubleshooting

> **Read this first**
>
> The server loads every placed bag out of `debux_weaponbags` **once, when the resource starts**, and
> works from memory after that. Editing rows in SQL does nothing visible until you restart
> `debux-weaponbag`. Every fix on this page that involves a query needs a restart afterwards.

## Using the item does nothing

**Nothing happens at all — no preview, no error.** The item was never registered as usable.

On ox_inventory, the item entry is missing the hook. It must be exactly this:

```lua
server = {
    export = 'debux-weaponbag.useBag',
},
```

On Qbox, QBCore, qs-inventory, codem-inventory and tgiann-inventory, the item needs
`['useable'] = true` in your shared items file — the resource registers the handler itself.

**The console said it could not register the item.** Look for this on start:

```
[debux-weaponbag] could not register the bag item automatically — see the install/ folder
```

That means no framework was detected and the inventory is not ox_inventory. Either you are truly
standalone with a non-ox inventory, in which case there is no automatic path and you need to trigger
`debux-weaponbag:client:use` yourself, or `debux-weaponbag` started **before** your framework and
inventory. Move it after them in `server.cfg`.

**The bag disappears when the player cancels with `X`.** ox_inventory only. The item entry is missing
`consume = 0`, so ox_inventory eats the item at the moment of use. Add it and the item is only
removed once the bag is actually on the ground.

## The bag will not go down

**"The bag model is missing on this server."** No usable prop. The client prints which names it
tried:

```
[debux-weaponbag] no usable bag model — none of these exist: ...
```

Put a model that exists on your server in `Config.Bag.Model`, or leave it `false` so the fallback
list is used. If you pointed it at a streamed prop, the stream must be running before
`debux-weaponbag`.

**The preview is permanently faded and `E` only says "You cannot place the bag here".** Check
`Config.Bag.SnapToGround` first — with it set to `false` the ground under the preview is never looked
for, and placement can never be confirmed anywhere on the map. Set it back to `true`.

If it is already `true`, the player is in a vehicle, in water, falling or ragdolled, or standing
somewhere the ground cannot be found — inside some interiors and on some MLO floors. Walk a few
metres and try again.

**"You are too far away" the instant the player presses `E`.** The bag was pushed further out than
the server allows. `Config.Bag.ReachMax` (default `2.60`) must stay below `Config.MaxPlaceDistance`
(default `6.0`). If you raised `ReachMax`, raise `MaxPlaceDistance` with it. The item and its
contents are returned when this happens — nothing is lost.

## The bag is on the ground but nobody can use it

**No target options appear.** There is no `[E]` fallback in this resource. A placed bag is only
interactive through `ox_target`, `qb-target` or `qtarget`, and one of them must be running when
`debux-weaponbag` starts. Check the startup banner, start a target resource, restart
`debux-weaponbag`, and the bag comes back reachable.

**The bag object is not visible.** The model is missing on that client, or the state bag has not
arrived yet. Bags are spawned from `GlobalState.debuxWeaponBags`, which is sent shortly after the
resource starts. If it is only one player, have them rejoin.

**"This bag is not yours."** Working as configured. The bag belongs to whoever placed it. To widen
it, set `Config.Permissions.PublicAccess`, add the player's job to `InspectJobs`, or grant the ace.

## Permissions

**Police cannot open other people's bags.** Three things, all of which must be true:

1. The job name in `Config.Permissions.InspectJobs` matches exactly — `police`, not `Police`.
2. The player's grade is at least `Config.Permissions.InspectMinGrade`.
3. The framework actually reports a job. On standalone there is none, so `InspectJobs` can never
   match and the ace is the only option.

**The ace does nothing.** Two separate causes, and both catch people.

`Config.Permissions.UseAce` is `false` by default, so granting the ace on its own changes nothing.
Set it to `true`.

Or your `server.cfg` still grants the old name. It was renamed:

```cfg
add_ace group.admin debux.weaponbag allow
```

If you would rather not change every server that has the old line, point the config back at it
instead:

```lua
Config.Permissions.Ace = 'bupa.weaponbag'
```

## Contents

**"Empty the bag before picking it up."** The bag has something in it and there is nowhere to store
that on the item. Either the inventory has no metadata — classic ESX — or
`Config.KeepWeaponMetadata` is `false`.

Nothing has been lost. The player takes every weapon out through the interface, and then the empty
bag picks up normally. To fix it permanently, set `Config.KeepWeaponMetadata = true`, and on classic
ESX move to an inventory that supports metadata.

**"The bag cannot take any more weight" after one weapon.** `Config.Capacity.MaxWeight` is in the
same unit as your items file, and only ox_inventory weights are converted from grams. A qb-core
weapon at `weight = 1000` counts as 1000 against a default limit of `30.0`.

On qb-inventory, qs-inventory, codem-inventory and tgiann-inventory, set the limit in the same unit
as your items:

```lua
Config.Capacity.MaxWeight = 30000   -- the same effective 30 kg
```

The interface labels the figure `kg` regardless, so it will read `2500.0 kg` — that is cosmetic.

**The bag says it is full but the pockets look empty.** The bag is holding entries under pocket ids
that are no longer in `Config.Slots`. They count towards `Config.Capacity.MaxItems` and the weight
total, but the interface has nowhere to draw them, so the player cannot take them out.

Find them:

```sql
SELECT id, owner_name, contents FROM `debux_weaponbags`;
```

Compare the JSON keys against your `Config.Slots` ids. Either add the pocket back to the config, or
empty that bag:

```sql
UPDATE `debux_weaponbags` SET `contents` = '{}' WHERE `id` = 4;
```

> **Warning — That query destroys the weapons in the bag**
>
> There is no path that returns orphaned contents to a player. Restoring the pocket id in
> `Config.Slots` is the only fix that gives them back. Look at the JSON before you decide.

**Weapons vanished from a bag after a config change.** When a bag is picked up and put back down, its
contents are re-checked against the current config. Anything that fails is dropped and does not come
back. It fails if:

- its pocket id is no longer in `Config.Slots`
- its category no longer fits the pocket it was in, after a `CategoryRules` or `CategoryOverrides` edit
- the bag holds more than `Config.Capacity.MaxItems`, in which case the survivors are whichever ones
  happen to be read first

> **Note — Have players empty their bags before you change these**
>
> `Config.Slots`, `Config.CategoryRules`, `Config.CategoryOverrides` and `Config.Capacity.MaxItems` all
> affect bags that are already in circulation. Turn `Config.Debug` on before the change — it prints the
> raw contents of every bag as it is placed, so you can see what was dropped and why.

**Ammo counts and attachments are lost.** `Config.KeepWeaponMetadata` is `false`, or the inventory
has no metadata. On classic ESX this cannot be fixed — the weapon keeps its name and nothing else.

**Submachine guns go into the rifle pockets.** The `primary` category rule contains the needle `mg`,
which also matches every `smg` name, and the first matching rule wins. Name them explicitly:

```lua
Config.CategoryOverrides = {
    ['weapon_smg']        = 'smg',
    ['weapon_microsmg']   = 'smg',
    ['weapon_assaultsmg'] = 'smg',
    ['weapon_minismg']    = 'smg',
}
```

Restart the resource afterwards — categories are cached for the lifetime of the resource, so a config
reload alone will not shift them.

**A weapon does not appear in the list beside the bag at all.** Only items named `weapon_*` are
offered, plus anything recognised as ammunition (a name starting `ammo-` or `ammo_`, ending `-ammo`
or `_ammo`, or exactly `ammo`). An addon weapon named anything else is invisible to the bag. Add it
to `Config.CategoryOverrides` — that lookup runs before the `weapon_` check, so a name of any shape
works there.

## Bags went missing

**Every bag disappeared after the update.** The resource renames `bupa_weaponbags` to
`debux_weaponbags` on first start, but it skips the rename if an empty `debux_weaponbags` already
exists. Check both:

```sql
SELECT COUNT(*) FROM `bupa_weaponbags`;
SELECT COUNT(*) FROM `debux_weaponbags`;
```

If the old one has the rows and the new one is empty, drop the empty table and restart the resource —
it renames the old one for you:

```sql
DROP TABLE `debux_weaponbags`;
```

**A bag disappeared on its own, with weapons in it.** `Config.Bag.Despawn` is above `0`. When it
fires, the row and everything in it is deleted, with no notification and no webhook entry. Set it
back to `0`:

```lua
Config.Bag.Despawn = 0
```

There is no undo. The row is gone.

**A player says their bag vanished after a restart.** Bags survive restarts, so check the table
before believing it:

```sql
SELECT `id`, `owner`, `owner_name`, `coords`, `contents`
FROM `debux_weaponbags`
WHERE `owner` = 'CITIZENID';
```

If the row is there, the bag exists and something else is stopping it appearing — usually a missing
model or a missing target. If the row is not there, the bag was picked up, despawned, or deleted.

**Bags are orphaned on standalone.** With no framework, ownership is the player's `license:`
identifier. If a player's identifier changes — a new Rockstar account, or a change in your identifier
priority — their old bags belong to a licence they no longer have. Reassign them:

```sql
UPDATE `debux_weaponbags` SET `owner` = 'license:NEW' WHERE `owner` = 'license:OLD';
```

Restart the resource afterwards.

## Database

**The table is never created.** Look for this on start:

```
[debux-weaponbag] sql/debux_weaponbag.sql is missing, the resource cannot create its tables.
```

The SQL filename is derived from the resource name — `debux-weaponbag` becomes
`sql/debux_weaponbag.sql`. If you renamed the folder, the file cannot be found. Rename it back to
**`debux-weaponbag`**.

If instead you see a statement failing, your MySQL user cannot run `CREATE TABLE`. Import
`sql/debux_weaponbag.sql` by hand, or grant the permission.

**"Database error" when placing or picking up.** The insert or the delete failed. The resource
reverses itself in both cases — a failed place returns the item with its contents, a failed pickup
puts the bag back on the ground — so nothing is lost, but the underlying oxmysql error is in the
server console and needs reading.

## Interface

**Weapon pictures are blank.** They come from your inventory's image folder, not from this resource.
Two causes.

The folder is not where the script expects, usually because of a renamed fork. Point it at the right
place:

```lua
Config.UI.ImagePath = 'nui://my-inventory/html/images/'
```

Or the filename case does not match. Weapon images are requested with the item name in **upper**
case — `WEAPON_PISTOL.png` — which is what ox_inventory ships. Inventories that store them lowercase
will serve them anyway on Windows, but not on Linux, where the lookup is case-sensitive. Either
rename the files in your inventory's image folder, or add uppercase copies alongside them.

The bag item's own picture is separate — that is `install/img/weaponbag.png`, copied into the same
folder, and it is not affected by any of this.

**Pockets are labelled `slot_primary_1` or `cat_smg`.** A missing locale key. Every pocket needs a
`slot_<id>` line and every category a `cat_<name>` line, in each language file under `locales/` that
you actually use. Missing keys fall back to English, so adding the line to `locales/en.json` is
enough to stop the raw key showing.

**The language did not change.** It is not in `config.lua`. It comes from the ox_lib convar in
`server.cfg`:

```cfg
setr ox:locale "tr"
```

The startup banner prints which locale is in use.

**The accent colour did not change.** `Config.UI.Accent` must be a six-digit hex colour with the `#`,
like `'#A855F7'`. A three-digit shorthand is passed through unparsed and the hover and pressed shades
— which are derived from it automatically — will not be generated.

**`Config.UI.Watermark` does nothing.** It is sent to the interface but the shipped build does not
read it. There is nothing to fix; changing it has no effect either way.

**The mouse cursor is stuck after an error.** Restart the resource. The interface releases focus on
every exit path, so if this happens repeatedly something threw before that — open the NUI dev tools
(F8 → `nui_devtools`) and read the console. A JavaScript error there is almost always a locale key or
a missing field in a custom edit.

**"Finish what you were doing first."** One action per player at a time. If it persists, the player
has a request that never returned — usually the tail end of a database or inventory error. Have them
rejoin.

## Getting help

Open a ticket in the [Discord](https://discord.gg/DrTFQj5hcZ) with the resource version, the
framework and inventory from the startup banner, the **full** console error and what you changed in
`config.lua`. Turning `Config.Debug` on and reproducing the problem once will usually contain the
answer.
