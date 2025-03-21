import { World } from './world/World.js';
import { IsometricRenderer } from './renderer/IsometricRenderer.js';
import { TileManager } from './world/TileManager.js';
import { Player } from './entities/Player.js';
import { InputManager } from './engine/InputManager.js';
import { PathFinder } from './world/PathFinder.js';

export class Game {
    constructor(canvas) {
        console.log('Game: Initializing...');
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
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

        // Initialize game systems
        this.world = new World(64, 64, {
            seed: Math.random() * 10000,
            chunkSize: 16,
            autoGenerateStructures: true,
            structureCount: 5,
            debug: this.debug
        });
        
        // Get reference to TileManager from World
        this.tileManager = this.world.tileManager;
        
        this.renderer = new IsometricRenderer(canvas, this.world);
        this.inputManager = new InputManager();
        this.pathFinder = new PathFinder(this.world);
        
        // Initialize camera with max zoom out
        this.camera = {
            x: 0,
            y: 0,
            zoom: 0.5  // Start at max zoom out
        };

        // Find valid spawn point and initialize player
        const spawnPoint = this.findValidSpawnPoint();
        this.player = new Player({
            x: spawnPoint.x,
            y: spawnPoint.y
        });

        console.log('Player instance:', this.player);
        console.log('Player methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.player)));

        // Add a manual structure near spawn point (tavern)
        this.addStartingStructures();
        
        this.debugFlags = {
            showPath: false,
            showGrid: false
        };

        this.debugMode = false; // Add debug flag
    }

    addStartingStructures() {
        // Add a tavern near the spawn point
        const tavernX = this.player.x + 5;
        const tavernY = this.player.y + 5;
        const tavern = this.world.structureManager.createStructure('tavern', tavernX, tavernY);
        
        if (tavern) {
            console.log('Game: Created tavern at', tavernX, tavernY);
        }

        // Add a few houses in a small village-like pattern
        const housePositions = [
            { x: tavernX - 3, y: tavernY - 2 },
            { x: tavernX + 4, y: tavernY - 1 },
            { x: tavernX - 2, y: tavernY + 3 }
        ];

        housePositions.forEach(pos => {
            const house = this.world.structureManager.createStructure('house', pos.x, pos.y);
            if (house) {
                console.log('Game: Created house at', pos.x, pos.y);
            }
        });
    }

    findValidSpawnPoint() {
        const worldCenter = Math.floor(this.world.width / 2);
        const searchRadius = 10; // Adjust this value to search a larger area if needed
        
        // Search in a spiral pattern from the center
        for (let r = 0; r < searchRadius; r++) {
            for (let dx = -r; dx <= r; dx++) {
                for (let dy = -r; dy <= r; dy++) {
                    const x = worldCenter + dx;
                    const y = worldCenter + dy;
                    
                    const height = this.world.generateHeight(x, y);
                    const moisture = this.world.generateMoisture(x, y);
                    const tile = this.world.generateTile(x, y, height, moisture);
                    
                    // Check if the tile is suitable for spawning
                    if (tile.type !== 'water' && tile.type !== 'wetland') {
                        console.log('Found valid spawn point at:', x, y, 'with tile type:', tile.type);
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

        // Add click-to-move functionality
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            
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
        if (this.player) {
            this.player.update(deltaTime);
        }
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
        
        // Draw debug grid if enabled
        if (this.debugFlags.showGrid) {
            this.drawDebugGrid();
        }
        
        // Render player (removed red dot, using player's render method)
        this.player.render(this.ctx);

        // Draw current path if it exists and debug flag is enabled
        if (this.debugFlags.showPath && this.player.currentPath && this.player.isMoving) {
            this.ctx.strokeStyle = 'yellow';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            
            const startIsoX = (this.player.x - this.player.y) * (this.renderer.tileWidth / 2);
            const startIsoY = (this.player.x + this.player.y) * (this.renderer.tileHeight / 2);
            
            this.ctx.moveTo(startIsoX, startIsoY);
            
            for (let i = this.player.currentPathIndex; i < this.player.currentPath.length; i++) {
                const pathIsoX = (this.player.currentPath[i].x - this.player.currentPath[i].y) * (this.renderer.tileWidth / 2);
                const pathIsoY = (this.player.currentPath[i].x + this.player.currentPath[i].y) * (this.renderer.tileHeight / 2);
                this.ctx.lineTo(pathIsoX, pathIsoY);
            }
            
            this.ctx.stroke();
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
            if (!this.debug.enabled) return;
            
            switch(e.key.toLowerCase()) {
                case 'p':
                    this.debug.flags.showPath = !this.debug.flags.showPath;
                    break;
                case 'g':
                    this.debug.flags.showGrid = !this.debug.flags.showGrid;
                    break;
                case 'd': // Toggle debug mode
                    this.debug.enabled = !this.debug.enabled;
                    console.log(`Debug mode: ${this.debug.enabled}`);
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
        // Replace this with your actual terrain height calculation
        // This is just an example that creates a wavy terrain
        return Math.sin(x * 0.1) * Math.cos(y * 0.1) * 20;
    }

    // Example method to calculate terrain angle
    getTerrainAngleAt(x, y) {
        // Replace this with your actual terrain angle calculation
        // This is just an example that creates varying angles
        return Math.sin(x * 0.05 + y * 0.05) * 0.2;
    }
}










































