import { Entity } from './Entity.js';
import { PIXI } from '../utils/PixiWrapper.js';

/**
 * Structure - Represents a static structure in the game world
 * Such as buildings, trees, rocks, etc.
 */
export class Structure extends Entity {
    /**
     * Creates a new structure
     * @param {Object} options - Structure options
     */
    constructor(options = {}) {
        super(options);

        // Structure properties
        this.structureType = options.structureType || 'generic';
        this.solid = options.solid !== undefined ? options.solid : true;
        this.walkable = options.walkable !== undefined ? options.walkable : false;
        this.enterable = options.enterable !== undefined ? options.enterable : false;
        this.destructible = options.destructible !== undefined ? options.destructible : false;
        this.health = options.health || 100;
        this.maxHealth = options.maxHealth || this.health;

        // Debug logging
        console.log(`Structure created with type: ${this.structureType}, typeof: ${typeof this.structureType}`);

        // Grid properties
        this.gridX = options.gridX || 0;
        this.gridY = options.gridY || 0;
        this.gridWidth = options.gridWidth || 1;
        this.gridHeight = options.gridHeight || 1;

        // Occupied tiles
        this.occupiedTiles = [];

        // Create sprite
        this.createSprite(options);

        // Add interaction capabilities if requested
        if (options.interactive) {
            this.createInteractionArea();
        }
    }

    /**
     * Creates the structure sprite
     * @param {Object} options - Sprite options (unused in this implementation)
     * @private
     */
    createSprite() {
        // Create a new graphics object
        const graphics = new PIXI.Graphics();

        // Debug logging
        console.log(`Creating sprite for structure type: ${this.structureType}`);

        // Synthwave color palette
        const colors = {
            // Tree types
            tree: {
                main: 0x00FF00,    // Neon green
                accent: 0xFF00FF,   // Magenta
                dark: 0x004400,     // Dark green
                trunk: 0xFF6B6B     // Coral pink
            },
            tree_pine: {
                main: 0x00DD00,    // Darker green
                accent: 0xFF00FF,   // Magenta
                dark: 0x003300,     // Very dark green
                trunk: 0x8B4513     // Brown trunk
            },
            tree_oak: {
                main: 0x228B22,    // Forest green
                accent: 0x00FFFF,   // Cyan
                dark: 0x006400,     // Dark green
                trunk: 0x8B5A2B     // Saddle brown trunk
            },

            // Rock types
            rock: {
                main: 0xAAAAAA,    // Silver
                accent: 0x00FFFF,   // Cyan
                dark: 0x444444      // Dark gray
            },
            rock_large: {
                main: 0x808080,    // Gray
                accent: 0x00FFFF,   // Cyan
                dark: 0x696969      // Dim gray
            },

            // Shrub types
            shrub_small: {
                main: 0x32CD32,    // Lime green
                accent: 0xFF00FF,   // Magenta
                dark: 0x228B22,     // Forest green
                trunk: 0x8B4513     // Brown
            },

            // Building types
            house: {
                main: 0x00FFFF,    // Cyan
                accent: 0xFF00FF,   // Magenta
                dark: 0x000080,     // Dark blue
                roof: 0xFF355E      // Hot pink
            },
            house_small: {
                main: 0x1E90FF,    // Dodger blue
                accent: 0xFF00FF,   // Magenta
                dark: 0x000080,     // Dark blue
                roof: 0xFF1493      // Deep pink
            },
            shop: {
                main: 0x00CED1,    // Dark turquoise
                accent: 0xFFD700,   // Gold
                dark: 0x008B8B,     // Dark cyan
                roof: 0xFFD700      // Gold
            },
            office_building: {
                main: 0x4682B4,    // Steel blue
                accent: 0x00FFFF,   // Cyan
                dark: 0x4169E1,     // Royal blue
                roof: 0x00BFFF      // Deep sky blue
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
        };

        // Get colors for structure type
        const structureColors = colors[this.structureType] || colors.generic;

        // Common glow effect for all structures
        const glowSize = 8;
        [0.1, 0.2, 0.3].forEach(glowAlpha => {
            graphics.lineStyle(glowSize * (1 + glowAlpha), structureColors.accent, glowAlpha);

            // Tree types
            if (this.structureType === 'tree' || this.structureType === 'tree_pine' || this.structureType === 'tree_oak') {
                graphics.drawCircle(0, -40, 30);
            }
            // Shrub types
            else if (this.structureType === 'shrub_small') {
                graphics.drawCircle(0, -20, 20);
            }
            // Rock types
            else if (this.structureType === 'rock' || this.structureType === 'rock_large') {
                graphics.drawEllipse(0, 0, 30, 20);
            }
            // Building types
            else if ((this.structureType && typeof this.structureType === 'string' && this.structureType.includes('house')) ||
                     (this.structureType && this.structureType === 'shop') ||
                     (this.structureType && this.structureType === 'office_building')) {
                graphics.drawRect(-30, -60, 60, 60);
            }
            // Infrastructure types - Roads and Sidewalks
            else if ((this.structureType && typeof this.structureType === 'string' && this.structureType.includes('road')) ||
                     (this.structureType && this.structureType === 'sidewalk')) {
                graphics.drawRect(-25, -10, 50, 20);
                console.log(`Drawing infrastructure glow for: ${this.structureType}`);
            }
            // Streetlight
            else if (this.structureType && this.structureType === 'streetlight') {
                graphics.drawRect(-5, -50, 10, 50);
                console.log(`Drawing streetlight glow for: ${this.structureType}`);
            }
            // Subway Entrance
            else if (this.structureType && this.structureType === 'subway_entrance') {
                graphics.drawRect(-20, -30, 40, 30);
            }
            // Monorail Support
            else if (this.structureType && this.structureType === 'monorail_support') {
                graphics.drawRect(-10, -80, 20, 80);
            }
            // Landing Pad
            else if (this.structureType && this.structureType === 'landing_pad') {
                graphics.drawCircle(0, 0, 35);
            }
            // Power Generator
            else if (this.structureType && this.structureType === 'power_generator') {
                graphics.drawRect(-15, -35, 30, 35);
            }
            // Data Hub
            else if (this.structureType && this.structureType === 'data_hub') {
                graphics.drawRect(-12, -40, 24, 40);
            }
            // Holographic Billboard
            else if (this.structureType && this.structureType === 'holo_billboard') {
                graphics.drawRect(-25, -70, 50, 70);
            }
            // Security Camera
            else if (this.structureType && this.structureType === 'security_camera') {
                graphics.drawRect(-8, -25, 16, 25);
            }
            // Neon Strip
            else if (this.structureType && this.structureType === 'neon_strip') {
                graphics.drawRect(-25, -8, 50, 8);
            }
            // Prop types
            else if (this.structureType === 'terminal') {
                graphics.drawRect(-15, -30, 30, 30);
            }
            else if (this.structureType === 'crate') {
                graphics.drawRect(-20, -20, 40, 40);
            }
            else if (this.structureType === 'bench') {
                graphics.drawRect(-25, -10, 50, 20);
            }
            // Default for any other types
            else {
                graphics.drawRect(-30, -60, 60, 60);
            }
        });

        // Draw based on structure type with synthwave aesthetic
        if (this.structureType && this.structureType === 'tree') {
            // Draw a more detailed tree with vector-based design

            // Trunk with more detail
            graphics.beginFill(structureColors.trunk, 0.8);
            // Wider at the bottom, narrower at the top
            graphics.moveTo(-15, 0);
            graphics.lineTo(-10, -30);
            graphics.lineTo(10, -30);
            graphics.lineTo(15, 0);
            graphics.closePath();
            graphics.endFill();

            // Trunk outline
            graphics.lineStyle(2, structureColors.accent, 1);
            graphics.moveTo(-15, 0);
            graphics.lineTo(-10, -30);
            graphics.lineTo(10, -30);
            graphics.lineTo(15, 0);
            graphics.closePath();

            // Add trunk texture details
            graphics.lineStyle(1, structureColors.accent, 0.5);
            // Vertical lines for bark texture
            for (let x = -12; x <= 12; x += 6) {
                graphics.moveTo(x, 0);
                graphics.lineTo(x * 0.7, -30); // Narrower at top
            }

            // Horizontal lines for tree rings
            for (let y = -5; y >= -25; y -= 8) {
                const width = Math.abs(y) / 30 * 15; // Narrower as we go up
                graphics.moveTo(-width, y);
                graphics.lineTo(width, y);
            }

            // Foliage with more detailed shape - layered design
            // Bottom layer (largest)
            graphics.beginFill(structureColors.main, 0.7);
            graphics.drawEllipse(0, -45, 35, 25);
            graphics.endFill();

            // Middle layer
            graphics.beginFill(structureColors.main, 0.8);
            graphics.drawEllipse(0, -60, 25, 20);
            graphics.endFill();

            // Top layer (smallest)
            graphics.beginFill(structureColors.main, 0.9);
            graphics.drawEllipse(0, -75, 15, 15);
            graphics.endFill();

            // Foliage outlines
            graphics.lineStyle(2, structureColors.accent, 1);
            graphics.drawEllipse(0, -45, 35, 25); // Bottom
            graphics.drawEllipse(0, -60, 25, 20); // Middle
            graphics.drawEllipse(0, -75, 15, 15); // Top

            // Add leaf details
            graphics.lineStyle(1, structureColors.accent, 0.6);
            // Pattern of curved lines to suggest leaves
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
                const x1 = Math.cos(angle) * 20;
                const y1 = Math.sin(angle) * 15 - 45;
                const x2 = Math.cos(angle) * 30;
                const y2 = Math.sin(angle) * 22 - 45;

                graphics.moveTo(x1, y1);
                graphics.lineTo(x2, y2);
            }

            // Add animated glow/pulse effect
            const time = performance.now() / 1000;
            const pulseScale = 0.7 + Math.sin(time * 2) * 0.3;
            graphics.lineStyle(2, structureColors.accent, 0.8 * pulseScale);

            // Animated outline around the entire tree
            graphics.drawEllipse(0, -45, 38 * pulseScale, 28 * pulseScale);

            // Animated energy lines emanating from the tree
            graphics.lineStyle(1, structureColors.accent, 0.5 * pulseScale);
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
                const len = 10 * pulseScale;
                const x1 = Math.cos(angle) * 35;
                const y1 = Math.sin(angle) * 25 - 45;
                const x2 = Math.cos(angle) * (35 + len);
                const y2 = Math.sin(angle) * (25 + len * 0.7) - 45;

                graphics.moveTo(x1, y1);
                graphics.lineTo(x2, y2);
            }

        } else if (this.structureType && this.structureType === 'tree_pine') {
            // Draw a pine tree with triangular foliage

            // Trunk
            graphics.beginFill(structureColors.trunk, 0.8);
            graphics.drawRect(-8, -10, 16, 40);
            graphics.endFill();

            // Trunk outline
            graphics.lineStyle(2, structureColors.accent, 1);
            graphics.drawRect(-8, -10, 16, 40);

            // Add trunk texture
            graphics.lineStyle(1, structureColors.accent, 0.5);
            for (let y = -5; y <= 25; y += 10) {
                graphics.moveTo(-8, y);
                graphics.lineTo(8, y);
            }

            // Pine tree foliage - triangular layers
            // Bottom layer
            graphics.beginFill(structureColors.main, 0.7);
            graphics.moveTo(-30, -10);
            graphics.lineTo(0, -40);
            graphics.lineTo(30, -10);
            graphics.closePath();
            graphics.endFill();

            // Middle layer
            graphics.beginFill(structureColors.main, 0.8);
            graphics.moveTo(-25, -30);
            graphics.lineTo(0, -60);
            graphics.lineTo(25, -30);
            graphics.closePath();
            graphics.endFill();

            // Top layer
            graphics.beginFill(structureColors.main, 0.9);
            graphics.moveTo(-15, -50);
            graphics.lineTo(0, -80);
            graphics.lineTo(15, -50);
            graphics.closePath();
            graphics.endFill();

            // Foliage outlines
            graphics.lineStyle(2, structureColors.accent, 1);
            // Bottom layer
            graphics.moveTo(-30, -10);
            graphics.lineTo(0, -40);
            graphics.lineTo(30, -10);
            graphics.closePath();
            // Middle layer
            graphics.moveTo(-25, -30);
            graphics.lineTo(0, -60);
            graphics.lineTo(25, -30);
            graphics.closePath();
            // Top layer
            graphics.moveTo(-15, -50);
            graphics.lineTo(0, -80);
            graphics.lineTo(15, -50);
            graphics.closePath();

            // Add animated glow/pulse effect
            const time = performance.now() / 1000;
            const pulseScale = 0.7 + Math.sin(time * 2) * 0.3;

            // Animated outline
            graphics.lineStyle(2, structureColors.accent, 0.8 * pulseScale);
            graphics.moveTo(-32 * pulseScale, -10);
            graphics.lineTo(0, -40 - 5 * pulseScale);
            graphics.lineTo(32 * pulseScale, -10);

        } else if (this.structureType && this.structureType === 'tree_oak') {
            // Draw an oak tree with a wide, rounded canopy

            // Trunk - thicker and shorter than pine
            graphics.beginFill(structureColors.trunk, 0.8);
            graphics.drawRect(-12, -5, 24, 35);
            graphics.endFill();

            // Trunk outline
            graphics.lineStyle(2, structureColors.accent, 1);
            graphics.drawRect(-12, -5, 24, 35);

            // Add trunk texture - bark pattern
            graphics.lineStyle(1, structureColors.accent, 0.5);
            for (let y = 0; y <= 25; y += 8) {
                graphics.moveTo(-12, y);
                graphics.lineTo(12, y);
            }

            // Oak tree foliage - wide, rounded canopy
            // Main canopy
            graphics.beginFill(structureColors.main, 0.7);
            graphics.drawCircle(0, -40, 40);
            graphics.endFill();

            // Canopy outline
            graphics.lineStyle(2, structureColors.accent, 1);
            graphics.drawCircle(0, -40, 40);

            // Add leaf details
            graphics.lineStyle(1, structureColors.accent, 0.6);
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
                const x1 = Math.cos(angle) * 20;
                const y1 = Math.sin(angle) * 20 - 40;
                const x2 = Math.cos(angle) * 40;
                const y2 = Math.sin(angle) * 40 - 40;

                graphics.moveTo(x1, y1);
                graphics.lineTo(x2, y2);
            }

            // Add some branch details
            graphics.lineStyle(3, structureColors.trunk, 0.8);
            // Left branch
            graphics.moveTo(-5, -10);
            graphics.lineTo(-25, -30);
            // Right branch
            graphics.moveTo(5, -10);
            graphics.lineTo(25, -30);

            // Add animated glow/pulse effect
            const time = performance.now() / 1000;
            const pulseScale = 0.7 + Math.sin(time * 2) * 0.3;

            // Animated outline
            graphics.lineStyle(2, structureColors.accent, 0.8 * pulseScale);
            graphics.drawCircle(0, -40, 42 * pulseScale);

        } else if (this.structureType && this.structureType === 'shrub_small') {
            // Draw a small shrub

            // Base/trunk
            graphics.beginFill(structureColors.trunk, 0.8);
            graphics.drawRect(-5, -5, 10, 5);
            graphics.endFill();

            // Trunk outline
            graphics.lineStyle(1, structureColors.accent, 1);
            graphics.drawRect(-5, -5, 10, 5);

            // Foliage - rounded bush shape
            graphics.beginFill(structureColors.main, 0.7);
            graphics.drawCircle(0, -15, 15);
            graphics.endFill();

            // Foliage outline
            graphics.lineStyle(2, structureColors.accent, 1);
            graphics.drawCircle(0, -15, 15);

            // Add leaf details
            graphics.lineStyle(1, structureColors.accent, 0.6);
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
                const x1 = Math.cos(angle) * 8;
                const y1 = Math.sin(angle) * 8 - 15;
                const x2 = Math.cos(angle) * 15;
                const y2 = Math.sin(angle) * 15 - 15;

                graphics.moveTo(x1, y1);
                graphics.lineTo(x2, y2);
            }

            // Add animated glow/pulse effect
            const time = performance.now() / 1000;
            const pulseScale = 0.7 + Math.sin(time * 2) * 0.3;

            // Animated outline
            graphics.lineStyle(1, structureColors.accent, 0.8 * pulseScale);
            graphics.drawCircle(0, -15, 17 * pulseScale);

        } else if ((this.structureType && this.structureType === 'rock') || (this.structureType && this.structureType === 'rock_large')) {
            // Draw a more detailed rock formation with vector-based design

            // Create a cluster of rocks instead of a single ellipse
            // Main large rock
            graphics.beginFill(structureColors.dark, 0.8);
            graphics.moveTo(-25, 5);
            graphics.lineTo(-20, -15);
            graphics.lineTo(-5, -20);
            graphics.lineTo(15, -10);
            graphics.lineTo(25, 0);
            graphics.lineTo(20, 10);
            graphics.lineTo(0, 15);
            graphics.closePath();
            graphics.endFill();

            // Rock outline
            graphics.lineStyle(2, structureColors.main, 1);
            graphics.moveTo(-25, 5);
            graphics.lineTo(-20, -15);
            graphics.lineTo(-5, -20);
            graphics.lineTo(15, -10);
            graphics.lineTo(25, 0);
            graphics.lineTo(20, 10);
            graphics.lineTo(0, 15);
            graphics.closePath();

            // Secondary smaller rock
            graphics.beginFill(structureColors.dark, 0.9);
            graphics.moveTo(-15, -10);
            graphics.lineTo(-10, -25);
            graphics.lineTo(5, -20);
            graphics.lineTo(0, -10);
            graphics.closePath();
            graphics.endFill();

            // Secondary rock outline
            graphics.lineStyle(2, structureColors.main, 1);
            graphics.moveTo(-15, -10);
            graphics.lineTo(-10, -25);
            graphics.lineTo(5, -20);
            graphics.lineTo(0, -10);
            graphics.closePath();

            // Third small rock
            graphics.beginFill(structureColors.dark, 0.85);
            graphics.moveTo(15, -5);
            graphics.lineTo(25, -15);
            graphics.lineTo(30, -5);
            graphics.lineTo(25, 5);
            graphics.closePath();
            graphics.endFill();

            // Third rock outline
            graphics.lineStyle(2, structureColors.main, 1);
            graphics.moveTo(15, -5);
            graphics.lineTo(25, -15);
            graphics.lineTo(30, -5);
            graphics.lineTo(25, 5);
            graphics.closePath();

            // Add texture details to rocks - cracks and highlights
            graphics.lineStyle(1, structureColors.accent, 0.7);

            // Cracks in main rock
            graphics.moveTo(-15, 5);
            graphics.lineTo(-5, -10);
            graphics.lineTo(5, -5);

            graphics.moveTo(5, -10);
            graphics.lineTo(15, 0);
            graphics.lineTo(10, 10);

            // Cracks in secondary rock
            graphics.moveTo(-10, -15);
            graphics.lineTo(-5, -20);

            // Edge highlights
            graphics.lineStyle(1, structureColors.main, 0.9);
            graphics.moveTo(-5, -20);
            graphics.lineTo(15, -10);
            graphics.lineTo(25, 0);

            graphics.moveTo(-10, -25);
            graphics.lineTo(5, -20);

            graphics.moveTo(25, -15);
            graphics.lineTo(30, -5);

            // Add animated energy/glow effect
            const time = performance.now() / 1000;
            const pulseScale = 0.7 + Math.sin(time * 2) * 0.3;

            // Pulsing outline
            graphics.lineStyle(2, structureColors.accent, 0.6 * pulseScale);
            graphics.drawEllipse(0, -5, 35 * pulseScale, 25 * pulseScale);

            // Energy points at vertices
            graphics.lineStyle(1, structureColors.accent, 0.8 * pulseScale);
            const energyPoints = [
                {x: -25, y: 5}, {x: -20, y: -15}, {x: -5, y: -20},
                {x: 15, y: -10}, {x: 25, y: 0}, {x: 20, y: 10},
                {x: -10, y: -25}, {x: 5, y: -20}, {x: 25, y: -15}, {x: 30, y: -5}
            ];

            // Draw small glowing dots at each vertex
            energyPoints.forEach(point => {
                graphics.beginFill(structureColors.accent, 0.7 * pulseScale);
                graphics.drawCircle(point.x, point.y, 2 * pulseScale);
                graphics.endFill();
            });

        } else if (this.structureType && typeof this.structureType === 'string' && this.structureType.includes('road')) {
            // Debug logging
            console.log(`Drawing road structure: ${this.structureType}`);

            // Road structure

            // Base road surface
            graphics.beginFill(0x696969, 0.8); // Dark gray for road
            graphics.drawRect(-40, -5, 80, 10);
            graphics.endFill();

            // Road markings
            graphics.lineStyle(2, 0xFFFF00, 0.8); // Yellow road markings

            if (this.structureType.includes('straight')) {
                // Center line for straight road
                graphics.moveTo(-40, 0);
                graphics.lineTo(40, 0);

                // Dashed side lines
                graphics.lineStyle(1, 0xFFFFFF, 0.6); // White side markings
                for (let i = -35; i <= 35; i += 10) {
                    // Top side
                    graphics.moveTo(i, -4);
                    graphics.lineTo(i + 5, -4);

                    // Bottom side
                    graphics.moveTo(i, 4);
                    graphics.lineTo(i + 5, 4);
                }
            } else if (this.structureType.includes('corner')) {
                // Curved line for corner road
                graphics.moveTo(-40, 0);
                graphics.lineTo(0, 0);
                graphics.lineTo(0, 40);

                // Outer curve
                graphics.lineStyle(1, 0xFFFFFF, 0.6); // White outer marking
                graphics.moveTo(-40, -4);
                graphics.lineTo(-4, -4);
                graphics.arc(-4, -4, 8, -Math.PI/2, 0);
                graphics.lineTo(4, 40);

                // Inner curve
                graphics.moveTo(-40, 4);
                graphics.lineTo(4, 4);
                graphics.arc(4, 4, 8, Math.PI, Math.PI/2, true);
                graphics.lineTo(-4, 40);
            }

            // Add some texture/detail to the road surface
            graphics.lineStyle(1, 0x555555, 0.3);
            for (let i = -35; i <= 35; i += 15) {
                graphics.moveTo(i, -5);
                graphics.lineTo(i + 5, 5);
            }

            // Add animated pulse effect for neon-style road markings
            const time = performance.now() / 1000;
            const pulseScale = 0.7 + Math.sin(time * 2) * 0.3;
            graphics.lineStyle(1, 0xFFFF00, 0.5 * pulseScale);
            if (this.structureType.includes('straight')) {
                graphics.moveTo(-40, 0);
                graphics.lineTo(40, 0);
            } else if (this.structureType.includes('corner')) {
                graphics.moveTo(-40, 0);
                graphics.lineTo(0, 0);
                graphics.lineTo(0, 40);
            }

        } else if (this.structureType && this.structureType === 'sidewalk') {
            // Debug logging
            console.log(`Drawing sidewalk structure: ${this.structureType}`);

            // Sidewalk structure

            // Base sidewalk surface
            graphics.beginFill(0xA9A9A9, 0.8); // Gray for sidewalk
            graphics.drawRect(-40, -5, 80, 10);
            graphics.endFill();

            // Sidewalk pattern - grid lines
            graphics.lineStyle(1, 0xCCCCCC, 0.6);

            // Vertical lines
            for (let i = -35; i <= 35; i += 10) {
                graphics.moveTo(i, -5);
                graphics.lineTo(i, 5);
            }

            // Horizontal lines
            graphics.moveTo(-40, 0);
            graphics.lineTo(40, 0);

            // Edge highlight
            graphics.lineStyle(1, 0xDCDCDC, 0.8);
            graphics.drawRect(-40, -5, 80, 10);

            // Add some texture/detail
            graphics.lineStyle(1, 0x888888, 0.3);
            for (let i = -35; i <= 35; i += 15) {
                for (let j = -4; j <= 4; j += 4) {
                    graphics.drawCircle(i, j, 1);
                }
            }

        } else if (this.structureType && this.structureType === 'streetlight') {
            // Debug logging
            console.log(`Drawing streetlight structure: ${this.structureType}`);

            // Streetlight structure

            // Base
            graphics.beginFill(0x333333, 0.9);
            graphics.drawRect(-10, -5, 20, 5);
            graphics.endFill();

            // Pole
            graphics.beginFill(0xC0C0C0, 0.8);
            graphics.drawRect(-2, -50, 4, 45);
            graphics.endFill();

            // Light fixture
            graphics.beginFill(0x888888, 0.9);
            graphics.drawRect(-10, -55, 20, 5);
            graphics.endFill();

            // Light glow
            const time = performance.now() / 1000;
            const pulseScale = 0.7 + Math.sin(time * 2) * 0.3;

            graphics.beginFill(0xFFFF00, 0.3 * pulseScale);
            graphics.drawCircle(0, -60, 15 * pulseScale);
            graphics.endFill();

            // Light beam
            graphics.beginFill(0xFFFF00, 0.1 * pulseScale);
            graphics.moveTo(-10, -55);
            graphics.lineTo(-20, -5);
            graphics.lineTo(20, -5);
            graphics.lineTo(10, -55);
            graphics.closePath();
            graphics.endFill();

            // Outlines
            graphics.lineStyle(1, 0xFFFF00, 0.8);
            graphics.drawRect(-10, -55, 20, 5);
            graphics.lineStyle(1, 0xCCCCCC, 0.8);
            graphics.drawRect(-2, -50, 4, 45);
            graphics.drawRect(-10, -5, 20, 5);

        } else if (this.structureType && this.structureType === 'subway_entrance') {
            // Debug logging
            console.log(`Drawing subway entrance: ${this.structureType}`);

            // Subway entrance structure

            // Base/ground
            graphics.beginFill(structureColors.dark, 0.9);
            graphics.drawRect(-25, -5, 50, 5);
            graphics.endFill();

            // Stairway down (3D effect)
            graphics.beginFill(structureColors.dark, 0.8);
            graphics.drawRect(-20, -25, 40, 20);
            graphics.endFill();

            // Stair steps
            graphics.lineStyle(1, structureColors.accent, 0.7);
            for (let y = -5; y >= -25; y -= 5) {
                graphics.moveTo(-20, y);
                graphics.lineTo(20, y);
            }

            // Side railings
            graphics.lineStyle(2, structureColors.main, 0.9);
            // Left railing
            graphics.moveTo(-20, -5);
            graphics.lineTo(-20, -25);
            // Right railing
            graphics.moveTo(20, -5);
            graphics.lineTo(20, -25);

            // Entrance sign
            graphics.beginFill(structureColors.dark, 0.9);
            graphics.drawRect(-15, -40, 30, 15);
            graphics.endFill();

            // Sign text (simplified as lines)
            graphics.lineStyle(2, structureColors.light, 0.9);
            // "SUBWAY" text simplified as horizontal lines
            graphics.moveTo(-10, -35);
            graphics.lineTo(10, -35);
            graphics.moveTo(-10, -30);
            graphics.lineTo(10, -30);

            // Animated elements
            const time = performance.now() / 1000;
            const pulseScale = 0.7 + Math.sin(time * 2) * 0.3;

            // Pulsing sign outline
            graphics.lineStyle(1, structureColors.accent, 0.8 * pulseScale);
            graphics.drawRect(-15, -40, 30, 15);

            // Animated arrow pointing down
            graphics.lineStyle(2, structureColors.accent, 0.9 * pulseScale);
            graphics.moveTo(0, -15 - 5 * pulseScale);
            graphics.lineTo(0, -5);
            graphics.moveTo(-5, -10 - 5 * pulseScale);
            graphics.lineTo(0, -5);
            graphics.moveTo(5, -10 - 5 * pulseScale);
            graphics.lineTo(0, -5);

        } else if (this.structureType && this.structureType === 'monorail_support') {
            // Debug logging
            console.log(`Drawing monorail support: ${this.structureType}`);

            // Monorail support structure

            // Base/ground
            graphics.beginFill(structureColors.dark, 0.9);
            graphics.drawRect(-15, -5, 30, 5);
            graphics.endFill();

            // Main support column
            graphics.beginFill(structureColors.main, 0.8);
            graphics.drawRect(-10, -80, 20, 75);
            graphics.endFill();

            // Column details - horizontal supports
            graphics.lineStyle(1, structureColors.accent, 0.7);
            for (let y = -10; y >= -70; y -= 15) {
                graphics.moveTo(-10, y);
                graphics.lineTo(10, y);
            }

            // Top platform
            graphics.beginFill(structureColors.dark, 0.9);
            graphics.drawRect(-20, -85, 40, 5);
            graphics.endFill();

            // Track supports
            graphics.beginFill(structureColors.main, 0.9);
            graphics.drawRect(-25, -90, 50, 5);
            graphics.endFill();

            // Track rails
            graphics.lineStyle(2, structureColors.detail, 0.9);
            graphics.moveTo(-25, -90);
            graphics.lineTo(25, -90);
            graphics.moveTo(-25, -87);
            graphics.lineTo(25, -87);

            // Column outline
            graphics.lineStyle(1, structureColors.accent, 0.8);
            graphics.drawRect(-10, -80, 20, 75);
            graphics.drawRect(-20, -85, 40, 5);
            graphics.drawRect(-25, -90, 50, 5);

            // Animated elements
            const time = performance.now() / 1000;
            const pulseScale = 0.7 + Math.sin(time * 2) * 0.3;

            // Pulsing lights on the column
            graphics.beginFill(structureColors.accent, 0.5 * pulseScale);
            graphics.drawCircle(-10, -75, 2 * pulseScale);
            graphics.drawCircle(10, -75, 2 * pulseScale);
            graphics.endFill();

        } else if (this.structureType && this.structureType === 'landing_pad') {
            // Debug logging
            console.log(`Drawing landing pad: ${this.structureType}`);

            // Landing pad structure

            // Base platform
            graphics.beginFill(structureColors.main, 0.8);
            graphics.drawRect(-40, -5, 80, 5);
            graphics.endFill();

            // Platform surface
            graphics.beginFill(structureColors.dark, 0.7);
            graphics.drawCircle(0, 0, 35);
            graphics.endFill();

            // Landing markings - outer circle
            graphics.lineStyle(2, structureColors.accent, 0.9);
            graphics.drawCircle(0, 0, 35);

            // Landing markings - inner circle
            graphics.lineStyle(2, structureColors.accent, 0.8);
            graphics.drawCircle(0, 0, 25);

            // Landing markings - center
            graphics.lineStyle(2, structureColors.accent, 0.7);
            graphics.drawCircle(0, 0, 5);

            // Landing markings - cross
            graphics.lineStyle(2, structureColors.lights, 0.9);
            graphics.moveTo(-30, 0);
            graphics.lineTo(30, 0);
            graphics.moveTo(0, -30);
            graphics.lineTo(0, 30);

            // Animated elements
            const time = performance.now() / 1000;
            const pulseScale = 0.7 + Math.sin(time * 2) * 0.3;

            // Pulsing landing lights around the perimeter
            graphics.lineStyle(0);
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
                const x = Math.cos(angle) * 35;
                const y = Math.sin(angle) * 35;

                graphics.beginFill(structureColors.lights, 0.8 * pulseScale);
                graphics.drawCircle(x, y, 3 * pulseScale);
                graphics.endFill();
            }

        } else if (this.structureType && this.structureType === 'power_generator') {
            // Debug logging
            console.log(`Drawing power generator: ${this.structureType}`);

            // Power generator structure

            // Base
            graphics.beginFill(structureColors.dark, 0.9);
            graphics.drawRect(-20, -5, 40, 5);
            graphics.endFill();

            // Main generator body
            graphics.beginFill(structureColors.main, 0.8);
            graphics.drawRect(-15, -25, 30, 20);
            graphics.endFill();

            // Generator top
            graphics.beginFill(structureColors.dark, 0.8);
            graphics.drawRect(-10, -35, 20, 10);
            graphics.endFill();

            // Energy core
            graphics.beginFill(structureColors.energy, 0.6);
            graphics.drawCircle(0, -20, 8);
            graphics.endFill();

            // Control panel
            graphics.beginFill(structureColors.dark, 0.9);
            graphics.drawRect(-12, -15, 8, 10);
            graphics.endFill();

            // Panel lights
            graphics.beginFill(structureColors.accent, 0.8);
            graphics.drawCircle(-8, -12, 1);
            graphics.drawCircle(-8, -9, 1);
            graphics.endFill();

            // Cooling vents
            graphics.lineStyle(1, structureColors.accent, 0.7);
            for (let x = -12; x <= 12; x += 6) {
                graphics.moveTo(x, -30);
                graphics.lineTo(x + 3, -30);
            }

            // Outlines
            graphics.lineStyle(1, structureColors.accent, 0.8);
            graphics.drawRect(-15, -25, 30, 20);
            graphics.drawRect(-10, -35, 20, 10);
            graphics.drawRect(-12, -15, 8, 10);

            // Animated elements
            const time = performance.now() / 1000;
            const pulseScale = 0.7 + Math.sin(time * 2) * 0.3;

            // Pulsing energy core
            graphics.lineStyle(2, structureColors.energy, 0.8 * pulseScale);
            graphics.drawCircle(0, -20, 8 * pulseScale);

            // Energy arcs
            graphics.lineStyle(1, structureColors.energy, 0.6 * pulseScale);
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
                const innerRadius = 8;
                const outerRadius = 8 + 4 * pulseScale;

                const x1 = Math.cos(angle) * innerRadius;
                const y1 = Math.sin(angle) * innerRadius - 20;
                const x2 = Math.cos(angle) * outerRadius;
                const y2 = Math.sin(angle) * outerRadius - 20;

                graphics.moveTo(x1, y1);
                graphics.lineTo(x2, y2);
            }

        } else if (this.structureType && this.structureType === 'data_hub') {
            // Debug logging
            console.log(`Drawing data hub: ${this.structureType}`);

            // Data hub structure

            // Base
            graphics.beginFill(structureColors.dark, 0.9);
            graphics.drawRect(-15, -5, 30, 5);
            graphics.endFill();

            // Main server rack
            graphics.beginFill(structureColors.main, 0.8);
            graphics.drawRect(-12, -30, 24, 25);
            graphics.endFill();

            // Server units
            graphics.lineStyle(1, structureColors.dark, 0.8);
            for (let y = -28; y <= -8; y += 5) {
                graphics.moveTo(-12, y);
                graphics.lineTo(12, y);
            }

            // Server lights
            const time = performance.now() / 1000;
            const blinkRate = Math.floor(time * 5) % 3; // 0, 1, or 2 for different blink patterns

            for (let y = -25; y <= -10; y += 5) {
                for (let x = -9; x <= 9; x += 6) {
                    // Different blinking patterns based on position and time
                    const shouldBlink = (x + y + blinkRate) % 3 === 0;

                    if (shouldBlink) {
                        graphics.beginFill(structureColors.data, 0.9);
                    } else {
                        graphics.beginFill(structureColors.accent, 0.5);
                    }

                    graphics.drawCircle(x, y, 1);
                    graphics.endFill();
                }
            }

            // Data cables
            graphics.lineStyle(1, structureColors.data, 0.7);
            graphics.moveTo(-10, -30);
            graphics.lineTo(-10, -40);
            graphics.lineTo(10, -40);
            graphics.lineTo(10, -30);

            // Holographic data projection
            const pulseScale = 0.7 + Math.sin(time * 2) * 0.3;

            // Data streams
            graphics.lineStyle(1, structureColors.data, 0.5 * pulseScale);
            for (let i = 0; i < 5; i++) {
                const offset = (time * 5 + i * 2) % 20 - 10;

                graphics.moveTo(0, -30);
                graphics.lineTo(offset, -50);
            }

            // Data cloud
            graphics.beginFill(structureColors.data, 0.2 * pulseScale);
            graphics.drawEllipse(0, -50, 15 * pulseScale, 8 * pulseScale);
            graphics.endFill();

            // Outline
            graphics.lineStyle(1, structureColors.accent, 0.8);
            graphics.drawRect(-12, -30, 24, 25);

        } else if (this.structureType && this.structureType === 'holo_billboard') {
            // Debug logging
            console.log(`Drawing holographic billboard: ${this.structureType}`);

            // Holographic billboard structure

            // Base
            graphics.beginFill(structureColors.dark, 0.9);
            graphics.drawRect(-10, -5, 20, 5);
            graphics.endFill();

            // Support pole
            graphics.beginFill(structureColors.main, 0.8);
            graphics.drawRect(-5, -40, 10, 35);
            graphics.endFill();

            // Billboard frame
            graphics.beginFill(structureColors.dark, 0.8);
            graphics.drawRect(-25, -70, 50, 30);
            graphics.endFill();

            // Screen
            graphics.beginFill(structureColors.screen, 0.5);
            graphics.drawRect(-20, -65, 40, 20);
            graphics.endFill();

            // Outlines
            graphics.lineStyle(1, structureColors.accent, 0.8);
            graphics.drawRect(-5, -40, 10, 35);
            graphics.drawRect(-25, -70, 50, 30);

            // Animated elements
            const time = performance.now() / 1000;
            const pulseScale = 0.7 + Math.sin(time * 2) * 0.3;

            // Screen content - scrolling text effect
            graphics.lineStyle(2, 0xFFFFFF, 0.8);
            for (let i = 0; i < 3; i++) {
                const offset = (time * 10 + i * 10) % 40 - 20;
                graphics.moveTo(-15 + offset, -60 + i * 5);
                graphics.lineTo(-5 + offset, -60 + i * 5);
            }

            // Animated graphics - simple shapes
            const animTime = time % 3; // 0-3 second loop

            if (animTime < 1) {
                // Circle
                graphics.lineStyle(2, 0xFF00FF, 0.8 * pulseScale);
                graphics.drawCircle(5, -55, 5 * pulseScale);
            } else if (animTime < 2) {
                // Triangle
                graphics.lineStyle(2, 0x00FFFF, 0.8 * pulseScale);
                graphics.moveTo(0, -60);
                graphics.lineTo(10, -50);
                graphics.lineTo(0, -50);
                graphics.closePath();
            } else {
                // Square
                graphics.lineStyle(2, 0xFFFF00, 0.8 * pulseScale);
                graphics.drawRect(0, -60, 10, 10);
            }

            // Pulsing border
            graphics.lineStyle(2, structureColors.accent, 0.7 * pulseScale);
            graphics.drawRect(-20, -65, 40, 20);

            // Holographic projection effect
            graphics.lineStyle(1, structureColors.accent, 0.3 * pulseScale);
            for (let y = -65; y <= -45; y += 5) {
                graphics.moveTo(-20, y);
                graphics.lineTo(20, y);
            }

        } else if (this.structureType && this.structureType === 'security_camera') {
            // Debug logging
            console.log(`Drawing security camera: ${this.structureType}`);

            // Security camera structure

            // Wall mount
            graphics.beginFill(structureColors.dark, 0.9);
            graphics.drawRect(-5, -25, 10, 5);
            graphics.endFill();

            // Camera arm
            graphics.beginFill(structureColors.main, 0.8);
            graphics.drawRect(-2, -25, 4, 10);
            graphics.endFill();

            // Camera body
            graphics.beginFill(structureColors.main, 0.9);
            graphics.drawRect(-8, -20, 16, 10);
            graphics.endFill();

            // Camera lens
            graphics.beginFill(structureColors.dark, 0.9);
            graphics.drawCircle(0, -15, 5);
            graphics.endFill();

            // Lens inner
            graphics.beginFill(structureColors.lens, 0.7);
            graphics.drawCircle(0, -15, 3);
            graphics.endFill();

            // Outlines
            graphics.lineStyle(1, structureColors.accent, 0.8);
            graphics.drawRect(-5, -25, 10, 5);
            graphics.drawRect(-2, -25, 4, 10);
            graphics.drawRect(-8, -20, 16, 10);

            // Animated elements
            const time = performance.now() / 1000;
            const pulseScale = 0.7 + Math.sin(time * 2) * 0.3;

            // Camera movement - slight rotation
            const rotationAngle = Math.sin(time) * 0.2; // Small rotation angle
            const rotationX = Math.sin(rotationAngle) * 5;

            // Status light
            graphics.beginFill(0xFF0000, 0.8 * pulseScale);
            graphics.drawCircle(6, -18, 1 * pulseScale);
            graphics.endFill();

            // Scanning effect
            graphics.lineStyle(1, structureColors.lens, 0.5 * pulseScale);
            graphics.moveTo(0, -15);
            graphics.lineTo(rotationX, -5);

            // Lens highlight
            graphics.lineStyle(1, 0xFFFFFF, 0.8);
            graphics.drawCircle(1, -16, 1);

        } else if (this.structureType && this.structureType === 'neon_strip') {
            // Debug logging
            console.log(`Drawing neon strip: ${this.structureType}`);

            // Neon strip structure

            // Base
            graphics.beginFill(structureColors.dark, 0.9);
            graphics.drawRect(-25, -5, 50, 5);
            graphics.endFill();

            // Light housing
            graphics.beginFill(structureColors.main, 0.7);
            graphics.drawRect(-25, -8, 50, 3);
            graphics.endFill();

            // Animated elements
            const time = performance.now() / 1000;

            // Color cycling effect
            const cyclePosition = (time * 0.5) % 1; // 0 to 1 over 2 seconds

            let lightColor;
            if (cyclePosition < 0.33) {
                // Interpolate from magenta to cyan
                const t = cyclePosition * 3;
                lightColor = interpolateColor(0xFF00FF, 0x00FFFF, t);
            } else if (cyclePosition < 0.66) {
                // Interpolate from cyan to yellow
                const t = (cyclePosition - 0.33) * 3;
                lightColor = interpolateColor(0x00FFFF, 0xFFFF00, t);
            } else {
                // Interpolate from yellow to magenta
                const t = (cyclePosition - 0.66) * 3;
                lightColor = interpolateColor(0xFFFF00, 0xFF00FF, t);
            }

            // Neon light effect
            graphics.beginFill(lightColor, 0.8);
            graphics.drawRect(-25, -8, 50, 3);
            graphics.endFill();

            // Light glow
            const pulseScale = 0.7 + Math.sin(time * 2) * 0.3;
            graphics.lineStyle(2, lightColor, 0.5 * pulseScale);
            graphics.drawRect(-25, -8, 50, 3);

            // Light segments
            graphics.lineStyle(1, structureColors.dark, 0.5);
            for (let x = -20; x < 20; x += 10) {
                graphics.moveTo(x, -8);
                graphics.lineTo(x, -5);
            }

            // Helper function to interpolate between two colors
            function interpolateColor(color1, color2, factor) {
                const r1 = (color1 >> 16) & 0xFF;
                const g1 = (color1 >> 8) & 0xFF;
                const b1 = color1 & 0xFF;

                const r2 = (color2 >> 16) & 0xFF;
                const g2 = (color2 >> 8) & 0xFF;
                const b2 = color2 & 0xFF;

                const r = Math.round(r1 + factor * (r2 - r1));
                const g = Math.round(g1 + factor * (g2 - g1));
                const b = Math.round(b1 + factor * (b2 - b1));

                return (r << 16) | (g << 8) | b;
            }

        } else if (this.structureType && this.structureType === 'terminal') {
            // Terminal structure

            // Base
            graphics.beginFill(0x333333, 0.9);
            graphics.drawRect(-15, -5, 30, 5);
            graphics.endFill();

            // Terminal body
            graphics.beginFill(0x008080, 0.8); // Teal color
            graphics.drawRect(-15, -35, 30, 30);
            graphics.endFill();

            // Screen
            graphics.beginFill(0x000000, 0.9);
            graphics.drawRect(-12, -32, 24, 20);
            graphics.endFill();

            // Screen content - text lines
            graphics.lineStyle(1, 0x00FFFF, 0.9); // Cyan text
            for (let i = 0; i < 4; i++) {
                const y = -28 + i * 4;
                graphics.moveTo(-10, y);
                graphics.lineTo(10, y);
            }

            // Control panel
            graphics.beginFill(0x444444, 0.8);
            graphics.drawRect(-12, -10, 24, 5);
            graphics.endFill();

            // Buttons
            graphics.beginFill(0x00FFFF, 0.7);
            for (let i = -9; i <= 9; i += 6) {
                graphics.drawCircle(i, -7.5, 2);
            }
            graphics.endFill();

            // Animated screen glow
            const time = performance.now() / 1000;
            const pulseScale = 0.7 + Math.sin(time * 2) * 0.3;

            graphics.lineStyle(1, 0x00FFFF, 0.5 * pulseScale);
            graphics.drawRect(-12, -32, 24, 20);

        } else if (this.structureType && this.structureType === 'crate') {
            // Crate structure

            // Main box
            graphics.beginFill(0xCD853F, 0.8); // Peru color for wooden crate
            graphics.drawRect(-20, -20, 40, 40);
            graphics.endFill();

            // Crate details - panels
            graphics.lineStyle(2, 0x8B4513, 0.7); // Darker brown lines

            // Horizontal panels
            graphics.moveTo(-20, -7);
            graphics.lineTo(20, -7);
            graphics.moveTo(-20, 7);
            graphics.lineTo(20, 7);

            // Vertical panels
            graphics.moveTo(-7, -20);
            graphics.lineTo(-7, 20);
            graphics.moveTo(7, -20);
            graphics.lineTo(7, 20);

            // Corner reinforcements
            graphics.lineStyle(3, 0x8B4513, 0.9);

            // Top left
            graphics.moveTo(-20, -20);
            graphics.lineTo(-15, -20);
            graphics.moveTo(-20, -20);
            graphics.lineTo(-20, -15);

            // Top right
            graphics.moveTo(20, -20);
            graphics.lineTo(15, -20);
            graphics.moveTo(20, -20);
            graphics.lineTo(20, -15);

            // Bottom left
            graphics.moveTo(-20, 20);
            graphics.lineTo(-15, 20);
            graphics.moveTo(-20, 20);
            graphics.lineTo(-20, 15);

            // Bottom right
            graphics.moveTo(20, 20);
            graphics.lineTo(15, 20);
            graphics.moveTo(20, 20);
            graphics.lineTo(20, 15);

            // Outline
            graphics.lineStyle(1, 0xFFD700, 0.5); // Gold outline
            graphics.drawRect(-20, -20, 40, 40);

        } else if (this.structureType && this.structureType === 'bench') {
            // Bench structure

            // Legs
            graphics.beginFill(0x8B4513, 0.9); // Brown legs
            graphics.drawRect(-20, -5, 5, 5);
            graphics.drawRect(15, -5, 5, 5);
            graphics.endFill();

            // Seat
            graphics.beginFill(0xDEB887, 0.8); // Burlywood seat
            graphics.drawRect(-25, -10, 50, 5);
            graphics.endFill();

            // Backrest
            graphics.beginFill(0xDEB887, 0.7);
            graphics.drawRect(-25, -25, 50, 15);
            graphics.endFill();

            // Wood grain details
            graphics.lineStyle(1, 0x8B4513, 0.5);

            // Seat grain
            for (let i = -20; i < 20; i += 5) {
                graphics.moveTo(i, -10);
                graphics.lineTo(i, -5);
            }

            // Backrest grain
            for (let i = -20; i < 20; i += 5) {
                graphics.moveTo(i, -25);
                graphics.lineTo(i, -10);
            }

            // Outlines
            graphics.lineStyle(1, 0x8B4513, 0.8);
            graphics.drawRect(-25, -10, 50, 5); // Seat outline
            graphics.drawRect(-25, -25, 50, 15); // Backrest outline
            graphics.drawRect(-20, -5, 5, 5); // Left leg outline
            graphics.drawRect(15, -5, 5, 5); // Right leg outline

        } else {
            // Debug logging
            console.log(`Using default building drawing for structure type: ${this.structureType}, typeof: ${typeof this.structureType}`);

            // Enhanced generic building with cyberpunk/synthwave aesthetic

            // Base structure - more detailed with angled walls
            graphics.beginFill(structureColors.dark, 0.8);
            graphics.moveTo(-35, 0);      // Bottom left
            graphics.lineTo(-30, -40);    // Top left
            graphics.lineTo(30, -40);     // Top right
            graphics.lineTo(35, 0);       // Bottom right
            graphics.closePath();
            graphics.endFill();

            // Base outline with neon effect
            graphics.lineStyle(2, structureColors.main, 1);
            graphics.moveTo(-35, 0);
            graphics.lineTo(-30, -40);
            graphics.lineTo(30, -40);
            graphics.lineTo(35, 0);
            graphics.closePath();

            // Grid pattern on walls - more cyberpunk
            graphics.lineStyle(1, structureColors.accent, 0.4);
            // Horizontal grid lines
            for (let y = -35; y <= -5; y += 5) {
                // Calculate x offset based on the angled walls
                const ratio = (y + 40) / 40; // 0 at top, 1 at bottom
                const leftX = -30 - (5 * ratio);
                const rightX = 30 + (5 * ratio);

                graphics.moveTo(leftX, y);
                graphics.lineTo(rightX, y);
            }

            // Vertical grid lines
            for (let x = -25; x <= 25; x += 10) {
                graphics.moveTo(x, -40);
                graphics.lineTo(x + 5, 0); // Angled to match the walls
            }

            // Roof - more angular and futuristic
            graphics.beginFill(structureColors.accent, 0.7);
            graphics.moveTo(-30, -40);    // Left edge
            graphics.lineTo(-15, -60);    // Left peak
            graphics.lineTo(0, -70);      // Center peak
            graphics.lineTo(15, -60);     // Right peak
            graphics.lineTo(30, -40);     // Right edge
            graphics.closePath();
            graphics.endFill();

            // Roof outline
            graphics.lineStyle(2, structureColors.main, 1);
            graphics.moveTo(-30, -40);
            graphics.lineTo(-15, -60);
            graphics.lineTo(0, -70);
            graphics.lineTo(15, -60);
            graphics.lineTo(30, -40);

            // Roof details - antenna and satellite dish
            graphics.lineStyle(1, structureColors.accent, 1);
            // Antenna
            graphics.moveTo(0, -70);
            graphics.lineTo(0, -85);
            graphics.moveTo(-3, -80);
            graphics.lineTo(3, -80);
            graphics.moveTo(-2, -75);
            graphics.lineTo(2, -75);

            // Satellite dish
            graphics.beginFill(structureColors.main, 0.6);
            graphics.drawEllipse(20, -55, 5, 3);
            graphics.endFill();
            graphics.lineStyle(1, structureColors.accent, 1);
            graphics.moveTo(20, -55);
            graphics.lineTo(15, -60);

            // Door - more futuristic with frame
            graphics.beginFill(structureColors.dark, 0.9);
            graphics.drawRect(-12, -30, 24, 30);
            graphics.endFill();

            // Door frame with neon outline
            graphics.lineStyle(2, structureColors.accent, 1);
            graphics.drawRect(-12, -30, 24, 30);

            // Door details - keypad and sliding door lines
            graphics.lineStyle(1, structureColors.accent, 0.8);
            // Keypad
            graphics.beginFill(structureColors.main, 0.7);
            graphics.drawRect(-8, -20, 4, 6);
            graphics.endFill();

            // Sliding door lines
            graphics.moveTo(-8, -30);
            graphics.lineTo(-8, 0);
            graphics.moveTo(8, -30);
            graphics.lineTo(8, 0);

            // Windows - larger and more detailed
            // Left window
            graphics.beginFill(structureColors.accent, 0.3);
            graphics.drawRect(-25, -30, 10, 15);
            graphics.endFill();

            // Right window
            graphics.beginFill(structureColors.accent, 0.3);
            graphics.drawRect(15, -30, 10, 15);
            graphics.endFill();

            // Window frames
            graphics.lineStyle(1, structureColors.accent, 1);
            graphics.drawRect(-25, -30, 10, 15);
            graphics.drawRect(15, -30, 10, 15);

            // Window details - crossbars
            graphics.moveTo(-25, -22.5);
            graphics.lineTo(-15, -22.5);
            graphics.moveTo(-20, -30);
            graphics.lineTo(-20, -15);

            graphics.moveTo(15, -22.5);
            graphics.lineTo(25, -22.5);
            graphics.moveTo(20, -30);
            graphics.lineTo(20, -15);

            // Add animated neon effects
            const time = performance.now() / 1000;
            const pulseScale = 0.7 + Math.sin(time * 2) * 0.3;

            // Pulsing roof edge
            graphics.lineStyle(2, structureColors.accent, 0.8 * pulseScale);
            graphics.moveTo(-30, -40);
            graphics.lineTo(-15, -60);
            graphics.lineTo(0, -70);
            graphics.lineTo(15, -60);
            graphics.lineTo(30, -40);

            // Pulsing door frame
            graphics.lineStyle(2, structureColors.accent, 0.7 * pulseScale);
            graphics.drawRect(-12, -30, 24, 30);

            // Animated door lights
            graphics.beginFill(structureColors.accent, 0.8 * pulseScale);
            graphics.drawCircle(-8, -15, 1);
            graphics.drawCircle(-8, -12, 1);
            graphics.drawCircle(-8, -9, 1);
            graphics.endFill();

            // Animated window glow
            graphics.lineStyle(1, structureColors.accent, 0.5 * pulseScale);
            graphics.drawRect(-25, -30, 10, 15);
            graphics.drawRect(15, -30, 10, 15);

            // Holographic sign above door
            graphics.beginFill(structureColors.main, 0.4 * pulseScale);
            graphics.drawRect(-15, -35, 30, 3);
            graphics.endFill();
            graphics.lineStyle(1, structureColors.accent, 0.9 * pulseScale);
            graphics.drawRect(-15, -35, 30, 3);

            // Small blinking lights on roof
            const blinkRate = Math.sin(time * 5) > 0 ? 1 : 0.2;
            graphics.beginFill(structureColors.accent, blinkRate);
            graphics.drawCircle(-15, -60, 1);
            graphics.drawCircle(15, -60, 1);
            graphics.drawCircle(0, -70, 1);
            graphics.endFill();
        }

        // Add graphics to container
        this.addChild(graphics);
        this.sprite = graphics;
    }

    /**
     * Creates an interaction area for the structure
     * @private
     */
    createInteractionArea() {
        // Create a hitArea for the structure
        const width = this.gridWidth * 32;
        const height = this.gridHeight * 16;

        // Create a polygon hitArea for isometric shape
        const hitArea = new PIXI.Polygon([
            -width/2, 0,
            0, -height/2,
            width/2, 0,
            0, height/2
        ]);

        // Set interactive properties
        this.eventMode = 'static';
        this.cursor = 'pointer';
        this.hitArea = hitArea;

        // Add hover effect
        this.on('mouseover', this.onMouseOver.bind(this));
        this.on('mouseout', this.onMouseOut.bind(this));
        this.on('click', this.onClick.bind(this));

        // Create highlight graphics
        this.highlightGraphics = new PIXI.Graphics();
        this.addChildAt(this.highlightGraphics, 0);

        // Hide highlight by default
        this.highlighted = false;
        this.updateHighlight();
    }

    /**
     * Places the structure in the world
     * @param {IsometricWorld} world - The world to place the structure in
     * @param {number} gridX - Grid X position
     * @param {number} gridY - Grid Y position
     * @returns {boolean} Whether the structure was placed successfully
     */
    placeInWorld(world, gridX, gridY) {
        if (!world || !this.canPlaceAt(world, gridX, gridY)) {
            return false;
        }

        // Set grid position
        this.gridX = gridX;
        this.gridY = gridY;

        // Set world reference
        this.world = world;

        // Calculate isometric position
        const worldPos = world.gridToWorld(gridX, gridY);
        this.position.set(worldPos.x, worldPos.y);

        // Add to structure layer
        world.structureLayer.addChild(this);

        // Mark tiles as occupied
        this.occupyTiles(world);

        // Add to world's entity list
        world.entities.add(this);

        return true;
    }

    /**
     * Checks if the structure can be placed at the specified position
     * @param {IsometricWorld} world - The world to check
     * @param {number} gridX - Grid X position
     * @param {number} gridY - Grid Y position
     * @returns {boolean} Whether the structure can be placed
     */
    canPlaceAt(world, gridX, gridY) {
        if (!world) return false;

        // For chunk-based worlds, we don't need to do a strict boundary check
        // This allows structures to be placed in new chunks

        // Only apply a very loose boundary check to prevent extreme values
        const maxDistance = 1000; // Allow coordinates up to 1000 tiles away from origin
        if (gridX < -maxDistance || gridX >= world.config.gridWidth + maxDistance ||
            gridY < -maxDistance || gridY >= world.config.gridHeight + maxDistance) {
            console.log(`Cannot place structure at (${gridX}, ${gridY}): far outside world bounds`);
            return false;
        }

        // Check if target tile is valid
        const tile = world.getTile(gridX, gridY);
        if (!tile || !tile.walkable || tile.structure) {
            return false;
        }

        return true;
    }

    /**
     * Marks tiles as occupied by this structure
     * @param {IsometricWorld} world - The world
     * @private
     */
    occupyTiles(world) {
        // Clear previous occupied tiles
        this.occupiedTiles.forEach(tile => {
            if (tile.structure === this) {
                tile.structure = null;
                tile.walkable = true;
            }
        });

        this.occupiedTiles = [];

        // Get the target tile
        const tile = world.getTile(this.gridX, this.gridY);
        if (tile) {
            tile.structure = this;
            tile.walkable = this.walkable;
            this.occupiedTiles.push(tile);
        }
    }

    /**
     * Updates the highlight effect
     * @private
     */
    updateHighlight() {
        if (!this.highlightGraphics) return;

        this.highlightGraphics.clear();

        if (this.highlighted) {
            const width = this.gridWidth * 32;
            const height = this.gridHeight * 16;

            // Synthwave color palette
            const colors = {
                tree: 0x00FF00,    // Neon green
                rock: 0x00FFFF,    // Cyan
                house: 0xFF00FF,   // Magenta
                generic: 0xFF00FF  // Magenta
            };

            // Get highlight color based on structure type
            const highlightColor = colors[this.structureType] || colors.generic;
            const accentColor = this.structureType === 'tree' ? 0xFF00FF : 0x00FFFF;

            // Add glow effect
            const glowSize = 8;
            [0.1, 0.2, 0.3].forEach(glowAlpha => {
                this.highlightGraphics.lineStyle(glowSize * (1 + glowAlpha), highlightColor, glowAlpha);
                this.highlightGraphics.moveTo(-width/2, 0);
                this.highlightGraphics.lineTo(0, -height/2);
                this.highlightGraphics.lineTo(width/2, 0);
                this.highlightGraphics.lineTo(0, height/2);
                this.highlightGraphics.closePath();
            });

            // Main highlight
            this.highlightGraphics.beginFill(highlightColor, 0.15);
            this.highlightGraphics.lineStyle(2, highlightColor, 0.8);
            this.highlightGraphics.moveTo(-width/2, 0);
            this.highlightGraphics.lineTo(0, -height/2);
            this.highlightGraphics.lineTo(width/2, 0);
            this.highlightGraphics.lineTo(0, height/2);
            this.highlightGraphics.closePath();
            this.highlightGraphics.endFill();

            // Add grid pattern
            this.highlightGraphics.lineStyle(1, accentColor, 0.3);
            for (let y = -height/2; y <= height/2; y += 4) {
                this.highlightGraphics.moveTo(-width/2, y);
                this.highlightGraphics.lineTo(width/2, y);
            }

            // Add animated corner accents
            const time = performance.now() / 1000;
            const pulseScale = 0.7 + Math.sin(time * 2) * 0.3;
            const accentLength = 10 * pulseScale;

            this.highlightGraphics.lineStyle(2, accentColor, 0.8);

            // Top corner
            this.highlightGraphics.moveTo(0, -height/2);
            this.highlightGraphics.lineTo(0, -height/2 + accentLength);

            // Right corner
            this.highlightGraphics.moveTo(width/2, 0);
            this.highlightGraphics.lineTo(width/2 - accentLength, 0);

            // Bottom corner
            this.highlightGraphics.moveTo(0, height/2);
            this.highlightGraphics.lineTo(0, height/2 - accentLength);

            // Left corner
            this.highlightGraphics.moveTo(-width/2, 0);
            this.highlightGraphics.lineTo(-width/2 + accentLength, 0);
        }
    }

    /**
     * Handles mouse over event
     * @private
     */
    onMouseOver() {
        this.highlighted = true;
        this.updateHighlight();
    }

    /**
     * Handles mouse out event
     * @private
     */
    onMouseOut() {
        this.highlighted = false;
        this.updateHighlight();
    }

    /**
     * Handles click event
     * @private
     */
    onClick() {
        if (this.world) {
            console.log(`Clicked on ${this.structureType} at (${this.gridX}, ${this.gridY})`);
        }
    }

    /**
     * Updates the structure
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        super.update(deltaTime);

        if (this.highlightGraphics && this.highlighted) {
            this.updateHighlight();
        }
    }

    /**
     * Disposes of the structure
     */
    dispose() {
        // Remove from world
        this.removeFromWorld();

        // Remove event listeners
        if (this.eventMode === 'static') {
            this.off('mouseover', this.onMouseOver);
            this.off('mouseout', this.onMouseOut);
            this.off('click', this.onClick);
        }

        super.dispose();
    }
}
