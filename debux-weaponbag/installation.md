# Installation

## 1. Drop it in

Put the `debux-weaponbag` folder in your resources directory. We recommend a `[debux]` folder so
every DebuX resource starts together:

```
resources/
└── [debux]/
    └── debux-weaponbag/
```

::: danger Do not rename the folder
`server/database.lua` builds the path to its SQL file from the resource name — `debux-weaponbag`
becomes `sql/debux_weaponbag.sql`. Rename the folder to anything else and that file is not found, so
the table is never created and the resource starts with a console line saying the SQL file is
missing. Keep the folder named **`debux-weaponbag`**.
:::

## 2. Database

The table is created automatically the first time the resource starts. If your MySQL user cannot run
`CREATE TABLE`, import `sql/debux_weaponbag.sql` by hand instead:

```sql
CREATE TABLE IF NOT EXISTS `debux_weaponbags` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `owner` VARCHAR(64) NOT NULL,
    `owner_name` VARCHAR(64) DEFAULT NULL,
    `coords` TEXT NOT NULL,
    `heading` FLOAT NOT NULL DEFAULT 0,
    `contents` LONGTEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_debux_weaponbags_owner` (`owner`)
);
```

One table. Nothing else in your database is touched.

If you set `Config.Table` to something other than `debux_weaponbags`, the importer rewrites both the
table name and the index name before running the statement, so automatic creation still works under
your own name.

## 3. The bag item

Copy the entry for your inventory out of `install/inv/`. The item is named `weaponbag` by default —
if you change it, change `Config.Bag.Item` to match.

### ox_inventory

Add this to `ox_inventory/data/items.lua`:

```lua
['weaponbag'] = {
    label = 'Weapon Bag',
    weight = 2500,
    stack = false,
    close = true,
    consume = 0,
    description = 'A tactical bag that carries weapons in shaped pockets.',
    client = {
        image = 'weaponbag.png',
    },
    server = {
        export = 'debux-weaponbag.useBag',
    },
},
```

Two lines carry weight here.

`server.export = 'debux-weaponbag.useBag'` is the hook. ox_inventory has no `CreateUseableItem`, so
this export is the only way the resource learns the item was used. Without it, using the bag does
nothing at all.

::: danger consume = 0 is not optional
Without `consume = 0`, ox_inventory removes the item the moment it is used. The bag would disappear
from the inventory even if the player then cancels the placement with `X`. The resource removes the
item itself, and only once the bag has actually been put down.
:::

### qb-inventory, lj-inventory, ps-inventory

Add this to `qb-core/shared/items.lua`:

```lua
['weaponbag'] = {
    ['name']        = 'weaponbag',
    ['label']       = 'Weapon Bag',
    ['weight']      = 2500,
    ['type']        = 'item',
    ['image']       = 'weaponbag.png',
    ['unique']      = true,
    ['useable']     = true,
    ['shouldClose'] = true,
    ['combinable']  = nil,
    ['description'] = 'A tactical bag that carries weapons in shaped pockets.'
},
```

`useable = true` is the part that matters. The resource registers the handler itself through
qb-core, so there is nothing else to wire up. The same block works for qs-inventory (in
`qs-inventory/shared/items.lua`), codem-inventory and tgiann-inventory.

### Classic ESX inventories

Run this once against your database:

```sql
INSERT INTO `items` (`name`, `label`, `weight`, `rare`, `can_remove`)
VALUES ('weaponbag', 'Weapon Bag', 3, 0, 1);
```

Older ESX schemas have fewer columns. If that errors, use:

```sql
INSERT INTO `items` (`name`, `label`) VALUES ('weaponbag', 'Weapon Bag');
```

The resource registers the item through `ESX.RegisterUsableItem` on its own.

::: warning Classic ESX loses ammunition and attachments
Classic ESX inventories have no item metadata. A weapon keeps its name through the bag, but ammo
counts, attachments, serial numbers and durability do not survive. A bag with anything in it also
cannot be picked up at all — see [Troubleshooting](./troubleshooting#contents).
:::

## 4. The item picture

Copy `install/img/weaponbag.png` into your inventory's image folder:

| Inventory | Folder |
| --- | --- |
| ox_inventory | `ox_inventory/web/images/` |
| qb-inventory | `qb-inventory/html/images/` |
| qs-inventory | `qs-inventory/html/images/` |
| codem-inventory | `codem-inventory/html/itemimages/` |
| tgiann-inventory | `tgiann-inventory/html/itemimages/` |
| esx_inventoryhud | `esx_inventoryhud/html/img/` |

The weapon pictures shown inside the bag come from the same folder, so there is nothing extra to
generate. If you run a renamed fork and they come up blank, point the script at the right folder:

```lua
Config.UI.ImagePath = 'nui://my-inventory/html/images/'
```

## 5. server.cfg

Start `debux-weaponbag` **after** ox_lib, oxmysql, your inventory and your target resource:

```cfg
ensure ox_lib
ensure oxmysql
ensure ox_inventory
ensure ox_target

ensure [debux]
```

Detection reads the state of those resources when `debux-weaponbag` starts. If it starts first, it
finds nothing running and falls back to standalone with no inventory and no target.

## 6. Set your language

The language comes from the ox_lib locale convar, not from `config.lua`:

```cfg
setr ox:locale "tr"
```

Ships with ten: `en, tr, de, fr, es, it, pt, pl, ru, nl`, under `locales/`. One file per language
covering both the notifications and the interface. Missing keys fall back to English.

## 7. Ace permission (optional)

Staff access is off by default. To let a group open and pick up any bag regardless of who placed it,
grant the ace and switch it on:

```cfg
add_ace group.admin debux.weaponbag allow
```

```lua
Config.Permissions.UseAce = true
Config.Permissions.Ace    = 'debux.weaponbag'
```

::: warning Renamed from bupa.weaponbag
If you are upgrading, your `server.cfg` almost certainly still grants `bupa.weaponbag`. That ace no
longer does anything. Change the line to `debux.weaponbag`, or set `Config.Permissions.Ace` back to
`'bupa.weaponbag'` if you would rather not touch every server that has it.
:::

The ace carries the same rights as a job on `Config.Permissions.InspectJobs` — it opens any bag, and
it also allows picking any bag up.

## 8. First-run check

Start the server. The console should show, in roughly this order:

```
[debux-weaponbag] Database ready - created debux_weaponbags
[debux-weaponbag] bag model: prop_big_bag_01
```

```
══════════════════════════════════════════════════════════════════
│ DEBUX WEAPONBAG  v1.0.0
│ Framework qbox  │  Inventory ox_inventory  │  Language en
│
│ Up to date
══════════════════════════════════════════════════════════════════
```

The `Database ready` line only appears the first time, when the table did not already exist. The
`bag model:` line is printed by the client, so look for it in F8 rather than the server console.

Check the framework and inventory on that banner match what you actually run. If either says
something you did not expect, set `Config.Inventory` by hand — see
[Configuration](./configuration#inventory-and-target).

| Check | Expected |
| --- | --- |
| Use the item in your inventory | The aiming preview appears in front of the player |
| Press `E` | The player crouches, the bag lands, *"Bag placed"* |
| Target the bag | Two options: open it, pick it up |
| `SELECT * FROM debux_weaponbags` | One row per placed bag |
| Restart the server | Placed bags are still there |


## Upgrading from the previous release

The resource used to ship under a different name, and the table came with it. Existing bags are in
`bupa_weaponbags` and the new build reads `debux_weaponbags`, so on first start it creates an empty
table and every placed bag looks lost.

Pick one. Rename the table:

```sql
RENAME TABLE `bupa_weaponbags` TO `debux_weaponbags`;
```

Or point the resource back at the old name in `config.lua`:

```lua
Config.Table = 'bupa_weaponbags'
```

Both work. The rename is tidier; keeping the old name is safer if anything else in your database
references it.

::: warning Do not do both, and do not leave both tables
If you rename the table **and** the new build has already created an empty `debux_weaponbags`, the
rename fails because the target already exists. Drop the empty one first, after checking it really is
empty:

```sql
SELECT COUNT(*) FROM `debux_weaponbags`;
DROP TABLE `debux_weaponbags`;
RENAME TABLE `bupa_weaponbags` TO `debux_weaponbags`;
```
:::

Also update the ace permission — see [step 7](#_7-ace-permission-optional). The exports kept their
names (`useBag`, `GetBag`); only the resource prefix changed, so anything calling
`exports['bupa-weaponbag']:GetBag(id)` becomes `exports['debux-weaponbag']:GetBag(id)`. Your
ox_inventory item entry needs the same change: `server.export` is now `debux-weaponbag.useBag`.
