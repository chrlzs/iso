import { Game } from './core/Game.js';
import { Character } from './entities/Character.js';
import { Structure } from './entities/Structure.js';
import { Item } from './entities/Item.js';
import { Enemy } from './entities/Enemy.js';
import { testPixiRendering } from './test-pixi.js';
import { FallbackRenderer } from './rendering/FallbackRenderer.js';
import { isPixiAvailable } from './utils/PixiWrapper.js';

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if PIXI is available
    const pixiAvailable = isPixiAvailable();
    console.log('PIXI available:', pixiAvailable);

    if (!pixiAvailable) {
        console.warn('PIXI.js is not available. Using fallback renderer.');

        // Create fallback renderer
        const fallbackRenderer = new FallbackRenderer({
            container: document.getElementById('game-container'),
            width: window.innerWidth,
            height: window.innerHeight,
            tileWidth: 64,
            tileHeight: 32,
            gridWidth: 20,
            gridHeight: 20
        });

        // Set up keyboard input handling
        const keys = new Set();

        window.addEventListener('keydown', (e) => {
            keys.add(e.key.toLowerCase());
            fallbackRenderer.handleInput(keys);
        });

        window.addEventListener('keyup', (e) => {
            keys.delete(e.key.toLowerCase());
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            fallbackRenderer.resize(window.innerWidth, window.innerHeight);
        });

        console.log('Fallback renderer initialized.');
        return;
    }

    // Test PIXI rendering
    const pixiTestSuccessful = testPixiRendering();

    if (!pixiTestSuccessful) {
        console.error('PIXI test failed. Not initializing game.');
        document.getElementById('game-container').innerHTML = '<div style="color: white; padding: 20px;">PIXI.js initialization failed. Check console for errors.</div>';
        return;
    }

    // Clear the test canvas
    document.getElementById('game-container').innerHTML = '';
    // Create game instance
    const game = new Game({
        container: document.getElementById('game-container'),
        width: window.innerWidth,
        height: window.innerHeight,
        debug: true,
        worldWidth: 20,
        worldHeight: 20,
        generateWorld: true,
        createPlayer: true,
        dayDuration: 300, // 5 minutes per day
        startTime: 8, // Start at 8 AM
        tileWidth: 64,
        tileHeight: 32,

        // Custom tile click handler
        onTileClick: (tile, game) => {
            // If player exists, move to the clicked tile
            if (game.player) {
                game.player.setMoveTarget(tile.getCenter());
            }
        },

        // Custom key handler
        onKeyDown: (key, keys, game) => {
            // Add tree on 'T' key
            if (key === 't' && !keys.has('shift')) {
                console.log('T key pressed for tree placement');

                if (game.input.selectedTile) {
                    const tile = game.input.selectedTile;
                    console.log(`Selected tile for tree placement: (${tile.gridX}, ${tile.gridY})`);

                    // Create tree structure
                    const tree = new Structure({
                        structureType: 'tree',
                        gridWidth: 1,
                        gridHeight: 1,
                        interactive: true
                    });

                    // Place in world
                    const success = tree.placeInWorld(game.world, tile.gridX, tile.gridY);
                    console.log(`Tree placement ${success ? 'successful' : 'failed'} at (${tile.gridX}, ${tile.gridY})`);
                } else {
                    console.log('No tile selected for tree placement');
                }
            }

            // Add rock on 'R' key
            if (key === 'r') {
                console.log('R key pressed for rock placement');

                if (game.input.selectedTile) {
                    const tile = game.input.selectedTile;
                    console.log(`Selected tile for rock placement: (${tile.gridX}, ${tile.gridY})`);

                    // Create rock structure
                    const rock = new Structure({
                        structureType: 'rock',
                        gridWidth: 1,
                        gridHeight: 1,
                        interactive: true
                    });

                    // Place in world
                    const success = rock.placeInWorld(game.world, tile.gridX, tile.gridY);
                    console.log(`Rock placement ${success ? 'successful' : 'failed'} at (${tile.gridX}, ${tile.gridY})`);
                } else {
                    console.log('No tile selected for rock placement');
                }
            }

            // Add item on 'F' key
            if (key === 'f' && game.input.selectedTile) {
                const tile = game.input.selectedTile;
                const center = tile.getCenter();

                // Create random item
                const itemTypes = ['weapon', 'potion'];
                const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];

                let item;
                if (itemType === 'weapon') {
                    item = new Item({
                        name: 'Iron Sword',
                        type: 'weapon',
                        subtype: 'sword',
                        rarity: 'uncommon',
                        value: 50,
                        equippable: true,
                        equipSlot: 'weapon',
                        stats: { damage: 10 }
                    });
                } else {
                    item = new Item({
                        name: 'Health Potion',
                        type: 'potion',
                        subtype: 'health',
                        rarity: 'common',
                        value: 20,
                        stackable: true,
                        quantity: 5,
                        consumable: true
                    });
                }

                // Add to world
                item.x = center.x;
                item.y = center.y;
                game.world.entityContainer.addChild(item);

                console.log(`Placed ${item.name} at (${tile.gridX}, ${tile.gridY})`);
            }

            // Add enemy on 'X' key (changed from 'E' to avoid conflict with zoom controls)
            if (key === 'x' && game.input.selectedTile) {
                const tile = game.input.selectedTile;
                const center = tile.getCenter();

                // Create random enemy type
                const enemyTypes = ['slime', 'goblin', 'skeleton'];
                const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

                // Create enemy
                const enemy = new Enemy({
                    name: enemyType.charAt(0).toUpperCase() + enemyType.slice(1),
                    enemyType: enemyType,
                    health: 50,
                    maxHealth: 50,
                    stats: {
                        level: 1,
                        attack: 8,
                        defense: 3,
                        speed: 5,
                        criticalChance: 0.05,
                        evasion: 0.02
                    },
                    expReward: 20,
                    goldReward: 10
                });

                // Set position
                enemy.x = center.x;
                enemy.y = center.y;
                enemy.gridX = tile.gridX;
                enemy.gridY = tile.gridY;

                // Add to world
                game.world.entityContainer.addChild(enemy);
                tile.addEntity(enemy);

                console.log(`Placed ${enemy.name} at (${tile.gridX}, ${tile.gridY})`);
            }
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        game.resize(window.innerWidth, window.innerHeight);
    });

    // Add right-click event listener for player movement
    document.addEventListener('contextmenu', (e) => {
        // Prevent default context menu
        e.preventDefault();
        console.log('Context menu prevented');
        return false;
    });

    // Add reference to legacy code
    const legacyLink = document.createElement('a');
    legacyLink.href = '/legacy/';
    legacyLink.textContent = 'View Legacy Project';
    legacyLink.style.position = 'absolute';
    legacyLink.style.bottom = '10px';
    legacyLink.style.right = '10px';
    legacyLink.style.color = 'white';
    legacyLink.style.textDecoration = 'none';
    legacyLink.style.padding = '5px 10px';
    legacyLink.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    legacyLink.style.borderRadius = '3px';
    document.body.appendChild(legacyLink);

    // Log success message
    console.log('Game initialized successfully!');
    console.log('Controls:');
    console.log('- WASD: Move camera');
    console.log('- QE: Zoom in/out');
    console.log('- Left Click: Select tile');
    console.log('- Right Click: Move player to tile');
    console.log('- Shift+Click: Place house');
    console.log('- T: Place tree');
    console.log('- R: Place rock');
    console.log('- F: Place item');
    console.log('- X: Place enemy');
    console.log('- I: Toggle inventory');
    console.log('- P: Pause/resume time');
    console.log('- T (hold Shift): Toggle time speed');
});
