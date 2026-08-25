---
layout: home

hero:
  name: DebuX
  text: Documentation
  tagline: Install, configure and troubleshoot every DebuX resource.
  actions:
    - theme: brand
      text: Waypoint
      link: /debux-waypoint/
    - theme: alt
      text: Weapon Bag
      link: /debux-weaponbag/
    - theme: alt
      text: Store
      link: https://debux.tebex.io/

features:
  - title: Any framework
    details: Qbox, QBCore, ESX and standalone are detected on start. No edits, no separate builds.
  - title: Ten languages
    details: en, tr, de, fr, es, it, pt, pl, ru, nl — one locale file per language covering both the notifications and the interface.
  - title: Configured, not edited
    details: Everything you would normally patch into a script lives in config.lua. Updates never overwrite your settings.
---

## Getting help

Read the resource's **Troubleshooting** page first — it lists the errors people actually hit and what
causes them.

If that does not cover it, open a ticket in the [Discord](https://discord.gg/DrTFQj5hcZ) with:

- the resource name and its version from `fxmanifest.lua`
- your framework and its version
- the **full** console error, not a screenshot of one line
- what you changed in `config.lua`

That is usually enough to answer in one reply instead of five.
