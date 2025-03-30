export class TileManager {
    constructor(debug = false) {
        this.debug = debug;
        this.textures = new Map();
        
        // Define variants for each tile type
        this.variants = {
            // Natural tiles
            grass: 3,
            dirt: 2,
            sand: 2,
            forest: 2,
            mountain: 2,
            water: 1,
            wetland: 2,
            
            // Urban tiles
            concrete: 3,     // Different wear patterns
            asphalt: 3,      // Various road textures
            metal: 2,        // Industrial flooring
            tiles: 2,        // Urban plaza tiles
            gravel: 2,       // Construction areas
            solar: 1,        // Solar panel arrays
            garden: 2,       // Urban gardens/parks
            
            // Special tiles
            door: 1,
            helipad: 1,
            parking: 1,
            dumpster: 1
        };

        // Define base colors for each tile type
        this.tileColors = {
            // Natural colors
            grass: '#4CAF50',
            dirt: '#795548',
            sand: '#FDD835',
            forest: '#2E7D32',
            mountain: '#757575',
            water: '#1976D2',
            wetland: '#558B2F',
            
            // Urban colors
            concrete: '#9E9E9E',  // Medium gray
            asphalt: '#424242',   // Dark gray
            metal: '#B0BEC5',     // Bluish gray
            tiles: '#78909C',     // Cool gray
            gravel: '#707070',    // Warm gray
            solar: '#1A237E',     // Deep blue
            garden: '#66BB6A',    // Light green
            
            // Special colors
            door: '#FFD700',      // Gold
            helipad: '#F57F17',   // Orange
            parking: '#37474F',    // Dark blue-gray
            dumpster: '#696969'   // Dark gray for dumpster
        };

        // Track loaded textures
        this.texturesLoaded = false;
    }

    async loadTextures() {
        if (this.debug?.flags?.logTextureLoading) {
            console.log('TileManager: Loading textures...');
        }

        const loadPromises = [];

        // Generate textures for each tile type and its variants
        for (const [tileType, variantCount] of Object.entries(this.variants)) {
            const baseColor = this.tileColors[tileType];
            
            // Generate base texture using AssetManager
            loadPromises.push(this.generateTexture(tileType, baseColor));

            // Generate variant textures
            for (let i = 1; i <= variantCount; i++) {
                const variantKey = `${tileType}_var${i}`;
                const variantColor = this.adjustColor(baseColor, i * 5);
                loadPromises.push(this.generateTexture(variantKey, variantColor));
            }
        }

        try {
            await Promise.all(loadPromises);
            this.texturesLoaded = true;
            if (this.debug?.flags?.logTextureLoading) {
                console.log('TileManager: All textures loaded successfully');
            }
        } catch (error) {
            console.error('TileManager: Failed to load textures:', error);
            throw error;
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

                    // Fill with base color
                    ctx.fillStyle = baseColor;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Add subtle noise pattern
                    ctx.fillStyle = this.adjustColor(baseColor, 10);
                    const pattern = ctx.createPattern(this.createNoisePattern(baseColor), 'repeat');
                    ctx.fillStyle = pattern;
                    ctx.globalAlpha = 0.3;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.globalAlpha = 1.0;
                }
            );
            
            this.textures.set(name, texture);
            resolve();
        });
    }

    createNoisePattern(baseColor) {
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = 4;
        patternCanvas.height = 4;
        const patternCtx = patternCanvas.getContext('2d');

        patternCtx.fillStyle = this.adjustColor(baseColor, 5);
        patternCtx.fillRect(0, 0, 2, 2);
        patternCtx.fillRect(2, 2, 2, 2);

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

    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
}



























