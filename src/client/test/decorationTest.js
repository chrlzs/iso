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
        'grass': createTempTexture('#7ec850'),
        'dirt': createTempTexture('#8b4513'),
        'stone': createTempTexture('#808080'),
        'dec_flowers': createTempTexture('#ff0000'),
        'dec_rocks': createTempTexture('#696969'),
        'dec_grassTufts': createTempTexture('#90ee90')
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
            { type: 'grass', height: 0, decoration: null },
            { type: 'grass', height: 0, decoration: {
                type: 'flowers',
                offset: { x: 0, y: -8 },
                scale: { x: 0.5, y: 0.5 }
            }}
        ],
        [
            { type: 'grass', height: 0, decoration: {
                type: 'rocks',
                offset: { x: 0, y: -4 },
                scale: { x: 0.6, y: 0.6 }
            }},
            { type: 'grass', height: 0, decoration: {
                type: 'grassTufts',
                offset: { x: 0, y: -6 },
                scale: { x: 0.7, y: 0.7 }
            }}
        ]
    ];

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

