export const NEEDLE_SHOT = { speed: 166, damage: 3, life: 1.25, flash: .58 };
export const NEEDLE_RANGE = 128;
const BRACE_TIME = .58;
const ROUND_TIME = .095;
const SLIP_TIME = .24;
const RECOVER_TIME = .55;

export function needleState(side, delay) {
    return { mode: 'flank', side, facing: 1, timer: delay, angle: 0, rounds: 0, stride: 0, muzzleX: 0, muzzleY: 0 };
}

export function advanceNeedle(state, dt, x, y, speed, targetX, targetY, originFor, fire) {
    const dx = targetX - x, dy = targetY - y;
    const distance = Math.max(.001, Math.hypot(dx, dy));
    state.timer -= dt;
    let vx = 0, vy = 0;
    switch (state.mode) {
        case 'flank': {
            const radial = distance > NEEDLE_RANGE ? 1 : Math.max(-.8, (distance - 83) / 32);
            const lateral = distance > NEEDLE_RANGE * 1.5 ? .24 : .94;
            vx = dx / distance * radial - dy / distance * lateral * state.side;
            vy = dy / distance * radial + dx / distance * lateral * state.side;
            const magnitude = Math.max(1, Math.hypot(vx, vy));
            vx = vx / magnitude * speed;
            vy = vy / magnitude * speed;
            if (state.timer <= 0 && distance <= NEEDLE_RANGE && distance >= 36) {
                const [mx, my] = originFor(dx);
                state.muzzleX = mx;
                state.muzzleY = my;
                state.angle = Math.atan2(targetY - my, targetX - mx);
                state.mode = 'brace';
                state.timer = BRACE_TIME;
                vx = vy = 0;
            }
            break;
        }
        case 'brace':
        case 'burst':
            if (state.timer <= 0) {
                state.mode = 'burst';
                fire(state.angle, state.muzzleX, state.muzzleY);
                state.rounds++;
                state.timer += ROUND_TIME;
                if (state.rounds === 3) {
                    state.rounds = 0;
                    state.mode = 'slip';
                    state.timer = SLIP_TIME;
                }
            }
            break;
        case 'slip':
            vx = (-Math.sin(state.angle) * state.side - Math.cos(state.angle) * .28) * speed * 2.45;
            vy = (Math.cos(state.angle) * state.side - Math.sin(state.angle) * .28) * speed * 2.45;
            if (state.timer <= 0) {
                state.mode = 'recover';
                state.timer = RECOVER_TIME;
                vx = vy = 0;
            }
            break;
        case 'recover':
            if (state.timer <= 0) {
                state.mode = 'flank';
                state.timer = .85;
                state.side *= -1;
            }
            break;
    }
    state.stride += Math.hypot(vx, vy) * dt;
    return [vx * dt, vy * dt];
}
