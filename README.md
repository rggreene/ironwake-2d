# IRONWAKE v3.15 — Iron District

A military-industrial mecha bullet-heaven roguelite built with PixiJS. [Play IRONWAKE](https://rggreene.github.io/ironwake-2d/).

- Move with WASD or arrows and aim with the mouse. On touch screens, use the left stick to move and the right stick to aim.
- Collect XP for run upgrades and salvage for permanent hangar requisitions.
- Request MOC-01 BEAST from 3:00 onward with **B** or the mobile carrier button. Field repair costs 2 run-only supply credits. Replacement Bastion and assault refit cost 4 and 3 respectively and are each available once per run. Carrier calls have a four-minute cooldown.

## Deployments

Choose Survival for an open-ended run or Iron District for a scheduled pickup. At 5:00 the operation pauses for a field job. Cross three switches in order at the rail yard, or spend 30 cumulative seconds in the crane apron at the depot. The HUD shows one objective and an arrow when its destination is offscreen.

BEAST reserves its pickup at 14:00 and opens the ramp at 15:00. Reach it to board. Completing your job also lets you send BEAST away for 90 seconds. Board the second pickup alive to bank a blueprint component. Ordinary salvage follows the usual recovery rules. The report tracks components for future use.

## SV-2 Wardog

The illustrated hull has eight bearings and four track phases. Track playback advances when the hull drives or pivots, and runs backward in reverse. The turret aims independently. The Wardog brakes and aims before firing, recovers after firing, and waits at least five seconds before the next shot.

The shot starts at the muzzle registered to the illustrated frame. Projectile aim is continuous, while the turret is drawn at eight discrete bearings. The rear bearings and second recoil poses were composited from the painted source art. A missing or invalid atlas produces a console warning and loads emergency sprites.

Use the [Wardog lab](https://rggreene.github.io/ironwake-2d/wardog-lab.html) to step through frames, select independent bearings, test recoil and watch the cooldown.

## MW-1 Mule

Mules close with their labor claws and pin the Bastion in groups. See the grapple trial below.

## LS-4 Needle

The light suit can start its burst sequence within 300 world units. It sprints into range on a diagonal, then circles to find an angle, plants its feet to brace. It rolls its compact machine pistol sideways and sweeps from 45° clockwise through center to 45° counterclockwise. Aim locks when it braces. Watch the stance change to time your dodge, or take the shot while the Needle is planted. It sidesteps after firing and pauses to recover.

## Thruster strafe

Hold a movement direction and press **Space** on desktop, or tap **Boost** above the right aim stick on touch. Boost lasts 0.24 seconds and recharges in 2.4 seconds. The touch button shows its recharge and the aim stick briefly retains its last direction on release. Mule grips slow the boost and a full pin prevents it.

## Enemy bestiary

Open **Enemy Bestiary** from the main menu. Pick any enemy or the mixed patrol, set the start distance and dummy movement, then watch the shipped attack logic in action. The dummy records damage and cannot die. Pause, slow playback, step 50 ms at a time, or restart the encounter. The arena does not award progression.

## Run and test locally

Serve the repository root with `python -m http.server 8000` and open `http://localhost:8000/`. The game loads PixiJS 8.15 from jsDelivr.

```sh
npm install
npm run typecheck
npm test
node test-wardog-v32.mjs
node test-mule-v34.mjs
node test-needle-v35.mjs
node test-needle-v36.mjs
node test-needle-v37.mjs
node test-needle-v311.mjs
node test-thruster-v313.mjs
node test-bestiary-v38.mjs
node test-district-v315.mjs
node --check app-v315.js
npx tsc --allowJs --checkJs --noEmit --strict --target es2022 --module nodenext wardog-v32.mjs
```

GitHub Pages publishes the root entry point, which loads `app-v315.js`. The TypeScript build targets the older gameplay source and emits `dist/main.js`. See `CLAUDE.md` for the release handoff.

## Mule grapple trial

Mules telegraph a grab with raised claws, then fire a three-round close-range burst for 3 base damage per completed burst. One, two, and three grabs reduce movement to 80%, 55%, and 25% respectively. Four pin the Bastion. Aiming and firing stay active. Pull away while you can move or destroy a Mule to break a pin. Mules have a brief regrab delay after a release.
