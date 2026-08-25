# Installation

## 1. Drop it in

Put the `debux_bank` folder in your resources directory. We recommend a `[debux]` folder so every
DebuX resource starts together:

```
resources/
└── [debux]/
    └── debux_bank/
```

## 2. Database

The tables are created automatically the first time the resource starts. If your MySQL user cannot
run `CREATE TABLE`, import `sql/debux_bank.sql` by hand instead.

Seven tables are created, all prefixed `debux_`:

`debux_accounts` · `debux_members` · `debux_transactions` · `debux_cards` · `debux_bills` ·
`debux_loans` · `debux_credit`

Nothing else in your database is touched.

## 3. server.cfg

```cfg
ensure ox_lib
ensure oxmysql

ensure [debux]
```

If you are replacing another banking resource, stop it in the same block so load order is
unambiguous:

```cfg
stop Renewed-Banking
ensure [debux]
```

## 4. Set your language

Open `config.lua`:

```lua
Config.Locale = 'tr'
```

Ships with ten: `en, tr, de, fr, es, it, pt, pl, ru, nl`. One file per language under `locales/`
covering both the notifications and the interface — there is no second place to keep in sync.

## 5. Start the server

You should see this in the console:

```
══════════════════════════════════════════════════════════════════
│ DEBUX BANK  v1.0.0
│
│ Up to date
══════════════════════════════════════════════════════════════════
```

Walk to a bank or an ATM and press `[E]` — or use the target if you have one installed.

---

## Verifying it worked

| Check | Expected |
| --- | --- |
| `/bank` at a branch | Panel opens after the card animation |
| Any ATM | 420px panel with four actions |
| `SELECT * FROM debux_accounts` | One row per player who has opened the bank |
| Console on start | Version banner, no errors |

## Setting a PIN salt

Card PINs are hashed with a server-side salt. Set your own so two servers never produce the same
hash:

```cfg
set debux_bank_salt "something-long-and-random"
```

Do this **before** players create PINs. Changing it later invalidates every existing PIN and every
card falls back to the default.

## Modifying the interface

Only needed if you want to change the design.

```bash
cd debux_bank/web
npm install
npm run dev     # browser preview with mock data
npm run build   # writes web/dist, which is what the server loads
```

Design tokens — every colour, radius and font size — live in `web/src/styles/tokens.css`.
