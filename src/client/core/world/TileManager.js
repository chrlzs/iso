export class TileManager {
    constructor() {
        console.log('TileManager: Initializing...');
        this.textures = new Map();
        this.textureVariants = {
            grass: ['grass', 'grass_var1', 'grass_var2'],
            dirt: ['dirt', 'dirt_var1', 'dirt_var2'],
            stone: ['stone', 'stone_mossy', 'stone_cracked'],
            sand: ['sand', 'sand_var1'],
            wetland: ['wetland', 'wetland_var1'],
            water: ['water', 'water_var1']
        };

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
    }

    // Temporary method for demo
    createTempTexture(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 64, 32);
        return canvas;
    }

    async loadTextures() {
        console.log('TileManager: Starting texture loading...');
        const baseTextures = [
            'grass', 'grass_var1', 'grass_var2',
            'dirt', 'dirt_var1', 'dirt_var2',
            'stone', 'stone_mossy', 'stone_cracked',
            'sand', 'sand_var1',
            'wetland', 'wetland_var1',
            'water', 'water_var1',
            // Add decoration textures
            'dec_flowers',
            'dec_rocks',
            'dec_grassTufts'
        ];

        try {
            console.log('TileManager: Loading textures from:', baseTextures);
            const loadPromises = baseTextures.map(name => {
                const path = `assets/textures/${name}.png`;
                console.log(`TileManager: Loading texture ${path}`);
                return this.loadTexture(name, path);
            });
            
            await Promise.all(loadPromises);
            console.log('TileManager: All textures loaded successfully. Texture count:', this.textures.size);

            // Add structure textures
            this.textures.set('structure_house_wall', this.createStructureTexture('#8B4513', '#654321'));
            this.textures.set('structure_house_door', this.createStructureTexture('#8B4513', '#4A2511'));
            this.textures.set('structure_tavern_wall', this.createStructureTexture('#A0522D', '#6B4423'));
            this.textures.set('structure_tavern_door', this.createStructureTexture('#A0522D', '#513121'));
            this.textures.set('structure_tavern_floor', this.createStructureTexture('#DEB887', '#D2691E'));
        } catch (error) {
            console.error('TileManager: Failed to load textures:', error);
            throw error; // Re-throw to handle in Game class
        }
    }

    async loadTexture(name, path) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log(`TileManager: Successfully loaded texture: ${path}`);
                this.textures.set(name, img);
                resolve();
            };
            img.onerror = () => {
                console.error(`TileManager: Failed to load texture: ${path}`);
                reject(new Error(`Failed to load texture: ${path}`));
            };
            img.src = path;
        });
    }

    getTextureForTile(tile) {
        if (!tile) return null;

        // Get base tile texture
        let textureName = tile.type;
        
        // Add variation if available
        if (Math.random() < 0.3) {
            const variantTexture = this.textures.get(`${tile.type}_var1`) || 
                                 this.textures.get(`${tile.type}_var2`);
            if (variantTexture) {
                return variantTexture;
            }
        }

        return this.textures.get(textureName);
    }

    getRandomVariant(tileType) {
        const variants = this.textureVariants[tileType];
        if (!variants) return tileType;
        return variants[Math.floor(Math.random() * variants.length)];
    }

    getRandomDecoration(tileType) {
        console.log(`Checking decorations for tile type: ${tileType}`);
        const possibleDecorations = this.decorations[tileType];
        if (!possibleDecorations) {
            console.log(`No decorations defined for tile type: ${tileType}`);
            return null;
        }

        // Use random number to determine if decoration should appear
        for (const decoration of possibleDecorations) {
            if (Math.random() < decoration.chance) {
                const result = {
                    type: decoration.type,
                    offset: { ...decoration.offset },
                    scale: { ...decoration.scale }
                };
                console.log(`Generated decoration for ${tileType}:`, result);
                return result;
            }
        }

        console.log(`No decoration generated for ${tileType} (random chance)`);
        return null;
    }

    getDecorationTexture(decorationType) {
        console.log('TileManager: Getting decoration texture for:', decorationType);
        const texture = this.textures.get(`dec_${decorationType}`);
        console.log('TileManager: Found texture:', !!texture);
        return texture;
    }

    createStructureTexture(primaryColor, secondaryColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Fill primary color
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, 0, 64, 64);

        // Add some detail with secondary color
        ctx.fillStyle = secondaryColor;
        ctx.fillRect(4, 4, 56, 56);

        return canvas;
    }

    getStructureTexture(type, part) {
        return this.textures.get(`structure_${type}_${part}`);
    }
}












