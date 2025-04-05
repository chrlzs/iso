import { World } from './world/World.js';
import { IsometricRenderer } from './renderer/IsometricRenderer.js';
import { TileManager } from './world/TileManager.js';
import { Player } from './entities/Player.js';
import { InputManager } from './engine/InputManager.js';
import { PathFinder } from './world/PathFinder.js';
import { NPC } from './entities/NPC.js';
import { Merchant } from './entities/Merchant.js';
import { UIManager } from './ui/UIManager.js';
import { MessageSystem } from './ui/MessageSystem.js';
import { InventoryUI } from './ui/components/InventoryUI.js';
import { MerchantUI } from './ui/components/MerchantUI.js';
import { MinimapUI } from './ui/components/MinimapUI.js';
import { Item } from './inventory/Item.js';
import { MapDefinition } from './world/MapDefinition.js';
import { TILE_WIDTH_HALF, TILE_HEIGHT_HALF } from './constants.js';
import { AssetManager } from './assets/AssetManager.js';
import { AssetRegistry } from './assets/AssetRegistry.js';
import { AssetCache } from './assets/AssetCache.js';
import { TextureAtlas } from './assets/TextureAtlas.js';
import { WebGLRenderer } from './renderer/WebGLRenderer.js';
import { SimplifiedRenderer } from './renderer/SimplifiedRenderer.js';
import { WorkerManager } from './workers/WorkerManager.js';
import { PerformanceMonitor } from './utils/PerformanceMonitor.js';
import { MemoryManager } from './utils/MemoryManager.js';
import { Vector2Pool } from './utils/Vector2Pool.js';
import { RectPool } from './utils/RectPool.js';
import { SpatialGrid } from './utils/SpatialGrid.js';
import { OcclusionCulling } from './renderer/OcclusionCulling.js';
import { RenderBatch } from './renderer/RenderBatch.js';
import { Logger } from './utils/Logger.js';
import { FPSStabilizer } from './utils/FPSStabilizer.js';
import { GameStateSnapshot } from './utils/GameStateSnapshot.js';
import { MinimalRenderer } from './renderer/MinimalRenderer.js';
import { createRemixedMap } from './world/templates/RemixedDemoMap.js';
import { TurnBasedCombatSystem } from './combat/TurnBasedCombatSystem.js';
import { CombatUI } from './ui/components/CombatUI.js';

/**
 * Core game instance managing all game systems and state
 * @class GameInstance
 */
export class GameInstance {
    /**
     * Creates a new game instance
     * @param {HTMLCanvasElement} canvas - The game's canvas element
     * @param {Object} [options={}] - Game initialization options
     * @param {string} [options.assetsBaseUrl] - Base URL for loading assets
     */
    constructor(canvas, options = {}) {
        this.logger = new Logger({
            enabled: true,
            level: 'info',
            productionMode: false, // Set to true in production
            throttleMs: 1000, // Throttle similar messages within 1 second
            maxHistory: 100
        });

        this.logger.info('Game: Initializing...');
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Set up canvas to prevent scrolling
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        document.body.style.overflow = 'hidden';
        document.body.style.margin = '0';
        document.body.style.padding = '0';

        // Initialize asset manager with texture configuration
        this.assetManager = new AssetManager({
            textureConfig: {
                baseSize: 64,
                mipMapping: true,
                filtering: 'trilinear'
            }
        });

        // Initialize asset registry
        this.assetRegistry = new AssetRegistry(this.assetManager);

        // Initialize asset cache for improved performance
        this.assetCache = new AssetCache({
            maxSize: 500,  // Store up to 500 assets
            ttl: 600000    // 10 minutes TTL
        });

        // Initialize texture atlas
        this.textureAtlas = new TextureAtlas(2048, 2048, 'gameAtlas');

        // Initialize worker manager for background processing
        this.workerManager = new WorkerManager();

        // Try to initialize pathfinding worker
        if (this.workerManager.isSupported) {
            try {
                // Use a more browser-friendly path (no leading slash)
                const workerPath = 'client/core/workers/PathfindingWorker.js';
                const success = this.workerManager.createWorker('pathfinding', workerPath);

                if (success) {
                    console.log('Pathfinding worker initialized successfully');

                    // Set up error handler for worker messages
                    this.workerManager.setMessageHandler('pathfinding', (data) => {
                        if (data.type === 'error') {
                            console.error('Pathfinding worker error:', data.message);
                        }
                    });
                } else {
                    console.warn('Failed to create pathfinding worker, falling back to main thread pathfinding');
                }
            } catch (error) {
                console.error('Error initializing pathfinding worker:', error);
            }
        } else {
            console.warn('Web Workers not supported in this browser, using main thread pathfinding');
        }

        // Try to initialize WebGL renderer if supported
        try {
            this.webglRenderer = new WebGLRenderer(canvas, {
                antialias: true,
                alpha: true
            });

            if (this.webglRenderer.gl) {
                console.log('WebGL renderer initialized successfully');
            } else {
                this.webglRenderer = null;
                console.warn('WebGL not supported, falling back to Canvas renderer');
            }
        } catch (error) {
            console.error('Failed to initialize WebGL renderer:', error);
            this.webglRenderer = null;
        }

        // Initialize simplified renderer for low-end devices
        this.simplifiedRenderer = new SimplifiedRenderer(canvas, {
            tileSize: 32,
            entitySize: 32,
            simplifyDistance: 15,
            maxEntities: 30,
            maxStructures: 20
        });

        // Initialize performance monitoring
        this.performanceMonitor = new PerformanceMonitor({
            sampleInterval: 10000,  // Sample every 10 seconds
            historySize: 60,        // Keep 10 minutes of history
            logToConsole: true      // Log to console
        });

        // Initialize memory management
        this.memoryManager = new MemoryManager({
            cleanupInterval: 60000,  // Clean up every minute
            textureMaxAge: 300000,   // Textures unused for 5 minutes get purged
            entityCullingDistance: 100 // Distance at which to cull entities
        });

        // Initialize object pools
        this.vector2Pool = new Vector2Pool(200);
        this.rectPool = new RectPool(100);

        // Initialize spatial partitioning
        this.spatialGrid = new SpatialGrid(64, 2000, 2000);

        // Initialize occlusion culling
        this.occlusionCulling = new OcclusionCulling({
            enabled: true,
            maxOccluders: 50,
            occluderTypes: ['building', 'structure', 'wall']
        });

        // Initialize render batching
        this.renderBatch = new RenderBatch({
            maxBatchSize: 100
        });

        // Initialize minimal renderer for emergency situations
        this.minimalRenderer = new MinimalRenderer(canvas, {
            tileSize: 16,
            entitySize: 8,
            maxEntities: 10,
            maxTiles: 100
        });

        // Initialize FPS stabilizer
        this.fpsStabilizer = new FPSStabilizer({
            enabled: true,
            minAcceptableFPS: 5,
            criticalFPS: 2,
            checkInterval: 10000,
            recoveryMeasures: ['gc', 'textures', 'entities', 'reset'],
            maxResets: 3
        });

        // Initialize game state snapshot system
        this.gameStateSnapshot = new GameStateSnapshot({
            includeEntities: true,
            includePlayer: true,
            includeCamera: true
        });

        // Start performance monitoring
        this.performanceMonitor.startMonitoring();

        // Take initial game state snapshot after 60 seconds (when game is more stable)
        setTimeout(() => {
            if (this.running && this.gameStateSnapshot) {
                try {
                    const success = this.gameStateSnapshot.takeSnapshot(this);
                    if (success) {
                        this.logger.info('Initial game state snapshot taken');
                    }
                } catch (e) {
                    this.logger.warn('Failed to take initial game state snapshot:', e);
                }
            }
        }, 60000);

        // Define core texture sets
        this.textureDefinitions = {
            terrain: {
                grass: {
                    base: '#7ec850',
                    variants: ['grass_var1', 'grass_var2'],
                    variantColors: ['#8ec860', '#6eb840']
                },
                dirt: {
                    base: '#8b4513',
                    variants: ['dirt_var1', 'dirt_var2'],
                    variantColors: ['#9b5523', '#7b3503']
                },
                stone: {
                    base: '#808080',
                    variants: ['stone_mossy', 'stone_cracked'],
                    variantColors: ['#708070', '#606060']
                },
                concrete: { base: '#808080' },
                asphalt: { base: '#404040' },
                metal: { base: '#A0A0A0' }
            },
            decorations: {
                flowers: {
                    base: '#ff0000',
                    variants: ['dec_flowers_var0', 'dec_flowers_var1'],
                    variantColors: ['#ff4444', '#ffff00']
                },
                rocks: { base: '#696969' },
                cameras: { base: '#404040' },
                terminals: { base: '#00FF00' },
                drones: { base: '#202020' },
                dumpster: { base: '#2F4F4F' },
                tree: { base: '#228B22' }
            }
        };

        // Make instance globally available
        window.gameInstance = this;

        // Initialize entities collection
        this.entities = new Set();

        // Initialize camera with improved properties
        this.camera = {
            x: 0,
            y: 0,
            zoom: 0.5,
            // Target position (usually the player)
            targetX: 0,
            targetY: 0,
            // Offset from target (for panning)
            offsetX: 0,
            offsetY: 0,
            // Camera movement settings
            followPlayer: true,  // Whether camera should follow player
            followSpeed: 0.1,    // How quickly camera follows player (0-1)
            panSpeed: 15,        // Speed of manual panning
            // Center camera on specific coordinates
            centerOn(x, y) {
                this.targetX = x;
                this.targetY = y;
                this.offsetX = 0;
                this.offsetY = 0;
                this.x = x;
                this.y = y;
            },
            // Pan the camera by the specified amount
            pan(deltaX, deltaY) {
                this.offsetX += deltaX;
                this.offsetY += deltaY;
            },
            // Reset panning offset
            resetPan() {
                this.offsetX = 0;
                this.offsetY = 0;
            },
            // Update camera position based on target and offset
            update(deltaTime) {
                if (this.followPlayer) {
                    // Smoothly move camera towards target + offset
                    this.x += ((this.targetX + this.offsetX) - this.x) * this.followSpeed;
                    this.y += ((this.targetY + this.offsetY) - this.y) * this.followSpeed;
                } else {
                    // Just use the offset for manual control
                    this.x = this.targetX + this.offsetX;
                    this.y = this.targetY + this.offsetY;
                }
            }
        };

        // Centralize debug configuration
        this.debug = {
            enabled: true,
            flags: {
                // Display flags
                showPath: false,
                //showGrid: false,
                //showCoordinates: true,  // Set to true by default
                showStructureBounds: false,
                showFPS: true,

                // Logging flags - most disabled by default for performance
                logTextureLoading: false,
                logDecorations: false,  // Disable for performance
                logZoomChanges: false,
                logStructures: false,   // Disable for performance
                logEntities: false,     // Disable entity logging
                logEntityRendering: false, // Disable entity render logging
                logNPCs: false,         // Disable NPC logging
                logNPCRendering: false, // Disable NPC render logging
                logWarnings: false,     // Disable warnings
                logErrors: true,        // Keep errors enabled
                logInit: false,         // Disable init logging
                logInput: true,         // Enable input logging
                logDialog: true,        // Enable dialog logging
                logCombat: true,        // Enable combat logging
                logRenderer: false,     // Disable renderer logging
                logShadows: false,      // Disable shadow logging
                logNPCMovement: true,   // Enable NPC movement logging
                forceNPCMovement: true, // Force NPCs to move (for debugging)
                debugNPCUpdate: true,   // Debug NPC update method calls
                debugShadowArea: true, // Enable shadow area visualization
                logCamera: false,       // Disable camera logging
                logPerformance: true,   // Enable performance logging
                logInput: true,         // Enable input logging

                // Feature flags
                enableLayoutMode: true
            }
        };

        // Initialize layout mode
        this.layoutMode = {
            enabled: false,
            currentTool: 'terrain',
            selectedTerrainType: 'grass',
            selectedStructureType: 'apartment',
            brushSize: 1,
            heightValue: 0.5,
            moistureValue: 0.5
        };

        // Add time tracking properties
        this.gameTimeScale = 60; // 1 real second = 1 game minute
        this.gameStartTime = Date.now();
        this.gamePausedTime = 0;
        this.lastPauseTime = null;

        // Initialize core components - NEEDS TO CHANGE ORDER
        this.inputManager = new InputManager(); // Move this up
        this.tileManager = new TileManager(this.debug, this.assetManager);

        // Initialize world with remixed demo map
        this.world = new World(32, 32, {  // Changed from 128,128
            debug: this.debug,
            mapDefinition: createRemixedMap(),
            tileManager: this.tileManager,
            game: this // Pass reference to game instance
        });

        // Add debug logging
        if (this.debug.enabled) {
            console.log('World structures:', this.world.structures);
            const trees = Array.from(this.world.structures).filter(s => s.type === 'tree');
            console.log('Number of trees:', trees.length);
        }

        this.pathFinder = new PathFinder(this.world);
        this.renderer = new IsometricRenderer(canvas, this.tileManager);

        // Set initial camera position to spawn point
        const spawnPoint = this.world.mapDefinition.spawnPoints[0];
        if (spawnPoint) {
            this.camera.centerOn(spawnPoint.x, spawnPoint.y);
        }

        // Enable debug logging for initialization
        if (this.debug?.flags?.logInit) {
            console.log('Game initialized with demo map:', {
                worldSize: `${this.world.width}x${this.world.height}`,
                structures: this.world.structures.size,
                spawnPoint: spawnPoint
            });
        }

        // Initialize player with starting equipment
        const playerSpawnPoint = this.findValidSpawnPoint();
        this.player = new Player({
            name: 'Player',  // Set player name
            x: playerSpawnPoint.x,
            y: playerSpawnPoint.y,
            world: this.world,
            pathFinder: this.pathFinder,
            game: this  // Add game reference
        });

        // Give player starting ETH
        this.player.inventory.eth = 100;

        // Add starting clothing items
        const startingItems = [
            new Item({
                id: 'basic_shirt',
                name: 'Basic Shirt',
                description: 'A simple cotton shirt',
                type: 'armor',
                value: 10,
                weight: 0.5,
                slot: 'chest',
                icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAPklEQVR42mNkGAWjYBSMglEwCkbBKBgFo2AUjIJRMAqGIWBkZGQEis0DzQdjxkH3AuQS6wNtAQN/GIyCUTAKBjMAALl5C/V1fHh4AAAAAElFTkSuQmCC'
            }),
            new Item({
                id: 'basic_pants',
                name: 'Basic Pants',
                description: 'Simple cotton pants',
                type: 'armor',
                value: 10,
                weight: 0.5,
                slot: 'legs',
                icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAPklEQVR42mNkGAWjYBSMglEwCkbBKBgFo2AUjIJRMAqGIWBkZGQEis0DzQdjxkH3AuQS6wNtAQN/GIyCUTAKBjMAALl5C/V1fHh4AAAAAElFTkSuQmCC'
            }),
            new Item({
                id: 'basic_shoes',
                name: 'Basic Shoes',
                description: 'Simple leather shoes',
                type: 'armor',
                value: 5,
                weight: 0.3,
                slot: 'feet',
                icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAPklEQVR42mNkGAWjYBSMglEwCkbBKBgFo2AUjIJRMAqGIWBkZGQEis0DzQdjxkH3AuQS6wNtAQN/GIyCUTAKBjMAALl5C/V1fHh4AAAAAElFTkSuQmCC'
            })
        ];

        startingItems.forEach(item => {
            this.player.inventory.addItem(item);
            // Auto-equip the items
            if (item.slot) {
                this.player.equipItem(item);
            }
        });

        // Center camera on player
        this.camera.x = this.player.x;
        this.camera.y = this.player.y;

        // Force all structures to be fully opaque on initialization
        this.world.getAllStructures().forEach(structure => {
            // Explicitly create new objects to avoid reference issues
            structure.transparency = {
                frontLeftWall: 1,
                frontRightWall: 1,
                backLeftWall: 1,
                backRightWall: 1,
                roof: 1,
                floor: 1
            };
            structure.visibility = {
                frontLeftWall: true,
                frontRightWall: true,
                backLeftWall: true,
                backRightWall: true,
                roof: true,
                floor: true
            };
        });

        // Initialize UI components
        this.uiManager = new UIManager(this);
        this.messageSystem = new MessageSystem(this);

        // Initialize minimap
        this.minimap = new MinimapUI(this, {
            size: 200,  // Size in pixels
            scale: 0.1  // Scale factor for world to minimap conversion
        });

        // Initialize combat system
        this.combatSystem = new TurnBasedCombatSystem(this, {
            baseHitChance: 0.85,
            criticalChance: 0.1,
            criticalMultiplier: 1.5,
            fleeBaseChance: 0.5
        });

        // Setup debug controls and input handlers
        console.log('Setting up debug controls...');
        this.setupDebugControls();
        this.setupInput();

        // Show intro sequence
        this.showIntroSequence();
    }

    /**
     * Shows the game's introduction sequence
     * @private
     */
    showIntroSequence() {
        this.messageSystem.queueMessage({
            text: "Welcome to our world! You find yourself in a mysterious land filled with opportunities and adventures.",
            options: [
                { text: "Tell me more" }
            ]
        });

        this.messageSystem.queueMessage({
            text: "You can interact with various characters, trade with merchants, and explore the landscape.",
            options: [
                { text: "How do I move?" },
                { text: "Let me explore!" }
            ]
        });
    }

    /**
     * Creates a merchant NPC with inventory
     * @param {{x: number, y: number}} pos - Spawn position
     * @param {Structure} [structure=null] - Structure to place merchant in
     * @returns {Merchant|null} Created merchant or null if creation fails
     */
    createMerchant(pos, structure = null) {
        console.log('Starting merchant creation at position:', pos, 'in structure:', structure?.type);

        try {
            const merchant = new Merchant({
                x: pos.x,
                y: pos.y,
                name: structure ? 'Shop Owner' : 'Wandering Merchant',
                eth: 1000,
                world: this.world,
                game: this  // Add explicit game reference
            });

            // Verify merchant creation
            if (!merchant || !merchant.inventory) {
                throw new Error('Merchant or inventory creation failed');
            }

            // Add initial items
            const tacticalPistol = new Item({
                id: 'tactical_pistol',
                name: 'Tactical Pistol',
                description: 'Standard sidearm',
                type: 'weapon',
                value: 100,
                weight: 1.5,
                damage: 10,
                slot: 'mainHand',
                icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAPklEQVR42mNkGAWjYBSMgmEJ/////z/QbmAkJCT8P9D+GOgQGAWjYBSMglGADUYtMApGwSgYBaNgsAAAAt1FJzHm9f8AAAAASUVORK5CYII='
            });

            merchant.inventory.addItem(tacticalPistol);

            console.log('Merchant creation complete:', {
                eth: merchant.inventory.eth,
                ethType: typeof merchant.inventory.eth,
                position: `${pos.x},${pos.y}`,
                hasInventory: !!merchant.inventory,
                inventorySlots: merchant.inventory?.slots?.length
            });

            return merchant;
        } catch (error) {
            console.error('Error in createMerchant:', error);
            throw error;
        }
    }

    /**
     * Finds a valid spawn point for entities
     * @returns {{x: number, y: number}} Valid spawn coordinates
     */
    findValidSpawnPoint() {
        const worldCenter = Math.floor(this.world.width / 2);
        const searchRadius = 10; // Increased radius to have more options

        for (let dy = -searchRadius; dy <= searchRadius; dy++) {
            for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                const x = worldCenter + dx;
                const y = worldCenter + dy;

                const height = this.world.generateHeight(x, y);
                const moisture = this.world.generateMoisture(x, y);
                const tile = this.world.generateTile(x, y, height, moisture);

                // Check if tile is valid (not water/wetland and no structure)
                if (tile.type !== 'water' &&
                    tile.type !== 'wetland' &&
                    !tile.structure) {

                    // Additional check: make sure none of the surrounding tiles have structures
                    let hasNearbyStructure = false;
                    for (let ny = -1; ny <= 1; ny++) {
                        for (let nx = -1; nx <= 1; nx++) {
                            const nearTile = this.world.getTileAt(x + nx, y + ny);
                            if (nearTile && nearTile.structure) {
                                hasNearbyStructure = true;
                                break;
                            }
                        }
                        if (hasNearbyStructure) break;
                    }

                    if (!hasNearbyStructure) {
                        console.log('Found valid spawn point at:', x, y);
                        return { x, y };
                    }
                }
            }
        }

        // Fallback to center if no suitable spot found
        console.warn('No suitable spawn point found, using world center');
        return { x: worldCenter, y: worldCenter };
    }

    /**
     * Initializes the game instance
     * @async
     * @returns {Promise<boolean>} Success status
     */
    async init() {
        try {
            // Only log if debug is enabled
            if (this.debug?.flags?.logInit) {
                console.log('Game: Starting initialization...');
            }

            // Set base URL for assets if provided in options
            if (this.options?.assetsBaseUrl) {
                this.assetManager.setBaseUrl(this.options.assetsBaseUrl);
            }

            // Initialize essential textures first
            await this.initializeEssentialTextures();

            // Setup input and debug controls
            this.setupInput();
            this.setupDebugControls();

            // Schedule non-essential initialization for after the game starts
            setTimeout(() => {
                this.initializeNonEssentialComponents();
            }, 500);

            return true;
        } catch (error) {
            console.error('Game: Failed to initialize:', error);
            return false;
        }
    }

    /**
     * Initializes essential textures needed for initial rendering
     * @private
     * @returns {Promise<void>}
     */
    async initializeEssentialTextures() {
        // Load only the most essential textures first
        const essentialTextures = ['grass', 'dirt', 'concrete', 'water'];

        try {
            // Load essential textures
            for (const textureType of essentialTextures) {
                await this.tileManager.generateTexture(textureType, this.tileManager.tileColors[textureType]);
            }

            // Initialize world with essential textures
            await this.world.tileManager.loadEssentialTextures();

            if (this.debug?.flags?.logInit) {
                console.log('Game: Essential textures loaded successfully');
            }
        } catch (error) {
            console.error('Game: Failed to load essential textures:', error);
            throw error;
        }
    }

    /**
     * Initializes non-essential components after the game has started
     * @private
     */
    async initializeNonEssentialComponents() {
        try {
            // Load remaining textures
            await this.initializeTextures();

            // Add merchant after initialization
            this.addMerchantNearPlayer();

            // Create NPCs from map definition
            this.createNPCsFromMapDefinition();

            if (this.debug?.flags?.logInit) {
                console.log('Game: Non-essential components initialized');
            }
        } catch (error) {
            console.error('Game: Failed to initialize non-essential components:', error);
        }
    }

    /**
     * Initializes all game textures
     * @private
     * @async
     */
    async initializeTextures() {
        try {
            // Initialize default assets from the asset registry
            await this.assetRegistry.initializeDefaultAssets();

            const texturePromises = [];

            // Define base texture types that must be loaded
            const baseTextureTypes = [
                'water', 'wetland', 'sand', 'dirt', 'grass',
                'forest', 'mountain', 'concrete', 'asphalt', 'metal',
                'tiles', 'gravel', 'solar', 'garden', 'door',
                'helipad', 'parking', 'tree', 'bush', 'road',
                'walkway', 'stone'
            ];

            // Initialize all base textures first
            baseTextureTypes.forEach(type => {
                // Check if the texture already exists in the asset registry
                const existingTexture = this.assetRegistry.getTexture(`tile_${type}`);
                if (!existingTexture) {
                    texturePromises.push(
                        this.tileManager.generateTexture(type, this.tileManager.tileColors[type])
                    );
                }
            });

            // Initialize terrain textures
            for (const [terrainType, config] of Object.entries(this.textureDefinitions.terrain)) {
                if (!baseTextureTypes.includes(terrainType)) {
                    // Check if the texture already exists in the asset registry
                    const existingTexture = this.assetRegistry.getTexture(`tile_${terrainType}`);
                    if (!existingTexture) {
                        texturePromises.push(
                            this.tileManager.generateTexture(terrainType, config.base)
                        );
                    }
                }

                // Generate variant textures if they exist
                if (config.variants) {
                    config.variants.forEach((variant, index) => {
                        // Check if the variant texture already exists in the asset registry
                        const existingVariant = this.assetRegistry.getTexture(`tile_${variant}`);
                        if (!existingVariant) {
                            texturePromises.push(
                                this.tileManager.generateTexture(
                                    variant,
                                    config.variantColors[index]
                                )
                            );
                        }
                    });
                }
            }

            // Initialize decoration textures
            for (const [decType, config] of Object.entries(this.textureDefinitions.decorations)) {
                if (!baseTextureTypes.includes(decType)) {
                    // Check if the texture already exists in the asset registry
                    const existingTexture = this.assetRegistry.getTexture(`tile_${decType}`);
                    if (!existingTexture) {
                        texturePromises.push(
                            this.tileManager.generateTexture(decType, config.base)
                        );
                    }
                }

                // Generate variant textures if they exist
                if (config.variants) {
                    config.variants.forEach((variant, index) => {
                        // Check if the variant texture already exists in the asset registry
                        const existingVariant = this.assetRegistry.getTexture(`tile_${variant}`);
                        if (!existingVariant) {
                            texturePromises.push(
                                this.tileManager.generateTexture(
                                    variant,
                                    config.variantColors[index]
                                )
                            );
                        }
                    });
                }
            }

            // Add debug logging for texture loading
            if (this.debug?.flags?.logTextureLoading) {
                console.log('Game: Loading textures:', {
                    baseTypes: baseTextureTypes,
                    terrain: Object.keys(this.textureDefinitions.terrain),
                    decorations: Object.keys(this.textureDefinitions.decorations),
                    assetRegistryTextures: this.assetRegistry.textures.size,
                    assetRegistryModels: this.assetRegistry.models.size
                });
            }

            await Promise.all(texturePromises);

            if (this.debug?.flags?.logTextureLoading) {
                console.log('Game: All textures loaded successfully');
            }
        } catch (error) {
            console.error('Game: Failed to load textures:', error);
            throw error;
        }
    }

    /**
     * Verifies all required textures are loaded
     * @private
     * @returns {boolean} True if all textures are loaded
     */
    verifyTextureLoading() {
        const missingTextures = [];

        // Check terrain textures
        for (const [terrainType, config] of Object.entries(this.textureDefinitions.terrain)) {
            if (!this.tileManager.hasTexture(terrainType)) {
                missingTextures.push(terrainType);
            }

            if (config.variants) {
                config.variants.forEach(variant => {
                    if (!this.tileManager.hasTexture(variant)) {
                        missingTextures.push(variant);
                    }
                });
            }
        }

        // Check decoration textures
        for (const [decType, config] of Object.entries(this.textureDefinitions.decorations)) {
            if (!this.tileManager.hasTexture(decType)) {
                missingTextures.push(decType);
            }

            if (config.variants) {
                config.variants.forEach(variant => {
                    if (!this.tileManager.hasTexture(variant)) {
                        missingTextures.push(variant);
                    }
                });
            }
        }

        if (missingTextures.length > 0) {
            console.error('Game: Missing textures:', missingTextures);
            return false;
        }

        return true;
    }

    /**
     * Sets up input handlers for the game
     * @private
     */
    setupInput() {
        console.log('Game: Setting up input handlers');

        // Track key states
        const keyStates = new Set();
        let lastToggleTime = 0;
        const TOGGLE_COOLDOWN = 200;

        // Create a separate wheel handler function
        const handleWheel = (e) => {
            // Adjust zoom speed based on current zoom level
            // Slower zooming when already zoomed in a lot
            const zoomSpeed = this.camera.zoom > 1.5 ? 0.05 : 0.1;

            // Set stricter limits on zoom to prevent visibility issues
            const minZoom = 0.5;
            const maxZoom = 1.8; // Reduced from 2.0 to prevent rendering issues

            const newZoom = Math.max(minZoom, Math.min(maxZoom,
                this.camera.zoom + (e.deltaY > 0 ? -zoomSpeed : zoomSpeed)
            ));

            // Only update if zoom actually changed
            if (newZoom !== this.camera.zoom) {
                this.camera.zoom = newZoom;

                // Log zoom changes if debug flag is enabled
                if (this.debug?.flags?.logZoomChanges || this.debug?.flags?.logRenderer) {
                    console.log('Zoom updated:', {
                        zoom: this.camera.zoom,
                        min: minZoom,
                        max: maxZoom
                    });
                }
            }
        };

        // Add wheel listener with passive option
        this.canvas.addEventListener('wheel', handleWheel, {
            passive: true
        });

        // Handle keydown
        const handleKeyDown = (e) => {
            if (e.key.toLowerCase() === 'i' && !keyStates.has('i')) {
                const now = Date.now();
                if (now - lastToggleTime < TOGGLE_COOLDOWN) return;

                e.preventDefault();
                e.stopPropagation();
                keyStates.add('i');
                lastToggleTime = now;

                const inventoryUI = this.uiManager.getComponent('inventoryUI');
                if (inventoryUI) {
                    console.log('Processing inventory toggle...');
                    inventoryUI.toggle();
                }
            }
        };

        // Handle keyup
        const handleKeyUp = (e) => {
            if (e.key.toLowerCase() === 'i') {
                keyStates.delete('i');
                e.preventDefault();
                e.stopPropagation();
            }
        };

        // Clean up any existing listeners
        document.removeEventListener('keydown', handleKeyDown, true);
        document.removeEventListener('keyup', handleKeyUp, true);

        // Add listeners with capture
        document.addEventListener('keydown', handleKeyDown, { capture: true });
        document.addEventListener('keyup', handleKeyUp, { capture: true });

        // Handle mouse movement for camera panning
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.inputManager && this.inputManager.isShiftDragging()) {
                // Get mouse movement delta without resetting it
                const { deltaX, deltaY } = this.inputManager.getMouseDelta(false);

                if (deltaX === 0 && deltaY === 0) return; // Skip if no movement

                // Convert screen delta to world delta based on zoom and isometric projection
                const worldDeltaX = (deltaX - deltaY) / (this.renderer.tileWidth * this.camera.zoom);
                const worldDeltaY = (deltaX + deltaY) / (this.renderer.tileHeight * this.camera.zoom);

                // Pan the camera (negative because we want to move the world in the opposite direction)
                this.camera.pan(-worldDeltaX, -worldDeltaY);

                // Temporarily disable player following while panning
                this.camera.followPlayer = false;

                // Log panning if debug is enabled
                if (this.debug?.flags?.logCamera) {
                    console.log('Camera panning:', {
                        mouseDelta: { x: deltaX, y: deltaY },
                        worldDelta: { x: worldDeltaX, y: worldDeltaY },
                        cameraOffset: { x: this.camera.offsetX, y: this.camera.offsetY },
                        isDragging: this.inputManager.isDragging
                    });
                }

                // Prevent default to avoid text selection during drag
                e.preventDefault();
            }
        });

        // Add mousedown event for starting panning
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.inputManager && this.inputManager.isShiftPressed && e.button === 0) {
                // Prevent default to avoid text selection during drag
                e.preventDefault();

                // Log start of panning if debug is enabled
                if (this.debug?.flags?.logCamera) {
                    console.log('Camera panning started');
                }
            }
        });

        // Add double-click to reset camera
        this.canvas.addEventListener('dblclick', (e) => {
            // Reset camera offset and re-enable player following
            this.camera.resetPan();
            this.camera.followPlayer = true;

            if (this.debug?.flags?.logCamera) {
                console.log('Camera reset to player');
            }
        });

        this.canvas.addEventListener('click', (e) => {
            try {
                console.log('Canvas clicked');

                // Performance tracking
                const clickStart = performance.now();

                const rect = this.canvas.getBoundingClientRect();
                const screenX = e.clientX - rect.left;
                const screenY = e.clientY - rect.top;

                // Check if clicked on an NPC first
                const clickedNPC = this.findClickedNPC(screenX, screenY);

                if (clickedNPC) {
                    console.log('NPC clicked:', clickedNPC);
                    // Find adjacent tile to NPC
                    const adjacentTile = this.findAdjacentTile(clickedNPC);
                    if (adjacentTile) {
                        const startX = Math.round(this.player.x);
                        const startY = Math.round(this.player.y);

                        // Check if player is already at the adjacent tile
                        if (startX === adjacentTile.x && startY === adjacentTile.y) {
                            console.log('Player already at interaction position, starting dialog');
                            this.startDialog(clickedNPC);
                        } else {
                            const path = this.pathFinder.findPath(startX, startY, adjacentTile.x, adjacentTile.y);

                            if (path) {
                                console.log('Path found, moving player');
                                this.player.setPath(path);
                                // Start dialog when path is complete
                                this.player.onPathComplete = () => {
                                    console.log('Path complete, starting dialog with:', clickedNPC.constructor.name);
                                    this.startDialog(clickedNPC);
                                };
                            } else {
                                console.log('No path found to NPC');
                            }
                        }
                    } else {
                        console.log('No adjacent tile found for NPC');
                    }

                    // Log click processing time
                    const clickEnd = performance.now();
                    if (this.debug?.flags?.logPerformance) {
                        console.log(`NPC click processed in ${(clickEnd - clickStart).toFixed(2)}ms`);
                    }
                    return;
                }

                // Convert screen coordinates to world coordinates using the optimized method
                const worldPos = this.screenToWorld(screenX, screenY);
                const worldX = worldPos.x;
                const worldY = worldPos.y;

                if (this.pathFinder.isValidCoordinate(worldX, worldY)) {
                    const startX = Math.round(this.player.x);
                    const startY = Math.round(this.player.y);
                    const path = this.pathFinder.findPath(startX, startY, worldX, worldY);

                    if (path) {
                        this.player.setPath(path);
                    } else {
                        console.log('No valid path found');
                    }
                } else {
                    console.log('Invalid target coordinates');
                }

                // Log click processing time
                const clickEnd = performance.now();
                if (this.debug?.flags?.logPerformance) {
                    console.log(`Movement click processed in ${(clickEnd - clickStart).toFixed(2)}ms`);
                }
            } catch (error) {
                console.error('Error processing click event:', error);
            }
        });
    }

    /**
     * Starts the game loop
     * @returns {void}
     */
    start() {
        if (this.debug?.flags?.logInit) {
            console.log('Game: Starting game loop');
        }

        this.running = true;
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.lastFpsUpdate = this.lastTime;
        this.fps = 0;
        this.targetFps = 60;
        this.frameInterval = 1000 / this.targetFps;
        this.frameTime = 0;

        // Start the game loop
        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    /**
     * Main game loop with frame rate limiting, performance monitoring, and adaptive frame skipping
     * @private
     * @param {number} timestamp - Current timestamp from requestAnimationFrame
     */
    gameLoop(timestamp) {
        if (!this.running) return;

        // Calculate time since last frame
        const elapsed = timestamp - this.lastTime;

        // Initialize performance mode properties if not already set
        if (this.performanceMode === undefined) {
            this.performanceMode = {
                enabled: true, // Start with performance mode enabled by default
                frameSkip: 1, // Start with frame skip of 1
                maxFrameSkip: 3,
                consecutiveSlowFrames: 0,
                slowFrameThreshold: 3, // Lower threshold to be more aggressive
                lastPerformanceCheck: timestamp,
                checkInterval: 3000, // Check more frequently (every 3 seconds)
                adaptiveRendering: true,
                lodEnabled: true, // Enable level-of-detail rendering
                lodDistance: 15, // Distance at which to switch to lower detail
                cullingDistance: 25, // Maximum distance for entity rendering
                textureQuality: 'low', // Start with low texture quality
                maxEntitiesRendered: 50, // Limit number of entities rendered per frame
                maxStructuresRendered: 30 // Limit number of structures rendered per frame
            };

            // Log initial performance mode settings
            console.log('Performance mode initialized:', this.performanceMode);
        }

        // Only update if enough time has passed for the target frame rate
        if (elapsed >= this.frameInterval) {
            // Calculate actual delta time (capped to prevent large jumps)
            const deltaTime = Math.min(elapsed, 100); // Cap at 100ms to prevent huge jumps

            // Update last time, accounting for any extra time beyond the frame interval
            this.lastTime = timestamp - (elapsed % this.frameInterval);

            // Performance monitoring - start
            const updateStart = performance.now();

            // Always update game state
            this.update(deltaTime);

            // Update performance monitor (only every 5 frames to reduce overhead)
            if (this.frameCount % 5 === 0) {
                try {
                    this.performanceMonitor.update(this);
                } catch (e) {
                    console.error('Error updating performance monitor:', e);
                }
            }

            // Update memory manager (even less frequently)
            if (this.frameCount % 30 === 0) {
                try {
                    this.memoryManager.update(this);
                } catch (e) {
                    console.error('Error updating memory manager:', e);
                }
            }

            const updateEnd = performance.now();
            const renderStart = performance.now();

            // Check if we should skip rendering this frame
            let skipRender = false;
            if (this.performanceMode.enabled && this.performanceMode.frameSkip > 0) {
                // Skip rendering based on frame count
                skipRender = (this.frameCount % (this.performanceMode.frameSkip + 1)) !== 0;
            }

            // Render the frame (unless skipped)
            if (!skipRender) {
                this.render();
            }

            const renderEnd = performance.now();

            // Calculate performance metrics
            const updateTime = updateEnd - updateStart;
            const renderTime = skipRender ? 0 : renderEnd - renderStart;
            const frameTime = updateTime + renderTime;

            // Store performance metrics
            this.performanceMetrics = {
                updateTime,
                renderTime,
                frameTime,
                timestamp,
                skippedRender: skipRender
            };

            // Detect slow frames
            const isSlowFrame = frameTime > 16.67; // More than 60fps frame budget
            if (isSlowFrame) {
                this.performanceMode.consecutiveSlowFrames++;

                if (this.debug?.flags?.logPerformance) {
                    this.logger.warn(`Slow frame detected: ${frameTime.toFixed(2)}ms`, {
                        updateTime: updateTime.toFixed(2),
                        renderTime: renderTime.toFixed(2),
                        skipped: skipRender,
                        consecutiveSlow: this.performanceMode.consecutiveSlowFrames
                    });
                }

                // Force memory cleanup on very slow frames or consecutive slow frames
                if (frameTime > 100 || this.performanceMode.consecutiveSlowFrames >= 10) {
                    this.logger.warn(`Performance issue detected - forcing memory cleanup`);
                    try {
                        this.memoryManager.cleanupMemory(this);

                        // Increase frame skipping if we're having severe performance issues
                        if (frameTime > 200 || this.performanceMode.consecutiveSlowFrames >= 20) {
                            this.performanceMode.frameSkip = Math.min(5, this.performanceMode.frameSkip + 1);
                            this.logger.warn(`Severe performance issues - increasing frame skip to ${this.performanceMode.frameSkip}`);
                        }
                    } catch (e) {
                        this.logger.error('Error during emergency memory cleanup:', e);
                    }
                }
            } else {
                // Reset consecutive slow frames counter if we had a good frame
                this.performanceMode.consecutiveSlowFrames = 0;
            }

            // Check if we need to adjust performance mode
            if (timestamp - this.performanceMode.lastPerformanceCheck > this.performanceMode.checkInterval) {
                this.adjustPerformanceMode();
                this.performanceMode.lastPerformanceCheck = timestamp;
            }

            // Update FPS counter
            this.frameCount++;
            this.frameTime += deltaTime;

            if (timestamp - this.lastFpsUpdate >= 1000) {
                this.fps = Math.round((this.frameCount * 1000) / (timestamp - this.lastFpsUpdate));
                this.lastFpsUpdate = timestamp;
                this.frameCount = 0;

                // Store current FPS for calculations
                this.currentFPS = this.fps;

                // Update FPS stabilizer
                if (this.fpsStabilizer) {
                    this.fpsStabilizer.update(this, this.currentFPS);
                }

                // Take periodic game state snapshots when FPS is good (but very rarely)
                if (this.gameStateSnapshot && this.currentFPS > 15 && Math.random() < 0.05) {
                    try {
                        this.gameStateSnapshot.takeSnapshot(this);
                    } catch (e) {
                        // Silently ignore snapshot errors
                    }
                }

                // Update FPS display if enabled
                if (this.debug?.flags?.showFPS) {
                    const fpsElement = document.getElementById('fpsCounter');
                    if (fpsElement) {
                        fpsElement.textContent = `FPS: ${this.fps} | Frame: ${frameTime.toFixed(1)}ms | Mode: ${this.performanceMode.enabled ? 'Performance' : 'Quality'} | Skip: ${this.performanceMode.frameSkip}`;
                    }
                }
            }
        }

        // Schedule next frame
        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    /**
     * Adjusts performance mode settings based on recent performance
     * @private
     */
    adjustPerformanceMode() {
        // If we've had several consecutive slow frames, enable performance mode
        if (this.performanceMode.consecutiveSlowFrames >= this.performanceMode.slowFrameThreshold) {
            if (!this.performanceMode.enabled) {
                this.performanceMode.enabled = true;
                this.performanceMode.frameSkip = 1;
                console.log('Performance mode enabled: Frame skip set to 1');
            } else if (this.performanceMode.frameSkip < this.performanceMode.maxFrameSkip) {
                // Increase frame skip if already in performance mode but still having issues
                this.performanceMode.frameSkip++;
                console.log(`Performance mode adjusted: Frame skip increased to ${this.performanceMode.frameSkip}`);
            }
        }
        // If FPS is good, gradually reduce performance optimizations
        else if (this.fps > 45 && this.performanceMode.enabled) {
            if (this.performanceMode.frameSkip > 0) {
                this.performanceMode.frameSkip--;
                console.log(`Performance mode adjusted: Frame skip decreased to ${this.performanceMode.frameSkip}`);
            } else {
                this.performanceMode.enabled = false;
                console.log('Performance mode disabled: Good performance detected');
            }
        }
    }

    /**
     * Stops the game loop
     */
    stop() {
        this.running = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Stop performance monitoring
        if (this.performanceMonitor) {
            this.performanceMonitor.stopMonitoring();
        }

        // Force a final memory cleanup
        if (this.memoryManager) {
            this.memoryManager.cleanupMemory(this);
        }

        console.log('Game: Stopped');
    }

    /**
     * Destroys the game instance and cleans up all resources
     */
    destroy() {
        // Stop the game first
        this.stop();

        // Clean up resources
        this.cleanup();

        // Clear all references
        this.entities = null;
        this.player = null;
        this.world = null;
        this.renderer = null;
        this.tileManager = null;
        this.inputManager = null;
        this.pathFinder = null;
        this.performanceMonitor = null;
        this.memoryManager = null;
        this.webglRenderer = null;
        this.simplifiedRenderer = null;
        this.textureAtlas = null;
        this.assetCache = null;
        this.workerManager = null;

        this.logger.info('Game: Destroyed');
    }

    /**
     * Cleans up resources to prevent memory leaks
     */
    cleanup() {
        this.logger.info('Game: Cleaning up resources...');

        // Dispose of WebGL renderer if it exists
        if (this.webglRenderer) {
            this.webglRenderer.dispose();
        }

        // Dispose of texture atlas
        if (this.textureAtlas) {
            this.textureAtlas.clear();
        }

        // Dispose of asset cache
        if (this.assetCache) {
            this.assetCache.clear();
        }

        // Terminate all workers
        if (this.workerManager) {
            this.workerManager.terminateAll();
        }

        // Clear texture references
        if (this.tileManager && this.tileManager.textures) {
            this.tileManager.textures.clear();
        }

        // Clear entity references
        if (this.entities) {
            this.entities.clear();
        }

        // Clear world entities
        if (this.world && this.world.entities) {
            this.world.entities = [];
        }

        // Release all object pool objects
        if (this.vector2Pool) {
            this.vector2Pool.releaseAll();
        }

        if (this.rectPool) {
            this.rectPool.releaseAll();
        }

        // Clear spatial grid
        if (this.spatialGrid) {
            this.spatialGrid.clear();
        }

        // Release occluder rects
        if (this.occlusionCulling) {
            this.occlusionCulling.releaseOccluders();
        }

        // Clear render batches
        if (this.renderBatch) {
            this.renderBatch.clear();
        }

        // Reset FPS stabilizer
        if (this.fpsStabilizer) {
            this.fpsStabilizer.reset();
        }

        // Dispose of minimal renderer
        if (this.minimalRenderer) {
            this.minimalRenderer.dispose();
        }

        // Take a final snapshot if needed
        if (this.gameStateSnapshot && !this.gameStateSnapshot.hasSnapshot()) {
            this.gameStateSnapshot.takeSnapshot(this);
        }

        // Clear event listeners
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('wheel', this.handleMouseWheel);
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);

        // Force garbage collection if possible
        if (window.gc) {
            try {
                window.gc();
            } catch (e) {
                this.logger.warn('Failed to force garbage collection');
            }
        }

        this.logger.info('Game: Cleanup complete');
    }

    /**
     * Constrains the camera to stay within the world bounds
     * @private
     */
    constrainCameraToWorldBounds() {
        if (!this.world) return;

        // Calculate the visible area in world coordinates based on camera zoom
        const visibleWidth = this.canvas.width / this.camera.zoom / this.renderer.tileWidth;
        const visibleHeight = this.canvas.height / this.camera.zoom / this.renderer.tileHeight;

        // Calculate the maximum allowed camera position
        // This ensures we don't pan too far and see empty space
        const maxX = this.world.width - visibleWidth / 2;
        const maxY = this.world.height - visibleHeight / 2;

        // Calculate the minimum allowed camera position
        // This ensures we don't pan too far and see empty space
        const minX = visibleWidth / 2;
        const minY = visibleHeight / 2;

        // Constrain camera position
        this.camera.x = Math.max(minX, Math.min(maxX, this.camera.x));
        this.camera.y = Math.max(minY, Math.min(maxY, this.camera.y));

        // Log camera constraints if debug is enabled
        if (this.debug?.flags?.logCamera) {
            console.log('Camera constraints:', {
                position: { x: this.camera.x, y: this.camera.y },
                bounds: { minX, minY, maxX, maxY },
                visibleArea: { width: visibleWidth, height: visibleHeight }
            });
        }
    }

    /**
     * Updates game state
     * @param {number} deltaTime - Time elapsed since last update
     */
    update(deltaTime) {
        if (!this.player || !this.camera) {
            console.warn('Required components not initialized');
            return;
        }

        // Update game time (assuming you have a day/night cycle system)
        const gameHour = this.getGameHour(); // implement this based on your time system
        this.renderer.structureRenderer.updateTimeOfDay(gameHour);

        // Get terrain information at player's position
        const terrainHeight = this.getTerrainHeightAt(this.player.x, this.player.y);
        const terrainAngle = this.getTerrainAngleAt(this.player.x, this.player.y);

        // Update player's terrain info
        this.player.updateTerrainInfo(terrainHeight, terrainAngle);

        // Update active chunks based on camera position
        this.world.updateActiveChunks(
            Math.floor(this.camera.x / this.world.chunkSize),
            Math.floor(this.camera.y / this.world.chunkSize),
            2 // View distance in chunks
        );

        // Update player
        this.player.update(deltaTime);

        // Update camera target to follow player
        if (this.camera.followPlayer) {
            this.camera.targetX = this.player.x;
            this.camera.targetY = this.player.y;
        }

        // Update camera position
        this.camera.update(deltaTime);

        // Ensure camera stays within world bounds
        this.constrainCameraToWorldBounds();

        // Update spatial grid with player position
        if (this.spatialGrid) {
            this.spatialGrid.clear();

            // Insert entities into spatial grid
            for (const entity of this.entities) {
                if (entity && entity.getBounds) {
                    this.spatialGrid.insert(entity);
                }
            }
        }

        // Update occlusion culling
        if (this.occlusionCulling) {
            this.occlusionCulling.updateOccluders(this.entities, this.camera);
        }

        // Update entities with spatial and occlusion culling
        const updateDistance = 20; // Only update entities within this distance of the player
        const playerX = this.player.x;
        const playerY = this.player.y;

        let entitiesUpdated = 0;
        let entitiesSkipped = 0;

        // Query entities near the player using spatial grid
        const entitiesToUpdate = new Set();

        if (this.spatialGrid) {
            // Use spatial grid to find nearby entities
            this.spatialGrid.queryRect(
                playerX - updateDistance,
                playerY - updateDistance,
                updateDistance * 2,
                updateDistance * 2,
                entity => {
                    entitiesToUpdate.add(entity);
                }
            );
        } else {
            // Fallback to checking all entities
            for (const entity of this.entities) {
                if (!entity.update) continue;

                // Calculate distance to player
                const dx = entity.x - playerX;
                const dy = entity.y - playerY;
                const distanceSquared = dx * dx + dy * dy;

                // Only update if within update distance or is visible
                if (distanceSquared <= updateDistance * updateDistance || entity.isVisible) {
                    entitiesToUpdate.add(entity);
                }
            }
        }

        // Update entities that passed spatial culling
        for (const entity of entitiesToUpdate) {
            if (!entity.update) continue;

            // Skip occluded entities for non-essential updates
            if (this.occlusionCulling &&
                this.occlusionCulling.isOccluded(entity, this.camera) &&
                !entity.isImportant) {
                entitiesSkipped++;
                continue;
            }

            entity.update(deltaTime);
            entitiesUpdated++;
        }

        // Log entity update stats if performance logging is enabled
        if (this.debug?.flags?.logPerformance && this.frameCount % 60 === 0) {
            console.log(`Entity updates: ${entitiesUpdated} updated, ${entitiesSkipped} skipped`);
        }

        // Find the structure at player's position
        let playerTileX = Math.floor(this.player.x);
        let playerTileY = Math.floor(this.player.y);
        let playerStructure = null;

        // Check each structure to see if player is inside
        this.world.getAllStructures().forEach(structure => {
            if (playerTileX >= structure.x &&
                playerTileX < structure.x + structure.width &&
                playerTileY >= structure.y &&
                playerTileY < structure.y + structure.height) {
                playerStructure = structure;
            }
        });

        // Update structure visibility and transparency
        this.world.getAllStructures().forEach(structure => {
            if (structure === playerStructure) {
                structure.updateVisibility(this.player.x, this.player.y);
                structure.transparency = {
                    frontLeftWall: 1,
                    frontRightWall: 1,
                    backLeftWall: 1,
                    backRightWall: 1,
                    roof: 1,
                    floor: 1
                };
            } else {
                // Reset visibility for structures the player isn't in
                structure.visibility = {
                    frontLeftWall: true,
                    frontRightWall: true,
                    backLeftWall: true,
                    backRightWall: true,
                    roof: true,
                    floor: true
                };

                // Always update transparency based on player position and entities
                const cameraAngle = Math.atan2(
                    this.camera.y - this.player.y,
                    this.camera.x - this.player.x
                );
                structure.updateTransparency(this.player.x, this.player.y, cameraAngle, this.entities);
            }
        });

        // Update NPC visibility based on structures
        // This is already handled in the entity update loop above
        // No need to update NPCs again here

        // Update UI
        this.uiManager.update(deltaTime);
    }

    /**
     * Renders the game
     * @private
     */
    render() {
        // Use minimal renderer in critical performance situations
        if (this.currentFPS !== undefined && this.currentFPS <= 2 && this.minimalRenderer) {
            this.minimalRenderer.render(this);
            return;
        }

        // Use simplified renderer in performance mode
        if (this.performanceMode && this.performanceMode.enabled &&
            this.simplifiedRenderer && this.currentFPS < 10) {
            this.simplifiedRenderer.render(this);
            return;
        }

        this.renderer.clear();

        // Apply camera transform
        this.ctx.save();

        // Center the view
        const offsetX = this.canvas.width / 2;
        const offsetY = this.canvas.height / 2;

        // Convert camera world coordinates to isometric coordinates
        const isoX = (this.camera.x - this.camera.y) * (this.renderer.tileWidth / 2);
        const isoY = (this.camera.x + this.camera.y) * (this.renderer.tileHeight / 2);

        // Apply zoom scaling first
        this.ctx.scale(this.camera.zoom, this.camera.zoom);

        // Then translate to center the view on the camera position
        // Divide by zoom because we've already scaled the context
        this.ctx.translate(
            offsetX / this.camera.zoom - isoX,
            offsetY / this.camera.zoom - isoY
        );

        // Log camera transform if debug is enabled
        if (this.debug?.flags?.logRenderer) {
            console.log('Camera transform:', {
                zoom: this.camera.zoom,
                offsetX: offsetX / this.camera.zoom - isoX,
                offsetY: offsetY / this.camera.zoom - isoY,
                cameraPos: `(${this.camera.x},${this.camera.y})`,
                cameraOffset: `(${this.camera.offsetX},${this.camera.offsetY})`,
                playerPos: `(${this.player.x},${this.player.y})`,
                isoPos: `(${isoX},${isoY})`
            });
        }

        // Render world tiles first (without structures)
        this.renderer.renderWorldTiles(this.world, this.camera, this.tileManager);

        // Draw tile coordinates if enabled
        this.drawTileCoordinates();

        // Calculate visible area based on camera position and zoom
        const viewportWidth = this.canvas.width / this.camera.zoom;
        const viewportHeight = this.canvas.height / this.camera.zoom;

        // Add a buffer around the visible area
        const buffer = 5;

        // Calculate visible range in world coordinates
        const visibleRange = Math.ceil(Math.max(viewportWidth, viewportHeight) / (this.renderer.tileWidth * this.camera.zoom)) + buffer;

        // Calculate bounds
        const minX = Math.max(0, Math.floor(this.camera.x - visibleRange));
        const minY = Math.max(0, Math.floor(this.camera.y - visibleRange));
        const maxX = Math.min(this.world.width - 1, Math.ceil(this.camera.x + visibleRange));
        const maxY = Math.min(this.world.height - 1, Math.ceil(this.camera.y + visibleRange));

        // Filter entities to only those in the visible area
        const visibleEntities = [];

        // Performance tracking
        let entitiesProcessed = 0;
        let entitiesCulled = 0;

        // Use spatial grid for faster entity culling if available
        const isPerformanceMode = this.performanceMode?.enabled;
        const maxEntities = isPerformanceMode ? this.performanceMode.maxEntitiesRendered : 100;
        const cullingDistance = isPerformanceMode ? this.performanceMode.cullingDistance : visibleRange;
        const visibleRangeSq = cullingDistance * cullingDistance;
        const lodDistance = isPerformanceMode ? this.performanceMode.lodDistance : visibleRange * 0.7;
        const lodDistanceSq = lodDistance * lodDistance;

        // Sort entities by distance to camera for better LOD and culling
        const entitiesWithDistance = [];

        if (this.spatialGrid) {
            // Use spatial grid to find visible entities
            const visibleRect = this.rectPool.get(
                this.camera.x - cullingDistance,
                this.camera.y - cullingDistance,
                cullingDistance * 2,
                cullingDistance * 2
            );

            // Query entities in visible area
            this.spatialGrid.queryRect(
                visibleRect.x, visibleRect.y, visibleRect.width, visibleRect.height,
                entity => {
                    // Skip entities that don't have a render method
                    if (!entity.render) {
                        entitiesCulled++;
                        return;
                    }

                    // Skip entities that aren't visible
                    if (!entity.isVisible) {
                        entitiesCulled++;
                        return;
                    }

                    // Quick distance check (squared distance to avoid sqrt)
                    const dx = entity.x - this.camera.x;
                    const dy = entity.y - this.camera.y;
                    const distanceSq = dx * dx + dy * dy;

                    // Skip entities that are too far from camera
                    if (distanceSq > visibleRangeSq) {
                        entitiesCulled++;
                        return;
                    }

                    // Use occlusion culling if available
                    if (this.occlusionCulling &&
                        this.occlusionCulling.isOccluded(entity, this.camera) &&
                        !entity.isImportant) {
                        entitiesCulled++;
                        return;
                    }

                    // Set LOD level based on distance
                    if (isPerformanceMode && this.performanceMode.lodEnabled) {
                        if (distanceSq > lodDistanceSq) {
                            entity.lodLevel = 'low';
                        } else {
                            entity.lodLevel = 'high';
                        }
                    } else {
                        entity.lodLevel = 'high';
                    }

                    entitiesProcessed++;
                    entitiesWithDistance.push({ entity, distanceSq });
                }
            );

            // Release the rect back to the pool
            this.rectPool.release(visibleRect);
        } else {
            // Fallback to traditional culling if spatial grid is not available
            // Convert Set to Array only once and cache the result
            if (!this._entitiesArray || this._lastEntityCount !== this.entities.size) {
                this._entitiesArray = Array.from(this.entities);
                this._lastEntityCount = this.entities.size;
            }

            const entities = this._entitiesArray;

            for (let i = 0; i < entities.length; i++) {
                const entity = entities[i];

                // Skip entities that don't have a render method (fast check)
                if (!entity.render) {
                    entitiesCulled++;
                    continue;
                }

                // Skip entities that aren't visible (fast check)
                if (!entity.isVisible) {
                    entitiesCulled++;
                    continue;
                }

                // Quick distance check (squared distance to avoid sqrt)
                const dx = entity.x - this.camera.x;
                const dy = entity.y - this.camera.y;
                const distanceSq = dx * dx + dy * dy;

                // Skip entities that are too far from camera (faster than bounds check)
                if (distanceSq > visibleRangeSq) {
                    entitiesCulled++;
                    continue;
                }

                // More precise check for entities near the edge of the visible area
                if (entity.x < minX || entity.x > maxX || entity.y < minY || entity.y > maxY) {
                    entitiesCulled++;
                    continue;
                }

                // Use occlusion culling if available
                if (this.occlusionCulling &&
                    this.occlusionCulling.isOccluded(entity, this.camera) &&
                    !entity.isImportant) {
                    entitiesCulled++;
                    continue;
                }

                // Set LOD level based on distance
                if (isPerformanceMode && this.performanceMode.lodEnabled) {
                    if (distanceSq > lodDistanceSq) {
                        entity.lodLevel = 'low';
                    } else {
                        entity.lodLevel = 'high';
                    }
                } else {
                    entity.lodLevel = 'high';
                }

                entitiesProcessed++;
                entitiesWithDistance.push({ entity, distanceSq });
            }
        }

        // Sort entities by distance (closest first) for better rendering
        entitiesWithDistance.sort((a, b) => a.distanceSq - b.distanceSq);

        // Limit the number of entities rendered in performance mode
        const entitiesToRender = isPerformanceMode
            ? entitiesWithDistance.slice(0, maxEntities)
            : entitiesWithDistance;

        // Extract just the entities from the sorted array
        for (let i = 0; i < entitiesToRender.length; i++) {
            visibleEntities.push(entitiesToRender[i].entity);
        }

        // Log entity culling stats if performance logging is enabled
        if (this.debug?.flags?.logPerformance && this.frameCount % 60 === 0) {
            console.log(`Entity rendering: ${visibleEntities.length} rendered, ${entitiesCulled} culled, ${entitiesProcessed} processed`);
        }

        // Now categorize visible entities for proper z-ordering
        const entitiesOutside = [];
        const entitiesInside = [];
        const entitiesBehindStructures = [];

        // Categorize each visible entity
        for (let i = 0; i < visibleEntities.length; i++) {
            const entity = visibleEntities[i];

            // Split into different groups based on position and visibility
            // IMPORTANT: Check isBehindStructure first to ensure proper z-ordering
            if (entity.isBehindStructure) {
                // Entities that are behind structures but still visible
                entitiesBehindStructures.push(entity);

                // Debug logging for entities behind structures
                if (this.debug?.flags?.logEntities) {
                    console.log(`Entity ${entity.name} is behind a structure:`, {
                        position: { x: entity.x, y: entity.y },
                        depth: entity.x + entity.y,
                        isOccluded: entity.isOccluded,
                        isBehindStructure: entity.isBehindStructure
                    });
                }
            } else if (entity.currentStructure) {
                // Entities inside structures - these should be rendered AFTER the structure
                // but only if the player is in the same structure
                if (this.player && this.player.currentStructure === entity.currentStructure) {
                    entitiesInside.push(entity);

                    // Debug logging for entities inside structures
                    if (this.debug?.flags?.logEntities) {
                        console.log(`Entity ${entity.name} is inside structure:`, {
                            structure: entity.currentStructure.type,
                            position: { x: entity.x, y: entity.y },
                            depth: entity.x + entity.y
                        });
                    }
                }
            } else {
                // Entities outside structures
                entitiesOutside.push(entity);

                // Debug logging for entities outside
                if (this.debug?.flags?.logEntities) {
                    console.log(`Entity ${entity.name} is outside:`, {
                        position: { x: entity.x, y: entity.y },
                        depth: entity.x + entity.y
                    });
                }
            }
        }

        // Skip sorting for now to fix the syntax error

        // Log sorting results if debug is enabled
        if (this.debug?.flags?.logEntities) {
            console.log('Sorted entities by zIndex:', {
                behindStructures: entitiesBehindStructures.map(e => ({ name: e.name, zIndex: e.zIndex || (e.x + e.y) })),
                outside: entitiesOutside.map(e => ({ name: e.name, zIndex: e.zIndex || (e.x + e.y) })),
                inside: entitiesInside.map(e => ({ name: e.name, zIndex: e.zIndex || (e.x + e.y) }))
            });
        }

        // Debug log sorting
        if (this.debug?.flags?.logEntities) {
            console.log('Entity sorting:', {
                outside: entitiesOutside.map(e => ({ name: e.name, depth: e.x + e.y })),
                inside: entitiesInside.map(e => ({ name: e.name, depth: e.x + e.y })),
                behindStructures: entitiesBehindStructures.map(e => ({ name: e.name, depth: e.x + e.y }))
            });
        }

        // Debug log for entities - only log if debug flag is enabled
        if (this.debug?.flags?.logEntities) {
            console.log('Visible entities:', {
                total: visibleEntities.length,
                outside: entitiesOutside.length,
                inside: entitiesInside.length,
                behindStructures: entitiesBehindStructures.length,
                bounds: `(${minX},${minY}) to (${maxX},${maxY})`
            });
        }

        // RENDERING ORDER:
        // 1. Entities behind structures (lowest z-index)
        // 2. Structures
        // 3. Entities outside structures
        // 4. Entities inside structures (only visible when player is in the same structure)
        // 5. Player (highest z-index)

        // Clear render batches
        this.renderBatch.clear();

        // 1. Batch entities behind structures (lowest z-index)
        for (let i = 0; i < entitiesBehindStructures.length; i++) {
            const entity = entitiesBehindStructures[i];
            if (entity.render && entity.isVisible) {
                // Add to behind structures batch
                this.renderBatch.add('behind', entity);

                if (this.debug?.flags?.logEntities) {
                    console.log(`Batched entity behind structure: ${entity.name} at depth ${entity.x + entity.y}`);
                }
            }
        }

        // 2. Render structures
        this.renderer.renderWorldStructures(this.world, this.camera, this);

        // 3. Batch outside entities
        for (let i = 0; i < entitiesOutside.length; i++) {
            const entity = entitiesOutside[i];
            if (entity.render && entity.isVisible) {
                // Group by entity type for better batching
                const batchKey = entity.type || 'default';
                this.renderBatch.add(batchKey, entity);

                if (this.debug?.flags?.logEntities) {
                    console.log(`Batched outside entity: ${entity.name} at depth ${entity.x + entity.y}`);
                }
            }
        }

        // 4. Batch inside entities (only visible when player is in the same structure)
        for (let i = 0; i < entitiesInside.length; i++) {
            const entity = entitiesInside[i];
            if (entity.render && entity.isVisible) {
                // Group by entity type for better batching
                const batchKey = 'inside_' + (entity.type || 'default');
                this.renderBatch.add(batchKey, entity);

                if (this.debug?.flags?.logEntities) {
                    console.log(`Batched inside entity: ${entity.name} at depth ${entity.x + entity.y}`);
                }
            }
        }

        // Draw batched entities
        // 1. First draw entities behind structures with transparency
        this.ctx.save();
        this.ctx.globalAlpha = 0.6; // 60% opacity
        this.renderBatch.draw(this.ctx, (ctx, key, entity) => {
            if (key === 'behind') {
                entity.render(ctx, this.renderer);
            }
        });
        this.ctx.restore();

        // 2. Draw outside entities
        this.renderBatch.draw(this.ctx, (ctx, key, entity) => {
            if (key !== 'behind' && !key.startsWith('inside_')) {
                entity.render(ctx, this.renderer);
            }
        });

        // 3. Draw inside entities
        this.renderBatch.draw(this.ctx, (ctx, key, entity) => {
            if (key.startsWith('inside_')) {
                entity.render(ctx, this.renderer);
            }
        });

        // Render player last
        if (this.player) {
            this.player.render(this.ctx, this.renderer);
        }

        this.ctx.restore();

        // Render UI on top of everything
        if (this.uiManager) {
            this.uiManager.render(this.ctx);
        }

        // Render minimap last (on top of everything)
        if (this.minimap) {
            this.minimap.render();
        }

        // Log entity rendering stats if performance logging is enabled
        if (this.debug?.flags?.logPerformance && this.frameCount % 60 === 0) {
            console.log(`Entity rendering: ${entitiesProcessed} rendered, ${entitiesCulled} culled`);
        }
    }

    drawDebugGrid() {
        const viewDistance = 16;
        const tileWidth = this.renderer.tileWidth;
        const tileHeight = this.renderer.tileHeight;

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;

        // Draw diamond-shaped grid
        for (let i = -viewDistance; i <= viewDistance; i++) {
            // Draw lines parallel to x-axis in isometric space
            const startX1 = (i - viewDistance) * (tileWidth / 2);
            const startY1 = i * (tileHeight / 2);
            const endX1 = (i + viewDistance) * (tileWidth / 2);
            const endY1 = i * (tileHeight / 2);

            this.ctx.beginPath();
            this.ctx.moveTo(startX1, startY1);
            this.ctx.lineTo(endX1, endY1);
            this.ctx.stroke();

            // Draw lines parallel to y-axis in isometric space
            const startX2 = i * (tileWidth / 2);
            const startY2 = (-viewDistance + i) * (tileHeight / 2);
            const endX2 = i * (tileWidth / 2);
            const endY2 = (viewDistance + i) * (tileHeight / 2);

            this.ctx.beginPath();
            this.ctx.moveTo(startX2, startY2);
            this.ctx.lineTo(endX2, endY2);
            this.ctx.stroke();
        }
    }

    setupDebugControls() {
        console.log('Debug controls setup started...');

        window.addEventListener('keydown', (e) => {
            console.log('Key pressed:', e.key, 'Alt:', e.altKey);

            // Layout mode toggle
            if (e.altKey && e.key.toLowerCase() === 'l') {
                console.log('Layout mode toggle triggered');
                if (this.debug.flags.enableLayoutMode) {
                    this.layoutMode.enabled = !this.layoutMode.enabled;
                    console.log(`Layout mode: ${this.layoutMode.enabled ? 'enabled' : 'disabled'}`);
                    this.updateLayoutMode();
                }
            }

            // Other debug controls
            if (e.ctrlKey) {
                switch(e.key.toLowerCase()) {
                    case 'd':
                        this.debug.enabled = !this.debug.enabled;
                        console.log(`Debug mode: ${this.debug.enabled ? 'enabled' : 'disabled'}`);
                        break;
                    case 'p':
                        if (!this.debug.enabled) return;
                        this.debug.flags.showPath = !this.debug.flags.showPath;
                        break;
                    case 'g':
                        if (!this.debug.enabled) return;
                        this.debug.flags.showGrid = !this.debug.flags.showGrid;
                        break;
                    case 'c': // Add this case
                        if (!this.debug.enabled) return;
                        this.debug.flags.showCoordinates = !this.debug.flags.showCoordinates;
                        console.log(`Coordinates display: ${this.debug.flags.showCoordinates ? 'enabled' : 'disabled'}`);
                        break;
                }
            }
        });
    }

    resize(width, height) {
        console.log(`Game: Resizing to ${width}x${height}`);
        this.canvas.width = width;
        this.canvas.height = height;
    }

    // Example method to calculate terrain height
    getTerrainHeightAt(x, y) {
        // Get the height value from the world, or return 0 if not available
        return this.world ? this.world.generateHeight(Math.floor(x), Math.floor(y)) : 0;
    }

    // Example method to calculate terrain angle
    getTerrainAngleAt(x, y) {
        // Calculate terrain angle based on neighboring heights
        if (!this.world) return 0;

        const x1 = Math.floor(x);
        const y1 = Math.floor(y);
        const h1 = this.world.generateHeight(x1, y1);
        const h2 = this.world.generateHeight(x1 + 1, y1);
        const h3 = this.world.generateHeight(x1, y1 + 1);

        // Calculate approximate angle based on height differences
        const dx = h2 - h1;
        const dy = h3 - h1;
        return Math.atan2(dy, dx);
    }

    // Add this helper method to convert world coordinates to isometric
    convertToIsometric(x, y) {
        return {
            x: (x - y) * TILE_WIDTH_HALF,
            y: (x + y) * TILE_HEIGHT_HALF
        };
    }

    /**
     * Converts screen coordinates to world coordinates
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @returns {{x: number, y: number}} World coordinates
     */
    screenToWorld(screenX, screenY) {
        try {
            // Get the center offset where (0,0) should be
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;

            // Calculate the camera's isometric position
            const isoX = (this.camera.x - this.camera.y) * (this.renderer.tileWidth / 2);
            const isoY = (this.camera.x + this.camera.y) * (this.renderer.tileHeight / 2);

            // Adjust click coordinates relative to camera position and zoom
            const adjustedX = (screenX - centerX) / this.camera.zoom + isoX;
            const adjustedY = (screenY - centerY) / this.camera.zoom + isoY;

            // Convert isometric coordinates back to world coordinates
            const worldX = Math.round(
                (adjustedX / (this.renderer.tileWidth / 2) + adjustedY / (this.renderer.tileHeight / 2)) / 2
            );
            const worldY = Math.round(
                (adjustedY / (this.renderer.tileHeight / 2) - adjustedX / (this.renderer.tileWidth / 2)) / 2
            );

            // Log conversion if debug is enabled
            if (this.debug?.flags?.logInput) {
                console.log('Screen to world conversion:', {
                    screen: { x: screenX, y: screenY },
                    world: { x: worldX, y: worldY },
                    camera: { x: this.camera.x, y: this.camera.y, zoom: this.camera.zoom }
                });
            }

            return { x: worldX, y: worldY };
        } catch (error) {
            console.error('Error in screenToWorld conversion:', error);
            // Return a fallback position near the camera
            return { x: Math.round(this.camera.x), y: Math.round(this.camera.y) };
        }
    }

    /**
     * Finds the NPC that was clicked on
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @returns {NPC|Merchant|null} The clicked NPC or null if none was clicked
     */
    findClickedNPC(screenX, screenY) {
        try {
            // Convert screen coordinates to world coordinates
            const worldPos = this.screenToWorld(screenX, screenY);

            if (this.debug?.flags?.logInput) {
                console.log('Click detected:', {
                    screen: { x: screenX, y: screenY },
                    world: worldPos
                });
            }

            // Check all entities with a larger threshold
            const clickThreshold = 1.5; // Increased from 1.0 to 1.5
            let closestEntity = null;
            let closestDistance = Infinity;

            // Only check entities that are visible and within range of the camera
            const cameraRange = 20; // Only check entities within this range of the camera
            const visibleEntities = Array.from(this.entities).filter(entity => {
                // Skip entities that aren't NPCs
                if (!(entity instanceof NPC || entity instanceof Merchant)) {
                    return false;
                }

                // Skip entities that aren't visible
                if (!entity.isVisible) {
                    return false;
                }

                // Skip entities that are too far from the camera
                const dx = entity.x - this.camera.x;
                const dy = entity.y - this.camera.y;
                const distanceSquared = dx * dx + dy * dy;
                return distanceSquared <= cameraRange * cameraRange;
            });

            // Log the number of entities being checked
            if (this.debug?.flags?.logInput) {
                console.log(`Checking ${visibleEntities.length} visible entities near camera`);
            }

            // Check each visible entity
            for (const entity of visibleEntities) {
                const distance = Math.sqrt(
                    Math.pow(entity.x - worldPos.x, 2) +
                    Math.pow(entity.y - worldPos.y, 2)
                );

                if (this.debug?.flags?.logInput) {
                    console.log(`Checking ${entity.isEnemy ? 'enemy' : 'NPC'}:`, {
                        name: entity.name,
                        pos: { x: entity.x, y: entity.y },
                        distance: distance,
                        clickThreshold: clickThreshold,
                        isEnemy: entity.isEnemy
                    });
                }

                // If within threshold and closer than any previous entity
                if (distance < clickThreshold && distance < closestDistance) {
                    closestEntity = entity;
                    closestDistance = distance;
                }
            }

            if (closestEntity) {
                if (this.debug?.flags?.logInput) {
                    console.log(`${closestEntity.isEnemy ? 'Enemy' : 'NPC'} clicked:`, {
                        name: closestEntity.name,
                        type: closestEntity.constructor.name,
                        isEnemy: closestEntity.isEnemy
                    });
                }
                return closestEntity;
            }

            return null;
        } catch (error) {
            console.error('Error in findClickedNPC:', error);
            return null;
        }
    }

    findAdjacentTile(npc) {
        console.log('Finding adjacent tile for:', npc);

        // Check if NPC is inside a structure
        const isInStructure = this.pathFinder.isInsideStructure(npc.x, npc.y);
        console.log('NPC structure check:', { isInStructure, npcPos: { x: npc.x, y: npc.y } });

        // Check tiles in a cross pattern around the NPC
        const adjacentPositions = [
            { x: 0, y: 1 },  // North
            { x: 1, y: 0 },  // East
            { x: 0, y: -1 }, // South
            { x: -1, y: 0 }  // West
        ];

        for (const pos of adjacentPositions) {
            const checkX = Math.round(npc.x + pos.x);
            const checkY = Math.round(npc.y + pos.y);

            // Allow interior movement if NPC is inside a structure
            if (this.pathFinder.isWalkable(checkX, checkY, isInStructure)) {
                console.log('Found adjacent tile:', { x: checkX, y: checkY });
                return { x: checkX, y: checkY };
            }
        }

        // If no adjacent tile found, try diagonal positions as fallback
        const diagonalPositions = [
            { x: 1, y: 1 },   // Northeast
            { x: -1, y: 1 },  // Northwest
            { x: 1, y: -1 },  // Southeast
            { x: -1, y: -1 }  // Southwest
        ];

        for (const pos of diagonalPositions) {
            const checkX = Math.round(npc.x + pos.x);
            const checkY = Math.round(npc.y + pos.y);

            if (this.pathFinder.isWalkable(checkX, checkY, isInStructure)) {
                console.log('Found diagonal adjacent tile:', { x: checkX, y: checkY });
                return { x: checkX, y: checkY };
            }
        }

        console.log('No adjacent tile found');
        return null;
    }

    startDialog(npc) {
        if (!npc) return;

        if (this.debug?.flags?.logDialog) {
            console.log('Starting dialog with:', {
                type: npc.constructor.name,
                name: npc.name,
                isEnemy: npc.isEnemy
            });
        }

        // Check if NPC is an enemy
        if (npc.isEnemy) {
            if (this.debug?.flags?.logDialog) {
                console.log('Starting combat dialog with enemy:', npc.name);
            }

            // Get enemy dialog text or use default
            const enemyText = npc.dialog?.[0]?.text || "Prepare to fight!";

            this.messageSystem.queueMessage({
                speaker: npc.name || 'Enemy',
                text: enemyText,
                logMessage: true,
                options: [
                    {
                        text: "Fight",
                        action: () => {
                            this.messageSystem.hide();
                            // Initiate combat directly
                            if (this.combatSystem) {
                                this.combatSystem.initiateCombat(this.player, npc);
                            } else {
                                console.error('Combat system not initialized');
                            }
                        }
                    },
                    {
                        text: "Run away",
                        action: () => this.messageSystem.hide()
                    }
                ]
            });
            return;
        }

        // Handle merchant interaction
        if (npc instanceof Merchant) {
            // First try direct interaction
            const interactionResult = npc.interact(this.player);
            console.log('Merchant interaction result:', interactionResult);

            // If interaction fails, fall back to dialog
            if (!interactionResult) {
                console.log('Falling back to merchant dialog');
                this.messageSystem.queueMessage({
                    speaker: npc.name || 'Merchant',
                    text: "Welcome to my shop! Would you like to see my wares?",
                    logMessage: true,
                    options: [
                        {
                            text: "Show me what you have",
                            action: () => {
                                const merchantUI = this.uiManager.components.get('merchantUI');
                                if (merchantUI) {
                                    merchantUI.show(npc);
                                } else {
                                    console.error('MerchantUI component not found');
                                }
                            }
                        },
                        {
                            text: "Goodbye",
                            action: () => this.messageSystem.hide()
                        }
                    ]
                });
            }
            return;
        }

        // Handle regular NPC dialog
        if (npc.constructor.name === 'NPC') {
            const dialogOptions = npc.dialog || [];
            if (dialogOptions.length > 0) {
                const randomDialog = dialogOptions[Math.floor(Math.random() * dialogOptions.length)];
                this.messageSystem.queueMessage({
                    speaker: npc.name || 'NPC',
                    text: randomDialog.text || "Hello there!",
                    logMessage: true,
                    options: [
                        {
                            text: "Goodbye",
                            action: () => this.messageSystem.hide()
                        }
                    ]
                });
            }
        }
    }

    closeDialog() {
        this.messageSystem.hide();
    }

    // Example of using MessageLog directly for game events
    handleCombatResult(damage, target) {
        this.uiManager.components.get('messageLog')
            .addMessage(`You hit ${target} for ${damage} damage!`);
    }

    handleItemPickup(item) {
        this.uiManager.components.get('messageLog')
            .addMessage(`Picked up ${item.name}`);
    }

    /**
     * Handles player defeat in combat
     */
    handlePlayerDefeat() {
        // Reset player health to 1
        this.player.health = 1;

        // Teleport player to spawn point
        const spawnPoint = this.world.mapDefinition.spawnPoints[0];
        if (spawnPoint) {
            this.player.x = spawnPoint.x;
            this.player.y = spawnPoint.y;
        }

        // Show defeat message
        this.messageSystem.queueMessage({
            speaker: 'System',
            text: "You have been defeated! You've been returned to the spawn point with 1 health.",
            logMessage: true,
            options: [
                {
                    text: "Continue",
                    action: () => this.messageSystem.hide()
                }
            ]
        });
    }

    /**
     * Creates NPCs from the map definition
     * @returns {Array} Array of created NPCs
     */
    createNPCsFromMapDefinition() {
        if (!this.world || !this.world.npcs || this.world.npcs.length === 0) {
            console.log('No NPCs defined in map');
            return [];
        }

        console.log(`Creating ${this.world.npcs.length} NPCs from map definition:`, this.world.npcs);
        const createdNPCs = [];

        // Process each NPC definition
        this.world.npcs.forEach(npcData => {
            try {
                let npc;

                // Create the appropriate NPC type
                if (npcData.type === 'merchant') {
                    npc = new Merchant({
                        x: npcData.x,
                        y: npcData.y,
                        name: npcData.name || 'Merchant',
                        eth: npcData.eth || 500,
                        color: npcData.color || '#FFD700', // Gold color for merchants
                        world: this.world,
                        game: this
                    });

                    // Add some items to the merchant's inventory
                    if (npc.inventory) {
                        const randomItem = new Item({
                            id: 'random_item_' + Math.floor(Math.random() * 1000),
                            name: 'Random Item',
                            description: 'A mysterious item',
                            type: 'misc',
                            value: Math.floor(Math.random() * 100) + 10,
                            weight: Math.random() * 2,
                            icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAPklEQVR42mNkGAWjYBSMglEwCkbBKBgFo2AUjIJRMAqGIWBkZGQEis0DzQdjxkH3AuQS6wNtAQN/GIyCUTAKBjMAALl5C/V1fHh4AAAAAElFTkSuQmCC'
                        });
                        npc.inventory.addItem(randomItem);
                    }
                } else if (npcData.type === 'enemy') {
                    // Create an enemy NPC with combat properties
                    npc = new NPC({
                        x: npcData.x,
                        y: npcData.y,
                        name: npcData.name || 'Enemy',
                        color: npcData.color || '#FF0000', // Red color for enemies
                        world: this.world,
                        game: this, // Add game reference
                        isEnemy: true,
                        damage: npcData.damage || 10,
                        health: npcData.health || 100,
                        attackRange: npcData.attackRange || 2,
                        behavior: npcData.behavior || { isPatrolling: false }
                    });
                } else {
                    // Create a regular NPC
                    npc = new NPC({
                        x: npcData.x,
                        y: npcData.y,
                        name: npcData.name || 'NPC',
                        color: npcData.color || '#3498db', // Blue color for regular NPCs
                        world: this.world,
                        game: this, // Add game reference
                        type: npcData.type // Ensure type is set correctly
                    });

                    // Special case for DJ - ensure it's always visible
                    if (npcData.name === 'DJ') {
                        npc.alwaysVisible = true;
                    }
                }

                // Add dialog if provided
                if (npcData.dialog && npc.setDialog) {
                    npc.setDialog(npcData.dialog);
                }

                // Add the NPC to the game
                if (npc) {
                    this.entities.add(npc);
                    createdNPCs.push(npc);
                    console.log(`Created ${npcData.type} NPC '${npc.name}' at ${npc.x},${npc.y}`, {
                        isEnemy: npc.isEnemy,
                        isVisible: npc.isVisible,
                        color: npc.color,
                        entityCount: this.entities.size,
                        inEntities: Array.from(this.entities).includes(npc)
                    });
                }
            } catch (error) {
                console.error(`Failed to create NPC ${npcData.name || 'unknown'}:`, error);
            }
        });

        console.log(`Successfully created ${createdNPCs.length} NPCs`);
        return createdNPCs;
    }

    addMerchantNearPlayer() {
        // Try to find a nearby structure first
        const nearbyStructures = this.world.getAllStructures().filter(structure =>
            structure.type !== 'dumpster' &&  // Skip certain structure types
            Math.abs(structure.x - this.player.x) < 10 &&
            Math.abs(structure.y - this.player.y) < 10
        );

        if (nearbyStructures.length > 0) {
            // Pick a random structure
            const structure = nearbyStructures[Math.floor(Math.random() * nearbyStructures.length)];

            // Place merchant inside the structure
            const merchantPosition = {
                x: structure.x + Math.floor(structure.width / 2),
                y: structure.y + Math.floor(structure.height / 2)
            };

            const merchant = this.createMerchant(merchantPosition, structure);
            if (merchant) {
                this.entities.add(merchant);
                return merchant;
            }
        }

        // Fallback to original outdoor placement
        const merchantPosition = {
            x: this.player.x + 5,
            y: this.player.y + 5
        };

        console.log('Creating merchant at position:', merchantPosition);

        try {
            const merchant = this.createMerchant(merchantPosition);
            if (merchant) {
                this.entities.add(merchant);
                console.log('Merchant added successfully:', {
                    position: merchantPosition,
                    entityCount: this.entities.size,
                    merchantExists: this.entities.has(merchant)
                });
                return merchant;
            } else {
                console.error('Failed to create merchant');
            }
        } catch (error) {
            console.error('Error creating merchant:', error);
        }
        return null;
    }

    updateLayoutMode() {
        console.log('Updating layout mode state...');

        if (this.layoutMode.enabled) {
            // Enable layout mode specific features
            this.canvas.style.cursor = 'crosshair';

            // Update UI if LayoutToolsUI exists
            if (this.layoutToolsUI) {
                this.layoutToolsUI.update();
            }

            // Enable grid by default in layout mode
            this.debug.flags.showGrid = true;
        } else {
            // Disable layout mode features
            this.canvas.style.cursor = 'default';

            // Reset grid to previous state
            this.debug.flags.showGrid = false;
        }

        // Trigger a re-render
        if (this.renderer) {
            this.renderer.clear();
            this.render();
        }
    }

    // Debug method to draw coordinates on tiles
    drawTileCoordinates() {
        // Early return if coordinates display is disabled
        if (!this.debug.flags.showCoordinates) return;

        this.ctx.save();

        // More visible text styling
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillStyle = 'yellow';
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 2;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Use full world dimensions
        for (let y = 0; y < this.world.height; y++) {
            for (let x = 0; x < this.world.width; x++) {
                // Convert world coordinates to screen coordinates
                const isoX = (x - y) * (this.renderer.tileWidth / 2);
                const isoY = (x + y) * (this.renderer.tileHeight / 2);

                const text = `${x},${y}`;

                // Draw text with outline for better visibility
                this.ctx.strokeText(text, isoX, isoY);
                this.ctx.fillText(text, isoX, isoY);
            }
        }

        this.ctx.restore();
    }

    /**
     * Gets current game hour (0-24)
     * @returns {number} Current game hour
     */
    getGameHour() {
        if (!this.running) {
            return this.gamePausedTime / (1000 * this.gameTimeScale) % 24;
        }

        const currentTime = Date.now();
        const elapsedRealTime = currentTime - this.gameStartTime;
        const gameTime = elapsedRealTime * (this.gameTimeScale / 60); // Convert to game minutes

        // Convert to hours (0-24)
        return (gameTime / 60) % 24;
    }

    pause() {
        if (this.running) {
            this.running = false;
            this.lastPauseTime = Date.now();
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
        }
    }

    resume() {
        if (!this.running) {
            if (this.lastPauseTime) {
                const pauseDuration = Date.now() - this.lastPauseTime;
                this.gameStartTime += pauseDuration; // Adjust start time to account for pause
            }
            this.running = true;
            this.lastTime = performance.now();
            this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
        }
    }

    /**
     * Sets specific time of day
     * @param {number} hour - Hour to set (0-24)
     */
    setGameHour(hour) {
        if (hour < 0 || hour >= 24) {
            console.warn('Invalid hour value. Must be between 0 and 24');
            return;
        }

        const currentHour = this.getGameHour();
        const hourDiff = hour - currentHour;
        const timeAdjustment = (hourDiff * 60 * 60 * 1000) / this.gameTimeScale;
        this.gameStartTime -= timeAdjustment;
    }
}






















