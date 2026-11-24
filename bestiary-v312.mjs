export const bestiary = {
    worker: { range: 75, pattern: 'Reaches with labor claws, latches, and fires a close-range burst. Four grips pin the Bastion.' },
    tank: { range: 235, pattern: 'Brakes and aims before firing. The hull pivots, drives forward, or reverses while the turret tracks independently.' },
    light: { range: 285, pattern: 'Flanks, cants its machine pistol, fires a counterclockwise burst, then sidesteps and recovers.' },
    heavy: { range: 72, pattern: 'Advances steadily, spreads out around other heavies, and deals contact damage.' },
    prototype: { range: 105, pattern: 'Weaves on approach, then surges forward with a brief dash.' },
    boss: { range: 215, pattern: 'Telegraphs a three-shot spread and advances between volleys.' },
    mixed: { range: 245, pattern: 'Watch a Mule pack, a Wardog, and a Needle attack the same dummy.' }
};

export function labFormation(kind, count, range) {
    if (kind === 'mixed') return [
        ...labFormation('worker', 4, 70),
        { kind: 'tank', angle: Math.PI * .82, range },
        { kind: 'light', angle: Math.PI * .15, range }
    ];
    const angles = count === 1 ? [Math.PI] : [-2.6, -1.05, .55, 2.1];
    return angles.map(angle => ({kind, angle, range}));
}

export function dummyPosition(mode, time) {
    if (mode === 'strafe') return [0, Math.sin(time * 1.35) * 62];
    if (mode === 'orbit') return [Math.sin(time * .95) * 60, (Math.cos(time * .95) - 1) * 48];
    return [0, 0];
}

export function labStage(enemy, contactInterval) {
    if (enemy.grip) return enemy.grip.mode;
    if (enemy.needle) return enemy.needle.mode;
    if (enemy.kind === 'tank') return enemy.tankState;
    if (enemy.windup > 0) return 'windup';
    if (enemy.dashLeft > 0) return 'dash';
    return enemy.attack > contactInterval - .22 ? 'recover' : 'approach';
}
