generateTile(x, y, height, moisture) {
    const tileType = this.determineTileType(height, moisture);
    const variant = this.tileManager.getRandomVariant(tileType);
    const decoration = this.tileManager.getRandomDecoration(tileType);

    return {
        type: tileType,
        height: height,
        variant: variant,
        decoration: decoration
    };
}