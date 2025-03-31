/**
 * @typedef {Object} TileDefinition
 * @property {string} type - Tile type identifier
 * @property {Array<string>} variants - Available tile variants
 * @property {Object} properties - Tile properties
 * @property {boolean} properties.walkable - Whether tile can be walked on
 * @property {boolean} properties.buildable - Whether structures can be built on
 * @property {number} properties.movementCost - Movement cost modifier
 */

/**
 * @typedef {Object} TileVariant
 * @property {string} id - Variant identifier
 * @property {string} texture - Texture path or ID
 * @property {Object} [animation] - Animation configuration
 */

/**
 * @typedef {Object} TextureGenerationConfig
 * @property {string} baseColor - Base color in hex format
 * @property {number} noiseIntensity - Intensity of noise pattern (0-1)
 * @property {number} [roughness=0.5] - Surface roughness factor
 * @property {boolean} [usePattern=true] - Whether to apply noise pattern
 */

/**
 * @typedef {Object} TileMovementProperties
 * @property {number} movementCost - Base movement cost
 * @property {number} slipperiness - Surface slipperiness (0-1)
 * @property {number} roughness - Surface roughness (0-1)
 * @property {boolean} isPassable - Whether entities can pass through
 */

/**
 * @typedef {Object} TileRenderProperties
 * @property {number} elevation - Base elevation modifier
 * @property {boolean} isTransparent - Whether tile is transparent
 * @property {boolean} castsShadow - Whether tile casts shadows
 * @property {Object} [animationProps] - Animation properties
 */

/**
 * @typedef {Object} TileGroup
 * @property {string} id - Group identifier
 * @property {Array<string>} types - Tile types in this group
 * @property {Object} [properties] - Shared group properties
 * @property {Function} [validator] - Group validation function
 */

/**
 * @typedef {Object} TextureGenerationResult
 * @property {HTMLCanvasElement} canvas - Generated texture canvas
 * @property {string} id - Texture identifier
 * @property {boolean} success - Whether generation succeeded
 * @property {Error} [error] - Error if generation failed
 */

/**
 * @typedef {Object} SeasonalProperties
 * @property {Object} spring - Spring tile properties
 * @property {Object} summer - Summer tile properties
 * @property {Object} autumn - Autumn tile properties
 * @property {Object} winter - Winter tile properties
 * @property {Function} getForDate - Gets properties for specific date
 */

/**
 * @typedef {Object} WeatherEffect
 * @property {string} type - Effect type (rain, snow, etc)
 * @property {number} intensity - Effect intensity (0-1)
 * @property {Object} visualProps - Visual properties
 * @property {Function} apply - Applies effect to tile
 */

/**
 * @typedef {Object} TextureCache
 * @property {Map<string, HTMLCanvasElement>} cache - Cached textures
 * @property {number} maxSize - Maximum cache size
 * @property {Function} cleanup - Cache cleanup function
 */

/**
 * @typedef {Object} TileTransition
 * @property {string} from - Starting tile type
 * @property {string} to - Target tile type
 * @property {number} duration - Transition duration
 * @property {Function} update - Transition update function
 */

/**
 * @typedef {Object} TextureAnimation
 * @property {number} frames - Number of animation frames
 * @property {number} speed - Animation speed
 * @property {boolean} loop - Whether animation loops
 * @property {Function} onComplete - Animation complete callback
 */

/**
 * @typedef {Object} TileEffect
 * @property {string} id - Effect identifier
 * @property {number} duration - Effect duration
 * @property {Function} apply - Effect application function
 * @property {Function} remove - Effect removal function
 */

/**
 * @typedef {Object} EnvironmentModifier
 * @property {string} id - Modifier identifier
 * @property {Function} apply - Apply modifier to tile
 * @property {Function} remove - Remove modifier from tile
 * @property {number} duration - Duration in milliseconds
 * @property {Object} [params] - Additional parameters
 */

/**
 * @typedef {Object} TerrainDeformation
 * @property {string} type - Deformation type (crater, trench, etc)
 * @property {number} scale - Size of deformation
 * @property {number} depth - Depth of deformation
 * @property {Function} blend - Terrain blending function
 */

/**
 * Manages tile properties, textures, and surface types for the game world
 * @class TileManager
 */
export class TileManager {
    /**
     * Surface type enum for tile properties
     * @readonly
     * @enum {number}
     */
    static SURFACE_TYPES = {
        SOLID: 0,      // Normal walkable surface
        WATER: 1,      // Water tiles (unwalkable)
        ROUGH: 2,      // Rough terrain (slower movement)
        SLIPPERY: 3,   // Slippery surface (less control)
        IMPASSABLE: 4  // Completely blocked
    };

    /**
     * Tile type enum defining all available tile types
     * @readonly
     * @enum {string}
     */
    static TILE_TYPES = {
        WATER: 'water',         // Changed to lowercase
        WETLAND: 'wetland',     // to match property keys
        SAND: 'sand',
        DIRT: 'dirt',
        GRASS: 'grass',
        FOREST: 'forest',
        MOUNTAIN: 'mountain',
        CONCRETE: 'concrete',
        ASPHALT: 'asphalt',
        METAL: 'metal',
        TILES: 'tiles',
        GRAVEL: 'gravel',
        SOLAR: 'solar',
        GARDEN: 'garden',
        DOOR: 'door',
        HELIPAD: 'helipad',
        PARKING: 'parking'
    };

    /**
     * Creates a new TileManager instance
     * @param {Object} [debug=false] - Debug configuration
     */
    constructor(debug = false) {
        this.debug = debug;
        this.textures = new Map();
        this.tileDefinitions = new Map();
        this.variants = new Map();
        
        // Define variants for each tile type
        this.variants = {
            water: 1,
            wetland: 2,
            sand: 2,
            dirt: 2,
            grass: 3,
            forest: 2,
            mountain: 2,
            concrete: 3,
            asphalt: 3,
            metal: 2,
            tiles: 2,
            gravel: 2,
            solar: 1,
            garden: 2,
            door: 1,
            helipad: 1,
            parking: 1
        };

        // Define base colors for each tile type
        this.tileColors = {
            water: '#1976D2',     // Blue
            wetland: '#558B2F',    // Dark green
            sand: '#FDD835',       // Sand yellow
            dirt: '#795548',       // Brown
            grass: '#4CAF50',      // Green
            forest: '#2E7D32',     // Dark green
            mountain: '#757575',   // Gray
            concrete: '#9E9E9E',   // Medium gray
            asphalt: '#424242',    // Dark gray
            metal: '#B0BEC5',      // Bluish gray
            tiles: '#78909C',      // Cool gray
            gravel: '#707070',     // Warm gray
            solar: '#1A237E',      // Deep blue
            garden: '#66BB6A',     // Light green
            door: '#FFD700',       // Gold
            helipad: '#F57F17',    // Orange
            parking: '#37474F'     // Dark blue-gray
        };

        // Define surface properties for each tile type
        this.surfaceProperties = new Map([
            ['water', TileManager.SURFACE_TYPES.WATER],
            ['wetland', TileManager.SURFACE_TYPES.SLIPPERY],
            ['sand', TileManager.SURFACE_TYPES.ROUGH],
            ['dirt', TileManager.SURFACE_TYPES.ROUGH],
            ['grass', TileManager.SURFACE_TYPES.SOLID],
            ['forest', TileManager.SURFACE_TYPES.ROUGH],
            ['mountain', TileManager.SURFACE_TYPES.IMPASSABLE],
            ['concrete', TileManager.SURFACE_TYPES.SOLID],
            ['asphalt', TileManager.SURFACE_TYPES.SOLID],
            ['metal', TileManager.SURFACE_TYPES.SLIPPERY],
            ['tiles', TileManager.SURFACE_TYPES.SOLID],
            ['gravel', TileManager.SURFACE_TYPES.ROUGH],
            ['solar', TileManager.SURFACE_TYPES.SLIPPERY],
            ['garden', TileManager.SURFACE_TYPES.SOLID],
            ['door', TileManager.SURFACE_TYPES.SOLID],
            ['helipad', TileManager.SURFACE_TYPES.SOLID],
            ['parking', TileManager.SURFACE_TYPES.SOLID]
        ]);

        // Track loaded textures
        this.texturesLoaded = false;

        // Add validation
        this.validateTileTypes();
    }

    /**
     * Loads and initializes tile textures
     * @async
     * @returns {Promise<void>}
     * @throws {Error} If texture loading fails
     */
    async loadTextures() {
        if (this.debug?.flags?.logTextureLoading) {
            console.log('TileManager: Loading textures...');
        }

        const loadPromises = [];

        // Generate textures for each tile type and its variants
        for (const [tileType, variantCount] of Object.entries(this.variants)) {
            const baseColor = this.tileColors[tileType];
            
            // Generate base texture using AssetManager
            loadPromises.push(this.generateTexture(tileType, baseColor));

            // Generate variant textures
            for (let i = 1; i <= variantCount; i++) {
                const variantKey = `${tileType}_var${i}`;
                const variantColor = this.adjustColor(baseColor, i * 5);
                loadPromises.push(this.generateTexture(variantKey, variantColor));
            }
        }

        try {
            await Promise.all(loadPromises);
            this.texturesLoaded = true;
            if (this.debug?.flags?.logTextureLoading) {
                console.log('TileManager: All textures loaded successfully');
            }
        } catch (error) {
            console.error('TileManager: Failed to load textures:', error);
            throw error;
        }
    }

    generateTexture(name, baseColor) {
        return new Promise((resolve) => {
            const texture = window.gameInstance.assetManager.createTempTexture(
                `tile_${name}`,
                64,
                32,
                (ctx, canvas) => {
                    // Clear canvas
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // Fill with base color
                    ctx.fillStyle = baseColor;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Add subtle noise pattern
                    ctx.fillStyle = this.adjustColor(baseColor, 10);
                    const pattern = ctx.createPattern(this.createNoisePattern(baseColor), 'repeat');
                    ctx.fillStyle = pattern;
                    ctx.globalAlpha = 0.3;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.globalAlpha = 1.0;
                }
            );
            
            this.textures.set(name, texture);
            resolve();
        });
    }

    /**
     * Creates a noise pattern for tile textures
     * @param {string} baseColor - Base color in hex format
     * @param {Object} [options] - Pattern generation options
     * @param {number} [options.size=4] - Pattern size in pixels
     * @param {number} [options.intensity=5] - Color variation intensity
     * @returns {HTMLCanvasElement} Pattern canvas element
     * @private
     */
    createNoisePattern(baseColor, options = {}) {
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = options.size || 4;
        patternCanvas.height = options.size || 4;
        const patternCtx = patternCanvas.getContext('2d');

        patternCtx.fillStyle = this.adjustColor(baseColor, options.intensity || 5);
        patternCtx.fillRect(0, 0, 2, 2);
        patternCtx.fillRect(2, 2, 2, 2);

        return patternCanvas;
    }

    getTexture(tileType, variant) {
        const key = variant ? `${tileType}_var${variant}` : tileType;
        return this.textures.get(key);
    }

    getRandomVariant(tileType) {
        const variantCount = this.variants[tileType] || 1;
        if (variantCount <= 1) return null;
        return Math.floor(Math.random() * variantCount) + 1;
    }

    /**
     * Adjusts a color by a given amount
     * @param {string} color - Base color in hex format
     * @param {number} amount - Amount to adjust (-255 to 255)
     * @returns {string} Adjusted color in hex format
     * @private
     */
    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    /**
     * Validates tile type configurations
     * @private
     * @throws {Error} If tile type configuration is invalid
     */
    validateTileTypes() {
        // First validate surface properties
        const surfaceTypes = Object.values(TileManager.SURFACE_TYPES);
        for (const [tileType, surface] of this.surfaceProperties.entries()) {
            if (!surfaceTypes.includes(surface)) {
                console.error('Invalid surface type:', {
                    tileType,
                    surface,
                    validTypes: surfaceTypes
                });
                throw new Error(`Invalid surface type for tile ${tileType}: ${surface}`);
            }
        }

        // Then validate each tile type
        for (const [enumKey, tileType] of Object.entries(TileManager.TILE_TYPES)) {
            // Debug logging for each check
            console.log(`Validating tile type: ${tileType}`, {
                hasSurface: this.surfaceProperties.has(tileType),
                hasVariant: this.variants[tileType] !== undefined,
                hasColor: !!this.tileColors[tileType],
                surfaceValue: this.surfaceProperties.get(tileType)
            });

            if (!this.surfaceProperties.has(tileType)) {
                throw new Error(`Missing surface property for tile type: ${tileType}`);
            }
            if (this.variants[tileType] === undefined) {
                throw new Error(`Missing variant definition for tile type: ${tileType}`);
            }
            if (!this.tileColors[tileType]) {
                throw new Error(`Missing color definition for tile type: ${tileType}`);
            }
        }
    }

    getSurfaceType(tileType) {
        return this.surfaceProperties.get(tileType) ?? TileManager.SURFACE_TYPES.SOLID;
    }

    /**
     * Registers a new tile type
     * @param {string} type - Tile type identifier
     * @param {TileDefinition} definition - Tile definition
     */
    registerTileType(type, definition) {
        this.tileDefinitions.set(type, definition);
    }

    /**
     * Applies weather effects to tiles
     * @param {string} tileType - Tile type to affect
     * @param {WeatherEffect} effect - Weather effect to apply
     */
    applyWeatherEffect(tileType, effect) {
        // Implementation to be added
    }

    /**
     * Applies an effect to a tile
     * @param {string} tileId - Tile identifier
     * @param {TileEffect} effect - Effect to apply
     */
    applyEffect(tileId, effect) {
        // Implementation to be added
    }
}



























