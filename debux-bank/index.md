# Debux Bank

Banking for FiveM. Personal, savings and society accounts, physical cards with PINs, an invoice
system jobs can bill players through, credit-scored loans, and an ATM.

Works on **Qbox, QBCore, ESX and standalone** with no edits — the framework is detected when the
resource starts.

> **Note — Draft**
>
> This page is written but the resource is not on sale yet. Nothing here is linked from the site nav.

## What players get

**Accounts** — a personal account is created on first use. Savings accounts earn interest on a timer.
Society accounts belong to a job, with per-role withdrawal limits.

**Cards** — every account has a card with a 4-digit PIN. Three wrong tries locks it until the player
visits a branch. Players can freeze a card, switch shop payments off, switch ATM withdrawals off, and
order a higher tier once their credit allows it.

**Bills** — a mechanic, medic, lawyer or officer on duty can invoice a player. The player pays,
disputes, or ignores it — after the due date it is collected automatically and their credit takes a
hit.

**Loans** — three tiers gated by a live credit score. Paying on time raises it, missing an instalment
drops it 60 points and can lock the higher tiers out.

**ATM** — a compact panel with four actions: withdraw, deposit, send money, reset PIN.

## What it needs

| Dependency | Required |
| --- | --- |
| [ox_lib](https://github.com/overextended/ox_lib) | Yes |
| [oxmysql](https://github.com/overextended/oxmysql) | Yes |
| ox_target or qb-target | Optional — falls back to an `[E]` prompt |

MySQL/MariaDB. The tables are created automatically on first start; the SQL file is included if you
would rather import it yourself.

## Interface

The interface ships compiled with the resource. There is nothing to build and nothing to install.

Fonts are embedded. Nothing is fetched from a CDN at runtime, so the interface looks identical on a
server with no outbound internet.

## Replacing another banking resource

Debux Bank declares `provide 'renewed-banking'` and implements the exports third-party scripts
actually call. See [Exports & events](./exports) for the list and the one compatibility gap you need
to know about.
