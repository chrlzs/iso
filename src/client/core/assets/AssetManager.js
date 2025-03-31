/**
 * Manages loading and caching of game assets (textures, sounds, etc.)
 * @class AssetManager
 */
export class AssetManager {
    /**
     * Creates a new AssetManager instance
     * @param {Object} [options={}] - Configuration options
     * @param {string} [options.baseUrl=''] - Base URL for asset loading
     * @param {boolean} [options.cacheEnabled=true] - Whether to cache loaded assets
     */
    constructor(options = {}) {
        this.textures = new Map();
        this.sounds = new Map();
        this.loadingPromises = new Map();
        this.baseUrl = options.baseUrl || '/assets';
    }

    /**
     * Loads an image asset
     * @async
     * @param {string} key - Unique identifier for the asset
     * @param {string} url - URL to load the image from
     * @returns {Promise<HTMLImageElement>} The loaded image
     * @throws {Error} If loading fails
     */
    async loadImage(key, url) {
        // Return cached texture if available
        if (this.textures.has(key)) {
            return this.textures.get(key);
        }

        // Return existing promise if already loading
        if (this.loadingPromises.has(key)) {
            return this.loadingPromises.get(key);
        }

        // Create new loading promise
        const loadPromise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.textures.set(key, img);
                this.loadingPromises.delete(key);
                resolve(img);
            };
            img.onerror = () => {
                this.loadingPromises.delete(key);
                reject(new Error(`Failed to load texture: ${url}`));
            };
            img.src = url.startsWith('data:') ? url : `${this.baseUrl}/${url}`;
        });

        this.loadingPromises.set(key, loadPromise);
        return loadPromise;
    }

    /**
     * Creates a temporary texture for immediate use
     * @param {string} name - Unique name for the texture
     * @param {number} width - Width in pixels
     * @param {number} height - Height in pixels
     * @param {Function} drawCallback - Function to draw the texture content
     * @returns {HTMLCanvasElement} The created texture canvas
     */
    createTempTexture(name, width, height, drawCallback) {
        if (this.textures.has(name)) {
            return this.textures.get(name);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Execute the render function to draw on canvas
        drawCallback(ctx, canvas);
        
        this.textures.set(name, canvas);
        return canvas;
    }

    /**
     * Gets a cached asset by key
     * @param {string} key - Asset identifier
     * @returns {*} The cached asset or null if not found
     */
    get(key) {
        return this.textures.get(key);
    }

    /**
     * Sets the base URL for asset loading
     * @param {string} url - New base URL
     * @returns {void}
     */
    setBaseUrl(url) {
        this.baseUrl = url;
    }

    /**
     * Preloads a list of assets
     * @async
     * @param {Array<{type: string, key: string, url: string}>} assets - Assets to load
     * @returns {Promise<void>}
     * @throws {Error} If any asset fails to load
     */
    async preload(assets) {
        const promises = assets.map(asset => {
            if (asset.type === 'texture') {
                return this.loadImage(asset.key, asset.url);
            }
            // Add other asset types as needed
            return Promise.resolve();
        });

        await Promise.all(promises);
    }

    /**
     * Clears asset cache
     * @param {string} [type] - Optional asset type to clear, or all if not specified
     * @returns {void}
     */
    clearCache(type) {
        if (!type) {
            this.textures.clear();
            this.sounds.clear();
            this.loadingPromises.clear();
        } else if (type === 'texture') {
            this.textures.clear();
        } else if (type === 'sound') {
            this.sounds.clear();
        }
    }
}
