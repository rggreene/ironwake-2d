# IRONWAKE 2D — First Deployment (PixiJS + TypeScript)

A standalone, early playable browser proof of concept built from original procedural pixel sprites inspired by the established **M14 Bastion** design. This is a 2D combat experiment, not a production-ready game.

## Quick start

Run a local HTTP server in this folder:

```bash
python -m http.server 8000
```

Then visit **http://localhost:8000** in a recent browser. Requires **internet access to load PixiJS 8** from the CDN in `index.html` on first use. There is no npm install required to play the packaged JavaScript build.

For further TypeScript changes, compile with a local TypeScript compiler:

```bash
tsc -p .
```

This writes `dist/main.js`. If `tsc` is not installed, use `npm install` followed by `npm run build` (requires a registry connection).

## Controls

- **WASD / Arrow keys** — Walk the Bastion
- **Automatic** — Torso aims and the autocannon fires toward the closest hostile in range
- **P** — Pause/resume
- **H** — Open/close hangar while deployed
- **M** — Toggle synthesized sound effects
- **Mobile** — Drag the lower-left virtual joystick
- **Start / Retry** — Begin or restart a deployment

## Implemented

- PixiJS 8 accelerated 2D rendering at approximately one-third native display resolution; nearest-neighbor upscaling.
- Scrolling industrial concrete battlefield with deterministic ground clutter.
- Player sprite assembled from separately drawn **legs, torso, weapon, armor, and optic layers**. Walking gait and independent upper-body targeting.
- Startup optic goes **red** with a synthesized electronic **boop**.
- Autocannon with recoil, muzzle sparks, shell ejection, screen shake, projectile collisions, and basic sounds.
- **Scout, Raider, and Brute** opponents; spawning and difficulty scale with time.
- Enemy explosions, persistent-but-fading wrecks, **blue XP**, and **gold salvage** pickups.
- Level-up choices among eight temporary upgrades (damage, reload, speed, armor, projectile upgrades, etc.).
- Hangar contains a **permanent reinforced armor** purchase, visibly changing the Bastion torso and shoulders. Salvage and ownership persist in **localStorage**.
- Browser-first keyboard and touch input.

## Prototype limitations

- The previously generated image atlas is **included solely as a reference** in `assets/bastion-concept-reference.png`: it is not a clean, consistently aligned gameplay atlas. The game uses original code-drawn pixel art, **not** automated slices of that concept sheet.
- A true animated land-fortress deployment, multi-faction roster, advanced collision spatial grid, rigorous mobile optimization, data-driven weapon definitions, and multiplayer are not implemented.
- The hangar is a 2D equipment display, **not yet a Three.js 3D hangar**.
- Performance, browser runtime behavior, and combat balance have **not** been fully verified by automated browser playtests. TypeScript compilation and JavaScript syntax checks were run.
- No assets or story from Gundam or other copyrighted series are used.

## Structure

```
index.html
style.css
src/main.ts        # Editable TypeScript source
 dist/main.js       # Compiled browser JavaScript
assets/bastion-concept-reference.png
```

## Next engineering steps

1. Validate on Chrome, Firefox and mobile, then fix rendering/input edge cases.
2. Replace the procedural sprite with deliberately authored transparent 2D atlases (consistent frames and attachment points).
3. Implement a uniform-grid spatial index and object pools, and measure large-swarm performance.
4. Add the deployment vehicle intro, separate hangar equipment model, and more permanent modules.

## v0.2 — Weapon engineering and mission report fix

- Mission report is now hidden while the permanent-upgrade hangar is open; returning restores the report after a failed run.
- Stacking **MULTI-FEED** allows up to 10 projectiles per volley.
- **OVERDRIVE**, **SPREAD CHOKE**, **PENETRATOR SLUGS**, and **STABILIZED DRIVE** add build diversity.
- The combat HUD displays live volleys/s, multishot, penetration, and estimated projectiles/s.
- End-of-run reports now show rounds fired, peak output, and peak volley size.
- Keeps existing permanent salvage/armor saves intact. Projectile budget is capped to protect mobile performance.


## v0.3 — Bastion visual overhaul

The live `index.html` now draws a layered humanoid M14 Bastion with independent animated legs, a compact camera sensor head, visible arms holding a separate autocannon, gun-based recoil/ejection positions, a permanent armor visual layer, and the tiny red BOOP light. Gameplay and save keys remain unchanged from v0.2.

**Development note:** The latest v0.3 editable TypeScript and rebuilt bundled page are in the downloadable `ironwake-2d-v0.3.zip` archive supplied in the ChatGPT project conversation. The repository `src/main.ts` is still the v0.2 source; its v0.3 replacement has not yet been synced here. For running the latest version, use the root `index.html`.


## v0.5 — Illustrated directional Bastion

- Live `index.html` embeds the new 8-direction × 4-frame Bastion atlas, so GitHub Pages needs no separate image download.
- The torso tracks enemies using directional art while the walking legs follow movement direction.
- Handheld autocannon appearance, recoil, red optical startup light, and permanent visible armor remain.
- Full PNG atlas and matching TypeScript source are included in the downloadable v0.5 project package.
- Browser playtesting and Github Pages delivery are not yet independently verified. Generated source art has a visible waist seam at some opposing aim/walk angles; this is a sprite-art limitation to improve in later revisions.


## v0.6 — Forward-facing Bastion combat arc

- The autocannon now acquires targets only within 180° in front of the leg/chassis heading; threats behind are ignored until you turn.
- Upper-body sprite facing is limited to 45° to either side so the mech cannot break its spine.
- Sprite atlas waist seam was re-cut to prevent the lower body displaying duplicate rifle pixels.
- Directional artwork is recentered per view, and upper-body recoil no longer shifts its entire sprite.
- Combat damage, upgrades, saves, enemy logic, and existing controls are otherwise unchanged.
- The root `index.html` includes its Bastion sprite atlas inline so GitHub Pages needs no separate image asset.
- Full editable v0.6 sources are in the downloadable project ZIP; the `src/main.ts` in this repo may lag behind the deployed browser build.


## v0.7 — Weapon aim sync correction

The live bundled page now matches the illustrated rifle facing to the firing target within the leg-forward 180-degree hemisphere. Visual torso motion spans up to 90° each side; no eligible target returns the torso to center. Muzzle spawn and multishot spread are oriented to the gun and cannot extend behind the legs. Existing localStorage save keys are unchanged. Full editable v0.7 TypeScript source and test are included in the downloadable v0.7 ZIP.\n

## v0.8 — Full-body Bastion sprite repair

The deployed root `index.html` now uses intact 8-direction illustrated frames (4 poses per direction) rather than cutting the weapon, torso and legs into mismatched layers. Armor ownership changes the frame's existing armor colors rather than painting blocky patches over the art. For legible firing, the muzzle and target arc now stay near the selected full-body direction (±45°). The familiar BOOP and previous progression save keys remain. This is a focused player-art repair, not a full art-production overhaul. The editable v0.8 source and complete atlas are included in `ironwake-2d-v0.8.zip` supplied in the project chat; the repository `src/main.ts` requires a follow-up source sync, but root `index.html` is the deployed build.
