import { InventoryUI } from './components/InventoryUI.js';
import { MessageLog } from './components/MessageLog.js';
import { MerchantUI } from './components/MerchantUI.js';
import { DialogUI } from './components/DialogUI.js';
import { StatusUI } from './components/StatusUI.js';
import { QuestLogUI } from './components/QuestLogUI.js';
import { SettingsUI } from './components/SettingsUI.js';
import { NotificationSystem } from './components/NotificationSystem.js';
import { CanvasUI } from './components/CanvasUI.js';
import { HUD } from './components/HUD.js';

/**
 * @typedef {Object} UIComponent
 * @property {Function} show - Shows the component
 * @property {Function} hide - Hides the component
 * @property {Function} update - Updates component state
 * @property {Function} render - Renders the component
 * @property {HTMLElement} [container] - Component's DOM container
 * @property {Object} [position] - Component position
 */

/**
 * @typedef {Object} DialogConfig
 * @property {string} npcName - Name of speaking NPC
 * @property {string} text - Dialog text content
 * @property {Array<DialogOption>} options - Available dialog options
 */

/**
 * @typedef {Object} DialogOption
 * @property {string} text - Option text
 * @property {Function} action - Option callback function
 */

/**
 * Manages all UI components and their interactions
 * @class UIManager
 * @property {GameInstance} game - Reference to main game instance
 * @property {Map<string, UIComponent>} components - Map of UI components
 * @property {Set<string>} activeWindows - Currently active window IDs
 * @property {Set<string>} canvasComponents - Canvas-based UI components
 */
export class UIManager {
    /**
     * Creates a new UIManager instance
     * @param {GameInstance} game - Reference to the main game instance
     */
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
            
            // Initialize core UI components
            this.components.set('messageLog', new MessageLog({
                position: { x: 10, y: window.innerHeight - 110 },
                width: 300,
                height: 100,
                game: this.game
            }));
            
            this.components.set('inventoryUI', new InventoryUI(this.game));
            this.components.set('merchantUI', new MerchantUI({ game: this.game }));
            this.components.set('dialogUI', new DialogUI(this.game));
            this.components.set('statusUI', new StatusUI(this.game));
            this.components.set('questLogUI', new QuestLogUI(this.game));
            this.components.set('settingsUI', new SettingsUI(this.game));
            this.components.set('notificationSystem', new NotificationSystem(this.game));
            
            // Initialize canvas-based UI components
            this.components.set('canvasUI', new CanvasUI(this.game));
            this.components.set('hud', new HUD(this.game));
            
            // Hide window-based UIs initially
            ['inventoryUI', 'merchantUI', 'dialogUI', 'questLogUI', 'settingsUI'].forEach(ui => {
                const component = this.components.get(ui);
                if (component?.hide) component.hide();
            });
            
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

    /**
     * Updates all active UI components
     * @param {number} deltaTime - Time elapsed since last update
     * @returns {void}
     */
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

    /**
     * Renders all visible UI components
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     * @returns {void}
     */
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

    /**
     * Shows a dialog window with the given configuration
     * @param {DialogConfig} dialogConfig - Dialog configuration
     * @returns {void}
     */
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

    /**
     * Gets a UI component by name
     * @param {string} name - Component identifier
     * @returns {UIComponent|null} The UI component or null if not found
     */
    getComponent(name) {
        return this.components.get(name);
    }
}




