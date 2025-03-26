export class TileManager {
    constructor(debug = false) {
        this.debug = debug;
        this.textures = new Map();
        
        // Define variants for each tile type
        this.variants = {
            grass: 3,    // 3 variants of grass
            dirt: 2,     // 2 variants of dirt
            sand: 2,     // 2 variants of sand
            forest: 2,   // 2 variants of forest
            mountain: 2, // 2 variants of mountain
            water: 1,    // 1 variant of water
            wetland: 2   // 2 variants of wetland
        };

        // Define base colors for each tile type
        this.tileColors = {
            grass: '#4CAF50',
            dirt: '#795548',
            sand: '#FDD835',
            forest: '#2E7D32',
            mountain: '#757575',
            water: '#1976D2',
            wetland: '#558B2F'
        };
        
        // Create temporary canvas for texture generation
        this.tempCanvas = document.createElement('canvas');
        this.tempCanvas.width = 64;  // Standard tile size
        this.tempCanvas.height = 32;  // Isometric tile height
        this.tempCtx = this.tempCanvas.getContext('2d');

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
            
            // Generate base texture
            loadPromises.push(this.generateTexture(tileType, baseColor));

            // Generate variant textures
            for (let i = 1; i <= variantCount; i++) {
                const variantKey = `${tileType}_var${i}`;
                // Slightly modify the color for variants
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
            const width = this.tempCanvas.width;
            const height = this.tempCanvas.height;
            
            // Clear canvas
            this.tempCtx.clearRect(0, 0, width, height);

            // Fill with base color
            this.tempCtx.fillStyle = baseColor;
            this.tempCtx.fillRect(0, 0, width, height);

            // Add subtle noise pattern
            this.tempCtx.fillStyle = this.adjustColor(baseColor, 10);
            const pattern = this.tempCtx.createPattern(this.createNoisePattern(baseColor), 'repeat');
            this.tempCtx.fillStyle = pattern;
            this.tempCtx.globalAlpha = 0.3;
            this.tempCtx.fillRect(0, 0, width, height);
            this.tempCtx.globalAlpha = 1.0;

            // Create image from canvas
            const img = new Image();
            img.onload = () => {
                this.textures.set(name, img);
                resolve();
            };
            img.src = this.tempCanvas.toDataURL();
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





















