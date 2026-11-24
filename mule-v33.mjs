// The original painted Mule strip faces screen-left.
const FRAME_DISTANCE = 40 / 4.4;
const IMPACT_TIME = .16;

/** @param {number} facing @param {number} vx */
export function muleFacing(facing, vx) {
    if (vx > .18) return -1;
    if (vx < -.18) return 1;
    return facing;
}

/** @param {number} distance @param {number} seed */
export function muleFrame(distance, seed) {
    return Math.floor(distance / FRAME_DISTANCE + seed) % 4;
}

/** @param {number} attackTimer @param {number} attackInterval */
export function muleCompression(attackTimer, attackInterval) {
    const remaining = Math.max(0, IMPACT_TIME + attackTimer - attackInterval);
    return 1 - Math.min(1, remaining / IMPACT_TIME) * .12;
}
