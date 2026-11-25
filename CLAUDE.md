# IRONWAKE — shared agent handoff

Read this before changing the game. Preserve the canonical timeline, gameplay and permanent salvage saves. Use grounded military-industrial designs and illustrated neo-retro pixel art.

## v3.13 release entry

- `app-v313.js` introduces the Bastion thruster strafe on Space or the touch Boost button. Direction is sampled from movement at ignition and kept for the burst. Auto-fire and touch aim retention keep the gun pointed independently. The effect uses twin exhaust cones, a braced pose, chassis lean and dust. `thruster-v313.mjs` owns the run-local timing and movement.

## v3.12 release

- `app-v312.js` removes the Needle’s projected warning lines. Its braced pose and locked counterclockwise sweep remain.

## v3.11 release

- `app-v311.js` uses a transparent Needle atlas with a compact pistol carried upright and rolled sideways when braced. The burst and telegraph share three ordered offsets around a locked center, +45°, 0°, and −45° in screen coordinates.

## v3.10 release

- Needle spawn and paused previews use the same transparent sprite frames as gameplay. A failed remote atlas load uses an embedded transparent still. `index.html` loads `app-v310.js`.

## v3.9 release

- `app-v39.js` loads the transparent Needle pose atlas at `assets/needle/ls4-poses-v39.png`. All twelve frames keep their original 128 × 128 cell registration.

## v3.8 release

- The main-menu Bestiary in `app-v38.js` uses the same enemy spawner, AI and projectile updates as normal deployment. Its independent ticker branch updates a dummy, counts damage, and skips the director, salvage, progression and player weapons.
- `bestiary-v38.mjs` defines encounter presets and dummy motion. Closing or restarting the lab removes its enemies, warning visuals, bullets, and effects. The arena zoom is separate from the combat camera.

## v3.7 release

- The Needle can commit at 300 world units. The telegraph and projectile lifetime share a 336-unit distance measured from the muzzle. `index.html` loads `app-v37.js`.

## v3.6 release
- The Needle can now close distance on a moving Bastion at base speed. The locked firing lane has a dark outline and a brighter muzzle marker. The post-burst sidestep travels farther before the same recovery window.
- `index.html` loads `app-v36.js`. Earlier release files remain available.

## v3.5 release

- `app-v35.js` adds the LS-4 Needle flank, brace, burst, slip, and recovery cycle. The binary pose atlas at `assets/needle/ls4-poses-v35.png` reworks legacy painted pixels into a three-row strip. `needle-v35.mjs` owns the movement and locked-shot rules. `test-needle-v35.mjs` drives the combat loop with Needle, Mule, and Wardog together.
- The warning lane and burst share a fixed world-space muzzle after the Needle plants. Its rounds travel as hostile projectiles and inherit the director damage multiplier. Existing light-suit spawn weights, health, and salvage remain in place.


- `app-v34.js` adds the Mule grapple and close-range burst. The binary atlas `assets/mule/mw1-claws-v34.png` contains three claw poses across the four legacy gait frames. The prior v3.3 runtime remains available.

- `app-v33.js` retains the v3.2 Wardog and adds the Mule animation pass. The painted four-frame Mule strip from `atlas-v24.js` is reused, with left/right facing, travel-based gait timing and contact compression from `mule-v33.mjs`.
- The previous Wardog release remains in `app-v32.js`.

- `index.html` loads PixiJS 8.15, `atlas-v24.js` and the versioned `app-v35.js` module. v3.2 was forked from the actual v3.1 release runtime to retain newer gameplay and its save schema.
- `src/main.ts` still predates the shipped runtime. `npm run typecheck` checks that older source and `npm run build` emits `dist/main.js`. A full source port remains pending. Keep Pages pointed at the tested release entry until the port can reproduce gameplay and saves.
- Pages serves the repository root. Keep the upload and deployment artifact names matched and unique per run and attempt.

## Wardog art and behavior

- Both binary atlases live in `assets/wardog/`. Native cells are 48 × 48, with columns clockwise from north. The hull has four track rows and the turret two recoil rows. Three rear turret bearings and the second recoil row are composites of painted source pixels.
- `wardog-v32.mjs` supplies versioned URLs, atlas validation, nearest-neighbor cell drawing, bearing quantization, recoil placement and muzzle coordinates for both the lab and game.
- The hull drives forward or reverses along its own heading and pivots in place. The hull advances track phases while moving or pivoting and steps backward when reversing. The independently aimed turret brakes with the hull before the shot. The Wardog recovers and honors the five-second shot interval.
- The flash and projectile share the authored barrel tip. The direction of projectile travel uses the continuous turret heading used by v3.1. With eight illustrated bearings, some shots travel between adjacent sprite bearings.
- The game logs when it activates procedural emergency sprites. The lab shows a failure message when an atlas fails to load.

## Release checks

Run syntax and TypeScript checks, the support and Wardog tests, and inspect the atlas bounds and per-bearing phases. Smoke test the runtime and lab in a browser at desktop and touch sizes. Check the Pages workflow and the actual live entry, module and sprites. Keep previous release files in place.
