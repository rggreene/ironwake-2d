// Atlas order, left to right over three rows of six 24px tiles.
const ids = [
    'unlock-pd', 'unlock-grenade', 'unlock-missile', 'pd-boost', 'grenade-boost', 'missile-boost',
    'loading', 'overclock', 'ammo', 'armor', 'servo', 'pickup',
    'scatter', 'cluster', 'pierce', 'evo-buzzsaw', 'evo-reaper', 'evo-swarm'
];

export function upgradeIconPosition(id) {
    const index = ids.indexOf(id);
    return index < 0 ? null : `${index % 6 * 20}% ${Math.floor(index / 6) * 50}%`;
}
