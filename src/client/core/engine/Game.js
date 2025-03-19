
import { CanvasRenderer } from './CanvasRenderer.js';
import { InputManager } from './InputManager.js';
import { Camera } from './Camera.js';
import { World } from '../world/World.js';
import { TileManager } from '../world/TileManager.js';
import { Player } from '../entities/Player.js';
import { NPC } from '../entities/NPC.js';
import { Enemy } from '../entities/Enemy.js';

/**
 * Main game engine class that coordinates all game systems
 * @class Game
 */
export class Game {
    /**
     * Creates a new Game instance
     * @param {Object} config - Game configuration options
     * @param {HTMLCanvasElement} config.canvas - The canvas element for rendering
     * @param {number} [config.worldWidth=20] - Width of the game world in tiles
     * @param {number} [config.worldHeight=20] - Height of the game world in tiles
     * @param {number} [config.fps=60] - Target frames per second
     */
    constructor(config) {
        if (!config || !config.canvas) {
            throw new Error('Canvas element must be provided in config');
        }

        this.canvas = config.canvas;
        this.renderer = new CanvasRenderer(this.canvas);
        this.world = new World(
            config.worldWidth || 20,
            config.worldHeight || 20
        );
        this.tileManager = new TileManager();
        this.camera = new Camera();
        this.inputManager = new InputManager();
        this.fps = config.fps || 60;
        this.frameInterval = 1000 / this.fps;
        this.lastFrameTime = 0;
        this.isRunning = false;
        this.assetsLoaded = false;
        this.entities = new Set();

        // Create player
        this.player = new Player({
            x: 0,
            y: 0
        });
        this.addEntity(this.player);

        // Make camera follow player
        this.camera.follow(this.player);

        // Bind methods to preserve context
        this.gameLoop = this.gameLoop.bind(this);

        // Add some test NPCs and enemies
        this.addTestEntities();
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
            requestAnimationFrame(this.gameLoop);
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

        const deltaTime = currentTime - this.lastFrameTime;

        if (deltaTime >= this.frameInterval) {
            // Update game state
            this.update(deltaTime);

            // Render frame
            this.render();

            this.lastFrameTime = currentTime - (deltaTime % this.frameInterval);
        }

        requestAnimationFrame(this.gameLoop);
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
        // Clear the canvas
        this.renderer.clear();

        // Get camera transform
        const transform = this.camera.getTransform();

        // Apply camera transform to renderer
        this.renderer.setTransform(transform);

        // Render the world with current camera transform
        this.renderer.renderWorld(this.world, this.tileManager, transform);

        // Render all entities
        for (const entity of this.entities) {
            if (entity.isVisible) {
                entity.render(this.renderer.ctx);
            }
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



