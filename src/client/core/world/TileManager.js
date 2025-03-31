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
        PARKING: 'parking',
        TREE: 'tree',          // Add tree type
        BUSH: 'bush'           // Add bush type for completeness
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
            parking: 1,
            tree: 2,       // Add tree variants
            bush: 1        // Add bush variant
        };

        // Expanded base colors for all tile types
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
            parking: '#37474F',     // Dark blue-gray
            tree: '#2E7D32',       // Dark green (same as forest)
            bush: '#388E3C'        // Medium green
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
            ['parking', TileManager.SURFACE_TYPES.SOLID],
            ['tree', TileManager.SURFACE_TYPES.IMPASSABLE],
            ['bush', TileManager.SURFACE_TYPES.ROUGH]
        ]);

        // Register tile types for natural objects
        this.tileDefinitions.set('tree', {
            type: 'tree',
            variants: ['normal', 'tall'],
            properties: {
                walkable: false,
                buildable: false,
                movementCost: Infinity,
                height: 0.5,  // Add default height
                moisture: 0.6  // Add default moisture
            }
        });

        this.tileDefinitions.set('bush', {
            type: 'bush',
            variants: ['normal'],
            properties: {
                walkable: false,
                buildable: false,
                movementCost: 2
            }
        });

        // Add tree-specific texture generation
        this.treeTextures = {
            trunk: '#4A2F1C',  // Dark brown
            foliage: '#2E5824' // Forest green
        };

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
        console.log('TileManager: Starting texture loading...');
        const startTime = performance.now();
        const loadPromises = [];
        const missingTextures = [];

        // Get all possible tile types from TILE_TYPES enum
        const allTileTypes = Object.values(TileManager.TILE_TYPES);
        
        for (const tileType of allTileTypes) {
            if (!this.tileColors[tileType]) {
                console.warn(`Missing color definition for tile type: ${tileType}`);
                missingTextures.push(tileType);
                // Set a default color for missing definitions
                this.tileColors[tileType] = '#FF00FF'; // Magenta for missing textures
            }

            const baseColor = this.tileColors[tileType];
            const variantCount = this.variants[tileType] || 1;

            // Generate base texture
            loadPromises.push(this.generateTexture(tileType, baseColor).catch(err => {
                console.error(`Failed to generate texture for ${tileType}:`, err);
            }));

            // Generate variants
            for (let i = 1; i <= variantCount; i++) {
                const variantKey = `${tileType}_var${i}`;
                const variantColor = this.adjustColor(baseColor, i * 5);
                loadPromises.push(this.generateTexture(variantKey, variantColor).catch(err => {
                    console.error(`Failed to generate variant texture ${variantKey}:`, err);
                }));
            }
        }

        try {
            await Promise.all(loadPromises);
            const endTime = performance.now();
            console.log('TileManager: Texture loading complete', {
                duration: `${(endTime - startTime).toFixed(2)}ms`,
                totalTextures: this.textures.size,
                missingDefinitions: missingTextures
            });
            
            // Validate all textures were created
            this.validateTextureCompleteness(allTileTypes);
            
            this.texturesLoaded = true;
        } catch (error) {
            console.error('TileManager: Critical error during texture loading:', error);
            throw error;
        }
    }

    /**
     * Validates that all tile types have corresponding textures
     * @private
     * @param {Array<string>} tileTypes - Array of tile types to validate
     */
    validateTextureCompleteness(tileTypes) {
        const missingTextures = [];
        
        for (const type of tileTypes) {
            if (!this.textures.has(type)) {
                missingTextures.push(type);
                console.error(`Missing texture for tile type: ${type}`);
            }
            
            // Check variants
            const variantCount = this.variants[type] || 1;
            for (let i = 1; i <= variantCount; i++) {
                const variantKey = `${type}_var${i}`;
                if (!this.textures.has(variantKey)) {
                    missingTextures.push(variantKey);
                    console.error(`Missing texture for variant: ${variantKey}`);
                }
            }
        }

        // Add detailed logging for missing textures
        if (missingTextures.length > 0) {
            console.warn('Missing textures:', {
                types: missingTextures,
                availableTypes: Array.from(this.textures.keys()),
                tileColors: Object.keys(this.tileColors)
            });
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

                    switch(name) {
                        case TileManager.TILE_TYPES.WATER:
                            this.generateWaterTexture(ctx, canvas, baseColor);
                            break;
                        case TileManager.TILE_TYPES.TREE:
                        case TileManager.TILE_TYPES.BUSH:
                            this.generateNaturalTexture(ctx, canvas, name, baseColor);
                            break;
                        case TileManager.TILE_TYPES.DOOR:
                            this.generateDoorTexture(ctx, canvas, baseColor);
                            break;
                        case TileManager.TILE_TYPES.HELIPAD:
                            this.generateHelipadTexture(ctx, canvas, baseColor);
                            break;
                        default:
                            this.generateStandardTexture(ctx, canvas, name, baseColor);
                    }
                }
            );
            
            this.textures.set(name, texture);
            resolve();
        });
    }

    generateWaterTexture(ctx, canvas, baseColor) {
        // Base water color
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add wave pattern
        ctx.strokeStyle = this.adjustColor(baseColor, 15, true);
        ctx.lineWidth = 1;
        
        for (let i = 0; i < canvas.height; i += 4) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            for (let x = 0; x < canvas.width; x += 10) {
                ctx.lineTo(x, i + Math.sin(x / 20) * 2);
            }
            ctx.stroke();
        }
    }

    generateNaturalTexture(ctx, canvas, name, baseColor) {
        // Base ground
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (name === TileManager.TILE_TYPES.TREE) {
            // Tree trunk
            ctx.fillStyle = this.treeTextures.trunk;
            ctx.fillRect(canvas.width * 0.4, canvas.height * 0.5, 
                        canvas.width * 0.2, canvas.height * 0.5);
            
            // Tree foliage
            ctx.fillStyle = this.treeTextures.foliage;
            ctx.beginPath();
            ctx.ellipse(canvas.width * 0.5, canvas.height * 0.3,
                       canvas.width * 0.3, canvas.height * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Bush
            ctx.fillStyle = baseColor;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.ellipse(
                    canvas.width * (0.3 + i * 0.2),
                    canvas.height * 0.5,
                    canvas.width * 0.2,
                    canvas.height * 0.2,
                    0, 0, Math.PI * 2
                );
                ctx.fill();
            }
        }
    }

    generateStandardTexture(ctx, canvas, name, baseColor) {
        // Base color
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add noise pattern for texture
        const noisePattern = this.createNoisePattern(baseColor);
        ctx.fillStyle = ctx.createPattern(noisePattern, 'repeat');
        ctx.globalAlpha = 0.3;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;

        // Add subtle edge highlighting
        ctx.strokeStyle = this.adjustColor(baseColor, 20, true);
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
    }

    generateHelipadTexture(ctx, canvas, baseColor) {
        // Base concrete
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Helipad marking
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2, 
                Math.min(canvas.width, canvas.height) * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2, 
                Math.min(canvas.width, canvas.height) * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // H marking
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(canvas.width * 0.4, canvas.height * 0.3, 
                    canvas.width * 0.2, canvas.height * 0.4);
        ctx.fillRect(canvas.width * 0.35, canvas.height * 0.45, 
                    canvas.width * 0.3, canvas.height * 0.1);
    }

    /**
     * Adjusts a color by a given amount
     * @param {string} color - Base color in hex format
     * @param {number} amount - Amount to adjust (-255 to 255)
     * @returns {string} Adjusted color in hex format
     * @private
     */
    adjustColor(color, amount, lighter = false) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        const adjust = lighter ? amount : -amount;
        
        const newR = Math.max(0, Math.min(255, r + adjust));
        const newG = Math.max(0, Math.min(255, g + adjust));
        const newB = Math.max(0, Math.min(255, b + adjust));
        
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    createNoisePattern(baseColor) {
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = 4;
        patternCanvas.height = 4;
        const patternCtx = patternCanvas.getContext('2d');
        
        patternCtx.fillStyle = this.adjustColor(baseColor, 10);
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
                if (Math.random() > 0.5) {
                    patternCtx.fillRect(x, y, 1, 1);
                }
            }
        }
        
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

    /**
     * Gets detailed information about a tile type
     * @param {string} type - Tile type identifier
     * @returns {Object} Tile type information
     */
    getTileTypeInfo(type) {
        return {
            hasTexture: this.textures.has(type),
            hasColor: !!this.tileColors[type],
            hasVariant: type in this.variants,
            hasSurfaceProperty: this.surfaceProperties.has(type)
        };
    }
}




























