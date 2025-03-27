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
import { Item } from './inventory/Item.js';
import { MapDefinition } from './world/MapDefinition.js';
import { TILE_WIDTH_HALF, TILE_HEIGHT_HALF } from './constants.js';

export class GameInstance {
    constructor(canvas) {
        console.log('Game: Initializing...');
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Initialize entities collection
        this.entities = new Set();
        
        // Initialize camera with minimum zoom
        this.camera = {
            x: 0,
            y: 0,
            zoom: 0.5
        };
        
        // Centralize debug configuration
        this.debug = {
            enabled: true,
            flags: {
                showPath: false,
                showGrid: false,
                //showCoordinates: true,  // Set to true by default
                logTextureLoading: false,
                logDecorations: true,
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

        // Create static map definition
        const staticMap = new MapDefinition({
            width: 64,
            height: 64,
            seed: 12345,
            terrain: [
                // Natural terrain types
                { x: 1, y: 1, type: 'water', height: 0.35, moisture: 0.9 },
                { x: 1, y: 2, type: 'wetland', height: 0.40, moisture: 0.8 },
                { x: 1, y: 3, type: 'sand', height: 0.40, moisture: 0.2 },
                { x: 1, y: 4, type: 'dirt', height: 0.50, moisture: 0.1 },
                { x: 1, y: 5, type: 'grass', height: 0.50, moisture: 0.5 },
                { x: 1, y: 6, type: 'forest', height: 0.60, moisture: 0.7 },
                { x: 1, y: 7, type: 'mountain', height: 0.85, moisture: 0.3 },
                
                // Urban terrain types
                { x: 1, y: 8, type: 'concrete', height: 0.50, moisture: 0.3 },
                { x: 1, y: 9, type: 'asphalt', height: 0.50, moisture: 0.3 },
                { x: 1, y: 10, type: 'metal', height: 0.50, moisture: 0.3 },
                { x: 1, y: 11, type: 'tiles', height: 0.50, moisture: 0.3 },
                { x: 1, y: 12, type: 'gravel', height: 0.50, moisture: 0.3 },
                { x: 1, y: 13, type: 'solar', height: 0.50, moisture: 0.3 },
                { x: 1, y: 14, type: 'garden', height: 0.50, moisture: 0.4 },
                
                // Special terrain types
                { x: 1, y: 15, type: 'helipad', height: 0.50, moisture: 0.3 },
                { x: 1, y: 16, type: 'parking', height: 0.50, moisture: 0.3 }
            ],
            structures: [
                { 
                    x: 5, 
                    y: 5, 
                    type: 'apartment',
                    floors: 4,
                    width: 2,
                    material: 'concrete',
                    states: { lightOn: true }
                },
                { 
                    x: 15, 
                    y: 15, 
                    type: 'office',
                    floors: 6,
                    width: 3,
                    material: 'glass',
                    states: { lightOn: true }
                },
                { 
                    x: 25, 
                    y: 25, 
                    type: 'warehouse',
                    floors: 2,
                    width: 4,
                    material: 'metal',
                    states: { lightOn: false }
                },
                { 
                    x: 35, 
                    y: 35, 
                    type: 'factory',
                    floors: 3,
                    width: 5,
                    material: 'brick',
                    states: { lightOn: true }
                }
            ],
            zones: [
                { type: 'commercial', x: 20, y: 20, size: 10 },
                { type: 'industrial', x: 30, y: 30, size: 15 }
            ],
            spawnPoints: [
                { x: 25, y: 25 }
            ]
        });

        // Initialize world
        this.world = new World(64, 64, {
            chunkSize: 16,
            debug: this.debug,
            mapDefinition: staticMap
        });

        // Initialize core components
        this.tileManager = this.world.tileManager;
        this.pathFinder = new PathFinder(this.world);
        this.renderer = new IsometricRenderer(canvas, this.world.tileManager);
        this.inputManager = new InputManager();
        
        // Initialize player
        const playerSpawnPoint = this.findValidSpawnPoint();
        this.player = new Player({
            x: playerSpawnPoint.x,
            y: playerSpawnPoint.y,
            world: this.world,
            pathFinder: this.pathFinder
        });

        // Center camera on player
        this.camera.x = this.player.x;
        this.camera.y = this.player.y;

        // Initialize UI components
        this.uiManager = new UIManager(this);
        this.messageSystem = new MessageSystem(this);
        
        // Setup debug controls and input handlers
        console.log('Setting up debug controls...');
        this.setupDebugControls();
        this.setupInput();

        // Show intro sequence
        this.showIntroSequence();
    }

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

    createMerchant(pos) {
        console.log('Starting merchant creation at position:', pos);
        
        try {
            const merchant = new Merchant({
                x: pos.x,
                y: pos.y,
                name: 'Tech Merchant',
                eth: 1000
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

    async init() {
        console.log('Game: Starting initialization...');
        try {
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

    setupInput() {
        console.log('Game: Setting up input handlers');
        const moveSpeed = 5;
        
        window.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.camera.x -= moveSpeed;
                    break;
                case 'ArrowRight':
                    this.camera.x += moveSpeed;
                    break;
                case 'ArrowUp':
                    this.camera.y -= moveSpeed;
                    break;
                case 'ArrowDown':
                    this.camera.y += moveSpeed;
                    break;
            }
        });

        this.canvas.addEventListener('wheel', (e) => {
            const zoomSpeed = 0.1;
            this.camera.zoom = Math.max(0.5, Math.min(2,
                this.camera.zoom + (e.deltaY > 0 ? -zoomSpeed : zoomSpeed)
            ));
            e.preventDefault();
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.inputManager.isShiftPressed) {
                const { deltaX, deltaY } = this.inputManager.getMouseDelta();
                this.camera.x -= deltaX / this.camera.zoom;
                this.camera.y -= deltaY / this.camera.zoom;
            }
        });

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            
            // Check if clicked on an NPC first
            const clickedNPC = this.findClickedNPC(screenX, screenY);
            
            if (clickedNPC) {
                // Find adjacent tile to NPC
                const adjacentTile = this.findAdjacentTile(clickedNPC);
                if (adjacentTile) {
                    const startX = Math.round(this.player.x);
                    const startY = Math.round(this.player.y);
                    const path = this.pathFinder.findPath(startX, startY, adjacentTile.x, adjacentTile.y);
                    
                    if (path) {
                        this.player.setPath(path);
                        // Start dialog when path is complete
                        this.player.onPathComplete = () => {
                            this.startDialog(clickedNPC);
                        };
                    }
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

    start() {
        console.log('Game: Starting game loop');
        this.running = true;
        this.lastTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }

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

    update(deltaTime) {
        if (!this.player || !this.camera) {
            console.warn('Required components not initialized');
            return;
        }

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
        
        // Check each structure to see if player is inside
        let playerStructure = null;
        this.world.getAllStructures().forEach(structure => {
            if (playerX >= structure.x && 
                playerX < structure.x + structure.width &&
                playerY >= structure.y && 
                playerY < structure.y + structure.height) {
                playerStructure = structure;
            }
        });

        // Update structure visibility
        this.world.getAllStructures().forEach(structure => {
            if (structure === playerStructure) {
                structure.updateVisibility(this.player.x, this.player.y);
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
            }
        });

        // Update UI
        this.uiManager.update(deltaTime);
    }

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

        // Render world
        this.renderer.renderWorld(this.world, this.camera, this.tileManager);
        
        // Draw tile coordinates
        this.drawTileCoordinates();
        
        // Render all entities
        for (const entity of this.entities) {
            if (entity && entity.render) {
                entity.render(this.ctx, this.renderer);
            }
        }

        // Render player last to ensure they're on top
        if (this.player) {
            this.player.render(this.ctx, this.renderer);
        }

        this.ctx.restore();

        // Render UI with a fresh context state
        if (this.uiManager) {
            //console.log('Rendering UI...');
            this.uiManager.render(this.ctx);
        } else {
            console.warn('UIManager not initialized');
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

    findClickedNPC(screenX, screenY) {
        // Get the center offset where (0,0) should be
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Get player's isometric position
        const playerIso = this.convertToIsometric(this.player.x, this.player.y);
        
        // Convert screen coordinates to world coordinates
        const worldPos = this.renderer.screenToWorld(
            screenX - centerX + playerIso.x * this.camera.zoom,
            screenY - centerY + playerIso.y * this.camera.zoom,
            this.camera.zoom,
            this.camera.x,
            this.camera.y
        );
        
        for (const entity of this.entities) {
            if (entity instanceof NPC) {
                // Calculate distance in world coordinates
                const dx = worldPos.x - entity.x;
                const dy = worldPos.y - entity.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Use a larger click radius to make it easier to click NPCs
                const clickRadius = 3;
                
                if (this.debug.enabled) {
                    console.log(`Click check for ${entity.name}:`, {
                        entityPos: { x: entity.x, y: entity.y },
                        worldClick: worldPos,
                        clickPos: { x: screenX, y: screenY },
                        distance,
                        clickRadius
                    });
                }
                
                if (distance < clickRadius) {
                    console.log(`Clicked on NPC: ${entity.name}`);
                    return entity;
                }
            }
        }
        return null;
    }

    findAdjacentTile(npc) {
        // Check tiles in cardinal directions
        const adjacentPositions = [
            { x: npc.x + 1, y: npc.y },
            { x: npc.x - 1, y: npc.y },
            { x: npc.x, y: npc.y + 1 },
            { x: npc.x, y: npc.y - 1 }
        ];
        
        // Find first valid position
        for (const pos of adjacentPositions) {
            if (this.pathFinder.isValidCoordinate(pos.x, pos.y)) {
                const height = this.world.generateHeight(pos.x, pos.y);
                const moisture = this.world.generateMoisture(pos.x, pos.y);
                const tile = this.world.generateTile(pos.x, pos.y, height, moisture);
                
                if (tile.type !== 'water' && tile.type !== 'wetland') {
                    return pos;
                }
            }
        }
        return null;
    }

    startDialog(npc) {
        if (npc instanceof Merchant) {
            this.messageSystem.queueMessage({
                speaker: npc.name,
                text: "Welcome to my shop! Would you like to see my wares?",
                logMessage: true,
                options: [
                    { 
                        text: "Show me what you have",
                        action: () => {
                            console.log('Opening merchant UI...');
                            const merchantUI = this.uiManager.components.get('merchantUI');
                            console.log('MerchantUI component:', merchantUI);
                            
                            // Debug: Log all elements with higher or equal z-index
                            const elements = document.elementsFromPoint(window.innerWidth / 2, window.innerHeight / 2);
                            console.log('Elements at center of screen:', elements);
                            
                            if (merchantUI) {
                                merchantUI.show(npc);
                            } else {
                                console.error('MerchantUI not found in UIManager components');
                            }
                        }
                    },
                    { 
                        text: "Maybe later",
                        action: () => this.messageSystem.hide()
                    }
                ]
            });
        } else {
            this.messageSystem.queueMessage({
                speaker: npc.name,
                text: `Hello traveler! I am ${npc.name}.`,
                options: [
                    { 
                        text: "Hello!",
                        action: () => {
                            this.messageSystem.queueMessage({
                                speaker: npc.name,
                                text: "How can I help you today?",
                                options: [
                                    { text: "Just saying hi" },
                                    { text: "Goodbye" }
                                ]
                            });
                        }
                    },
                    { text: "Goodbye" }
                ]
            });
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

    // Add this new method to GameInstance class
    addMerchantNearPlayer() {
        // Calculate merchant position relative to player
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
}



















