import { PIXI, Application } from '../utils/PixiWrapper.js';
import { TextureAtlas } from '../rendering/TextureAtlas.js';
import { IsometricWorld } from '../rendering/IsometricWorld.js';
import { Character } from '../entities/Character.js';
import { Structure } from '../entities/Structure.js';
import { Item } from '../entities/Item.js';
import { DayNightCycle } from './DayNightCycle.js';
import { UI } from './UI.js';  // Updated import path
import { Inventory } from './Inventory.js';
import { CombatManager } from './CombatManager.js';
import { Enemy } from '../entities/Enemy.js';
import { InputManager } from './InputManager.js';
import { ChunkStorage } from './ChunkStorage.js';

/**
 * Game - Main game class that manages the game state and rendering
 */
export class Game {
    /**
     * Creates a new game instance
     * @param {Object} options - Game options
     * @param {HTMLElement} options.container - Container element for the game
     * @param {number} options.width - Game width
     * @param {number} options.height - Game height
     * @param {boolean} options.debug - Whether to show debug information
     */
    constructor(options = {}) {
        // Game options
        this.options = {
            width: options.width || 800,
            height: options.height || 600,
            debug: options.debug || false,
            backgroundColor: options.backgroundColor || 0x1099bb,
            worldWidth: options.worldWidth || 32,
            worldHeight: options.worldHeight || 32,
            tileWidth: options.tileWidth || 64,
            tileHeight: options.tileHeight || 32,
            chunkSize: options.chunkSize || 16,
            loadDistance: options.loadDistance || 2,
            unloadDistance: options.unloadDistance || 3,
            generateDistance: options.generateDistance || 1,
            worldId: options.worldId || 'default',
            persistChunks: options.persistChunks !== false,
            maxStoredChunks: options.maxStoredChunks || 100,
            ...options
        };

        // Create chunk storage for persistence
        this.chunkStorage = new ChunkStorage({
            storagePrefix: 'isogame_chunk_',
            maxChunks: this.options.maxStoredChunks
        });

        // Flag to prevent infinite player recreation loop
        this.playerCreationAttempted = false;

        // Container element
        this.container = options.container || document.body;

        // Create PixiJS application
        this.app = new Application({
            width: this.options.width,
            height: this.options.height,
            backgroundColor: this.options.backgroundColor,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            antialias: true,
            // Add interaction options
            eventFeatures: {
                click: true,
                globalMove: true,
                move: true,
                rightclick: true  // Enable right-click events
            }
        });

        // Enable interaction on the stage
        this.app.stage.interactive = true;
        this.app.stage.hitArea = this.app.screen;

        // Ensure the stage supports sorting by zIndex
        this.app.stage.sortableChildren = true;

        // Add canvas to container
        this.container.appendChild(this.app.view);

        // Create texture atlas
        this.textureAtlas = new TextureAtlas({
            maxWidth: 2048,
            maxHeight: 2048,
            padding: 2,
            debug: this.options.debug,
            app: this.app
        });

        // Create world with chunk support and persistence
        this.world = new IsometricWorld({
            width: this.options.worldWidth,
            height: this.options.worldHeight,
            tileWidth: this.options.tileWidth,
            tileHeight: this.options.tileHeight,
            chunkSize: this.options.chunkSize,
            loadDistance: this.options.loadDistance,
            unloadDistance: this.options.unloadDistance,
            generateDistance: this.options.generateDistance,
            app: this.app,
            game: this,
            generateWorld: this.options.generateWorld !== false,
            seed: this.options.seed || Math.floor(Math.random() * 1000000),
            worldId: this.options.worldId,
            persistChunks: this.options.persistChunks,
            chunkStorage: this.chunkStorage
        });

        // Add world to stage
        this.app.stage.addChild(this.world);

        // Create day/night cycle
        this.dayNightCycle = new DayNightCycle({
            dayDuration: options.dayDuration || 600,
            startTime: options.startTime || 12,
            timeScale: options.timeScale || 1
        });

        // Create UI container
        this.uiContainer = new PIXI.Container();
        this.app.stage.addChild(this.uiContainer);

        // Set zIndex for the uiContainer to ensure it is above the world
        this.uiContainer.zIndex = 1000;

        // Create UI manager
        this.ui = new UI({
            container: this.uiContainer,
            game: this
        });

        // Create player character
        this.player = null;

        // Create day/night overlay
        this.dayNightCycle.createOverlay(this.app.stage, this.options.width, this.options.height);

        // Create combat manager
        this.combatManager = new CombatManager({
            game: this
        });

        // Centralized input configuration
        this.inputConfig = {
            keys: {
                movement: ['w', 'a', 's', 'd'],
                zoom: ['q', 'e'],
                inventory: ['i'],
                timeControls: ['t', 'p'],
                // Debug options removed
                placement: {
                    tree: 't',
                    rock: 'r',
                    item: 'f',
                    enemy: 'x'
                }
            },
            mouse: {
                left: 0,
                right: 2
            }
        };

        // Input state
        this.input = null;

        // Performance monitoring
        this.performance = {
            fps: 0,
            frameTime: 0,
            memoryUsage: 0,
            lastUpdate: performance.now(),
            frames: 0,
            fpsUpdateInterval: 500 // Update FPS every 500ms
        };

        // Debug elements
        this.debugElements = {
            fpsCounter: document.getElementById('fps-counter'),
            debugInfo: document.getElementById('debug-info'),
            selectedTile: document.getElementById('debug-selected-tile'),
            entityCount: document.getElementById('debug-entity-count'),
            cameraPos: document.getElementById('debug-camera-pos'),
            cameraZoom: document.getElementById('debug-camera-zoom'),
            fps: document.getElementById('debug-fps'),
            memory: document.getElementById('debug-memory'),
            drawCalls: document.getElementById('debug-draw-calls'),
            debugPanel: document.getElementById('debug-panel'),
            debugToggle: document.getElementById('debug-toggle'),
            debugHide: document.getElementById('debug-hide')
        };

        // Define the context menu handler if it doesn't exist
        if (!this.handleContextMenu) {
            this.handleContextMenu = function(e) {
                // Prevent the default context menu from appearing
                e.preventDefault();
                console.log('Context menu prevented');
                return false;
            };
        }

        // Bind methods to preserve context
        this.handlePlacementAction = this.handlePlacementAction.bind(this);
        this.handleCameraControls = this.handleCameraControls.bind(this);

        // Initialize
        this.initialize();
    }

    /**
     * Initializes the game
     * @private
     */
    initialize() {
        // Set up game loop
        this.app.ticker.add(this.update.bind(this));

        // Initialize input manager
        this.input = new InputManager(this);

        // Set up window resize handler
        window.addEventListener('resize', this.handleResize.bind(this));

        // Try to load saved world state if persistence is enabled
        if (this.options.persistChunks && !this.options.skipLoadSavedState) {
            const loaded = this.loadWorldState();

            // If no saved state was found, generate a new world
            if (!loaded && this.options.generateWorld !== false) {
                console.log('No saved state found, generating new world...');
                this.world.generateWorld();
            }
        }
        // Otherwise, world is generated in the IsometricWorld constructor if requested

        // Create player character if requested
        if (this.options.createPlayer !== false) {
            this.createPlayer();
        }

        // Set up auto-save if enabled
        if (this.options.autoSave) {
            const autoSaveInterval = this.options.autoSaveInterval || 60000; // Default: 1 minute
            console.log(`Setting up auto-save every ${autoSaveInterval / 1000} seconds`);

            this.autoSaveTimer = setInterval(() => {
                this.saveWorldState();
            }, autoSaveInterval);
        }

        // Set up performance monitoring
        if (this.options.debug) {
            this.setupPerformanceMonitoring();

            // Debug grid has been removed
        }

        // Create inventory panel
        if (this.player && this.player.inventory) {
            this.ui.createInventoryPanel(this.player.inventory);
        }
    }

    // Remove these handlers as they're now in InputManager
    handleMouseMove = undefined;
    handleMouseDown = undefined;
    handleMouseUp = undefined;
    handleContextMenu = undefined;
    handleKeyDown = undefined;
    handleKeyUp = undefined;
    handleKeyAction = undefined;

    /**
     * Handles input events from the InputManager
     * @param {string} type - Type of input event
     * @param {Object} data - Input event data
     */
    handleInput(type, data) {
        // If in combat, only process non-tile related inputs
        const inCombat = this.combatManager && this.combatManager.inCombat;

        // During combat, let the UI handle all mouse events
        if (inCombat && (type.includes('mouse') || type.includes('pointer'))) {
            // Don't log unhandled events during combat to avoid console spam
            return;
        }

        // Handle different input types
        switch (type) {
            case 'mousemove':
                // Only update tile hover states if not in combat
                if (this.world && !inCombat) {
                    try {
                        // Update hover state for tiles
                        let tile = null;
                        try {
                            tile = this.world.getTileAtScreen(data.x, data.y);
                        } catch (error) {
                            console.error('Error getting tile at screen position:', error);
                        }

                        if (tile && this.input) {
                            // Ensure tile has proper references
                            if (tile.world !== this.world) {
                                console.log(`Setting world reference for tile at (${tile.gridX}, ${tile.gridY})`);
                                tile.world = this.world;
                            }

                            if (tile.game !== this) {
                                console.log(`Setting game reference for tile at (${tile.gridX}, ${tile.gridY})`);
                                tile.game = this;
                            }

                            if (this.input.hoveredTile && this.input.hoveredTile !== tile) {
                                // Unhighlight previous tile if it's not selected
                                if (!this.input.hoveredTile.selected) {
                                    try {
                                        this.input.hoveredTile.unhighlight();
                                    } catch (error) {
                                        console.error('Error unhighlighting previous tile:', error);
                                        // Force reset hover state
                                        this.input.hoveredTile = null;
                                    }
                                }
                            }

                            this.input.hoveredTile = tile;
                            // Highlight new tile if it's not already selected
                            if (!tile.selected) {
                                try {
                                    tile.highlight();
                                } catch (error) {
                                    console.error('Error highlighting tile:', error);
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error handling mousemove:', error);
                    }
                }
                break;

            case 'mousedown':
                // Only process tile selection if not in combat
                if (this.world && !inCombat) {
                    try {
                        let tile = null;
                        try {
                            tile = this.world.getTileAtScreen(data.x, data.y);
                        } catch (error) {
                            console.error('Error getting tile at screen position:', error);
                        }

                        if (tile) {
                            // Ensure tile has proper references
                            if (tile.world !== this.world) {
                                console.log(`Setting world reference for tile at (${tile.gridX}, ${tile.gridY})`);
                                tile.world = this.world;
                            }

                            if (tile.game !== this) {
                                console.log(`Setting game reference for tile at (${tile.gridX}, ${tile.gridY})`);
                                tile.game = this;
                            }

                            tile.emit('tileSelected', { tile });
                        }
                    } catch (error) {
                        console.error('Error handling mousedown:', error);
                    }
                }
                break;

            case 'rightmousedown':
                // Only allow player movement if not in combat
                console.log('Right mouse down event received');
                if (this.world && this.player && !inCombat) {
                    try {
                        console.log('Checking for tile at screen position:', data.x, data.y);
                        let tile = null;
                        try {
                            tile = this.world.getTileAtScreen(data.x, data.y);
                        } catch (error) {
                            console.error('Error getting tile at screen position:', error);
                        }

                        if (tile) {
                            // Ensure tile has proper references
                            if (tile.world !== this.world) {
                                console.log(`Setting world reference for tile at (${tile.gridX}, ${tile.gridY})`);
                                tile.world = this.world;
                            }

                            if (tile.game !== this) {
                                console.log(`Setting game reference for tile at (${tile.gridX}, ${tile.gridY})`);
                                tile.game = this;
                            }

                            console.log('Tile found, moving player to:', tile.gridX, tile.gridY);
                            this.movePlayerToTile(tile);
                        } else {
                            console.warn('No tile found at screen position');
                        }
                    } catch (error) {
                        console.error('Error handling rightmousedown:', error);
                    }
                } else {
                    console.warn('Cannot move player: world or player missing, or in combat');
                    console.log('World exists:', !!this.world);
                    console.log('Player exists:', !!this.player);
                    console.log('In combat:', inCombat);
                }
                break;

            case 'tileSelected':
                // Only process tile selection if not in combat
                if (!inCombat) {
                    if (this.debugElements.selectedTile) {
                        const tile = data.tile;
                        this.debugElements.selectedTile.textContent = `${tile.gridX}, ${tile.gridY}`;
                    }
                }
                break;

            case 'mouseheld':
            case 'rightmouseheld':
                // Handle continuous mouse input (if needed)
                break;

            default:
                // Handle other input types
                if (this.options.debug && !inCombat) {
                    console.log(`[Game] Unhandled input type: ${type}`, data);
                }
                break;
        }

        // Call user input handler if provided and not in combat
        if (this.options.onInput && !inCombat) {
            this.options.onInput(type, data, this);
        }
    }

    /**
     * Handles placement of objects in the world
     * @param {string} key - The pressed key
     * @private
     */
    handlePlacementAction(key) {
        const tile = this.input.selectedTile;
        if (!tile) {
            console.warn('No tile selected for placement action');
            return;
        }

        console.log(`Handling placement action for key ${key} on tile (${tile.gridX}, ${tile.gridY})`);
        const { placement } = this.inputConfig.keys;

        switch (key) {
            case placement.tree:
                if (!this.input.keys.has('shift')) {
                    this.placeStructure('tree', tile);
                }
                break;
            case placement.rock:
                this.placeStructure('rock', tile);
                break;
            case placement.item:
                this.placeRandomItem(tile);
                break;
            case placement.enemy:
                this.placeRandomEnemy(tile);
                break;
        }
    }

    /**
     * Places a structure at the specified tile
     * @param {string} type - Type of structure to place
     * @param {IsometricTile} tile - Tile to place the structure on
     */
    placeStructure(type, tile) {
        if (!tile || !tile.walkable || tile.structure) {
            console.warn('Cannot place structure: invalid tile or tile already has structure');
            return;
        }

        // Create structure with appropriate options based on type
        const structure = new Structure({
            structureType: type,
            gridX: tile.gridX,
            gridY: tile.gridY,
            walkable: false,
            solid: true,
            destructible: true,
            interactive: true
        });

        // Try to place the structure in the world
        if (structure.canPlaceAt(this.world, tile.gridX, tile.gridY)) {
            structure.placeInWorld(this.world, tile.gridX, tile.gridY);
            console.log(`Placed ${type} structure at (${tile.gridX}, ${tile.gridY})`);
        } else {
            console.warn(`Cannot place ${type} structure at (${tile.gridX}, ${tile.gridY})`);
        }
    }

    /**
     * Places a random item at the specified tile
     * @param {IsometricTile} tile - Tile to place the item on
     */
    placeRandomItem(tile) {
        if (!tile || !tile.walkable || tile.structure) {
            console.warn('Cannot place item: invalid tile or tile is occupied');
            return;
        }

        // Define possible item types
        const itemTypes = [
            { name: 'Health Potion', type: 'potion', subtype: 'health', rarity: 'common', value: 20, stackable: true, quantity: 1, consumable: true },
            { name: 'Energy Potion', type: 'potion', subtype: 'energy', rarity: 'common', value: 25, stackable: true, quantity: 1, consumable: true },
            { name: 'Iron Sword', type: 'weapon', subtype: 'sword', rarity: 'common', value: 40, equippable: true, equipSlot: 'weapon', stats: { damage: 8 } },
            { name: 'Steel Shield', type: 'armor', subtype: 'shield', rarity: 'uncommon', value: 60, equippable: true, equipSlot: 'offhand', stats: { defense: 5 } },
            { name: 'Gold Coin', type: 'currency', subtype: 'gold', rarity: 'common', value: 1, stackable: true, quantity: Math.floor(Math.random() * 10) + 1 }
        ];

        // Select a random item type
        const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];

        // Create the item
        const item = new Item(itemType);

        // Set position
        const worldPos = this.world.gridToWorld(tile.gridX, tile.gridY);
        item.x = worldPos.x;
        item.y = worldPos.y;
        item.gridX = tile.gridX;
        item.gridY = tile.gridY;
        item.world = this.world;

        // Add to world
        this.world.entityContainer.addChild(item);
        tile.addEntity(item);
        this.world.entities.add(item);

        console.log(`Placed ${item.name} at (${tile.gridX}, ${tile.gridY})`);
    }

    /**
     * Places a random enemy at the specified tile
     * @param {IsometricTile} tile - Tile to place the enemy on
     */
    placeRandomEnemy(tile) {
        if (!tile || !tile.walkable || tile.structure) {
            console.warn('Cannot place enemy: invalid tile or tile is occupied');
            return;
        }

        // Create enemy with random properties
        const enemy = new Enemy({
            name: 'Enemy',
            health: 50 + Math.floor(Math.random() * 50),
            maxHealth: 100,
            energy: 100,
            maxEnergy: 100,
            speed: 2 + Math.random(),
            color: 0xFF0000,
            showName: true,
            tags: ['enemy', 'hostile'],
            active: true,
            patrolRadius: 3,
            stats: {
                level: 1,
                attack: 5 + Math.floor(Math.random() * 5),
                defense: 3 + Math.floor(Math.random() * 3),
                speed: 10,
                criticalChance: 0.1,
                evasion: 0.05
            }
        });

        // Set position
        const worldPos = this.world.gridToWorld(tile.gridX, tile.gridY);
        enemy.x = worldPos.x;
        enemy.y = worldPos.y;
        enemy.gridX = tile.gridX;
        enemy.gridY = tile.gridY;
        enemy.world = this.world;

        // Add to world
        this.world.entityContainer.addChild(enemy);
        tile.addEntity(enemy);
        this.world.entities.add(enemy);

        // Set spawn point for patrolling
        enemy.spawnPoint = { x: worldPos.x, y: worldPos.y };

        console.log(`Placed enemy at (${tile.gridX}, ${tile.gridY})`);
    }

    /**
     * Handles camera controls
     * @private
     */
    handleCameraControls() {
        // Camera controls are now handled in the update method
        // This ensures smooth movement even when keys are held down
    }

    /**
     * Updates camera position based on input
     * @param {number} deltaTime - Time since last update in seconds
     * @private
     */
    updateCamera(deltaTime) {
        const cameraSpeed = 300 * deltaTime; // Speed per second
        let cameraChanged = false;

        // Move camera with WASD - check both uppercase and lowercase
        if (this.input.keys.has('w') || this.input.keys.has('W')) {
            this.world.camera.y -= cameraSpeed;
            cameraChanged = true;
        }
        if (this.input.keys.has('s') || this.input.keys.has('S')) {
            this.world.camera.y += cameraSpeed;
            cameraChanged = true;
        }
        if (this.input.keys.has('a') || this.input.keys.has('A')) {
            this.world.camera.x -= cameraSpeed;
            cameraChanged = true;
        }
        if (this.input.keys.has('d') || this.input.keys.has('D')) {
            this.world.camera.x += cameraSpeed;
            cameraChanged = true;
        }

        // Zoom with QE
        if (this.input.keys.has('q') || this.input.keys.has('Q')) {
            this.world.camera.zoom = Math.max(0.1, this.world.camera.zoom - 1 * deltaTime);
            cameraChanged = true;
        }
        if (this.input.keys.has('e') || this.input.keys.has('E')) {
            this.world.camera.zoom = Math.min(2, this.world.camera.zoom + 1 * deltaTime);
            cameraChanged = true;
        }

        // Always disable camera target when using keyboard controls
        if (cameraChanged) {
            console.log('Camera changed due to keyboard input, disabling camera target');
            this.world.camera.target = null;
        }

        // Update camera if changed
        if (cameraChanged) {
            //console.log('Updating camera position:', this.world.camera.x, this.world.camera.y);
            this.world.updateCamera();
        }
    }

    /**
     * Handles window resize
     * @private
     */
    handleResize() {
        // Resize renderer
        this.app.renderer.resize(
            this.options.width || window.innerWidth,
            this.options.height || window.innerHeight
        );
    }

    /**
     * Sets up performance monitoring and debug panel
     * @private
     */
    setupPerformanceMonitoring() {
        // Set up debug panel toggle functionality
        if (this.debugElements.debugToggle && this.debugElements.debugPanel && this.debugElements.debugHide) {
            // Initially hide the debug panel and show the toggle button
            this.debugElements.debugPanel.style.display = 'none';
            this.debugElements.debugToggle.style.display = 'block';

            // Show debug panel when toggle button is clicked
            this.debugElements.debugToggle.addEventListener('click', () => {
                this.debugElements.debugPanel.style.display = 'block';
                this.debugElements.debugToggle.style.display = 'none';
            });

            // Hide debug panel when hide button is clicked
            this.debugElements.debugHide.addEventListener('click', () => {
                this.debugElements.debugPanel.style.display = 'none';
                this.debugElements.debugToggle.style.display = 'block';
            });
        }

        // Update debug info periodically
        setInterval(() => {
            const now = performance.now();
            const elapsed = now - this.performance.lastUpdate;

            // Calculate FPS
            this.performance.fps = Math.round((this.performance.frames * 1000) / elapsed);

            // Update FPS counters
            if (this.debugElements.fpsCounter) {
                this.debugElements.fpsCounter.textContent = `FPS: ${this.performance.fps}`;
            }

            if (this.debugElements.fps) {
                this.debugElements.fps.textContent = this.performance.fps;
            }

            // Get memory usage if available
            if (window.performance && window.performance.memory) {
                this.performance.memoryUsage = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024));

                // Update memory usage
                if (this.debugElements.memory) {
                    this.debugElements.memory.textContent = `${this.performance.memoryUsage} MB`;
                }
            }

            // Update camera information
            if (this.world && this.world.camera) {
                if (this.debugElements.cameraPos) {
                    const x = Math.round(this.world.camera.x);
                    const y = Math.round(this.world.camera.y);
                    this.debugElements.cameraPos.textContent = `${x}, ${y}`;
                }

                if (this.debugElements.cameraZoom) {
                    this.debugElements.cameraZoom.textContent = this.world.camera.zoom.toFixed(2);
                }
            }

            // Update entity count
            if (this.world && this.debugElements.entityCount) {
                this.debugElements.entityCount.textContent = this.world.entities.size;
            }

            // Update draw calls (if available from renderer)
            if (this.app && this.app.renderer && this.debugElements.drawCalls) {
                // Note: This might not be directly available in all PIXI versions
                // Using a placeholder value for now
                const drawCalls = this.app.renderer.renderCounter || 0;
                this.debugElements.drawCalls.textContent = drawCalls;
            }

            // Reset frame counter
            this.performance.frames = 0;
            this.performance.lastUpdate = now;
        }, this.performance.fpsUpdateInterval);
    }

    /**
     * Creates a player character
     * @returns {Character} The player character
     */
    createPlayer() {
        console.log('Creating player character...');

        // Create player character
        const player = new Character({
            name: 'Player',
            isPlayer: true,
            health: 100,
            maxHealth: 100,
            energy: 100,
            maxEnergy: 100,
            speed: 3,
            color: 0x3498db,
            showName: true,
            tags: ['player'],
            active: true
        });

        // Double-check that the player is active
        player.active = true;

        // Create inventory for player
        player.inventory = new Inventory({
            capacity: 20,
            owner: player
        });

        // Add inventory component
        player.addComponent({
            type: 'inventory',
            inventory: player.inventory,
            init: function(entity) {
                this.entity = entity;
            },
            update: function() {
                // Nothing to update
            }
        });

        if (this.world) {
            // Start from center
            const centerX = Math.floor(this.world.config.gridWidth / 2);
            const centerY = Math.floor(this.world.config.gridHeight / 2);

            console.log(`Finding suitable tile for player placement starting from center (${centerX}, ${centerY})`);

            // Use the findWalkableTile method to find a suitable tile
            const suitableTile = this.world.findWalkableTile(centerX, centerY, 20);

            if (suitableTile) {
                // Use the found suitable tile
                const pos = suitableTile.getCenter();
                player.x = pos.x;
                player.y = pos.y;
                player.gridX = suitableTile.gridX;
                player.gridY = suitableTile.gridY;
                player.world = this.world;

                // Add player to the world's entity container
                console.log(`Adding player to world at position (${suitableTile.gridX}, ${suitableTile.gridY})`);
                this.world.entityContainer.addChild(player);
                suitableTile.addEntity(player);
                this.world.entities.add(player);

                // Ensure player is visible
                player.visible = true;
                player.alpha = 1.0;

                // Update player position
                player.updatePosition();
            } else {
                console.warn('Could not find any suitable tile for player placement');

                // Force create a walkable grass tile at the center as a fallback
                console.log('Creating a fallback walkable grass tile at center');
                const forceTile = this.world.createTileInternal(centerX, centerY, 'grass',
                    this.world.createPlaceholderTexture('grass'), {
                    elevation: 0,
                    walkable: true,
                    type: 'grass' // Explicitly set type to grass to ensure it's not water
                });

                if (forceTile) {
                    const pos = forceTile.getCenter();
                    player.x = pos.x;
                    player.y = pos.y;
                    player.gridX = centerX;
                    player.gridY = centerY;
                    player.world = this.world;

                    console.log(`Adding player to world at forced position (${centerX}, ${centerY})`);
                    this.world.entityContainer.addChild(player);
                    forceTile.addEntity(player);
                    this.world.entities.add(player);

                    player.visible = true;
                    player.alpha = 1.0;
                    player.updatePosition();
                } else {
                    console.error('Failed to create fallback tile, cannot place player');
                    return null;
                }
            }

            // Set camera to follow player
            this.world.setCameraTarget(player);

            // Add some test items to inventory
            const sword = new Item({
                name: 'Iron Sword',
                type: 'weapon',
                subtype: 'sword',
                rarity: 'uncommon',
                value: 50,
                equippable: true,
                equipSlot: 'weapon',
                stats: { damage: 10 }
            });

            const potion = new Item({
                name: 'Health Potion',
                type: 'potion',
                subtype: 'health',
                rarity: 'common',
                value: 20,
                stackable: true,
                quantity: 5,
                consumable: true
            });

            player.inventory.addItem(sword);
            player.inventory.addItem(potion);
        }

        // Store player reference
        this.player = player;

        // Make sure the player reference is available to the world
        if (this.world) {
            this.world.player = player;
        }

        return player;
    }

    /**
     * Updates the game state
     * @param {number} delta - Time since last update (in frames)
     * @private
     */
    update(delta) {
        // Convert to seconds
        const deltaTime = delta / 60;

        // Update camera based on keyboard input
        this.updateCamera(deltaTime);

        // Update world - but don't update camera again if we've already updated it
        // based on keyboard input. The world.update method will check if camera.target
        // is set before updating the camera.
        this.world.update(deltaTime);

        // Update day/night cycle
        this.dayNightCycle.update(deltaTime);

        // Update UI
        this.ui.update(deltaTime);

        // Update combat manager
        this.combatManager.update(deltaTime);

        // Update player
        if (this.player) {
            // Regenerate energy
            if (this.player.energy < this.player.maxEnergy) {
                this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 2 * deltaTime);
            }

            // Make sure player has world reference
            if (!this.player.world && this.world) {
                this.player.world = this.world;
            }

            // Ensure player is visible
            if (!this.player.visible) {
                console.log('Making player visible in update');
                this.player.visible = true;
                this.player.alpha = 1.0;

                // Ensure player is in the entity container
                if (this.world && !this.world.entityContainer.children.includes(this.player)) {
                    console.log('Re-adding player to entity container in update');
                    this.world.entityContainer.addChild(this.player);
                }
            }
        } else {
            // If player is missing but should exist, recreate it
            if (this.options.createPlayer !== false && this.world && !this.playerCreationAttempted) {
                console.warn('Player reference lost, attempting to recreate player');
                this.playerCreationAttempted = true;

                // Make sure we have at least one chunk loaded
                if (this.world.activeChunks.size === 0) {
                    console.log('No active chunks, loading center chunk before creating player');
                    this.world.loadChunk(0, 0);
                }

                const player = this.createPlayer();

                if (player) {
                    console.log('Player successfully recreated');
                    this.playerCreationAttempted = false; // Reset for future attempts if needed
                } else {
                    console.error('Failed to recreate player, will not attempt again this session');
                }
            }
        }

        // Entity count is now updated in setupPerformanceMonitoring

        // Call user update function if provided
        if (this.options.update) {
            this.options.update(deltaTime, this);
        }

        // Update performance monitoring
        this.performance.frames++;
    }

    /**
     * Generates a simple world
     * @param {Object} options - Generation options
     */
    generateWorld(options = {}) {
        console.log('Generating new world...');

        // Temporarily disable input handling to prevent errors during world generation
        if (this.input) {
            this.input.enabled = false;
        }

        // Generate the world
        this.world.generateWorld(options);

        // Make sure we have at least one chunk loaded
        if (this.world.activeChunks.size === 0) {
            console.log('No active chunks after world generation, loading center chunk');
            this.world.loadChunk(0, 0);
        }

        // Reset player reference
        if (this.player) {
            console.log('Removing existing player');
            if (this.player.parent) {
                this.player.parent.removeChild(this.player);
            }
            this.player = null;
        }

        // Create player if needed
        if (this.options.createPlayer !== false) {
            console.log('Creating player after world generation');
            this.createPlayer();

            // Ensure player has proper references
            if (this.player) {
                this.player.world = this.world;
                this.player.game = this;

                // Make sure player is visible and active
                this.player.visible = true;
                this.player.alpha = 1.0;
                this.player.active = true;

                // Update player position
                this.player.updatePosition();

                // Set camera to follow player
                this.world.setCameraTarget(this.player);

                console.log(`Player created at position (${this.player.gridX}, ${this.player.gridY})`);
            }
        }

        // Re-enable input handling after world is fully generated
        setTimeout(() => {
            if (this.input) {
                this.input.enabled = true;
                console.log('Input handling re-enabled after world generation');

                // Reset hover state
                if (this.input.hoveredTile) {
                    try {
                        this.input.hoveredTile.unhighlight();
                    } catch (error) {
                        console.error('Error unhighlighting hovered tile:', error);
                    }
                    this.input.hoveredTile = null;
                }

                // Reset selection state
                if (this.input.selectedTile) {
                    try {
                        this.input.selectedTile.unhighlight();
                    } catch (error) {
                        console.error('Error unhighlighting selected tile:', error);
                    }
                    this.input.selectedTile = null;
                }
            }
        }, 1000); // Longer delay to ensure world is fully initialized

        console.log('World generation complete');
    }

    /**
     * Saves the current world state
     * @returns {Object} The serialized world state
     */
    saveWorldState() {
        if (this.world) {
            return this.world.saveWorldState();
        }
        return null;
    }

    /**
     * Loads a saved world state
     * @returns {boolean} True if the world state was loaded successfully
     */
    loadWorldState() {
        if (this.world) {
            return this.world.loadWorldState();
        }
        return false;
    }

    /**
     * Clears all saved data for the current world
     * @returns {boolean} True if the data was cleared successfully
     */
    clearSavedData() {
        if (this.world && this.chunkStorage) {
            // Clear world state
            localStorage.removeItem(`isogame_world_${this.options.worldId}`);

            // Clear all chunks
            return this.chunkStorage.clearWorld(this.options.worldId);
        }
        return false;
    }

    /**
     * Resizes the game
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        this.options.width = width;
        this.options.height = height;

        // Resize renderer
        this.app.renderer.resize(width, height);

        // Resize day/night overlay
        if (this.dayNightCycle) {
            this.dayNightCycle.resizeOverlay(width, height);
        }

        // Resize UI - check if UI exists first
        if (this.ui && typeof this.ui.resize === 'function') {
            this.ui.resize(width, height);
        }
    }

    /**
     * Moves the player character to the specified tile
     * @param {IsometricTile} tile - The destination tile
     */
    movePlayerToTile(tile) {
        if (!this.player || !tile) {
            console.warn('Cannot move player: player or tile is null');
            return;
        }

        // Ensure tile has proper references
        if (tile.world !== this.world) {
            console.log(`Setting world reference for tile at (${tile.gridX}, ${tile.gridY})`);
            tile.world = this.world;
        }

        if (tile.game !== this) {
            console.log(`Setting game reference for tile at (${tile.gridX}, ${tile.gridY})`);
            tile.game = this;
        }

        // Check if the tile is walkable
        if (!tile.walkable || tile.structure) {
            console.log(`Cannot move to tile (${tile.gridX}, ${tile.gridY}): not walkable or has structure`);
            return;
        }

        // Clear any previous destination highlight
        if (this.destinationTile && this.destinationTile !== tile) {
            try {
                this.destinationTile.unhighlight();
            } catch (error) {
                console.error('Error unhighlighting previous destination tile:', error);
                // Force reset destination tile
                this.destinationTile = null;
            }
        }

        // Highlight the destination tile with a different color
        try {
            tile.highlight(0x00FFFF, 0.5); // Cyan color with 50% opacity
            this.destinationTile = tile;
        } catch (error) {
            console.error('Error highlighting destination tile:', error);
            // Continue with movement even if highlighting fails
        }

        // Get the center position of the tile
        const targetPos = tile.getCenter();

        // Ensure we have valid coordinates
        if (typeof targetPos.x !== 'number' || typeof targetPos.y !== 'number' ||
            isNaN(targetPos.x) || isNaN(targetPos.y)) {
            console.error(`Invalid target position: (${targetPos.x}, ${targetPos.y})`);
            return;
        }

        console.log(`Setting move target to world position (${targetPos.x.toFixed(2)}, ${targetPos.y.toFixed(2)})`);

        // Ensure player is visible and active
        this.player.visible = true;
        this.player.alpha = 1.0;
        this.player.active = true;

        // Ensure player has proper references
        if (!this.player.world || this.player.world !== this.world) {
            console.log('Setting player world reference');
            this.player.world = this.world;
        }

        if (!this.player.game || this.player.game !== this) {
            console.log('Setting player game reference');
            this.player.game = this;
        }

        // Set the player's move target
        console.log('Setting player move target to:', targetPos);
        this.player.setMoveTarget(targetPos);

        // Update the player's grid position immediately for pathfinding purposes
        this.player.targetGridX = tile.gridX;
        this.player.targetGridY = tile.gridY;

        // Make the camera follow the player
        this.world.setCameraTarget(this.player);

        console.log(`Moving player to tile (${tile.gridX}, ${tile.gridY})`);

        // Clear the destination highlight after the player reaches the tile
        const checkDestinationReached = () => {
            if (!this.player.isMoving && this.destinationTile) {
                this.destinationTile.unhighlight();
                this.destinationTile = null;
                clearInterval(this.destinationCheckInterval);
                this.destinationCheckInterval = null;
            }
        };

        // Clear any existing interval
        if (this.destinationCheckInterval) {
            clearInterval(this.destinationCheckInterval);
        }

        // Set up a new interval to check if the player has reached the destination
        this.destinationCheckInterval = setInterval(checkDestinationReached, 100);
    }

    /**
     * Destroys the game instance
     */
    destroy() {
        // Save world state before destroying
        if (this.options.persistChunks) {
            this.saveWorldState();
        }

        // Clear auto-save timer if it exists
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }

        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);

        // Clear any timeouts or intervals
        if (this.player && this.player.healthBarTimeout) {
            clearTimeout(this.player.healthBarTimeout);
        }

        // Clear destination check interval
        if (this.destinationCheckInterval) {
            clearInterval(this.destinationCheckInterval);
            this.destinationCheckInterval = null;
        }

        // Dispose world
        this.world.dispose();

        // Remove UI container
        if (this.uiContainer && this.uiContainer.parent) {
            this.uiContainer.parent.removeChild(this.uiContainer);
        }

        // Remove day/night overlay
        if (this.dayNightCycle && this.dayNightCycle.overlay && this.dayNightCycle.overlay.parent) {
            this.dayNightCycle.overlay.parent.removeChild(this.dayNightCycle.overlay);
        }

        // Destroy app
        this.app.destroy(true, true);

        // Remove canvas from container
        if (this.app.view.parentNode) {
            this.app.view.parentNode.removeChild(this.app.view);
        }
    }
}


