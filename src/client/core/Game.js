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
        
        // Initialize game systems
        this.world = new World(64, 64, {
            seed: Math.random() * 10000,
            chunkSize: 16
        });
        
        this.renderer = new IsometricRenderer(canvas);
        this.tileManager = new TileManager();
        this.inputManager = new InputManager();
        this.pathFinder = new PathFinder(this.world);
        
        // Initialize camera
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1
        };

        // Find valid spawn point and initialize player
        const spawnPoint = this.findValidSpawnPoint();
        this.player = new Player({
            x: spawnPoint.x,
            y: spawnPoint.y
        });
        
        this.debugFlags = {
            showPath: false,
            showGrid: false
        };
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
            await this.tileManager.loadTextures();
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
            
            console.log('Click at world coordinates:', worldX, worldY);
            
            if (this.pathFinder.isValidCoordinate(worldX, worldY)) {
                const startX = Math.round(this.player.x);
                const startY = Math.round(this.player.y);
                const path = this.pathFinder.findPath(startX, startY, worldX, worldY);
                
                if (path) {
                    console.log('Setting new path:', path);
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
        
        // Render player
        const playerIsoX = (this.player.x - this.player.y) * (this.renderer.tileWidth / 2);
        const playerIsoY = (this.player.x + this.player.y) * (this.renderer.tileHeight / 2);
        
        this.ctx.fillStyle = 'red';
        this.ctx.beginPath();
        this.ctx.arc(playerIsoX, playerIsoY, 10, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw current path if it exists and debug flag is enabled
        if (this.debugFlags.showPath && this.player.currentPath && this.player.isMoving) {
            this.ctx.strokeStyle = 'yellow';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(playerIsoX, playerIsoY);
            
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
            switch(e.key.toLowerCase()) {
                case 'p':
                    this.debugFlags.showPath = !this.debugFlags.showPath;
                    break;
                case 'g':
                    this.debugFlags.showGrid = !this.debugFlags.showGrid;
                    break;
            }
        });
    }

    resize(width, height) {
        console.log(`Game: Resizing to ${width}x${height}`);
        this.canvas.width = width;
        this.canvas.height = height;
    }
}





























