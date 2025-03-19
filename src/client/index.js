import { Game } from './core/engine/Game.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Could not find canvas element with id "gameCanvas"');
        return;
    }

    // Set initial canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const game = new Game({ canvas });

    // Initialize game and handle loading
    game.init().catch(error => {
        console.error('Failed to initialize game:', error);
    });

    // Handle window resizing
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        game.resize(canvas.width, canvas.height);
    });
});


