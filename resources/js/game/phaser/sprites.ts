import type Phaser from 'phaser';

/**
 * Sprite Fadlan: potong sheet + buang background papan catur,
 * daftarkan sebagai texture frame per frame ke Phaser.
 */

const COLS = [31, 165, 298, 429, 562];
const ROWS = { idle: 80, walk: 428, run: 827, jump: 1132 };

function keyOut(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const data = ctx.getImageData(0, 0, w, h);
    const px = data.data;
    const isBg = (i: number): boolean => {
        const r = px[i];
        const g = px[i + 1];
        const b = px[i + 2];
        const mx = Math.max(r, g, b);
        const mn = Math.min(r, g, b);

        return mx > 165 && mx - mn < 30;
    };
    const seen = new Uint8Array(w * h);
    const stack: number[] = [];
    const push = (x: number, y: number): void => {
        if (x < 0 || y < 0 || x >= w || y >= h) {
            return;
        }

        const n = y * w + x;

        if (seen[n]) {
            return;
        }

        seen[n] = 1;

        if (isBg(n * 4)) {
            stack.push(n);
        }
    };

    for (let x = 0; x < w; x++) {
        push(x, 0);
        push(x, h - 1);
    }

    for (let y = 0; y < h; y++) {
        push(0, y);
        push(w - 1, y);
    }

    while (stack.length > 0) {
        const n = stack.pop() as number;
        px[n * 4 + 3] = 0;
        const x = n % w;
        const y = (n / w) | 0;
        push(x + 1, y);
        push(x - 1, y);
        push(x, y + 1);
        push(x, y - 1);
    }

    ctx.putImageData(data, 0, 0);
}

function slice(
    scene: Phaser.Scene,
    img: HTMLImageElement,
    key: string,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
): void {
    if (scene.textures.exists(key)) {
        return;
    }

    const cv = document.createElement('canvas');
    cv.width = sw;
    cv.height = sh;
    const ctx = cv.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
        return;
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    keyOut(ctx, sw, sh);
    scene.textures.addCanvas(key, cv);
}

export function registerFadlan(
    scene: Phaser.Scene,
    img: HTMLImageElement,
): void {
    for (let i = 0; i < 5; i++) {
        slice(
            scene,
            img,
            `fadlan-walk-${i}`,
            COLS[i] ?? 31,
            ROWS.walk,
            100,
            246,
        );
    }

    slice(scene, img, 'fadlan-idle', 298, ROWS.idle, 100, 238);
    slice(scene, img, 'fadlan-jump', 289, ROWS.jump, 112, 375);
}

export function loadFadlanImage(): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('sprite gagal dimuat'));
        img.src = '/sprites/fadlan.jpg';
    });
}
