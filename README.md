# IRONWAKE — First Deployment v0.9

## What's new: reusable weapon aiming

The Bastion's automatic autocannon is now powered by `src/weaponSystem.ts`, a **pure TypeScript weapon geometry and targeting library**. It supports independent definitions for each weapon slot, including a configured targeting arc, an aiming mode, directional muzzle and casing-ejection anchors, recoil configuration, projectile texture, and sound. Nothing in the library depends on PixiJS.

The existing `src/main.ts` connects the generic weapon system to PixiJS render/effects. The current Bastion uses one equipped autocannon; the test suite also creates a second hypothetical grenade-launcher slot to validate extensibility. **A second gameplay weapon has not been unlocked yet.**

Three supported aim modes:

- `body-snap` — for illustrated complete-body sprites. Selects a valid target inside the chassis's forward arc, snaps the visible sprite to the closest supported direction, fires from that direction's exact art anchor.
- `fixed-forward` — for forward-mounted weapons with body-aligned barrels.
- `turret-independent` — accepts true target bearings for future separately rendered turret/weapon graphics.

### For adding a weapon

1. Create a `WeaponKit.WeaponDefinition` with 8 muzzle/ejection anchor pairs for the supported directions.
2. Add it to the `equippedWeapons` list for the chassis.
3. Provide matching projectile and shell textures, set its cooldown and optional effects.
4. If introducing a free-rotating turret, provide its own visual layer, rather than rotating the complete-body sprite.
5. Add weapon-specific upgrade stats and UI when the next playable weapon ships.

Each slot has its own target acquisition, cooldown, and optional `statOverrides` and `fireIntervalMultiplier` that can specialize its firing stats. The existing autocannon continues inheriting the player's upgrade stats. The next playable weapon will need new textures, a UI entry, and its own upgrade progression.

## Source and deployment

`src/weaponSystem.ts` and `src/main.ts` are compiled together by TypeScript in order to `dist/main.js`. For static hosting, `index.html` embeds the compiled module and the Bastion atlas image, so only the root HTML is necessary to run on GitHub Pages.

To build: `npx tsc --project tsconfig.json`

To test: `node test-weapons.cjs`

To play locally: `python -m http.server 8000` then open `http://localhost:8000`.

### Gameplay

Move: WASD / arrows, or virtual joystick on touch devices. Weapons aim and fire automatically. H opens hangar. P pauses. M mutes. Permanent armor saved in browser localStorage remains compatible.


## v1.0 — Forward-only autocannon
The M14 autocannon now fires continuously straight in the visible eight-direction chassis facing, including when no enemies are ahead. It no longer selects enemies, rotates the entire character toward targets, or enforces a target-acquisition cone. Multi-feed still fans its projectiles around that central forward line. Other weapons may use the original independent target-acquisition policy. Existing saves remain unchanged.

## v1.1 — Industrial battlefield visual pass

This iteration is intentionally art-focused. The Bastion and fixed-forward autocannon continue to behave as in v1.0. The battlefield now features eight deterministic concrete/industrial tile variants (service lanes, hazards, access hatches, grates, loading zones, and scuffed/cratered pavement), richer sprite detailing for the scout / raider / brute enemy families, two-frame enemy gaits, distinct damaged wreckage, more legible XP and salvage pickups, and upgraded bullet/muzzle-impact artwork. These 2D enemy assets are generated deterministically at runtime, so the browser deployment remains a single page with the existing embedded Bastion atlas.

**Next milestone, not included here:** independently configurable secondary weapons and their upgrade paths.

Verification: `npx tsc --noEmit && npx tsc`, `node test-forward.cjs`, `node test-visual.cjs`. Legacy `test-weapons.cjs` includes obsolete torso-tracking expectations and is not a v1.1 acceptance test. A full interactive mobile browser playtest is still required.


## v1.2 — Carrion League encounters and difficulty tuning
- Needle: quick pursuit with controlled lateral weaving, 28 base HP.
- Marauder: regular pursuit with light spatial-hash neighbor separation, 65 base HP.
- Brute: slower heavy pressure, 155 base HP, stronger contact hits.
- Threat budget gradually increases with elapsed time and mixes enemies by cost and composition. Enemy cap protects mobile devices.
- Difficulty presets: Recruit, Standard, Veteran and Hellfront.
- Dev panel: click ⚙ DIFFICULTY or press F3. Live-adjust spawn, HP, damage, speed and enemy-type weights. Tuning resets on reload and does not modify player saves.
- Non-punitive short pressure relief after heavy damage (toggleable). No direct scaling to weapon DPS.