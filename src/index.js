import { Game } from './core/Game.js';
import { testPixiRendering } from './test-pixi.js';
import { FallbackRenderer } from './rendering/FallbackRenderer.js';
import { isPixiAvailable } from './utils/PixiWrapper.js';
import { DebugOverlay } from './utils/DebugOverlay.js';

/**
 * Sets up the chunk debug panel
 * @param {Game} game - The game instance
 */
function setupChunkDebugPanel(game) {
    // Get debug elements
    const playerPosElement = document.getElementById('player-pos');
    const chunkPosElement = document.getElementById('chunk-pos');
    const activeChunksElement = document.getElementById('active-chunks');
    const totalChunksElement = document.getElementById('total-chunks');
    const storedChunksElement = document.getElementById('stored-chunks');
    const worldIdElement = document.getElementById('world-id');
    const worldSeedElement = document.getElementById('world-seed');

    // Update debug info every 500ms
    setInterval(() => {
        // Update player position
        if (game.player) {
            playerPosElement.textContent = `Player: (${game.player.gridX}, ${game.player.gridY})`;

            // Calculate chunk position
            const chunkX = Math.floor(game.player.gridX / game.options.chunkSize);
            const chunkY = Math.floor(game.player.gridY / game.options.chunkSize);
            chunkPosElement.textContent = `Chunk: (${chunkX}, ${chunkY})`;
        }

        // Update chunk info
        if (game.world) {
            activeChunksElement.textContent = `Active Chunks: ${game.world.activeChunks.size}`;
            totalChunksElement.textContent = `Total Chunks: ${game.world.chunks.size}`;
            worldIdElement.textContent = `World ID: ${game.options.worldId}`;
            worldSeedElement.textContent = `Seed: ${game.world.seed}`;

            // Count stored chunks
            let chunkCount = 0;
            let totalStorageSize = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`isogame_chunk_${game.options.worldId}`)) {
                    chunkCount++;
                    totalStorageSize += localStorage.getItem(key).length * 2; // Approximate size in bytes
                }
            }
            storedChunksElement.textContent = `Stored Chunks: ${chunkCount} (${Math.round(totalStorageSize / 1024)} KB)`;
        }
    }, 500);
}

/**
 * Sets up the world management UI
 * @param {Game} game - The game instance
 */
function setupWorldManagementUI(game) {
    // Get UI elements
    const worldManagement = document.getElementById('world-management');
    const toggleButton = document.getElementById('toggle-world-management');
    const closeButton = document.getElementById('close-world-management');
    const worldIdInput = document.getElementById('world-id-input');
    const saveButton = document.getElementById('save-world');
    const loadButton = document.getElementById('load-world');
    const newButton = document.getElementById('new-world');
    const clearButton = document.getElementById('clear-world');
    const statusDiv = document.getElementById('world-status');

    // World info elements
    const currentWorldId = document.getElementById('current-world-id');
    const currentWorldSeed = document.getElementById('current-world-seed');
    const currentWorldChunks = document.getElementById('current-world-chunks');
    const currentWorldStorage = document.getElementById('current-world-storage');
    const currentWorldTimestamp = document.getElementById('current-world-timestamp');

    // Set initial world ID
    worldIdInput.value = game.options.worldId;
    currentWorldId.textContent = game.options.worldId;

    // Toggle world management panel
    toggleButton.addEventListener('click', () => {
        worldManagement.style.display = 'block';
        toggleButton.style.display = 'none';
        updateWorldStatus();
    });

    // Close world management panel
    closeButton.addEventListener('click', () => {
        worldManagement.style.display = 'none';
        toggleButton.style.display = 'block';
    });

    // Save world
    saveButton.addEventListener('click', () => {
        const worldState = game.saveWorldState();
        updateWorldStatus('World saved successfully!');
        console.log('World saved:', worldState);
    });

    // Load world
    loadButton.addEventListener('click', () => {
        const worldId = worldIdInput.value.trim();
        if (worldId && worldId !== game.options.worldId) {
            // Switch to the new world
            switchWorld(worldId);
        } else {
            // Reload current world
            console.log('Attempting to load world state...');

            // Reset player creation flag to allow recreation if needed
            game.playerCreationAttempted = false;

            const success = game.loadWorldState();
            if (success) {
                updateWorldStatus('World loaded successfully!');
                console.log('World loaded successfully');

                // Ensure player is visible
                if (game.player) {
                    game.player.visible = true;
                    game.player.alpha = 1.0;
                    console.log(`Player position: (${game.player.gridX}, ${game.player.gridY})`);
                } else {
                    console.warn('Player not found after loading world, will be recreated');
                }
            } else {
                updateWorldStatus('No saved world found!', true);
                console.warn('No saved world found');
            }
        }
    });

    // Generate new world
    newButton.addEventListener('click', () => {
        if (confirm('Generate a new world? This will not affect stored data.')) {
            // Reset player creation flag to allow recreation
            game.playerCreationAttempted = false;

            // Generate new world with random seed
            const newSeed = Math.floor(Math.random() * 1000000);
            console.log(`Generating new world with seed ${newSeed}`);

            game.generateWorld({
                clearStorage: false,
                seed: newSeed,
                createPlayer: true
            });

            // Update world info in UI
            currentWorldSeed.textContent = game.world.seed;
            updateWorldStatus(`New world generated with seed ${newSeed}!`);

            // Ensure player is visible and active
            if (game.player) {
                game.player.visible = true;
                game.player.alpha = 1.0;
                game.player.active = true;
                console.log(`Player created at position (${game.player.gridX}, ${game.player.gridY})`);
            } else {
                console.warn('Player not created after generating new world');
            }
        }
    });

    // Clear world data
    clearButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all saved data for this world? This cannot be undone.')) {
            const success = game.clearSavedData();
            if (success) {
                updateWorldStatus('World data cleared!');
            } else {
                updateWorldStatus('Failed to clear world data!', true);
            }
        }
    });

    // Function to switch to a different world
    function switchWorld(worldId) {
        // Save current world state
        game.saveWorldState();

        // Update game options
        game.options.worldId = worldId;

        // Update world ID in UI
        worldIdInput.value = worldId;
        currentWorldId.textContent = worldId;

        // Reset player creation flag to allow recreation if needed
        game.playerCreationAttempted = false;

        // Try to load the world state
        console.log(`Attempting to load world: ${worldId}`);
        const success = game.loadWorldState();

        if (success) {
            updateWorldStatus(`Switched to world: ${worldId}`);
            console.log(`Successfully loaded world: ${worldId} with seed ${game.world.seed}`);

            // Ensure player is visible
            if (game.player) {
                game.player.visible = true;
                game.player.alpha = 1.0;
                console.log(`Player position: (${game.player.gridX}, ${game.player.gridY})`);
            } else {
                console.warn('Player not found after switching worlds, will be recreated');
            }
        } else {
            // If no saved state, generate a new world
            const newSeed = Math.floor(Math.random() * 1000000);
            console.log(`No saved state found for world: ${worldId}, generating new world with seed ${newSeed}`);

            game.generateWorld({
                clearStorage: false,
                seed: newSeed
            });

            console.log(`Created new world: ${worldId} with seed ${newSeed}`);
            updateWorldStatus(`Created new world: ${worldId}`);
        }

        // Update world info
        currentWorldSeed.textContent = game.world.seed;
    }

    // Function to update world status message
    function updateWorldStatus(message = null, isError = false) {
        // Update world info
        currentWorldId.textContent = game.options.worldId;
        currentWorldSeed.textContent = game.world.seed;

        // Get world state timestamp
        const worldStateKey = `isogame_world_${game.options.worldId}`;
        const worldState = localStorage.getItem(worldStateKey);
        if (worldState) {
            try {
                const parsedState = JSON.parse(worldState);
                if (parsedState.timestamp) {
                    const date = new Date(parsedState.timestamp);
                    currentWorldTimestamp.textContent = date.toLocaleString();
                } else {
                    currentWorldTimestamp.textContent = 'Unknown';
                }
            } catch (e) {
                currentWorldTimestamp.textContent = 'Error';
            }
        } else {
            currentWorldTimestamp.textContent = 'Never';
        }

        // Count chunks and storage size
        let chunkCount = 0;
        let storageSize = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`isogame_chunk_${game.options.worldId}`)) {
                chunkCount++;
                storageSize += localStorage.getItem(key).length * 2; // Approximate size in bytes
            }
        }

        currentWorldChunks.textContent = chunkCount;
        currentWorldStorage.textContent = `${Math.round(storageSize / 1024)} KB`;

        // Update status message if provided
        if (message) {
            statusDiv.textContent = message;
            statusDiv.style.color = isError ? '#ffaaaa' : '#aaffaa';

            // Clear message after 3 seconds
            setTimeout(() => {
                statusDiv.textContent = '';
            }, 3000);
        } else {
            statusDiv.textContent = '';
        }
    }
}

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
    // Create game instance with chunk-based world and persistence
    const game = new Game({
        container: document.getElementById('game-container'),
        width: window.innerWidth,
        height: window.innerHeight,
        debug: true,
        worldWidth: 64, // Larger world size
        worldHeight: 64, // Larger world size
        chunkSize: 16, // Size of each chunk in tiles
        loadDistance: 2, // Chunks to load in each direction
        unloadDistance: 3, // Chunks to keep loaded
        generateDistance: 1, // Chunks to pre-generate
        worldId: 'main', // Unique ID for this world
        persistChunks: true, // Enable chunk persistence
        autoSave: true, // Enable auto-saving
        autoSaveInterval: 60000, // Auto-save every minute
        generateWorld: false, // Don't generate a random world
        startWithBlankMap: true, // Start with a blank map for building
        createPlayer: true,
        dayDuration: 300, // 5 minutes per day
        startTime: 8, // Start at 8 AM
        tileWidth: 64,
        tileHeight: 32,

        // Custom tile click handler
        onTileClick: (tile, game) => {
            // If player exists, move to the clicked tile (but only if it's not the tile the player is already on)
            if (game.player && game.world) {
                // Get the world position of the tile
                const tileWorldPos = tile.getCenter();

                // Get the player's world position
                const playerWorldPos = { x: game.player.x, y: game.player.y };

                // Calculate the distance between the player and the tile in world coordinates
                const worldDx = Math.abs(playerWorldPos.x - tileWorldPos.x);
                const worldDy = Math.abs(playerWorldPos.y - tileWorldPos.y);
                const worldDistance = Math.sqrt(worldDx * worldDx + worldDy * worldDy);

                // If the player is already very close to the tile in world coordinates, don't move
                // Use a threshold of half a tile width/height
                const threshold = Math.min(game.world.config.tileWidth, game.world.config.tileHeight) / 2;
                if (worldDistance < threshold) {
                    console.log(`Player is already at or very close to tile (${tile.gridX}, ${tile.gridY}) in world coordinates, not moving`);
                    console.log(`Player world pos: (${playerWorldPos.x.toFixed(2)}, ${playerWorldPos.y.toFixed(2)}), Tile world pos: (${tileWorldPos.x.toFixed(2)}, ${tileWorldPos.y.toFixed(2)}), Distance: ${worldDistance.toFixed(2)}`);
                    return;
                }

                // Also check grid coordinates for debugging purposes
                console.log(`Player grid pos: (${game.player.gridX}, ${game.player.gridY}), Tile grid pos: (${tile.gridX}, ${tile.gridY})`);

                // Check if the player is already on this tile
                const playerTile = game.world.getTile(game.player.gridX, game.player.gridY);
                if (playerTile && playerTile === tile) {
                    console.log(`Player is already on this exact tile (${tile.gridX}, ${tile.gridY}), not moving`);
                    return;
                }

                // Check if the tile is within valid bounds
                // Prevent movement to negative Y coordinates or other invalid areas
                if (tile.gridY < 0 || tile.gridX < 0 ||
                    tile.gridX >= game.options.worldWidth ||
                    tile.gridY >= game.options.worldHeight) {
                    console.log(`Cannot move to tile (${tile.gridX}, ${tile.gridY}): outside valid world bounds`);
                    return;
                }

                // Get the world position of the tile
                const worldPos = game.world.gridToWorld(tile.gridX, tile.gridY);
                console.log(`Tile click: Moving player to tile (${tile.gridX}, ${tile.gridY}) at world position (${worldPos.x}, ${worldPos.y})`);
                game.player.setMoveTarget(worldPos, {
                    targetGridX: tile.gridX,
                    targetGridY: tile.gridY
                });
            }
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        game.resize(window.innerWidth, window.innerHeight);
    });

    // Update version info with timestamp
    const versionInfo = document.getElementById('version-info');
    if (versionInfo) {
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        versionInfo.textContent = `v1.1.0 - Chunk-Based World (${timestamp})`;
    }

    // Set up world management UI
    setupWorldManagementUI(game);

    // Set up chunk debug panel
    setupChunkDebugPanel(game);

    // Create debug overlay
    const debugOverlay = new DebugOverlay(game);

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

        // Create a mouse position tracker
        const mouseTracker = document.createElement('div');
        mouseTracker.id = 'mouse-tracker';
        mouseTracker.style.position = 'fixed';
        mouseTracker.style.top = '10px';
        mouseTracker.style.left = '10px';
        mouseTracker.style.zIndex = '1000';
        mouseTracker.style.padding = '5px 10px';
        mouseTracker.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        mouseTracker.style.color = '#fff';
        mouseTracker.style.border = '1px solid rgba(255, 255, 255, 0.3)';
        mouseTracker.style.borderRadius = '3px';
        mouseTracker.style.fontSize = '14px';
        mouseTracker.style.fontFamily = 'monospace';
        mouseTracker.style.display = 'none'; // Hide by default
        mouseTracker.textContent = 'Mouse: (0, 0) -> Grid: (0, 0)';
        document.body.appendChild(mouseTracker);

        // Create container for coordinate labels
        const coordContainer = document.createElement('div');
        coordContainer.id = 'coord-overlay';
        coordContainer.style.position = 'absolute';
        coordContainer.style.top = '0';
        coordContainer.style.left = '0';
        coordContainer.style.width = '100%';
        coordContainer.style.height = '100%';
        coordContainer.style.pointerEvents = 'none';
        coordContainer.style.display = 'none'; // Hide coordinates by default
        document.getElementById('game-container').appendChild(coordContainer);

        // Variable to track update timer
        let updateTimer = null;

        // Toggle coordinate display
        toggleButton.addEventListener('click', () => {
            if (coordContainer.style.display === 'none') {
                coordContainer.style.display = 'block';
                mouseTracker.style.display = 'block';
                toggleButton.textContent = 'C✓';
                toggleButton.style.backgroundColor = 'rgba(0, 128, 0, 0.5)';
                updateCoordinates();
            } else {
                coordContainer.style.display = 'none';
                mouseTracker.style.display = 'none';
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

            // Get camera bounds to only show coordinates for visible tiles
            const cameraBounds = game.world.getCameraBounds();

            // Calculate visible grid range based on camera bounds
            // Use a larger range to show more tiles
            const visibleRange = {
                minX: Math.max(-10, Math.floor((cameraBounds.minX - 300) / game.options.tileWidth) - 10),
                maxX: Math.min(game.options.worldWidth + 10, Math.ceil((cameraBounds.maxX + 300) / game.options.tileWidth) + 10),
                minY: Math.max(-10, Math.floor((cameraBounds.minY - 300) / game.options.tileHeight) - 10),
                maxY: Math.min(game.options.worldHeight + 10, Math.ceil((cameraBounds.maxY + 300) / game.options.tileHeight) + 10)
            };

            // Create labels only for visible tiles
            for (let x = visibleRange.minX; x < visibleRange.maxX; x++) {
                for (let y = visibleRange.minY; y < visibleRange.maxY; y++) {
                    const tile = game.world.getTile(x, y);
                    if (tile) {
                        // Convert tile position to screen coordinates
                        const screenPos = game.world.worldToScreen(tile.x, tile.y);

                        // Calculate chunk coordinates
                        const chunkX = Math.floor(x / game.options.chunkSize);
                        const chunkY = Math.floor(y / game.options.chunkSize);

                        // Create label element
                        const label = document.createElement('div');
                        label.textContent = `${x},${y}`;
                        label.title = `Chunk: ${chunkX},${chunkY}`;
                        label.style.position = 'absolute';
                        label.style.left = `${screenPos.x}px`;
                        label.style.top = `${screenPos.y}px`;
                        label.style.transform = 'translate(-50%, -50%)';
                        label.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                        label.style.color = 'rgba(255, 255, 0, 1.0)';
                        label.style.padding = '2px 4px';
                        label.style.borderRadius = '3px';
                        label.style.fontSize = '12px';
                        label.style.fontWeight = 'bold';
                        label.style.fontFamily = 'Arial, sans-serif';
                        label.style.textAlign = 'center';
                        label.style.minWidth = '20px';
                        label.style.pointerEvents = 'none';

                        // Add chunk border highlight
                        if (x % game.options.chunkSize === 0 || y % game.options.chunkSize === 0) {
                            label.style.backgroundColor = 'rgba(255, 0, 0, 0.4)';
                            label.style.color = 'rgba(255, 255, 255, 0.9)';
                        }

                        // Add to container
                        coordContainer.appendChild(label);
                    }
                }
            }
        }

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

        // Add mousemove event listener to update mouse tracker
        document.getElementById('game-container').addEventListener('mousemove', (event) => {
            if (mouseTracker.style.display === 'none') return;

            // Get mouse position
            const rect = game.app.view.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            // Convert to grid coordinates
            const gridPos = game.world.screenToGrid(x, y);
            const gridX = Math.floor(gridPos.x);
            const gridY = Math.floor(gridPos.y);

            // Update mouse tracker
            mouseTracker.textContent = `Mouse: (${x.toFixed(0)}, ${y.toFixed(0)}) → Grid: (${gridX}, ${gridY})`;

            // Highlight the current tile under the mouse
            if (game.world) {
                const tile = game.world.getTileAtScreen(x, y);
                if (tile) {
                    // Add a special highlight to the label for this tile
                    const labels = coordContainer.querySelectorAll('div');
                    labels.forEach(label => {
                        if (label.textContent === `${tile.gridX},${tile.gridY}`) {
                            label.style.backgroundColor = 'rgba(0, 255, 0, 0.7)';
                            label.style.color = 'black';
                            label.style.fontWeight = 'bold';
                            label.style.zIndex = '1001';
                        } else {
                            // Reset other labels
                            if (label.style.backgroundColor === 'rgba(0, 255, 0, 0.7)') {
                                label.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
                                label.style.color = 'rgba(255, 255, 0, 0.7)';
                                label.style.fontWeight = 'normal';
                                label.style.zIndex = '1000';

                                // Re-apply chunk border highlight if needed
                                const coords = label.textContent.split(',');
                                const x = parseInt(coords[0]);
                                const y = parseInt(coords[1]);
                                if (x % game.options.chunkSize === 0 || y % game.options.chunkSize === 0) {
                                    label.style.backgroundColor = 'rgba(255, 0, 0, 0.4)';
                                    label.style.color = 'rgba(255, 255, 255, 0.9)';
                                }
                            }
                        }
                    });
                }
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

