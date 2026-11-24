export const GRAB_RANGE = 24;
export const STRUGGLE_DISTANCE = 27;
export const GRAB_SPEED = [1, .8, .55, .25, 0];
export const REACH_TIME = .28;
export const FIRST_BURST = .34;
export const ROUND_INTERVAL = .075;
export const RELEASE_TIME = .85;

export function gripSpeed(count) {
    return GRAB_SPEED[Math.min(count, GRAB_SPEED.length - 1)];
}

export function grabState() {
    return { mode: 'chase', timer: 0, escape: 0, rounds: 0, angle: 0 };
}
