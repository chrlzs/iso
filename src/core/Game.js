import { PIXI, Application } from '../utils/PixiWrapper.js';
import { TextureAtlas } from '../rendering/TextureAtlas.js';
import { IsometricWorld } from '../rendering/IsometricWorld.js';
import { Character } from '../entities/Character.js';
import { Structure } from '../entities/Structure.js';
import { Item } from '../entities/Item.js';
import { DayNightCycle } from './DayNightCycle.js';
import { UI } from '../ui/UI.js';
import { Inventory } from './Inventory.js';
import { CombatManager } from './CombatManager.js';
import { Enemy } from '../entities/Enemy.js';
import { InputManager } from './InputManager.js';

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
            ...options
        };

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

        // Create world
        this.world = new IsometricWorld({
            width: this.options.worldWidth,
            height: this.options.worldHeight,
            tileWidth: this.options.tileWidth,
            tileHeight: this.options.tileHeight,
            app: this.app,
            game: this,
            generateWorld: this.options.generateWorld !== false
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
                debug: {
                    toggleGrid: 'g'
                },
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

        // World is generated in the IsometricWorld constructor if requested

        // Create player character if requested
        if (this.options.createPlayer !== false) {
            this.createPlayer();
        }

        // Set up performance monitoring
        if (this.options.debug) {
            this.setupPerformanceMonitoring();

            // Show debug grid reminder
            console.log('%c DEBUG GRID: Press G to toggle grid visibility ', 'background: #222; color: #bada55; font-size: 16px;');
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
            console.log('Updating camera position:', this.world.camera.x, this.world.camera.y);
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
            tags: ['player']
        });

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
            update: function(deltaTime) {
                // Nothing to update
            }
        });

        if (this.world) {
            // Start searching from center and spiral outward
            const centerX = Math.floor(this.world.config.gridWidth / 2);
            const centerY = Math.floor(this.world.config.gridHeight / 2);
            console.log('Starting player placement search at center:', centerX, centerY);

            // Try center tile first
            const centerTile = this.world.getTile(centerX, centerY);
            if (centerTile && centerTile.walkable && !centerTile.structure) {
                console.log('Found valid center tile:', centerTile);
                const center = centerTile.getCenter();
                player.x = center.x;
                player.y = center.y;
                player.gridX = centerX;
                player.gridY = centerY;
                player.world = this.world;
                this.world.entityContainer.addChild(player);
                centerTile.addEntity(player);
                console.log('Player placed at center tile');
            } else {
                // Spiral search pattern
                let found = false;
                let layer = 1;
                while (!found && layer < Math.max(this.world.config.gridWidth, this.world.config.gridHeight)) {
                    // Check each direction in the current layer
                    for (let dx = -layer; dx <= layer && !found; dx++) {
                        for (let dy = -layer; dy <= layer && !found; dy++) {
                            const x = centerX + dx;
                            const y = centerY + dy;
                            const tile = this.world.getTile(x, y);
                            
                            if (tile && tile.walkable && !tile.structure) {
                                console.log('Found valid tile at:', x, y);
                                const pos = tile.getCenter();
                                player.x = pos.x;
                                player.y = pos.y;
                                player.gridX = x;
                                player.gridY = y;
                                player.world = this.world;
                                this.world.entityContainer.addChild(player);
                                tile.addEntity(player);
                                found = true;
                            }
                        }
                    }
                    layer++;
                }

                if (!found) {
                    console.error('Could not find any valid tile to place player after spiral search');
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

        console.log('Player created and references set:', this.player ? 'success' : 'failed');
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
        } else {
            // If player is missing but should exist, recreate it
            if (this.options.createPlayer !== false && this.world) {
                console.warn('Player reference lost, recreating player');
                this.createPlayer();
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
        this.world.generateWorld(options);
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
     * Destroys the game instance
     */
    destroy() {
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);

        // Clear any timeouts or intervals
        if (this.player && this.player.healthBarTimeout) {
            clearTimeout(this.player.healthBarTimeout);
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


