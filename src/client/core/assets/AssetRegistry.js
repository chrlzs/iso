import { TileTexture } from './textures/TileTexture.js';
import { StructureTexture } from './textures/StructureTexture.js';
import { CharacterTexture } from './textures/CharacterTexture.js';
import { TileModel } from './models/TileModel.js';
import { StructureModel } from './models/StructureModel.js';
import { CharacterModel } from './models/CharacterModel.js';

/**
 * Registry for game assets (textures, models, etc.)
 * @class AssetRegistry
 */
export class AssetRegistry {
    /**
     * Creates a new AssetRegistry instance
     * @param {AssetManager} assetManager - Asset manager instance
     */
    constructor(assetManager) {
        this.assetManager = assetManager;
        this.textures = new Map();
        this.models = new Map();
        this.initialized = false;
    }

    /**
     * Creates and registers a tile texture
     * @param {string} id - Unique identifier for the texture
     * @param {Object} options - Texture options
     * @returns {TileTexture} The created texture
     */
    createTileTexture(id, options) {
        const texture = new TileTexture(id, options);
        this.textures.set(`tile_${id}`, texture);
        return texture;
    }

    /**
     * Creates and registers a structure texture
     * @param {string} id - Unique identifier for the texture
     * @param {Object} options - Texture options
     * @returns {StructureTexture} The created texture
     */
    createStructureTexture(id, options) {
        const texture = new StructureTexture(id, options);
        this.textures.set(`structure_${id}`, texture);
        return texture;
    }

    /**
     * Creates and registers a character texture
     * @param {string} id - Unique identifier for the texture
     * @param {Object} options - Texture options
     * @returns {CharacterTexture} The created texture
     */
    createCharacterTexture(id, options) {
        const texture = new CharacterTexture(id, options);
        this.textures.set(`character_${id}`, texture);
        return texture;
    }

    /**
     * Gets a texture by ID
     * @param {string} id - Texture identifier
     * @returns {TextureBase|null} The texture or null if not found
     */
    getTexture(id) {
        return this.textures.get(id) || null;
    }

    /**
     * Creates and registers a tile model
     * @param {string} id - Unique identifier for the model
     * @param {Object} options - Model options
     * @returns {TileModel} The created model
     */
    createTileModel(id, options) {
        const model = new TileModel(id, options);
        this.models.set(`tile_${id}`, model);
        return model;
    }

    /**
     * Creates and registers a structure model
     * @param {string} id - Unique identifier for the model
     * @param {Object} options - Model options
     * @returns {StructureModel} The created model
     */
    createStructureModel(id, options) {
        const model = new StructureModel(id, options);
        this.models.set(`structure_${id}`, model);
        return model;
    }

    /**
     * Creates and registers a character model
     * @param {string} id - Unique identifier for the model
     * @param {Object} options - Model options
     * @returns {CharacterModel} The created model
     */
    createCharacterModel(id, options) {
        const model = new CharacterModel(id, options);
        this.models.set(`character_${id}`, model);
        return model;
    }

    /**
     * Gets a model by ID
     * @param {string} id - Model identifier
     * @returns {ModelBase|null} The model or null if not found
     */
    getModel(id) {
        return this.models.get(id) || null;
    }

    /**
     * Initializes default assets
     * @async
     * @returns {Promise<void>} A promise that resolves when all default assets are initialized
     */
    async initializeDefaultAssets() {
        if (this.initialized) {
            return;
        }

        // Create default tile textures
        const grassTexture = this.createTileTexture('grass', {
            color: '#4CAF50',
            noiseIntensity: 0.3,
            roughness: 0.7
        });

        const dirtTexture = this.createTileTexture('dirt', {
            color: '#8B4513',
            noiseIntensity: 0.4,
            roughness: 0.8
        });

        const waterTexture = this.createTileTexture('water', {
            color: '#2196F3',
            noiseIntensity: 0.2,
            roughness: 0.3
        });

        // Create default structure textures
        const houseTexture = this.createStructureTexture('house', {
            structureType: 'house',
            floors: 1,
            wallColor: '#d2b48c',
            roofColor: '#8b4513'
        });

        const shopTexture = this.createStructureTexture('shop', {
            structureType: 'shop',
            floors: 1,
            wallColor: '#f5f5dc',
            roofColor: '#a52a2a'
        });

        const treeTexture = this.createStructureTexture('tree', {
            structureType: 'tree'
        });

        // Create default character textures
        const playerTexture = this.createCharacterTexture('player', {
            characterType: 'player',
            isAnimated: true,
            frames: 4,
            directions: ['down', 'left', 'right', 'up']
        });

        const npcTexture = this.createCharacterTexture('npc', {
            characterType: 'npc',
            isAnimated: true,
            frames: 4,
            directions: ['down', 'left', 'right', 'up']
        });

        const enemyTexture = this.createCharacterTexture('enemy', {
            characterType: 'enemy',
            isAnimated: true,
            frames: 4,
            directions: ['down', 'left', 'right', 'up']
        });

        // Create default tile models
        const grassModel = this.createTileModel('grass', {
            tileType: 'grass',
            isWalkable: true,
            movementCost: 1
        });
        grassModel.addTexture('default', grassTexture);

        const dirtModel = this.createTileModel('dirt', {
            tileType: 'dirt',
            isWalkable: true,
            movementCost: 1.2
        });
        dirtModel.addTexture('default', dirtTexture);

        const waterModel = this.createTileModel('water', {
            tileType: 'water',
            isWalkable: false
        });
        waterModel.addTexture('default', waterTexture);

        // Create default structure models
        const houseModel = this.createStructureModel('house', {
            structureType: 'house',
            width: 2,
            height: 2,
            floors: 1,
            isWalkable: false,
            isEnterable: true
        });
        houseModel.addTexture('default', houseTexture);

        const shopModel = this.createStructureModel('shop', {
            structureType: 'shop',
            width: 3,
            height: 2,
            floors: 1,
            isWalkable: false,
            isEnterable: true
        });
        shopModel.addTexture('default', shopTexture);

        const treeModel = this.createStructureModel('tree', {
            structureType: 'tree',
            width: 1,
            height: 1,
            floors: 1,
            isWalkable: false,
            isEnterable: false
        });
        treeModel.addTexture('default', treeTexture);

        // Create default character models
        const playerModel = this.createCharacterModel('player', {
            characterType: 'player',
            isAnimated: true,
            animationSpeed: 0.1
        });
        playerModel.addTexture('default', playerTexture);

        const npcModel = this.createCharacterModel('npc', {
            characterType: 'npc',
            isAnimated: true,
            animationSpeed: 0.15
        });
        npcModel.addTexture('default', npcTexture);

        const enemyModel = this.createCharacterModel('enemy', {
            characterType: 'enemy',
            isAnimated: true,
            animationSpeed: 0.12
        });
        enemyModel.addTexture('default', enemyTexture);

        // Load all textures
        await Promise.all([
            grassTexture.load(this.assetManager),
            dirtTexture.load(this.assetManager),
            waterTexture.load(this.assetManager),
            houseTexture.load(this.assetManager),
            shopTexture.load(this.assetManager),
            treeTexture.load(this.assetManager),
            playerTexture.load(this.assetManager),
            npcTexture.load(this.assetManager),
            enemyTexture.load(this.assetManager)
        ]);

        this.initialized = true;
        console.log('Default assets initialized');
    }
}
