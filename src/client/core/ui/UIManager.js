import { InventoryUI } from './components/InventoryUI.js';
import { MessageLog } from './components/MessageLog.js';
import { MerchantUI } from './components/MerchantUI.js';

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
        this.canvasComponents = new Set();

        try {
            console.log('Initializing UI components...');
            
            // Initialize MessageLog
            console.log('Creating MessageLog instance...');
            const messageLog = new MessageLog({
                position: { x: 10, y: window.innerHeight - 110 },
                width: 300,
                height: 100,
                game: this.game
            });
            this.components.set('messageLog', messageLog);
            
            // Initialize inventory UI
            console.log('Creating InventoryUI instance...');
            const inventoryUI = new InventoryUI(this.game);
            this.components.set('inventoryUI', inventoryUI);

            // Initialize merchant UI
            console.log('Creating MerchantUI instance...');
            const merchantUI = new MerchantUI({ game: this.game });
            this.components.set('merchantUI', merchantUI);
            
            // Now that all components are initialized, we can safely hide them
            inventoryUI.hide();
            merchantUI.hide();
            
            console.log('Current components:', Array.from(this.components.entries()));

            // Setup event listeners
            this.setupEventListeners();
            
        } catch (error) {
            console.error('Error initializing UI components:', error);
            console.error('Stack:', error.stack);
            throw error;
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

        dialogElement.style.position = 'absolute';
        dialogElement.style.bottom = '20%';
        dialogElement.style.left = '50%';
        dialogElement.style.transform = 'translateX(-50%)';
        
        dialogElement.querySelectorAll('.dialog-option').forEach((button, index) => {
            button.addEventListener('click', () => {
                dialogConfig.options[index].action();
            });
        });

        document.body.appendChild(dialogElement);
        this.currentDialog = dialogElement;
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

    // Add a helper method to get components
    getComponent(name) {
        return this.components.get(name);
    }
}




