import { CanvasRenderer } from '../renderer/CanvasRenderer.js';
import { InputManager } from './InputManager.js';
import { Camera } from './Camera.js';
import { World } from '../world/World.js';
import { TileManager } from '../world/TileManager.js';
import { Player } from '../entities/Player.js';
import { NPC } from '../entities/NPC.js';
import { Enemy } from '../entities/Enemy.js';

/**
 * Main game engine class that coordinates all game systems
 * @class GameEngine
 */
export class GameEngine {
    /**
     * Creates a new GameEngine instance
     * @param {Object} config - Game configuration options
     * @param {HTMLCanvasElement} config.canvas - The canvas element for rendering
     * @param {number} [config.worldWidth=20] - Width of the game world in tiles
     * @param {number} [config.worldHeight=20] - Height of the game world in tiles
     * @param {number} [config.fps=60] - Target frames per second
     */
    constructor(config) {
        if (!config || !(config.canvas instanceof HTMLCanvasElement)) {
            throw new Error('Valid canvas element must be provided in config');
        }

        this.canvas = config.canvas;
        this.world = new World(
            config.worldWidth || 20,
            config.worldHeight || 20
        );
        this.renderer = new CanvasRenderer(this.canvas);
        this.tileManager = new TileManager();
        this.camera = new Camera(this.canvas);
        this.inputManager = new InputManager();
        this.fps = config.fps || 60;
        this.frameInterval = 1000 / this.fps;
        this.lastFrameTime = 0;
        this.isRunning = false;
        this.assetsLoaded = false;
        this.entities = new Set();

        // Bind the gameLoop to preserve 'this' context
        this.gameLoop = this.gameLoop.bind(this);

        // Initialize player at world center
        const worldCenterX = Math.floor(config.worldWidth / 2);
        const worldCenterY = Math.floor(config.worldHeight / 2);
        
        this.player = new Player({
            x: worldCenterX,
            y: worldCenterY
        });
        
        // Center camera on player
        this.camera.x = worldCenterX;
        this.camera.y = worldCenterY;
        this.camera.follow(this.player);
    }

    /**
     * Initializes the game
     * @returns {Promise} Resolves when game is ready
     * @public
     */
    async init() {
        try {
            await this.tileManager.loadTextures();
            this.assetsLoaded = true;
            this.start();
        } catch (error) {
            console.error('Failed to load game assets:', error);
        }
    }

    /**
     * Starts the game loop
     * @public
     */
    start() {
        if (!this.assetsLoaded) {
            console.warn('Cannot start game before assets are loaded');
            return;
        }

        if (!this.isRunning) {
            this.isRunning = true;
            this.lastFrameTime = performance.now();
            requestAnimationFrame(this.gameLoop);  // Now using the bound method
        }
    }

    /**
     * Stops the game loop
     * @public
     */
    stop() {
        this.isRunning = false;
    }

    /**
     * Main game loop
     * @param {number} currentTime - Current timestamp
     * @private
     */
    gameLoop(currentTime) {
        if (!this.isRunning) return;

        let deltaTime = currentTime - this.lastFrameTime;
        
        // Cap maximum delta time to prevent large jumps
        deltaTime = Math.min(deltaTime, 32); // Cap at ~30 FPS worth of time

        if (deltaTime >= this.frameInterval) {
            this.update(deltaTime);
            this.render();
            this.lastFrameTime = currentTime - (deltaTime % this.frameInterval);
        }

        requestAnimationFrame(this.gameLoop);  // Now using the bound method
    }

    /**
     * Updates game state
     * @param {number} deltaTime - Time elapsed since last update in milliseconds
     * @private
     */
    update(deltaTime) {
        // Update camera with input
        this.camera.update(deltaTime, this.inputManager);

        // Update player with input
        this.player.update(deltaTime, this.inputManager);

        // Update other entities
        const entityArray = Array.from(this.entities);
        for (const entity of this.entities) {
            if (entity !== this.player) {
                if (entity instanceof NPC) {
                    entity.update(deltaTime, entityArray);
                } else {
                    entity.update(deltaTime);
                }
            }
        }
    }

    /**
     * Renders the current game state
     * @private
     */
    render() {
        this.renderer.clear();
        this.renderer.renderWorld(this.world, this.camera, this.tileManager);
        
        // Render entities if needed
        if (this.player) {
            // Add player rendering logic here
        }
    }

    /**
     * Resizes the game canvas
     * @param {number} width - New canvas width
     * @param {number} height - New canvas height
     * @public
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    /**
     * Cleans up game resources
     * @public
     */
    destroy() {
        this.stop();
        // Add any additional cleanup here
    }

    /**
     * Adds an entity to the game
     * @param {Entity} entity - The entity to add
     */
    addEntity(entity) {
        this.entities.add(entity);
    }

    /**
     * Removes an entity from the game
     * @param {Entity} entity - The entity to remove
     */
    removeEntity(entity) {
        this.entities.delete(entity);
    }

    /**
     * Adds some test entities to the game
     * @private
     */
    addTestEntities() {
        // Add a friendly NPC
        const friendlyNPC = new NPC({
            x: 100,
            y: 100,
            name: 'Village Elder'
        });
        this.addEntity(friendlyNPC);

        // Add an enemy
        const enemy = new Enemy({
            x: -100,
            y: -100,
            name: 'Dark Knight',
            damage: 15,
            attackRange: 60
        });
        this.addEntity(enemy);
    }
}









