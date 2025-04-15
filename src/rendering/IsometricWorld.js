import { IsometricTile } from './IsometricTile.js';
import { EntityPool } from '../utils/EntityPool.js';
import { PIXI, Container } from '../utils/PixiWrapper.js';
import { WorldConfig } from '../core/WorldConfig.js';
import { WorldChunk } from './WorldChunk.js';

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
            chunkSize: options.chunkSize || 16,
            loadDistance: options.loadDistance || 2,
            unloadDistance: options.unloadDistance || 3,
            generateDistance: options.generateDistance || 1,
            cameraBoundsMinX: options.cameraBoundsMinX || -1000,
            cameraBoundsMaxX: options.cameraBoundsMaxX || 1000,
            cameraBoundsMinY: options.cameraBoundsMinY || -1000,
            cameraBoundsMaxY: options.cameraBoundsMaxY || 1000
        });

        // Set world seed for consistent generation
        this.seed = options.seed || Math.floor(Math.random() * 1000000);

        // Set world ID for persistence
        this.worldId = options.worldId || 'default';

        // Chunk persistence
        this.persistChunks = options.persistChunks !== false;
        this.chunkStorage = options.chunkStorage || null;

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

        // Make tile container interactive
        this.groundLayer.eventMode = 'dynamic';
        this.groundLayer.interactiveChildren = true;
        this.groundLayer.sortableChildren = true;

        // Make entity container sortable and ensure it's visible
        this.entityContainer.sortableChildren = true;
        this.entityContainer.zIndex = 100; // Ensure entities are above tiles

        // Add layers in correct order
        this.addChild(this.groundLayer);
        this.addChild(this.entityLayer);
        this.addChild(this.structureLayer);
        this.addChild(this.entityContainer);
        this.addChild(this.selectionContainer);

        // Initialize chunk management
        this.chunks = new Map(); // Map of chunk coordinates to chunk objects
        this.activeChunks = new Set(); // Set of currently loaded chunk keys

        // Create chunk container
        this.chunkContainer = new Container();
        this.chunkContainer.sortableChildren = true;
        this.addChild(this.chunkContainer);

        // Keep tiles array for backward compatibility during transition
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

        // For chunk-based worlds, we need to handle coordinates outside the original world bounds
        // This allows the player to navigate to new chunks

        // First, check if the coordinates are within the original world bounds
        if (gridX >= 0 && gridX < this.config.gridWidth && gridY >= 0 && gridY < this.config.gridHeight) {
            // If within original bounds, use the tiles array
            if (this.tiles && this.tiles[gridX] && this.tiles[gridX][gridY]) {
                return this.tiles[gridX][gridY];
            }
        }

        // If outside original bounds or tile not found in original array, try to get from chunk system
        const chunkCoords = this.config.gridToChunk(gridX, gridY);
        const chunk = this.getChunk(chunkCoords.chunkX, chunkCoords.chunkY);

        if (chunk && chunk.isLoaded) {
            // Convert to local chunk coordinates
            const localX = gridX - (chunkCoords.chunkX * this.config.chunkSize);
            const localY = gridY - (chunkCoords.chunkY * this.config.chunkSize);

            // Get the tile from the chunk
            return chunk.getTile(localX, localY);
        }

        // If no chunk found or chunk not loaded, return null
        return null;
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
        let gridY = Math.floor((isoY - isoX) / 2);
        let gridX = Math.floor((isoY + isoX) / 2);

        console.log(`Screen (${screenX}, ${screenY}) -> Local (${localPoint.x.toFixed(2)}, ${localPoint.y.toFixed(2)}) -> Grid (${gridX}, ${gridY})`);

        // For chunk-based worlds, we don't need to clamp coordinates to the original world bounds
        // Instead, we'll let the chunk system handle coordinates outside the original world bounds
        // This allows the player to navigate to new chunks

        // Only apply a very loose clamping to prevent extreme values
        const maxDistance = 1000; // Allow coordinates up to 1000 tiles away from origin
        gridX = Math.max(-maxDistance, Math.min(gridX, this.config.gridWidth + maxDistance));
        gridY = Math.max(-maxDistance, Math.min(gridY, this.config.gridHeight + maxDistance));

        // For chunk-based world, we need to find the chunk that contains this grid position
        const chunkCoords = this.config.gridToChunk(gridX, gridY);
        const chunk = this.getChunk(chunkCoords.chunkX, chunkCoords.chunkY);

        if (!chunk || !chunk.isLoaded) {
            console.log(`No loaded chunk found at (${chunkCoords.chunkX}, ${chunkCoords.chunkY}) for grid (${gridX}, ${gridY})`);
            return null;
        }

        // Convert to local chunk coordinates
        const localX = gridX - (chunkCoords.chunkX * this.config.chunkSize);
        const localY = gridY - (chunkCoords.chunkY * this.config.chunkSize);

        // Get the tile from the chunk
        const tile = chunk.getTile(localX, localY);
        if (!tile) {
            console.log(`No tile found in chunk at local (${localX}, ${localY})`);
            return null;
        }

        // Ensure tile has proper references
        if (tile.world !== this) {
            console.log(`Setting world reference for tile at (${tile.gridX}, ${tile.gridY})`);
            tile.world = this;
        }

        if (tile.game !== this.game) {
            console.log(`Setting game reference for tile at (${tile.gridX}, ${tile.gridY})`);
            tile.game = this.game;
        }

        // If the precise hit test passes, use this tile
        try {
            if (tile.containsPoint(point)) {
                console.log(`Found tile at grid (${tile.gridX}, ${tile.gridY}) with hit test`);
                return tile;
            }
        } catch (error) {
            console.error(`Error testing containsPoint for tile (${tile.gridX}, ${tile.gridY}):`, error);
            // Continue with neighbor checks
        }

        // If the precise hit test fails, test neighboring tiles
        // We need to check neighboring chunks as well
        const neighbors = [];

        // Check all 8 surrounding positions
        const directions = [
            {dx: -1, dy: 0}, {dx: 1, dy: 0}, {dx: 0, dy: -1}, {dx: 0, dy: 1},
            {dx: -1, dy: -1}, {dx: 1, dy: -1}, {dx: -1, dy: 1}, {dx: 1, dy: 1}
        ];

        for (const dir of directions) {
            const nx = gridX + dir.dx;
            const ny = gridY + dir.dy;

            // For chunk-based worlds, we don't need to check world bounds
            // This allows the player to navigate to new chunks

            // Only apply a very loose boundary check to prevent extreme values
            const maxDistance = 1000; // Allow coordinates up to 1000 tiles away from origin
            if (nx < -maxDistance || nx >= this.config.gridWidth + maxDistance ||
                ny < -maxDistance || ny >= this.config.gridHeight + maxDistance) {
                continue;
            }

            // Get the chunk for this neighbor
            const neighborChunkCoords = this.config.gridToChunk(nx, ny);
            const neighborChunk = this.getChunk(neighborChunkCoords.chunkX, neighborChunkCoords.chunkY);

            if (!neighborChunk || !neighborChunk.isLoaded) {
                continue;
            }

            // Convert to local chunk coordinates
            const neighborLocalX = nx - (neighborChunkCoords.chunkX * this.config.chunkSize);
            const neighborLocalY = ny - (neighborChunkCoords.chunkY * this.config.chunkSize);

            // Get the tile from the chunk
            const neighborTile = neighborChunk.getTile(neighborLocalX, neighborLocalY);
            if (neighborTile) {
                neighbors.push(neighborTile);
            }
        }

        // Find the closest valid tile that contains the point
        for (const neighbor of neighbors) {
            if (neighbor) {
                // Ensure neighbor has proper references
                if (neighbor.world !== this) {
                    console.log(`Setting world reference for neighbor tile at (${neighbor.gridX}, ${neighbor.gridY})`);
                    neighbor.world = this;
                }

                if (neighbor.game !== this.game) {
                    console.log(`Setting game reference for neighbor tile at (${neighbor.gridX}, ${neighbor.gridY})`);
                    neighbor.game = this.game;
                }

                try {
                    if (neighbor.containsPoint(point)) {
                        console.log(`Found neighboring tile at grid (${neighbor.gridX}, ${neighbor.gridY}) with hit test`);
                        return neighbor;
                    }
                } catch (error) {
                    console.error(`Error testing containsPoint for neighbor tile (${neighbor.gridX}, ${neighbor.gridY}):`, error);
                    // Continue with other neighbors
                }
            }
        }

        // Return the original tile as fallback if no better match found
        console.log(`Using original tile at grid (${tile.gridX}, ${tile.gridY}) as fallback`);

        // Ensure tile has proper references one more time before returning
        if (tile.world !== this) {
            console.log(`Setting world reference for fallback tile at (${tile.gridX}, ${tile.gridY})`);
            tile.world = this;
        }

        if (tile.game !== this.game) {
            console.log(`Setting game reference for fallback tile at (${tile.gridX}, ${tile.gridY})`);
            tile.game = this.game;
        }

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

            // console.log('Camera following target:', targetX, targetY, '-> Camera position:', this.camera.x, this.camera.y);
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
        //console.log('Camera updated - Position:', this.camera.x, this.camera.y, 'Zoom:', this.camera.zoom);
    }

    /**
     * Generates a simple world
     * @param {Object} options - Generation options
     */
    generateWorld(options = {}) {
        console.log('Generating world with options:', options);

        // Clear existing world and optionally clear storage
        const clearStorage = options.clearStorage !== false;
        this.clearWorld(clearStorage);

        // Set world seed
        this.seed = options.seed || Math.floor(Math.random() * 1000000);

        // Default options
        const defaultOptions = {
            seed: this.seed,
            terrainTypes: ['grass', 'dirt', 'sand', 'water'],
            terrainWeights: [0.85, 0.1, 0.04, 0.01], // Further increased chance of walkable tiles, reduced water
            elevationScale: 0.1,
            elevationOctaves: 2
        };

        // Merge options
        const genOptions = { ...defaultOptions, ...options };

        console.log('Using chunk-based world generation');

        // If player exists, generate chunks around player
        if (this.game.player) {
            const playerPos = {
                gridX: this.game.player.gridX,
                gridY: this.game.player.gridY
            };

            // Convert to chunk coordinates
            const playerChunk = this.config.gridToChunk(playerPos.gridX, playerPos.gridY);

            // Generate chunks around player
            const genDistance = this.config.generateDistance;
            for (let dx = -genDistance; dx <= genDistance; dx++) {
                for (let dy = -genDistance; dy <= genDistance; dy++) {
                    const chunkX = playerChunk.chunkX + dx;
                    const chunkY = playerChunk.chunkY + dy;

                    // Skip if outside world limits
                    if (this.config.isChunkOutsideWorldLimits(chunkX, chunkY)) {
                        continue;
                    }

                    // Generate and load chunk
                    this.loadChunk(chunkX, chunkY);
                }
            }
        } else {
            // No player, generate center chunk
            this.loadChunk(0, 0);
        }

        // Initialize tiles array for backward compatibility
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

        // Cyberpunk color scheme
        let mainColor, glowColor;
        switch (type) {
            case 'grass':
                mainColor = 0x00FFAA;  // Neon cyan
                glowColor = 0x33FF66;  // Neon green
                break;
            case 'dirt':
                mainColor = 0xFF00AA;  // Neon pink
                glowColor = 0xFF3366;  // Neon red
                break;
            case 'sand':
                mainColor = 0xFFAA00;  // Neon orange
                glowColor = 0xFFFF00;  // Neon yellow
                break;
            case 'water':
                mainColor = 0x00AAFF;  // Neon blue
                glowColor = 0x0066FF;  // Electric blue
                break;
            default:
                mainColor = 0x00AAFF;  // Default neon blue
                glowColor = 0x0066FF;  // Default electric blue
                break;
        }

        // Add glow effect
        graphics.lineStyle(4, glowColor, 0.2);
        graphics.moveTo(0, -this.config.tileHeight / 2);
        graphics.lineTo(this.config.tileWidth / 2, 0);
        graphics.lineTo(0, this.config.tileHeight / 2);
        graphics.lineTo(-this.config.tileWidth / 2, 0);
        graphics.closePath();

        // Draw main shape
        graphics.beginFill(mainColor, 0.8);
        graphics.lineStyle(2, glowColor, 0.6);
        graphics.moveTo(0, -this.config.tileHeight / 2);
        graphics.lineTo(this.config.tileWidth / 2, 0);
        graphics.lineTo(0, this.config.tileHeight / 2);
        graphics.lineTo(-this.config.tileWidth / 2, 0);
        graphics.closePath();
        graphics.endFill();

        // Add grid pattern
        graphics.lineStyle(1, glowColor, 0.1);
        for (let i = -this.config.tileWidth/2; i <= this.config.tileWidth/2; i += 10) {
            graphics.moveTo(i, -this.config.tileHeight/2);
            graphics.lineTo(i, this.config.tileHeight/2);
        }
        for (let i = -this.config.tileHeight/2; i <= this.config.tileHeight/2; i += 10) {
            graphics.moveTo(-this.config.tileWidth/2, i);
            graphics.lineTo(this.config.tileWidth/2, i);
        }

        // Generate texture
        if (this.app && this.app.renderer) {
            return this.app.renderer.generateTexture(graphics);
        } else {
            console.error('Cannot generate texture: app or renderer is not available');
            // Create a fallback texture with basic cyberpunk style
            const canvas = document.createElement('canvas');
            canvas.width = this.config.tileWidth;
            canvas.height = this.config.tileHeight;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = `#${mainColor.toString(16).padStart(6, '0')}`;
            ctx.strokeStyle = `#${glowColor.toString(16).padStart(6, '0')}`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, 0);
            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.lineTo(canvas.width / 2, canvas.height);
            ctx.lineTo(0, canvas.height / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
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
     * @param {boolean} clearStorage - Whether to clear stored chunks
     */
    clearWorld(clearStorage = false) {
        // Unload all chunks
        for (const key of this.activeChunks) {
            const [chunkX, chunkY] = key.split(',').map(Number);
            this.unloadChunk(chunkX, chunkY);
        }

        // Clear chunks map
        this.chunks.clear();
        this.activeChunks.clear();

        // Clear storage if requested
        if (clearStorage && this.persistChunks && this.chunkStorage) {
            console.log(`Clearing all stored chunks for world ${this.worldId}`);
            this.chunkStorage.clearWorld(this.worldId);
        }

        // Remove all tiles (for backward compatibility)
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
        //console.log('World update called');

        // Update camera - ONLY if we have a camera target
        // This prevents the camera from being updated unnecessarily
        if (this.camera.target) {
            //console.log('Updating camera because target is set');
            this.updateCamera();

            // Update chunk loading based on player position
            this.updateChunks();
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

        // Update chunk visibility based on camera position
        this.updateChunkVisibility();
    }

    /**
     * Updates chunk loading/unloading based on player position
     */
    updateChunks() {
        // Get player position
        const player = this.game.player;
        if (!player) return;

        // Ensure player is visible
        if (!player.visible) {
            console.log('Making player visible');
            player.visible = true;
            player.alpha = 1.0;

            // Ensure player is in the entity container
            if (!this.entityContainer.children.includes(player)) {
                console.log('Re-adding player to entity container');
                this.entityContainer.addChild(player);
            }
        }

        // Convert player position to chunk coordinates
        const playerChunkCoords = this.config.gridToChunk(
            player.gridX,
            player.gridY
        );

        // Determine chunks to load
        const chunksToLoad = [];
        const loadDistance = this.config.loadDistance;

        for (let dx = -loadDistance; dx <= loadDistance; dx++) {
            for (let dy = -loadDistance; dy <= loadDistance; dy++) {
                const chunkX = playerChunkCoords.chunkX + dx;
                const chunkY = playerChunkCoords.chunkY + dy;

                // Skip if far outside world limits
                if (this.isFarOutsideWorldLimits(chunkX, chunkY)) {
                    continue;
                }

                chunksToLoad.push({ chunkX, chunkY });
            }
        }

        // Load chunks that should be loaded
        for (const { chunkX, chunkY } of chunksToLoad) {
            this.loadChunk(chunkX, chunkY);
        }

        // Unload chunks that are too far away
        const unloadDistance = this.config.unloadDistance;
        for (const key of this.activeChunks) {
            const [chunkX, chunkY] = key.split(',').map(Number);

            const dx = Math.abs(chunkX - playerChunkCoords.chunkX);
            const dy = Math.abs(chunkY - playerChunkCoords.chunkY);

            if (dx > unloadDistance || dy > unloadDistance) {
                this.unloadChunk(chunkX, chunkY);
            }
        }
    }

    /**
     * Updates chunk visibility based on camera position
     */
    updateChunkVisibility() {
        // Get camera bounds
        const cameraBounds = this.getCameraBounds();

        // Update visibility of chunks
        for (const key of this.activeChunks) {
            const [chunkX, chunkY] = key.split(',').map(Number);
            const chunk = this.getChunk(chunkX, chunkY);

            if (chunk && chunk.isLoaded) {
                // Check if chunk is visible in camera
                const chunkBounds = this.getChunkBounds(chunkX, chunkY);
                const isVisible = this.boundsIntersect(cameraBounds, chunkBounds);

                // Update visibility
                chunk.container.visible = isVisible;
            }
        }
    }

    /**
     * Gets the camera bounds
     * @param {number} padding - Additional padding to add to the bounds (default: 200)
     * @returns {Object} Camera bounds {minX, minY, maxX, maxY}
     */
    getCameraBounds(padding = 200) {
        // Get camera position and screen dimensions
        const cameraX = this.camera.x;
        const cameraY = this.camera.y;
        const screenWidth = this.app.screen.width / this.camera.zoom;
        const screenHeight = this.app.screen.height / this.camera.zoom;

        // Calculate camera bounds with padding
        return {
            minX: cameraX - screenWidth/2 - padding,
            maxX: cameraX + screenWidth/2 + padding,
            minY: cameraY - screenHeight/2 - padding,
            maxY: cameraY + screenHeight/2 + padding
        };
    }

    /**
     * Gets the bounds of a chunk
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkY - Chunk Y coordinate
     * @returns {Object} Chunk bounds {minX, minY, maxX, maxY}
     */
    getChunkBounds(chunkX, chunkY) {
        // Get grid coordinates of chunk corners
        const topLeft = this.config.chunkToGrid(chunkX, chunkY);
        const bottomRight = {
            gridX: topLeft.gridX + this.config.chunkSize - 1,
            gridY: topLeft.gridY + this.config.chunkSize - 1
        };

        // Convert to world coordinates
        const worldTopLeft = this.gridToWorld(topLeft.gridX, topLeft.gridY);
        const worldBottomRight = this.gridToWorld(bottomRight.gridX, bottomRight.gridY);

        // Calculate bounds
        return {
            minX: Math.min(worldTopLeft.x, worldBottomRight.x) - 100,
            maxX: Math.max(worldTopLeft.x, worldBottomRight.x) + 100,
            minY: Math.min(worldTopLeft.y, worldBottomRight.y) - 100,
            maxY: Math.max(worldTopLeft.y, worldBottomRight.y) + 100
        };
    }

    /**
     * Checks if two bounds intersect
     * @param {Object} bounds1 - First bounds {minX, minY, maxX, maxY}
     * @param {Object} bounds2 - Second bounds {minX, minY, maxX, maxY}
     * @returns {boolean} True if bounds intersect
     */
    boundsIntersect(bounds1, bounds2) {
        return (
            bounds1.minX <= bounds2.maxX &&
            bounds1.maxX >= bounds2.minX &&
            bounds1.minY <= bounds2.maxY &&
            bounds1.maxY >= bounds2.minY
        );
    }

    /**
     * Gets a chunk at the specified position
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkY - Chunk Y coordinate
     * @param {boolean} createIfMissing - Whether to create the chunk if it doesn't exist
     * @returns {WorldChunk} The chunk at the specified position
     */
    getChunk(chunkX, chunkY, createIfMissing = false) {
        const key = `${chunkX},${chunkY}`;

        if (!this.chunks.has(key) && createIfMissing) {
            const chunk = new WorldChunk({
                chunkX,
                chunkY,
                size: this.config.chunkSize,
                world: this
            });
            this.chunks.set(key, chunk);
            return chunk;
        }

        return this.chunks.get(key) || null;
    }

    /**
     * Loads a chunk at the specified position
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkY - Chunk Y coordinate
     * @returns {WorldChunk} The loaded chunk
     */
    loadChunk(chunkX, chunkY) {
        // Get or create chunk
        const chunk = this.getChunk(chunkX, chunkY, true);

        // If chunk is not generated, try to load from storage first
        if (!chunk.isGenerated && this.persistChunks && this.chunkStorage) {
            const storedData = this.chunkStorage.loadChunk(this.worldId, chunkX, chunkY);

            if (storedData) {
                console.log(`Loading chunk (${chunkX}, ${chunkY}) from storage`);
                chunk.deserialize(storedData);
            } else {
                // No stored data, generate new chunk
                console.log(`Generating new chunk (${chunkX}, ${chunkY})`);
                chunk.generate();
            }
        } else if (!chunk.isGenerated) {
            // Not using persistence or no storage available, generate new chunk
            chunk.generate();
        }

        // Load chunk into memory if not already loaded
        if (!chunk.isLoaded) {
            chunk.load();
            this.chunkContainer.addChild(chunk.container);
            this.activeChunks.add(`${chunkX},${chunkY}`);
        }

        return chunk;
    }

    /**
     * Unloads a chunk at the specified position
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkY - Chunk Y coordinate
     */
    unloadChunk(chunkX, chunkY) {
        const key = `${chunkX},${chunkY}`;
        const chunk = this.chunks.get(key);

        if (chunk && chunk.isLoaded) {
            // Save chunk to storage if it's dirty and persistence is enabled
            if (chunk.isDirty && this.persistChunks && this.chunkStorage) {
                console.log(`Saving chunk (${chunkX}, ${chunkY}) to storage`);
                const serializedData = chunk.serialize();
                this.chunkStorage.saveChunk(this.worldId, chunkX, chunkY, serializedData);
                chunk.isDirty = false;
            }

            // Unload chunk from memory
            chunk.unload();
            this.chunkContainer.removeChild(chunk.container);
            this.activeChunks.delete(key);
        }
    }

    /**
     * Creates a placeholder texture for a terrain type
     * @param {string} terrainType - Terrain type
     * @returns {PIXI.Texture} The created texture
     */
    createPlaceholderTexture(terrainType) {
        // Define colors for different terrain types
        const colors = {
            grass: 0x33AA33,
            dirt: 0x8B4513,
            sand: 0xF0E68C,
            water: 0x0099FF,
            stone: 0x888888,
            snow: 0xFFFFFF,
            lava: 0xFF4500,
            void: 0x000000
        };

        // Get color for terrain type or use a default
        const mainColor = colors[terrainType] || 0x888888;

        // Create a graphics object for the texture
        const graphics = new PIXI.Graphics();

        // Draw isometric tile shape
        graphics.beginFill(mainColor);
        graphics.lineStyle(1, 0x000000, 0.5);
        graphics.moveTo(this.config.tileWidth / 2, 0);
        graphics.lineTo(this.config.tileWidth, this.config.tileHeight / 2);
        graphics.lineTo(this.config.tileWidth / 2, this.config.tileHeight);
        graphics.lineTo(0, this.config.tileHeight / 2);
        graphics.closePath();
        graphics.endFill();

        // Generate texture
        if (this.app && this.app.renderer) {
            return this.app.renderer.generateTexture(graphics);
        } else {
            console.error('Cannot generate texture: app or renderer is not available');
            return null;
        }
    }

    /**
     * Creates a tile at the specified position (internal method)
     * This is used by WorldChunk to create tiles
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @param {string} type - Tile type
     * @param {PIXI.Texture} texture - Tile texture
     * @param {Object} options - Additional tile options
     * @returns {IsometricTile} The created tile
     */
    createTileInternal(x, y, type, texture, options = {}) {
        try {
            // For chunk-based worlds, we need to be more flexible with boundaries
            // Only log a warning if we're far outside the world bounds
            if (x < -this.config.chunkSize || x >= this.config.gridWidth + this.config.chunkSize ||
                y < -this.config.chunkSize || y >= this.config.gridHeight + this.config.chunkSize) {
                console.warn(`Tile position far out of bounds in createTileInternal: ${x}, ${y}`);
                return null;
            }

            // For positions slightly outside bounds, just log a debug message
            if (x < 0 || x >= this.config.gridWidth || y < 0 || y >= this.config.gridHeight) {
                console.debug(`Tile position slightly out of bounds in createTileInternal: ${x}, ${y}`);
                // Continue creating the tile anyway for chunk-based worlds
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
                console.warn(`Grid coordinate mismatch in createTileInternal: Expected (${x}, ${y}), got (${tile.gridX}, ${tile.gridY})`);
                // Force the correct grid coordinates
                tile.gridX = x;
                tile.gridY = y;
            }

            // Store the world position of this tile
            const worldPos = this.gridToWorld(x, y);
            tile.worldX = worldPos.x;
            tile.worldY = worldPos.y;

            // Set texture if not already set
            if (!tile.sprite && texture) {
                tile.setTexture(texture);
            }

            // Update the main world's tile grid for backward compatibility
            if (this.tiles && x >= 0 && x < this.config.gridWidth && y >= 0 && y < this.config.gridHeight) {
                this.tiles[x][y] = tile;
            }

            return tile;
        } catch (error) {
            console.error(`Error creating tile at (${x}, ${y}):`, error);
            return null;
        }
    }

    /**
     * Saves the world state
     * @returns {Object} The serialized world state
     */
    saveWorldState() {
        // Save all active chunks first
        for (const key of this.activeChunks) {
            const [chunkX, chunkY] = key.split(',').map(Number);
            const chunk = this.getChunk(chunkX, chunkY);

            if (chunk && chunk.isDirty && this.persistChunks && this.chunkStorage) {
                const serializedData = chunk.serialize();
                this.chunkStorage.saveChunk(this.worldId, chunkX, chunkY, serializedData);
                chunk.isDirty = false;
            }
        }

        // Create world state object
        const worldState = {
            worldId: this.worldId,
            seed: this.seed,
            timestamp: Date.now(),
            playerPosition: this.game && this.game.player ? {
                x: this.game.player.gridX,
                y: this.game.player.gridY
            } : null,
            cameraPosition: {
                x: this.camera.x,
                y: this.camera.y,
                zoom: this.camera.zoom
            }
        };

        // Save world state to localStorage
        try {
            localStorage.setItem(`isogame_world_${this.worldId}`, JSON.stringify(worldState));
            console.log(`World state saved for world ${this.worldId}`);
        } catch (error) {
            console.error('Failed to save world state:', error);
        }

        return worldState;
    }

    /**
     * Loads the world state
     * @returns {boolean} True if the world state was loaded successfully
     */
    loadWorldState() {
        try {
            // Load world state from localStorage
            const serializedState = localStorage.getItem(`isogame_world_${this.worldId}`);

            if (!serializedState) {
                console.log(`No saved state found for world ${this.worldId}`);
                return false;
            }

            const worldState = JSON.parse(serializedState);
            console.log(`Loading world state for world ${this.worldId}`);

            // Clear existing world but don't clear storage
            console.log('Clearing existing world before loading saved state');
            this.clearWorld(false);

            // Set seed
            this.seed = worldState.seed;
            console.log(`Setting world seed to ${this.seed}`);

            // Set camera position
            if (worldState.cameraPosition) {
                this.camera.x = worldState.cameraPosition.x;
                this.camera.y = worldState.cameraPosition.y;
                this.camera.zoom = worldState.cameraPosition.zoom;
                this.updateCamera();
                console.log(`Set camera position to (${this.camera.x}, ${this.camera.y}, zoom: ${this.camera.zoom})`);
            }

            // Load chunks first to ensure we have walkable tiles
            console.log('Pre-loading chunks before positioning player');

            // First, load all chunks that were saved
            console.log('Loading all saved chunks');
            const savedChunks = this.chunkStorage.getWorldChunks(this.worldId);
            console.log(`Found ${savedChunks.length} saved chunks`);

            // Load saved chunks first
            for (const chunkCoord of savedChunks) {
                try {
                    // Skip if far outside world limits
                    if (this.isFarOutsideWorldLimits(chunkCoord.chunkX, chunkCoord.chunkY)) {
                        console.debug(`Skipping chunk outside world limits: (${chunkCoord.chunkX}, ${chunkCoord.chunkY})`);
                        continue;
                    }

                    // Load chunk
                    console.log(`Loading saved chunk: (${chunkCoord.chunkX}, ${chunkCoord.chunkY})`);
                    this.loadChunk(chunkCoord.chunkX, chunkCoord.chunkY);
                } catch (error) {
                    console.error(`Error loading chunk (${chunkCoord.chunkX}, ${chunkCoord.chunkY}):`, error);
                }
            }

            // If we have player position in saved state, load chunks around that position
            if (worldState.playerPosition) {
                console.log(`Loading chunks around player position: (${worldState.playerPosition.x}, ${worldState.playerPosition.y})`);
                const playerChunk = this.config.gridToChunk(
                    worldState.playerPosition.x,
                    worldState.playerPosition.y
                );

                // Load chunks around saved player position
                const loadDistance = this.config.loadDistance;
                for (let dx = -loadDistance; dx <= loadDistance; dx++) {
                    for (let dy = -loadDistance; dy <= loadDistance; dy++) {
                        const chunkX = playerChunk.chunkX + dx;
                        const chunkY = playerChunk.chunkY + dy;

                        // Skip if far outside world limits
                        if (this.isFarOutsideWorldLimits(chunkX, chunkY)) {
                            continue;
                        }

                        // Load chunk if not already loaded
                        const key = `${chunkX},${chunkY}`;
                        if (!this.activeChunks.has(key)) {
                            console.log(`Loading chunk around player: (${chunkX}, ${chunkY})`);
                            this.loadChunk(chunkX, chunkY);
                        }
                    }
                }
            } else {
                // No player position, load center chunk
                console.log('No player position, loading center chunk');
                this.loadChunk(0, 0);
            }

            // Now set player position if player exists
            if (worldState.playerPosition && this.game && this.game.player) {
                try {
                    this.game.player.gridX = worldState.playerPosition.x;
                    this.game.player.gridY = worldState.playerPosition.y;

                    // Check if the tile at player position is walkable and not water
                    const tile = this.getTile(this.game.player.gridX, this.game.player.gridY);
                    if (!tile || !tile.walkable || tile.type === 'water') {
                        console.warn(`Tile at player position (${this.game.player.gridX}, ${this.game.player.gridY}) is not suitable (walkable: ${tile?.walkable}, type: ${tile?.type}), finding alternative`);

                        // Find a walkable non-water tile nearby
                        const centerX = Math.floor(this.config.gridWidth / 2);
                        const centerY = Math.floor(this.config.gridHeight / 2);

                        // Try to find a suitable tile
                        const suitableTile = this.findWalkableTile(centerX, centerY, 20);

                        if (suitableTile) {
                            // Use the found tile's coordinates
                            this.game.player.gridX = suitableTile.gridX;
                            this.game.player.gridY = suitableTile.gridY;
                            console.log(`Found suitable tile at (${suitableTile.gridX}, ${suitableTile.gridY}) for player placement`);
                        } else {
                            // Fallback to center coordinates
                            this.game.player.gridX = centerX;
                            this.game.player.gridY = centerY;
                            console.warn(`No suitable tile found, using center coordinates (${centerX}, ${centerY})`);

                            // Force create a walkable grass tile at the center
                            const forceTile = this.createTileInternal(centerX, centerY, 'grass',
                                this.createPlaceholderTexture('grass'), {
                                elevation: 0,
                                walkable: true,
                                type: 'grass'
                            });

                            if (forceTile) {
                                console.log(`Created forced walkable grass tile at (${centerX}, ${centerY})`);
                            }
                        }
                    }

                    // Ensure player has world reference
                    if (!this.game.player.world) {
                        console.log('Setting player world reference');
                        this.game.player.world = this;
                    }

                    this.game.player.updatePosition();
                    console.log(`Set player position to (${this.game.player.gridX}, ${this.game.player.gridY})`);

                    // Ensure player is visible
                    this.game.player.visible = true;
                    this.game.player.alpha = 1.0;

                    // Make sure player is in the entity container
                    if (!this.entityContainer.children.includes(this.game.player)) {
                        console.log('Re-adding player to entity container during world load');
                        this.entityContainer.addChild(this.game.player);
                    }

                    // Ensure player is active
                    this.game.player.active = true;

                    // Reset player creation flag in game
                    if (this.game.playerCreationAttempted) {
                        this.game.playerCreationAttempted = false;
                    }
                } catch (error) {
                    console.error('Error setting player position:', error);
                }
            }

            // Update chunks to ensure proper loading/unloading
            console.log('Updating chunks after player positioning');
            this.updateChunks();

            // Force a redraw of all active chunks
            console.log('Forcing redraw of all active chunks');
            for (const key of this.activeChunks) {
                const [chunkX, chunkY] = key.split(',').map(Number);
                const chunk = this.getChunk(chunkX, chunkY);

                if (chunk && chunk.isLoaded) {
                    // Ensure all tiles in this chunk are properly set up
                    for (let localX = 0; localX < chunk.size; localX++) {
                        for (let localY = 0; localY < chunk.size; localY++) {
                            const tile = chunk.getTile(localX, localY);
                            if (tile) {
                                // Ensure tile has proper references
                                tile.world = this;
                                tile.game = this.game;

                                // Ensure tile is in the container
                                if (!chunk.container.children.includes(tile)) {
                                    chunk.container.addChild(tile);
                                }

                                // Update the main world's tile grid
                                const worldX = (chunk.chunkX * chunk.size) + localX;
                                const worldY = (chunk.chunkY * chunk.size) + localY;

                                if (worldX >= 0 && worldX < this.config.gridWidth &&
                                    worldY >= 0 && worldY < this.config.gridHeight) {
                                    this.tiles[worldX][worldY] = tile;
                                }
                            }
                        }
                    }

                    // Ensure chunk container is in the world container
                    if (!this.chunkContainer.children.includes(chunk.container)) {
                        this.chunkContainer.addChild(chunk.container);
                    }
                }
            }

            // Make sure the chunk container is visible
            this.chunkContainer.visible = true;
            this.chunkContainer.alpha = 1.0;

            return true;
        } catch (error) {
            console.error('Failed to load world state:', error);
            return false;
        }
    }

    /**
     * Checks if a chunk is far outside the world limits
     * This is more lenient than the standard isChunkOutsideWorldLimits
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkY - Chunk Y coordinate
     * @returns {boolean} True if the chunk is far outside world limits
     */
    isFarOutsideWorldLimits(chunkX, chunkY) {
        // Allow chunks that are slightly outside the world limits
        const buffer = 5; // Allow chunks up to 5 chunks outside the world limits

        // If any limit is null, that direction is infinite
        if (this.config.worldLimitMinX !== null && chunkX < this.config.worldLimitMinX - buffer) return true;
        if (this.config.worldLimitMaxX !== null && chunkX > this.config.worldLimitMaxX + buffer) return true;
        if (this.config.worldLimitMinY !== null && chunkY < this.config.worldLimitMinY - buffer) return true;
        if (this.config.worldLimitMaxY !== null && chunkY > this.config.worldLimitMaxY + buffer) return true;

        return false;
    }

    /**
     * Finds a walkable tile that's not water, starting from the given position and spiraling outward
     * @param {number} startX - Starting X position
     * @param {number} startY - Starting Y position
     * @param {number} maxRadius - Maximum search radius
     * @returns {IsometricTile|null} A walkable non-water tile, or null if none found
     */
    findWalkableTile(startX, startY, maxRadius = 10) {
        console.log(`Finding walkable non-water tile starting from (${startX}, ${startY})`);

        // Check the starting tile first
        const startTile = this.getTile(startX, startY);
        if (startTile && startTile.walkable && startTile.type !== 'water' && !startTile.structure) {
            console.log(`Found suitable tile at starting position (${startX}, ${startY})`);
            return startTile;
        }

        // Spiral search pattern
        for (let radius = 1; radius <= maxRadius; radius++) {
            // Check each position in the current radius
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    // Skip positions that aren't on the edge of the current radius
                    if (Math.abs(dx) < radius && Math.abs(dy) < radius) continue;

                    const x = startX + dx;
                    const y = startY + dy;
                    const tile = this.getTile(x, y);

                    if (tile && tile.walkable && tile.type !== 'water' && !tile.structure) {
                        console.log(`Found suitable tile at (${x}, ${y}) during spiral search`);
                        return tile;
                    }
                }
            }
        }

        console.warn(`No suitable walkable non-water tile found within radius ${maxRadius} of (${startX}, ${startY})`);
        return null;
    }

    /**
     * Disposes of the world
     */
    dispose() {
        // Save world state before clearing
        if (this.persistChunks && this.chunkStorage) {
            this.saveWorldState();
        }

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

