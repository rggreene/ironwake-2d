# IRONWAKE 2D v1.4 — Industrial Escalation

Playable PixiJS / TypeScript bullet-heaven proof of concept.

## Changes

The initial enemy progression now includes **MW-1 Mule** mobile worker (start), **SV-2 Wardog** security tank (after 1:05), **LS-4 Needle** light combat suit (after 2:15), and **HS-7 Bulwark** heavy suit (after 3:55). A rare **PX-1 Viper** prototype arrives from 5:30 onward; a single **MA-0 Goliath** mobile-armor boss is scheduled first at 7:00, with at least seven minutes between subsequent bosses and never more than one boss alive. The prototype and Goliath art are placeholders pending unique production art.

The roster is data-driven in `src/enemyRoster.ts`, while regular enemy composition and threat growth remain configurable through `src/difficultyDirector.ts`. Tanks fire slow, readable projectiles; others pressure via contact; later waves introduce heavier suits. The Standard threat budget, swarm cap and early enemy HP have been reduced so players with a straight-forward weapon have room to experiment.

The Bastion's starting autocannon has a shorter firing interval, more damage and a **centerline muzzle anchor** with a subtle forward guide. The gun still fires continuously straight along the movement-facing direction with multishot and all existing upgrades intact. Its 8-direction sprite atlas, red startup LED, persistent armor, salvage saves and phone joystick remain.

## Local testing

Run `python -m http.server 8000` from this folder and browse `http://localhost:8000/`. PixiJS loads from the CDN, so an internet connection is required.

`npx tsc --noEmit` validates TypeScript, and the `node test-roster.cjs`, `node test-forward.cjs`, `node test-visual.cjs` suites check the current gameplay architecture. Browser WebGL startup must still be checked on a real browser/phone.

## Design caveat

These are an initial balancing pass, not final live-tuned statistics. Large elite and boss art, collision, attacks and TTK will be refined in playtesting. The game is single-player and uses localStorage for salvage ownership.