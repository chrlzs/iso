export class MainMenu {
    constructor(config) {
        this.position = config.position;
        this.game = config.game;
        this.isOpen = false;
        this.menuItems = [
            { label: 'Save Game', action: () => this.saveGame() },
            { label: 'Load Game', action: () => this.loadGame() },
            { label: 'Settings', action: () => this.openSettings() },
            { label: 'About', action: () => this.openAbout() }
        ];
    }

    update(deltaTime) {
        // Update logic here if needed
    }

    render(ctx) {
        // Draw menu button
        ctx.fillStyle = '#444444';
        ctx.fillRect(this.position.x, this.position.y, 40, 40);
        
        // Draw menu icon (three lines)
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(
                this.position.x + 10,
                this.position.y + 12 + (i * 8),
                20,
                2
            );
        }
        
        if (this.isOpen) {
            this.renderMenu(ctx);
        }
    }

    renderMenu(ctx) {
        const menuWidth = 150;
        const menuHeight = this.menuItems.length * 30 + 10;
        const menuX = this.position.x - menuWidth + 40;
        const menuY = this.position.y + 45;

        // Draw menu background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

        // Draw menu items
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        this.menuItems.forEach((item, index) => {
            ctx.fillText(
                item.label,
                menuX + 10,
                menuY + 25 + (index * 30)
            );
        });
    }

    saveGame() {
        console.log('Save game clicked');
    }

    loadGame() {
        console.log('Load game clicked');
    }

    openSettings() {
        console.log('Settings clicked');
    }

    openAbout() {
        console.log('About clicked');
    }
}
