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