# Exports & events

Both exports are **server-side**. There are no client exports.

## Exports

```lua
exports['debux-weaponbag']:useBag(event, item, inventory, slot)
exports['debux-weaponbag']:GetBag(bagId)
```

Both kept the names they had in the previous release. Only the resource prefix changed, so
`exports['bupa-weaponbag']:GetBag(id)` becomes `exports['debux-weaponbag']:GetBag(id)`.

### useBag

This is the ox_inventory item hook, not something you call yourself. It goes in your item definition:

```lua
['weaponbag'] = {
    label = 'Weapon Bag',
    consume = 0,
    server = {
        export = 'debux-weaponbag.useBag',
    },
},
```

ox_inventory has no `CreateUseableItem`, so this export is the only way the resource learns the bag
was used. On Qbox, QBCore and ESX the resource registers the item through the framework on start and
this export is not involved.

It ignores any `event` other than `usingItem`, reads the player from `inventory` and the item stack
from `inventory.items[slot]`, remembers the bag's contents, and triggers the placement mode on that
player's client. It returns nothing.

> **Note — consume = 0 or the bag disappears**
>
> Without it, ox_inventory removes the item the moment it is used — before the player has placed
> anything. The resource removes the item itself, and only once the bag is actually on the ground.

### GetBag

```lua
local bag = exports['debux-weaponbag']:GetBag(4)
```

Returns a description of a placed bag by its database id, or `nil` if there is no such bag on the
ground. The shape is exactly what the interface receives:

```lua
{
    id        = 4,
    owner     = 'Mustafa K',      -- the name of whoever placed it
    weight    = 12.4,
    maxWeight = 30.0,
    count     = 4,
    maxItems  = 10,
    slots = {
        {
            id      = 'primary_1',
            accepts = { 'primary' },
            ui      = { x = 14.0, y = 8.0, w = 16.7, h = 77.0, rotate = -90, scale = 0.92 },
            stack   = 1,
            item    = {                     -- absent when the pocket is empty
                name     = 'weapon_carbinerifle',
                label    = 'Carbine Rifle',
                weight   = 3.1,
                count    = 1,
                category = 'primary',
                image    = 'nui://ox_inventory/web/images/WEAPON_CARBINERIFLE.png',
            },
        },
        -- one entry per pocket in Config.Slots, in config order
    },
}
```

Every pocket is listed whether or not it holds anything, so `#bag.slots` is the pocket count, not the
item count. Use `bag.count` for that. Item metadata — ammo, attachments, serial — is deliberately not
included.

This is a snapshot of the in-memory state. It is read-only: changing the table you get back does not
change the bag.

## Callbacks

The client talks to the server over ox_lib callbacks. They are registered on the server, so another
resource can call them, but every one of them re-checks ownership, distance and capacity server-side
and will refuse anything it does not like.

| Callback | Argument | Returns |
| --- | --- | --- |
| `debux-weaponbag:place` | `{ coords, heading, slot }` | `ok, error, bagId` |
| `debux-weaponbag:pickup` | `bagId` | `ok, error` |
| `debux-weaponbag:open` | `bagId` | `data, error` |
| `debux-weaponbag:store` | `{ bagId, slotId, name, slot, count }` | `ok, error, bag` |
| `debux-weaponbag:take` | `{ bagId, slotId, count }` | `ok, error, bag` |

`open` returns `{ bag, carried, canTake, isRaid }` — `bag` in the same shape as `GetBag`, `carried`
being everything on the player that fits any category, `canTake` false for an inspector when
`Config.Permissions.InspectCanTake` is off, and `isRaid` true when the opener is an inspector rather
than the owner.

`store` and `take` return the updated bag as their third value, so you do not need a second `open`
call to see the result.

Only one of these runs per player at a time. A second call while the first is still going is refused
with `busy`.

### Error codes

The second return value is a code, not a sentence. The player sees the matching `err_<code>` line
from the locale files.

| Code | Meaning |
| --- | --- |
| `busy` | Another action for this player is still running |
| `no_bag` | No bag with that id, or it is being picked up right now |
| `too_far` | Beyond `InteractDistance + DistanceTolerance`, or the placement was beyond `MaxPlaceDistance` |
| `not_yours` | Not the owner, not public, not an inspector |
| `not_loaded` | The player has no citizen id yet |
| `no_item` | The player is not carrying the bag, or not carrying the weapon they asked to store |
| `invalid`, `invalid_slot` | Malformed request, or a pocket id that is not in `Config.Slots` |
| `slot_taken`, `slot_empty` | The pocket is already full, or already empty |
| `wrong_pocket` | The weapon's category is not in that pocket's `accepts` |
| `bag_full` | `Config.Capacity.MaxItems` reached |
| `too_heavy` | `Config.Capacity.MaxWeight` would be exceeded |
| `inventory_full` | The player cannot carry the bag or the weapon |
| `transfer_failed` | The inventory refused to remove the weapon |
| `empty_it_first` | A loaded bag on an inventory with no metadata support |
| `no_permission` | An inspector with `InspectCanTake = false` |
| `db_error` | The insert or delete failed; the item is returned to the player |

## Events

```lua
TriggerClientEvent('debux-weaponbag:client:use', src, { slot = slotNumber })
```

Server to client. Starts the placement mode. This is what the item handler fires, and firing it
yourself is how you would start a placement from your own script — but note that the server only
knows which bag's contents to restore from the item use that preceded it, so a bag placed this way
comes out empty unless the player really did have a loaded bag in that slot.

```lua
TriggerServerEvent('debux-weaponbag:server:close', bagId)
```

Client to server. Clears the `open` marker on a bag in the state bag. It is registered, but the
shipped interface never fires it, so `open` stays set on a bag once someone has opened it until that
player disconnects. Nothing reads the flag, so this has no visible effect.

## NUI callbacks

Internal to the interface. Listed so a custom build knows what to send.

| Callback | Payload |
| --- | --- |
| `close` | none |
| `store` | `{ slotId, name, slot, count }` |
| `take` | `{ slotId, count }` |

## State bag

Every placed bag is published on the **global** state bag, replicated to all clients:

```lua
GlobalState.debuxWeaponBags
```

```lua
{
    {
        id      = 4,
        coords  = vec3(215.3, -810.1, 30.7),
        heading = 132.0,
        items   = { primary_1 = 'weapon_carbinerifle', ammo_1 = 'ammo-rifle' },
        open    = false,          -- or the server id of whoever opened it
    },
}
```

This is how clients know which bags to spawn. It is rewritten on every place, pickup, take, store and
despawn, so a handler on it fires often:

```lua
AddStateBagChangeHandler('debuxWeaponBags', 'global', function(_, _, value)
    -- value is the full list, not a delta
end)
```

The list carries item **names** only — no counts, no weights, no metadata. Use `GetBag` on the server
if you need the detail.

> **Note — It is readable by every client**
>
> Anything on a global state bag is replicated to every connected player, so the position and rough
> contents of every placed bag are on every client. Do not build a hiding-place script on the
> assumption that a bag's location is secret.

## Ace permission

```cfg
add_ace group.admin debux.weaponbag allow
```

```lua
Config.Permissions.UseAce = true
Config.Permissions.Ace    = 'debux.weaponbag'
```

Renamed from `bupa.weaponbag`. The old ace does nothing on this build — either update your
`server.cfg`, or set `Config.Permissions.Ace = 'bupa.weaponbag'` to keep it.

The check is off until `UseAce = true`, which catches people out. Granting the ace on its own changes
nothing.

Holding it gives a player the same rights as a job on `Config.Permissions.InspectJobs`:

- open any bag, whoever placed it
- take from and store into it, unless `InspectCanTake` is `false`
- pick any bag up

It works on standalone, where jobs do not exist, so it is the only way to give staff access there.

Opening someone else's bag with the ace is logged as a `Raid` rather than an `Open`, so it appears in
Discord even when `Config.Webhook.Log.Open` is off.

## Commands

The resource registers no commands. A bag is placed by using the item and opened through the target.

## What is deliberately not exported

**Placing or filling a bag from another script.** Both go through checks that need a real player at a
real position: distance, ownership, capacity, and an actual removal from that player's inventory. An
export that skipped them would be a way to create weapons out of nothing.

**Writing to a bag's contents.** `GetBag` hands back a copy. Nothing accepts one back, because the
database row and the in-memory bag would have to agree and there is no path that guarantees it.
