import { World } from './world/World.js';
import { IsometricRenderer } from './renderer/IsometricRenderer.js';
import { TileManager } from './world/TileManager.js';
import { Player } from './entities/Player.js';
import { InputManager } from './engine/InputManager.js';
import { PathFinder } from './world/PathFinder.js';
import { CanvasRenderer } from './renderer/CanvasRenderer.js';
import { NPC } from './entities/NPC.js';
import { Merchant } from './entities/Merchant.js';
import { UIManager } from './ui/UIManager.js';
import { MessageSystem } from './ui/MessageSystem.js';
import { InventoryUI } from './ui/components/InventoryUI.js';
import { MerchantUI } from './ui/components/MerchantUI.js';
import { Item } from './inventory/Item.js';

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
            zoom: 0.5  // Changed from 1 to 0.5 for maximum zoom out
        };
        
        // Centralize debug configuration
        this.debug = {
            enabled: false,
            flags: {
                showPath: false,
                showGrid: false,
                logTextureLoading: false,
                logDecorations: false,
                logZoomChanges: false
            }
        };

        // Initialize game systems without structures
        this.world = new World(64, 64, {
            seed: Math.random() * 10000,
            chunkSize: 16,
            debug: this.debug
        });
        
        // Get reference to TileManager from World
        this.tileManager = this.world.tileManager;
        
        // Initialize pathfinder with world reference
        this.pathFinder = new PathFinder(this.world);
        
        // Initialize renderer and input manager
        this.renderer = new IsometricRenderer(canvas, this.world.tileManager);
        this.inputManager = new InputManager();

        // Find valid spawn point
        const playerSpawnPoint = this.findValidSpawnPoint();
        
        // Create player with ALL required dependencies
        this.player = new Player({
            x: playerSpawnPoint.x,
            y: playerSpawnPoint.y,
            world: this.world,
            pathFinder: this.pathFinder
        });

        // Center camera on player initially
        this.camera.x = this.player.x;
        this.camera.y = this.player.y;

        // Debug log to verify pathFinder
        console.log('PathFinder instance:', this.pathFinder);
        console.log('Player config:', {
            x: playerSpawnPoint.x,
            y: playerSpawnPoint.y,
            hasWorld: !!this.world,
            hasPathFinder: !!this.pathFinder
        });

        // Initialize UI
        this.uiManager = new UIManager(this);

        // Add dialog state
        this.dialogState = {
            active: false,
            currentNPC: null
        };

        // Initialize message system
        this.messageSystem = new MessageSystem(this);

        // Show intro message sequence
        this.showIntroSequence();

        // Add inventory UI
        this.uiManager.components.set('inventoryUI', new InventoryUI({
            game: this
        }));

        // Add merchant UI
        this.uiManager.components.set('merchantUI', new MerchantUI({
            game: this
        }));

        // Create a merchant at a position near the player spawn
        const merchantPosition = {
            x: playerSpawnPoint.x + 5,
            y: playerSpawnPoint.y + 5
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
            } else {
                console.error('Failed to create merchant');
            }
        } catch (error) {
            console.error('Error creating merchant:', error);
        }

        // Add debug logging in render loop
        const originalRender = this.render.bind(this);
        this.render = () => {
            /*
            console.log('Current entities:', Array.from(this.entities).map(e => ({
                type: e.constructor.name,
                position: { x: e.x, y: e.y }
            })));
            */
            originalRender();
        };
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
        const searchRadius = 5;
        
        for (let dy = -searchRadius; dy <= searchRadius; dy++) {
            for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                const x = worldCenter + dx;
                const y = worldCenter + dy;
                
                const height = this.world.generateHeight(x, y);
                const moisture = this.world.generateMoisture(x, y);
                const tile = this.world.generateTile(x, y, height, moisture);
                
                if (tile.type !== 'water' && tile.type !== 'wetland') {
                    console.log('Found valid spawn point at:', x, y);
                    return { x, y };
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
        
        // Render all entities
        for (const entity of this.entities) {
            if (entity && entity.render) {
                entity.render(this.ctx, this.renderer);
                
                // Debug: Draw entity position
                if (this.debug.enabled) {
                    const isoPos = this.convertToIsometric(entity.x, entity.y);
                    this.ctx.fillStyle = 'red';
                    this.ctx.beginPath();
                    this.ctx.arc(isoPos.x, isoPos.y, 5, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }

        // Render player last to ensure they're on top
        if (this.player) {
            this.player.render(this.ctx, this.renderer);
        }

        this.ctx.restore();
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
        window.addEventListener('keydown', (e) => {
            // Only respond to Ctrl + D combinations
            if (!e.ctrlKey) return;
            
            switch(e.key.toLowerCase()) {
                case 'd': // Toggle debug mode
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
            x: (x - y) * (this.renderer.tileWidth / 2),
            y: (x + y) * (this.renderer.tileHeight / 2)
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
}




















































