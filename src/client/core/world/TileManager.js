/**
 * Manages tile definitions and their properties
 * @class TileManager
 */
export class TileManager {
    /**
     * Creates a new TileManager instance
     */
    constructor() {
        /**
         * Stores loaded texture images
         * @type {Object.<string, HTMLImageElement>}
         * @private
         */
        this.textures = {};
        
        // Decoration definitions
        this.decorations = {
            flowers: {
                texture: 'decorations/flowers.png',
                variants: ['decorations/flowers_red.png', 'decorations/flowers_yellow.png'],
                allowedTiles: ['grass'],
                probability: 0.2,
                offset: { x: 0, y: -8 },
                scale: { x: 0.5, y: 0.5 }
            },
            rocks: {
                texture: 'decorations/rocks.png',
                variants: ['decorations/rocks_small.png', 'decorations/rocks_mossy.png'],
                allowedTiles: ['grass', 'dirt', 'stone'],
                probability: 0.15,
                offset: { x: 0, y: -4 },
                scale: { x: 0.6, y: 0.6 }
            },
            grassTufts: {
                texture: 'decorations/grass_tuft.png',
                variants: ['decorations/grass_tuft_tall.png'],
                allowedTiles: ['grass', 'dirt'],
                probability: 0.3,
                offset: { x: 0, y: -6 },
                scale: { x: 0.7, y: 0.7 }
            }
        };

        // Update existing tile definitions to include allowedDecorations
        this.tileTypes = {
            grass: {
                texture: 'tiles/grass.png',
                variants: ['tiles/grass_var1.png', 'tiles/grass_var2.png'],
                height: 0,
                textureOffset: { x: 0, y: 0 },
                animated: false,
                allowedDecorations: ['flowers', 'rocks', 'grassTufts']
            },
            dirt: {
                texture: 'tiles/dirt.png',
                variants: ['tiles/dirt_var1.png', 'tiles/dirt_var2.png'],
                height: 0,
                textureOffset: { x: 0, y: 0 },
                animated: false,
                allowedDecorations: ['rocks', 'grassTufts']
            },
            stone: {
                texture: 'tiles/stone.png',
                variants: ['tiles/stone_mossy.png', 'tiles/stone_cracked.png'],
                height: 1,
                textureOffset: { x: 0, y: -16 },
                animated: false,
                allowedDecorations: ['rocks']
            },
            // ... other tile types ...
        };

        this.loadTextures();
    }

    /**
     * Loads all tile textures
     * @returns {Promise} Resolves when all textures are loaded
     * @private
     */
    async loadTextures() {
        const texturePromises = [];

        // Load tile textures
        for (const [type, props] of Object.entries(this.tileTypes)) {
            texturePromises.push(this.loadSingleTexture(type, props.texture));
            
            if (props.variants) {
                props.variants.forEach((variant, index) => {
                    texturePromises.push(
                        this.loadSingleTexture(`${type}_var${index}`, variant)
                    );
                });
            }
        }

        // Load decoration textures
        for (const [decType, props] of Object.entries(this.decorations)) {
            texturePromises.push(this.loadSingleTexture(`dec_${decType}`, props.texture));
            
            if (props.variants) {
                props.variants.forEach((variant, index) => {
                    texturePromises.push(
                        this.loadSingleTexture(`dec_${decType}_var${index}`, variant)
                    );
                });
            }
        }

        return Promise.all(texturePromises);
    }

    loadSingleTexture(key, filename) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.textures[key] = img;
                resolve();
            };
            img.onerror = () => reject(new Error(`Failed to load texture: ${filename}`));
            img.src = `assets/textures/${filename}`;
        });
    }

    /**
     * Gets the properties for a specific tile type
     * @param {string} type - The tile type to look up
     * @returns {Object} The tile properties (defaults to grass if type not found)
     */
    getTileProperties(type) {
        return this.tileTypes[type] || this.tileTypes.grass;
    }

    /**
     * Gets the texture for a specific tile type
     * @param {string} type - The tile type to look up
     * @param {number|null} variant - The variant index (0-based) or null for main texture
     * @returns {HTMLImageElement|null} The tile texture
     */
    getTexture(type, variant = null) {
        if (variant !== null) {
            const variantKey = `${type}_var${variant}`;
            if (this.textures[variantKey]) {
                return this.textures[variantKey];
            }
        }
        return this.textures[type] || this.textures.grass; // Fallback to grass
    }

    getRandomVariant(type) {
        const props = this.getTileProperties(type);
        if (props.variants && props.variants.length > 0) {
            return Math.floor(Math.random() * props.variants.length);
        }
        return null;
    }

    /**
     * Checks if all textures are loaded
     * @returns {boolean} True if all textures are loaded
     */
    isLoaded() {
        return Object.keys(this.tileTypes).every(type => this.textures[type]);
    }

    /**
     * Gets a decoration texture
     * @param {string} decorationType - The decoration type
     * @param {number|null} variant - Optional variant index
     * @returns {HTMLImageElement|null} The decoration texture
     */
    getDecorationTexture(decorationType, variant = null) {
        if (variant !== null) {
            const variantKey = `dec_${decorationType}_var${variant}`;
            if (this.textures[variantKey]) {
                return this.textures[variantKey];
            }
        }
        return this.textures[`dec_${decorationType}`] || null;
    }

    /**
     * Gets a random decoration for a tile type
     * @param {string} tileType - The tile type
     * @returns {Object|null} Decoration data or null if none selected
     */
    getRandomDecoration(tileType) {
        const tileProps = this.getTileProperties(tileType);
        if (!tileProps.allowedDecorations) return null;

        // Filter decorations allowed for this tile type
        const possibleDecorations = tileProps.allowedDecorations
            .filter(decType => Math.random() < this.decorations[decType].probability);

        if (possibleDecorations.length === 0) return null;

        // Randomly select one decoration type
        const decorationType = possibleDecorations[Math.floor(Math.random() * possibleDecorations.length)];
        const decoration = this.decorations[decorationType];

        // Randomly select a variant if available
        const variant = decoration.variants ? 
            Math.floor(Math.random() * decoration.variants.length) : 
            null;

        return {
            type: decorationType,
            variant,
            offset: decoration.offset,
            scale: decoration.scale
        };
    }
}

