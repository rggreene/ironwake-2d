# IRONWAKE — shared agent handoff

Read this before changing the game. Preserve continuity, gameplay and permanent salvage saves. Grounded military-industrial mecha, illustrated neo-retro pixel art. No convenient narrative retcons.

## Current baseline
- Live entry: index.html loads atlas-v24.js and app-v31.js (PixiJS 8.15).
- src/main.ts is older than the shipped JavaScript; it even hides the Wardog turret. Do not replace the live bundle with a TypeScript build until reconciled.
- npm run typecheck checks the older TS; npm run build emits dist/main.js, not app-v31.js.
- Pages deploys repository contents directly. Keep artifact names unique per run and attempt, and match deploy-pages artifact_name.
- wardog-lab.html is a standalone atlas preview, not gameplay integration.

## Wardog v3.2
- Preserve existing stop/aim/fire/recover/travel behavior and five-second cooldown.
- Desired assets: 8 hull bearings x 4 track phases, 8 independent turret bearings x 2 recoil poses. Normalized candidate sheets are 768x384 and 768x192, 96px cells.
- Candidate art is not yet committed. Hull source order is S, SW, W, NW, N, NE, E, SE (verify visually before mapping); turret source contains duplicated forward bearings. Rear-facing approximations are not final art.
- Validate transparency, pivot alignment, barrel bearing, track animation and actual runtime rendering before claiming completion.
- Keep recoil, smoke, muzzle flash and casing effects reusable. No sideways tank motion or firing while moving.
- GitHub binary upload: create_blob with base64, create_tree with base tree, create_commit with current parent, update_ref with expected head. Text contents API is not a binary upload route. The remaining obstacle is transferring processed bytes from the image runtime into the connector; do not claim uploaded until tree entries are verified.
- Use versioned asset URLs. Keep old releases intact.

## Release checks
Inspect current head and index entry point. Run syntax/type checks, relevant mechanics tests and browser smoke tests where possible. Verify Pages workflow success and actual live version. Explicitly report unperformed tests. Do not clear localStorage or migrate saves without a tested plan.

## Next priorities
Complete Wardog art integration, reconcile editable source with shipped runtime, add automated checks and expand the enemy lab, then weapons, bosses, BEAST carrier upgrades and deployment sequences.
