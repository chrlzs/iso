import { StatusBar } from './components/StatusBar.js';
import { Minimap } from './components/Minimap.js';
import { MessageLog } from './components/MessageLog.js';
import { MainMenu } from './components/MainMenu.js';

export class UIManager {
    constructor(game) {
        this.game = game;
        this.components = new Map();
        this.currentDialog = null;
        
        // Initialize UI components
        this.initializeComponents();
        
        // Handle UI events
        this.setupEventListeners();
    }

    initializeComponents() {
        // Core UI components
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
    }

    setupEventListeners() {
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
    }

    update(deltaTime) {
        this.components.forEach(component => {
            if (component && typeof component.update === 'function') {
                component.update(deltaTime);
            }
        });
    }

    render(ctx) {
        ctx.save();
        // Reset transform for UI rendering in screen space
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        this.components.forEach(component => {
            if (component && typeof component.render === 'function') {
                component.render(ctx);
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
}






