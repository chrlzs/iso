
import { Inventory } from '../inventory/Inventory.js';
import { Item } from '../inventory/Item.js';
import { Entity } from './Entity.js';

export class Player extends Entity {
    constructor(config) {
        super(config);
        
        // Initialize inventory with default values
        this.inventory = new Inventory({
            maxSlots: 20,
            maxWeight: 100,
            owner: this,
            eth: 1000 // Starting ETH
        });

        if (!this.inventory) {
            throw new Error('Failed to initialize player inventory');
        }
        
        if (!config.pathFinder) {
            throw new Error('PathFinder is required for Player initialization');
        }
        
        // Store pathFinder reference
        this.pathFinder = config.pathFinder;
        
        // Basic properties
        this.size = 32;
        this.color = '#4A90E2'; // Player base color
        this.direction = 'south';
        this.isMoving = false;
        this.speed = 0.1; // Movement speed
        this.currentPath = null;
        this.currentPathIndex = 0;
        this.targetReachThreshold = 0.1;

        // Shadow properties
        this.shadowSize = { width: 32, height: 10 };
        this.shadowOffset = 4;
        this.shadowColor = 'rgba(0, 0, 0, 0.4)';

        // Animation properties
        this.animationTime = 0;
        this.bobOffset = 0;
        
        // Direction mapping for rendering
        this.directions = {
            'north': 0,
            'northeast': 1,
            'east': 2,
            'southeast': 3,
            'south': 4,
            'southwest': 5,
            'west': 6,
            'northwest': 7
        };
    }

    render(ctx, renderer) {
        if (!renderer) return;
        
        const isoPos = renderer.convertToIsometric(this.x, this.y);
        
        // Draw shadow
        ctx.beginPath();
        ctx.fillStyle = this.shadowColor;
        ctx.ellipse(
            isoPos.x,
            isoPos.y + this.shadowOffset,
            this.shadowSize.width / 2,
            this.shadowSize.height / 2,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Calculate bob animation for walking
        if (this.isMoving) {
            this.animationTime += 0.1;
            this.bobOffset = Math.sin(this.animationTime) * 2;
        } else {
            this.bobOffset = 0;
            this.animationTime = 0;
        }

        // Save context for character drawing
        ctx.save();
        ctx.translate(isoPos.x, isoPos.y - this.size/2 + this.bobOffset);

        // Draw body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size/3, this.size/2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw head
        ctx.fillStyle = '#FFE0BD'; // Skin tone
        ctx.beginPath();
        ctx.arc(0, -this.size/2, this.size/4, 0, Math.PI * 2);
        ctx.fill();

        // Draw direction indicator (eyes and face direction)
        const directionAngle = this.getDirectionAngle();
        ctx.fillStyle = '#000000';
        
        // Left eye
        ctx.beginPath();
        ctx.arc(
            -5 * Math.cos(directionAngle),
            -this.size/2 - 2,
            2,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Right eye
        ctx.beginPath();
        ctx.arc(
            5 * Math.cos(directionAngle),
            -this.size/2 - 2,
            2,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Draw arms when moving
        if (this.isMoving) {
            const armAngle = Math.sin(this.animationTime * 2);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 4;
            
            // Left arm
            ctx.beginPath();
            ctx.moveTo(-this.size/3, -this.size/4);
            ctx.lineTo(
                -this.size/3 - Math.cos(armAngle) * 10,
                -this.size/4 + Math.sin(armAngle) * 10
            );
            ctx.stroke();
            
            // Right arm
            ctx.beginPath();
            ctx.moveTo(this.size/3, -this.size/4);
            ctx.lineTo(
                this.size/3 + Math.cos(armAngle) * 10,
                -this.size/4 + Math.sin(armAngle) * 10
            );
            ctx.stroke();
        }

        ctx.restore();
    }

    getDirectionAngle() {
        const angles = {
            'north': Math.PI,
            'northeast': Math.PI * 5/4,
            'east': Math.PI * 3/2,
            'southeast': Math.PI * 7/4,
            'south': 0,
            'southwest': Math.PI/4,
            'west': Math.PI/2,
            'northwest': Math.PI * 3/4
        };
        return angles[this.direction] || 0;
    }

    setPath(path) {
        this.currentPath = path;
        this.currentPathIndex = 0;
        this.isMoving = true;
    }

    update(deltaTime) {
        // Verify pathFinder exists
        if (!this.pathFinder) {
            console.error('PathFinder is not initialized in Player');
            this.isMoving = false;
            return;
        }

        if (!this.isMoving || !this.currentPath) {
            return;
        }

        const target = this.currentPath[this.currentPathIndex];
        if (!target) {
            this.isMoving = false;
            return;
        }

        try {
            // Check if next tile is walkable before moving
            if (!this.pathFinder.isWalkable(target.x, target.y)) {
                console.warn('Path contains unwalkable tile, stopping movement');
                this.currentPath = null;
                this.isMoving = false;
                return;
            }
        } catch (error) {
            console.error('Error checking walkable tile:', error);
            this.isMoving = false;
            return;
        }

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.targetReachThreshold) {
            this.currentPathIndex++;
            
            if (this.currentPathIndex >= this.currentPath.length) {
                this.currentPath = null;
                this.isMoving = false;
                
                if (this.onPathComplete) {
                    this.onPathComplete();
                    this.onPathComplete = null;
                }
                return;
            }
        } else {
            const moveDistance = this.speed * deltaTime;
            const ratio = Math.min(moveDistance / distance, 1);
            
            this.x += dx * ratio;
            this.y += dy * ratio;
            
            const angle = Math.atan2(dy, dx);
            this.direction = this.getDirectionFromAngle(angle);
        }
    }

    getDirectionFromAngle(angle) {
        // Convert angle to degrees and normalize to 0-360
        let degrees = (angle * 180 / Math.PI + 360) % 360;
        
        // Define direction sectors
        if (degrees >= 337.5 || degrees < 22.5) return 'east';
        if (degrees >= 22.5 && degrees < 67.5) return 'southeast';
        if (degrees >= 67.5 && degrees < 112.5) return 'south';
        if (degrees >= 112.5 && degrees < 157.5) return 'southwest';
        if (degrees >= 157.5 && degrees < 202.5) return 'west';
        if (degrees >= 202.5 && degrees < 247.5) return 'northwest';
        if (degrees >= 247.5 && degrees < 292.5) return 'north';
        return 'northeast';
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }

    // Update terrain information
    updateTerrainInfo(height, angle) {
        this.terrainHeight = height || 0;
        this.terrainAngle = angle || 0;
        this.updateShadow();
    }

    // Updated shadow calculations
    updateShadow() {
        // Calculate height difference between player and terrain
        const heightDifference = Math.max(0, this.y - this.terrainHeight);
        
        // Update shadow offset based on height difference
        this.shadowOffset = 4 + heightDifference * 0.3;
        
        // Scale shadow based on height with tighter constraints
        const scale = Math.max(0.4, 1 - heightDifference / 250);
        this.shadowSize.width = 32 * scale;
        this.shadowSize.height = 10 * scale;
        
        // Adjust shadow opacity based on height
        const opacity = Math.max(0.2, 0.4 * scale);
        this.shadowColor = `rgba(0, 0, 0, ${opacity})`;
    }

    // Example method to test shadow effects
    testShadowEffects() {
        // Simulate terrain changes
        const terrainHeight = Math.sin(Date.now() / 1000) * 50; // Oscillating height
        const terrainAngle = Math.sin(Date.now() / 1500) * 0.2; // Oscillating angle
        this.updateTerrainInfo(terrainHeight, terrainAngle);
    }

    equipItem(slot, itemSlot) {
        const item = this.inventory.getSlot(itemSlot);
        if (!item) return false;

        // Check if item can be equipped in this slot
        if (item.slot !== slot) return false;

        // Unequip current item if any
        if (this.equipment[slot]) {
            this.inventory.addItem(this.equipment[slot]);
        }

        // Equip new item
        this.equipment[slot] = item;
        this.inventory.removeItem(itemSlot);
        
        // Update player stats based on equipment
        this.updateStats();
        
        return true;
    }

    unequipItem(slot) {
        const item = this.equipment[slot];
        if (!item) return false;

        if (this.inventory.addItem(item)) {
            this.equipment[slot] = null;
            this.updateStats();
            return true;
        }
        return false;
    }

    updateStats() {
        // Recalculate stats based on equipment
        let totalDefense = 0;
        let totalDamage = 0;

        Object.values(this.equipment).forEach(item => {
            if (item) {
                if (item.defense) totalDefense += item.defense;
                if (item.damage) totalDamage += item.damage;
            }
        });

        this.defense = this.baseDefense + totalDefense;
        this.damage = this.baseDamage + totalDamage;
    }
}

































