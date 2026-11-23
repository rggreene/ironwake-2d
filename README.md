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

## v2.3 — Kinetic attack animation pass

Visual-only combat feedback: the Bastion now has short recoil and an aligned muzzle flash; the Wardog's turret recoils briefly; enemy projectiles and unlocked support weapons create directional muzzle flashes; the Goliath's windup now pulses visually during its existing warning; weapon impacts get a secondary spark. Effects have a fixed 64-flash budget, expire automatically, and reset between runs. No modifications to weapon damage, fire rate, enemy health, spawn pacing, boss cadence, or save keys. The current browser build is the versioned `app-v23.js` loaded by `index.html`. The downloadable v2.3 archive includes the updated editable TypeScript and regression tests.


## v2.4 — Permanent requisitions shop

The hangar now has a requisitions terminal with seven permanent upgrade lines: reinforced composite armor, frame reinforcement, autoloader, ballistic calibration, actuator retrofit, salvage recovery, and acquisition optics. Most upgrades have three ranks with increasing salvage prices. Purchases are available before and after runs, not during live combat; bonuses apply at the next deployment.

Progress saves in `ironwake_requisitions_v1`. The existing `ironwake_salvage` and `ironwake_armor` keys are retained for backward compatibility. Armor already owned through the old single-button shop stays purchased.

The deployed game uses three files: `index.html`, `app-v24.js` and `atlas-v24.js`. The split keeps each JavaScript file reasonably sized and makes cache versioning easier. The full editable v2.4 TypeScript project, assets, and `test-shop-v24.cjs` are available in the release ZIP from the ChatGPT conversation. The repository's older `src/main.ts` is not yet synchronized with the deployed v2.4 JavaScript.

The requisitions tests cover legacy armor migration, ranks and prices, salvage deduction, saves, bonuses, and purchase gating. Local TypeScript compilation and current forward-fire and support-weapon tests passed. A full browser playtest is still pending.
