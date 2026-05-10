# Turbulent Danny Studios — Studio Website

Static website for `turbulentdannystudios.com`. Hosts studio identity, game landing pages, and migrated press kit content. Pure HTML + CSS, no build step required, deployed via GitHub Pages.

## Live URL

https://turbulentdannystudios.com (after Cloudflare DNS + GitHub Pages custom domain configuration)

Until DNS is configured: https://dcsale.github.io/turbulent-danny-studios/

## Site structure

- `/` — Studio homepage (hero + featured game card + quick links)
- `/about/` — Studio + Danny bio with portrait
- `/games/` — Games index
- `/games/coblade-game/` — `[GAME_NAME]` landing page (rename slug when Steam name is settled)
- `/press/` — Press hub
- `/press/coblade-game/` — `[GAME_NAME]` press kit (migrated from `dcsale/coblade-game-press`)
- `/contact/` — Contact info, social links

## Updating

Static prose has `TODO Danny` markers — search for them in the HTML files. The placeholder `[GAME_NAME]` appears throughout; find/replace with the chosen Steam title once decided.

The slug `coblade-game/` in directory paths can be renamed in one commit when the game name is finalized:

```bash
git mv games/coblade-game games/<new-name>
git mv press/coblade-game press/<new-name>
# Update any internal links via find/replace
```

## Local preview

Open `index.html` in a browser. All paths are root-relative (`/...`) which works on GitHub Pages. For local file preview, you can either:

1. Run a local static server (e.g., `python -m http.server`) — root-relative paths work
2. Or temporarily edit the paths to be relative when previewing offline

## Deploying

1. `git add .`
2. `git commit -m "Initial studio website scaffold"`
3. `git push origin main`
4. **Settings → Pages** → Source: Deploy from branch / `main` / `/ (root)`
5. Wait ~1 minute for first build

To configure the custom domain `turbulentdannystudios.com`:

1. Register the domain at Cloudflare Registrar
2. In Cloudflare DNS panel: add a CNAME record `turbulentdannystudios.com` → `dcsale.github.io`
3. In GitHub repo Settings → Pages → Custom domain: enter `turbulentdannystudios.com`
4. Wait for DNS propagation (~10 min)
5. Free auto-provisioned SSL certificate enables shortly after

## Image assets

- `images/logo/` — Studio + game logo files
- `images/portrait/` — Developer portrait (`danny-on-turbine.png`, copy from existing press kit)
- `images/screenshots/` — Game screenshots (copy from existing press kit)
- `images/gifs/` — Animated devlog clips (future)

To migrate from the existing press kit repo, copy:
```
dcsale/coblade-game-press/images/logo/coblade-logo.png  →  turbulent-danny-studios/images/logo/coblade-logo.png
dcsale/coblade-game-press/images/portrait/danny-on-turbine.png  →  turbulent-danny-studios/images/portrait/danny-on-turbine.png
dcsale/coblade-game-press/images/screenshots/01.png — 04.png  →  turbulent-danny-studios/images/screenshots/01.png — 04.png
```
