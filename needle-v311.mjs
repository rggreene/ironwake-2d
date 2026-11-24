export { NEEDLE_LANE, NEEDLE_SHOT, needleState } from './needle-v37.mjs';
import { advanceNeedle as advance } from './needle-v37.mjs';

// Screen Y increases downward. Decreasing the angle sweeps counterclockwise.
export const NEEDLE_SWEEP = [Math.PI / 4, 0, -Math.PI / 4];

export function advanceNeedle(state, dt, x, y, speed, targetX, targetY, originFor, fire) {
    return advance(state, dt, x, y, speed, targetX, targetY, originFor, (angle, mx, my) => {
        fire(angle + NEEDLE_SWEEP[state.rounds], mx, my);
    });
}
