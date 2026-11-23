# IRONWAKE 2D — v1.5: Mule / Wardog Art Overhaul

A PixiJS + TypeScript browser proof of concept. The current build retains the 1.4 combat and difficulty tuning, including a straight-forward Bastion autocannon and a single Goliath boss no earlier than 7:00 (subsequent bosses spaced by at least seven minutes, never concurrent).

## What changed

- **MW-1 Mule:** new original 96 × 96 transparent pixel sprites (4 walking frames). Heavy work boots, distinct hips and knees, industrial camera head, backpack, work tool, improvised gun, hazard-worn armor.
- **SV-2 Wardog:** new original 96 × 96 transparent tracked armored-vehicle sprite (4 independent tread motion frames), distinct animated turret sprite, recessed camera, physical gun barrel and vehicle markings.
- **Wardog turret:** moves independently of vehicle hull, tracking the Bastion. Its projectiles emerge from the barrel's direction and approximate tip, not the middle of the chassis.
- **Dedicated destroyed sprites:** a folded Mule with bent work arm and a Wardog with a wrecked hull, derailed track and offset gun; both share the existing indexed wreck atlas layout.
- The remaining four classes, their behaviors, spawn timings, combat, permanent progress, and weapon builds are **unchanged**.
- The generated sprite atlases are original, deterministic, and editable in `build_worker_tank.py`.

## Run locally

Open a terminal in this folder:

```sh
python -m http.server 8000
```

Then visit http://localhost:8000. PixiJS is loaded from a CDN and therefore requires internet access.

## Compile and validate

```sh
npm install
npm run build
node test-forward.cjs
node test-roster.cjs
node test-early-art.cjs
```

`python build_worker_tank.py` regenerates the new Mule, Wardog, turret, wreck frames and preview. Run `python package_v15.py` after compiling to embed the sprite atlases and compiled code in a standalone GitHub Pages `index.html`.

## Controls

- WASD or arrow keys: move and face the Bastion.
- Autocannon fires straight ahead in that facing; no auto-aim.
- Touch joystick on phones.
- H: hangar; P: pause; M: mute; F3: difficulty controls.

## Production notes

The Mule and Wardog now use their own illustrated original pixel art, but the light suit, heavy suit, prototype, and mobile-armor boss retain the earlier prototype artwork. The current player Bastion remains an illustrated 8-direction × 4-pose sprite atlas. We did not change damage, upgrades, permanent saves, or difficulty settings in v1.5.

The browser and editor source should stay synchronized: `src/main.ts`, `src/weaponSystem.ts`, `src/enemyRoster.ts`, and `src/difficultyDirector.ts`. Do not edit only the bundled `index.html` without updating its source.

## v1.6 — MW-1 Mule compact mobile worker

The basic Mule has been redesigned as a low-profile industrial mobile worker with four articulated wheeled supports, a compact armored utility housing, small camera optics, and a repurposed side-mounted firearm. It is original machinery inspired by functional industrial principles rather than a reproduction of a Gundam unit. New four-frame 96×96 transparent animated sprite and a matching destroyed wheeled wreck replace the earlier upright humanoid Mule. Other enemy classes and all gameplay balancing (including the seven-minute boss interval) are unchanged. v1.6 browser build is committed in the root `index.html`; the accompanying source release ZIP contains matching editable TypeScript and `build_mule_v16.py`. 


## v1.7 — Mule V2 size and balance

The MW-1 Mule remains a compact four-wheel mobile worker, but it is now roughly 18% smaller on screen (sprite scale 0.80 → 0.66), with 17 HP (from 21), 3 contact damage (from 5), 8 collision radius (from 10), and speed 40 (from 38). It remains common, with unchanged XP, salvage chance, and spawn cost. Its wreck uses the matching reduced scale. All other units, boss cadence, weapon upgrades, and persistent saves are unchanged.

The deployed `index.html` contains the full current browser build. The editable `src/enemyRoster.ts` is committed; the downloadable v1.7 ZIP includes the remaining matching current source and tests.


## v1.8 — Industrial Logistics Zone visual pass

- Sixteen deterministic industrial battlefield tile designs: service roads, loading lanes, hazard bays, grates, piping, cable spools, crates, patched concrete, oil stains, shell craters and tread damage.
- Brighter XP and salvage pickup art, stronger kinetic sparks and explosion rings.
- No new terrain collision; movement, spawn pacing, boss cadence, weapon upgrades, and saved progression are unchanged.
- Current editable TypeScript is provided in the v1.8 project archive from the ChatGPT conversation; deployed `index.html` is the playable build.


## v1.9 — Mobile battlefield view

Mobile play now defaults to a wider field of view (camera pixel divisor 1.95 rather than 3.0); the Bastion takes up less screen space while enemies and weapon mechanics remain unchanged. Use the on-screen `−` / `+` camera buttons to zoom out or in. The setting is remembered in browser local storage (`ironwake_mobile_zoom`). Desktop camera remains unchanged.
