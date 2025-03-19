generateTile(x, y, height, moisture) {
    const tileType = this.determineTileType(height, moisture);
    const variant = this.tileManager.getRandomVariant(tileType);
    const decoration = this.tileManager.getRandomDecoration(tileType);

    return {
        type: tileType,
        height: Math.max(0, Math.floor(height * 2)),
        variant: variant,
        decoration: decoration
    };
}
