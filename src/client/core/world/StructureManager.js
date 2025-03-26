import { Structure } from './Structure.js';
import { StructureTemplates } from './templates/StructureTemplates.js';

export class StructureManager {
    constructor(world) {
        this.world = world;
        this.structures = new Map();
        this.templates = new Map(Object.entries(StructureTemplates));
        this.structureIdCounter = 0; // Add counter for unique IDs
    }

    createStructure(type, x, y) {
        console.log(`Attempting to create structure: ${type} at ${x},${y}`);
        const template = this.templates.get(type);
        if (!template) {
            console.warn(`No template found for structure type: ${type}`);
            return null;
        }

        const location = this.world.findSuitableBuildingLocation(
            template.width,
            template.height,
            x,
            y
        );

        if (!location) {
            console.warn(`Failed to find suitable location for ${type} near ${x},${y}`);
            return null;
        }

        const structureId = `structure_${this.structureIdCounter++}`;
        const structure = new Structure(template, location.x, location.y, this.world);
        structure.id = structureId;
        
        console.log(`Successfully created structure: ${type} (${structureId}) at ${location.x},${location.y}`);
        
        this.structures.set(structureId, structure);
        this.occupyTiles(structure);

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
        
        try {
            for (let dy = 0; dy < structure.height; dy++) {
                for (let dx = 0; dx < structure.width; dx++) {
                    const worldX = structure.x + dx;
                    const worldY = structure.y + dy;
                    const tile = this.world.getTileAt(worldX, worldY);
                    if (tile) {
                        // Store both the structure reference and the tile's index in the structure
                        tile.structure = structure;
                        tile.structureIndex = dy * structure.width + dx;
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
        const tile = this.world.getTileAt(x, y);
        return tile?.structure || null;
    }

    // Update this method to properly remove all tile references
    removeStructure(structure) {
        if (!structure || !this.world) return;

        // Clear all tile references
        for (let dy = 0; dy < structure.height; dy++) {
            for (let dx = 0; dx < structure.width; dx++) {
                const worldX = structure.x + dx;
                const worldY = structure.y + dy;
                const tile = this.world.getTileAt(worldX, worldY);
                if (tile) {
                    tile.structure = null;
                    tile.structureIndex = null;
                }
            }
        }

        // Remove the structure from our collection
        this.structures.delete(structure.id);
    }

    // Add this method to get all structures
    getAllStructures() {
        return Array.from(this.structures.values());
    }

    getStructuresInRadius(x, y, radius) {
        const structures = [];
        const radiusSquared = radius * radius;

        // Iterate through all structures
        for (const structure of this.structures.values()) {
            // Calculate distance from point to structure center
            const dx = x - structure.x;
            const dy = y - structure.y;
            const distanceSquared = dx * dx + dy * dy;

            // If within radius, add to result
            if (distanceSquared <= radiusSquared) {
                structures.push(structure);
            }
        }

        return structures;
    }

    generateUrbanStructures(center, radius) {
        const structures = [];
        const zones = this.generateZones(center, radius);

        // Process each zone
        zones.forEach(zone => {
            const density = this.getZoneDensity(zone.type);
            const availableTemplates = Array.from(this.templates.values())
                .filter(template => template.zone === zone.type);

            // Generate structures based on density
            const structureCount = Math.floor(zone.size * density);
            for (let i = 0; i < structureCount; i++) {
                const template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
                const pos = this.findValidPlacementInZone(template, zone);
                if (pos) {
                    const structure = this.createStructure(template.type, pos.x, pos.y);
                    if (structure) {
                        structures.push(structure);
                    }
                }
            }
        });

        return structures;
    }

    getZoneDensity(zoneType) {
        const densities = {
            commercial: 0.8,
            residential: 0.6,
            industrial: 0.4,
            park: 0.2
        };
        return densities[zoneType] || 0.5;
    }

    generateZones(center, radius) {
        // Simple zone generation - divide area into quarters
        const zones = [
            { type: 'commercial', x: center.x, y: center.y, size: radius * 0.3 },
            { type: 'residential', x: center.x + radius, y: center.y, size: radius * 0.4 },
            { type: 'industrial', x: center.x, y: center.y + radius, size: radius * 0.2 },
            { type: 'park', x: center.x + radius, y: center.y + radius, size: radius * 0.1 }
        ];

        return zones;
    }

    findValidPlacementInZone(template, zone) {
        const attempts = 20;
        for (let i = 0; i < attempts; i++) {
            const x = zone.x + (Math.random() - 0.5) * zone.size;
            const y = zone.y + (Math.random() - 0.5) * zone.size;
            
            if (this.isAreaSuitable(x, y, template)) {
                return { x: Math.floor(x), y: Math.floor(y) };
            }
        }
        return null;
    }
}



















