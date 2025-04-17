import { PIXI } from '../utils/PixiWrapper.js';

/**
 * WorldChunk - Manages a section of the isometric world
 * Handles tiles and entities within a specific chunk
 */
export class WorldChunk {
    /**
     * Creates a new world chunk
     * @param {Object} options - Chunk options
     * @param {number} options.chunkX - Chunk X coordinate
     * @param {number} options.chunkY - Chunk Y coordinate
     * @param {number} options.size - Chunk size in tiles (e.g., 16)
     * @param {IsometricWorld} options.world - Reference to the world
     */
    constructor(options = {}) {
        this.chunkX = options.chunkX;
        this.chunkY = options.chunkY;
        this.size = options.size || 16;
        this.world = options.world;

        // Tile storage
        this.tiles = [];

        // Chunk state
        this.isLoaded = false;
        this.isGenerated = false;
        this.isDirty = false;

        // Create container for this chunk's tiles
        this.container = new PIXI.Container();
        this.container.sortableChildren = true;

        // Initialize empty tile array
        this.createEmptyGrid();
    }

    /**
     * Creates an empty grid for this chunk
     * @private
     */
    createEmptyGrid() {
        this.tiles = new Array(this.size);
        for (let x = 0; x < this.size; x++) {
            this.tiles[x] = new Array(this.size).fill(null);
        }
    }

    /**
     * Generates terrain for this chunk
     */
    generate() {
        if (this.isGenerated) return;

        console.log(`Generating chunk at ${this.chunkX}, ${this.chunkY}`);

        // Get world seed and combine with chunk coordinates for consistent generation
        const seed = this.world.seed + (this.chunkX * 10000) + this.chunkY;

        // Generate terrain for this chunk
        for (let localX = 0; localX < this.size; localX++) {
            for (let localY = 0; localY < this.size; localY++) {
                // Convert to world coordinates for noise functions
                const worldX = (this.chunkX * this.size) + localX;
                const worldY = (this.chunkY * this.size) + localY;

                // Use simple noise function to determine terrain type
                const elevation = this.generateElevation(worldX, worldY, seed);
                const moisture = this.generateMoisture(worldX, worldY, seed);
                const terrainType = this.determineTerrainType(elevation, moisture);

                // Create placeholder texture
                const texture = this.world.createPlaceholderTexture(terrainType);

                // Create tile with appropriate properties
                const isWalkable = terrainType !== 'water';
                this.createTile(localX, localY, terrainType, texture, {
                    elevation: Math.floor(elevation * 3) * 8,
                    walkable: isWalkable
                });
            }
        }

        // Mark as generated
        this.isGenerated = true;
        this.isDirty = true;
    }

    /**
     * Generates elevation value for a world position
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @param {number} seed - Random seed
     * @returns {number} Elevation value between 0 and 1
     * @private
     */
    generateElevation(x, y, seed) {
        // Create more dramatic elevation changes
        const scale = 0.05;
        return (
            Math.sin(x * scale + seed * 0.01) *
            Math.cos(y * scale + seed * 0.01) * 0.5 + 0.5
        );
    }

    /**
     * Generates moisture value for a world position
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @param {number} seed - Random seed
     * @returns {number} Moisture value between 0 and 1
     * @private
     */
    generateMoisture(x, y, seed) {
        // Create more varied moisture distribution
        const scale = 0.03;
        return (
            Math.sin(x * scale + seed * 0.02) *
            Math.cos(y * scale + seed * 0.02) * 0.5 + 0.5
        );
    }

    /**
     * Determines terrain type based on elevation and moisture
     * @param {number} elevation - Elevation value between 0 and 1
     * @param {number} moisture - Moisture value between 0 and 1
     * @returns {string} Terrain type
     * @private
     */
    determineTerrainType(elevation, moisture) {
        // Create more varied and interesting terrain
        if (elevation < 0.2) {
            return 'water';
        } else if (elevation < 0.3) {
            return moisture > 0.6 ? 'sand' : 'water';
        } else if (elevation < 0.7) {
            if (moisture < 0.2) return 'dirt';
            if (moisture < 0.6) return 'grass';
            return 'stone';
        } else if (elevation < 0.85) {
            return 'stone';
        } else {
            return 'snow';
        }
    }

    /**
     * Loads the chunk into memory
     */
    load() {
        if (this.isLoaded) return;

        console.log(`Loading chunk at ${this.chunkX}, ${this.chunkY}`);

        // If not generated, generate first
        if (!this.isGenerated) {
            this.generate();
        }

        // Add all tiles to the container
        for (let localX = 0; localX < this.size; localX++) {
            for (let localY = 0; localY < this.size; localY++) {
                const tile = this.getTile(localX, localY);
                if (tile) {
                    // Ensure tile has proper references
                    if (!tile.world) {
                        console.log(`Setting world reference for tile at (${tile.gridX}, ${tile.gridY})`);
                        tile.world = this.world;
                    }

                    if (!tile.game && this.world && this.world.game) {
                        console.log(`Setting game reference for tile at (${tile.gridX}, ${tile.gridY})`);
                        tile.game = this.world.game;
                    }

                    // Add to container if not already a child
                    if (!this.container.children.includes(tile)) {
                        this.container.addChild(tile);
                    }

                    // Update the main world's tile grid for backward compatibility
                    if (this.world && this.world.tiles) {
                        const worldX = (this.chunkX * this.size) + localX;
                        const worldY = (this.chunkY * this.size) + localY;

                        if (worldX >= 0 && worldX < this.world.config.gridWidth &&
                            worldY >= 0 && worldY < this.world.config.gridHeight) {
                            this.world.tiles[worldX][worldY] = tile;
                        }
                    }
                }
            }
        }

        this.isLoaded = true;
    }

    /**
     * Unloads the chunk from memory
     */
    unload() {
        if (!this.isLoaded) return;

        console.log(`Unloading chunk at ${this.chunkX}, ${this.chunkY}`);

        // Save chunk data if dirty
        if (this.isDirty) {
            this.save();
        }

        // Remove all tiles from container
        this.container.removeChildren();

        this.isLoaded = false;
    }

    /**
     * Saves the chunk data
     */
    save() {
        console.log(`Saving chunk at ${this.chunkX}, ${this.chunkY}`);
        // In a real implementation, save to localStorage or server
        this.isDirty = false;
    }

    /**
     * Creates a tile at the specified local position
     * @param {number} localX - Local X position within chunk
     * @param {number} localY - Local Y position within chunk
     * @param {string} type - Tile type
     * @param {PIXI.Texture} texture - Tile texture
     * @param {Object} options - Additional tile options
     * @returns {IsometricTile} The created tile
     */
    createTile(localX, localY, type, texture, options = {}) {
        // Check if position is valid
        if (localX < 0 || localX >= this.size || localY < 0 || localY >= this.size) {
            // For chunk-based worlds, we'll just log a debug message
            console.debug(`Tile position outside chunk bounds: (${localX}, ${localY}) in chunk (${this.chunkX}, ${this.chunkY})`);
            // We'll still create the tile in the world, but not store it in this chunk
            // This allows for tiles that are on chunk boundaries
        }

        // Remove existing tile if within bounds
        if (localX >= 0 && localX < this.size && localY >= 0 && localY < this.size && this.tiles[localX][localY]) {
            this.removeTile(localX, localY);
        }

        try {
            // Convert local coordinates to world coordinates
            const worldX = (this.chunkX * this.size) + localX;
            const worldY = (this.chunkY * this.size) + localY;

            // Create new tile using the world's createTileInternal method
            const tile = this.world.createTileInternal(worldX, worldY, type, texture, options);

            if (!tile) {
                console.warn(`Failed to create tile at (${localX}, ${localY}) in chunk (${this.chunkX}, ${this.chunkY})`);
                return null;
            }

            // Ensure tile has proper references
            tile.world = this.world;
            if (this.world && this.world.game) {
                tile.game = this.world.game;
            }

            // Store in local grid if within bounds
            if (localX >= 0 && localX < this.size && localY >= 0 && localY < this.size) {
                this.tiles[localX][localY] = tile;
            }

            // Add to container if loaded
            if (this.isLoaded && !this.container.children.includes(tile)) {
                this.container.addChild(tile);
            }

            // Update the main world's tile grid for backward compatibility
            if (this.world && this.world.tiles &&
                worldX >= 0 && worldX < this.world.config.gridWidth &&
                worldY >= 0 && worldY < this.world.config.gridHeight) {
                this.world.tiles[worldX][worldY] = tile;
            }

            // Mark chunk as dirty
            this.isDirty = true;

            return tile;
        } catch (error) {
            console.error(`Error creating tile at (${localX}, ${localY}) in chunk (${this.chunkX}, ${this.chunkY}):`, error);
            return null;
        }
    }

    /**
     * Removes a tile at the specified local position
     * @param {number} localX - Local X position within chunk
     * @param {number} localY - Local Y position within chunk
     */
    removeTile(localX, localY) {
        // Check if position is valid
        if (localX < 0 || localX >= this.size || localY < 0 || localY >= this.size) {
            console.warn(`Tile position out of bounds: ${localX}, ${localY}`);
            return;
        }

        const tile = this.tiles[localX][localY];
        if (tile) {
            // Remove from container if loaded
            if (this.isLoaded) {
                this.container.removeChild(tile);
            }

            // Remove from grid
            this.tiles[localX][localY] = null;

            // Mark chunk as dirty
            this.isDirty = true;
        }
    }

    /**
     * Gets a tile at the specified local position
     * @param {number} localX - Local X position within chunk
     * @param {number} localY - Local Y position within chunk
     * @returns {IsometricTile} The tile at the specified position
     */
    getTile(localX, localY) {
        // Check if position is valid
        if (localX < 0 || localX >= this.size || localY < 0 || localY >= this.size) {
            // For chunk-based worlds, we might need to get a tile from a neighboring chunk
            if (this.world) {
                // Convert to world coordinates
                const worldX = (this.chunkX * this.size) + localX;
                const worldY = (this.chunkY * this.size) + localY;

                // Get the chunk that contains this position
                const chunkCoords = this.world.config.gridToChunk(worldX, worldY);

                // If it's a different chunk, try to get the tile from there
                if (chunkCoords.chunkX !== this.chunkX || chunkCoords.chunkY !== this.chunkY) {
                    const chunk = this.world.getChunk(chunkCoords.chunkX, chunkCoords.chunkY);
                    if (chunk) {
                        // Convert back to local coordinates in the other chunk
                        const otherLocalX = worldX - (chunkCoords.chunkX * this.size);
                        const otherLocalY = worldY - (chunkCoords.chunkY * this.size);
                        return chunk.getTile(otherLocalX, otherLocalY);
                    }
                }
            }
            return null;
        }

        return this.tiles[localX][localY];
    }

    /**
     * Sets a tile at the specified local position
     * @param {number} localX - Local X position within chunk
     * @param {number} localY - Local Y position within chunk
     * @param {IsometricTile} tile - The tile to set
     * @returns {boolean} Whether the tile was set successfully
     */
    setTile(localX, localY, tile) {
        // Check if position is valid
        if (localX < 0 || localX >= this.size || localY < 0 || localY >= this.size) {
            console.warn(`Tile position out of bounds: ${localX}, ${localY}`);
            return false;
        }

        // Remove existing tile if any
        if (this.tiles[localX][localY]) {
            this.removeTile(localX, localY);
        }

        // Set the new tile
        this.tiles[localX][localY] = tile;

        // Add to container if loaded
        if (this.isLoaded && !this.container.children.includes(tile)) {
            this.container.addChild(tile);
        }

        // Mark chunk as dirty
        this.isDirty = true;

        return true;
    }

    /**
     * Converts local chunk coordinates to world coordinates
     * @param {number} localX - Local X position within chunk
     * @param {number} localY - Local Y position within chunk
     * @returns {Object} World coordinates {x, y}
     */
    localToWorld(localX, localY) {
        return {
            x: (this.chunkX * this.size) + localX,
            y: (this.chunkY * this.size) + localY
        };
    }

    /**
     * Converts world coordinates to local chunk coordinates
     * @param {number} worldX - World X coordinate
     * @param {number} worldY - World Y coordinate
     * @returns {Object} Local coordinates {x, y}
     */
    worldToLocal(worldX, worldY) {
        return {
            x: worldX - (this.chunkX * this.size),
            y: worldY - (this.chunkY * this.size)
        };
    }

    /**
     * Serializes the chunk data for saving
     * @returns {Object} Serialized chunk data
     */
    serialize() {
        const data = {
            chunkX: this.chunkX,
            chunkY: this.chunkY,
            isGenerated: this.isGenerated,
            tiles: []
        };

        // Serialize tiles
        for (let localX = 0; localX < this.size; localX++) {
            for (let localY = 0; localY < this.size; localY++) {
                const tile = this.getTile(localX, localY);
                if (tile) {
                    data.tiles.push({
                        x: localX,
                        y: localY,
                        type: tile.type,
                        elevation: tile.elevation,
                        walkable: tile.walkable,
                    });
                }
            }
        }

        return data;
    }

    /**
     * Deserializes chunk data
     * @param {Object} data - Serialized chunk data
     */
    deserialize(data) {
        this.chunkX = data.chunkX;
        this.chunkY = data.chunkY;
        this.isGenerated = data.isGenerated;

        // Clear existing tiles
        this.createEmptyGrid();

        // Recreate tiles
        let tilesCreated = 0;
        for (const tileData of data.tiles) {
            try {
                const texture = this.world.createPlaceholderTexture(tileData.type);
                if (!texture) {
                    console.warn(`Failed to create texture for tile type: ${tileData.type}`);
                    continue;
                }

                const tile = this.createTile(tileData.x, tileData.y, tileData.type, texture, {
                    elevation: tileData.elevation,
                    walkable: tileData.walkable,
                });

                if (tile) {
                    // Ensure tile has proper references
                    tile.world = this.world;
                    if (this.world && this.world.game) {
                        tile.game = this.world.game;
                    }

                    // Update world coordinates
                    const worldX = (this.chunkX * this.size) + tileData.x;
                    const worldY = (this.chunkY * this.size) + tileData.y;
                    tile.gridX = worldX;
                    tile.gridY = worldY;

                    // Update world position
                    if (this.world) {
                        const worldPos = this.world.gridToWorld(worldX, worldY);
                        tile.worldX = worldPos.x;
                        tile.worldY = worldPos.y;
                    }

                    tilesCreated++;
                }
            } catch (error) {
                console.error(`Error creating tile at (${tileData.x}, ${tileData.y}):`, error);
            }
        }

        // Mark as loaded but not dirty (since we just loaded from storage)
        this.isLoaded = true;
        this.isDirty = false;

        //console.log(`Deserialized chunk at ${this.chunkX}, ${this.chunkY} with ${tilesCreated}/${data.tiles.length} tiles created`);
    }
}

