# Changelog

## 1.0.0

First release.

- A 360 booth built from two streamed props — a platform that stays put and an arm that turns, with
  the camera bolted to the arm, so the shot the player sees is the shot the rig is actually making
- Seventeen poses: nine solo, seven for a pair, and a freemode that hands the controls back and films
  the player doing whatever they like
- Couple takes, with a nearby-players list, an invite card carrying the pose, the speed and the
  length, and both subjects placed and animated on the platform
- Three speeds that change how far the arm travels and, for slow motion, the game's own time scale —
  the clip is never re-encoded, so what the camera saw is what comes out
- Free, priced or job-staffed booths, with the fee going to the job's society account through
  debux-bank, Renewed-Banking, qb-banking or esx_addonaccount
- Uploads to Fivemanage, a webhook, or your own endpoint — posted from the client, never through your
  server, with only the link stored
- A personal gallery with copy and delete, trimmed per player and pruned by age
- Discord logging of every saved, cancelled and deleted take, webhook kept in the server-only config
- A Steam or Discord profile picture beside the player's name, on the nearby list and on the invite
  card, with the key kept in the server-only config
- Qbox, QBCore, ESX and standalone, detected on start
- Ten languages, one locale file per language covering the interface, the notifications and the poses
- One table, created on first start. No SQL to import
- Embedded fonts and images, no CDN at runtime
