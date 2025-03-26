export class MapDefinition {
    constructor(data) {
        this.width = data.width || 64;
        this.height = data.height || 64;
        this.seed = data.seed || Math.random() * 10000;
        
        // Static terrain features
        this.terrain = data.terrain || [];  // Array of {x, y, type, height, moisture}
        
        // Static structures
        this.structures = data.structures || [];  // Array of {x, y, type}
        
        // Zones for urban generation
        this.zones = data.zones || [];  // Array of {type, x, y, size}
        
        // Roads
        this.roads = data.roads || [];  // Array of {start: {x, y}, end: {x, y}, importance}
        
        // Special points
        this.spawnPoints = data.spawnPoints || [];  // Array of {x, y}
        this.landmarks = data.landmarks || [];  // Array of {x, y, type}
    }

    static createEmpty(width = 64, height = 64) {
        return new MapDefinition({ width, height });
    }
}