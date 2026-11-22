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