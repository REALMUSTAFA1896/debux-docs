# Debux Weapon Bag

A weapon bag is an ordinary inventory item. Using it puts a physical bag down in the world, aimed and
rotated by the player. The bag has shaped pockets — two full-length rifle pockets, an SMG
compartment, three pistol pockets, a blade pocket and three small pockets for ammunition, grenades
and attachments. Weapons are dragged from the player's inventory into a pocket. Picking the bag back
up returns the item with everything still inside it.

Works on **Qbox, QBCore, ESX and standalone**. The framework, the inventory and the targeting
resource are all detected when the resource starts.

## What a player does

**Places it.** Using the item starts an aiming mode. A translucent copy of the bag follows the
player: the mouse wheel turns it, the up and down arrows raise and lower it, the left and right
arrows push it further away or pull it closer, `SHIFT` makes every one of those steps finer, `G`
resets them, `E` puts the bag down and `X` cancels. The preview fades where the bag cannot be
dropped. The player crouches to set it down.

**Opens it.** Targeting the bag gives two options — open it or pick it up. Opening shows a picture of
the bag with the pockets drawn over it, and a list of everything on the player that fits.

**Fills it.** Weapons are dragged from the list into a pocket. A pocket lights up green if the weapon
fits and stays dark if it does not — a rifle will not go into a pistol pocket. Ammunition and
throwables are stackable, so those prompt for a quantity with a slider and an **All** button.
Clicking a filled pocket takes the weapon back out.

**Picks it up.** The bag goes back into the inventory as an item, with its contents stored on the
item. Its description shows how full it is, for example `4 / 10 · 12.4 kg`.

**Loses it, sometimes.** A bag left in the world belongs to whoever placed it, and it survives a
server restart. Police (or whichever jobs you list) can open any bag they find, which is the point of
the resource — anything a player leaves lying around is searchable.

## What it needs

| Dependency | Required |
| --- | --- |
| [ox_lib](https://github.com/overextended/ox_lib) | Yes — callbacks, notifications, text UI, locales |
| [oxmysql](https://github.com/overextended/oxmysql) | Yes — placed bags are stored in MySQL |
| ox_target, qb-target or qtarget | Yes — there is no `[E]` fallback |

::: warning A targeting resource is not optional
A placed bag is only interactive through the target. If none of `ox_target`, `qb-target` or `qtarget`
is running, the bag object still spawns and the player can walk around it, but there is no way to
open it or pick it up. It is not lost — it stays in the database — but nobody can reach it until a
target resource is started.
:::

MySQL or MariaDB. One table, `debux_weaponbags`, is created on first start. The SQL file ships with
the resource if you would rather import it yourself.

## Framework support

| Framework | Detected by | Used for |
| --- | --- | --- |
| Qbox | `qbx_core` | Citizen id, job and grade, usable item registration |
| QBCore | `qb-core` | Same |
| ESX | `es_extended` | Identifier, job and grade, usable item registration |
| Standalone | Nothing else running | Ownership falls back to the player's `license:` identifier |

Detection runs in that order. On standalone there is no job, so `Config.Permissions.InspectJobs` can
never match and the ace permission is the only way to give staff access to other people's bags.

## Inventory support

| Inventory | Detected as | Item metadata |
| --- | --- | --- |
| ox_inventory | `ox_inventory` | Yes |
| qs-inventory | `qs-inventory` | Yes |
| codem-inventory | `codem-inventory` | Yes |
| tgiann-inventory | `tgiann-inventory` | Yes |
| qb-inventory, lj-inventory, ps-inventory | `qb-inventory` | Yes |
| Classic ESX inventories | `esx` | No |

::: danger A loaded bag cannot be picked up without metadata
The contents of a picked-up bag are stored on the item itself. On a classic ESX inventory, or with
`Config.KeepWeaponMetadata = false`, there is nowhere to put them — so picking up a bag that has
anything in it is refused with *"Empty the bag before picking it up"*. The bag and its contents are
never destroyed by this, but the player has to take every weapon out by hand before the bag can be
carried again.
:::

## Interface

React and Vite. The compiled bundle in `ui/build` ships with the resource, so **you do not need Node
to run it** — only to change it.

Fonts and sounds are bundled, nothing is fetched at runtime, and the interface looks the same on a
server with no outbound internet. Weapon pictures are the exception: they are pulled from your own
inventory's image folder so they match what players already recognise.

## Upgrading from the previous release

This resource was previously published under a different name. Two things moved:

- the ace permission is now `debux.weaponbag`, renamed from `bupa.weaponbag`
- the table is now `debux_weaponbags`, renamed from `bupa_weaponbags`

Existing bags are in the old table and will not be found until you deal with it. See
[Installation](./installation#upgrading-from-the-previous-release) for the two ways to do that.
