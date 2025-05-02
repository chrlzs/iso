import { PIXI } from '../utils/PixiWrapper.js';
import { SynthwaveEffect } from './SynthwaveEffect.js';
import { ModernUrbanEffect } from './ModernUrbanEffect.js';

/**
 * StyleManager - Manages visual styles for the game
 * Allows switching between different visual themes
 */
export class StyleManager {
    /**
     * Creates a new style manager
     * @param {Object} options - Style manager options
     * @param {Game} options.game - The game instance
     */
    constructor(options = {}) {
        this.game = options.game;
        this.app = options.game ? options.game.app : null;
        this.currentStyle = options.defaultStyle || 'cyberpunk';
        this.effects = {};
        this.styleDefinitions = {};

        // Initialize style definitions
        this.initializeStyleDefinitions();

        // Create style effects
        this.createEffects();

        // Apply initial style
        this.applyStyle(this.currentStyle);
    }

    /**
     * Initializes style definitions
     * @private
     */
    initializeStyleDefinitions() {
        // Cyberpunk/Outrun style
        this.styleDefinitions.cyberpunk = {
            name: 'Cyberpunk/Outrun',
            description: 'Neon colors with synthwave aesthetic',
            colors: {
                primary: 0xFF00FF,    // Hot pink
                secondary: 0x00FFFF,   // Cyan
                dark: 0x120024,       // Deep purple-black
                accent: 0xFF6B6B,     // Coral pink
                warning: 0xFFA500,    // Orange
                success: 0x00FF9F,    // Neon turquoise
                error: 0xFF0055,      // Bright red
                text: 0xFFFFFF,       // White
                healthBar: 0xFF355E,  // Hot pink
                energyBar: 0x00FFAA,  // Neon cyan
                expBar: 0xB24BF3      // Purple
            },
            structureColors: {
                // Trees
                tree: {
                    main: 0x9370DB,    // Medium purple
                    accent: 0xFF00FF,   // Magenta
                    dark: 0x483D8B      // Dark slate blue
                },
                tree_pine: {
                    main: 0x9400D3,    // Dark violet
                    accent: 0x00FFFF,   // Cyan
                    dark: 0x4B0082      // Indigo
                },
                tree_oak: {
                    main: 0x8A2BE2,    // Blue violet
                    accent: 0xFF00FF,   // Magenta
                    dark: 0x4B0082      // Indigo
                },

                // Buildings
                house_small: {
                    main: 0x4682B4,    // Steel blue
                    accent: 0x00FFFF,   // Cyan
                    dark: 0x191970      // Midnight blue
                },
                house_medium: {
                    main: 0x4169E1,    // Royal blue
                    accent: 0xFF00FF,   // Magenta
                    dark: 0x000080      // Navy
                },
                shop: {
                    main: 0x6A5ACD,    // Slate blue
                    accent: 0x00FFFF,   // Cyan
                    dark: 0x483D8B      // Dark slate blue
                },
                office_building: {
                    main: 0x0000CD,    // Medium blue
                    accent: 0xFF00FF,   // Magenta
                    dark: 0x00008B      // Dark blue
                },

                // Infrastructure
                road_straight: {
                    main: 0x696969,    // Dim gray
                    accent: 0xFFFF00,   // Yellow
                    dark: 0x2F4F4F,     // Dark slate gray
                    markings: 0xFFFFFF   // White for road markings
                },
                road_corner: {
                    main: 0x696969,    // Dim gray
                    accent: 0xFFFF00,   // Yellow
                    dark: 0x2F4F4F,     // Dark slate gray
                    markings: 0xFFFFFF   // White for road markings
                },
                sidewalk: {
                    main: 0xA9A9A9,    // Dark gray
                    accent: 0xDCDCDC,   // Gainsboro
                    dark: 0x808080,     // Gray
                    pattern: 0xCCCCCC   // Light gray for pattern
                },
                streetlight: {
                    main: 0xC0C0C0,    // Silver
                    accent: 0xFFFF00,   // Yellow
                    dark: 0x808080,     // Gray
                    light: 0xFFFFCC     // Pale yellow for light
                },

                // New infrastructure
                subway_entrance: {
                    main: 0x333333,    // Dark gray
                    accent: 0x00FFFF,   // Cyan
                    dark: 0x222222,     // Very dark gray
                    light: 0xFF00FF     // Magenta for signs
                },
                monorail_support: {
                    main: 0x888888,    // Gray
                    accent: 0x00FFFF,   // Cyan
                    dark: 0x444444,     // Dark gray
                    detail: 0xFFFFFF    // White for details
                },
                landing_pad: {
                    main: 0x444444,    // Dark gray
                    accent: 0x00FFFF,   // Cyan
                    dark: 0x222222,     // Very dark gray
                    lights: 0xFF355E    // Hot pink for landing lights
                },
                power_generator: {
                    main: 0x333333,    // Dark gray
                    accent: 0x00FFFF,   // Cyan
                    dark: 0x222222,     // Very dark gray
                    energy: 0x00FF00    // Green for energy
                },
                data_hub: {
                    main: 0x222222,    // Very dark gray
                    accent: 0x00FFFF,   // Cyan
                    dark: 0x111111,     // Almost black
                    data: 0x0088FF      // Blue for data
                },
                holo_billboard: {
                    main: 0x333333,    // Dark gray
                    accent: 0x00FFFF,   // Cyan
                    dark: 0x222222,     // Very dark gray
                    screen: 0x0088FF    // Blue for screen
                },
                security_camera: {
                    main: 0x444444,    // Dark gray
                    accent: 0xFF0000,   // Red
                    dark: 0x222222,     // Very dark gray
                    lens: 0x00FFFF      // Cyan for lens
                },
                neon_strip: {
                    main: 0x222222,    // Very dark gray
                    accent: 0xFF00FF,   // Magenta
                    dark: 0x111111,     // Almost black
                    light: 0x00FFFF     // Cyan for light
                },

                // Props
                terminal: {
                    main: 0x008080,    // Teal
                    accent: 0x00FFFF,   // Cyan
                    dark: 0x2F4F4F      // Dark slate gray
                },
                crate: {
                    main: 0xCD853F,    // Peru
                    accent: 0xFFD700,   // Gold
                    dark: 0x8B4513      // Saddle brown
                },
                bench: {
                    main: 0xDEB887,    // Burlywood
                    accent: 0x8B4513,   // Saddle brown
                    dark: 0xA0522D      // Sienna
                },

                // Default/generic
                generic: {
                    main: 0xFF00FF,    // Magenta
                    accent: 0x00FFFF,   // Cyan
                    dark: 0x800080      // Dark purple
                }
            },
            characterColors: {
                player: {
                    main: 0x00FFFF,      // Cyan for player
                    accent: 0xFF00FF,     // Magenta accent
                    glow: 0x00FFFF,       // Cyan glow
                    detail: 0xFFFF00      // Yellow details
                },
                enemy: {
                    main: 0xFF355E,      // Hot pink for enemies
                    accent: 0xFF0000,     // Red accent
                    glow: 0xFF355E,       // Hot pink glow
                    detail: 0xFFFF00      // Yellow details
                },
                npc: {
                    main: 0x00FF00,      // Green for NPCs
                    accent: 0xFFFF00,     // Yellow accent
                    glow: 0x00FF00,       // Green glow
                    detail: 0x00FFFF      // Cyan details
                }
            },
            effectType: 'synthwave'
        };

        // Modern Urban/City style
        this.styleDefinitions.modern = {
            name: 'Modern Urban',
            description: 'Clean, modern city aesthetic',
            colors: {
                primary: 0x3498DB,    // Blue
                secondary: 0x2ECC71,   // Green
                dark: 0x2C3E50,       // Dark blue-gray
                accent: 0xE74C3C,     // Red
                warning: 0xF39C12,    // Orange
                success: 0x2ECC71,    // Green
                error: 0xE74C3C,      // Red
                text: 0xFFFFFF,       // White
                healthBar: 0xE74C3C,  // Red
                energyBar: 0x3498DB,  // Blue
                expBar: 0xF39C12      // Orange
            },
            structureColors: {
                // Trees
                tree: {
                    main: 0x27AE60,    // Green
                    accent: 0x2ECC71,   // Light green
                    dark: 0x196F3D      // Dark green
                },
                tree_pine: {
                    main: 0x1E8449,    // Dark green
                    accent: 0x27AE60,   // Green
                    dark: 0x145A32      // Very dark green
                },
                tree_oak: {
                    main: 0x229954,    // Medium green
                    accent: 0x2ECC71,   // Light green
                    dark: 0x196F3D      // Dark green
                },

                // Buildings
                house_small: {
                    main: 0xECF0F1,    // Light gray
                    accent: 0x3498DB,   // Blue
                    dark: 0xBDC3C7      // Medium gray
                },
                house_medium: {
                    main: 0xD5DBDB,    // Light gray
                    accent: 0x3498DB,   // Blue
                    dark: 0xABB2B9      // Medium gray
                },
                shop: {
                    main: 0xF4F6F6,    // Very light gray
                    accent: 0xE74C3C,   // Red
                    dark: 0xD5DBDB      // Light gray
                },
                office_building: {
                    main: 0x7F8C8D,    // Gray
                    accent: 0x3498DB,   // Blue
                    dark: 0x5D6D7E      // Dark gray
                },

                // Infrastructure
                road_straight: {
                    main: 0x34495E,    // Dark blue-gray
                    accent: 0xF1C40F,   // Yellow
                    dark: 0x2C3E50,     // Very dark blue-gray
                    markings: 0xFFFFFF   // White for road markings
                },
                road_corner: {
                    main: 0x34495E,    // Dark blue-gray
                    accent: 0xF1C40F,   // Yellow
                    dark: 0x2C3E50,     // Very dark blue-gray
                    markings: 0xFFFFFF   // White for road markings
                },
                sidewalk: {
                    main: 0xBDC3C7,    // Light gray
                    accent: 0xECF0F1,   // Very light gray
                    dark: 0x95A5A6,     // Medium gray
                    pattern: 0xD5DBDB   // Light gray for pattern
                },
                streetlight: {
                    main: 0x7F8C8D,    // Gray
                    accent: 0xF1C40F,   // Yellow
                    dark: 0x5D6D7E,     // Dark gray
                    light: 0xF9E79F     // Light yellow for light
                },

                // New infrastructure
                subway_entrance: {
                    main: 0x5D6D7E,    // Dark gray
                    accent: 0x3498DB,   // Blue
                    dark: 0x34495E,     // Very dark gray
                    light: 0xE74C3C     // Red for signs
                },
                monorail_support: {
                    main: 0x7F8C8D,    // Gray
                    accent: 0x3498DB,   // Blue
                    dark: 0x5D6D7E,     // Dark gray
                    detail: 0xECF0F1    // Light gray for details
                },
                landing_pad: {
                    main: 0x7F8C8D,    // Gray
                    accent: 0x3498DB,   // Blue
                    dark: 0x5D6D7E,     // Dark gray
                    lights: 0xF1C40F    // Yellow for landing lights
                },
                power_generator: {
                    main: 0x7F8C8D,    // Gray
                    accent: 0x3498DB,   // Blue
                    dark: 0x5D6D7E,     // Dark gray
                    energy: 0x2ECC71    // Green for energy
                },
                data_hub: {
                    main: 0x5D6D7E,    // Dark gray
                    accent: 0x3498DB,   // Blue
                    dark: 0x34495E,     // Very dark gray
                    data: 0x3498DB      // Blue for data
                },
                holo_billboard: {
                    main: 0x7F8C8D,    // Gray
                    accent: 0x3498DB,   // Blue
                    dark: 0x5D6D7E,     // Dark gray
                    screen: 0x3498DB    // Blue for screen
                },
                security_camera: {
                    main: 0x7F8C8D,    // Gray
                    accent: 0xE74C3C,   // Red
                    dark: 0x5D6D7E,     // Dark gray
                    lens: 0x3498DB      // Blue for lens
                },
                neon_strip: {
                    main: 0x5D6D7E,    // Dark gray
                    accent: 0x3498DB,   // Blue
                    dark: 0x34495E,     // Very dark gray
                    light: 0x3498DB     // Blue for light
                },

                // Props
                terminal: {
                    main: 0x2C3E50,    // Dark blue-gray
                    accent: 0x3498DB,   // Blue
                    dark: 0x1B2631      // Very dark blue-gray
                },
                crate: {
                    main: 0xD35400,    // Dark orange
                    accent: 0xF39C12,   // Orange
                    dark: 0xA04000      // Very dark orange
                },
                bench: {
                    main: 0x935116,    // Brown
                    accent: 0xD35400,   // Dark orange
                    dark: 0x6E2C00      // Dark brown
                },

                // Default/generic
                generic: {
                    main: 0x3498DB,    // Blue
                    accent: 0x2ECC71,   // Green
                    dark: 0x2C3E50      // Dark blue-gray
                }
            },
            characterColors: {
                player: {
                    main: 0x3498DB,      // Blue for player
                    accent: 0x2ECC71,     // Green accent
                    glow: 0x3498DB,       // Blue glow
                    detail: 0xF1C40F      // Yellow details
                },
                enemy: {
                    main: 0xE74C3C,      // Red for enemies
                    accent: 0xC0392B,     // Dark red accent
                    glow: 0xE74C3C,       // Red glow
                    detail: 0xF1C40F      // Yellow details
                },
                npc: {
                    main: 0x2ECC71,      // Green for NPCs
                    accent: 0xF1C40F,     // Yellow accent
                    glow: 0x2ECC71,       // Green glow
                    detail: 0x3498DB      // Blue details
                }
            },
            effectType: 'modern'
        };
    }

    /**
     * Creates visual effects for each style
     * @private
     */
    createEffects() {
        if (!this.app) return;

        // Create synthwave effect
        this.effects.synthwave = new SynthwaveEffect({
            app: this.app,
            width: this.app.screen.width,
            height: this.app.screen.height,
            enabled: false,
            quality: this.game ? this.game.options.quality : 'medium',
            showGrid: false,
            showScanLines: true,
            showVignette: true
        });

        // Create modern urban effect
        this.effects.modern = new ModernUrbanEffect({
            app: this.app,
            width: this.app.screen.width,
            height: this.app.screen.height,
            enabled: false,
            quality: this.game ? this.game.options.quality : 'medium'
        });

        // Add effects to stage
        if (this.app.stage) {
            this.app.stage.addChild(this.effects.synthwave.container);
            this.app.stage.addChild(this.effects.modern.container);

            // Set zIndex for effects
            this.effects.synthwave.container.zIndex = 500;
            this.effects.modern.container.zIndex = 500;
        }
    }

    /**
     * Gets the current style definition
     * @returns {Object} The current style definition
     */
    getCurrentStyle() {
        return this.styleDefinitions[this.currentStyle];
    }

    /**
     * Gets all available style definitions
     * @returns {Object} All style definitions
     */
    getAllStyles() {
        return this.styleDefinitions;
    }

    /**
     * Gets a list of available style names
     * @returns {Array} List of style names
     */
    getStyleList() {
        console.log('StyleManager.getStyleList called');
        console.log('Available style definitions:', Object.keys(this.styleDefinitions));

        const styles = Object.keys(this.styleDefinitions).map(key => ({
            id: key,
            name: this.styleDefinitions[key].name,
            description: this.styleDefinitions[key].description
        }));

        console.log('Returning styles:', styles);
        return styles;
    }

    /**
     * Applies a style to the game
     * @param {string} styleId - The ID of the style to apply
     */
    applyStyle(styleId) {
        console.log(`StyleManager.applyStyle called with styleId: ${styleId}`);

        if (!this.styleDefinitions[styleId]) {
            console.error(`Style '${styleId}' not found`);
            return;
        }

        console.log(`Style '${styleId}' found in definitions`);

        // Update current style
        const oldStyle = this.currentStyle;
        this.currentStyle = styleId;
        const style = this.styleDefinitions[styleId];

        console.log(`Style changed from '${oldStyle}' to '${this.currentStyle}'`);

        // Disable all effects
        console.log('Disabling all visual effects');
        Object.values(this.effects).forEach(effect => {
            effect.setEnabled(false);
        });

        // Enable the effect for the current style
        if (style.effectType && this.effects[style.effectType]) {
            console.log(`Enabling effect for style: ${style.effectType}`);
            this.effects[style.effectType].setEnabled(true);
        } else {
            console.log(`No effect found for style type: ${style.effectType || 'undefined'}`);
        }

        // Notify game components about style change
        if (this.game) {
            console.log('Notifying game components about style change');

            // Update UI colors
            if (this.game.ui) {
                console.log('Updating UI colors');
                this.game.ui.updateColors(style.colors);
            } else {
                console.log('No UI found to update colors');
            }

            // Trigger a global style change event if it exists
            if (typeof this.game.onStyleChange === 'function') {
                console.log('Calling game.onStyleChange');
                this.game.onStyleChange(styleId, style);
            } else {
                console.log(`Style changed to: ${style.name}`);

                // Update all entities if world exists
                if (this.game.world) {
                    console.log('Updating all entities in the world');
                    this.game.world.updateAllEntities();
                } else {
                    console.log('No world found to update entities');
                }
            }
        } else {
            console.log('No game reference found to notify about style change');
        }

        console.log(`Applied style: ${style.name} (${styleId})`);
    }

    /**
     * Gets colors for the current style
     * @returns {Object} Color definitions
     */
    getColors() {
        return this.getCurrentStyle().colors;
    }

    /**
     * Gets structure colors for the current style
     * @param {string} structureType - The type of structure
     * @returns {Object} Structure color definitions
     */
    getStructureColors(structureType) {
        const structureColors = this.getCurrentStyle().structureColors;
        return structureColors[structureType] || structureColors.generic;
    }

    /**
     * Gets character colors for the current style
     * @param {string} characterType - The type of character (player, enemy, npc)
     * @returns {Object} Character color definitions
     */
    getCharacterColors(characterType) {
        const characterColors = this.getCurrentStyle().characterColors;
        return characterColors[characterType] || characterColors.player;
    }

    /**
     * Resizes the effects
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        Object.values(this.effects).forEach(effect => {
            effect.resize(width, height);
        });
    }
}
