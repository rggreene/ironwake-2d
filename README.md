# IRONWAKE v2.0 — Enemy Art Integration

Replaces the in-game art for the MW-1 Mule, SV-2 Wardog, LS-4 Needle and HS-7 Bulwark with four illustrated 4-frame transparent atlases, plus a matching wreck sprite for each. Art is cropped from the approved November 2026 reference sheets and standardized into 128px cells. Enemy combat, stats, spawn schedule, permanent upgrades, the straight-forward autocannon, and mobile zoom are unchanged.

The illustrated Wardog sheet includes its turret, so the previous overlay is hidden to avoid duplicated barrels; its independent ballistic tracking still works, but visible independent turret rotation needs a future layered redraw.

## Run

Run a local HTTP server from this folder, e.g. `python -m http.server 8000`, then open `http://localhost:8000`. The 4 new atlas PNGs and 4 wreck PNGs are loaded as separate images from `assets/enemies/`. Previous enemy art is embedded as a fallback if a new asset is unavailable. PixiJS still loads from CDN.

## Build / Tests

`npx tsc && node test-art-v20.cjs && node test-forward.cjs && python package_v20.py`

The HTML can be deployed to GitHub Pages along with `assets/enemies/*_v20.png`. Keep existing `assets/mechs/bastion/full_64.png` and other committed assets.

## v2.1 — Viper Prototype & Goliath Mobile Armor

The PX-1 Viper is now a differentiated experimental light frame with a distinct four-frame pixel atlas and a short mobility burst approximately every 6.4 seconds. The MA-0 Goliath is now a dedicated low-slung mobile weapons carrier with articulated supports, twin heavy weapon housings, missile cassettes, a boss health bar, and a 0.75-second clearly visible warning before a three-shot spread every approximately 4.5 seconds. Its total volley damage is deliberately modest (three projectiles of six base damage) to preserve v1.4-v2.0 balance; both have new wreck sprites and unchanged HP/contact damage/XP/salvage. Boss scheduling remains first at 7:00 and no more frequently than every 7 minutes, with no second active Goliath.

Static hosting uses a small `index.html` and a versioned `app-v21.js` so GitHub Pages never depends on a giant inline script. The new `assets/enemies/*_v21.png` images are external and versioned. Do not deploy only the HTML; upload the JS and four sprite PNG files together. Original enemy assets remain intact.

Run `npx tsc && node test-elite-v21.cjs && node test-roster.cjs && node test-forward.cjs && node test-art-v20.cjs`, then `python package_v21.py`. The full-graphics browser startup and difficulty feel still require a live playtest.