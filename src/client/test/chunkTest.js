import { World } from '../core/world/World.js';
import { IsometricRenderer } from '../core/renderer/IsometricRenderer.js';
import { TileManager } from '../core/world/TileManager.js';

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
        'grass_var1': createTempTexture('#8ec860'),
        'grass_var2': createTempTexture('#6eb840'),
        'dirt': createTempTexture('#8b4513'),
        'dirt_var1': createTempTexture('#9b5523'),
        'dirt_var2': createTempTexture('#7b3503'),
        'stone': createTempTexture('#808080'),
        'stone_mossy': createTempTexture('#708070'),
        'stone_cracked': createTempTexture('#606060'),
        'dec_flowers': createTempTexture('#ff0000'),
        'dec_flowers_var0': createTempTexture('#ff4444'),
        'dec_flowers_var1': createTempTexture('#ffff00'),
        'dec_rocks': createTempTexture('#696969'),
        'dec_rocks_var0': createTempTexture('#595959'),
        'dec_rocks_var1': createTempTexture('#797979'),
        'dec_grassTufts': createTempTexture('#90ee90'),
        'dec_grassTufts_var0': createTempTexture('#80dd80')
    };
    return Promise.resolve();
};

async function testChunkLoading() {
    // Create test canvas
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    document.body.appendChild(canvas);

    // Get debug elements
    const cameraPosElement = document.getElementById('cameraPos');
    const activeChunksElement = document.getElementById('activeChunks');

    // Initialize world with smaller chunks for testing
    const world = new World(128, 128, { chunkSize: 8 });
    const renderer = new IsometricRenderer(canvas);
    const tileManager = new TileManager();

    // Wait for textures
    await tileManager.loadTextures();

    // Mock camera for testing
    const camera = {
        x: 0,
        y: 0
    };

    // Test chunk loading at different positions
    const testPositions = [
        { x: 0, y: 0 },
        { x: 50, y: 50 },
        { x: -50, y: -50 },
        { x: 100, y: 100 }
    ];

    for (const pos of testPositions) {
        console.log(`Testing chunk loading at position: ${pos.x}, ${pos.y}`);
        
        camera.x = pos.x;
        camera.y = pos.y;
        
        // Update active chunks
        world.updateActiveChunks(pos.x, pos.y, 2);
        
        // Update debug display
        cameraPosElement.textContent = `${pos.x}, ${pos.y}`;
        activeChunksElement.textContent = world.activeChunks.size;
        
        // Render
        renderer.clear();
        renderer.render(world, camera, tileManager);
        
        // Log active chunks
        console.log('Active chunks:', Array.from(world.activeChunks));
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Add interactive movement with arrow keys
    document.addEventListener('keydown', (e) => {
        const moveSpeed = 10;
        switch(e.key) {
            case 'ArrowLeft':
                camera.x -= moveSpeed;
                break;
            case 'ArrowRight':
                camera.x += moveSpeed;
                break;
            case 'ArrowUp':
                camera.y -= moveSpeed;
                break;
            case 'ArrowDown':
                camera.y += moveSpeed;
                break;
        }

        // Update chunks and display
        world.updateActiveChunks(camera.x, camera.y, 2);
        cameraPosElement.textContent = `${Math.round(camera.x)}, ${Math.round(camera.y)}`;
        activeChunksElement.textContent = world.activeChunks.size;

        // Render
        renderer.clear();
        renderer.render(world, camera, tileManager);
    });
}

// Run test
testChunkLoading().catch(console.error);

