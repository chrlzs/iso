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
        // Create it as a separate container at the top level so it's always visible
        this.debugGridOverlay = new PIXI.Container();
        this.addChild(this.debugGridOverlay);
        // Set an extremely high z-index to ensure it's drawn on top of everything
        this.debugGridOverlay.zIndex = 10000;
        // Make it visible by default for debugging
        this.debugGridOverlay.visible = true;
        console.log('Debug grid overlay created with visibility:', this.debugGridOverlay.visible);

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

        // Coordinate transformation offsets
        // These can be adjusted at runtime to calibrate the coordinate system
        this.coordinateOffsetX = 9; // Final calibrated value
        this.coordinateOffsetY = 8; // Final calibrated value

        // Grid visualization offsets
        this.gridOffsetX = -65; // Working value based on testing
        this.gridOffsetY = -65; // Working value based on testing
        this.gridScale = 1.0; // Scale factor for the grid

        // Flag to use absolute coordinates (independent of screen position)
        this.useAbsoluteCoordinates = false;

        // Store the absolute positions of each tile
        this.absoluteTilePositions = {};

        // Reference point for absolute coordinates
        this.referenceWorldX = 0;
        this.referenceWorldY = 0;
        this.referenceGridX = 0;
        this.referenceGridY = 0;

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

        // Draw debug grid immediately
        this.drawDebugGrid();
        console.log('Initial debug grid drawn');
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

        // Create new tile with explicit grid coordinates
        const tile = new IsometricTile({
            x: x,  // Explicitly use the provided grid coordinates
            y: y,  // Explicitly use the provided grid coordinates
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

        // Double-check that the grid coordinates are set correctly
        if (tile.gridX !== x || tile.gridY !== y) {
            console.warn(`Grid coordinate mismatch in createTile: Expected (${x}, ${y}), got (${tile.gridX}, ${tile.gridY})`);
            // Force the correct grid coordinates
            tile.gridX = x;
            tile.gridY = y;
        }

        // Store the world position of this tile for absolute coordinate lookup
        // This is the key to fixing the coordinate consistency issue
        const worldPos = this.gridToWorld(x, y);
        tile.worldX = worldPos.x;
        tile.worldY = worldPos.y;

        // Store this position in our lookup table
        const key = `${worldPos.x.toFixed(0)},${worldPos.y.toFixed(0)}`;
        this.absoluteTilePositions[key] = { gridX: x, gridY: y };

        console.log(`Created tile at grid (${x}, ${y}), world (${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)})`);

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
        // Special case for (0,0) tile to ensure it can be highlighted
        if (x === 0 && y === 0) {
            console.log('Special handling for (0,0) tile');
            return this.tiles[0][0];
        }

        // Round coordinates to integers to handle floating point issues
        const gridX = Math.floor(x);
        const gridY = Math.floor(y);

        // Check if position is valid
        if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
            // Only log warnings occasionally to reduce console spam
            // Use a random check to log only about 1% of the time for significant out-of-bounds
            // and 0.1% of the time for near-boundary cases
            const isFarOutOfBounds = gridX < -5 || gridX >= this.gridWidth + 5 || gridY < -5 || gridY >= this.gridHeight + 5;

            if (isFarOutOfBounds && Math.random() < 0.01) {
                console.warn(`Tile position significantly out of bounds: (${gridX}, ${gridY})`);
            } else if (!isFarOutOfBounds && Math.random() < 0.001) {
                // For near-boundary cases, just log at debug level and even less frequently
                console.log(`Tile position out of bounds: (${gridX}, ${gridY})`);
            }

            // Try to find the nearest valid tile
            const clampedX = Math.max(0, Math.min(this.gridWidth - 1, gridX));
            const clampedY = Math.max(0, Math.min(this.gridHeight - 1, gridY));

            // If we're not too far out of bounds, return the nearest valid tile
            if (Math.abs(gridX - clampedX) <= 3 && Math.abs(gridY - clampedY) <= 3) {
                console.log(`Returning nearest valid tile at (${clampedX}, ${clampedY})`);
                return this.tiles[clampedX][clampedY];
            }

            return null;
        }

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
        // Convert screen coordinates to local coordinates (relative to the container)
        const localX = (screenX - this.position.x) / this.scale.x;
        const localY = (screenY - this.position.y) / this.scale.y;

        // Add camera offset to get world coordinates
        const worldX = localX + this.camera.x;
        const worldY = localY + this.camera.y;

        // Simple isometric formula - much more reliable and consistent
        // This is based on the approach used in pixi-isometric-tilemaps
        const tileWidthHalf = this.tileWidth / 2;
        const tileHeightHalf = this.tileHeight / 2;

        // Calculate grid coordinates using the standard isometric formula
        let gridY = (worldY / tileHeightHalf - worldX / tileWidthHalf) / 2;
        let gridX = (worldY / tileHeightHalf + worldX / tileWidthHalf) / 2;

        // Apply fixed offsets
        gridX -= 9; // Fixed X offset
        gridY -= 8; // Fixed Y offset

        // Round to nearest tile
        const roundedX = Math.floor(gridX);
        const roundedY = Math.floor(gridY);

        // Special case for coordinates very close to (0,0)
        if (Math.abs(roundedX) <= 1 && Math.abs(roundedY) <= 1 &&
            Math.abs(gridX) <= 1.5 && Math.abs(gridY) <= 1.5) {
            return { x: 0, y: 0 };
        }

        return {
            x: roundedX,
            y: roundedY
        };
    }

    /**
     * Converts world coordinates to grid coordinates
     * @param {number} worldX - World X coordinate
     * @param {number} worldY - World Y coordinate
     * @returns {Object} Grid coordinates {x, y}
     */
    worldToGrid(worldX, worldY) {
        // Simple isometric formula - much more reliable and consistent
        // This is based on the approach used in pixi-isometric-tilemaps
        const tileWidthHalf = this.tileWidth / 2;
        const tileHeightHalf = this.tileHeight / 2;

        // Calculate grid coordinates using the standard isometric formula
        let gridY = (worldY / tileHeightHalf - worldX / tileWidthHalf) / 2;
        let gridX = (worldY / tileHeightHalf + worldX / tileWidthHalf) / 2;

        // Apply fixed offsets
        gridX -= 9; // Fixed X offset
        gridY -= 8; // Fixed Y offset

        // Round to nearest tile
        const roundedX = Math.floor(gridX);
        const roundedY = Math.floor(gridY);

        return {
            x: roundedX,
            y: roundedY
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
     * Converts screen coordinates to world coordinates
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @returns {Object} World coordinates {x, y}
     */
    screenToWorld(screenX, screenY) {
        // Calculate world coordinates relative to container
        const localX = (screenX - this.position.x) / this.scale.x;
        const localY = (screenY - this.position.y) / this.scale.y;

        // Add camera offset to get world coordinates
        const worldX = localX + this.camera.x;
        const worldY = localY + this.camera.y;

        if (Math.random() < 0.01) { // Only log occasionally
            console.log(`Screen (${screenX.toFixed(2)}, ${screenY.toFixed(2)}) -> Local (${localX.toFixed(2)}, ${localY.toFixed(2)}) -> World (${worldX.toFixed(2)}, ${worldY.toFixed(2)})`);
            console.log(`Camera position: (${this.camera.x.toFixed(2)}, ${this.camera.y.toFixed(2)})`);
        }

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

        if (Math.random() < 0.01) { // Only log occasionally
            console.log(`World (${worldX.toFixed(2)}, ${worldY.toFixed(2)}) -> Screen (${screenX.toFixed(2)}, ${screenY.toFixed(2)})`);
            console.log(`Camera position: (${this.camera.x.toFixed(2)}, ${this.camera.y.toFixed(2)}), zoom: ${this.camera.zoom}`);
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
        // Apply fixed offsets (inverse of worldToGrid)
        const correctedX = gridX + 9; // Fixed X offset
        const correctedY = gridY + 8; // Fixed Y offset

        // Convert to isometric coordinates using the standard formula
        const isoX = (correctedX - correctedY) * this.tileWidth / 2;
        const isoY = (correctedX + correctedY) * this.tileHeight / 2;

        return { x: isoX, y: isoY };
    }

    /**
     * Gets the tile at screen coordinates
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @returns {IsometricTile} The tile or null if not found
     */
    getTileAtScreen(screenX, screenY) {
        // Convert screen coordinates to grid coordinates using our simplified approach
        const gridCoords = this.screenToGrid(screenX, screenY);

        // Special case for coordinates near (0,0)
        if (Math.abs(gridCoords.x) <= 1 && Math.abs(gridCoords.y) <= 1) {
            return this.getTile(0, 0);
        }

        // Get the tile at the calculated grid coordinates
        const tile = this.getTile(gridCoords.x, gridCoords.y);

        // If we found a tile, return it
        if (tile) {
            // Only log occasionally to reduce console spam
            if (Math.random() < 0.01) {
                console.log(`Screen (${screenX}, ${screenY}) -> Grid (${gridCoords.x}, ${gridCoords.y})`);
                console.log(`Found tile with stored grid position: (${tile.gridX}, ${tile.gridY})`);
            }
            return tile;
        }

        // If we didn't find a tile, try to find a nearby tile
        // This helps with edge cases and makes selection more forgiving
        for (let offsetX = -1; offsetX <= 1; offsetX++) {
            for (let offsetY = -1; offsetY <= 1; offsetY++) {
                if (offsetX === 0 && offsetY === 0) continue; // Skip the center tile (already checked)

                const nearbyTile = this.getTile(gridCoords.x + offsetX, gridCoords.y + offsetY);
                if (nearbyTile) {
                    // Only log occasionally to reduce console spam
                    if (Math.random() < 0.01) {
                        console.log(`Found nearby tile at (${nearbyTile.gridX}, ${nearbyTile.gridY})`);
                    }
                    return nearbyTile;
                }
            }
        }

        // If we still didn't find a tile, return null
        return null;
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
        // Remove all children (text labels, graphics, etc.)
        while (this.debugGridOverlay.children.length > 0) {
            this.debugGridOverlay.removeChildAt(0);
        }

        // Only draw if debug is enabled
        if (!this.game || !this.game.options.debug) {
            return;
        }

        // Create a new graphics object for the grid lines
        const gridLines = new PIXI.Graphics();
        gridLines.lineStyle(2, 0xFF0000, 0.5);
        this.debugGridOverlay.addChild(gridLines);

        // Log camera and container positions for debugging
        console.log('Camera position:', this.camera.x, this.camera.y);
        console.log('Container position:', this.position.x, this.position.y);
        console.log('Tile dimensions - width:', this.tileWidth, 'height:', this.tileHeight);

        // Use the configurable grid offsets and scale
        const gridOffsetX = this.tileWidth * this.gridScale + this.gridOffsetX;
        const gridOffsetY = this.tileHeight * this.gridScale + this.gridOffsetY;

        // Draw grid lines using isometric coordinates directly
        // This ensures the grid moves with the map
        for (let x = 0; x <= this.gridWidth; x++) {
            // Convert grid coordinates to isometric coordinates with offset
            const startIsoX = (x - 0) * this.tileWidth / 2 + gridOffsetX;
            const startIsoY = (x + 0) * this.tileHeight / 2 + gridOffsetY;
            const endIsoX = (x - this.gridHeight) * this.tileWidth / 2 + gridOffsetX;
            const endIsoY = (x + this.gridHeight) * this.tileHeight / 2 + gridOffsetY;

            // Draw line
            gridLines.moveTo(startIsoX, startIsoY);
            gridLines.lineTo(endIsoX, endIsoY);

            // Add a small dot at the center of each tile for reference, but no labels
            // (we're using the HTML overlay for labels now)
            for (let y = 0; y < this.gridHeight; y++) {
                const tile = this.getTile(x, y);
                if (tile) {
                    // Add a small dot at the center of the tile for reference
                    const centerDot = new PIXI.Graphics();
                    centerDot.beginFill(0xFF00FF, 0.5); // Semi-transparent magenta
                    centerDot.drawCircle(0, 0, 2);
                    centerDot.endFill();
                    centerDot.position.set(tile.x, tile.y);
                    this.debugGridOverlay.addChild(centerDot);

                    // Only show a warning indicator if coordinates differ
                    if (tile.gridX !== x || tile.gridY !== y) {
                        // Add a warning indicator for mismatched coordinates
                        const warningIndicator = new PIXI.Graphics();
                        warningIndicator.beginFill(0xFF0000, 0.5); // Semi-transparent red
                        warningIndicator.drawCircle(0, 0, 5);
                        warningIndicator.endFill();
                        warningIndicator.position.set(tile.x, tile.y);
                        this.debugGridOverlay.addChild(warningIndicator);
                    }
                }
            }

            // Add a small marker at major grid lines instead of text labels
            if (x % 5 === 0) {
                // Convert grid coordinates to isometric coordinates with offset
                const labelIsoX = (x - 0) * this.tileWidth / 2 + gridOffsetX;
                const labelIsoY = (x + 0) * this.tileHeight / 2 + gridOffsetY;

                // Create a small marker
                const marker = new PIXI.Graphics();
                marker.beginFill(0xFF0000, 0.5);
                marker.drawCircle(0, 0, 3);
                marker.endFill();
                marker.position.set(labelIsoX, labelIsoY);
                this.debugGridOverlay.addChild(marker);
            }
        }

        for (let y = 0; y <= this.gridHeight; y++) {
            // Convert grid coordinates to isometric coordinates with offset
            const startIsoX = (0 - y) * this.tileWidth / 2 + gridOffsetX;
            const startIsoY = (0 + y) * this.tileHeight / 2 + gridOffsetY;
            const endIsoX = (this.gridWidth - y) * this.tileWidth / 2 + gridOffsetX;
            const endIsoY = (this.gridWidth + y) * this.tileHeight / 2 + gridOffsetY;

            // Draw line
            gridLines.moveTo(startIsoX, startIsoY);
            gridLines.lineTo(endIsoX, endIsoY);

            // Add a small marker at major grid lines instead of text labels
            if (y % 5 === 0) {
                // Convert grid coordinates to isometric coordinates with offset
                const labelIsoX = (0 - y) * this.tileWidth / 2 + gridOffsetX;
                const labelIsoY = (0 + y) * this.tileHeight / 2 + gridOffsetY;

                // Create a small marker
                const marker = new PIXI.Graphics();
                marker.beginFill(0x0000FF, 0.5); // Blue to distinguish from X markers
                marker.drawCircle(0, 0, 3);
                marker.endFill();
                marker.position.set(labelIsoX, labelIsoY);
                this.debugGridOverlay.addChild(marker);
            }
        }

        // Draw grid intersections to make the grid more visible
        for (let x = 0; x <= this.gridWidth; x += 5) {
            for (let y = 0; y <= this.gridHeight; y += 5) {
                // Convert grid coordinates to isometric coordinates with offset
                const isoX = (x - y) * this.tileWidth / 2 + gridOffsetX;
                const isoY = (x + y) * this.tileHeight / 2 + gridOffsetY;

                // Draw a circle at the intersection
                const intersectionMarker = new PIXI.Graphics();
                intersectionMarker.beginFill(0xFF0000, 0.5);
                intersectionMarker.drawCircle(0, 0, 3);
                intersectionMarker.endFill();
                intersectionMarker.position.set(isoX, isoY);
                this.debugGridOverlay.addChild(intersectionMarker);

                // Add a larger marker at major intersections (every 10 tiles)
                if (x % 10 === 0 && y % 10 === 0) {
                    // Create a larger marker for major intersections
                    const majorMarker = new PIXI.Graphics();
                    majorMarker.beginFill(0xFFFFFF, 0.7);
                    majorMarker.drawCircle(0, 0, 5);
                    majorMarker.endFill();
                    majorMarker.position.set(isoX, isoY);
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

