export const THRUSTER_DURATION = .24;
export const THRUSTER_COOLDOWN = 2.4;

export function createThruster() {
    return { x: 0, y: 0, remaining: 0, cooldown: 0 };
}

export function igniteThruster(state, x, y, grip) {
    const magnitude = Math.hypot(x, y);
    if (state.cooldown > 0 || grip <= 0 || magnitude <= .18) return false;
    state.x = x / magnitude;
    state.y = y / magnitude;
    state.remaining = THRUSTER_DURATION;
    state.cooldown = THRUSTER_COOLDOWN;
    return true;
}

export function advanceThruster(state, dt, grip) {
    state.cooldown = Math.max(0, state.cooldown - dt);
    if (grip <= 0) state.remaining = 0;
    const active = Math.min(state.remaining, dt);
    const start = state.remaining / THRUSTER_DURATION;
    state.remaining -= active;
    const end = state.remaining / THRUSTER_DURATION;
    // Integrate the falling thrust over the active part of the frame.
    const travel = active * (1.6 + 1.55 * (start + end) / 2) * grip;
    return { active, travel, strength: end };
}
