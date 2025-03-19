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

        /**
         * Defines the properties for each tile type
         * @type {Object.<string, {texture: string, height: number}>}
         */
        this.tileTypes = {
            grass: { texture: 'grass.png', height: 0 },
            water: { texture: 'water.png', height: -1 },
            sand: { texture: 'sand.png', height: 0 },
            stone: { texture: 'stone.png', height: 0 }
        };

        this.loadTextures();
    }

    /**
     * Loads all tile textures
     * @returns {Promise} Resolves when all textures are loaded
     * @private
     */
    async loadTextures() {
        const texturePromises = Object.entries(this.tileTypes).map(([type, props]) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.textures[type] = img;
                    resolve();
                };
                img.onerror = reject;
                img.src = `assets/textures/${props.texture}`;
            });
        });

        return Promise.all(texturePromises);
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
     * @returns {HTMLImageElement|null} The tile texture
     */
    getTexture(type) {
        return this.textures[type] || this.textures.grass;
    }

    /**
     * Checks if all textures are loaded
     * @returns {boolean} True if all textures are loaded
     */
    isLoaded() {
        return Object.keys(this.tileTypes).every(type => this.textures[type]);
    }
}

