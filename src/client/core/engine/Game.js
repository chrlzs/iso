import { World } from '../world/World.js';
import { IsometricRenderer } from '../renderer/IsometricRenderer.js';
import { TileManager } from '../world/TileManager.js';
import { Player } from '../entities/Player.js';
import { InputManager } from './InputManager.js';
import { PathFinder } from '../world/PathFinder.js';

export class Game {
    constructor(config) {
        if (!config || !(config.canvas instanceof HTMLCanvasElement)) {
            throw new Error('Valid canvas element must be provided in config');
        }
        
        this.canvas = config.canvas;
        this.ctx = canvas.getContext('2d');
        // ... rest of your constructor code ...
    }

    async init() {
        try {
            await this.tileManager.loadTextures();
            this.setupInput();
            this.setupDebugControls();
            return true;
        } catch (error) {
            console.error('Failed to initialize:', error);
            throw error;
        }
    }

    // ... rest of your existing Game class methods ...
}
