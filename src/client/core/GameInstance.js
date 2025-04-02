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
import { createRemixedMap } from './world/templates/RemixedDemoMap.js';

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
        console.log('Game: Initializing...');
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
        
        // Initialize camera with minimum zoom
        this.camera = {
            x: 0,
            y: 0,
            zoom: 0.5,
            centerOn(x, y) {
                this.x = x;
                this.y = y;
            }
        };
        
        // Centralize debug configuration
        this.debug = {
            enabled: true,
            flags: {
                showPath: false,
                //showGrid: false,
                //showCoordinates: true,  // Set to true by default
                logTextureLoading: false,
                logDecorations: true,  // Make sure this is true
                logZoomChanges: false,
                logStructures: true,
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
            tileManager: this.tileManager
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
            x: playerSpawnPoint.x,
            y: playerSpawnPoint.y,
            world: this.world,
            pathFinder: this.pathFinder
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
        console.log('Game: Starting initialization...');
        try {
            // Set base URL for assets if provided in options
            if (this.options?.assetsBaseUrl) {
                this.assetManager.setBaseUrl(this.options.assetsBaseUrl);
            }

            // Initialize texture loading
            await this.initializeTextures();
            
            // Initialize world after textures are loaded
            await this.world.tileManager.loadTextures();
            
            console.log('Game: Textures loaded successfully');
            
            this.setupInput();
            this.setupDebugControls();
            
            // Add merchant after initialization
            this.addMerchantNearPlayer();
            
            return true;
        } catch (error) {
            console.error('Game: Failed to initialize:', error);
            return false;
        }
    }

    /**
     * Initializes all game textures
     * @private
     * @async
     */
    async initializeTextures() {
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
            texturePromises.push(
                this.tileManager.generateTexture(type, this.tileManager.tileColors[type])
            );
        });

        // Initialize terrain textures
        for (const [terrainType, config] of Object.entries(this.textureDefinitions.terrain)) {
            if (!baseTextureTypes.includes(terrainType)) {
                texturePromises.push(
                    this.tileManager.generateTexture(terrainType, config.base)
                );
            }

            // Generate variant textures if they exist
            if (config.variants) {
                config.variants.forEach((variant, index) => {
                    texturePromises.push(
                        this.tileManager.generateTexture(
                            variant,
                            config.variantColors[index]
                        )
                    );
                });
            }
        }

        // Initialize decoration textures
        for (const [decType, config] of Object.entries(this.textureDefinitions.decorations)) {
            if (!baseTextureTypes.includes(decType)) {
                texturePromises.push(
                    this.tileManager.generateTexture(decType, config.base)
                );
            }

            // Generate variant textures if they exist
            if (config.variants) {
                config.variants.forEach((variant, index) => {
                    texturePromises.push(
                        this.tileManager.generateTexture(
                            variant,
                            config.variantColors[index]
                        )
                    );
                });
            }
        }

        // Add debug logging for texture loading
        if (this.debug?.flags?.logTextureLoading) {
            console.log('Game: Loading textures:', {
                baseTypes: baseTextureTypes,
                terrain: Object.keys(this.textureDefinitions.terrain),
                decorations: Object.keys(this.textureDefinitions.decorations)
            });
        }

        try {
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
            const zoomSpeed = 0.1;
            const newZoom = Math.max(0.5, Math.min(2,
                this.camera.zoom + (e.deltaY > 0 ? -zoomSpeed : zoomSpeed)
            ));
            
            // Only update if zoom actually changed
            if (newZoom !== this.camera.zoom) {
                this.camera.zoom = newZoom;
                if (this.debug.flags.logZoomChanges) {
                    console.log('Zoom updated:', this.camera.zoom);
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

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.inputManager && this.inputManager.isShiftPressed) {
                const { deltaX, deltaY } = this.inputManager.getMouseDelta();
                this.camera.x -= deltaX / this.camera.zoom;
                this.camera.y -= deltaY / this.camera.zoom;
            }
        });

        this.canvas.addEventListener('click', (e) => {
            console.log('Canvas clicked');
            
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
                return;
            }
            
            // Get the center offset where (0,0) should be
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            
            // Calculate the player's isometric position
            const playerIsoX = (this.player.x - this.player.y) * (this.renderer.tileWidth / 2);
            const playerIsoY = (this.player.x + this.player.y) * (this.renderer.tileHeight / 2);
            
            // Adjust click coordinates relative to player position and camera zoom
            const adjustedX = (screenX - centerX) / this.camera.zoom + playerIsoX;
            const adjustedY = (screenY - centerY) / this.camera.zoom + playerIsoY;
            
            // Convert isometric coordinates back to world coordinates
            const worldX = Math.round(
                (adjustedX / (this.renderer.tileWidth / 2) + adjustedY / (this.renderer.tileHeight / 2)) / 2
            );
            const worldY = Math.round(
                (adjustedY / (this.renderer.tileHeight / 2) - adjustedX / (this.renderer.tileWidth / 2)) / 2
            );
            
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
        });
    }

    /**
     * Starts the game loop
     * @returns {void}
     */
    start() {
        console.log('Game: Starting game loop');
        this.running = true;
        this.lastTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    /**
     * Main game loop
     * @private
     * @param {number} timestamp - Current timestamp from requestAnimationFrame
     */
    gameLoop(timestamp) {
        if (!this.running) return;

        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.render();

        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    stop() {
        this.running = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    destroy() {
        this.stop();
        this.entities.clear();
        this.player = null;
        this.world = null;
        this.renderer = null;
        this.tileManager = null;
        this.inputManager = null;
        this.pathFinder = null;
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

        // Update entities
        this.entities.forEach(entity => {
            if (entity.update) {
                entity.update(deltaTime);
            }
        });

        // Find the structure at player's position
        let playerX = Math.floor(this.player.x);
        let playerY = Math.floor(this.player.y);
        let playerStructure = null;

        // Check each structure to see if player is inside
        this.world.getAllStructures().forEach(structure => {
            if (playerX >= structure.x && 
                playerX < structure.x + structure.width &&
                playerY >= structure.y && 
                playerY < structure.y + structure.height) {
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
                
                // Always update transparency based on player position
                const cameraAngle = Math.atan2(
                    this.camera.y - this.player.y,
                    this.camera.x - this.player.x
                );
                structure.updateTransparency(this.player.x, this.player.y, cameraAngle);
            }
        });

        // Update NPC visibility based on structures
        this.entities.forEach(entity => {
            if (entity instanceof NPC) {
                entity.update(deltaTime);
                entity.updateVisibility(playerStructure);
            }
        });

        // Update UI
        this.uiManager.update(deltaTime);
    }

    /**
     * Renders the game
     * @private
     */
    render() {
        this.renderer.clear();
        
        // Apply camera transform
        this.ctx.save();
        
        // Center the view
        const offsetX = this.canvas.width / 2;
        const offsetY = this.canvas.height / 2;
        
        // Convert world coordinates to isometric coordinates
        const isoX = (this.player.x - this.player.y) * (this.renderer.tileWidth / 2);
        const isoY = (this.player.x + this.player.y) * (this.renderer.tileHeight / 2);
        
        // Center camera on player
        this.ctx.translate(
            offsetX - isoX * this.camera.zoom,
            offsetY - isoY * this.camera.zoom
        );
        this.ctx.scale(this.camera.zoom, this.camera.zoom);

        // Render world first (includes structures with transparency)
        this.renderer.renderWorld(this.world, this.camera, this.tileManager);
        
        // Draw tile coordinates if enabled
        this.drawTileCoordinates();
        
        // Split entities into inside/outside groups
        const entitiesOutside = [];
        const entitiesInside = [];
        
        this.entities.forEach(entity => {
            if (entity.currentStructure) {
                entitiesInside.push(entity);
            } else {
                entitiesOutside.push(entity);
            }
        });

        // Sort each group by Y position
        entitiesOutside.sort((a, b) => a.y - b.y);
        entitiesInside.sort((a, b) => a.y - b.y);

        // Render outside entities first
        entitiesOutside.forEach(entity => {
            if (entity.render && entity.isVisible) {
                entity.render(this.ctx, this.renderer);
            }
        });

        // Render inside entities after structure transparency
        entitiesInside.forEach(entity => {
            if (entity.render && entity.isVisible) {
                entity.render(this.ctx, this.renderer);
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

    screenToWorld(screenX, screenY) {
        // Get the center offset where (0,0) should be
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Calculate the player's isometric position
        const isoX = (this.player.x - this.player.y) * (this.renderer.tileWidth / 2);
        const isoY = (this.player.x + this.player.y) * (this.renderer.tileHeight / 2);
        
        // Adjust click coordinates relative to player position and camera zoom
        const adjustedX = (screenX - centerX) / this.camera.zoom + isoX;
        const adjustedY = (screenY - centerY) / this.camera.zoom + isoY;
        
        // Convert isometric coordinates back to world coordinates
        const worldX = Math.round(
            (adjustedX / (this.renderer.tileWidth / 2) + adjustedY / (this.renderer.tileHeight / 2)) / 2
        );
        const worldY = Math.round(
            (adjustedY / (this.renderer.tileHeight / 2) - adjustedX / (this.renderer.tileWidth / 2)) / 2
        );
        
        return { x: worldX, y: worldY };
    }

    findClickedNPC(screenX, screenY) {
        const worldPos = this.screenToWorld(screenX, screenY);
        
        console.log('Click detected:', {
            screen: { x: screenX, y: screenY },
            world: worldPos,
            entities: Array.from(this.entities).map(e => ({
                type: e.constructor.name,
                pos: { x: e.x, y: e.y }
            }))
        });

        // Check all entities with a larger threshold
        for (const entity of this.entities) {
            if (entity instanceof Merchant) {
                const distance = Math.sqrt(
                    Math.pow(entity.x - worldPos.x, 2) + 
                    Math.pow(entity.y - worldPos.y, 2)
                );
                
                console.log('Checking merchant:', {
                    merchantPos: { x: entity.x, y: entity.y },
                    distance: distance,
                    clickThreshold: 1.5  // Increased from 1.0 to 1.5
                });

                if (distance < 1.5) {  // Increased threshold
                    console.log('Merchant clicked:', entity);
                    return entity;
                }
            }
        }
        
        return null;
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
        
        console.log('Starting dialog with:', npc.constructor.name);

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






















