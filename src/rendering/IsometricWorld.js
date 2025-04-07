import { IsometricTile } from './IsometricTile.js';
import { EntityPool } from '../utils/EntityPool.js';
import { PIXI, Container } from '../utils/PixiWrapper.js';

/**
 * IsometricWorld - Manages the isometric game world
 * Handles tiles, entities, and world generation
 */
export class IsometricWorld extends Container {
    /**
     * Creates a new isometric world
     * @param {Object} options - World options
     * @param {number} options.width - World width in tiles
     * @param {number} options.height - World height in tiles
     * @param {number} options.tileWidth - Tile width in pixels
     * @param {number} options.tileHeight - Tile height in pixels
     * @param {PIXI.Application} options.app - PixiJS application
     */
    constructor(options = {}) {
        super();

        // Enable sortable children to control z-index
        this.sortableChildren = true;

        // World dimensions
        this.gridWidth = options.width || 32;
        this.gridHeight = options.height || 32;

        // Log world dimensions
        console.log('IsometricWorld: Creating world with dimensions:', this.gridWidth, 'x', this.gridHeight);

        // Tile dimensions
        this.tileWidth = options.tileWidth || 64;
        this.tileHeight = options.tileHeight || 32;

        // PixiJS application
        this.app = options.app;

        // Game reference
        this.game = options.game;

        // Create tile container
        this.tileContainer = new PIXI.Container();
        this.addChild(this.tileContainer);

        // Create entity container
        this.entityContainer = new PIXI.Container();
        this.addChild(this.entityContainer);

        // Create UI container (on top)
        this.uiContainer = new PIXI.Container();
        this.addChild(this.uiContainer);

        // Enable sortable children for the UI container
        this.uiContainer.sortableChildren = true;
        // Set high z-index to ensure UI is always on top
        this.uiContainer.zIndex = 100;

        // Debug grid overlay (only shown when debug is enabled)
        // Add it to the tile container so it moves with the map
        this.debugGridOverlay = new PIXI.Graphics();
        this.tileContainer.addChild(this.debugGridOverlay);
        // Set a high z-index to ensure it's drawn on top of tiles
        this.debugGridOverlay.zIndex = 1000;

        // Create a special top-level container just for selection indicators
        // This will be the absolute top layer
        this.selectionContainer = new PIXI.Container();
        this.addChild(this.selectionContainer);
        this.selectionContainer.zIndex = 9999; // Extremely high z-index

        // No cursor graphics needed with the new distance-based approach

        // Create tile grid
        this.tiles = [];

        // Sort all children by zIndex
        this.sortChildren();

        // Entity pools
        this.entityPools = new Map();

        // Active entities
        this.entities = new Set();

        // Camera
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1,
            target: null,
            bounds: {
                minX: -5000,
                minY: -5000,
                maxX: 5000,
                maxY: 5000
            }
        };

        // Add direct click handling to the world container
        this.interactive = true;
        this.on('pointerdown', this.handleDirectClick.bind(this));

        // Center the container in the screen
        if (this.app && this.app.screen) {
            this.position.set(
                this.app.screen.width / 2,
                this.app.screen.height / 2
            );
        } else {
            // Fallback to window dimensions if app is not available
            this.position.set(
                window.innerWidth / 2,
                window.innerHeight / 2
            );
        }

        // Initialize world
        this.initialize(options);
    }

    /**
     * Initializes the world
     * @param {Object} options - Initialization options
     * @private
     */
    initialize(options) {
        // Create empty tile grid
        this.createEmptyGrid();

        // Set initial camera position to center of world
        this.camera.x = (this.gridWidth * this.tileWidth) / 2;
        this.camera.y = (this.gridHeight * this.tileHeight) / 2;

        // Apply camera position
        this.updateCamera();

        // Generate world if requested
        if (options.generateWorld) {
            console.log('Generating world...');
            this.generateWorld(options.worldOptions || {});
        }
    }

    /**
     * Creates an empty tile grid
     * @private
     */
    createEmptyGrid() {
        console.log('Creating empty grid with dimensions:', this.gridWidth, 'x', this.gridHeight);

        // Initialize 2D array
        this.tiles = new Array(this.gridWidth);

        for (let x = 0; x < this.gridWidth; x++) {
            this.tiles[x] = new Array(this.gridHeight);

            for (let y = 0; y < this.gridHeight; y++) {
                this.tiles[x][y] = null;
            }
        }
    }

    /**
     * Creates a tile at the specified position
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @param {string} type - Tile type
     * @param {PIXI.Texture} texture - Tile texture
     * @param {Object} options - Additional tile options
     * @returns {IsometricTile} The created tile
     */
    createTile(x, y, type, texture, options = {}) {
        // Check if position is valid
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
            console.warn(`Tile position out of bounds: ${x}, ${y}`);
            return null;
        }

        // Remove existing tile if any
        if (this.tiles[x][y]) {
            this.removeTile(x, y);
        }

        // Create new tile
        const tile = new IsometricTile({
            x,
            y,
            type,
            width: this.tileWidth,
            height: this.tileHeight,
            texture,
            world: this,
            game: this.game,
            ...options
        });

        // Explicitly set game reference
        tile.game = this.game;
        tile.world = this;

        console.log(`Created tile at (${x}, ${y}) with game reference:`, tile.game ? 'set' : 'null');

        // Add to grid
        this.tiles[x][y] = tile;

        // Add to container
        this.tileContainer.addChild(tile);

        // Mark for depth sorting
        this.sortTilesByDepth = true;

        return tile;
    }

    /**
     * Removes a tile at the specified position
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     */
    removeTile(x, y) {
        // Check if position is valid
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return;
        }

        const tile = this.tiles[x][y];

        if (!tile) return;

        // Remove from container
        this.tileContainer.removeChild(tile);

        // Dispose tile
        tile.dispose();

        // Clear grid reference
        this.tiles[x][y] = null;
    }

    /**
     * Gets a tile at the specified position
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @returns {IsometricTile} The tile or null if not found
     */
    getTile(x, y) {
        // Check if position is valid
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
            return null;
        }

        return this.tiles[x][y];
    }

    /**
     * Creates an entity pool for a specific entity class
     * @param {Function} entityClass - Entity class constructor
     * @param {Object} options - Pool options
     * @returns {EntityPool} The entity pool
     */
    createEntityPool(entityClass, options = {}) {
        const entityType = entityClass.name;

        // Return existing pool if it exists
        if (this.entityPools.has(entityType)) {
            return this.entityPools.get(entityType);
        }

        // Create new pool
        const pool = new EntityPool(entityClass, {
            ...options,
            container: this.entityContainer
        });

        // Store pool
        this.entityPools.set(entityType, pool);

        return pool;
    }

    /**
     * Creates an entity from a pool
     * @param {Function} entityClass - Entity class constructor
     * @param {Object} props - Entity properties
     * @returns {Object} The created entity
     */
    createEntity(entityClass, props = {}) {
        const pool = this.createEntityPool(entityClass);
        const entity = pool.create(props);

        // Add to active entities
        this.entities.add(entity);

        // Add to tile if position is specified
        if (props.gridX !== undefined && props.gridY !== undefined) {
            const tile = this.getTile(props.gridX, props.gridY);
            if (tile) {
                tile.addEntity(entity);
            }
        }

        return entity;
    }

    /**
     * Removes an entity
     * @param {Object} entity - The entity to remove
     */
    removeEntity(entity) {
        if (!entity) return;

        // Remove from active entities
        this.entities.delete(entity);

        // Get entity class name
        const entityType = entity.constructor.name;

        // Get pool
        const pool = this.entityPools.get(entityType);

        if (pool) {
            // Release to pool
            pool.release(entity);
        } else {
            // Dispose directly
            if (typeof entity.dispose === 'function') {
                entity.dispose();
            }

            // Remove from container
            if (entity.parent) {
                entity.parent.removeChild(entity);
            }
        }
    }

    /**
     * Gets entities at a specific tile
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @returns {Set} Set of entities at the tile
     */
    getEntitiesAt(x, y) {
        const tile = this.getTile(x, y);
        return tile ? tile.entities : new Set();
    }

    /**
     * Gets entities by tag
     * @param {string} tag - Entity tag
     * @returns {Array} Array of entities with the tag
     */
    getEntitiesByTag(tag) {
        const entities = [];

        this.entityPools.forEach(pool => {
            const taggedEntities = pool.getByTag(tag);
            entities.push(...taggedEntities);
        });

        return entities;
    }

    /**
     * Converts screen coordinates to grid coordinates
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @param {number} elevation - Optional elevation to consider
     * @returns {Object} Grid coordinates {x, y}
     */
    screenToGrid(screenX, screenY, elevation = 0) {
        // Convert screen coordinates to world coordinates
        const containerX = this.position.x;
        const containerY = this.position.y;

        // Calculate world coordinates relative to container
        const localX = (screenX - containerX) / this.scale.x;
        const localY = (screenY - containerY) / this.scale.y;

        // Add camera offset to get world coordinates
        const worldX = localX + this.camera.x;
        const worldY = localY + this.camera.y;

        const tileWidthHalf = this.tileWidth / 2;
        const tileHeightHalf = this.tileHeight / 2;

        // Calculate grid coordinates using the correct isometric formula
        const gridY = (worldY / tileHeightHalf - worldX / tileWidthHalf) / 2;
        const gridX = (worldY / tileHeightHalf + worldX / tileWidthHalf) / 2;

        // Round to nearest tile - no manual offset correction needed
        return {
            x: Math.floor(gridX),
            y: Math.floor(gridY)
        };
    }

    /**
     * Converts grid coordinates to screen coordinates
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @param {number} elevation - Optional elevation (height) of the tile
     * @returns {Object} Screen coordinates {x, y}
     */
    gridToScreen(gridX, gridY, elevation = 0) {
        // Convert to isometric coordinates
        const isoX = (gridX - gridY) * this.tileWidth / 2;
        const isoY = (gridX + gridY) * this.tileHeight / 2;

        // Adjust for camera position
        const worldX = isoX - this.camera.x;
        const worldY = isoY - this.camera.y;

        return { x: worldX, y: worldY };
    }

    /**
     * Converts world coordinates to screen coordinates
     * @param {number} worldX - World X coordinate
     * @param {number} worldY - World Y coordinate
     * @returns {Object} Screen coordinates {x, y}
     */
    worldToScreen(worldX, worldY) {
        // Calculate screen coordinates based on container position and scale
        let screenX, screenY;

        if (this.app && this.app.screen) {
            screenX = this.app.screen.width / 2 + (worldX - this.camera.x) * this.camera.zoom;
            screenY = this.app.screen.height / 2 + (worldY - this.camera.y) * this.camera.zoom;
        } else {
            // Fallback to window dimensions if app is not available
            screenX = window.innerWidth / 2 + (worldX - this.camera.x) * this.camera.zoom;
            screenY = window.innerHeight / 2 + (worldY - this.camera.y) * this.camera.zoom;
        }

        return { x: screenX, y: screenY };
    }

    /**
     * Converts grid coordinates to world coordinates
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @returns {Object} World coordinates {x, y}
     */
    gridToWorld(gridX, gridY) {
        // Convert to isometric coordinates
        const isoX = (gridX - gridY) * this.tileWidth / 2;
        const isoY = (gridX + gridY) * this.tileHeight / 2;

        return { x: isoX, y: isoY };
    }

    /**
     * Gets the tile at screen coordinates
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @returns {IsometricTile} The tile or null if not found
     */
    getTileAtScreen(screenX, screenY) {
        // Convert screen coordinates to grid coordinates
        const gridCoords = this.screenToGrid(screenX, screenY);

        // Get the tile at the calculated grid coordinates
        const tile = this.getTile(gridCoords.x, gridCoords.y);

        // Log for debugging
        console.log(`Screen (${screenX}, ${screenY}) -> Grid (${gridCoords.x}, ${gridCoords.y})`);

        return tile;
    }

    /**
     * Sets the camera target
     * @param {Object} target - The target to follow
     */
    setCameraTarget(target) {
        this.camera.target = target;
    }

    /**
     * Sets the camera position
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    setCameraPosition(x, y) {
        this.camera.x = x;
        this.camera.y = y;

        // Apply camera bounds
        this.camera.x = Math.max(this.camera.bounds.minX, Math.min(this.camera.bounds.maxX, this.camera.x));
        this.camera.y = Math.max(this.camera.bounds.minY, Math.min(this.camera.bounds.maxY, this.camera.y));

        // Update camera
        this.updateCamera();
    }

    /**
     * Sets the camera zoom
     * @param {number} zoom - Zoom level
     */
    setCameraZoom(zoom) {
        this.camera.zoom = Math.max(0.1, Math.min(2, zoom));

        // Update camera
        this.updateCamera();
    }

    /**
     * Handles direct clicks on the world container
     * @param {PIXI.InteractionEvent} event - The interaction event
     * @private
     */
    handleDirectClick(event) {
        // Get the global position of the click
        const globalPos = event.data.global;

        // Convert to screen coordinates
        const screenX = globalPos.x;
        const screenY = globalPos.y;

        // Get the tile at the screen coordinates
        const tile = this.getTileAtScreen(screenX, screenY);

        // If we found a tile
        if (tile) {
            console.log(`Clicked on tile at (${tile.gridX}, ${tile.gridY})`);

            // If right-click, move the player to this tile
            if (event.data.button === 2 && this.game && this.game.player) {
                // Get the center position of the tile
                const center = tile.getCenter();

                // Move player to this tile
                this.game.player.setMoveTarget(center);
            }
        }
    }

    /**
     * Updates the camera
     * @private
     */
    updateCamera() {
        // Follow target if set
        if (this.camera.target) {
            // Get target position
            const targetX = this.camera.target.x;
            const targetY = this.camera.target.y;

            // Smoothly move camera towards target
            this.camera.x += (targetX - this.camera.x) * 0.1;
            this.camera.y += (targetY - this.camera.y) * 0.1;
        }

        // Apply camera bounds
        this.camera.x = Math.max(this.camera.bounds.minX, Math.min(this.camera.bounds.maxX, this.camera.x));
        this.camera.y = Math.max(this.camera.bounds.minY, Math.min(this.camera.bounds.maxY, this.camera.y));

        // Calculate the position offset based on camera position
        const offsetX = -this.camera.x * this.camera.zoom;
        const offsetY = -this.camera.y * this.camera.zoom;

        // Apply camera position and zoom to the container
        if (this.app && this.app.screen) {
            this.position.set(
                this.app.screen.width / 2 + offsetX,
                this.app.screen.height / 2 + offsetY
            );
        } else {
            // Fallback to window dimensions if app is not available
            this.position.set(
                window.innerWidth / 2 + offsetX,
                window.innerHeight / 2 + offsetY
            );
        }

        // Apply zoom
        this.scale.set(this.camera.zoom);
    }

    /**
     * Generates a simple world
     * @param {Object} options - Generation options
     */
    generateWorld(options = {}) {
        console.log('Generating world with options:', options);

        // Clear existing world
        this.clearWorld();

        // Default options
        const defaultOptions = {
            seed: Math.random() * 1000,
            terrainTypes: ['grass', 'dirt', 'sand', 'water'],
            terrainWeights: [0.7, 0.2, 0.05, 0.05],
            elevationScale: 0.1,
            elevationOctaves: 2
        };

        // Merge options
        const genOptions = { ...defaultOptions, ...options };

        console.log('World dimensions:', this.gridWidth, 'x', this.gridHeight);

        // Simple random generation for now
        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                // Choose terrain type based on weights
                const terrainType = this.weightedRandom(
                    genOptions.terrainTypes,
                    genOptions.terrainWeights
                );

                // Create placeholder texture (would use actual textures in real implementation)
                const texture = this.createPlaceholderTexture(terrainType);

                if (!texture) {
                    console.error('Failed to create texture for terrain type:', terrainType);
                    continue;
                }

                // Create tile
                const tile = this.createTile(x, y, terrainType, texture, {
                    elevation: Math.floor(Math.random() * 3) * 8
                });

                if (!tile) {
                    console.error('Failed to create tile at position:', x, y);
                }
            }
        }

        console.log('World generation complete. Created', this.tileContainer.children.length, 'tiles.');
    }

    /**
     * Creates a placeholder texture for testing
     * @param {string} type - Tile type
     * @returns {PIXI.Texture} The texture
     * @private
     */
    createPlaceholderTexture(type) {
        // Create a graphics object
        const graphics = new PIXI.Graphics();

        // Set color based on type
        let color;
        switch (type) {
            case 'grass':
                color = 0x44AA44;
                break;
            case 'dirt':
                color = 0x8B4513;
                break;
            case 'sand':
                color = 0xF0E68C;
                break;
            case 'water':
                color = 0x4444AA;
                break;
            default:
                color = 0xAAAAAA;
                break;
        }

        // Draw diamond shape
        graphics.beginFill(color);
        graphics.moveTo(0, -this.tileHeight / 2);
        graphics.lineTo(this.tileWidth / 2, 0);
        graphics.lineTo(0, this.tileHeight / 2);
        graphics.lineTo(-this.tileWidth / 2, 0);
        graphics.closePath();
        graphics.endFill();

        // Draw outline
        graphics.lineStyle(1, 0x000000, 0.3);
        graphics.moveTo(0, -this.tileHeight / 2);
        graphics.lineTo(this.tileWidth / 2, 0);
        graphics.lineTo(0, this.tileHeight / 2);
        graphics.lineTo(-this.tileWidth / 2, 0);
        graphics.closePath();

        // Generate texture
        if (this.app && this.app.renderer) {
            return this.app.renderer.generateTexture(graphics);
        } else {
            console.error('Cannot generate texture: app or renderer is not available');
            // Create a fallback texture
            const canvas = document.createElement('canvas');
            canvas.width = this.tileWidth;
            canvas.height = this.tileHeight;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, 0);
            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.lineTo(canvas.width / 2, canvas.height);
            ctx.lineTo(0, canvas.height / 2);
            ctx.closePath();
            ctx.fill();
            return PIXI.Texture.from(canvas);
        }
    }

    /**
     * Selects a random item based on weights
     * @param {Array} items - Array of items
     * @param {Array} weights - Array of weights
     * @returns {*} The selected item
     * @private
     */
    weightedRandom(items, weights) {
        // Calculate sum of weights
        const sum = weights.reduce((a, b) => a + b, 0);

        // Generate random value
        let random = Math.random() * sum;

        // Find item based on weights
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }

        // Fallback
        return items[0];
    }

    /**
     * Clears the world
     */
    clearWorld() {
        // Remove all tiles
        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                this.removeTile(x, y);
            }
        }

        // Release all entities
        this.entityPools.forEach(pool => {
            pool.releaseAll();
        });

        // Clear active entities
        this.entities.clear();
    }

    /**
     * Draws the debug grid overlay
     * @private
     */
    drawDebugGrid() {
        // Clear previous grid
        this.debugGridOverlay.clear();

        // Remove all children (text labels)
        while (this.debugGridOverlay.children.length > 0) {
            this.debugGridOverlay.removeChildAt(0);
        }

        // Only draw if debug is enabled
        if (!this.game || !this.game.options.debug) {
            return;
        }

        // Set line style - make it more visible
        this.debugGridOverlay.lineStyle(2, 0xFF0000, 0.5);

        // Log camera and container positions for debugging
        console.log('Camera position:', this.camera.x, this.camera.y);
        console.log('Container position:', this.position.x, this.position.y);
        console.log('Tile dimensions - width:', this.tileWidth, 'height:', this.tileHeight);

        // We don't need offsets anymore - the grid should be aligned with the map
        // by using the same coordinate system
        const horizontalOffset = 0;
        const verticalOffset = 0;

        // Draw grid lines using isometric coordinates directly
        // This ensures the grid moves with the map
        for (let x = 0; x <= this.gridWidth; x++) {
            // Convert grid coordinates to isometric coordinates
            const startIsoX = (x - 0) * this.tileWidth / 2;
            const startIsoY = (x + 0) * this.tileHeight / 2;
            const endIsoX = (x - this.gridHeight) * this.tileWidth / 2;
            const endIsoY = (x + this.gridHeight) * this.tileHeight / 2;

            // Draw line
            this.debugGridOverlay.moveTo(startIsoX, startIsoY);
            this.debugGridOverlay.lineTo(endIsoX, endIsoY);

            // Add coordinate label every 5 tiles
            if (x % 5 === 0) {
                // Convert grid coordinates to isometric coordinates
                const labelIsoX = (x - 0) * this.tileWidth / 2;
                const labelIsoY = (x + 0) * this.tileHeight / 2;

                // Create a background for better visibility
                const background = new PIXI.Graphics();
                background.beginFill(0x000000, 0.5);
                background.drawRoundedRect(-20, -10, 40, 20, 5);
                background.endFill();
                background.position.set(labelIsoX, labelIsoY);
                this.debugGridOverlay.addChild(background);

                // Create text with larger font
                const text = new PIXI.Text(`X:${x}`, {
                    fontFamily: 'Arial',
                    fontSize: 14,
                    fill: 0xFFFFFF,
                    stroke: 0xFF0000,
                    strokeThickness: 2,
                    align: 'center'
                });
                text.position.set(labelIsoX, labelIsoY);
                text.anchor.set(0.5, 0.5);
                this.debugGridOverlay.addChild(text);
            }
        }

        for (let y = 0; y <= this.gridHeight; y++) {
            // Convert grid coordinates to isometric coordinates
            const startIsoX = (0 - y) * this.tileWidth / 2;
            const startIsoY = (0 + y) * this.tileHeight / 2;
            const endIsoX = (this.gridWidth - y) * this.tileWidth / 2;
            const endIsoY = (this.gridWidth + y) * this.tileHeight / 2;

            // Draw line
            this.debugGridOverlay.moveTo(startIsoX, startIsoY);
            this.debugGridOverlay.lineTo(endIsoX, endIsoY);

            // Add coordinate label every 5 tiles
            if (y % 5 === 0) {
                // Convert grid coordinates to isometric coordinates
                const labelIsoX = (0 - y) * this.tileWidth / 2;
                const labelIsoY = (0 + y) * this.tileHeight / 2;

                // Create a background for better visibility
                const background = new PIXI.Graphics();
                background.beginFill(0x000000, 0.5);
                background.drawRoundedRect(-20, -10, 40, 20, 5);
                background.endFill();
                background.position.set(labelIsoX, labelIsoY);
                this.debugGridOverlay.addChild(background);

                // Create text with larger font
                const text = new PIXI.Text(`Y:${y}`, {
                    fontFamily: 'Arial',
                    fontSize: 14,
                    fill: 0xFFFFFF,
                    stroke: 0xFF0000,
                    strokeThickness: 2,
                    align: 'center'
                });
                text.position.set(labelIsoX, labelIsoY);
                text.anchor.set(0.5, 0.5);
                this.debugGridOverlay.addChild(text);
            }
        }

        // Draw grid intersections to make the grid more visible
        for (let x = 0; x <= this.gridWidth; x += 5) {
            for (let y = 0; y <= this.gridHeight; y += 5) {
                // Convert grid coordinates to isometric coordinates directly
                const isoX = (x - y) * this.tileWidth / 2;
                const isoY = (x + y) * this.tileHeight / 2;

                // Draw a circle at the intersection
                this.debugGridOverlay.beginFill(0xFF0000, 0.5);
                this.debugGridOverlay.drawCircle(isoX, isoY, 3);
                this.debugGridOverlay.endFill();

                // Add coordinate text at major intersections (every 10 tiles)
                if (x % 10 === 0 && y % 10 === 0) {
                    // Create a background for better visibility
                    const background = new PIXI.Graphics();
                    background.beginFill(0x000000, 0.7);
                    background.drawRoundedRect(-25, -15, 50, 30, 5);
                    background.endFill();
                    background.position.set(isoX, isoY);
                    this.debugGridOverlay.addChild(background);

                    // Create coordinate text
                    const text = new PIXI.Text(`${x},${y}`, {
                        fontFamily: 'Arial',
                        fontSize: 12,
                        fill: 0xFFFFFF,
                        stroke: 0xFF0000,
                        strokeThickness: 1,
                        align: 'center'
                    });
                    text.position.set(isoX, isoY);
                    text.anchor.set(0.5, 0.5);
                    this.debugGridOverlay.addChild(text);
                }
            }
        }
    }

    /**
     * Sorts tiles by depth (back to front)
     * This ensures proper rendering order for isometric view
     */
    sortTiles() {
        // Create an array of all tiles
        const allTiles = [];

        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                const tile = this.getTile(x, y);
                if (tile) {
                    allTiles.push(tile);
                }
            }
        }

        // Sort tiles by grid position (back to front)
        // In isometric view, tiles with lower x+y are in the back
        // and tiles with higher x+y are in the front
        allTiles.sort((a, b) => {
            const depthA = a.gridX + a.gridY;
            const depthB = b.gridX + b.gridY;

            // If depths are equal, sort by x (left to right)
            if (depthA === depthB) {
                return a.gridX - b.gridX;
            }

            return depthA - depthB;
        });

        // Remove all tiles from container
        this.tileContainer.removeChildren();

        // Add tiles back in sorted order
        for (const tile of allTiles) {
            this.tileContainer.addChild(tile);
        }

        console.log('Sorted tiles by depth');
    }

    /**
     * Updates the world
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        console.log('World update called');

        // Update camera - ONLY if we have a camera target
        // This prevents the camera from being updated unnecessarily
        if (this.camera.target) {
            console.log('Updating camera because target is set');
            this.updateCamera();
        }

        // Update entities
        this.entities.forEach(entity => {
            if (entity.active && typeof entity.update === 'function') {
                entity.update(deltaTime);
            }
        });

        // Sort tiles by depth if needed
        if (this.sortTilesByDepth) {
            this.sortTiles();
            this.sortTilesByDepth = false; // Only sort when needed
        }

        // Draw debug grid if debug is enabled
        if (this.game && this.game.options.debug) {
            this.drawDebugGrid();
        }
    }

    /**
     * Disposes of the world
     */
    dispose() {
        // Clear world
        this.clearWorld();

        // Dispose entity pools
        this.entityPools.forEach(pool => {
            pool.dispose();
        });

        // Clear pools
        this.entityPools.clear();

        // Destroy container
        this.destroy({ children: true });
    }
}

