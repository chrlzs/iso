import { World } from '../core/world/World.js';
import { PathFinder } from '../core/world/PathFinder.js';

function visualizePath(world, path) {
    const grid = [];
    
    // Create grid representation
    for (let y = 0; y < world.height; y++) {
        grid[y] = [];
        for (let x = 0; x < world.width; x++) {
            const tile = world.getTile(x, y);
            grid[y][x] = tile.height.toString();
        }
    }

    // Mark path
    if (path) {
        path.forEach(point => {
            grid[point.y][point.x] = '*';
        });
    }

    // Print grid
    console.log('Path visualization:');
    grid.forEach(row => console.log(row.join(' ')));
}

function runPathTest() {
    // Create test world
    const world = new World(20, 20);
    const pathFinder = new PathFinder(world);

    // Test various paths
    const testCases = [
        { start: { x: 0, y: 0 }, end: { x: 5, y: 5 } },
        { start: { x: 0, y: 0 }, end: { x: 19, y: 19 } },
        { start: { x: 5, y: 5 }, end: { x: 15, y: 15 } }
    ];

    testCases.forEach((test, index) => {
        console.log(`\nTest case ${index + 1}:`);
        console.log(`Finding path from (${test.start.x}, ${test.start.y}) to (${test.end.x}, ${test.end.y})`);
        
        const path = pathFinder.findPath(
            test.start.x, test.start.y,
            test.end.x, test.end.y
        );

        if (path) {
            console.log('Path found:', path);
            visualizePath(world, path);
        } else {
            console.log('No path found');
        }
    });
}

// Run the test
runPathTest();