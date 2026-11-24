// Bearings are clockwise from north. Atlas coordinates are native 48px pixels.
export const CELL = 48;
export const SCALE = 2;
export const COOLDOWN = 5;
export const BEARINGS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const rings = [[27,14],[24,13],[22,15],[22,13],[23,12],[26,13],[23,15],[23,14]];
const tips = [[24,4],[42,12],[40,22],[42,32],[24,34],[6,32],[7,22],[6,12]];

/** @param {number} heading */
export function bearing(heading) {
    return wrap(Math.round(heading / (Math.PI / 4)), 8);
}

/** @param {number} value @param {number} size */
export function wrap(value, size) {
    return ((value % size) + size) % size;
}

/** @param {number} dir */
export function angle(dir) {
    return (dir - 2) * Math.PI / 4;
}

/** @param {number} hull @param {number} turret @param {number} recoil @param {boolean} illustrated */
export function pose(hull, turret, recoil, illustrated) {
    const a = angle(turret);
    const [ringX, ringY] = illustrated ? rings[hull] : [24, 24];
    const x = (ringX - 24) * SCALE;
    const y = (ringY - 24) * SCALE;
    const [tipX, tipY] = tips[turret];
    const muzzleX = x + (illustrated ? (tipX - 24) * SCALE : Math.cos(a) * 43);
    const muzzleY = y + (illustrated ? (tipY - 24) * SCALE : Math.sin(a) * 43);
    return {
        a, muzzleX, muzzleY, mountX: x, mountY: y,
        x: x - Math.cos(a) * recoil * 4,
        y: y - Math.sin(a) * recoil * 4,
        row: recoil > .34 ? 1 : 0
    };
}

/** @param {string | URL} url @param {number} rows */
async function loadSheet(url, rows) {
    const img = new Image();
    img.src = String(url);
    await img.decode();
    if (img.naturalWidth !== CELL * BEARINGS.length || img.naturalHeight !== CELL * rows) {
        throw new Error('Unexpected Wardog atlas dimensions: ' + url);
    }
    return img;
}

export function loadSheets() {
    return Promise.all([
        loadSheet(new URL('./assets/wardog/compact-wardog-hull-v32.png?v=32', import.meta.url), 4),
        loadSheet(new URL('./assets/wardog/compact-wardog-turret-v32.png?v=32', import.meta.url), 2)
    ]);
}

/** @param {CanvasRenderingContext2D} ctx @param {HTMLImageElement} img @param {number} dir @param {number} phase @param {number} x @param {number} y */
export function drawCell(ctx, img, dir, phase, x, y) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, dir * CELL, phase * CELL, CELL, CELL, x, y, CELL * SCALE, CELL * SCALE);
}
