# Personal Lampa

Self-hosted [Lampa](https://github.com/yumata/lampa) instance on GitHub Pages, with a
curated set of free plugins pre-installed and two custom buttons:

- **4K** — free 2160p from VK / Rutube (via public Lampac instances, no account, no server)
- **Torrents** — every torrent version, sorted by quality then seeders, with green/yellow/red
  seeder dots; streams through your TorrServer

Live at: **https://mailtoharutyunyan.github.io/personal-lampa/**

---

## TV setup (Media Station X) — and why we use a short URL

On the LG / webOS TV, Lampa is launched inside **Media Station X (MSX)**. You point MSX at a
start parameter and it loads Lampa.

### The problem: no `/` key

The normal way would be to paste the full page URL into MSX's
**Settings → Start Parameter → Setup**:

```
https://mailtoharutyunyan.github.io/personal-lampa/
```

But **the MSX on-screen keyboard has no `/` (slash) key.** That is not a bug — MSX's start
parameter is *meant* to be a bare hostname or a short code, so its keyboard only offers
lowercase letters, digits and a colon. There is no way to type `https://.../personal-lampa/`.

### The fix: MSX short-URL code (`id:trl:…`)

MSX supports **URL-shortener codes** in the form `id:SERVICE:ALIAS`, which contain **no slash**
— only lowercase letters, digits and colons, all of which the keyboard has. Supported
services include `trl` = TinyURL, `igd` = is.gd, `rgh` = raw-GitHub-redirect, etc.

So instead of typing the long URL, we:

1. Created a TinyURL that redirects to this repo's MSX start file:

   ```
   https://tinyurl.com/lampamsxar
        → https://raw.githubusercontent.com/mailtoharutyunyan/personal-lampa/main/msx/start.json
   ```

2. On the TV, in **MSX → Settings → Start Parameter → Setup**, typed just:

   ```
   id:trl:lampamsxar
   ```

   (`id` `:` `trl` `:` `lampamsxar` — all typeable on the MSX keyboard, no slash needed.)

MSX resolves that code → fetches `msx/start.json` → which tells MSX to open the Lampa page.
`start.json` looks like:

```json
{
  "name": "Lampa",
  "version": "latest",
  "parameter": "content:https://mailtoharutyunyan.github.io/personal-lampa/msx/start.json",
  "action": "link:https://mailtoharutyunyan.github.io/personal-lampa/?v=20261008a"
}
```

The `?v=…` on the end is a cache-buster so the TV always loads the latest page.

---

## Auto-update

The plugin list is versioned in `index.html` (`VERSION`). Whenever it changes, every device
re-seeds the list on the next launch — no need to clear data or re-add plugins. To force a
refresh on the TV: back out to MSX and reopen Lampa (or fully close MSX and reopen).

---

## TorrServer (for torrent streaming)

Run TorrServer on any device on your network (phone, Mac, …). `torrserver_config.js`
**auto-detects** it by scanning the LAN, so no static IP is required. Streams the chosen
torrent's largest video file through it.

---

## Standalone plugin installer

To add the plugin set to the official Lampa app instead of using this page:

```
https://cdn.jsdelivr.net/gh/mailtoharutyunyan/personal-lampa@main/autoinstall.js
```

Settings → Extensions → Add Plugin → paste → Restart.
