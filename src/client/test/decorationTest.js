import { TileManager } from '../core/world/TileManager.js';
import { IsometricRenderer } from '../core/renderer/IsometricRenderer.js';

// Create temporary canvas textures for testing
function createTempTexture(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 64, 32);
    return canvas;
}

// Override texture loading for testing
TileManager.prototype.loadTextures = function() {
    // Create basic colored rectangles for testing
    this.textures = {
        'concrete': createTempTexture('#808080'),
        'asphalt': createTempTexture('#404040'),
        'metal': createTempTexture('#A0A0A0'),
        'dec_cameras': createTempTexture('#404040'),
        'dec_terminals': createTempTexture('#00FF00'),
        'dec_drones': createTempTexture('#202020'),
        'dec_dumpster': createTempTexture('#2F4F4F')  // Add dumpster texture
    };
    return Promise.resolve();
};

async function runTest() {
    // Basic test setup for decorations
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    document.body.appendChild(canvas);

    // Initialize managers and renderer
    const tileManager = new TileManager();
    const renderer = new IsometricRenderer(canvas);

    // Wait for textures to load
    await tileManager.loadTextures();

    // Create a simple test grid
    const testGrid = [
        [
            { type: 'asphalt', height: 0, decoration: {
                type: 'dumpster',
                texture: 'dec_dumpster',
                offset: { x: -16, y: -16 },  // Offset to position it properly on the tile
                scale: { x: 1.2, y: 1.2 }    // Slightly larger than default
            }},
            { type: 'asphalt', height: 0, decoration: null }
        ]
    ];

    console.log('Test grid with decorations:', testGrid);

    // Center the view
    renderer.ctx.translate(canvas.width / 2, canvas.height / 2);

    // Render test grid
    renderer.clear();
    for (let y = 0; y < testGrid.length; y++) {
        for (let x = 0; x < testGrid[y].length; x++) {
            renderer.renderTile(x, y, testGrid[y][x], tileManager);
        }
    }
}

// Run test
runTest().catch(console.error);




