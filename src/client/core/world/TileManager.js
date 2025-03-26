import { DebugLogger } from '../utils/DebugLogger.js';

export class TileManager {
    constructor(debug) {
        this.logger = new DebugLogger(debug || { enabled: false, flags: {} });
        
        // Initialize canvas for texture generation
        this.tempCanvas = document.createElement('canvas');
        this.tempCanvas.width = 64;
        this.tempCanvas.height = 64;
        this.tempCtx = this.tempCanvas.getContext('2d');
        
        // Initialize textures map
        this.textures = new Map();
        this.decorationTextures = new Map();
        this.persistentDecorations = new Map();
        this.decorationBatch = new Map();

        // Define tile variants first
        this.tileVariants = {
            'grass': 3,
            'dirt': 2,
            'stone': 2,
            'water': 2,
            'sand': 2,
            'forest': 2,
            'mountain': 2,
            'wetland': 2,
            'asphalt': 1,
            'concrete': 1
        };

        // Define decorations for each tile type
        this.decorations = {
            'grass': [
                { type: 'dec_flowers', chance: 0.1, offset: { x: 0, y: -8 }, scale: { x: 0.5, y: 0.5 } },
                { type: 'dec_grassTufts', chance: 0.2, offset: { x: 0, y: -6 }, scale: { x: 0.7, y: 0.7 } }
            ],
            'dirt': [
                { type: 'dec_rocks', chance: 0.15, offset: { x: 0, y: -4 }, scale: { x: 0.6, y: 0.6 } }
            ],
            'stone': [
                { type: 'dec_rocks', chance: 0.3, offset: { x: 0, y: -4 }, scale: { x: 0.8, y: 0.8 } }
            ],
            'sand': [
                { type: 'dec_rocks', chance: 0.05, offset: { x: 0, y: -4 }, scale: { x: 0.4, y: 0.4 } }
            ],
            'forest': [
                { type: 'dec_grassTufts', chance: 0.8, offset: { x: 0, y: -16 }, scale: { x: 1.0, y: 1.0 } }
            ],
            'mountain': [
                { type: 'dec_rocks', chance: 0.6, offset: { x: 0, y: -8 }, scale: { x: 1.0, y: 1.0 } }
            ],
            'wetland': [
                { type: 'dec_grassTufts', chance: 0.4, offset: { x: 0, y: -6 }, scale: { x: 0.8, y: 0.8 } }
            ]
        };

        // Add seeded random number generator for consistent decoration placement
        this.decorationSeed = 12345;

        // Initialize decoration loading state
        this.decorationTexturesLoaded = false;
        this.decorationLoadQueue = new Set([
            'dec_rocks',
            'dec_flowers',
            'dec_grassTufts'
        ]);

        // Initialize decoration system
        this.decorationSystem = {
            enabled: true,
            lastUpdate: 0,
            updateInterval: 100  // ms between decoration updates
        };

        // Initialize tile decorations map
        this.tileDecorations = {
            'grass': [
                { type: 'dec_flowers', chance: 0.2, offset: { x: 0, y: -4 }, scale: { x: 0.8, y: 0.8 } },
                { type: 'dec_grassTufts', chance: 0.3, offset: { x: 0, y: -4 }, scale: { x: 0.8, y: 0.8 } }
            ],
            'forest': [
                { type: 'dec_rocks', chance: 0.1, offset: { x: 0, y: -6 }, scale: { x: 1.0, y: 1.0 } }
            ],
            'mountain': [
                { type: 'dec_rocks', chance: 0.6, offset: { x: 0, y: -8 }, scale: { x: 1.0, y: 1.0 } }
            ],
            'wetland': [
                { type: 'dec_grassTufts', chance: 0.4, offset: { x: 0, y: -6 }, scale: { x: 0.8, y: 0.8 } }
            ]
        };
    }

    logDebug(message, flag = '') {
        if (this.logger) {
            this.logger.log(message, flag);
        }
    }

    generateAllDecorationTextures() {
        this.decorationLoadQueue.forEach(name => {
            this.generateDecorationTexture(name, this.getDecorationBaseColor(name));
        });
        this.decorationTexturesLoaded = true;
        this.logDebug('TileManager: All decoration textures generated');
    }

    getDecorationBaseColor(name) {
        const colors = {
            'dec_rocks': '#696969',
            'dec_flowers': '#ff6b6b',
            'dec_grassTufts': '#90EE90'
        };
        return colors[name] || '#FF00FF';
    }

    getDecorationTexture(name) {
        const texture = this.decorationTextures.get(name);
        if (!texture) {
            console.warn(`TileManager: Decoration texture not found: ${name}`);
            return this.createTempTexture('#FF00FF'); // Return fallback texture
        }
        return texture;
    }

    getPersistentDecoration(tileId, tileType) {
        if (this.persistentDecorations.has(tileId)) {
            this.logDebug(`TileManager: Using cached decoration for tile ${tileId}`, 'logDecorations');
            return this.persistentDecorations.get(tileId);
        }

        const possibleDecorations = this.decorations[tileType];
        if (!possibleDecorations) {
            this.logDebug(`TileManager: No decorations available for tile type ${tileType}`, 'logDecorations');
            this.persistentDecorations.set(tileId, null);
            return null;
        }

        // Get deterministic random value for this tile
        const random = this.getSeededRandom(tileId);
        this.logDebug(`TileManager: Random value for tile ${tileId}: ${random}`, 'logDecorations');
        
        // Direct chance comparison instead of cumulative
        for (const decoration of possibleDecorations) {
            if (random < decoration.chance) {
                const newDecoration = {
                    type: decoration.type,
                    offset: { ...decoration.offset },
                    scale: { ...decoration.scale },
                    id: `dec_${tileId}`
                };
                this.logDebug(`TileManager: Decoration selected for tile ${tileId}:`, newDecoration, 'logDecorations');
                this.persistentDecorations.set(tileId, newDecoration);
                return newDecoration;
            }
        }

        this.logDebug(`TileManager: No decoration selected for tile ${tileId}`, 'logDecorations');
        this.persistentDecorations.set(tileId, null);
        return null;
    }

    getSeededRandom(seed) {
        const x = Math.sin(seed + this.decorationSeed) * 10000;
        return x - Math.floor(x);
    }

    updateDecorations(timestamp) {
        if (timestamp - this.lastDecorationUpdate < this.decorationUpdateInterval) {
            return;
        }
        this.lastDecorationUpdate = timestamp;
        // Perform decoration updates
    }

    createFallbackTexture(tileType) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Define colors for all supported tile types
        const tileColors = {
            grass: { primary: '#7ED321', secondary: '#6DB31E' },
            dirt: { primary: '#8B572A', secondary: '#724621' },
            stone: { primary: '#9B9B9B', secondary: '#858585' },
            sand: { primary: '#F5A623', secondary: '#E09612' },
            water: { primary: '#4A90E2', secondary: '#357ABD' },
            wetland: { primary: '#417505', secondary: '#365E04' },
            asphalt: { primary: '#4A4A4A', secondary: '#3A3A3A' },
            concrete: { primary: '#9B9B9B', secondary: '#888888' }
        };

        const colors = tileColors[tileType] || tileColors.grass; // Default to grass if unknown type

        // Draw a simple pattern
        ctx.fillStyle = colors.primary;
        ctx.fillRect(0, 0, 64, 64);

        // Add some visual interest with a pattern
        ctx.fillStyle = colors.secondary;
        for (let y = 0; y < 64; y += 8) {
            for (let x = 0; x < 64; x += 8) {
                if ((x + y) % 16 === 0) {
                    ctx.fillRect(x, y, 7, 7);
                }
            }
        }

        return canvas;
    }

    async loadTextures() {
        this.logDebug('TileManager: Generating textures...', 'logTextureLoading');
        
        // Only generate textures for supported tile types
        const baseColors = {
            'grass': '#7ED321',
            'grass_var1': '#8ED331',
            'grass_var2': '#6EC311',
            'dirt': '#8B572A',
            'dirt_var1': '#9B673A',
            'dirt_var2': '#7B471A',
            'stone': '#9B9B9B',
            'stone_var1': '#8B8B8B',
            'sand': '#F5A623',
            'sand_var1': '#E59613',
            'wetland': '#417505',
            'wetland_var1': '#316504',
            'water': '#4A90E2',
            'water_var1': '#3A80D2',
            'asphalt': '#4A4A4A',
            'concrete': '#9B9B9B'
        };

        // Generate textures for each type
        Object.entries(baseColors).forEach(([name, color]) => {
            this.generateTexture(name, color);
        });

        // Generate decoration textures
        this.generateAllDecorationTextures();
    }

    generateTexture(name, baseColor) {
        const ctx = this.tempCtx;
        const width = this.tempCanvas.width;
        const height = this.tempCanvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Fill with base color
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, width, height);

        // Add some noise/variation
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 4 + 1;
            
            ctx.fillStyle = this.adjustColor(baseColor, Math.random() * 20 - 10);
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Create image from canvas
        const img = new Image();
        img.src = this.tempCanvas.toDataURL();
        this.textures.set(name, img);
    }

    generateDecorationTexture(name, baseColor) {
        const ctx = this.tempCtx;
        const width = this.tempCanvas.width;
        const height = this.tempCanvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Generate specific patterns based on decoration type
        if (name === 'dec_flowers') {
            this.generateFlowerTexture(ctx, width, height, baseColor);
        } else if (name === 'dec_rocks') {
            this.generateRockTexture(ctx, width, height, baseColor);
        } else if (name === 'dec_grassTufts') {
            this.generateGrassTuftTexture(ctx, width, height, baseColor);
        }

        // Create image from canvas
        const img = new Image();
        img.src = this.tempCanvas.toDataURL();
        this.decorationTextures.set(name, img);
    }

    generateFlowerTexture(ctx, width, height, baseColor) {
        for (let i = 0; i < 5; i++) {
            const x = 20 + Math.random() * (width - 40);
            const y = 20 + Math.random() * (height - 40);
            
            // Draw stem
            ctx.strokeStyle = '#90EE90';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y + 10);
            ctx.lineTo(x, y - 10);
            ctx.stroke();

            // Draw petals
            ctx.fillStyle = baseColor;
            for (let j = 0; j < 5; j++) {
                const angle = (j / 5) * Math.PI * 2;
                ctx.beginPath();
                ctx.ellipse(
                    x + Math.cos(angle) * 5,
                    y + Math.sin(angle) * 5,
                    4,
                    4,
                    angle,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        }
    }

    generateRockTexture(ctx, width, height, baseColor) {
        for (let i = 0; i < 3; i++) {
            const x = 20 + Math.random() * (width - 40);
            const y = 20 + Math.random() * (height - 40);
            const size = 10 + Math.random() * 10;

            ctx.fillStyle = this.adjustColor(baseColor, Math.random() * 20 - 10);
            ctx.beginPath();
            ctx.moveTo(x, y - size);
            ctx.lineTo(x + size, y);
            ctx.lineTo(x, y + size);
            ctx.lineTo(x - size, y);
            ctx.closePath();
            ctx.fill();
        }
    }

    generateGrassTuftTexture(ctx, width, height, baseColor) {
        for (let i = 0; i < 8; i++) {
            const x = 10 + Math.random() * (width - 20);
            const y = height - 10;
            
            ctx.strokeStyle = baseColor;
            ctx.lineWidth = 2;
            
            for (let j = 0; j < 3; j++) {
                const angle = -Math.PI/2 + (Math.random() * 0.5 - 0.25);
                const length = 15 + Math.random() * 10;
                
                ctx.beginPath();
                ctx.moveTo(x + j * 4 - 4, y);
                ctx.lineTo(
                    x + j * 4 - 4 + Math.cos(angle) * length,
                    y + Math.sin(angle) * length
                );
                ctx.stroke();
            }
        }
    }

    adjustColor(hex, amount) {
        const rgb = this.hexToRgb(hex);
        rgb.r = Math.max(0, Math.min(255, rgb.r + amount));
        rgb.g = Math.max(0, Math.min(255, rgb.g + amount));
        rgb.b = Math.max(0, Math.min(255, rgb.b + amount));
        return `rgb(${Math.round(rgb.r)},${Math.round(rgb.g)},${Math.round(rgb.b)})`;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    getTextureForTile(tile) {
        if (!tile || !tile.type) {
            this.logDebug('TileManager: Invalid tile or missing type', 'logTextureErrors');
            return this.createFallbackTexture('default');
        }

        let texture;

        // Try to get variant texture if specified
        if (tile.variant) {
            texture = this.textures.get(tile.variant);
            if (texture) {
                return texture;
            }
            this.logDebug(`TileManager: Variant texture not found: ${tile.variant}`, 'logTextureErrors');
        }

        // Try to get base texture
        texture = this.textures.get(tile.type);
        if (texture) {
            return texture;
        }

        // Log missing texture
        this.logDebug(`TileManager: Missing texture for type: ${tile.type}`, 'logTextureErrors');

        // Create and cache fallback texture
        const fallbackKey = `fallback_${tile.type}`;
        if (!this.textures.has(fallbackKey)) {
            const fallbackTexture = this.createFallbackTexture(tile.type);
            this.textures.set(fallbackKey, fallbackTexture);
            this.logDebug(`TileManager: Created fallback texture for: ${tile.type}`, 'logTextureErrors');
        }

        return this.textures.get(fallbackKey);
    }

    getRandomVariant(tileType) {
        const variants = this.tileVariants[tileType];
        if (variants === undefined) {
            this.logger.log(`No variants defined for tile type: ${tileType}`, 'logTextureErrors');
            return 0;
        }
        return Math.floor(Math.random() * variants);
    }

    getRandomDecoration(tileType, tileId) {
        // Early return for water tiles
        if (tileType === 'water') {
            return null;
        }

        const decorations = this.tileDecorations[tileType];
        if (!decorations || decorations.length === 0) {
            return null;
        }

        // Generate deterministic random value based on tileId
        const randomValue = this.generateRandomForTile(tileId);
        
        if (this.debug?.flags?.logDecorations) {
            console.log(`[DEBUG] TileManager: Random value for tile ${tileId}: ${randomValue}`);
        }

        // Find first decoration whose chance threshold is higher than our random value
        for (const decoration of decorations) {
            if (randomValue < decoration.chance) {
                return { ...decoration };
            }
        }

        return null;
    }

    generateRandomForTile(tileId) {
        const hash = this.hashTileId(tileId);
        return (Math.abs(Math.sin(hash)) * 10000) % 1;
    }

    hashTileId(tileId) {
        let hash = 0;
        for (let i = 0; i < tileId.length; i++) {
            hash = ((hash << 5) - hash) + tileId.charCodeAt(i);
            hash = hash & hash;
        }
        return hash + this.decorationSeed;
    }

    getDecorationTexture(decorationType) {
        const texture = this.decorationTextures.get(decorationType);
        if (texture) {
            return texture;
        }

        // Log missing decoration texture
        this.logDebug(`TileManager: Missing decoration texture: ${decorationType}`, 'logTextureErrors');

        // Create and cache fallback decoration texture
        const fallbackKey = `fallback_decoration_${decorationType}`;
        if (!this.decorationTextures.has(fallbackKey)) {
            const fallbackTexture = this.createFallbackTexture('decoration');
            this.decorationTextures.set(fallbackKey, fallbackTexture);
            this.logDebug(`TileManager: Created fallback decoration texture for: ${decorationType}`, 'logTextureErrors');
        }

        return this.decorationTextures.get(fallbackKey);
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

    determineTileType(height, moisture) {
        if (height < 0.05) return 'water';
        if (height < 0.2) return 'sand';
        if (height < 0.7) {
            if (moisture > 0.7) return 'wetland';
            if (moisture > 0.3) return 'grass';
            return 'dirt';
        }
        return 'stone';
    }

    getRoadVariant(type, direction) {
        if (!direction) return `${type}_straight`;
        
        const variants = {
            asphalt: {
                'N-S': 'asphalt_vertical',
                'E-W': 'asphalt_horizontal',
                'NE': 'asphalt_curve_ne',
                'NW': 'asphalt_curve_nw',
                'SE': 'asphalt_curve_se',
                'SW': 'asphalt_curve_sw',
                'intersection': 'asphalt_intersection'
            },
            sidewalk: {
                'N-S': 'sidewalk_vertical',
                'E-W': 'sidewalk_horizontal',
                'NE': 'sidewalk_corner_ne',
                'NW': 'sidewalk_corner_nw',
                'SE': 'sidewalk_corner_se',
                'SW': 'sidewalk_corner_sw',
                'intersection': 'sidewalk_intersection'
            }
        };

        return variants[type]?.[direction] || `${type}_default`;
    }
}













