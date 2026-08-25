# Exports & events

All exports are **server-side**.

## Money

```lua
exports['debux-bank']:GetAccount(citizenId)
exports['debux-bank']:AddMoney(citizenId, amount, reason)
exports['debux-bank']:RemoveMoney(citizenId, amount, reason)
exports['debux-bank']:GetCreditScore(citizenId)
```

`GetAccount` returns the player's personal account row, or `nil`. `AddMoney` and `RemoveMoney` return
`true` on success, or `false` plus an error string.

```lua
local ok, err = exports['debux-bank']:RemoveMoney(citizenId, 500, 'Parking fine')
if not ok then print(err) end   -- 'insufficient_funds' | 'account_frozen' | 'no_account'
```

Every call writes a transaction row, so the money shows up in the player's history with the reason
you passed.

## Society accounts

```lua
exports['debux-bank']:GetSocietyAccount(jobName)
exports['debux-bank']:AddSocietyMoney(jobName, amount)
exports['debux-bank']:RemoveSocietyMoney(jobName, amount)
```

`jobName` is the job name, not its label — `'mechanic'`, not `'Mechanic'`. The account is created on
first use.

## Loans

```lua
exports['debux-bank']:ApproveLoan(loanId, approverSource)
exports['debux-bank']:RejectLoan(loanId, approverSource)
```

Both re-check `Config.Loans.approverJob` server-side, so you cannot approve a loan by calling these
from an unauthorised context.

Pending loans:

```lua
local pending = MySQL.query.await("SELECT * FROM debux_loans WHERE status = 'pending'")
```

Wire those two calls into whatever banker menu you use. If you do not want an approval step at all,
set `Config.Loans.requireApproval = false` and loans pay out immediately.

## Renewed-Banking compatibility

`debux-bank` declares `provide 'renewed-banking'` and implements the exports third-party scripts
actually call, so you can stop Renewed-Banking and keep everything that talked to it working:

```lua
exports['debux-bank']:getAccountMoney(account)
exports['debux-bank']:addAccountMoney(account, amount)
exports['debux-bank']:removeAccountMoney(account, amount)
exports['debux-bank']:getAccountTransactions(account, limit)
exports['debux-bank']:createJobAccount(jobName, label)
exports['debux-bank']:handleTransaction(account, title, amount, message, issuer, receiver, type)
```

`account` accepts a job name, an account number or a citizen id — resolved in that order.

> **Note — qb-banking is not provided**
>
> qb-banking's `AddMoney` / `RemoveMoney` / `GetAccount` take an **account name** where these take a
> **citizen id**. Silently resolving the wrong account is worse than a clear error, so we do not claim
> compatibility. If you need it, write a thin shim resource that maps the names.

## Client events

```lua
TriggerEvent('debux-bank:client:openBank')
TriggerEvent('debux-bank:client:openAtm')
```

Both play the card animation and open the panel. The server still verifies the player is actually at
a branch, so triggering `openBank` in the middle of nowhere fails with `not_at_bank`.

## Console commands

| Command | Where | What |
| --- | --- | --- |
| `/bank` | Client | Opens the panel if the player is at a branch |

## What is deliberately not exported

**Setting a balance directly.** Every balance change goes through a credit or debit that writes a
transaction row. An export that writes a raw balance would let a bug erase the audit trail.

**Verifying or changing a PIN from outside.** PIN checks are rate-limited and count toward the card
lockout. An export would let another resource brute-force them.
