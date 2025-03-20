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
        const textures = [
            'grass', 'grass_var1', 'grass_var2',
            'dirt', 'dirt_var1', 'dirt_var2',
            'stone', 'stone_mossy', 'stone_cracked',
            'sand', 'sand_var1', 'wetland', 'wetland_var1',
            'water', 'water_var1', 'dec_flowers', 'dec_rocks', 'dec_grassTufts'
        ];

        await Promise.all(textures.map(name => this.loadTexture(name, `assets/textures/${name}.png`)));
        console.log('TileManager: All textures loaded successfully.');
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

        // Use the pre-determined variant if it exists
        if (tile.variant) {
            return this.textures.get(tile.variant);
        }

        // Fallback to base texture
        return this.textures.get(tile.type);
    }

    getRandomVariant(tileType) {
        const variants = this.textureVariants[tileType];
        if (!variants) return tileType;

        // Select a random variant once
        return variants[Math.floor(Math.random() * variants.length)];
    }

    getRandomDecoration(tileType) {
        const possibleDecorations = this.decorations[tileType];
        if (!possibleDecorations) return null;

        for (const decoration of possibleDecorations) {
            if (Math.random() < decoration.chance) {
                return {
                    type: decoration.type,
                    offset: { ...decoration.offset },
                    scale: { ...decoration.scale }
                };
            }
        }
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












