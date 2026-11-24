# IRONWAKE v2.5 — Mobile Field Support

A mid-run recovery carrier with a secure field-service menu. No permanent-save migration.

## How to play

- At **3:00**, press **B** (keyboard) or **REQUEST CARRIER** (mobile button).
- Carrier arrives after a two-second protected approach; normal simulation pauses during service.
- **Field repair** — costs 2 run-only supply credits, restores 40% of maximum HP.
- **Replacement Bastion** — costs 4 credits, fully restores chassis integrity, once per run. Your acquired XP, weapon levels, and build remain intact.
- **Assault refit** — costs 3 credits, once per run, +20 integrity and +15% kinetic damage.
- **Close ramp** resumes the fight, with a short post-service grace period.
- Calls have a **4-minute cooldown**, starting on each request.
- Earn **1 supply credit per 12 kills**, starting with 3 credits. Credits do *not* consume permanent salvage.
- Mid-run hangar shop is intentionally unaffected; these are temporary support actions, not permanent purchases.
- For quick local testing, change `FieldSupport.firstCallAt` from 180 to 10 in `src/fieldSupport.ts` before building.

## Build

`npx tsc --project tsconfig.json` (typescript 5.8.x) then `python build_v25.py`.
The distributable files are `index.html`, `app-v25.js`, `atlas-v24.js`, and `assets/mechs/bastion/full_64.png`.
To test locally: `python -m http.server 8000`, then open http://localhost:8000/.

## Tests

`node test-field-support-v25.cjs`, `node test-forward.cjs`, `node test-shop-v24.cjs`, `node test-support-v22.cjs`.

## Known limits

The carrier is hand-drawn with PixiJS primitives, not a final authored animation atlas. It represents a protected gameplay service zone; no friendly turrets or full chassis swap cinematics yet. Its first deployment is a usability prototype. Actual mobile browser rendering has not been verified from this environment.