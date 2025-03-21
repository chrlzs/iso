generateTile(x, y, height, moisture) {
    const tileType = this.determineTileType(height, moisture);
    const variant = this.tileManager.getRandomVariant(tileType);
    const decoration = this.tileManager.getRandomDecoration(tileType);

    return {
        type: tileType,
        // Convert height to integer levels (0-3)
        height: Math.floor(height * 4),
        variant: variant,
        decoration: decoration,
        id: `tile_${x}_${y}`
    };
}

