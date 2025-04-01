/**
 * Simplified Perlin Noise implementation
 */
export const noise = {
    // Creates a 2D noise function
    createNoise2D() {
        const perm = new Array(512);
        
        // Initialize permutation table
        for (let i = 0; i < 256; i++) {
            perm[i] = perm[i + 256] = Math.random();
        }

        return function(x, y) {
            // Find unit square that contains point
            const X = Math.floor(x);
            const Y = Math.floor(y);
            
            // Get relative xy coordinates of point within square
            x = x - X;
            y = y - Y;
            
            // Compute fade curves for x and y
            const u = fade(x);
            const v = fade(y);

            // Hash coordinates of the 4 square corners
            const A = perm[X] + Y;
            const B = perm[X + 1] + Y;
            
            // Interpolate between corner values
            return lerp(
                v,
                lerp(u, perm[A], perm[B]),
                lerp(u, perm[A + 1], perm[B + 1])
            ) * 2 - 1;
        };
    }
};

// Helper functions
function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(t, a, b) {
    return a + t * (b - a);
}
