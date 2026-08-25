# Configuration

Everything lives in `config.lua`. `config.server.lua` holds anything secret — it is loaded only on
the server, so nothing in it ever reaches a player.

## General

```lua
Config.Framework = 'auto'
Config.Locale    = 'en'
Config.Currency  = '$'
Config.UseTarget = true
```

| Setting | Default | What it changes |
| --- | --- | --- |
| `Framework` | `'auto'` | Detects qbx_core → qb-core → es_extended, then standalone. Force it with `'qbx'`, `'qb'`, `'esx'` or `'standalone'` if detection picks wrong. |
| `Locale` | `'en'` | Drives both the notifications and the interface. |
| `Currency` | `'$'` | Prefix only. Amounts are always integers. |
| `UseTarget` | `true` | Uses ox_target or qb-target if either is running. `false` forces the `[E]` prompt everywhere. |

## Blips

```lua
Config.Blips = {
    enabled    = true,
    sprite     = 108,
    colour     = 2,
    scale      = 0.75,
    display    = 4,
    shortRange = true,
    label      = 'Debux Bank',
}
```

`enabled = false` hides every bank blip at once. To hide one branch only, set `blip = false` on that
entry in `Config.Banks`.

## Bank locations

```lua
{
    label = 'Fleeca · Legion Square',
    coords = vector4(149.46, -1042.09, 29.37, 335.43),
    ped = 'ig_barry',
    createAccounts = false,
    blip = true,
},
```

| Key | What it does |
| --- | --- |
| `coords` | `vector4` — the fourth value is the teller's heading |
| `ped` | Model name, or `false` for no teller |
| `createAccounts` | Whether savings and society accounts can be opened here |
| `blip` | `false` hides only this branch's blip |

## ATMs

```lua
Config.Atm = {
    enabled = true,
    models = { `prop_atm_01`, `prop_atm_02`, `prop_atm_03`, `prop_fleeca_atm` },
    actions = { withdraw = true, deposit = true, transfer = true, resetPin = true },
    blips = { enabled = false, sprite = 500, colour = 2, scale = 0.5, shortRange = true, label = 'ATM' },
}
```

Turning an action off removes its button from the ATM menu. ATM blips are off by default — there are
hundreds of ATMs in the map and they bury everything else.

## Animation

```lua
Config.Animation = {
    enabled        = true,
    cardProp       = true,
    scenario       = 'PROP_HUMAN_ATM',
    openDuration   = { 2200, 3200 },
    cashOnWithdraw = true,
}
```

`cardProp` attaches a card to the player's hand before the terminal animation. `openDuration` is a
random range in milliseconds. Animations are skipped automatically if the player is in a vehicle.

## Accounts

```lua
Config.Accounts = {
    startingBalance = 5000,
    savingsAPR      = 3.2,
    savingsPayout   = 60 * 24,
    allowSavings    = true,
    savingsFee      = 1000,
}
```

`savingsPayout` is in minutes. Interest is `savingsAPR` split across the number of payouts in a year,
so the annual rate holds however often you pay it out.

## Transfers

```lua
Config.Transfer = {
    fee            = 0,
    dailyLimit     = 25000,
    requirePin     = true,
    pinAboveAmount = 500,
    nearbyRadius   = 30.0,
    minAmount      = 1,
}
```

`dailyLimit` is enforced from the database, not from memory, so restarting the server does not reset
it. `pinAboveAmount` is the threshold above which a PIN is demanded — set it to `0` to always ask.

## Cards

```lua
Config.Cards = {
    maxAttempts     = 3,
    defaultPin      = '0000',
    pinOnOpen       = true,
    pinGraceMinutes = 0,
    tiers = {
        standard = { label = 'Standard', fee = 250,  atmDaily = 2500,  minCredit = 0   },
        platinum = { label = 'Platinum', fee = 500,  atmDaily = 5000,  minCredit = 600 },
        black    = { label = 'Black',    fee = 5000, atmDaily = 0,     minCredit = 780 },
    },
    orderReadyMinutes = 30,
}
```

::: danger maxAttempts locks the card
After `maxAttempts` wrong PINs the card is locked and the player cannot pay, withdraw or transfer
until an admin unlocks it. That is the intended pressure, but set it to `0` to disable locking if
your server does not want it.
:::

`atmDaily = 0` means uncapped. A player must reach `minCredit` before they can order that tier.

## Bills

```lua
Config.Bills = {
    dueDays       = 7,
    autoCollect   = true,
    creditPenalty = 25,
    maxAmount     = 250000,
    issuers = {
        mechanic   = 'Mechanic',
        ambulance  = 'EMS',
        police     = 'Police',
        lawyer     = 'Lawyer',
        realestate = 'Real Estate',
        taxi       = 'Taxi',
    },
}
```

`issuers` maps a **job name** to the label shown on the invoice. A player must hold one of these jobs
**and be on duty** to bill anyone. Add your own jobs here — the key must match the job name exactly.

With `autoCollect = true` an overdue bill is taken from the account automatically and the debtor
loses `creditPenalty` points. If they cannot pay, the bill is retried the next day and the penalty
applies once per day, not once per check.

## Loans

```lua
Config.Loans = {
    enabled         = true,
    requireApproval = true,
    approverJob     = 'banker',
    maxActive       = 1,
    instalmentDays  = 8,
    latePenalty     = 60,
    onTimeReward    = 15,
    terms           = { 12, 24, 36 },
    tiers = {
        { key = 'micro',    label = 'Micro loan',    ceiling = 10000,  apr = 9.0, minCredit = 400 },
        { key = 'standard', label = 'Standard loan', ceiling = 50000,  apr = 6.5, minCredit = 600 },
        { key = 'premium',  label = 'Premium loan',  ceiling = 150000, apr = 4.2, minCredit = 780 },
    },
}
```

::: warning requireApproval needs a menu
With `requireApproval = true` a loan stays `pending` until someone with `approverJob` acts on it, and
a pending loan counts toward `maxActive`. If you have not wired an approval menu, the player is stuck
after their first request. Either call the approval exports from your own job menu — see
[Exports](./exports) — or set `requireApproval = false`.
:::

## Credit score

```lua
Config.Credit = {
    enabled = true,
    start   = 600,
    min     = 300,
    max     = 850,
    bands = {
        { at = 780, label = 'Excellent' },
        { at = 700, label = 'Good' },
        { at = 600, label = 'Fair' },
        { at = 0,   label = 'Poor' },
    },
}
```

The score is what gates loan tiers and card tiers. It moves on: instalment paid on time
`+onTimeReward`, instalment missed `−latePenalty`, bill overdue `−creditPenalty`, loan settled early
`+onTimeReward × 3`.

## Society accounts

```lua
Config.Society = {
    enabled = true,
    roles = {
        boss    = { label = 'Boss',    dailyLimit = 0,     deposit = true, withdraw = true,  invoice = true,  manage = true  },
        manager = { label = 'Manager', dailyLimit = 25000, deposit = true, withdraw = true,  invoice = true,  manage = false },
        member  = { label = 'Member',  dailyLimit = 5000,  deposit = true, withdraw = false, invoice = true,  manage = false },
        trainee = { label = 'Trainee', dailyLimit = 500,   deposit = true, withdraw = false, invoice = false, manage = false },
    },
}
```

Roles are derived from the player's job grade: boss flag → `boss`, grade ≥ 3 → `manager`, grade 0 →
`trainee`, everything else → `member`.

`dailyLimit = 0` means uncapped. Limits are tracked per member per day in the database.

## Logging

`config.server.lua`, not `config.lua`:

```lua
Config.Logs = {
    enabled = false,
    webhooks = {
        transfer = '', atm = '', loan = '', bill = '', society = '', card = '',
    },
}
```

::: danger Never move this into config.lua
`config.lua` is a shared script — every value in it is sent to every player. A webhook URL there can
be read out of any client and used to spam or scrape your Discord. That is why it lives in a
server-only file.
:::
