import { Structure } from './Structure.js';

export class StructureManager {
    constructor(world) {
        this.world = world;
        this.structures = new Map();
        this.templates = new Map();
        
        // Initialize basic structure templates
        this.initializeTemplates();
    }

    initializeTemplates() {
        // Basic house template (3x4)
        this.templates.set('house', {
            type: 'house',
            width: 3,
            height: 4,
            blueprint: [
                ['wall', 'wall', 'wall'],
                ['wall', 'floor', 'wall'],
                ['wall', 'floor', 'wall'],
                ['wall', 'door', 'wall']
            ],
            decorations: [
                { type: 'chimney', x: 0, y: 0 },
                { type: 'window', x: 2, y: 1 },
                { type: 'window', x: 0, y: 1 }
            ]
        });

        // Tavern template (4x4)
        this.templates.set('tavern', {
            type: 'tavern',
            width: 4,
            height: 4,
            blueprint: [
                ['wall', 'wall', 'wall', 'wall'],
                ['wall', 'floor', 'floor', 'wall'],
                ['wall', 'floor', 'floor', 'wall'],
                ['wall', 'door', 'door', 'wall']
            ],
            decorations: [
                { type: 'sign', x: 1, y: 3 },
                { type: 'window', x: 0, y: 1 },
                { type: 'window', x: 3, y: 1 },
                { type: 'chimney', x: 2, y: 0 }
            ]
        });
    }

    createStructure(type, x, y) {
        const template = this.templates.get(type);
        if (!template) {
            console.warn(`No template found for structure type: ${type}`);
            return null;
        }

        // Validate minimum structure size
        if (template.width < 3 || template.height < 4) {
            console.warn(`Structure ${type} does not meet minimum size requirements (3x4)`);
            return null;
        }

        // Check if area is suitable for structure
        if (!this.isAreaSuitable(x, y, template)) {
            if (this.world.debug?.flags?.logStructures) {
                console.log(`Structure placement failed at ${x},${y} - unsuitable area`);
            }
            return null;
        }

        const structure = new Structure(template, x, y);
        const key = `${x},${y}`;
        this.structures.set(key, structure);

        // Mark tiles as occupied by structure
        this.occupyTiles(structure);

        console.log(`Structure created: ${type} at ${x},${y} (${template.width}x${template.height})`);
        return structure;
    }

    isAreaSuitable(x, y, template) {
        // Ensure world is initialized
        if (!this.world || !this.world.getTileAt) {
            console.warn('World not properly initialized');
            return false;
        }

        // Boundary check
        if (x < 0 || y < 0 || 
            x + template.width > this.world.width || 
            y + template.height > this.world.height) {
            return false;
        }

        try {
            // Check each tile in the structure's footprint AND surrounding tiles
            // Add a 1-tile buffer around the structure to avoid building right next to water
            for (let dy = -1; dy <= template.height + 1; dy++) {
                for (let dx = -1; dx <= template.width + 1; dx++) {
                    const worldX = x + dx;
                    const worldY = y + dy;
                    
                    // Skip boundary check for buffer tiles
                    if (worldX < 0 || worldY < 0 || 
                        worldX >= this.world.width || 
                        worldY >= this.world.height) {
                        continue;
                    }

                    const tile = this.world.getTileAt(worldX, worldY);
                    if (!tile) return false;

                    // Check the actual structure footprint more strictly
                    if (dx >= 0 && dx < template.width && dy >= 0 && dy < template.height) {
                        // For the actual structure area, reject if:
                        // - tile is water or wetland
                        // - tile already has a structure
                        // - tile height varies too much (to avoid building on steep terrain)
                        if (tile.type === 'water' || 
                            tile.type === 'wetland' || 
                            tile.structure) {
                            return false;
                        }
                    } else {
                        // For the buffer zone, only reject if it's water
                        // This prevents building right next to water
                        if (tile.type === 'water') {
                            return false;
                        }
                    }
                }
            }
            return true;
        } catch (error) {
            console.warn('Error checking area suitability:', error);
            return false;
        }
    }

    findValidPlacement(type, baseX, baseY, maxAttempts = 20) {
        const template = this.templates.get(type);
        if (!template) {
            console.warn(`No template found for structure type: ${type}`);
            return null;
        }

        // Try the exact position first
        if (this.isAreaSuitable(baseX, baseY, template)) {
            return { x: baseX, y: baseY };
        }

        // If exact position fails, try nearby positions in a spiral pattern
        let attempts = 0;
        let radius = 1;
        while (attempts < maxAttempts) {
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    if (dx === 0 && dy === 0) continue; // Skip center point

                    const x = baseX + dx;
                    const y = baseY + dy;

                    if (this.isAreaSuitable(x, y, template)) {
                        return { x, y };
                    }

                    attempts++;
                    if (attempts >= maxAttempts) return null;
                }
            }
            radius++;
        }

        return null;
    }

    occupyTiles(structure) {
        if (!structure || !this.world) return;
        if (typeof structure.x !== 'number' || typeof structure.y !== 'number') {
            console.warn('Invalid structure coordinates:', structure);
            return;
        }

        try {
            for (let dy = 0; dy < structure.height; dy++) {
                for (let dx = 0; dx < structure.width; dx++) {
                    const worldX = structure.x + dx;
                    const worldY = structure.y + dy;
                    const tile = this.world.getTileAt(worldX, worldY);
                    if (tile) {
                        tile.structure = structure;
                        if (this.world.debug?.flags?.logStructures) {
                            console.log(`Marked tile at ${worldX},${worldY} as occupied by ${structure.type}`);
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Error occupying tiles:', error);
        }
    }

    generateRandomStructures(count) {
        console.log(`Generating ${count} random structures...`);
        const structureTypes = Array.from(this.templates.keys());
        const placedStructures = [];
        let attempts = 0;
        const maxAttempts = count * 5; // Increased attempts for better placement

        // Start from center and work outward in a more controlled way
        const centerX = Math.floor(this.world.width / 2);
        const centerY = Math.floor(this.world.height / 2);
        const radius = Math.min(20, Math.floor(Math.min(this.world.width, this.world.height) / 4));

        while (placedStructures.length < count && attempts < maxAttempts) {
            // Use a spiral pattern for more organized placement
            const angle = (attempts * 0.5) * Math.PI;
            const distance = (attempts / maxAttempts) * radius;
            const x = Math.floor(centerX + Math.cos(angle) * distance);
            const y = Math.floor(centerY + Math.sin(angle) * distance);

            if (x < 0 || x >= this.world.width || y < 0 || y >= this.world.height) {
                attempts++;
                continue;
            }

            // Check the tile type before attempting to place structure
            const tile = this.world.getTileAt(x, y);
            if (tile && tile.type !== 'water' && tile.type !== 'wetland') {
                const type = structureTypes[Math.floor(Math.random() * structureTypes.length)];
                const structure = this.createStructure(type, x, y);
                
                if (structure) {
                    placedStructures.push(structure);
                    if (this.world.debug?.flags?.logStructures) {
                        console.log(`Successfully placed ${type} at ${x},${y}`);
                    }
                }
            }
            attempts++;
        }

        console.log(`Successfully placed ${placedStructures.length} structures after ${attempts} attempts`);
        return placedStructures;
    }

    getStructureAt(x, y) {
        return this.structures.get(`${x},${y}`);
    }
}








