/**
 * ChunkStorage - Manages saving and loading chunks to/from localStorage
 */
export class ChunkStorage {
    /**
     * Creates a new chunk storage
     * @param {Object} options - Storage options
     * @param {string} options.storagePrefix - Prefix for localStorage keys
     * @param {number} options.maxChunks - Maximum number of chunks to store (0 = unlimited)
     */
    constructor(options = {}) {
        this.storagePrefix = options.storagePrefix || 'isogame_chunk_';
        this.maxChunks = options.maxChunks || 0;
        this.chunkAccessTimes = new Map(); // Track when chunks were last accessed
    }

    /**
     * Saves a chunk to localStorage
     * @param {string} worldId - World identifier
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkY - Chunk Y coordinate
     * @param {Object} chunkData - Serialized chunk data
     * @returns {boolean} True if the chunk was saved successfully
     */
    saveChunk(worldId, chunkX, chunkY, chunkData) {
        try {
            // Create storage key
            const key = this.getChunkKey(worldId, chunkX, chunkY);
            
            // Update access time
            this.chunkAccessTimes.set(key, Date.now());
            
            // Serialize and save chunk data
            const serializedData = JSON.stringify(chunkData);
            localStorage.setItem(key, serializedData);
            
            // Enforce storage limits if needed
            if (this.maxChunks > 0) {
                this.enforceStorageLimits();
            }
            
            return true;
        } catch (error) {
            console.error('Failed to save chunk:', error);
            return false;
        }
    }

    /**
     * Loads a chunk from localStorage
     * @param {string} worldId - World identifier
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkY - Chunk Y coordinate
     * @returns {Object|null} The loaded chunk data or null if not found
     */
    loadChunk(worldId, chunkX, chunkY) {
        try {
            // Create storage key
            const key = this.getChunkKey(worldId, chunkX, chunkY);
            
            // Get serialized data
            const serializedData = localStorage.getItem(key);
            
            if (!serializedData) {
                return null;
            }
            
            // Update access time
            this.chunkAccessTimes.set(key, Date.now());
            
            // Parse and return chunk data
            return JSON.parse(serializedData);
        } catch (error) {
            console.error('Failed to load chunk:', error);
            return null;
        }
    }

    /**
     * Checks if a chunk exists in localStorage
     * @param {string} worldId - World identifier
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkY - Chunk Y coordinate
     * @returns {boolean} True if the chunk exists
     */
    chunkExists(worldId, chunkX, chunkY) {
        const key = this.getChunkKey(worldId, chunkX, chunkY);
        return localStorage.getItem(key) !== null;
    }

    /**
     * Deletes a chunk from localStorage
     * @param {string} worldId - World identifier
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkY - Chunk Y coordinate
     * @returns {boolean} True if the chunk was deleted successfully
     */
    deleteChunk(worldId, chunkX, chunkY) {
        try {
            const key = this.getChunkKey(worldId, chunkX, chunkY);
            localStorage.removeItem(key);
            this.chunkAccessTimes.delete(key);
            return true;
        } catch (error) {
            console.error('Failed to delete chunk:', error);
            return false;
        }
    }

    /**
     * Clears all chunks for a world
     * @param {string} worldId - World identifier
     * @returns {boolean} True if the chunks were cleared successfully
     */
    clearWorld(worldId) {
        try {
            // Get all keys for this world
            const prefix = `${this.storagePrefix}${worldId}_`;
            const keys = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    keys.push(key);
                }
            }
            
            // Remove all matching keys
            keys.forEach(key => {
                localStorage.removeItem(key);
                this.chunkAccessTimes.delete(key);
            });
            
            return true;
        } catch (error) {
            console.error('Failed to clear world chunks:', error);
            return false;
        }
    }

    /**
     * Gets all chunk coordinates for a world
     * @param {string} worldId - World identifier
     * @returns {Array} Array of chunk coordinates [{chunkX, chunkY}]
     */
    getWorldChunks(worldId) {
        const chunks = [];
        const prefix = `${this.storagePrefix}${worldId}_`;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                // Extract coordinates from key
                const coordPart = key.substring(prefix.length);
                const [chunkX, chunkY] = coordPart.split('_').map(Number);
                
                chunks.push({ chunkX, chunkY });
            }
        }
        
        return chunks;
    }

    /**
     * Enforces storage limits by removing least recently accessed chunks
     * @private
     */
    enforceStorageLimits() {
        // Count chunks with our prefix
        let count = 0;
        const keys = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.storagePrefix)) {
                keys.push(key);
                count++;
            }
        }
        
        // If we're under the limit, no need to remove anything
        if (count <= this.maxChunks) {
            return;
        }
        
        // Sort keys by access time (oldest first)
        keys.sort((a, b) => {
            const timeA = this.chunkAccessTimes.get(a) || 0;
            const timeB = this.chunkAccessTimes.get(b) || 0;
            return timeA - timeB;
        });
        
        // Remove oldest chunks until we're under the limit
        const toRemove = count - this.maxChunks;
        for (let i = 0; i < toRemove; i++) {
            if (i < keys.length) {
                localStorage.removeItem(keys[i]);
                this.chunkAccessTimes.delete(keys[i]);
            }
        }
    }

    /**
     * Gets the storage key for a chunk
     * @param {string} worldId - World identifier
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkY - Chunk Y coordinate
     * @returns {string} The storage key
     * @private
     */
    getChunkKey(worldId, chunkX, chunkY) {
        return `${this.storagePrefix}${worldId}_${chunkX}_${chunkY}`;
    }
}
