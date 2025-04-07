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
            antialias: true
        });

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

        // Input state
        this.input = {
            mouse: { x: 0, y: 0, down: false },
            keys: new Set(),
            selectedTile: null,
            hoveredTile: null
        };

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

        // Set up input handling
        this.setupInputHandlers();

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
        }

        // Create inventory panel
        if (this.player && this.player.inventory) {
            this.ui.createInventoryPanel(this.player.inventory);
        }
    }

    /**
     * Sets up input handlers
     * @private
     */
    setupInputHandlers() {
        // Mouse move
        this.app.view.addEventListener('mousemove', this.handleMouseMove.bind(this));

        // Mouse down
        this.app.view.addEventListener('mousedown', this.handleMouseDown.bind(this));

        // Mouse up
        this.app.view.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // Prevent context menu on right-click
        this.app.view.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });

        // Make sure the world container is interactive
        if (this.world) {
            this.world.interactive = true;
        }

        // Key down
        window.addEventListener('keydown', this.handleKeyDown.bind(this));

        // Key up
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    /**
     * Handles mouse move events
     * @param {MouseEvent} e - Mouse event
     * @private
     */
    handleMouseMove(e) {
        // Get mouse position relative to canvas
        const rect = this.app.view.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Update mouse position
        this.input.mouse.x = x;
        this.input.mouse.y = y;

        // Get tile at mouse position
        const tile = this.world.getTileAtScreen(x, y);

        // Debug info
        if (this.options.debug) {
            const debugInfo = document.getElementById('debug-mouse');
            if (!debugInfo) {
                const div = document.createElement('div');
                div.id = 'debug-mouse';
                div.style.position = 'absolute';
                div.style.bottom = '10px';
                div.style.left = '10px';
                div.style.color = 'white';
                div.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                div.style.padding = '5px';
                div.style.borderRadius = '3px';
                div.style.fontFamily = 'monospace';
                div.style.fontSize = '12px';
                div.style.zIndex = '1000';
                document.body.appendChild(div);
            }

            const mouseInfo = document.getElementById('debug-mouse');
            if (mouseInfo) {
                const tileInfo = tile ? `Tile: (${tile.gridX}, ${tile.gridY}) Type: ${tile.type}` : 'No tile';
                mouseInfo.textContent = `Mouse: (${x}, ${y}) | ${tileInfo}`;
            }
        }

        // We're now using interactive tiles, so this is just for debugging
        // The actual highlighting is handled by the tile's onMouseOver/onMouseOut methods
    }

    /**
     * Handles mouse down events
     * @param {MouseEvent} e - Mouse event
     * @private
     */
    handleMouseDown(e) {
        this.input.mouse.down = true;

        // Log mouse position
        console.log('Mouse down at screen position:', this.input.mouse.x, this.input.mouse.y);

        // Get tile at mouse position
        const tile = this.world.getTileAtScreen(this.input.mouse.x, this.input.mouse.y);

        // We're now using interactive tiles, so selection is handled by the tile's onClick method
        // This is just for handling right-click and other special cases
        if (tile) {
            console.log('Found tile at grid position:', tile.gridX, tile.gridY);

            // Update debug info
            if (this.options.debug) {
                // Update the selected tile info in the debug panel
                if (this.debugElements.selectedTile) {
                    this.debugElements.selectedTile.textContent = `${tile.type} (${tile.gridX}, ${tile.gridY})`;
                }
            }

            // Handle player movement if right click
            if (e.button === 2 && this.player) {
                console.log('Right-click detected, moving player to tile:', tile.gridX, tile.gridY);
                console.log('Player exists:', this.player ? 'yes' : 'no');
                console.log('Tile has game reference:', tile.game ? 'yes' : 'no');
                console.log('Tile has onRightClick method:', typeof tile.onRightClick === 'function' ? 'yes' : 'no');

                // Highlight the tile to confirm which one we're targeting
                tile.highlight(0xFF00FF, 0.8); // Bright magenta

                // Get the center position of the tile
                const center = tile.getCenter();
                console.log('Target tile center:', center);

                // Move player directly to this tile
                this.player.x = center.x;
                this.player.y = center.y;
                console.log('Player position set directly to:', this.player.x, this.player.y);

                // Also set move target for smooth movement
                this.player.setMoveTarget(center);

                // Add a visible marker at the center
                const marker = new PIXI.Graphics();
                marker.beginFill(0x00FFFF);
                marker.drawCircle(0, 0, 10);
                marker.endFill();
                marker.position.set(center.x, center.y);
                this.world.addChild(marker);

                // Add a text label showing the tile coordinates
                const text = new PIXI.Text(`Tile: (${tile.gridX}, ${tile.gridY})`, {
                    fontFamily: 'Arial',
                    fontSize: 12,
                    fill: 0xFFFFFF,
                    stroke: 0x000000,
                    strokeThickness: 2
                });
                text.anchor.set(0.5, 1);
                text.position.set(center.x, center.y - 20);
                this.world.addChild(text);

                // Remove marker and text after 2 seconds
                setTimeout(() => {
                    if (marker.parent) {
                        marker.parent.removeChild(marker);
                    }
                    if (text.parent) {
                        text.parent.removeChild(text);
                    }
                }, 2000);

                // Clear highlight after a short delay
                setTimeout(() => {
                    tile.unhighlight();
                }, 1000);

                // Prevent default context menu
                e.preventDefault();
                console.log('Default context menu prevented');
            }
            // Handle structure placement if shift is held
            else if (this.input.keys.has('shift') && !tile.structure) {
                // Create a structure
                const structure = new Structure({
                    structureType: 'house',
                    gridWidth: 2,
                    gridHeight: 2,
                    interactive: true
                });

                // Place in world
                if (structure.placeInWorld(this.world, tile.gridX, tile.gridY)) {
                    console.log(`Placed ${structure.structureType} at (${tile.gridX}, ${tile.gridY})`);
                } else {
                    console.log(`Cannot place structure at (${tile.gridX}, ${tile.gridY})`);
                }
            }
            // Handle normal tile click
            else {
                // Call tile click handler if provided
                if (this.options.onTileClick) {
                    this.options.onTileClick(tile, this);
                }
            }
        }
    }

    /**
     * Handles mouse up events
     * @param {MouseEvent} e - Mouse event
     * @private
     */
    handleMouseUp(e) {
        this.input.mouse.down = false;
    }

    /**
     * Handles key down events
     * @param {KeyboardEvent} e - Keyboard event
     * @private
     */
    handleKeyDown(e) {
        // Add key to pressed keys
        this.input.keys.add(e.key.toLowerCase());

        // Call key down handler if provided
        if (this.options.onKeyDown) {
            this.options.onKeyDown(e.key.toLowerCase(), this.input.keys, this);
        }

        // Handle camera controls
        this.handleCameraControls();

        // Handle inventory toggle with 'i' key
        if (e.key.toLowerCase() === 'i' && this.player && this.player.inventory) {
            this.ui.togglePanel('inventory');
        }

        // Handle time controls
        if (e.key === 't') {
            // Toggle time scale
            if (this.dayNightCycle.timeScale === 1) {
                this.dayNightCycle.setTimeScale(10); // Fast forward
                console.log('Time: Fast forward (10x)');
            } else {
                this.dayNightCycle.setTimeScale(1); // Normal speed
                console.log('Time: Normal speed');
            }
        }

        // Handle pause with 'p' key
        if (e.key.toLowerCase() === 'p') {
            const paused = this.dayNightCycle.togglePause();
            console.log(`Time: ${paused ? 'Paused' : 'Resumed'}`);
        }
    }

    /**
     * Handles key up events
     * @param {KeyboardEvent} e - Keyboard event
     * @private
     */
    handleKeyUp(e) {
        // Remove key from pressed keys
        this.input.keys.delete(e.key.toLowerCase());

        // Call key up handler if provided
        if (this.options.onKeyUp) {
            this.options.onKeyUp(e.key.toLowerCase(), this.input.keys, this);
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
            this.world.camera.target = null;
        }

        // Update camera if changed
        if (cameraChanged) {
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

        // Add to world
        const centerX = Math.floor(this.world.gridWidth / 2);
        const centerY = Math.floor(this.world.gridHeight / 2);
        console.log('Player position:', centerX, centerY);
        const tile = this.world.getTile(centerX, centerY);

        if (tile) {
            console.log('Found tile at center:', tile);
            const center = tile.getCenter();
            console.log('Tile center:', center);
            player.x = center.x;
            player.y = center.y;
            player.gridX = centerX;
            player.gridY = centerY;

            // Add to world
            this.world.entityContainer.addChild(player);
            tile.addEntity(player);
            console.log('Player added to world at position:', player.x, player.y);

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

        // Update world - but don't update camera again
        // This is the key fix - we don't want the world to update the camera
        // if we've already updated it based on keyboard input
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
        this.app.view.removeEventListener('mousemove', this.handleMouseMove);
        this.app.view.removeEventListener('mousedown', this.handleMouseDown);
        this.app.view.removeEventListener('mouseup', this.handleMouseUp);
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
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

