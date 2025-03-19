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
        
        // Create player at origin
        this.player = new Player({
            x: 0,
            y: 0
        });
        
        // Initialize camera to player position
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1  // Changed zoom to 1 for easier debugging
        };

        // Initialize input handling
        this.setupInput();
        
        // Start game loop
        this.lastTime = 0;
        this.running = false;
        console.log('Game: Initialization complete');
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
            console.log('Click detected');
            
            const rect = this.canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            
            // Convert screen coordinates to world coordinates
            // Reverse the camera transform operations in the correct order
            const worldX = ((screenX - this.canvas.width / 2) / this.camera.zoom) + this.camera.x;
            const worldY = ((screenY - this.canvas.height / 2) / this.camera.zoom) + this.camera.y;
            
            console.log('Screen coordinates:', screenX, screenY);
            console.log('World coordinates:', worldX, worldY);
            
            // Round to nearest grid position
            const targetX = Math.round(worldX);
            const targetY = Math.round(worldY);
            const startX = Math.round(this.player.x);
            const startY = Math.round(this.player.y);
            
            console.log('Grid coordinates - Start:', startX, startY, 'Target:', targetX, targetY);
            
            if (startX !== targetX || startY !== targetY) {
                const path = this.pathFinder.findPath(startX, startY, targetX, targetY);
                
                if (path) {
                    console.log('Path found:', path);
                    this.player.setPath(path);
                } else {
                    console.log('No valid path found to target location');
                }
            }
        });
    }

    start() {
        console.log('Game: Starting game loop');
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    gameLoop(timestamp) {
        if (!this.running) return;

        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Update
        this.update(deltaTime);

        // Render
        this.render();

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(deltaTime) {
        // Update active chunks based on camera position
        this.world.updateActiveChunks(
            Math.floor(this.camera.x / this.world.chunkSize),
            Math.floor(this.camera.y / this.world.chunkSize),
            2 // View distance in chunks
        );

        // Update player
        this.player.update(deltaTime, this.inputManager);
    }

    render() {
        // Add debug rendering
        console.log('Rendering frame');
        console.log('Camera position:', this.camera.x, this.camera.y);
        console.log('Player position:', this.player.x, this.player.y);

        this.renderer.clear();
        
        // Apply camera transform
        this.ctx.save();
        
        // Center the view
        const offsetX = this.canvas.width / 2;
        const offsetY = this.canvas.height / 2; // Changed from /9 to /2
        
        this.ctx.translate(offsetX, offsetY);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Draw debug grid
        this.drawDebugGrid();

        // Render world
        this.renderer.renderWorld(this.world, this.camera, this.tileManager);
        
        // Render player
        this.player.render(this.ctx);

        this.ctx.restore();
    }

    // Add this helper method
    drawDebugGrid() {
        const gridSize = 1; // Changed to 1 to match world coordinates
        const gridExtent = 10; // Reduced for clarity
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;

        // Draw vertical lines
        for (let x = -gridExtent; x <= gridExtent; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, -gridExtent);
            this.ctx.lineTo(x, gridExtent);
            this.ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = -gridExtent; y <= gridExtent; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(-gridExtent, y);
            this.ctx.lineTo(gridExtent, y);
            this.ctx.stroke();
        }

        // Draw axes with different colors
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'; // Red X axis
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-gridExtent, 0);
        this.ctx.lineTo(gridExtent, 0);
        this.ctx.stroke();

        this.ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)'; // Blue Y axis
        this.ctx.beginPath();
        this.ctx.moveTo(0, -gridExtent);
        this.ctx.lineTo(0, gridExtent);
        this.ctx.stroke();
    }

    resize(width, height) {
        console.log(`Game: Resizing to ${width}x${height}`);
        this.canvas.width = width;
        this.canvas.height = height;
    }
}







