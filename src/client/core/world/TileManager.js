export class TileManager {
    constructor() {
        console.log('TileManager: Initializing...');
        this.textures = new Map();
        this.decorationTexturesLoaded = false;

        // Initialize decoration textures
        this.decorationLoadQueue = new Set([
            'dec_rocks',
            'dec_flowers',
            'dec_grassTufts'
        ]);

        // Preload all decoration textures
        this.preloadDecorationTextures = async () => {
            console.log('TileManager: Starting decoration texture preload...');
            for (const name of this.decorationLoadQueue) {
                try {
                    await this.loadDecorationTexture(name);
                } catch (err) {
                    console.error(`TileManager: Failed to load decoration texture ${name}:`, err);
                }
            }
            this.decorationTexturesLoaded = true;
            console.log('TileManager: All decoration textures loaded');
        };

        // Start loading textures immediately
        this.preloadDecorationTextures().catch(err => {
            console.error('TileManager: Failed to preload decoration textures:', err);
        });

        // Add a seeded random number generator for consistent decoration placement
        this.decorationSeed = 12345; // You can make this configurable
        this.getSeededRandom = (tileId) => {
            const hash = tileId.split('_').reduce((acc, val) => {
                return acc + parseInt(val, 36);
            }, this.decorationSeed);
            
            // Simple seeded random number generator
            return ((Math.sin(hash) + 1) / 2);
        };

        // Initialize base texture maps
        this.textureVariants = new Map();
        this.decorationTextures = new Map();
        
        // Add method to load and store decoration textures
        this.loadDecorationTexture = async (name) => {
            const texture = await this.loadTexture(name, `assets/textures/${name}.png`);
            this.decorationTextures.set(name, texture);
            console.log(`TileManager: Loaded decoration texture: ${name}`);
            return texture;
        };

        // Add method to get decoration texture with error handling
        this.getDecorationTexture = (name) => {
            const texture = this.decorationTextures.get(name);
            if (!texture) {
                console.warn(`TileManager: Decoration texture not found: ${name}`);
                return this.createTempTexture('#FF00FF'); // Return fallback texture
            }
            return texture;
        };

        // Initialize decoration texture tracking
        this.decorationTextureStatus = {
            loaded: new Set(),
            failed: new Set(),
            pending: new Set()
        };

        // Define texture variants for each tile type
        this.textureVariants.set('grass', ['grass', 'grass_var1', 'grass_var2']);
        this.textureVariants.set('dirt', ['dirt', 'dirt_var1', 'dirt_var2']);
        this.textureVariants.set('stone', ['stone', 'stone_mossy', 'stone_cracked']);
        this.textureVariants.set('sand', ['sand', 'sand_var1']);
        this.textureVariants.set('wetland', ['wetland', 'wetland_var1']);
        this.textureVariants.set('water', ['water', 'water_var1']);

        // Define possible decorations for each tile type
        this.decorations = {
            grass: [
                { type: 'dec_flowers', chance: 0.1, offset: { x: 0, y: -8 }, scale: { x: 0.5, y: 0.5 } },
                { type: 'dec_grassTufts', chance: 0.2, offset: { x: 0, y: -6 }, scale: { x: 0.7, y: 0.7 } }
            ],
            dirt: [
                { type: 'dec_rocks', chance: 0.15, offset: { x: 0, y: -4 }, scale: { x: 0.6, y: 0.6 } }
            ],
            stone: [
                { type: 'dec_rocks', chance: 0.3, offset: { x: 0, y: -4 }, scale: { x: 0.8, y: 0.8 } }
            ]
        };

        this.decorationCache = new Map(); // Cache for tile decorations
        this.persistentDecorations = new Map();
        this.decorationBatch = new Map(); // Group by height/type
        
        // Add method to get or create persistent decoration
        this.getPersistentDecoration = (tileId, tileType) => {
            // Early return if we already made a decision for this tile
            if (this.persistentDecorations.has(tileId)) {
                console.log(`TileManager: Using cached decoration for tile ${tileId}`);
                return this.persistentDecorations.get(tileId);
            }

            const possibleDecorations = this.decorations[tileType];
            if (!possibleDecorations) {
                console.log(`TileManager: No decorations available for tile type ${tileType}`);
                this.persistentDecorations.set(tileId, null);
                return null;
            }

            // Get deterministic random value for this tile
            const random = this.getSeededRandom(tileId);
            console.log(`TileManager: Random value for tile ${tileId}: ${random}`);
            
            // Direct chance comparison instead of cumulative
            for (const decoration of possibleDecorations) {
                if (random < decoration.chance) {
                    const newDecoration = {
                        type: decoration.type,
                        offset: { ...decoration.offset },
                        scale: { ...decoration.scale },
                        id: `dec_${tileId}`
                    };
                    console.log(`TileManager: Decoration selected for tile ${tileId}:`, newDecoration);
                    this.persistentDecorations.set(tileId, newDecoration);
                    return newDecoration;
                }
            }

            console.log(`TileManager: No decoration selected for tile ${tileId}`);
            this.persistentDecorations.set(tileId, null);
            return null;
        };

        // Add debug logging for zoom operations
        this.lastZoomLevel = 1;
        this.debugZoom = (newZoom) => {
            if (newZoom !== this.lastZoomLevel) {
                console.log(`TileManager: Zoom changed from ${this.lastZoomLevel} to ${newZoom}`);
                console.log(`TileManager: Decoration cache size: ${this.persistentDecorations.size}`);
                this.lastZoomLevel = newZoom;
            }
        };

        // Add a decoration texture cache
        this.decorationTextureCache = new Map();

        this.lastDecorationUpdate = 0;
        this.decorationUpdateInterval = 16; // ~60fps

        // Initialize decoration system
        this.decorationSystem = {
            enabled: true,
            lastUpdate: 0,
            updateInterval: 100  // ms between decoration updates
        };

        // Method to get decoration for a specific tile
        this.getDecorationForTile = (tileId, tileType) => {
            // Check cache first
            const cachedDecoration = this.decorationCache.get(tileId);
            if (cachedDecoration !== undefined) {
                return cachedDecoration;
            }

            // Get persistent decoration
            const decoration = this.getPersistentDecoration(tileId, tileType);
            
            // Cache the result (even if null)
            this.decorationCache.set(tileId, decoration);
            
            return decoration;
        };

        // Method to clear decoration cache
        this.clearDecorationCache = () => {
            this.decorationCache.clear();
            console.log('TileManager: Decoration cache cleared');
        };

        // Method to batch decorations by height
        this.batchDecorations = (decorations) => {
            this.decorationBatch.clear();
            decorations.forEach(dec => {
                const key = `${dec.type}_${dec.offset.y}`;
                if (!this.decorationBatch.has(key)) {
                    this.decorationBatch.set(key, []);
                }
                this.decorationBatch.get(key).push(dec);
            });
            return this.decorationBatch;
        };

        // Initialize texture loading state
        this.texturesLoaded = false;
        this.loadingErrors = new Map();
        this.textureLoadPromises = new Map();

        // Initialize decoration loading state
        this.decorationTexturesLoaded = false;
        this.decorationLoadQueue = new Set([
            'dec_rocks',
            'dec_flowers',
            'dec_grassTufts'
        ]);

        // Add method to preload all decoration textures
        this.preloadDecorationTextures = async () => {
            const loadPromises = Array.from(this.decorationLoadQueue).map(name => 
                this.loadDecorationTexture(name).catch(err => {
                    console.error(`Failed to load decoration texture: ${name}`, err);
                    this.loadingErrors.set(name, err);
                })
            );
            
            await Promise.all(loadPromises);
            this.decorationTexturesLoaded = true;
            console.log('TileManager: All decoration textures loaded');
        };

        // Start loading decoration textures immediately
        this.preloadDecorationTextures();

        // Initialize texture quality settings
        this.textureQuality = {
            mipMapping: true,
            filtering: 'bilinear',
            maxSize: 2048
        };

        // Setup texture loading queue
        this.loadingQueue = [];
        this.maxConcurrentLoads = 4;
        this.activeLoads = 0;

        // Initialize texture stats for monitoring
        this.textureStats = {
            totalLoaded: 0,
            totalSize: 0,
            lastLoadTime: 0
        };

        // Setup error handling
        this.handleTextureError = (textureName, error) => {
            console.warn(`Failed to load texture: ${textureName}`, error);
            this.loadingErrors.set(textureName, error);
            return this.createTempTexture('#FF00FF'); // Return pink texture as fallback
        };
    }

    updateDecorations(timestamp) {
        if (timestamp - this.lastDecorationUpdate < this.decorationUpdateInterval) {
            return;
        }
        this.lastDecorationUpdate = timestamp;
        // Perform decoration updates
    }

    // Temporary method for demo
    createTempTexture(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 64, 32);
        return canvas;
    }

    async loadTextures() {
        console.log('TileManager: Starting texture loading...');
        const textures = [
            'grass', 'grass_var1', 'grass_var2',
            'dirt', 'dirt_var1', 'dirt_var2',
            'stone', 'stone_mossy', 'stone_cracked',
            'sand', 'sand_var1', 'wetland', 'wetland_var1',
            'water', 'water_var1', 'dec_flowers', 'dec_rocks', 'dec_grassTufts'
        ];

        for (const name of textures) {
            try {
                const texture = await this.loadTexture(name, `assets/textures/${name}.png`);
                this.textures.set(name, texture);
                console.log(`TileManager: Successfully loaded texture: ${name}`);
            } catch (error) {
                console.error(`TileManager: Failed to load texture: ${name}`, error);
            }
        }
        console.log('TileManager: All textures loaded successfully.');
    }

    async loadTexture(name, path) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log(`TileManager: Successfully loaded texture: ${path}`);
                this.textures.set(name, img);
                resolve(img); // Ensure the resolved value is the image
            };
            img.onerror = (error) => {
                console.error(`TileManager: Failed to load texture: ${path}`, error);
                reject(new Error(`Failed to load texture: ${path}`));
            };
            img.src = path;
        });
    }

    getTextureForTile(tile) {
        if (!tile || !tile.type) {
            console.warn('TileManager: Invalid tile or missing type');
            return null; // Ensure tile and type are defined
        }

        // Use the pre-determined variant if it exists
        if (tile.variant) {
            const texture = this.textures.get(tile.variant);
            if (!texture) {
                console.warn(`TileManager: Missing texture for variant: ${tile.variant}`);
            }
            return texture;
        }

        // Fallback to base texture
        const baseTexture = this.textures.get(tile.type);
        if (!baseTexture) {
            console.warn(`TileManager: Missing base texture for type: ${tile.type}`);
        }
        return baseTexture;
    }

    getRandomVariant(tileType) {
        const variants = this.textureVariants[tileType];
        if (!variants) return tileType;

        // Select a random variant once and cache it on the tile
        const variant = variants[Math.floor(Math.random() * variants.length)];
        return variant;
    }

    getRandomDecoration(tileType, tileId) {
        if (!tileType || !tileId) return null;
        
        // Use the persistent decoration system
        return this.getPersistentDecoration(tileId, tileType);
    }

    getDecorationTexture(decorationType) {
        // Check cache first
        const cacheKey = `dec_${decorationType}`;
        if (this.decorationTextureCache.has(cacheKey)) {
            return this.decorationTextureCache.get(cacheKey);
        }

        const texture = this.textures.get(cacheKey);
        if (texture) {
            this.decorationTextureCache.set(cacheKey, texture);
        }
        return texture;
    }

    createStructureTexture(primaryColor, secondaryColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Fill primary color
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, 0, 64, 64);

        // Add some detail with secondary color
        ctx.fillStyle = secondaryColor;
        ctx.fillRect(4, 4, 56, 56);

        return canvas;
    }

    getStructureTexture(type, part) {
        return this.textures.get(`structure_${type}_${part}`);
    }

    clearDecorationCache() {
        console.log('TileManager: Clearing decoration cache...');
        this.decorationCache.clear();
    }

    batchDecoration(decoration, tileHeight, isoX, isoY) {
        const key = `${decoration.type}_${tileHeight}`;
        if (!this.decorationBatch.has(key)) {
            this.decorationBatch.set(key, []);
        }
        this.decorationBatch.get(key).push({ isoX, isoY });
    }

    flushDecorationBatch() {
        // Render all batched decorations at once
        for (const [key, positions] of this.decorationBatch) {
            // Render batch
        }
        this.decorationBatch.clear();
    }
}






































