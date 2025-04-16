// No imports needed

/**
 * Manages all input handling for the game
 */
export class InputManager {
    /**
     * Creates a new input manager
     * @param {Game} game - Game instance
     */
    constructor(game) {
        this.game = game;

        // Input state
        this.mouseDown = false;
        this.rightMouseDown = false;
        this.mousePosition = { x: 0, y: 0 };
        this.keys = new Set();
        this.selectedTile = null;
        this.hoveredTile = null;

        // Flag to enable/disable input handling
        this.enabled = true;

        // Debug settings
        this.debug = game.options.debug || false;
        this.debugVerbose = game.options.debugVerbose || false;
        this.debugThrottleMs = 100; // Throttle debug updates
        this.lastDebugUpdate = 0;

        // Set up tile selection handling
        this.refreshTileSelectionHandlers();

        this.setupEventHandlers();

        if (this.debug) console.log('[InputManager] Initialized');
    }

    /**
     * Sets up event listeners
     * @private
     */
    setupEventHandlers() {
        const view = this.game.app.view;

        // Mouse events
        const handleMouseMove = (event) => {
            this.updateMousePosition(event);

            // Find the tile under the cursor
            if (this.game && this.game.world) {
                // Use the correct method name: getTileAtScreen instead of getTileAtScreenPosition
                const tile = this.game.world.getTileAtScreen(this.mousePosition.x, this.mousePosition.y);
                if (tile) {
                    // Only log if the hovered tile has changed
                    if (!this.hoveredTile || this.hoveredTile.gridX !== tile.gridX || this.hoveredTile.gridY !== tile.gridY) {
                        console.log(`Hovered tile changed to (${tile.gridX}, ${tile.gridY})`);
                    }
                    this.hoveredTile = tile;

                    // Update building placement preview if in placement mode
                    if (this.game.buildingManager && this.game.buildingManager.placementMode) {
                        this.game.buildingManager.updatePlacementPreview(tile);
                    }
                } else {
                    this.hoveredTile = null;
                }
            }

            this.handleInput('mousemove', this.mousePosition);
        };

        const handleMouseDown = (event) => {
            this.updateMousePosition(event);

            const wasMouseDown = this.mouseDown;
            const wasRightMouseDown = this.rightMouseDown;

            this.mouseDown = event.button === 0;
            this.rightMouseDown = event.button === 2;

            // Only log state changes
            if (this.mouseDown !== wasMouseDown || this.rightMouseDown !== wasRightMouseDown) {
                if (this.debugVerbose) {
                    console.log('[InputManager] Mouse button state:', {
                        button: event.button,
                        pos: this.mousePosition
                    });
                }
            }

            if (this.mouseDown) {
                console.log('Left mouse down detected at:', this.mousePosition.x, this.mousePosition.y);
                this.handleInput('mousedown', this.mousePosition);
            }

            // Always handle right mouse down separately to ensure it's processed
            if (this.rightMouseDown) {
                console.log('Right mouse down detected at:', this.mousePosition.x, this.mousePosition.y);
                // Force immediate handling of right-click
                this.game.handleInput('rightmousedown', this.mousePosition);
            }
        };

        const handleMouseUp = (event) => {
            this.updateMousePosition(event);

            if (this.debugVerbose) {
                console.log('[InputManager] Mouse up:', {
                    button: event.button,
                    pos: this.mousePosition
                });
            }

            this.mouseDown = false;
            this.rightMouseDown = false;

            if (event.button === 0) {
                this.handleInput('mouseup', this.mousePosition);
            } else if (event.button === 2) {
                this.handleInput('rightmouseup', this.mousePosition);
            }
        };

        const handleContextMenu = (event) => {
            event.preventDefault();
        };

        view.addEventListener('mousemove', handleMouseMove);
        view.addEventListener('mousedown', handleMouseDown);
        view.addEventListener('mouseup', handleMouseUp);
        view.addEventListener('contextmenu', handleContextMenu);

        // Keyboard events
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();
            if (!this.keys.has(key)) {
                if (this.debugVerbose && Date.now() - this.lastDebugUpdate > this.debugThrottleMs) {
                    console.log('[InputManager] Key state:', {
                        key,
                        shift: e.shiftKey,
                        ctrl: e.ctrlKey
                    });
                    this.lastDebugUpdate = Date.now();
                }
                this.keys.add(key);
                this.handleKeyAction(key);
            }
        };

        const handleKeyUp = (e) => {
            const key = e.key.toLowerCase();
            if (this.keys.has(key)) {
                if (this.debugVerbose) {
                    console.log('[InputManager] Key up:', { key });
                }
                this.keys.delete(key);

                if (this.game.options.onKeyUp) {
                    this.game.options.onKeyUp(key, this.keys, this.game);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Store handlers for cleanup
        this.handlers = {
            mousemove: handleMouseMove,
            mousedown: handleMouseDown,
            mouseup: handleMouseUp,
            contextmenu: handleContextMenu,
            keydown: handleKeyDown,
            keyup: handleKeyUp
        };
    }

    // Removed unused handleMouseMove method

    /**
     * Updates mouse position
     * @param {MouseEvent} event - Mouse event
     * @private
     */
    updateMousePosition(event) {
        const rect = this.game.app.view.getBoundingClientRect();
        this.mousePosition = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };

        // Check if we're in combat mode
        const inCombat = this.game.combatManager && this.game.combatManager.inCombat;

        if (inCombat) {
            // During combat, don't mark anything as out of bounds
            // This allows UI elements to receive events anywhere on screen
            this.mousePosition.outOfBounds = false;
        } else {
            // For chunk-based worlds, we don't need to check map bounds
            // This allows the player to navigate to new chunks

            // Only check if mouse is outside the canvas
            const canvasWidth = this.game.app.view.width;
            const canvasHeight = this.game.app.view.height;

            if (this.mousePosition.x < 0 || this.mousePosition.x > canvasWidth ||
                this.mousePosition.y < 0 || this.mousePosition.y > canvasHeight) {
                this.mousePosition.outOfBounds = true;
            } else {
                this.mousePosition.outOfBounds = false;
            }
        }
    }

    /**
     * Handles input events
     * @param {string} type - Input type
     * @param {Object} data - Input data
     * @private
     */
    handleInput(type, data) {
        // Skip input handling if disabled
        if (!this.enabled) {
            if (this.debugVerbose && type !== 'mousemove') {
                console.log(`[InputManager] Input skipped (disabled): ${type}`);
            }
            return;
        }

        if (this.debugVerbose &&
            (type !== 'mousemove' || Date.now() - this.lastDebugUpdate > this.debugThrottleMs)) {
            this.lastDebugUpdate = Date.now();
            console.log(`[InputManager] Input: ${type}`, data);
        }
        this.game.handleInput(type, data);
    }

    /**
     * Handles key actions
     * @param {string} key - The pressed key
     * @private
     */
    handleKeyAction(key) {
        const { keys } = this.game.inputConfig;

        // Handle movement
        if (keys.movement.includes(key)) {
            this.game.handleCameraControls();
            return;
        }

        // Handle zoom
        if (keys.zoom.includes(key)) {
            this.game.handleCameraControls();
            return;
        }

        // Handle inventory toggle
        if (key === keys.inventory && this.game.player?.inventory) {
            this.game.ui.togglePanel('inventory');
            return;
        }

        // Handle time controls
        if (key === keys.timeControls[0] && this.keys.has('shift')) {
            this.game.handleTimeSpeedToggle();
            return;
        }

        // Debug key handlers removed to clean up the code

        // Handle building-related keys
        if (this.game.buildingManager) {
            // Check if it's a building-related key
            const buildingKeys = Object.values(keys.buildings);
            if (buildingKeys.includes(key)) {
                // Let the building manager handle the key
                if (this.game.buildingManager.handleKeyInput(key)) {
                    return;
                }
            }
        }

        // Handle placement actions
        const placementKeys = Object.values(keys.placement);
        if (placementKeys.includes(key)) {
            if (!this.selectedTile && this.hoveredTile && !this.mousePosition.outOfBounds) {
                this.selectedTile = this.hoveredTile;
                this.selectedTile.select();
            }
            if (this.selectedTile) {
                this.game.handlePlacementAction(key);
            }
        }
    }

    // Removed unused updateDebugInfo method

    /**
     * Cleans up event listeners
     */
    dispose() {
        const view = this.game.app.view;

        view.removeEventListener('mousemove', this.handlers.mousemove);
        view.removeEventListener('mousedown', this.handlers.mousedown);
        view.removeEventListener('mouseup', this.handlers.mouseup);
        view.removeEventListener('contextmenu', this.handlers.contextmenu);

        window.removeEventListener('keydown', this.handlers.keydown);
        window.removeEventListener('keyup', this.handlers.keyup);

        console.log('[InputManager] Event handlers cleaned up');
    }

    /**
     * Resets the selected tile
     */
    resetSelectedTile() {
        if (this.selectedTile) {
            this.selectedTile.deselect();
            this.selectedTile = null;
            console.log('Selected tile reset');
        }
    }

    /**
     * Refreshes tile selection handlers for all tiles in the world
     * This should be called when new tiles are added or loaded
     */
    refreshTileSelectionHandlers() {
        if (!this.game || !this.game.world) {
            console.warn('[InputManager] Cannot refresh tile selection handlers: game.world is not available');
            return;
        }

        console.log('[InputManager] Refreshing tile selection handlers');

        // Get all tiles from the ground layer
        const tiles = this.game.world.groundLayer.children;
        console.log(`[InputManager] Found ${tiles.length} tiles in ground layer`);

        // Set up tile selection handlers for each tile
        tiles.forEach(tile => {
            // Remove existing listener to avoid duplicates
            tile.removeListener('tileSelected');

            // Add new listener
            tile.on('tileSelected', (data) => {
                const selectedTile = data.tile;
                console.log(`[InputManager] Tile selected event received for tile (${selectedTile.gridX}, ${selectedTile.gridY})`);

                if (this.selectedTile && this.selectedTile !== selectedTile) {
                    console.log(`[InputManager] Deselecting previous tile (${this.selectedTile.gridX}, ${this.selectedTile.gridY})`);
                    this.selectedTile.deselect();
                }

                this.selectedTile = selectedTile;
                selectedTile.select();
                console.log(`[InputManager] Selected tile set to (${selectedTile.gridX}, ${selectedTile.gridY})`);

                console.log('[InputManager] Forwarding tileSelected event to Game.handleInput');
                this.handleInput('tileSelected', { tile: selectedTile });
            });
        });

        console.log('[InputManager] Tile selection handlers refreshed');
    }

    /**
     * Updates input manager state
     */
    update() {
        // Skip update if input is disabled
        if (!this.enabled) return;

        // Handle continuous input (like held mouse buttons)
        if (this.mouseDown) {
            this.handleInput('mouseheld', this.mousePosition);
        }
        if (this.rightMouseDown) {
            this.handleInput('rightmouseheld', this.mousePosition);
        }

        // Periodically refresh tile selection handlers (every 5 seconds)
        // This ensures new tiles get proper event handlers
        if (!this._lastRefreshTime) {
            this._lastRefreshTime = Date.now();
        } else if (Date.now() - this._lastRefreshTime > 5000) {
            this.refreshTileSelectionHandlers();
            this._lastRefreshTime = Date.now();
        }
    }
}