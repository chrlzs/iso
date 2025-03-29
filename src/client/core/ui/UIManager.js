import { InventoryUI } from './components/InventoryUI.js';

export class UIManager {
    constructor(game) {
        console.log('UIManager constructor started');
        
        if (!game) {
            console.error('UIManager initialized without game instance');
            return;
        }

        this.game = game;
        this.components = new Map();
        this.activeWindows = new Set();
        this.canvasComponents = new Set(); // Initialize the Set for canvas-based components

        try {
            console.log('Initializing UI components...');
            
            // Initialize inventory UI
            console.log('Creating InventoryUI instance...');
            this.inventoryUI = new InventoryUI(this.game);
            console.log('InventoryUI created:', this.inventoryUI);
            
            this.components.set('inventoryUI', this.inventoryUI);
            console.log('Added InventoryUI to components Map');
            console.log('Current components:', Array.from(this.components.entries()));

            // Setup event listeners
            this.setupEventListeners();
            
        } catch (error) {
            console.error('Error initializing UI components:', error);
            console.error('Stack:', error.stack);
            throw error;
        }
    }

    initializeComponents() {
        // Ensure game.world exists before initializing components
        if (!this.game || !this.game.world) {
            console.error('Game or world not initialized when creating UI components');
            return;
        }

        // Core UI components with error checking
        try {
            this.components.set('statusBar', new StatusBar({
                position: { x: 10, y: 10 },
                width: 200,
                height: 60,
                game: this.game
            }));

            this.components.set('minimap', new Minimap({
                position: { x: window.innerWidth - 210, y: window.innerHeight - 210 },
                size: 200,
                game: this.game
            }));

            this.components.set('messageLog', new MessageLog({
                position: { x: 10, y: window.innerHeight - 110 },
                width: 300,
                height: 100,
                game: this.game
            }));

            this.components.set('mainMenu', new MainMenu({
                position: { x: window.innerWidth - 50, y: 10 },
                game: this.game
            }));

            this.components.set('merchantUI', new MerchantUI({
                game: this.game
            }));

            console.log('UI Components initialized:', 
                Array.from(this.components.keys()).join(', '));
        } catch (error) {
            console.error('Error initializing UI components:', error);
        }
    }

    setupEventListeners() {
        console.log('Setting up UIManager event listeners');
        
        // Handle menu button click
        this.game.canvas.addEventListener('click', (e) => {
            const mainMenu = this.components.get('mainMenu');
            if (mainMenu) {
                const rect = this.game.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Check if click is within menu button bounds
                if (x >= mainMenu.position.x && 
                    x <= mainMenu.position.x + 40 && 
                    y >= mainMenu.position.y && 
                    y <= mainMenu.position.y + 40) {
                    mainMenu.isOpen = !mainMenu.isOpen;
                }
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            // Update positions of UI elements that depend on window size
            const mainMenu = this.components.get('mainMenu');
            const minimap = this.components.get('minimap');
            const messageLog = this.components.get('messageLog');

            if (mainMenu) {
                mainMenu.position.x = window.innerWidth - 50;
            }
            if (minimap) {
                minimap.position.x = window.innerWidth - 210;
                minimap.position.y = window.innerHeight - 210;
            }
            if (messageLog) {
                messageLog.position.y = window.innerHeight - 110;
            }
        });

        // Global click handler for closing windows
        document.addEventListener('mousedown', (e) => {
            this.activeWindows.forEach(windowId => {
                const component = this.components.get(windowId);
                if (component && component.container && 
                    !component.container.contains(e.target)) {
                    component.hide();
                    this.activeWindows.delete(windowId);
                }
            });
        });

        // Global ESC handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeWindows.size > 0) {
                const lastWindow = Array.from(this.activeWindows).pop();
                const component = this.components.get(lastWindow);
                if (component && component.hide) {
                    component.hide();
                    this.activeWindows.delete(lastWindow);
                }
            }
        });
    }

    update(deltaTime) {
        this.components.forEach((component, key) => {
            if (component && typeof component.update === 'function') {
                try {
                    component.update(deltaTime);
                } catch (error) {
                    console.error(`Error updating UI component ${key}:`, error);
                }
            }
        });
    }

    render(ctx) {
        if (!ctx) {
            console.error('No context provided for UI rendering');
            return;
        }

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        this.components.forEach((component, key) => {
            // Only render components that have a render method
            if (component && typeof component.render === 'function') {
                try {
                    component.render(ctx);
                } catch (error) {
                    console.error(`Error rendering UI component ${key}:`, error);
                }
            }
        });
        
        ctx.restore();
    }

    showDialog(dialogConfig) {
        const dialogElement = document.createElement('div');
        dialogElement.className = 'game-dialog';
        dialogElement.innerHTML = `
            <h3>${dialogConfig.npcName}</h3>
            <p>${dialogConfig.text}</p>
            <div class="dialog-options">
                ${dialogConfig.options.map((option, index) => `
                    <button class="dialog-option" data-option="${index}">
                        ${option.text}
                    </button>
                `).join('')}
            </div>
        `;

        // Position dialog
        dialogElement.style.position = 'absolute';
        dialogElement.style.bottom = '20%';
        dialogElement.style.left = '50%';
        dialogElement.style.transform = 'translateX(-50%)';
        
        // Add event listeners
        dialogElement.querySelectorAll('.dialog-option').forEach((button, index) => {
            button.addEventListener('click', () => {
                dialogConfig.options[index].action();
            });
        });

        document.body.appendChild(dialogElement);
        this.currentDialog = dialogElement;
    }

    showTradeDialog(merchant) {
        // Implement merchant-specific dialog with inventory
        // Similar to showDialog but with trade-specific UI
    }

    hideDialog() {
        if (this.currentDialog) {
            this.currentDialog.remove();
            this.currentDialog = null;
        }
    }

    showWindow(windowId) {
        const component = this.components.get(windowId);
        if (component && component.show) {
            component.show();
            this.activeWindows.add(windowId);
        }
    }

    hideWindow(windowId) {
        const component = this.components.get(windowId);
        if (component && component.hide) {
            component.hide();
            this.activeWindows.delete(windowId);
        }
    }

    hideAllWindows() {
        this.activeWindows.forEach(windowId => {
            this.hideWindow(windowId);
        });
    }
}





















