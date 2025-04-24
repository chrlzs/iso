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
                // Different colors for different environment assets
                if (asset.id.includes('tree')) {
                    color = 0x228B22;      // Forest Green
                    accentColor = 0x00FF00; // Bright Green
                } else if (asset.id.includes('rock')) {
                    color = 0x808080;      // Gray
                    accentColor = 0xA9A9A9; // Dark Gray
                } else if (asset.id.includes('shrub')) {
                    color = 0x32CD32;      // Lime Green
                    accentColor = 0x7CFC00; // Lawn Green
                } else {
                    color = 0x00AA00;      // Default Green
                    accentColor = 0x00FF00;
                }
                break;
            case 'infrastructure':
                // Different colors for different infrastructure types
                if (asset.id.includes('road')) {
                    color = 0x696969;      // Dim gray for roads
                    accentColor = 0xFFFF00; // Yellow accent for road markings
                } else if (asset.id.includes('sidewalk')) {
                    color = 0xA9A9A9;      // Dark gray for sidewalks
                    accentColor = 0xDCDCDC; // Light gray accent
                } else if (asset.id.includes('streetlight')) {
                    color = 0xC0C0C0;      // Silver for streetlights
                    accentColor = 0xFFFF00; // Yellow accent for light
                } else {
                    color = 0x888888;      // Default gray
                    accentColor = 0xAAAAAA;
                }
                break;
            case 'buildings':
                // Different colors for different building types
                if (asset.id.includes('house')) {
                    color = 0x1E90FF;      // Dodger blue for houses
                    accentColor = 0x00FFFF; // Cyan accent
                } else if (asset.id.includes('shop')) {
                    color = 0x00CED1;      // Dark turquoise for shops
                    accentColor = 0xFFD700; // Gold accent
                } else if (asset.id.includes('office')) {
                    color = 0x4682B4;      // Steel blue for office buildings
                    accentColor = 0x00BFFF; // Deep sky blue accent
                } else {
                    color = 0x0000AA;      // Default blue
                    accentColor = 0x0088FF;
                }
                break;
            case 'characters':
                // Different colors for different character types
                if (asset.id.includes('player')) {
                    color = 0x00FFFF;      // Cyan for player
                    accentColor = 0xFF00FF; // Magenta accent
                } else if (asset.id.includes('enemy')) {
                    color = 0xFF355E;      // Hot pink for enemies
                    accentColor = 0xFF0000; // Red accent
                } else if (asset.id.includes('npc') || asset.id.includes('vendor') || asset.id.includes('guard')) {
                    color = 0x00FF00;      // Green for NPCs
                    accentColor = 0xFFFF00; // Yellow accent
                } else {
                    color = 0xAA0000;      // Default red
                    accentColor = 0xFF0000;
                }
                break;
            case 'props':
                // Different colors for different prop types
                if (asset.id.includes('terminal')) {
                    color = 0x008080;      // Teal for terminals
                    accentColor = 0x00FFFF; // Cyan accent
                } else if (asset.id.includes('crate')) {
                    color = 0xCD853F;      // Peru for crates
                    accentColor = 0xFFD700; // Gold accent
                } else if (asset.id.includes('bench')) {
                    color = 0xDEB887;      // Burlywood for benches
                    accentColor = 0x8B4513; // Saddle brown accent
                } else {
                    color = 0xAA00AA;      // Default purple
                    accentColor = 0xFF00FF;
                }
                break;
            default:
                color = 0xFFAA00;      // Orange
                accentColor = 0xFFFF00;
        }

        // Draw base shape with cyberpunk style
        if (asset.category === 'characters') {
            // Special handling for character assets
            // Base/ground
            graphics.beginFill(0x333333, 0.5); // Dark gray for ground
            graphics.drawEllipse(tileWidth / 2, tileHeight * 0.9, tileWidth * 0.4, tileHeight * 0.1);
            graphics.endFill();

            // Character body
            if (asset.id.includes('npc_civilian')) {
                // Civilian NPC
                // Body
                graphics.beginFill(color, 0.8);
                graphics.drawRect(tileWidth * 0.35, tileHeight * 0.4, tileWidth * 0.3, tileHeight * 0.5);
                graphics.endFill();

                // Head
                graphics.beginFill(color, 0.9);
                graphics.drawCircle(tileWidth * 0.5, tileHeight * 0.3, tileWidth * 0.15);
                graphics.endFill();

                // Outline
                graphics.lineStyle(1, accentColor, 1);
                graphics.drawRect(tileWidth * 0.35, tileHeight * 0.4, tileWidth * 0.3, tileHeight * 0.5);
                graphics.drawCircle(tileWidth * 0.5, tileHeight * 0.3, tileWidth * 0.15);
            } else if (asset.id.includes('npc_guard')) {
                // Guard NPC
                // Body
                graphics.beginFill(color, 0.8);
                graphics.drawRect(tileWidth * 0.35, tileHeight * 0.4, tileWidth * 0.3, tileHeight * 0.5);
                graphics.endFill();

                // Head with helmet
                graphics.beginFill(color, 0.9);
                graphics.drawCircle(tileWidth * 0.5, tileHeight * 0.3, tileWidth * 0.15);
                graphics.endFill();

                // Helmet
                graphics.beginFill(accentColor, 0.7);
                graphics.drawRect(tileWidth * 0.35, tileHeight * 0.2, tileWidth * 0.3, tileHeight * 0.1);
                graphics.endFill();

                // Outline
                graphics.lineStyle(1, accentColor, 1);
                graphics.drawRect(tileWidth * 0.35, tileHeight * 0.4, tileWidth * 0.3, tileHeight * 0.5);
                graphics.drawCircle(tileWidth * 0.5, tileHeight * 0.3, tileWidth * 0.15);
                graphics.drawRect(tileWidth * 0.35, tileHeight * 0.2, tileWidth * 0.3, tileHeight * 0.1);
            } else if (asset.id.includes('npc_vendor')) {
                // Vendor NPC
                // Body
                graphics.beginFill(color, 0.8);
                graphics.drawRect(tileWidth * 0.35, tileHeight * 0.4, tileWidth * 0.3, tileHeight * 0.5);
                graphics.endFill();

                // Head
                graphics.beginFill(color, 0.9);
                graphics.drawCircle(tileWidth * 0.5, tileHeight * 0.3, tileWidth * 0.15);
                graphics.endFill();

                // Vendor hat
                graphics.beginFill(accentColor, 0.7);
                graphics.drawEllipse(tileWidth * 0.5, tileHeight * 0.2, tileWidth * 0.2, tileHeight * 0.05);
                graphics.endFill();

                // Outline
                graphics.lineStyle(1, accentColor, 1);
                graphics.drawRect(tileWidth * 0.35, tileHeight * 0.4, tileWidth * 0.3, tileHeight * 0.5);
                graphics.drawCircle(tileWidth * 0.5, tileHeight * 0.3, tileWidth * 0.15);
                graphics.drawEllipse(tileWidth * 0.5, tileHeight * 0.2, tileWidth * 0.2, tileHeight * 0.05);
            } else {
                // Default character
                // Body
                graphics.beginFill(color, 0.8);
                graphics.drawRect(tileWidth * 0.35, tileHeight * 0.4, tileWidth * 0.3, tileHeight * 0.5);
                graphics.endFill();

                // Head
                graphics.beginFill(color, 0.9);
                graphics.drawCircle(tileWidth * 0.5, tileHeight * 0.3, tileWidth * 0.15);
                graphics.endFill();

                // Outline
                graphics.lineStyle(1, accentColor, 1);
                graphics.drawRect(tileWidth * 0.35, tileHeight * 0.4, tileWidth * 0.3, tileHeight * 0.5);
                graphics.drawCircle(tileWidth * 0.5, tileHeight * 0.3, tileWidth * 0.15);
            }

            // Add glow effect
            graphics.lineStyle(2, accentColor, 0.5);
            graphics.drawCircle(tileWidth * 0.5, tileHeight * 0.5, tileWidth * 0.4);
        } else if (asset.category === 'infrastructure') {
            // Special handling for infrastructure assets
            if (asset.id.includes('road')) {
                // Road
                // Base
                graphics.beginFill(color, 0.8);
                graphics.drawRect(width * 0.1, height * 0.4, width * 0.8, height * 0.2);
                graphics.endFill();

                // Road markings
                graphics.lineStyle(2, accentColor, 1);
                if (asset.id.includes('straight')) {
                    // Straight road - center line
                    graphics.moveTo(width * 0.1, height * 0.5);
                    graphics.lineTo(width * 0.9, height * 0.5);

                    // Dashed lines
                    graphics.lineStyle(1, accentColor, 0.8);
                    for (let i = 0; i < 5; i++) {
                        const x = width * (0.2 + i * 0.15);
                        graphics.moveTo(x, height * 0.45);
                        graphics.lineTo(x + width * 0.05, height * 0.45);
                        graphics.moveTo(x, height * 0.55);
                        graphics.lineTo(x + width * 0.05, height * 0.55);
                    }
                } else if (asset.id.includes('corner')) {
                    // Corner road
                    graphics.lineStyle(2, accentColor, 1);
                    graphics.moveTo(width * 0.1, height * 0.5);
                    graphics.lineTo(width * 0.5, height * 0.5);
                    graphics.lineTo(width * 0.5, height * 0.9);

                    // Outer edge
                    graphics.lineStyle(1, accentColor, 0.8);
                    graphics.moveTo(width * 0.1, height * 0.4);
                    graphics.lineTo(width * 0.5, height * 0.4);
                    graphics.lineTo(width * 0.6, height * 0.5);
                    graphics.lineTo(width * 0.6, height * 0.9);
                }

                // Outline
                graphics.lineStyle(1, accentColor, 0.5);
                graphics.drawRect(width * 0.1, height * 0.4, width * 0.8, height * 0.2);
            } else if (asset.id.includes('sidewalk')) {
                // Sidewalk
                // Base
                graphics.beginFill(color, 0.8);
                graphics.drawRect(width * 0.1, height * 0.4, width * 0.8, height * 0.2);
                graphics.endFill();

                // Sidewalk pattern
                graphics.lineStyle(1, accentColor, 0.5);
                for (let i = 0; i < 8; i++) {
                    const x = width * (0.1 + i * 0.1);
                    graphics.moveTo(x, height * 0.4);
                    graphics.lineTo(x, height * 0.6);
                }

                // Outline
                graphics.lineStyle(1, accentColor, 0.8);
                graphics.drawRect(width * 0.1, height * 0.4, width * 0.8, height * 0.2);
            } else if (asset.id.includes('streetlight')) {
                // Streetlight
                // Base
                graphics.beginFill(0x333333, 0.8);
                graphics.drawRect(width * 0.45, height * 0.7, width * 0.1, height * 0.2);
                graphics.endFill();

                // Pole
                graphics.beginFill(color, 0.8);
                graphics.drawRect(width * 0.48, height * 0.3, width * 0.04, height * 0.4);
                graphics.endFill();

                // Light fixture
                graphics.beginFill(color, 0.9);
                graphics.drawRect(width * 0.4, height * 0.2, width * 0.2, height * 0.1);
                graphics.endFill();

                // Light glow
                graphics.beginFill(accentColor, 0.7);
                graphics.drawCircle(width * 0.5, height * 0.25, width * 0.1);
                graphics.endFill();

                // Outlines
                graphics.lineStyle(1, accentColor, 1);
                graphics.drawRect(width * 0.45, height * 0.7, width * 0.1, height * 0.2);
                graphics.drawRect(width * 0.48, height * 0.3, width * 0.04, height * 0.4);
                graphics.drawRect(width * 0.4, height * 0.2, width * 0.2, height * 0.1);
                graphics.drawCircle(width * 0.5, height * 0.25, width * 0.1);
            } else {
                // Default infrastructure
                graphics.beginFill(color, 0.7);
                graphics.drawRect(width * 0.2, height * 0.4, width * 0.6, height * 0.2);
                graphics.endFill();

                // Outline
                graphics.lineStyle(2, accentColor, 1);
                graphics.drawRect(width * 0.2, height * 0.4, width * 0.6, height * 0.2);
            }
        } else if (asset.category === 'props') {
            // Special handling for prop assets
            if (asset.id.includes('terminal')) {
                // Terminal
                // Base
                graphics.beginFill(0x333333, 0.8);
                graphics.drawRect(width * 0.35, height * 0.7, width * 0.3, height * 0.1);
                graphics.endFill();

                // Terminal body
                graphics.beginFill(color, 0.8);
                graphics.drawRect(width * 0.35, height * 0.3, width * 0.3, height * 0.4);
                graphics.endFill();

                // Screen
                graphics.beginFill(0x000000, 0.9);
                graphics.drawRect(width * 0.38, height * 0.35, width * 0.24, height * 0.25);
                graphics.endFill();

                // Screen content - text lines
                graphics.lineStyle(1, accentColor, 0.9);
                for (let i = 0; i < 3; i++) {
                    const y = height * (0.4 + i * 0.05);
                    graphics.moveTo(width * 0.4, y);
                    graphics.lineTo(width * 0.6, y);
                }

                // Outlines
                graphics.lineStyle(1, accentColor, 1);
                graphics.drawRect(width * 0.35, height * 0.7, width * 0.3, height * 0.1);
                graphics.drawRect(width * 0.35, height * 0.3, width * 0.3, height * 0.4);
                graphics.drawRect(width * 0.38, height * 0.35, width * 0.24, height * 0.25);
            } else if (asset.id.includes('crate')) {
                // Crate
                // Main box
                graphics.beginFill(color, 0.8);
                graphics.drawRect(width * 0.3, height * 0.3, width * 0.4, height * 0.4);
                graphics.endFill();

                // Crate details - panels
                graphics.lineStyle(1, accentColor, 0.7);
                graphics.moveTo(width * 0.3, height * 0.5);
                graphics.lineTo(width * 0.7, height * 0.5);
                graphics.moveTo(width * 0.5, height * 0.3);
                graphics.lineTo(width * 0.5, height * 0.7);

                // Outlines
                graphics.lineStyle(2, accentColor, 1);
                graphics.drawRect(width * 0.3, height * 0.3, width * 0.4, height * 0.4);
            } else if (asset.id.includes('bench')) {
                // Bench
                // Base/legs
                graphics.beginFill(0x8B4513, 0.9); // Brown legs
                graphics.drawRect(width * 0.3, height * 0.6, width * 0.1, height * 0.2);
                graphics.drawRect(width * 0.6, height * 0.6, width * 0.1, height * 0.2);
                graphics.endFill();

                // Seat
                graphics.beginFill(color, 0.8);
                graphics.drawRect(width * 0.25, height * 0.5, width * 0.5, height * 0.1);
                graphics.endFill();

                // Backrest
                graphics.beginFill(color, 0.7);
                graphics.drawRect(width * 0.25, height * 0.3, width * 0.5, height * 0.2);
                graphics.endFill();

                // Outlines
                graphics.lineStyle(1, accentColor, 1);
                graphics.drawRect(width * 0.3, height * 0.6, width * 0.1, height * 0.2);
                graphics.drawRect(width * 0.6, height * 0.6, width * 0.1, height * 0.2);
                graphics.drawRect(width * 0.25, height * 0.5, width * 0.5, height * 0.1);
                graphics.drawRect(width * 0.25, height * 0.3, width * 0.5, height * 0.2);
            } else {
                // Default prop
                graphics.beginFill(color, 0.7);
                graphics.drawRect(width * 0.3, height * 0.3, width * 0.4, height * 0.4);
                graphics.endFill();

                // Outline
                graphics.lineStyle(2, accentColor, 1);
                graphics.drawRect(width * 0.3, height * 0.3, width * 0.4, height * 0.4);
            }
        } else if (asset.category === 'buildings') {
            // Special handling for building assets
            // Base/ground
            graphics.beginFill(0x333333, 0.5); // Dark gray for ground
            graphics.drawEllipse(width / 2, height * 0.9, width * 0.4, height * 0.1);
            graphics.endFill();

            if (asset.id.includes('house_small')) {
                // Small house
                // Main structure
                graphics.beginFill(color, 0.8);
                graphics.drawRect(width * 0.2, height * 0.3, width * 0.6, height * 0.6);
                graphics.endFill();

                // Roof
                graphics.beginFill(accentColor, 0.7);
                graphics.moveTo(width * 0.1, height * 0.3);
                graphics.lineTo(width * 0.5, height * 0.1);
                graphics.lineTo(width * 0.9, height * 0.3);
                graphics.closePath();
                graphics.endFill();

                // Door
                graphics.beginFill(0x8B4513, 0.9); // Brown door
                graphics.drawRect(width * 0.45, height * 0.6, width * 0.1, height * 0.3);
                graphics.endFill();

                // Window
                graphics.beginFill(0x87CEEB, 0.7); // Sky blue window
                graphics.drawRect(width * 0.3, height * 0.4, width * 0.1, height * 0.1);
                graphics.drawRect(width * 0.6, height * 0.4, width * 0.1, height * 0.1);
                graphics.endFill();

                // Outlines
                graphics.lineStyle(1, accentColor, 1);
                graphics.drawRect(width * 0.2, height * 0.3, width * 0.6, height * 0.6);
                graphics.moveTo(width * 0.1, height * 0.3);
                graphics.lineTo(width * 0.5, height * 0.1);
                graphics.lineTo(width * 0.9, height * 0.3);
                graphics.drawRect(width * 0.45, height * 0.6, width * 0.1, height * 0.3);
                graphics.drawRect(width * 0.3, height * 0.4, width * 0.1, height * 0.1);
                graphics.drawRect(width * 0.6, height * 0.4, width * 0.1, height * 0.1);
            } else if (asset.id.includes('shop')) {
                // Shop building
                // Main structure
                graphics.beginFill(color, 0.8);
                graphics.drawRect(width * 0.2, height * 0.3, width * 0.6, height * 0.6);
                graphics.endFill();

                // Flat roof with sign
                graphics.beginFill(accentColor, 0.7);
                graphics.drawRect(width * 0.15, height * 0.3, width * 0.7, height * 0.1);
                graphics.endFill();

                // Sign
                graphics.beginFill(0xFFD700, 0.9); // Gold sign
                graphics.drawRect(width * 0.3, height * 0.2, width * 0.4, height * 0.1);
                graphics.endFill();

                // Door
                graphics.beginFill(0x8B4513, 0.9); // Brown door
                graphics.drawRect(width * 0.45, height * 0.6, width * 0.1, height * 0.3);
                graphics.endFill();

                // Windows - larger for shop display
                graphics.beginFill(0x87CEEB, 0.7); // Sky blue windows
                graphics.drawRect(width * 0.25, height * 0.4, width * 0.2, height * 0.2);
                graphics.drawRect(width * 0.55, height * 0.4, width * 0.2, height * 0.2);
                graphics.endFill();

                // Outlines
                graphics.lineStyle(1, accentColor, 1);
                graphics.drawRect(width * 0.2, height * 0.3, width * 0.6, height * 0.6);
                graphics.drawRect(width * 0.15, height * 0.3, width * 0.7, height * 0.1);
                graphics.drawRect(width * 0.3, height * 0.2, width * 0.4, height * 0.1);
                graphics.drawRect(width * 0.45, height * 0.6, width * 0.1, height * 0.3);
                graphics.drawRect(width * 0.25, height * 0.4, width * 0.2, height * 0.2);
                graphics.drawRect(width * 0.55, height * 0.4, width * 0.2, height * 0.2);
            } else if (asset.id.includes('office_building')) {
                // Office building - taller
                // Main structure
                graphics.beginFill(color, 0.8);
                graphics.drawRect(width * 0.2, height * 0.2, width * 0.6, height * 0.7);
                graphics.endFill();

                // Flat roof
                graphics.beginFill(accentColor, 0.7);
                graphics.drawRect(width * 0.2, height * 0.2, width * 0.6, height * 0.05);
                graphics.endFill();

                // Door
                graphics.beginFill(0x8B4513, 0.9); // Brown door
                graphics.drawRect(width * 0.45, height * 0.7, width * 0.1, height * 0.2);
                graphics.endFill();

                // Windows - grid pattern
                graphics.beginFill(0x87CEEB, 0.7); // Sky blue windows
                for (let row = 0; row < 4; row++) {
                    for (let col = 0; col < 4; col++) {
                        graphics.drawRect(
                            width * (0.25 + col * 0.15),
                            height * (0.25 + row * 0.1),
                            width * 0.1,
                            height * 0.07
                        );
                    }
                }
                graphics.endFill();

                // Outlines
                graphics.lineStyle(1, accentColor, 1);
                graphics.drawRect(width * 0.2, height * 0.2, width * 0.6, height * 0.7);
                graphics.drawRect(width * 0.2, height * 0.2, width * 0.6, height * 0.05);
                graphics.drawRect(width * 0.45, height * 0.7, width * 0.1, height * 0.2);

                // Window outlines
                for (let row = 0; row < 4; row++) {
                    for (let col = 0; col < 4; col++) {
                        graphics.drawRect(
                            width * (0.25 + col * 0.15),
                            height * (0.25 + row * 0.1),
                            width * 0.1,
                            height * 0.07
                        );
                    }
                }
            } else {
                // Default building
                // Main structure
                graphics.beginFill(color, 0.8);
                graphics.drawRect(width * 0.2, height * 0.3, width * 0.6, height * 0.6);
                graphics.endFill();

                // Roof
                graphics.beginFill(accentColor, 0.7);
                graphics.moveTo(width * 0.1, height * 0.3);
                graphics.lineTo(width * 0.5, height * 0.1);
                graphics.lineTo(width * 0.9, height * 0.3);
                graphics.closePath();
                graphics.endFill();

                // Door
                graphics.beginFill(0x8B4513, 0.9); // Brown door
                graphics.drawRect(width * 0.45, height * 0.6, width * 0.1, height * 0.3);
                graphics.endFill();

                // Window
                graphics.beginFill(0x87CEEB, 0.7); // Sky blue window
                graphics.drawRect(width * 0.3, height * 0.4, width * 0.1, height * 0.1);
                graphics.drawRect(width * 0.6, height * 0.4, width * 0.1, height * 0.1);
                graphics.endFill();

                // Outlines
                graphics.lineStyle(1, accentColor, 1);
                graphics.drawRect(width * 0.2, height * 0.3, width * 0.6, height * 0.6);
                graphics.moveTo(width * 0.1, height * 0.3);
                graphics.lineTo(width * 0.5, height * 0.1);
                graphics.lineTo(width * 0.9, height * 0.3);
                graphics.drawRect(width * 0.45, height * 0.6, width * 0.1, height * 0.3);
                graphics.drawRect(width * 0.3, height * 0.4, width * 0.1, height * 0.1);
                graphics.drawRect(width * 0.6, height * 0.4, width * 0.1, height * 0.1);
            }

            // Add glow effect
            graphics.lineStyle(2, accentColor, 0.5);
            graphics.drawRect(width * 0.15, height * 0.15, width * 0.7, height * 0.7);
        } else if (asset.category === 'environment') {
            // Special handling for environment assets
            if (asset.id.includes('tree')) {
                // Draw a tree
                // Base/ground
                graphics.beginFill(0x8B4513, 0.7); // Brown for ground
                graphics.drawEllipse(tileWidth / 2, tileHeight * 0.8, tileWidth * 0.4, tileHeight * 0.2);
                graphics.endFill();

                // Trunk
                graphics.beginFill(0x8B4513, 0.9); // Brown for trunk
                graphics.drawRect(tileWidth * 0.4, tileHeight * 0.3, tileWidth * 0.2, tileHeight * 0.5);
                graphics.endFill();

                // Foliage
                if (asset.id.includes('pine')) {
                    // Pine tree - triangular shape
                    graphics.beginFill(color, 0.8);
                    // Bottom layer
                    graphics.moveTo(tileWidth * 0.2, tileHeight * 0.5);
                    graphics.lineTo(tileWidth * 0.5, tileHeight * 0.2);
                    graphics.lineTo(tileWidth * 0.8, tileHeight * 0.5);
                    graphics.closePath();
                    // Middle layer
                    graphics.moveTo(tileWidth * 0.25, tileHeight * 0.35);
                    graphics.lineTo(tileWidth * 0.5, tileHeight * 0.1);
                    graphics.lineTo(tileWidth * 0.75, tileHeight * 0.35);
                    graphics.closePath();
                    graphics.endFill();

                    // Outline
                    graphics.lineStyle(1, accentColor, 1);
                    graphics.moveTo(tileWidth * 0.2, tileHeight * 0.5);
                    graphics.lineTo(tileWidth * 0.5, tileHeight * 0.2);
                    graphics.lineTo(tileWidth * 0.8, tileHeight * 0.5);
                    graphics.moveTo(tileWidth * 0.25, tileHeight * 0.35);
                    graphics.lineTo(tileWidth * 0.5, tileHeight * 0.1);
                    graphics.lineTo(tileWidth * 0.75, tileHeight * 0.35);
                } else if (asset.id.includes('oak')) {
                    // Oak tree - rounded canopy
                    graphics.beginFill(color, 0.8);
                    graphics.drawCircle(tileWidth * 0.5, tileHeight * 0.3, tileWidth * 0.35);
                    graphics.endFill();

                    // Outline
                    graphics.lineStyle(1, accentColor, 1);
                    graphics.drawCircle(tileWidth * 0.5, tileHeight * 0.3, tileWidth * 0.35);
                } else {
                    // Generic tree - oval canopy
                    graphics.beginFill(color, 0.8);
                    graphics.drawEllipse(tileWidth * 0.5, tileHeight * 0.3, tileWidth * 0.3, tileHeight * 0.3);
                    graphics.endFill();

                    // Outline
                    graphics.lineStyle(1, accentColor, 1);
                    graphics.drawEllipse(tileWidth * 0.5, tileHeight * 0.3, tileWidth * 0.3, tileHeight * 0.3);
                }
            } else if (asset.id.includes('rock')) {
                // Draw a rock
                if (asset.id.includes('large')) {
                    // Large rock - cluster of rocks
                    graphics.beginFill(color, 0.8);
                    // Main rock
                    graphics.moveTo(tileWidth * 0.2, tileHeight * 0.7);
                    graphics.lineTo(tileWidth * 0.3, tileHeight * 0.3);
                    graphics.lineTo(tileWidth * 0.7, tileHeight * 0.2);
                    graphics.lineTo(tileWidth * 0.8, tileHeight * 0.6);
                    graphics.lineTo(tileWidth * 0.6, tileHeight * 0.8);
                    graphics.closePath();
                    // Smaller rock
                    graphics.drawEllipse(tileWidth * 0.3, tileHeight * 0.5, tileWidth * 0.15, tileHeight * 0.1);
                    graphics.endFill();

                    // Outline
                    graphics.lineStyle(1, accentColor, 1);
                    graphics.moveTo(tileWidth * 0.2, tileHeight * 0.7);
                    graphics.lineTo(tileWidth * 0.3, tileHeight * 0.3);
                    graphics.lineTo(tileWidth * 0.7, tileHeight * 0.2);
                    graphics.lineTo(tileWidth * 0.8, tileHeight * 0.6);
                    graphics.lineTo(tileWidth * 0.6, tileHeight * 0.8);
                    graphics.closePath();
                    graphics.drawEllipse(tileWidth * 0.3, tileHeight * 0.5, tileWidth * 0.15, tileHeight * 0.1);
                } else {
                    // Regular rock
                    graphics.beginFill(color, 0.8);
                    graphics.drawEllipse(tileWidth * 0.5, tileHeight * 0.5, tileWidth * 0.3, tileHeight * 0.2);
                    graphics.endFill();

                    // Outline
                    graphics.lineStyle(1, accentColor, 1);
                    graphics.drawEllipse(tileWidth * 0.5, tileHeight * 0.5, tileWidth * 0.3, tileHeight * 0.2);
                }
            } else if (asset.id.includes('shrub')) {
                // Draw a shrub
                // Base/ground
                graphics.beginFill(0x8B4513, 0.7); // Brown for ground
                graphics.drawEllipse(tileWidth / 2, tileHeight * 0.8, tileWidth * 0.3, tileHeight * 0.1);
                graphics.endFill();

                // Shrub body
                graphics.beginFill(color, 0.8);
                graphics.drawEllipse(tileWidth * 0.5, tileHeight * 0.5, tileWidth * 0.3, tileHeight * 0.3);
                graphics.endFill();

                // Outline
                graphics.lineStyle(1, accentColor, 1);
                graphics.drawEllipse(tileWidth * 0.5, tileHeight * 0.5, tileWidth * 0.3, tileHeight * 0.3);

                // Add some leaf details
                graphics.lineStyle(1, accentColor, 0.5);
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI * 2;
                    const x1 = tileWidth * 0.5 + Math.cos(angle) * tileWidth * 0.15;
                    const y1 = tileHeight * 0.5 + Math.sin(angle) * tileHeight * 0.15;
                    const x2 = tileWidth * 0.5 + Math.cos(angle) * tileWidth * 0.3;
                    const y2 = tileHeight * 0.5 + Math.sin(angle) * tileHeight * 0.3;
                    graphics.moveTo(x1, y1);
                    graphics.lineTo(x2, y2);
                }
            } else {
                // Default environment asset - use standard diamond shape
                graphics.beginFill(color, 0.7);
                graphics.moveTo(tileWidth / 2, 0);
                graphics.lineTo(tileWidth, tileHeight / 2);
                graphics.lineTo(tileWidth / 2, tileHeight);
                graphics.lineTo(0, tileHeight / 2);
                graphics.lineTo(tileWidth / 2, 0);
                graphics.endFill();

                // Add neon outline
                graphics.lineStyle(2, accentColor, 1);
                graphics.moveTo(tileWidth / 2, 0);
                graphics.lineTo(tileWidth, tileHeight / 2);
                graphics.lineTo(tileWidth / 2, tileHeight);
                graphics.lineTo(0, tileHeight / 2);
                graphics.lineTo(tileWidth / 2, 0);
            }
        } else {
            // Standard drawing for other categories
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
        }

        // Add asset name with improved visibility
        const text = new PIXI.Text(asset.name, {
            fontFamily: 'Arial',
            fontSize: 10,
            fontWeight: 'bold',
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 3,
            align: 'center',
            wordWrap: true,
            wordWrapWidth: width - 10
        });
        text.anchor.set(0.5, 1);
        text.position.set(width / 2, height - 5);
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
