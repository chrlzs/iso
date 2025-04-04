import { RectPool } from '../utils/RectPool.js';

/**
 * OcclusionCulling - Culls entities that are occluded by other entities
 */
export class OcclusionCulling {
    /**
     * Creates a new occlusion culling system
     * @param {Object} options - Culling options
     */
    constructor(options = {}) {
        this.options = {
            enabled: true,
            maxOccluders: 50,
            occluderTypes: ['building', 'structure', 'wall'],
            ...options
        };
        
        // Create rect pool for occluders
        this.rectPool = new RectPool(this.options.maxOccluders);
        
        // Occluder list
        this.occluders = [];
        
        // Stats
        this.stats = {
            occluders: 0,
            culledEntities: 0,
            checks: 0,
            lastUpdate: 0
        };
    }
    
    /**
     * Updates the occluder list
     * @param {Array} entities - All entities
     * @param {Object} camera - Camera
     */
    updateOccluders(entities, camera) {
        // Skip if disabled
        if (!this.options.enabled) return;
        
        // Clear previous occluders
        this.releaseOccluders();
        
        try {
            // Get camera view bounds
            const viewX = camera.x - camera.width / 2;
            const viewY = camera.y - camera.height / 2;
            const viewWidth = camera.width;
            const viewHeight = camera.height;
            
            // Find potential occluders
            let occluderCount = 0;
            
            for (const entity of entities) {
                // Skip if not an occluder type
                if (!entity.type || !this.options.occluderTypes.includes(entity.type)) {
                    continue;
                }
                
                // Skip if no bounds
                if (!entity.getBounds) continue;
                const bounds = entity.getBounds();
                if (!bounds) continue;
                
                // Skip if not in view
                if (
                    bounds.x + bounds.width < viewX ||
                    bounds.x > viewX + viewWidth ||
                    bounds.y + bounds.height < viewY ||
                    bounds.y > viewY + viewHeight
                ) {
                    continue;
                }
                
                // Create occluder rect
                const occluder = this.rectPool.get(
                    bounds.x,
                    bounds.y,
                    bounds.width,
                    bounds.height
                );
                
                // Add to occluder list
                this.occluders.push(occluder);
                occluderCount++;
                
                // Limit occluder count
                if (occluderCount >= this.options.maxOccluders) {
                    break;
                }
            }
            
            this.stats.occluders = occluderCount;
            this.stats.lastUpdate = performance.now();
        } catch (e) {
            console.error('Error updating occluders:', e);
        }
    }
    
    /**
     * Releases all occluder rects back to the pool
     */
    releaseOccluders() {
        for (const occluder of this.occluders) {
            this.rectPool.release(occluder);
        }
        this.occluders = [];
    }
    
    /**
     * Checks if an entity is occluded
     * @param {Object} entity - Entity to check
     * @param {Object} camera - Camera
     * @returns {boolean} True if occluded
     */
    isOccluded(entity, camera) {
        // Skip if disabled or no occluders
        if (!this.options.enabled || this.occluders.length === 0) {
            return false;
        }
        
        try {
            // Skip if no bounds
            if (!entity.getBounds) return false;
            const bounds = entity.getBounds();
            if (!bounds) return false;
            
            // Skip if entity is an occluder
            if (entity.type && this.options.occluderTypes.includes(entity.type)) {
                return false;
            }
            
            // Check if entity is behind any occluder
            for (const occluder of this.occluders) {
                this.stats.checks++;
                
                // Skip if not overlapping in X
                if (
                    bounds.x + bounds.width < occluder.x ||
                    bounds.x > occluder.x + occluder.width
                ) {
                    continue;
                }
                
                // Check if entity is behind occluder
                if (
                    bounds.y > occluder.y &&
                    bounds.y < occluder.y + occluder.height
                ) {
                    this.stats.culledEntities++;
                    return true;
                }
            }
        } catch (e) {
            console.error('Error checking occlusion:', e);
        }
        
        return false;
    }
    
    /**
     * Filters a list of entities, removing occluded ones
     * @param {Array} entities - Entities to filter
     * @param {Object} camera - Camera
     * @returns {Array} Visible entities
     */
    filterVisible(entities, camera) {
        // Skip if disabled or no occluders
        if (!this.options.enabled || this.occluders.length === 0) {
            return entities;
        }
        
        try {
            return entities.filter(entity => !this.isOccluded(entity, camera));
        } catch (e) {
            console.error('Error filtering visible entities:', e);
            return entities;
        }
    }
    
    /**
     * Gets culling statistics
     * @returns {Object} Culling statistics
     */
    getStats() {
        return { ...this.stats };
    }
}
