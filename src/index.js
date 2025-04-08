import { Game } from './core/Game.js';
import { Character } from './entities/Character.js';
import { Structure } from './entities/Structure.js';
import { Item } from './entities/Item.js';
import { Enemy } from './entities/Enemy.js';
import { testPixiRendering } from './test-pixi.js';
import { FallbackRenderer } from './rendering/FallbackRenderer.js';
import { isPixiAvailable } from './utils/PixiWrapper.js';

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if PIXI is available
    const pixiAvailable = isPixiAvailable();
    console.log('PIXI available:', pixiAvailable);

    if (!pixiAvailable) {
        console.warn('PIXI.js is not available. Using fallback renderer.');

        // Create fallback renderer
        const fallbackRenderer = new FallbackRenderer({
            container: document.getElementById('game-container'),
            width: window.innerWidth,
            height: window.innerHeight,
            tileWidth: 64,
            tileHeight: 32,
            gridWidth: 20,
            gridHeight: 20
        });

        // Set up keyboard input handling
        const keys = new Set();

        window.addEventListener('keydown', (e) => {
            keys.add(e.key.toLowerCase());
            fallbackRenderer.handleInput(keys);
        });

        window.addEventListener('keyup', (e) => {
            keys.delete(e.key.toLowerCase());
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            fallbackRenderer.resize(window.innerWidth, window.innerHeight);
        });

        console.log('Fallback renderer initialized.');
        return;
    }

    // Test PIXI rendering
    const pixiTestSuccessful = testPixiRendering();

    if (!pixiTestSuccessful) {
        console.error('PIXI test failed. Not initializing game.');
        document.getElementById('game-container').innerHTML = '<div style="color: white; padding: 20px;">PIXI.js initialization failed. Check console for errors.</div>';
        return;
    }

    // Clear the test canvas
    document.getElementById('game-container').innerHTML = '';
    // Create game instance
    const game = new Game({
        container: document.getElementById('game-container'),
        width: window.innerWidth,
        height: window.innerHeight,
        debug: true,
        worldWidth: 20,
        worldHeight: 20,
        generateWorld: true,
        createPlayer: true,
        dayDuration: 300, // 5 minutes per day
        startTime: 8, // Start at 8 AM
        tileWidth: 64,
        tileHeight: 32,

        // Custom tile click handler
        onTileClick: (tile, game) => {
            // If player exists, move to the clicked tile
            if (game.player && game.world) {
                // Get the world position of the tile
                const worldPos = game.world.gridToWorld(tile.gridX, tile.gridY);
                console.log(`Tile click: Moving player to tile (${tile.gridX}, ${tile.gridY}) at world position (${worldPos.x}, ${worldPos.y})`);
                game.player.setMoveTarget(worldPos);
            }
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        game.resize(window.innerWidth, window.innerHeight);
    });

    // Create a simple HTML overlay for tile coordinates
    if (game.options.debug) {
        // Create a small, unobtrusive button to toggle coordinate display
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'C';
        toggleButton.title = 'Toggle Tile Coordinates';
        toggleButton.style.position = 'fixed';
        toggleButton.style.bottom = '10px';
        toggleButton.style.right = '10px';
        toggleButton.style.zIndex = '1000';
        toggleButton.style.padding = '3px 6px';
        toggleButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        toggleButton.style.color = '#fff';
        toggleButton.style.border = '1px solid rgba(255, 255, 255, 0.3)';
        toggleButton.style.borderRadius = '3px';
        toggleButton.style.cursor = 'pointer';
        toggleButton.style.fontSize = '10px';
        toggleButton.style.opacity = '0.7';
        toggleButton.style.transition = 'opacity 0.3s';
        document.body.appendChild(toggleButton);

        // Make button more visible on hover
        toggleButton.addEventListener('mouseover', () => {
            toggleButton.style.opacity = '1';
        });
        toggleButton.addEventListener('mouseout', () => {
            toggleButton.style.opacity = '0.7';
        });

        // Create container for coordinate labels
        const coordContainer = document.createElement('div');
        coordContainer.id = 'coord-overlay';
        coordContainer.style.position = 'absolute';
        coordContainer.style.top = '0';
        coordContainer.style.left = '0';
        coordContainer.style.width = '100%';
        coordContainer.style.height = '100%';
        coordContainer.style.pointerEvents = 'none';
        coordContainer.style.display = 'none';
        document.getElementById('game-container').appendChild(coordContainer);

        // Toggle coordinate display
        toggleButton.addEventListener('click', () => {
            if (coordContainer.style.display === 'none') {
                coordContainer.style.display = 'block';
                toggleButton.textContent = 'C✓';
                toggleButton.style.backgroundColor = 'rgba(0, 128, 0, 0.5)';
                updateCoordinates();
            } else {
                coordContainer.style.display = 'none';
                toggleButton.textContent = 'C';
                toggleButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            }
        });

        // Function to update coordinate labels
        function updateCoordinates() {
            // Clear existing labels
            coordContainer.innerHTML = '';

            // Only proceed if the overlay is visible
            if (coordContainer.style.display === 'none') return;

            // Create labels for each tile
            for (let x = 0; x < game.world.gridWidth; x++) {
                for (let y = 0; y < game.world.gridHeight; y++) {
                    const tile = game.world.getTile(x, y);
                    if (tile) {
                        // Convert tile position to screen coordinates
                        const screenPos = game.world.worldToScreen(tile.x, tile.y);

                        // Create label element
                        const label = document.createElement('div');
                        label.textContent = `${x},${y}`;
                        label.style.position = 'absolute';
                        label.style.left = `${screenPos.x}px`;
                        label.style.top = `${screenPos.y}px`;
                        label.style.transform = 'translate(-50%, -50%)';
                        label.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
                        label.style.color = 'rgba(255, 255, 0, 0.7)';
                        label.style.padding = '1px 3px';
                        label.style.borderRadius = '2px';
                        label.style.fontSize = '10px';
                        label.style.fontFamily = 'Arial, sans-serif';
                        label.style.textAlign = 'center';
                        label.style.minWidth = '20px';
                        label.style.pointerEvents = 'none';

                        // Add to container
                        coordContainer.appendChild(label);
                    }
                }
            }
        }

        // Update coordinates periodically instead of on every camera update
        // This is more efficient and less intrusive
        let updateTimer = null;

        // Update coordinates when camera moves, but throttled
        const originalUpdateCamera = game.world.updateCamera;
        game.world.updateCamera = function() {
            originalUpdateCamera.call(game.world);

            // Only schedule an update if coordinates are visible and no update is pending
            if (coordContainer.style.display !== 'none' && !updateTimer) {
                // Throttle updates to once every 500ms for better performance
                updateTimer = setTimeout(() => {
                    updateCoordinates();
                    updateTimer = null;
                }, 500);
            }
        };

        // Also update coordinates on window resize
        window.addEventListener('resize', () => {
            if (coordContainer.style.display !== 'none') {
                updateCoordinates();
            }
        });
    }

    // Log success message
    console.log('Game initialized successfully!');
    console.log('Controls:');
    console.log('- WASD: Move camera');
    console.log('- QE: Zoom in/out');
    console.log('- Left Click: Select tile');
    console.log('- Right Click: Move player to tile');
    console.log('- Shift+Click: Place house');
    console.log('- T: Place tree');
    console.log('- R: Place rock');
    console.log('- F: Place item');
    console.log('- X: Place enemy');
    console.log('- I: Toggle inventory');
    console.log('- P: Pause/resume time');
    console.log('- T (hold Shift): Toggle time speed');
});

