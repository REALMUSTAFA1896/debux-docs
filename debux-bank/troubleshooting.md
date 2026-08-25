# Troubleshooting

## The panel does not open

**Nothing happens at a branch.** The server checks the player is within 6 metres of a
`Config.Banks` entry. If you moved a bank, move its `coords` too — the blip and the check read the
same value, but a target zone you added by hand does not.

**`not_at_bank` in chat.** Same cause. Confirm with `/bank` standing on the blip.

**The animation plays but the panel never appears.** Look at the server console. If you see an
oxmysql error, the tables were not created — check that your MySQL user has `CREATE TABLE`, or import
`sql/debux_bank.sql` manually.

**Mouse cursor stuck after an error.** Restart the resource. If it happens repeatedly, send us the
console error — the interface releases focus on every exit path, so a stuck cursor means something
threw before that.

## PIN problems

**"Card locked" and the player cannot do anything.** Three wrong PINs. Unlock it:

```sql
UPDATE debux_cards SET locked = 0, attempts = 0 WHERE owner = 'CITIZENID';
```

**Everyone's PIN stopped working at once.** You changed `debux_bank_salt` after players had set
PINs. Either put the old salt back, or reset every PIN to the default:

```sql
UPDATE debux_cards SET pin = NULL, attempts = 0, locked = 0;
```

A card with a `NULL` pin falls back to `Config.Cards.defaultPin` and the player is asked to create a
new one.

**A player says they were never asked for a PIN.** `Config.Cards.pinOnOpen` is `false`, or
`pinGraceMinutes` is high enough that they were still inside the grace window.

## Money problems

**A balance looks wrong.** Read the ledger before assuming a bug — every change writes a row:

```sql
SELECT * FROM debux_transactions WHERE account_id = ? ORDER BY id DESC LIMIT 50;
```

`balance_after` is recorded on every row, so you can see exactly which transaction moved it.

**Another resource's balance disagrees.** Debux Bank mirrors the personal account into your
framework's `bank` account on every change. If a third-party script writes to that framework account
directly, the two drift. Point that script at the exports on the [Exports](./exports) page instead.

**A player claims money vanished.** Every failure path reverses itself: a withdrawal that cannot hand
over cash credits the account back, a transfer to a missing account refunds the sender, a society
withdrawal that cannot pay out is reversed. If you have a case where money genuinely disappeared,
send us the two transaction rows either side of it.

## Bills

**A job cannot bill anyone.** All three must be true: the job name is a key in
`Config.Bills.issuers`, the player is **on duty**, and the customer is a different player. The key
must match the job name exactly — `mechanic`, not `Mechanic`.

**Bills are never collected.** `Config.Bills.autoCollect` is `false`, or the debtor has no funds. A
failed collection retries the next day rather than every five minutes.

## Loans

**A loan is stuck on "pending" forever.** `Config.Loans.requireApproval` is `true` and nothing calls
the approval export. Either wire `ApproveLoan` into your banker menu — see [Exports](./exports) — or
set `requireApproval = false`.

**A player cannot request a loan.** A `pending` loan counts toward `Config.Loans.maxActive`, so an
un-approved request blocks the next one. Same fix.

**"Credit too low."** The tier's `minCredit` is above their score. Check it:

```sql
SELECT score FROM debux_credit WHERE cid = 'CITIZENID';
```

## Society accounts

**A member can drain the account.** They should not be able to — withdrawal is gated on the role's
`withdraw` flag and its daily limit, on the society screen and on the ordinary withdraw path. If you
can reproduce a bypass, tell us immediately.

**Roles look wrong.** They are derived from the job grade: boss flag → `boss`, grade ≥ 3 → `manager`,
grade 0 → `trainee`, otherwise `member`. Adjust your job grades, or edit the mapping.

**An account appeared for a job that should not have one.** A society account is created for whatever
job a player holds when they open the bank, including `unemployed`. Delete it and it will not come
back unless someone with that job opens the bank again.

## Interface

**The font looks wrong.** The fonts are embedded, so this is not a network problem. If you rebuilt
the interface, make sure `web/src/fonts/` came along — `tokens.css` imports `fonts.css` from there.

**Changes to `web/src` do nothing.** The server loads `web/dist`, not `web/src`. Run `npm run build`.

**The interface is blank.** Open the NUI dev tools (`/nuidevtools` or F8 → `nui_devtools`) and read
the console. A JavaScript error there is almost always a locale key or a missing field in a custom
edit.

## Getting help

Open a ticket in the [Discord](https://discord.gg/DrTFQj5hcZ) with the resource version, your
framework, the **full** console error and what you changed in `config.lua`.
