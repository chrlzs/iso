import { IsometricTile } from './IsometricTile.js';
import { EntityPool } from '../utils/EntityPool.js';
import { PIXI, Container } from '../utils/PixiWrapper.js';
import { WorldConfig } from '../core/WorldConfig.js';

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
        
        // Store references
        this.app = options.app;
        this.game = options.game;

        // Initialize world configuration with proper coordinate system
        this.config = new WorldConfig({
            width: options.width || 32,
            height: options.height || 32,
            tileWidth: options.tileWidth || 64,
            tileHeight: options.tileHeight || 32,
            cameraBoundsMinX: options.cameraBoundsMinX || -1000,
            cameraBoundsMaxX: options.cameraBoundsMaxX || 1000,
            cameraBoundsMinY: options.cameraBoundsMinY || -1000,
            cameraBoundsMaxY: options.cameraBoundsMaxY || 1000
        });

        // Initialize entity tracking first
        this.entities = new Set();
        this.entityPools = new Map();

        // Enable interaction properly
        this.eventMode = 'dynamic';
        this.interactiveChildren = true;
        this.sortableChildren = true;  // Enable proper z-sorting
        
        // Create layers
        this.groundLayer = new Container();
        this.entityLayer = new Container();
        this.structureLayer = new Container();
        this.selectionContainer = new Container(); // Container for tile selection/highlights
        this.entityContainer = new Container(); // Container for game entities like players, enemies, etc.
        this.debugGridOverlay = new Container();

        // Make tile container interactive
        this.groundLayer.eventMode = 'dynamic';
        this.groundLayer.interactiveChildren = true;
        this.groundLayer.sortableChildren = true;

        // Add layers in correct order
        this.addChild(this.groundLayer);
        this.addChild(this.entityLayer);
        this.addChild(this.structureLayer);
        this.addChild(this.entityContainer);
        this.addChild(this.selectionContainer);
        this.addChild(this.debugGridOverlay);

        // Initialize tiles array
        this.tiles = [];
        this.tilesByCoord = new Map();

        // Create camera
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1,
            target: null,
            bounds: {
                minX: this.config.cameraBoundsMinX,
                minY: this.config.cameraBoundsMinY,
                maxX: this.config.cameraBoundsMaxX,
                maxY: this.config.cameraBoundsMaxY
            }
        };

        // Remove direct click handling since it's now managed by InputManager
        this.hitArea = new PIXI.Rectangle(
            -this.config.gridWidth * this.config.tileWidth,
            -this.config.gridHeight * this.config.tileHeight,
            this.config.gridWidth * this.config.tileWidth * 2,
            this.config.gridHeight * this.config.tileHeight * 2
        );
        
        // Initialize the world
        this.initialize(options);
    }

    /**
     * Initializes the world
     * @param {Object} options - Initialization options
     * @private
     */
    initialize(options) {
        // Create empty tile grid first
        this.createEmptyGrid();

        // Generate world first if requested, before anything else
        if (options.generateWorld) {
            console.log('Generating world...');
            this.generateWorld(options.worldOptions || {});
        }

        // Create tile container with no offset
        this.groundLayer.position.set(0, 0);

        // Set initial camera position to center of world
        this.camera.x = (this.config.gridWidth * this.config.tileWidth) / 4;
        this.camera.y = (this.config.gridHeight * this.config.tileHeight) / 4;

        // Apply camera position
        this.updateCamera();
    }

    /**
     * Creates an empty tile grid
     * @private
     */
    createEmptyGrid() {
        console.log('Creating empty grid with dimensions:', this.config.gridWidth, 'x', this.config.gridHeight);

        // Initialize 2D array
        this.tiles = new Array(this.config.gridWidth);

        for (let x = 0; x < this.config.gridWidth; x++) {
            this.tiles[x] = new Array(this.config.gridHeight);

            for (let y = 0; y < this.config.gridHeight; y++) {
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
        if (x < 0 || x >= this.config.gridWidth || y < 0 || y >= this.config.gridHeight) {
            console.warn(`Tile position out of bounds: ${x}, ${y}`);
            return null;
        }

        // Remove existing tile if any
        if (this.tiles[x][y]) {
            this.removeTile(x, y);
        }

        // Create new tile with explicit grid coordinates
        const tile = new IsometricTile({
            x: x,  // Explicitly use the provided grid coordinates
            y: y,  // Explicitly use the provided grid coordinates
            type,
            width: this.config.tileWidth,
            height: this.config.tileHeight,
            texture,
            world: this,
            game: this.game,
            ...options
        });

        // Explicitly set game reference
        tile.game = this.game;
        tile.world = this;

        // Double-check that the grid coordinates are set correctly
        if (tile.gridX !== x || tile.gridY !== y) {
            console.warn(`Grid coordinate mismatch in createTile: Expected (${x}, ${y}), got (${tile.gridX}, ${tile.gridY})`);
            // Force the correct grid coordinates
            tile.gridX = x;
            tile.gridY = y;
        }

        // Store the world position of this tile
        const worldPos = this.gridToWorld(x, y);
        tile.worldX = worldPos.x;
        tile.worldY = worldPos.y;

        console.log(`Created tile at grid (${x}, ${y}), world (${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)})`);

        // Add to grid
        this.tiles[x][y] = tile;

        // Add to container
        this.groundLayer.addChild(tile);

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
        if (x < 0 || x >= this.config.gridWidth || y < 0 || y >= this.config.gridHeight) {
            return;
        }

        const tile = this.tiles[x][y];

        if (!tile) return;

        // Remove from container
        this.groundLayer.removeChild(tile);

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
        // Handle NaN or undefined values
        if (isNaN(x) || isNaN(y) || x === undefined || y === undefined) {
            console.warn('Invalid coordinates passed to getTile:', x, y);
            return null;
        }

        // Round coordinates to integers to handle floating point issues
        const gridX = Math.floor(x);
        const gridY = Math.floor(y);

        // Check if position is valid
        if (gridX < 0 || gridX >= this.config.gridWidth || gridY < 0 || gridY >= this.config.gridHeight) {
            // Return null for invalid coordinates
            return null;
        }

        // Ensure tiles array exists
        if (!this.tiles || !this.tiles[gridX]) {
            console.warn('Tiles array not properly initialized at position:', gridX, gridY);
            return null;
        }

        // Get tile from grid
        return this.tiles[gridX][gridY];
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
            container: this.entityLayer
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
     * @returns {Object} Grid coordinates {x, y}
     */
    screenToGrid(screenX, screenY) {
        // Convert screen coordinates to local coordinates
        const localX = (screenX - this.position.x) / this.scale.x;
        const localY = (screenY - this.position.y) / this.scale.y;

        // Add camera offset to get world coordinates
        const worldX = localX + this.camera.x;
        const worldY = localY + this.camera.y;

        // Convert world coordinates to grid coordinates
        return this.worldToGrid(worldX, worldY);
    }

    /**
     * Converts grid coordinates to world coordinates
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @returns {Object} World coordinates {x, y}
     */
    gridToWorld(gridX, gridY) {
        return this.config.gridToWorld(gridX, gridY);
    }

    /**
     * Converts world coordinates to grid coordinates
     * @param {number} worldX - World X coordinate
     * @param {number} worldY - World Y coordinate
     * @returns {Object} Grid coordinates {x, y}
     */
    worldToGrid(worldX, worldY) {
        return this.config.worldToGrid(worldX, worldY);
    }

    /**
     * Updates the coordinate system configuration
     * @param {Object} config - New configuration
     */
    updateCoordinates(config) {
        this.config.updateCoordinates(config);
        this.drawDebugGrid();
    }

    /**
     * Gets the tile at screen coordinates using hit testing
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @returns {IsometricTile} The tile or null if not found
     */
    getTileAtScreen(screenX, screenY) {
        // Convert screen coordinates to local space
        const point = new PIXI.Point(screenX, screenY);
        const localPoint = this.toLocal(point);

        // Convert to grid coordinates using standard isometric formula
        const tileWidthHalf = this.config.tileWidth / 2;
        const tileHeightHalf = this.config.tileHeight / 2;

        // Convert from isometric to grid coordinates with proper offset
        const isoX = localPoint.x / tileWidthHalf;
        const isoY = localPoint.y / tileHeightHalf;
        
        // These formulas convert isometric screen coordinates to grid coordinates
        const gridY = Math.floor((isoY - isoX) / 2);
        const gridX = Math.floor((isoY + isoX) / 2);

        // Early bounds check
        if (gridX < 0 || gridX >= this.config.gridWidth || 
            gridY < 0 || gridY >= this.config.gridHeight) {
            return null;
        }

        // Get the candidate tile
        const tile = this.getTile(gridX, gridY);
        if (!tile) {
            return null;
        }

        // If the precise hit test passes, use this tile
        if (tile.containsPoint(point)) {
            return tile;
        }

        // If the precise hit test fails, test neighboring tiles
        const neighbors = [
            this.getTile(gridX - 1, gridY),
            this.getTile(gridX + 1, gridY),
            this.getTile(gridX, gridY - 1),
            this.getTile(gridX, gridY + 1)
        ];

        for (const neighbor of neighbors) {
            if (neighbor && neighbor.containsPoint(point)) {
                return neighbor;
            }
        }

        // If no precise hit was found, return the original tile as a fallback
        return tile;
    }

    /**
     * Sets the camera target
     * @param {Object} target - The target to follow
     */
    setCameraTarget(target) {
        console.log('Setting camera target:', target ? 'target set' : 'target cleared');
        this.camera.target = target;

        // Immediately update camera to center on target
        if (target) {
            this.camera.x = target.x;
            this.camera.y = target.y;
            this.updateCamera();
        }
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

            console.log('Camera following target:', targetX, targetY, '-> Camera position:', this.camera.x, this.camera.y);
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

        // Log camera position for debugging
        console.log('Camera updated - Position:', this.camera.x, this.camera.y, 'Zoom:', this.camera.zoom);
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
            terrainWeights: [0.8, 0.15, 0.04, 0.01], // Increased chance of walkable tiles
            elevationScale: 0.1,
            elevationOctaves: 2
        };

        // Merge options
        const genOptions = { ...defaultOptions, ...options };

        console.log('World dimensions:', this.config.gridWidth, 'x', this.config.gridHeight);

        // Initialize tiles array if needed
        if (!this.tiles || this.tiles.length === 0) {
            this.createEmptyGrid();
        }

        // Track walkable tiles for player placement
        let walkableTiles = [];

        // Generate tiles
        for (let x = 0; x < this.config.gridWidth; x++) {
            for (let y = 0; y < this.config.gridHeight; y++) {
                // Choose terrain type based on weights
                const terrainType = this.weightedRandom(
                    genOptions.terrainTypes,
                    genOptions.terrainWeights
                );

                // Create placeholder texture
                const texture = this.createPlaceholderTexture(terrainType);

                if (!texture) {
                    console.error('Failed to create texture for terrain type:', terrainType);
                    continue;
                }

                // Create tile with walkable property based on terrain type
                const isWalkable = terrainType !== 'water'; // Only water is unwalkable
                const tile = this.createTile(x, y, terrainType, texture, {
                    elevation: Math.floor(Math.random() * 3) * 8,
                    walkable: isWalkable
                });

                if (tile) {
                    // Track walkable tiles for player placement
                    if (isWalkable) {
                        walkableTiles.push(tile);
                    }
                } else {
                    console.error('Failed to create tile at position:', x, y);
                }
            }
        }

        // Ensure we have at least some walkable tiles
        if (walkableTiles.length === 0) {
            console.warn('No walkable tiles generated, creating a safe starting area');
            // Create a safe starting area in the center
            const centerX = Math.floor(this.config.gridWidth / 2);
            const centerY = Math.floor(this.config.gridHeight / 2);
            const texture = this.createPlaceholderTexture('grass');
            
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const x = centerX + dx;
                    const y = centerY + dy;
                    if (x >= 0 && x < this.config.gridWidth && y >= 0 && y < this.config.gridHeight) {
                        const tile = this.createTile(x, y, 'grass', texture, {
                            elevation: 0,
                            walkable: true
                        });
                        if (tile) {
                            walkableTiles.push(tile);
                        }
                    }
                }
            }
        }

        console.log('World generation complete. Created', this.groundLayer.children.length, 'tiles,', walkableTiles.length, 'walkable');
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
        graphics.moveTo(0, -this.config.tileHeight / 2);
        graphics.lineTo(this.config.tileWidth / 2, 0);
        graphics.lineTo(0, this.config.tileHeight / 2);
        graphics.lineTo(-this.config.tileWidth / 2, 0);
        graphics.closePath();
        graphics.endFill();

        // Draw outline
        graphics.lineStyle(1, 0x000000, 0.3);
        graphics.moveTo(0, -this.config.tileHeight / 2);
        graphics.lineTo(this.config.tileWidth / 2, 0);
        graphics.lineTo(0, this.config.tileHeight / 2);
        graphics.lineTo(-this.config.tileWidth / 2, 0);
        graphics.closePath();

        // Generate texture
        if (this.app && this.app.renderer) {
            return this.app.renderer.generateTexture(graphics);
        } else {
            console.error('Cannot generate texture: app or renderer is not available');
            // Create a fallback texture
            const canvas = document.createElement('canvas');
            canvas.width = this.config.tileWidth;
            canvas.height = this.config.tileHeight;
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
        for (let x = 0; x < this.config.gridWidth; x++) {
            for (let y = 0; y < this.config.gridHeight; y++) {
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
        this.debugGridOverlay.removeChildren();

        const { gridWidth, gridHeight, tileWidth, tileHeight, gridOffsetX, gridOffsetY, gridScale } = this.config;

        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                const worldPos = this.gridToWorld(x, y);
                const isoX = worldPos.x + gridOffsetX * gridScale;
                const isoY = worldPos.y + gridOffsetY * gridScale;

                // Draw a small dot at each intersection
                const marker = new PIXI.Graphics();
                marker.beginFill(0xFF0000, 0.5);
                marker.drawCircle(0, 0, 2);
                marker.endFill();
                marker.position.set(isoX, isoY);
                marker.scale.set(gridScale);
                this.debugGridOverlay.addChild(marker);

                // Add larger markers at major intersections
                if (x % 5 === 0 && y % 5 === 0) {
                    const majorMarker = new PIXI.Graphics();
                    majorMarker.beginFill(0xFF0000, 0.7);
                    majorMarker.drawCircle(0, 0, 4);
                    majorMarker.endFill();
                    majorMarker.position.set(isoX, isoY);
                    majorMarker.scale.set(gridScale);
                    this.debugGridOverlay.addChild(majorMarker);
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

        for (let x = 0; x < this.config.gridWidth; x++) {
            for (let y = 0; y < this.config.gridHeight; y++) {
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
        this.groundLayer.removeChildren();

        // Add tiles back in sorted order
        for (const tile of allTiles) {
            this.groundLayer.addChild(tile);
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

        // Always draw debug grid if it's visible
        if (this.debugGridOverlay && this.debugGridOverlay.visible) {
            this.drawDebugGrid();
            // Log that we're drawing the grid
            console.log('Drawing debug grid in update cycle');
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

