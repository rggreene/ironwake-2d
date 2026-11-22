"use strict";
/** IRONWAKE weapon geometry and targeting. Pure game math: no PIXI or DOM dependency. */
var WeaponKit;
(function (WeaponKit) {
    WeaponKit.TAU = Math.PI * 2;
    function direction(dx, dy) { return ((Math.round(Math.atan2(dx, dy) / (Math.PI / 4)) + 8) % 8); }
    WeaponKit.direction = direction;
    function bearing(dir) { return Math.PI / 2 - (dir % 8) * Math.PI / 4; }
    WeaponKit.bearing = bearing;
    function diff(a, b) { return Math.atan2(Math.sin(a - b), Math.cos(a - b)); }
    WeaponKit.diff = diff;
    function polarAngle(from, to) { return Math.atan2(to.y - from.y, to.x - from.x); }
    WeaponKit.polarAngle = polarAngle;
    function rotateLocal(local, dir) {
        // Local coordinates are authored in south-facing source art: x points screen-right, y screen-down.
        const r = -dir * Math.PI / 4, c = Math.cos(r), s = Math.sin(r);
        return { x: local.x * c - local.y * s, y: local.x * s + local.y * c };
    }
    WeaponKit.rotateLocal = rotateLocal;
    function inArc(origin, target, dir, arcDeg) {
        const half = Math.min(180, Math.max(0, arcDeg)) / 2 * Math.PI / 180;
        return Math.abs(diff(polarAngle(origin, target), bearing(dir))) <= half + 1e-9;
    }
    WeaponKit.inArc = inArc;
    function pickTarget(origin, targets, chassisDir, def, range) {
        let chosen, closest = range * range;
        for (const target of targets) {
            const dx = target.x - origin.x, dy = target.y - origin.y, r2 = dx * dx + dy * dy;
            if (r2 <= closest && inArc(origin, target, chassisDir, def.arcDegrees)) {
                chosen = target;
                closest = r2;
            }
        }
        return chosen;
    }
    WeaponKit.pickTarget = pickTarget;
    function solve(origin, target, chassisDir, def, stats) {
        if (!inArc(origin, target, chassisDir, def.arcDegrees))
            return null;
        const targetAngle = polarAngle(origin, target), dir = direction(target.x - origin.x, target.y - origin.y);
        let facing = def.aimMode === 'fixed-forward' ? chassisDir : dir;
        // A fixed full-body sprite can only fire along its drawn orientation. Turrets may aim freely.
        const correction = def.barrelCorrections?.[facing] ?? 0;
        const angle = def.aimMode === 'turret-independent' ? targetAngle : bearing(facing) + correction;
        // If a target is between sprite headings, accept only the nearest discrete heading.
        if (def.aimMode === 'body-snap' && Math.abs(diff(targetAngle, angle)) > Math.PI / 8 + 0.001)
            return null;
        // For fixed weapon slots, firing direction must still obey the configured forward arc.
        if (Math.abs(diff(angle, bearing(chassisDir))) > def.arcDegrees * Math.PI / 360 + 0.001)
            return null;
        const muzzleLocal = def.muzzle[facing], ejectionLocal = def.ejection[facing];
        if (!muzzleLocal || !ejectionLocal)
            throw Error(`Weapon ${def.id} missing facing anchor ${facing}`);
        const muzzle = { x: origin.x + muzzleLocal.x, y: origin.y + muzzleLocal.y };
        const ejection = { x: origin.x + ejectionLocal.x, y: origin.y + ejectionLocal.y };
        const count = Math.max(1, Math.min(64, Math.floor(stats.multishot)));
        const shotAngles = Array.from({ length: count }, (_, i) => angle + (i - (count - 1) / 2) * stats.spreadAngle);
        return { target, facing, angle, muzzle, ejection, shotAngles };
    }
    WeaponKit.solve = solve;
    function makeDirectionalAnchors(base) {
        return Array.from({ length: 8 }, (_, i) => rotateLocal(base, i));
    }
    WeaponKit.makeDirectionalAnchors = makeDirectionalAnchors;
    // Offsets are calibrated against the *complete* 64x96 illustrated Bastion atlas.
    // All values are relative to sprite pivot (32,48), scaled to world coordinates (1.08).
    const bastionMuzzle = [
        { x: 22, y: 7 }, { x: 28, y: 7 }, { x: 28, y: 0 }, { x: 26, y: -8 },
        { x: 10, y: -11 }, { x: -20, y: -7 }, { x: -29, y: 0 }, { x: -18, y: 8 }
    ];
    const bastionEjection = [
        { x: 5, y: 2 }, { x: 9, y: 1 }, { x: 10, y: -4 }, { x: 8, y: -8 },
        { x: 2, y: -7 }, { x: -8, y: -8 }, { x: -9, y: -3 }, { x: -5, y: 2 }
    ];
    WeaponKit.bastionAutocannon = {
        id: 'm14-autocannon', slot: 'right-hand', aimMode: 'body-snap', arcDegrees: 180,
        muzzle: bastionMuzzle, ejection: bastionEjection,
        recoilDistance: 4, projectileTexture: 'bullet', shellTexture: 'shell', soundHz: 70
    };
    function validateDefinition(w) {
        if (w.muzzle.length !== 8 || w.ejection.length !== 8)
            throw Error(`${w.id}: expected eight per-direction anchors`);
        if (w.arcDegrees <= 0 || w.arcDegrees > 360 || w.recoilDistance < 0 || (w.fireIntervalMultiplier !== undefined && w.fireIntervalMultiplier <= 0))
            throw Error(`${w.id}: invalid weapon configuration`);
        for (const p of [...w.muzzle, ...w.ejection])
            if (!Number.isFinite(p.x) || !Number.isFinite(p.y))
                throw Error(`${w.id}: invalid anchor`);
    }
    WeaponKit.validateDefinition = validateDefinition;
})(WeaponKit || (WeaponKit = {}));

// Browser-independent geometry and weapon targeting; generated from src/weaponSystem.ts.
