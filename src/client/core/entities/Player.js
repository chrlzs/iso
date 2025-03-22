export class Player {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.size = 24;
        this.color = '#0000FF';  // Fallback color
        this.currentPath = null;
        this.currentPathIndex = 0;
        this.isMoving = false;
        this.moveSpeed = 0.1;
        this.speed = 2;
        this.targetReachThreshold = 0.1;

        // Shadow properties
        this.shadowOffset = 4;
        this.shadowSize = {
            width: 32,
            height: 10
        };
        this.shadowColor = 'rgba(0, 0, 0, 0.4)';

        // Sprite properties
        this.spriteSheet = new Image();
        this.spriteSheet.src = 'assets/characters/main_character.png';
        this.spriteSheet.onload = () => {
            this.imageLoaded = true;
            // Calculate frame dimensions based on 12x8 sprite sheet
            this.frameWidth = this.spriteSheet.width / 12;  // 12 frames per row
            this.frameHeight = this.spriteSheet.height / 8; // 8 rows
        };

        // Animation properties
        this.direction = 'south';
        this.frameX = 0;
        this.frameY = 0;
        this.frameCount = 0;
        this.animationSpeed = 8;
        this.imageLoaded = false;

        // Define animation rows (0-based index)
        this.directions = {
            'south': 0,     // Row 1
            'southeast': 1, // Row 2
            'southwest': 2, // Row 3
            'west': 3,     // Row 4
            'northwest': 4, // Row 5
            'north': 5,    // Row 6
            'northeast': 6, // Row 7
            'east': 7      // Row 8
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
        
        if (this.imageLoaded) {
            // Draw sprite
            ctx.drawImage(
                this.spriteSheet,
                this.frameX * this.frameWidth,
                this.frameY * this.frameHeight,
                this.frameWidth,
                this.frameHeight,
                isoPos.x - this.frameWidth / 2,
                isoPos.y - this.frameHeight,
                this.frameWidth,
                this.frameHeight
            );
        } else {
            // Fallback rendering
            ctx.beginPath();
            ctx.fillStyle = this.color;
            ctx.arc(isoPos.x, isoPos.y - this.size/2, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    setPath(path) {
        if (!path || path.length === 0) {
            console.log('Invalid path provided');
            return;
        }

        this.currentPath = path;
        this.currentPathIndex = 0;
        this.isMoving = true;
    }

    update(deltaTime) {
        // Update animation frame
        this.frameCount++;
        if (this.frameCount >= this.animationSpeed) {
            this.frameX = (this.frameX + 1) % 12;
            this.frameCount = 0;
        }

        if (!this.isMoving || !this.currentPath || this.currentPathIndex >= this.currentPath.length) {
            // When idle, use first frame of current direction
            this.frameX = 0;
            return;
        }

        const targetPos = this.currentPath[this.currentPathIndex];
        if (!targetPos) {
            this.isMoving = false;
            this.currentPath = null;
            return;
        }

        const dx = targetPos.x - this.x;
        const dy = targetPos.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.targetReachThreshold) {
            this.currentPathIndex++;
            
            if (this.currentPathIndex >= this.currentPath.length) {
                this.currentPath = null;
                this.isMoving = false;
                this.frameX = 0; // Reset to idle frame
                return;
            }
        } else {
            const moveDistance = this.speed * deltaTime;
            const ratio = Math.min(moveDistance / distance, 1);
            
            this.x += dx * ratio;
            this.y += dy * ratio;
            
            // Determine direction based on movement angle
            const angle = Math.atan2(dy, dx);
            this.direction = this.getDirectionFromAngle(angle);
            
            // Update frame row based on direction
            this.frameY = this.directions[this.direction];
        }
    }

    getDirectionFromAngle(angle) {
        // Convert angle to degrees and normalize to 0-360
        const degrees = ((angle * 180 / Math.PI) + 360) % 360;
        
        // Define direction sectors (each 45 degrees)
        if (degrees >= 337.5 || degrees < 22.5) return 'east';
        if (degrees >= 22.5 && degrees < 67.5) return 'southeast';
        if (degrees >= 67.5 && degrees < 112.5) return 'south';
        if (degrees >= 112.5 && degrees < 157.5) return 'southwest';
        if (degrees >= 157.5 && degrees < 202.5) return 'west';
        if (degrees >= 202.5 && degrees < 247.5) return 'northwest';
        if (degrees >= 247.5 && degrees < 292.5) return 'north';
        if (degrees >= 292.5 && degrees < 337.5) return 'northeast';
        return 'south'; // Default direction
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
}














