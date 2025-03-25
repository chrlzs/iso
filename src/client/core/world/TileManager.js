import { DebugLogger } from '../utils/DebugLogger.js';

export class TileManager {
    constructor(debug) {
        this.logger = new DebugLogger(debug || { enabled: false, flags: {} });
        
        // Replace direct console.log with logger
        this.logDebug = (message, flag = null) => {
            this.logger.log(message, flag);
        };

        this.textures = new Map();
        this.logDebug('TileManager: Initializing...', 'logTextureLoading');
        
        // Define possible decorations for each tile type
        this.decorations = {
            grass: [
                { type: 'dec_flowers', chance: 0.1, offset: { x: 0, y: -8 }, scale: { x: 0.5, y: 0.5 } },
                { type: 'dec_grassTufts', chance: 0.2, offset: { x: 0, y: -6 }, scale: { x: 0.7, y: 0.7 } }
            ],
            dirt: [
                { type: 'dec_rocks', chance: 0.15, offset: { x: 0, y: -4 }, scale: { x: 0.6, y: 0.6 } }
            ],
            stone: [
                { type: 'dec_rocks', chance: 0.3, offset: { x: 0, y: -4 }, scale: { x: 0.8, y: 0.8 } }
            ]
        };

        // Initialize decoration caches
        this.decorationCache = new Map();
        this.persistentDecorations = new Map();
        this.decorationBatch = new Map();
        
        // Add seeded random number generator for consistent decoration placement
        this.decorationSeed = 12345;
        this.getSeededRandom = (tileId) => {
            const hash = tileId.split('_').reduce((acc, val) => {
                return acc + parseInt(val, 36);
            }, this.decorationSeed);
            return ((Math.sin(hash) + 1) / 2);
        };

        // Initialize base texture maps
        this.textureVariants = new Map();
        this.decorationTextures = new Map();
        
        // Add method to load and store decoration textures
        this.loadDecorationTexture = async (name) => {
            const texture = await this.loadTexture(name, `assets/textures/${name}.png`);
            this.decorationTextures.set(name, texture);
            //console.log(`TileManager: Loaded decoration texture: ${name}`);
            return texture;
        };

        // Add method to get decoration texture with error handling
        this.getDecorationTexture = (name) => {
            const texture = this.decorationTextures.get(name);
            if (!texture) {
                console.warn(`TileManager: Decoration texture not found: ${name}`);
                return this.createTempTexture('#FF00FF'); // Return fallback texture
            }
            //console.log(`TileManager: Retrieved decoration texture: ${name}`);
            return texture;
        };

        // Initialize decoration texture tracking
        this.decorationTextureStatus = {
            loaded: new Set(),
            failed: new Set(),
            pending: new Set()
        };

        // Define texture variants for each tile type
        this.textureVariants.set('grass', ['grass', 'grass_var1', 'grass_var2']);
        this.textureVariants.set('dirt', ['dirt', 'dirt_var1', 'dirt_var2']);
        this.textureVariants.set('stone', ['stone', 'stone_mossy', 'stone_cracked']);
        this.textureVariants.set('sand', ['sand', 'sand_var1']);
        this.textureVariants.set('wetland', ['wetland', 'wetland_var1']);
        this.textureVariants.set('water', ['water', 'water_var1']);
        this.textureVariants.set('asphalt', ['asphalt', 'asphalt_cracked']);
        this.textureVariants.set('concrete', ['concrete', 'concrete_stained']);
        this.textureVariants.set('sidewalk', ['sidewalk', 'sidewalk_tiled']);
        this.textureVariants.set('brick', ['brick', 'brick_modern']);
        this.textureVariants.set('metal', ['metal', 'metal_rusted']);

        // Add method to get or create persistent decoration
        this.getPersistentDecoration = (tileId, tileType) => {
            // Early return if we already made a decision for this tile
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
        };

        // Add debug logging for zoom operations
        this.lastZoomLevel = 1;
        this.debugZoom = (newZoom) => {
            if (!this.debug.enabled || !this.debug.flags.logZoomChanges) return;
            
            if (newZoom !== this.lastZoomLevel) {
                this.logDebug(`TileManager: Zoom changed from ${this.lastZoomLevel} to ${newZoom}`, 'logZoomChanges');
                this.logDebug(`TileManager: Decoration cache size: ${this.persistentDecorations.size}`, 'logZoomChanges');
                this.lastZoomLevel = newZoom;
            }
        };

        // Add a decoration texture cache
        this.decorationTextureCache = new Map();

        this.lastDecorationUpdate = 0;
        this.decorationUpdateInterval = 16; // ~60fps

        // Initialize decoration system
        this.decorationSystem = {
            enabled: true,
            lastUpdate: 0,
            updateInterval: 100  // ms between decoration updates
        };

        // Method to get decoration for a specific tile
        this.getDecorationForTile = (tileId, tileType) => {
            // Check cache first
            const cachedDecoration = this.decorationCache.get(tileId);
            if (cachedDecoration !== undefined) {
                return cachedDecoration;
            }

            // Get persistent decoration
            const decoration = this.getPersistentDecoration(tileId, tileType);
            
            // Cache the result (even if null)
            this.decorationCache.set(tileId, decoration);
            
            return decoration;
        };

        // Method to clear decoration cache
        this.clearDecorationCache = () => {
            this.decorationCache.clear();
            //console.log('TileManager: Decoration cache cleared');
        };

        // Method to batch decorations by height
        this.batchDecorations = (decorations) => {
            this.decorationBatch.clear();
            decorations.forEach(dec => {
                const key = `${dec.type}_${dec.offset.y}`;
                if (!this.decorationBatch.has(key)) {
                    this.decorationBatch.set(key, []);
                }
                this.decorationBatch.get(key).push(dec);
            });
            return this.decorationBatch;
        };

        // Initialize texture loading state
        this.texturesLoaded = false;
        this.loadingErrors = new Map();
        this.textureLoadPromises = new Map();

        // Initialize decoration loading state
        this.decorationTexturesLoaded = false;
        this.decorationLoadQueue = new Set([
            'dec_rocks',
            'dec_flowers',
            'dec_grassTufts'
        ]);

        // Add method to preload all decoration textures
        this.preloadDecorationTextures = async () => {
            const loadPromises = Array.from(this.decorationLoadQueue).map(name => 
                this.loadDecorationTexture(name).catch(err => {
                    console.error(`Failed to load decoration texture: ${name}`, err);
                    this.loadingErrors.set(name, err);
                })
            );
            
            await Promise.all(loadPromises);
            this.decorationTexturesLoaded = true;
            console.log('TileManager: All decoration textures loaded');
        };

        // Start loading decoration textures immediately
        this.preloadDecorationTextures();

        // Initialize texture quality settings
        this.textureQuality = {
            mipMapping: true,
            filtering: 'bilinear',
            maxSize: 2048
        };

        // Setup texture loading queue
        this.loadingQueue = [];
        this.maxConcurrentLoads = 4;
        this.activeLoads = 0;

        // Initialize texture stats for monitoring
        this.textureStats = {
            totalLoaded: 0,
            totalSize: 0,
            lastLoadTime: 0
        };

        // Setup error handling
        this.handleTextureError = (textureName, error) => {
            console.warn(`Failed to load texture: ${textureName}`, error);
            this.loadingErrors.set(textureName, error);
            return this.createTempTexture('#FF00FF'); // Return pink texture as fallback
        };

        // Expanded tile configurations
        this.tileConfigs = {
            concrete: {
                color: '#A8A8A8',
                secondaryColor: '#989898',
                texturePattern: 'concrete',
                variants: ['cracked', 'smooth', 'stained']
            },
            asphalt: {
                color: '#454545',
                secondaryColor: '#353535',
                texturePattern: 'asphalt',
                variants: ['new', 'worn', 'marked']
            },
            brick: {
                color: '#8B4513',
                secondaryColor: '#A0522D',
                texturePattern: 'brick',
                variants: ['red', 'gray', 'worn']
            },
            metal: {
                color: '#71797E',
                secondaryColor: '#848884',
                texturePattern: 'metal',
                variants: ['smooth', 'rusted', 'grated']
            },
            sidewalk: {
                color: '#C0C0C0',
                secondaryColor: '#B8B8B8',
                texturePattern: 'sidewalk',
                variants: ['plain', 'tiled', 'decorated']
            },
            // Keep existing natural tiles but reduce their frequency
            grass: { /* existing config */ },
            dirt: { /* existing config */ },
            stone: { /* existing config */ },
            sand: { /* existing config */ },
            water: { /* existing config */ },
            wetland: { /* existing config */ }
        };

        // Modified tile type determination method
        this.determineTileType = (height, moisture, urbanFactor = 0) => {
            // urbanFactor is a new parameter (0-1) indicating proximity to urban centers
            
            // If in highly urban area, prefer urban tiles
            if (urbanFactor > 0.7) {
                if (height < 0.05) return 'asphalt';  // Reduced from 0.2
                if (height < 0.4) return 'concrete';
                if (height < 0.6) return 'sidewalk';
                if (height < 0.8) return 'brick';
                return 'metal';
            }
            
            // Mixed urban-natural area
            if (urbanFactor > 0.3) {
                if (height < 0.05) return 'water';  // Reduced from 0.1
                if (height < 0.3) return 'concrete';
                if (height < 0.5) return moisture > 0.5 ? 'grass' : 'sidewalk';
                if (height < 0.7) return moisture > 0.6 ? 'brick' : 'asphalt';
                return 'metal';
            }
            
            // Original natural determination for less urban areas
            if (height < 0.05) return 'water';  // Reduced from 0.1
            if (height < 0.2) return 'sand';
            if (height < 0.7) {
                if (moisture > 0.7) return 'wetland';  // Increased from 0.6
                if (moisture > 0.3) return 'grass';
                return 'dirt';
            }
            return 'stone';
        };

        // Structure textures configuration
        this.structureConfigs = {
            'apartment': {
                'wall': {
                    color: '#808080',
                    secondaryColor: '#909090',
                    texturePattern: 'concrete'
                },
                'door': {
                    color: '#4A4A4A',
                    secondaryColor: '#5A5A5A',
                    texturePattern: 'metal'
                },
                'floor': {
                    color: '#C0C0C0',
                    secondaryColor: '#D0D0D0',
                    texturePattern: 'tiles'
                }
            },
            'nightclub': {
                'wall': {
                    color: '#202020',
                    secondaryColor: '#303030',
                    texturePattern: 'metal'
                },
                'door': {
                    color: '#404040',
                    secondaryColor: '#505050',
                    texturePattern: 'security'
                },
                'floor': {
                    color: '#101010',
                    secondaryColor: '#202020',
                    texturePattern: 'neon'
                }
            }
        };

        this.initializeStructureTextures();
    }

    updateDecorations(timestamp) {
        if (timestamp - this.lastDecorationUpdate < this.decorationUpdateInterval) {
            return;
        }
        this.lastDecorationUpdate = timestamp;
        // Perform decoration updates
    }

    createFallbackTexture(tileType) {
        // Create a canvas for the fallback texture
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Define fallback colors for different tile types
        const fallbackColors = {
            grass: { primary: '#2d5a27', secondary: '#234a1f' },
            dirt: { primary: '#8b4513', secondary: '#6b3410' },
            stone: { primary: '#808080', secondary: '#696969' },
            sand: { primary: '#f4a460', secondary: '#daa520' },
            water: { primary: '#4169e1', secondary: '#1e90ff' },
            wetland: { primary: '#2f4f4f', secondary: '#3d6060' },
            asphalt: { primary: '#363636', secondary: '#292929' },
            concrete: { primary: '#808080', secondary: '#707070' },
            sidewalk: { primary: '#C0C0C0', secondary: '#A9A9A9' },
            brick: { primary: '#8B4513', secondary: '#A0522D' },
            metal: { primary: '#708090', secondary: '#778899' },
            default: { primary: '#FF00FF', secondary: '#FF69B4' } // Pink for unknown types
        };

        const colors = fallbackColors[tileType] || fallbackColors.default;

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

        // Add a border
        ctx.strokeStyle = colors.secondary;
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, 62, 62);

        // Add type label for debugging
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '10px Arial';
        ctx.fillText(tileType, 4, 12);

        return canvas;
    }

    async loadTextures() {
        this.logDebug('TileManager: Starting texture loading...', 'logTextureLoading');
        const textures = [
            'grass', 'grass_var1', 'grass_var2',
            'dirt', 'dirt_var1', 'dirt_var2',
            'stone', 'stone_mossy', 'stone_cracked',
            'sand', 'sand_var1', 'wetland', 'wetland_var1',
            'water', 'water_var1', 'dec_flowers', 'dec_rocks', 'dec_grassTufts'
        ];

        for (const name of textures) {
            try {
                await this.loadTexture(name, `assets/textures/${name}.png`);
                this.logDebug(`TileManager: Successfully loaded texture: ${name}`, 'logTextureLoading');
            } catch (error) {
                console.error(`TileManager: Failed to load texture: ${name}`, error);
            }
        }
        this.logDebug('TileManager: All textures loaded successfully.', 'logTextureLoading');
    }

    async loadTexture(name, path) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.logDebug(`TileManager: Successfully loaded texture: ${path}`, 'logTextureLoading');
                this.textures.set(name, img);
                resolve(img);
            };
            img.onerror = (error) => {
                console.error(`TileManager: Failed to load texture: ${path}`, error);
                reject(new Error(`Failed to load texture: ${path}`));
            };
            img.src = path;
        });
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
        const variants = this.textureVariants[tileType];
        if (!variants) return tileType;

        // Select a random variant once and cache it on the tile
        const variant = variants[Math.floor(Math.random() * variants.length)];
        return variant;
    }

    getRandomDecoration(tileType, tileId) {
        if (!tileType || !tileId) return null;
        
        // Use the persistent decoration system
        return this.getPersistentDecoration(tileId, tileType);
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

    createStructureTexture(primaryColor, secondaryColor, pattern) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        switch (pattern) {
            case 'brick':
                this.drawBrickPattern(ctx, primaryColor, secondaryColor);
                break;
            case 'wood':
                this.drawWoodPattern(ctx, primaryColor, secondaryColor);
                break;
            case 'stone':
                this.drawStonePattern(ctx, primaryColor, secondaryColor);
                break;
            case 'planks':
                this.drawPlanksPattern(ctx, primaryColor, secondaryColor);
                break;
            case 'tiles':
                this.drawTilesPattern(ctx, primaryColor, secondaryColor);
                break;
            default:
                // Fallback to solid color
                ctx.fillStyle = primaryColor;
                ctx.fillRect(0, 0, 64, 64);
        }

        return canvas;
    }

    drawBrickPattern(ctx, primaryColor, secondaryColor) {
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, 0, 64, 64);

        ctx.fillStyle = secondaryColor;
        for (let y = 0; y < 64; y += 16) {
            for (let x = 0; x < 64; x += 32) {
                ctx.fillRect(x + (y % 32 ? 16 : 0), y, 28, 14);
            }
        }
    }

    drawWoodPattern(ctx, primaryColor, secondaryColor) {
        // Fill background
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, 0, 64, 64);

        // Draw wood grain
        ctx.fillStyle = secondaryColor;
        for (let y = 0; y < 64; y += 8) {
            ctx.beginPath();
            // Create wavy lines for wood grain
            ctx.moveTo(0, y);
            for (let x = 0; x < 64; x += 16) {
                ctx.quadraticCurveTo(
                    x + 8, y + Math.sin(x * 0.1) * 4,
                    x + 16, y
                );
            }
            ctx.stroke();
        }
    }

    drawStonePattern(ctx, primaryColor, secondaryColor) {
        // Fill background
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, 0, 64, 64);

        // Draw stone blocks
        ctx.fillStyle = secondaryColor;
        for (let y = 0; y < 64; y += 16) {
            for (let x = 0; x < 64; x += 16) {
                const offset = y % 32 ? 8 : 0;
                ctx.beginPath();
                ctx.rect(x + offset, y, 14, 14);
                ctx.stroke();
                
                // Add some texture inside each stone
                ctx.fillStyle = `rgba(0,0,0,0.1)`;
                ctx.fillRect(x + offset + 2, y + 2, 10, 10);
            }
        }
    }

    drawPlanksPattern(ctx, primaryColor, secondaryColor) {
        // Fill background
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, 0, 64, 64);

        // Draw planks
        ctx.fillStyle = secondaryColor;
        for (let y = 0; y < 64; y += 8) {
            // Plank separator lines
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(64, y);
            ctx.strokeStyle = secondaryColor;
            ctx.stroke();

            // Wood grain on each plank
            for (let x = 0; x < 64; x += 32) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + 30, y + 4);
                ctx.strokeStyle = `rgba(0,0,0,0.1)`;
                ctx.stroke();
            }
        }
    }

    drawTilesPattern(ctx, primaryColor, secondaryColor) {
        // Fill background
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, 0, 64, 64);

        // Draw tiles
        for (let y = 0; y < 64; y += 8) {
            for (let x = 0; x < 64; x += 8) {
                const isAlternate = (x + y) % 16 === 0;
                ctx.fillStyle = isAlternate ? secondaryColor : primaryColor;
                ctx.fillRect(x, y, 7, 7);
            }
        }
    }

    initializeStructureTextures() {
        for (const [structureType, parts] of Object.entries(this.structureConfigs)) {
            for (const [partType, config] of Object.entries(parts)) {
                const texture = this.createStructureTexture(
                    config.color,
                    config.secondaryColor,
                    config.texturePattern
                );
                this.textures.set(`structure_${structureType}_${partType}`, texture);
            }
        }
    }

    getStructureTexture(type, part) {
        return this.textures.get(`structure_${type}_${part}`);
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

    // Add new method to calculate urban factor
    calculateUrbanFactor(x, y, structures) {
        let urbanFactor = 0;
        const URBAN_RADIUS = 20; // Radius to check for urban influence
        
        // Calculate based on proximity to urban structures
        for (const structure of structures) {
            const distance = Math.sqrt(
                Math.pow(x - structure.x, 2) + 
                Math.pow(y - structure.y, 2)
            );
            
            if (distance < URBAN_RADIUS) {
                // Structures like 'apartment' or 'nightclub' increase urban factor
                const structureUrbanWeight = {
                    'apartment': 1.0,
                    'nightclub': 0.8,
                    'office': 0.9,
                    'factory': 0.7
                }[structure.type] || 0.5;
                
                urbanFactor += (1 - distance/URBAN_RADIUS) * structureUrbanWeight;
            }
        }
        
        return Math.min(1, urbanFactor);
    }

    determineTileType(height, moisture, urbanFactor = 0) {
        // If in highly urban area, prefer urban tiles
        if (urbanFactor > 0.7) {
            if (height < 0.05) return 'asphalt';  // Reduced from 0.2
            if (height < 0.4) return 'concrete';
            if (height < 0.6) return 'sidewalk';
            if (height < 0.8) return 'brick';
            return 'metal';
        }
        
        // Mixed urban-natural area
        if (urbanFactor > 0.3) {
            if (height < 0.05) return 'water';  // Reduced from 0.1
            if (height < 0.3) return 'concrete';
            if (height < 0.5) return moisture > 0.5 ? 'grass' : 'sidewalk';
            if (height < 0.7) return moisture > 0.6 ? 'brick' : 'asphalt';
            return 'metal';
        }
        
        // Original natural determination for less urban areas
        if (height < 0.05) return 'water';  // Reduced from 0.1
        if (height < 0.2) return 'sand';
        if (height < 0.7) {
            if (moisture > 0.7) return 'wetland';  // Increased from 0.6
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



