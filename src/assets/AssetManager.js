/**
 * AssetManager.js
 * Manages loading and accessing game assets
 */
import { PIXI } from '../utils/PixiWrapper.js';
import { ASSETS, getAssetById } from './AssetDefinitions.js';

/**
 * AssetManager class
 * Handles loading, caching, and accessing game assets
 */
export class AssetManager {
    /**
     * Creates a new asset manager
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        this.game = options.game;
        this.world = options.world;

        // Texture cache
        this.textures = new Map();

        // Placeholder textures for assets without real textures
        this.placeholderTextures = new Map();

        // Track loading state
        this.loading = false;
        this.loadProgress = 0;
        this.loadQueue = [];
        this.loadCallbacks = [];
    }

    /**
     * Initializes the asset manager
     */
    initialize() {
        // Generate placeholder textures for all assets
        this.generatePlaceholderTextures();
    }

    /**
     * Generates placeholder textures for all assets
     */
    generatePlaceholderTextures() {
        ASSETS.forEach(asset => {
            if (!this.textures.has(asset.id)) {
                const texture = this.createPlaceholderTexture(asset);
                this.placeholderTextures.set(asset.id, texture);
            }
        });
    }

    /**
     * Creates a placeholder texture for an asset
     * @param {Object} asset - Asset definition
     * @returns {PIXI.Texture} The created texture
     */
    createPlaceholderTexture(asset) {
        // Create a graphics object for the texture
        const graphics = new PIXI.Graphics();

        // Get dimensions based on asset size
        const tileWidth = this.world ? this.world.config.tileWidth : 64;
        const tileHeight = this.world ? this.world.config.tileHeight : 32;
        const width = asset.width * tileWidth;
        const height = asset.height * tileHeight;

        // Special handling for terrain types
        if (asset.isTerrain) {
            return this.createTerrainTexture(asset, tileWidth, tileHeight);
        }

        // Choose color based on category
        let color, accentColor;
        switch (asset.category) {
            case 'terrain':
                color = 0x00AA00;      // Green (default terrain)
                accentColor = 0x00FF00;
                break;
            case 'environment':
                color = 0x00AA00;      // Green
                accentColor = 0x00FF00;
                break;
            case 'infrastructure':
                color = 0x888888;      // Gray
                accentColor = 0xAAAAAA;
                break;
            case 'buildings':
                color = 0x0000AA;      // Blue
                accentColor = 0x0088FF;
                break;
            case 'characters':
                color = 0xAA0000;      // Red
                accentColor = 0xFF0000;
                break;
            case 'props':
                color = 0xAA00AA;      // Purple
                accentColor = 0xFF00FF;
                break;
            default:
                color = 0xFFAA00;      // Orange
                accentColor = 0xFFFF00;
        }

        // Draw base shape with cyberpunk style
        graphics.beginFill(color, 0.7);

        // Draw isometric shape based on asset dimensions
        if (asset.width === 1 && asset.height === 1) {
            // Single tile - diamond shape
            graphics.moveTo(tileWidth / 2, 0);
            graphics.lineTo(tileWidth, tileHeight / 2);
            graphics.lineTo(tileWidth / 2, tileHeight);
            graphics.lineTo(0, tileHeight / 2);
            graphics.lineTo(tileWidth / 2, 0);
        } else {
            // Multi-tile - custom shape based on dimensions
            const totalWidth = asset.width * tileWidth;
            const totalHeight = asset.height * tileHeight;

            // Draw isometric shape
            graphics.moveTo(totalWidth / 2, 0);
            graphics.lineTo(totalWidth, totalHeight / 2);
            graphics.lineTo(totalWidth / 2, totalHeight);
            graphics.lineTo(0, totalHeight / 2);
            graphics.lineTo(totalWidth / 2, 0);
        }

        graphics.endFill();

        // Add neon outline
        graphics.lineStyle(2, accentColor, 1);
        if (asset.width === 1 && asset.height === 1) {
            graphics.moveTo(tileWidth / 2, 0);
            graphics.lineTo(tileWidth, tileHeight / 2);
            graphics.lineTo(tileWidth / 2, tileHeight);
            graphics.lineTo(0, tileHeight / 2);
            graphics.lineTo(tileWidth / 2, 0);
        } else {
            const totalWidth = asset.width * tileWidth;
            const totalHeight = asset.height * tileHeight;

            graphics.moveTo(totalWidth / 2, 0);
            graphics.lineTo(totalWidth, totalHeight / 2);
            graphics.lineTo(totalWidth / 2, totalHeight);
            graphics.lineTo(0, totalHeight / 2);
            graphics.lineTo(totalWidth / 2, 0);
        }

        // Add asset name
        const text = new PIXI.Text(asset.name, {
            fontFamily: 'Arial',
            fontSize: 10,
            fill: 0xFFFFFF,
            align: 'center'
        });
        text.anchor.set(0.5, 0.5);
        text.position.set(width / 2, height / 2);
        graphics.addChild(text);

        // Generate texture
        if (this.game && this.game.app && this.game.app.renderer) {
            return this.game.app.renderer.generateTexture(graphics);
        } else {
            console.warn('Cannot generate texture: renderer not available');
            return PIXI.Texture.EMPTY;
        }
    }

    /**
     * Creates a texture for terrain tiles
     * @param {Object} asset - Terrain asset definition
     * @param {number} tileWidth - Width of a tile
     * @param {number} tileHeight - Height of a tile
     * @returns {PIXI.Texture} The created texture
     */
    createTerrainTexture(asset, tileWidth, tileHeight) {
        const graphics = new PIXI.Graphics();

        // Choose color based on terrain type
        let fillColor, lineColor, pattern;
        switch (asset.id) {
            case 'grass':
                fillColor = 0x33AA33;  // Green
                lineColor = 0x44FF44;
                pattern = 'dots';
                break;
            case 'dirt':
                fillColor = 0x8B4513;  // Brown
                lineColor = 0xA0522D;
                pattern = 'rough';
                break;
            case 'sand':
                fillColor = 0xF0E68C;  // Khaki
                lineColor = 0xFFD700;
                pattern = 'dots';
                break;
            case 'stone':
                fillColor = 0x808080;  // Gray
                lineColor = 0xA9A9A9;
                pattern = 'grid';
                break;
            case 'water':
                fillColor = 0x1E90FF;  // Blue
                lineColor = 0x00BFFF;
                pattern = 'waves';
                break;
            case 'elevated':
                fillColor = 0x556B2F;  // Dark Olive Green
                lineColor = 0x6B8E23;
                pattern = 'elevated';
                break;
            default:
                fillColor = 0x33AA33;  // Default green
                lineColor = 0x44FF44;
                pattern = 'dots';
        }

        // Draw base shape
        graphics.beginFill(fillColor, 0.9);
        graphics.lineStyle(1, lineColor, 0.8);

        // Draw isometric diamond shape
        graphics.moveTo(tileWidth / 2, 0);
        graphics.lineTo(tileWidth, tileHeight / 2);
        graphics.lineTo(tileWidth / 2, tileHeight);
        graphics.lineTo(0, tileHeight / 2);
        graphics.lineTo(tileWidth / 2, 0);
        graphics.endFill();

        // Add pattern based on terrain type
        switch (pattern) {
            case 'dots':
                // Add small dots
                graphics.beginFill(lineColor, 0.5);
                for (let i = 0; i < 5; i++) {
                    const x = tileWidth / 4 + Math.random() * tileWidth / 2;
                    const y = tileHeight / 4 + Math.random() * tileHeight / 2;
                    graphics.drawCircle(x, y, 1);
                }
                graphics.endFill();
                break;
            case 'rough':
                // Add rough texture lines
                graphics.lineStyle(1, lineColor, 0.3);
                for (let i = 0; i < 3; i++) {
                    const startX = tileWidth / 4 + Math.random() * tileWidth / 2;
                    const startY = tileHeight / 4 + Math.random() * tileHeight / 2;
                    const endX = startX + (Math.random() * 10 - 5);
                    const endY = startY + (Math.random() * 10 - 5);
                    graphics.moveTo(startX, startY);
                    graphics.lineTo(endX, endY);
                }
                break;
            case 'grid':
                // Add grid pattern
                graphics.lineStyle(1, lineColor, 0.3);
                graphics.moveTo(tileWidth / 2, 0);
                graphics.lineTo(tileWidth / 2, tileHeight);
                graphics.moveTo(0, tileHeight / 2);
                graphics.lineTo(tileWidth, tileHeight / 2);
                break;
            case 'waves':
                // Add wave pattern for water
                graphics.lineStyle(1, lineColor, 0.5);
                const waveHeight = 2;
                const waveCount = 3;
                for (let i = 0; i < waveCount; i++) {
                    const y = tileHeight / 4 + (i * tileHeight / (waveCount + 1));
                    graphics.moveTo(tileWidth / 4, y);
                    graphics.bezierCurveTo(
                        tileWidth / 3, y - waveHeight,
                        tileWidth / 2, y + waveHeight,
                        tileWidth * 3/4, y
                    );
                }
                break;
            case 'elevated':
                // Add elevation indicators
                graphics.lineStyle(1, lineColor, 0.7);
                // Draw small triangles to indicate elevation
                for (let i = 0; i < 4; i++) {
                    const angle = (i * Math.PI / 2) + (Math.PI / 4);
                    const x = tileWidth / 2 + Math.cos(angle) * tileWidth / 3;
                    const y = tileHeight / 2 + Math.sin(angle) * tileHeight / 3;

                    graphics.moveTo(x, y);
                    graphics.lineTo(x + 5, y);
                    graphics.lineTo(x + 2.5, y - 5);
                    graphics.lineTo(x, y);
                }
                break;
        }

        // Add elevation indicator if needed
        if (asset.elevation !== 0) {
            const elevationText = asset.elevation > 0 ? `+${asset.elevation}` : asset.elevation.toString();
            const text = new PIXI.Text(elevationText, {
                fontFamily: 'Arial',
                fontSize: 10,
                fontWeight: 'bold',
                fill: 0xFFFFFF,
                stroke: 0x000000,
                strokeThickness: 2,
                align: 'center'
            });
            text.anchor.set(0.5, 0.5);
            text.position.set(tileWidth / 2, tileHeight / 2);
            graphics.addChild(text);
        }

        // Generate texture
        if (this.game && this.game.app && this.game.app.renderer) {
            return this.game.app.renderer.generateTexture(graphics);
        } else {
            console.warn('Cannot generate texture: renderer not available');
            return PIXI.Texture.EMPTY;
        }
    }

    /**
     * Gets a texture for an asset
     * @param {string} assetId - Asset ID
     * @returns {PIXI.Texture} The asset texture
     */
    getTexture(assetId) {
        // Try to get the real texture first
        if (this.textures.has(assetId)) {
            return this.textures.get(assetId);
        }

        // Fall back to placeholder texture
        if (this.placeholderTextures.has(assetId)) {
            return this.placeholderTextures.get(assetId);
        }

        // If no texture is found, create a placeholder on the fly
        const asset = getAssetById(assetId);
        if (asset) {
            const texture = this.createPlaceholderTexture(asset);
            this.placeholderTextures.set(assetId, texture);
            return texture;
        }

        // Last resort - return empty texture
        console.warn(`No texture found for asset: ${assetId}`);
        return PIXI.Texture.EMPTY;
    }

    /**
     * Loads real textures for assets
     * @param {Function} callback - Callback function when loading is complete
     */
    loadTextures(callback) {
        // TODO: Implement real texture loading from files
        // For now, we'll just use the placeholder textures

        if (callback) {
            callback();
        }
    }
}
