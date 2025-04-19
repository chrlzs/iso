/**
 * WorldUtils.js
 * Utility functions for working with worlds and maps
 */

/**
 * Gets all saved world IDs from localStorage
 * @returns {Array} Array of world objects with id, timestamp, seed, and custom name
 */
export function getSavedWorlds() {
    const worlds = [];
    const worldPrefix = 'isogame_world_';
    const mapNamesKey = 'isogame_map_names';

    // Load map names dictionary
    const mapNames = getMapNames();

    // Scan localStorage for world states
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(worldPrefix)) {
            try {
                // Extract world ID from key
                const worldId = key.substring(worldPrefix.length);

                // Get world state data
                const worldStateData = localStorage.getItem(key);
                if (worldStateData) {
                    const worldState = JSON.parse(worldStateData);

                    // Get custom name if available
                    const customName = mapNames[worldId] || null;

                    // Create world info object
                    const worldInfo = {
                        id: worldId,
                        timestamp: worldState.timestamp || 0,
                        seed: worldState.seed || 0,
                        customName: customName,
                        displayName: customName ||
                            (worldId.startsWith('building_') ?
                                `Building Map ${new Date(worldState.timestamp).toLocaleString()}` :
                                worldId)
                    };

                    worlds.push(worldInfo);
                }
            } catch (error) {
                console.error(`Error parsing world state for key ${key}:`, error);
            }
        }
    }

    // Sort worlds by timestamp (newest first)
    worlds.sort((a, b) => b.timestamp - a.timestamp);

    return worlds;
}

/**
 * Gets the map names dictionary from localStorage
 * @returns {Object} Map of world IDs to custom names
 */
export function getMapNames() {
    const mapNamesKey = 'isogame_map_names';
    const mapNamesData = localStorage.getItem(mapNamesKey);

    if (mapNamesData) {
        try {
            return JSON.parse(mapNamesData);
        } catch (error) {
            console.error('Error parsing map names:', error);
            return {};
        }
    }

    return {};
}

/**
 * Saves a custom name for a world
 * @param {string} worldId - World ID
 * @param {string} customName - Custom name for the world
 * @returns {boolean} True if the name was saved successfully
 */
export function saveMapName(worldId, customName) {
    if (!worldId) return false;

    try {
        // Get existing map names
        const mapNames = getMapNames();

        // Update or add the custom name
        mapNames[worldId] = customName;

        // Save back to localStorage
        localStorage.setItem('isogame_map_names', JSON.stringify(mapNames));

        return true;
    } catch (error) {
        console.error('Error saving map name:', error);
        return false;
    }
}

/**
 * Checks if a map name already exists
 * @param {string} customName - Custom name to check
 * @param {string} currentWorldId - Current world ID (to exclude from check)
 * @returns {boolean} True if the name already exists for another world
 */
export function mapNameExists(customName, currentWorldId = null) {
    if (!customName) return false;

    const mapNames = getMapNames();

    // Check if any world has this custom name (except the current world)
    for (const [worldId, name] of Object.entries(mapNames)) {
        if (name === customName && worldId !== currentWorldId) {
            return true;
        }
    }

    return false;
}

/**
 * Gets a world ID by custom name
 * @param {string} customName - Custom name to look up
 * @returns {string|null} World ID or null if not found
 */
export function getWorldIdByName(customName) {
    if (!customName) return null;

    const mapNames = getMapNames();

    // Find the world ID with this custom name
    for (const [worldId, name] of Object.entries(mapNames)) {
        if (name === customName) {
            return worldId;
        }
    }

    return null;
}

/**
 * Gets the number of chunks for a world
 * @param {string} worldId - World ID
 * @returns {number} Number of chunks
 */
export function getWorldChunkCount(worldId) {
    let count = 0;
    const chunkPrefix = `isogame_chunk_${worldId}`;

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(chunkPrefix)) {
            count++;
        }
    }

    return count;
}

/**
 * Gets the approximate storage size for a world in KB
 * @param {string} worldId - World ID
 * @returns {number} Storage size in KB
 */
export function getWorldStorageSize(worldId) {
    let size = 0;
    const prefix = `isogame_`;

    // Add world state size
    const worldStateKey = `isogame_world_${worldId}`;
    const worldState = localStorage.getItem(worldStateKey);
    if (worldState) {
        size += worldState.length * 2; // Approximate size in bytes
    }

    // Add chunk sizes
    const chunkPrefix = `isogame_chunk_${worldId}`;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(chunkPrefix)) {
            size += localStorage.getItem(key).length * 2; // Approximate size in bytes
        }
    }

    return Math.round(size / 1024); // Convert to KB
}
