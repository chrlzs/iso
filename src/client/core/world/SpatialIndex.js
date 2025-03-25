class Rectangle {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    intersects(other) {
        return !(other.x > this.x + this.width ||
                other.x + other.width < this.x ||
                other.y > this.y + this.height ||
                other.y + other.height < this.y);
    }
}

class QuadTree {
    constructor(bounds, maxObjects = 10, maxLevels = 5, level = 0) {
        this.bounds = new Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
        this.maxObjects = maxObjects;
        this.maxLevels = maxLevels;
        this.level = level;
        this.objects = [];
        this.nodes = [];
    }

    split() {
        const subWidth = this.bounds.width / 2;
        const subHeight = this.bounds.height / 2;
        const x = this.bounds.x;
        const y = this.bounds.y;

        this.nodes[0] = new QuadTree(
            { x: x + subWidth, y: y, width: subWidth, height: subHeight },
            this.maxObjects,
            this.maxLevels,
            this.level + 1
        );

        this.nodes[1] = new QuadTree(
            { x: x, y: y, width: subWidth, height: subHeight },
            this.maxObjects,
            this.maxLevels,
            this.level + 1
        );

        this.nodes[2] = new QuadTree(
            { x: x, y: y + subHeight, width: subWidth, height: subHeight },
            this.maxObjects,
            this.maxLevels,
            this.level + 1
        );

        this.nodes[3] = new QuadTree(
            { x: x + subWidth, y: y + subHeight, width: subWidth, height: subHeight },
            this.maxObjects,
            this.maxLevels,
            this.level + 1
        );
    }

    getIndex(rect) {
        const verticalMidpoint = this.bounds.x + (this.bounds.width / 2);
        const horizontalMidpoint = this.bounds.y + (this.bounds.height / 2);

        const topQuadrant = (rect.y < horizontalMidpoint && rect.y + rect.height < horizontalMidpoint);
        const bottomQuadrant = (rect.y > horizontalMidpoint);

        if (rect.x < verticalMidpoint && rect.x + rect.width < verticalMidpoint) {
            if (topQuadrant) return 1;
            if (bottomQuadrant) return 2;
        }
        else if (rect.x > verticalMidpoint) {
            if (topQuadrant) return 0;
            if (bottomQuadrant) return 3;
        }

        return -1;
    }

    insert(tileData) {
        if (!tileData || typeof tileData.x !== 'number' || typeof tileData.y !== 'number') {
            console.warn('Invalid tile data for insertion:', tileData);
            return;
        }

        // Create a rectangle for spatial indexing, but keep tile data separate
        const rect = new Rectangle(tileData.x, tileData.y, 1, 1);
        const entry = {
            bounds: rect,
            data: tileData  // Store the original tile data directly
        };

        if (this.nodes.length) {
            const index = this.getIndex(rect);
            if (index !== -1) {
                this.nodes[index].insert(tileData);
                return;
            }
        }

        this.objects.push(entry);

        if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
            if (!this.nodes.length) {
                this.split();
            }

            let i = 0;
            while (i < this.objects.length) {
                const index = this.getIndex(this.objects[i].bounds);
                if (index !== -1) {
                    this.nodes[index].insert(this.objects.splice(i, 1)[0].data);
                } else {
                    i++;
                }
            }
        }
    }

    query(range, found = []) {
        const searchRect = range instanceof Rectangle ? 
            range : 
            new Rectangle(range.x, range.y, range.width, range.height);

        if (!this.bounds.intersects(searchRect)) {
            return found;
        }

        for (const object of this.objects) {
            if (searchRect.intersects(object.bounds)) {
                found.push(object.data);  // Push the original tile data
            }
        }

        if (this.nodes.length) {
            for (const node of this.nodes) {
                node.query(searchRect, found);
            }
        }

        return found;
    }
}

export class SpatialIndex {
    constructor(worldWidth, worldHeight) {
        this.quadTree = new QuadTree({
            x: 0,
            y: 0,
            width: worldWidth,
            height: worldHeight
        });
    }

    insert(tile) {
        if (!tile || typeof tile.x !== 'number' || typeof tile.y !== 'number' || !tile.type) {
            console.warn('Attempting to insert invalid tile:', tile);
            return;
        }
        this.quadTree.insert(tile);
    }

    query(bounds) {
        const searchBounds = bounds instanceof Rectangle ?
            bounds :
            new Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
        return this.quadTree.query(searchBounds);
    }

    clear() {
        this.quadTree = new QuadTree({
            x: 0,
            y: 0,
            width: this.quadTree.bounds.width,
            height: this.quadTree.bounds.height
        });
    }
}


