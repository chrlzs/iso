/*
 * A fast javascript implementation of simplex noise by Jonas Wagner
 *
 * Based on a speed-improved simplex noise algorithm for 2D, 3D and 4D in Java.
 * Which is based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * With Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 */

class SimplexNoise {
    constructor(seed = Math.random()) {
        this.p = new Uint8Array(256);
        this.perm = new Uint8Array(512);
        this.permMod12 = new Uint8Array(512);
        this.grad3 = new Float32Array([
            1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0,
            1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1,
            0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1
        ]);
        
        const random = this.mulberry32(seed);
        
        for (let i = 0; i < 256; i++) {
            this.p[i] = i;
        }

        for (let i = 255; i > 0; i--) {
            const r = Math.floor(random() * (i + 1));
            const tmp = this.p[i];
            this.p[i] = this.p[r];
            this.p[r] = tmp;
        }

        for (let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
            this.permMod12[i] = this.perm[i] % 12;
        }
    }

    mulberry32(seed) {
        return function() {
            seed = seed + 0x6D2B79F5 | 0;
            var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = Math.imul(t + (t << 7 | t >>> 25), 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
    }

    noise2D(xin, yin) {
        const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
        const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
        
        let n0 = 0, n1 = 0, n2 = 0;

        const s = (xin + yin) * F2;
        let i = Math.floor(xin + s);
        let j = Math.floor(yin + s);
        const t = (i + j) * G2;
        
        const X0 = i - t;
        const Y0 = j - t;
        const x0 = xin - X0;
        const y0 = yin - Y0;

        let i1, j1;
        if (x0 > y0) {
            i1 = 1;
            j1 = 0;
        } else {
            i1 = 0;
            j1 = 1;
        }

        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1.0 + 2.0 * G2;
        const y2 = y0 - 1.0 + 2.0 * G2;

        const ii = i & 255;
        const jj = j & 255;

        const t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 >= 0) {
            const gi0 = this.permMod12[ii + this.perm[jj]] * 3;
            const t0_2 = t0 * t0;
            n0 = t0_2 * t0_2 * (this.grad3[gi0] * x0 + this.grad3[gi0 + 1] * y0);
        }

        const t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 >= 0) {
            const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]] * 3;
            const t1_2 = t1 * t1;
            n1 = t1_2 * t1_2 * (this.grad3[gi1] * x1 + this.grad3[gi1 + 1] * y1);
        }

        const t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 >= 0) {
            const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]] * 3;
            const t2_2 = t2 * t2;
            n2 = t2_2 * t2_2 * (this.grad3[gi2] * x2 + this.grad3[gi2 + 1] * y2);
        }

        return 70.0 * (n0 + n1 + n2);
    }
}

export { SimplexNoise };
