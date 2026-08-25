# DebuX Docs

Documentation for the [DebuX](https://debux.tebex.io/) FiveM resources — installation, configuration,
exports and troubleshooting for each script we sell.

- **Store** — https://debux.tebex.io/
- **Discord** — https://discord.gg/DrTFQj5hcZ
- **Support** — support@debux.net

> Not affiliated with Rockstar Games or any other company.

---

## What is in here

One folder per resource. Every resource is documented the same way, so you always know where to look:

| Page | What it answers |
| --- | --- |
| `index.md` | What the script does and what it needs to run |
| `installation.md` | Drop it in, import the SQL, start it |
| `configuration.md` | Every value in `config.lua`, what it changes |
| `exports.md` | Exports, events and how other resources talk to it |
| `troubleshooting.md` | The errors people actually hit, and the fix |
| `changelog.md` | What changed in each version |

### Documented resources

| Resource | Status |
| --- | --- |
| [`debux-waypoint`](./debux-waypoint/) | Live |
| [`debux-weaponbag`](./debux-weaponbag/) | Live |
| `debux-bank` | Draft — written, not yet linked from the site |

A draft product still builds and is reachable by direct URL, but it is kept out of the navbar and out
of the sitemap so it is not indexed before release. Flip it in `.vitepress/config.mjs`:

```js
{ slug: 'debux-bank', title: 'Bank', published: false }
//                                              ↑ true when it goes on sale
```

---

## Running the site

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static output in .vitepress/dist
npm run preview
```

VitePress, no other dependencies. `base` is set to `/debux-docs/` for GitHub Pages — change it in
`.vitepress/config.mjs` if you host on a custom domain.

---

## Writing a new page

Markdown, one folder per resource, one `.md` per page in the table above. Then add the product to the
`products` array in `.vitepress/config.mjs` — the sidebar is generated from it, so nothing else needs
touching.

Keep the house style:

- Say what a setting does, not what its name already says.
- Show the real default next to every config value.
- Every code block is copy-pasteable as-is.
- Document the failure, not just the happy path — if something bricks a player's card or wipes a
  balance, say so on the page where they would look for it.
