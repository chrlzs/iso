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
        // Basic house template
        this.templates.set('house', {
            type: 'house',
            width: 2,
            height: 2,
            blueprint: [
                ['wall', 'wall'],
                ['door', 'wall']
            ],
            decorations: [
                { type: 'chimney', x: 0, y: 0 },
                { type: 'window', x: 1, y: 0 }
            ]
        });

        // Tavern template
        this.templates.set('tavern', {
            type: 'tavern',
            width: 3,
            height: 3,
            blueprint: [
                ['wall', 'wall', 'wall'],
                ['wall', 'floor', 'wall'],
                ['door', 'floor', 'wall']
            ],
            decorations: [
                { type: 'sign', x: 0, y: 2 },
                { type: 'window', x: 0, y: 0 },
                { type: 'window', x: 2, y: 0 }
            ]
        });
    }

    createStructure(type, x, y) {
        const template = this.templates.get(type);
        if (!template) {
            console.warn(`No template found for structure type: ${type}`);
            return null;
        }

        const structure = new Structure({
            ...template,
            x,
            y
        });

        if (structure.canPlace(this.world, x, y)) {
            this.structures.set(`${x},${y}`, structure);
            this.applyStructureToWorld(structure);
            return structure;
        }

        return null;
    }

    applyStructureToWorld(structure) {
        const footprint = structure.getFootprint();
        for (const tile of footprint) {
            // Mark tiles as occupied by structure
            const worldTile = this.world.generateTile(
                tile.x,
                tile.y,
                this.world.generateHeight(tile.x, tile.y),
                this.world.generateMoisture(tile.x, tile.y)
            );
            
            worldTile.structure = {
                id: `${structure.type}_${structure.x}_${structure.y}`,
                type: structure.type,
                part: structure.blueprint[tile.y - structure.y][tile.x - structure.x]
            };
        }
    }

    generateRandomStructures(count) {
        const structureTypes = Array.from(this.templates.keys());
        const placedStructures = [];

        for (let i = 0; i < count; i++) {
            const type = structureTypes[Math.floor(Math.random() * structureTypes.length)];
            const x = Math.floor(Math.random() * (this.world.width - 5));
            const y = Math.floor(Math.random() * (this.world.height - 5));

            const structure = this.createStructure(type, x, y);
            if (structure) {
                placedStructures.push(structure);
            }
        }

        return placedStructures;
    }
}