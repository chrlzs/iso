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
        if (worldManagement.style.display === 'none' || worldManagement.style.display === '') {
            worldManagement.style.display = 'block';
            toggleButton.style.backgroundColor = 'rgba(0, 128, 0, 0.7)'; // Change to green when active
            updateWorldStatus();
        } else {
            worldManagement.style.display = 'none';
            toggleButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'; // Change back to black when inactive
        }
    });

    // Close button still works as an alternative way to close
    closeButton.addEventListener('click', () => {
        worldManagement.style.display = 'none';
        toggleButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'; // Change back to black when inactive
    });

    // Save world
    saveButton.addEventListener('click', () => {
        // Show loading spinner
        showWorldLoadingSpinner('Saving world...');

        // Use setTimeout to allow the UI to update before starting the operation
        setTimeout(() => {
            const worldState = game.saveWorldState();
            updateWorldStatus('World saved successfully!');
            console.log('World saved:', worldState);
        }, 50);
    });

    // Load world
    loadButton.addEventListener('click', () => {
        const worldId = worldIdInput.value.trim();

        // Show loading spinner
        showWorldLoadingSpinner('Loading world...');

        if (worldId && worldId !== game.options.worldId) {
            // Switch to the new world
            switchWorld(worldId);
        } else {
            // Reload current world
            console.log('Attempting to load world state...');

            // Reset player creation flag to allow recreation if needed
            game.playerCreationAttempted = false;

            // Use setTimeout to allow the UI to update before starting the operation
            setTimeout(() => {
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
            }, 50);
        }
    });

    // Generate new world
    newButton.addEventListener('click', () => {
        if (confirm('Generate a new world? This will not affect stored data.')) {
            // Show loading spinner
            showWorldLoadingSpinner('Generating new world...');

            // Use setTimeout to allow the UI to update before starting the operation
            setTimeout(() => {
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
            }, 50);
        }
    });

    // Clear world data
    clearButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all saved data for this world? This cannot be undone.')) {
            // Show loading spinner
            showWorldLoadingSpinner('Clearing world data...');

            // Use setTimeout to allow the UI to update before starting the operation
            setTimeout(() => {
                const success = game.clearSavedData();
                if (success) {
                    updateWorldStatus('World data cleared!');
                } else {
                    updateWorldStatus('Failed to clear world data!', true);
                }
            }, 50);
        }
    });

    // Function to switch to a different world
    function switchWorld(worldId) {
        // Show loading spinner
        showWorldLoadingSpinner(`Switching to world: ${worldId}...`);

        // Use setTimeout to allow the UI to update before starting the operation
        setTimeout(() => {
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
            showWorldLoadingSpinner(`Loading world: ${worldId}...`);
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

                showWorldLoadingSpinner(`Creating new world: ${worldId}...`);
                game.generateWorld({
                    clearStorage: false,
                    seed: newSeed
                });

                console.log(`Created new world: ${worldId} with seed ${newSeed}`);
                updateWorldStatus(`Created new world: ${worldId}`);
            }

            // Update world info
            currentWorldSeed.textContent = game.world.seed;
        }, 50);
    }

    // Create loading spinner for world operations
    function showWorldLoadingSpinner(message = 'Loading...') {
        // Create or update loading spinner
        let loadingSpinner = document.getElementById('world-loading-spinner');

        if (!loadingSpinner) {
            loadingSpinner = document.createElement('div');
            loadingSpinner.id = 'world-loading-spinner';
            loadingSpinner.style.position = 'absolute';
            loadingSpinner.style.top = '0';
            loadingSpinner.style.left = '0';
            loadingSpinner.style.width = '100%';
            loadingSpinner.style.height = '100%';
            loadingSpinner.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            loadingSpinner.style.display = 'flex';
            loadingSpinner.style.flexDirection = 'column';
            loadingSpinner.style.justifyContent = 'center';
            loadingSpinner.style.alignItems = 'center';
            loadingSpinner.style.zIndex = '1001';
            loadingSpinner.style.fontFamily = 'Arial, sans-serif';
            worldManagement.appendChild(loadingSpinner);

            // Create spinner animation
            const spinner = document.createElement('div');
            spinner.style.width = '40px';
            spinner.style.height = '40px';
            spinner.style.border = '4px solid rgba(0, 255, 255, 0.3)';
            spinner.style.borderRadius = '50%';
            spinner.style.borderTopColor = '#00FFFF';
            spinner.style.animation = 'spin 1s linear infinite';
            spinner.style.marginBottom = '15px';
            loadingSpinner.appendChild(spinner);

            // Add animation style if not already present
            if (!document.getElementById('spinner-style')) {
                const style = document.createElement('style');
                style.id = 'spinner-style';
                style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
                document.head.appendChild(style);
            }

            // Create message element
            const messageElement = document.createElement('div');
            messageElement.id = 'world-loading-message';
            messageElement.style.color = '#00FFFF';
            messageElement.style.marginTop = '10px';
            messageElement.style.fontSize = '16px';
            messageElement.textContent = message;
            loadingSpinner.appendChild(messageElement);
        } else {
            // Update existing message
            const messageElement = document.getElementById('world-loading-message');
            if (messageElement) {
                messageElement.textContent = message;
            }
            loadingSpinner.style.display = 'flex';
        }
    }

    // Hide loading spinner
    function hideWorldLoadingSpinner() {
        const loadingSpinner = document.getElementById('world-loading-spinner');
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }
    }

    // Function to update world status message
    function updateWorldStatus(message = null, isError = false) {
        // Hide loading spinner
        hideWorldLoadingSpinner();

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

/**
 * Updates the FPS counter directly
 * @param {Game} game - The game instance
 */
function setupDirectFpsCounter(game) {
    const fpsCounter = document.getElementById('fps-counter');
    if (!fpsCounter) return;

    // Make sure it's visible
    fpsCounter.style.display = 'block';

    // Update FPS counter every 100ms for more responsive display
    setInterval(() => {
        const fps = game.performance ? game.performance.fps : 0;
        fpsCounter.textContent = `FPS: ${Math.max(1, Math.round(fps))}`;
    }, 100);
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
        debug: false,
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

    // Create chunk debug toggle button
    const chunkDebugButton = document.createElement('button');
    chunkDebugButton.textContent = 'K';
    chunkDebugButton.title = 'Toggle Chunk Debug';
    chunkDebugButton.style.position = 'fixed';
    chunkDebugButton.style.bottom = '20px';
    chunkDebugButton.style.left = '160px'; // Position after other buttons
    chunkDebugButton.style.zIndex = '1001';
    chunkDebugButton.style.width = '40px';
    chunkDebugButton.style.height = '40px';
    chunkDebugButton.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    chunkDebugButton.style.color = '#00FFFF';
    chunkDebugButton.style.border = '2px solid #00FFFF';
    chunkDebugButton.style.borderRadius = '8px';
    chunkDebugButton.style.cursor = 'pointer';
    chunkDebugButton.style.fontSize = '16px';
    chunkDebugButton.style.display = 'flex';
    chunkDebugButton.style.justifyContent = 'center';
    chunkDebugButton.style.alignItems = 'center';
    chunkDebugButton.style.margin = '0 5px';
    chunkDebugButton.style.padding = '0';
    chunkDebugButton.style.fontFamily = 'Arial, sans-serif';
    chunkDebugButton.style.transition = 'all 0.3s ease';
    document.body.appendChild(chunkDebugButton);

    // Toggle chunk debug panel
    const chunkDebugPanel = document.getElementById('chunk-debug');
    chunkDebugButton.addEventListener('click', () => {
        if (chunkDebugPanel.style.display === 'none') {
            chunkDebugPanel.style.display = 'block';
            chunkDebugButton.style.backgroundColor = 'rgba(0, 128, 0, 0.7)'; // Green when active
        } else {
            chunkDebugPanel.style.display = 'none';
            chunkDebugButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'; // Black when inactive
        }
    });

    // Create debug overlay (no need to store the reference)
    new DebugOverlay(game);

    // Create a simple HTML overlay for tile coordinates
    if (game.options.debug) {
        // Create a small, unobtrusive button to toggle coordinate display - positioned next to other buttons
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'C';
        toggleButton.title = 'Toggle Tile Coordinates';
        toggleButton.style.position = 'fixed';
        toggleButton.style.bottom = '20px'; // Match other buttons
        toggleButton.style.left = '110px'; // Adjusted position - third button
        toggleButton.style.zIndex = '1001';
        toggleButton.style.width = '40px';
        toggleButton.style.height = '40px'; // Match other buttons
        toggleButton.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        toggleButton.style.color = '#00FFFF';
        toggleButton.style.border = '2px solid #00FFFF';
        toggleButton.style.borderRadius = '8px'; // Match other buttons
        toggleButton.style.cursor = 'pointer';
        toggleButton.style.fontSize = '16px';
        toggleButton.style.opacity = '1.0';
        toggleButton.style.transition = 'all 0.3s ease'; // Match other buttons
        toggleButton.style.display = 'flex';
        toggleButton.style.justifyContent = 'center';
        toggleButton.style.alignItems = 'center';
        toggleButton.style.margin = '0 5px'; // Match other buttons
        toggleButton.style.padding = '0';
        toggleButton.style.fontFamily = 'Arial, sans-serif'; // Match other buttons
        document.body.appendChild(toggleButton);

        // Create a mouse position tracker with cyberpunk styling
        const mouseTracker = document.createElement('div');
        mouseTracker.id = 'mouse-tracker';
        mouseTracker.style.position = 'fixed';
        mouseTracker.style.top = '630px'; // Position below the debug overlay
        mouseTracker.style.right = '10px'; // Position on the right side
        mouseTracker.style.zIndex = '1000';
        mouseTracker.style.padding = '10px 15px';
        mouseTracker.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        mouseTracker.style.color = '#00FFFF';
        mouseTracker.style.border = '2px solid #00FFFF';
        mouseTracker.style.borderRadius = '5px';
        mouseTracker.style.fontSize = '14px';
        mouseTracker.style.fontFamily = 'Arial';
        mouseTracker.style.display = 'none'; // Hide by default
        mouseTracker.textContent = 'Mouse: (0, 0) → Grid: (0, 0)';
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
                toggleButton.style.backgroundColor = 'rgba(0, 128, 0, 0.7)'; // Green when active
                updateCoordinates();
            } else {
                coordContainer.style.display = 'none';
                mouseTracker.style.display = 'none';
                toggleButton.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'; // Black when inactive
            }
        });

        // Add hover effects to coordinate toggle button
        toggleButton.addEventListener('mouseover', () => {
            if (coordContainer.style.display === 'none') {
                toggleButton.style.backgroundColor = 'rgba(0, 40, 80, 0.9)';
            }
            toggleButton.style.transform = 'translateY(-2px)';
            toggleButton.style.boxShadow = '0 4px 8px rgba(0, 255, 255, 0.3)';
        });

        toggleButton.addEventListener('mouseout', () => {
            if (coordContainer.style.display === 'none') {
                toggleButton.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            } else {
                toggleButton.style.backgroundColor = 'rgba(0, 128, 0, 0.7)';
            }
            toggleButton.style.transform = 'translateY(0)';
            toggleButton.style.boxShadow = 'none';
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
                        label.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                        label.style.color = '#00FFFF';
                        label.style.padding = '3px 6px';
                        label.style.borderRadius = '5px';
                        label.style.fontSize = '12px';
                        label.style.fontWeight = 'bold';
                        label.style.fontFamily = 'Arial';
                        label.style.textAlign = 'center';
                        label.style.minWidth = '20px';
                        label.style.pointerEvents = 'none';
                        label.style.border = '1px solid rgba(0, 255, 255, 0.3)';

                        // Add chunk border highlight with cyberpunk styling
                        if (x % game.options.chunkSize === 0 || y % game.options.chunkSize === 0) {
                            label.style.backgroundColor = 'rgba(255, 0, 128, 0.8)';
                            label.style.color = '#FFFFFF';
                            label.style.border = '1px solid rgba(255, 0, 255, 0.6)';
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
                            label.style.backgroundColor = 'rgba(0, 255, 128, 0.8)';
                            label.style.color = '#000000';
                            label.style.fontWeight = 'bold';
                            label.style.zIndex = '1001';
                            label.style.border = '2px solid rgba(0, 255, 128, 1.0)';
                        } else {
                            // Reset other labels
                            if (label.style.backgroundColor === 'rgba(0, 255, 128, 0.8)' || label.style.backgroundColor === 'rgba(0, 255, 0, 0.7)') {
                                label.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                                label.style.color = '#00FFFF';
                                label.style.fontWeight = 'normal';
                                label.style.zIndex = '1000';
                                label.style.border = '1px solid rgba(0, 255, 255, 0.3)';

                                // Re-apply chunk border highlight if needed
                                const coords = label.textContent.split(',');
                                const x = parseInt(coords[0]);
                                const y = parseInt(coords[1]);
                                if (x % game.options.chunkSize === 0 || y % game.options.chunkSize === 0) {
                                    label.style.backgroundColor = 'rgba(255, 0, 128, 0.8)';
                                    label.style.color = '#FFFFFF';
                                    label.style.border = '1px solid rgba(255, 0, 255, 0.6)';
                                }
                            }
                        }
                    });
                }
            }
        });
    }

    // Set up FPS counter toggle
    const toggleFpsButton = document.getElementById('toggle-fps');
    const fpsCounter = document.getElementById('fps-counter');

    // Set initial state - FPS counter is visible by default
    toggleFpsButton.style.backgroundColor = 'rgba(0, 128, 0, 0.7)'; // Green when active

    // Set up direct FPS counter update
    setupDirectFpsCounter(game);

    // Add click handler for FPS counter toggle
    toggleFpsButton.addEventListener('click', () => {
        if (fpsCounter.style.display === 'none') {
            // Show FPS counter
            fpsCounter.style.display = 'block';
            toggleFpsButton.style.backgroundColor = 'rgba(0, 128, 0, 0.7)'; // Green when active
        } else {
            // Hide FPS counter
            fpsCounter.style.display = 'none';
            toggleFpsButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'; // Black when inactive
        }
    });

    // Create performance mode toggle button with consistent styling
    const perfModeButton = document.createElement('button');
    perfModeButton.textContent = 'PERF';
    perfModeButton.title = 'Toggle Low Performance Mode';
    perfModeButton.style.position = 'fixed';
    perfModeButton.style.bottom = '20px';
    perfModeButton.style.left = '210px'; // Position after chunk debug button
    perfModeButton.style.zIndex = '1001';
    perfModeButton.style.width = '60px'; // Slightly wider for text
    perfModeButton.style.height = '40px';
    perfModeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    perfModeButton.style.color = '#00FFFF';
    perfModeButton.style.border = '2px solid #00FFFF';
    perfModeButton.style.borderRadius = '8px';
    perfModeButton.style.cursor = 'pointer';
    perfModeButton.style.fontSize = '16px'; // Match font size with other buttons
    perfModeButton.style.display = 'flex';
    perfModeButton.style.justifyContent = 'center';
    perfModeButton.style.alignItems = 'center';
    perfModeButton.style.margin = '0 5px';
    perfModeButton.style.padding = '0';
    perfModeButton.style.fontFamily = 'Arial, sans-serif';
    perfModeButton.style.transition = 'all 0.3s ease';
    document.body.appendChild(perfModeButton);

    // Add click handler for performance mode toggle
    perfModeButton.addEventListener('click', () => {
        // Toggle low performance mode
        game.options.lowPerformanceMode = !game.options.lowPerformanceMode;

        // Update button appearance
        if (game.options.lowPerformanceMode) {
            perfModeButton.style.backgroundColor = 'rgba(0, 128, 0, 0.7)'; // Green when active
            game.ui.showMessage('Low Performance Mode: ON - Improves FPS but reduces visual quality', 3000);
        } else {
            perfModeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'; // Black when inactive
            game.ui.showMessage('Low Performance Mode: OFF - Full visual quality', 3000);
        }

        // Force world update on next frame
        if (game.world) {
            game.world.frameCount = 0;
        }
    });

    // Update FPS toggle button style to match
    if (toggleFpsButton) {
        toggleFpsButton.style.width = '40px';
        toggleFpsButton.style.height = '40px';
        toggleFpsButton.style.borderRadius = '8px';
        toggleFpsButton.style.margin = '0 5px';
        toggleFpsButton.style.transition = 'all 0.3s ease';
        toggleFpsButton.style.fontSize = '16px';
        toggleFpsButton.style.fontFamily = 'Arial, sans-serif';
        toggleFpsButton.style.display = 'flex';
        toggleFpsButton.style.justifyContent = 'center';
        toggleFpsButton.style.alignItems = 'center';
    }

    // Add hover effects to all buttons
    const worldManagementButton = document.getElementById('toggle-world-management');

    // Create an array of all UI buttons
    const allButtons = [chunkDebugButton, perfModeButton, toggleFpsButton, worldManagementButton];

    // We don't need to add the coordinate toggle button here as it already has its own hover effects
    // defined in the debug section where it's created

    // Apply hover effects to all buttons
    allButtons.forEach(button => {
        if (!button) return;
        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = 'rgba(0, 40, 80, 0.9)';
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 4px 8px rgba(0, 255, 255, 0.3)';
        });
        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = 'none';
        });
    });

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

