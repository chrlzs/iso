generateTile(x, y, height, moisture) {
    const tileType = this.determineTileType(height, moisture);
    // Generate variant and decoration only once during tile creation
    const variant = this.tileManager.getRandomVariant(tileType);
    const decoration = this.tileManager.getRandomDecoration(tileType);

    return {
        type: tileType,
        height: Math.max(0, Math.floor(height * 2)),
        variant: variant,
        decoration: decoration,
        // Add a unique ID to the tile to ensure persistence
        id: `tile_${x}_${y}`
    };
}

