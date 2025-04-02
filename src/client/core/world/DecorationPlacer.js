import { DecorationTypes, DecorationProperties } from './DecorationRegistry.js';

export class DecorationPlacer {
    constructor(mapDef) {
        this.mapDef = mapDef;
    }

    placeDecoration(x, y, category, type) {
        // Simple placement for now to get things working
        const decoration = {
            type: type.toLowerCase(),
            x,
            y,
            properties: { ...DecorationProperties }
        };

        // Add to map's decorations
        if (!this.mapDef.decorations) {
            this.mapDef.decorations = [];
        }
        this.mapDef.decorations.push(decoration);

        return decoration;
    }

    isValidPlacement(x, y) {
        return x >= 0 && x < this.mapDef.width && 
               y >= 0 && y < this.mapDef.height;
    }
}

