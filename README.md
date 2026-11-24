# IRONWAKE v3.3 — Operation Wardog

A military-industrial mecha bullet-heaven roguelite built with PixiJS. [Play IRONWAKE](https://rggreene.github.io/ironwake-2d/).

- Move with WASD or arrows and aim with the mouse. On touch screens, use the left stick to move and the right stick to aim.
- Collect XP for run upgrades and salvage for permanent hangar requisitions.
- Request MOC-01 BEAST from 3:00 onward with **B** or the mobile carrier button. Field repair costs 2 run-only supply credits. Replacement Bastion and assault refit cost 4 and 3 respectively and are each available once per run. Carrier calls have a four-minute cooldown.

## SV-2 Wardog

The illustrated hull has eight bearings and four track phases. Track playback advances when the hull drives or pivots, and runs backward in reverse. The turret aims independently. The Wardog brakes and aims before firing, recovers after firing, and waits at least five seconds before the next shot.

The shot starts at the muzzle registered to the illustrated frame. Projectile aim is continuous, while the turret is drawn at eight discrete bearings. The rear bearings and second recoil poses were composited from the painted source art. A missing or invalid atlas produces a console warning and loads emergency sprites.

Use the [Wardog lab](https://rggreene.github.io/ironwake-2d/wardog-lab.html) to step through frames, select independent bearings, test recoil and watch the cooldown.

## MW-1 Mule

Mules turn their painted gait toward their target and advance animation frames with distance traveled. The chassis compresses briefly on contact. Movement, damage, and spawning retain their previous values.

## Run and test locally

Serve the repository root with `python -m http.server 8000` and open `http://localhost:8000/`. The game loads PixiJS 8.15 from jsDelivr.

```sh
npm install
npm run typecheck
npm test
node test-wardog-v32.mjs
node --check app-v33.js
npx tsc --allowJs --checkJs --noEmit --strict --target es2022 --module nodenext wardog-v32.mjs
```

GitHub Pages publishes the root entry point, which loads `app-v33.js`. The TypeScript build targets the older gameplay source and emits `dist/main.js`. See `CLAUDE.md` for the release handoff.
