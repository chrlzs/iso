import { UIStyles } from '../UIStyles.js';

/**
 * Manages in-game dialog windows for NPC interactions
 * @class DialogUI
 * @extends UIComponent
 */
export class DialogUI {
    /**
     * Creates a new DialogUI instance
     * @param {GameInstance} game - Reference to game instance
     * @param {Object} [options={}] - Dialog configuration options
     * @param {number} [options.width=400] - Width of dialog window
     * @param {number} [options.height=300] - Height of dialog window
     */
    constructor(game, options = {}) {
        this.game = game;
        this.width = options.width || 400;
        this.height = options.height || 300;
        this.isVisible = false;
        this.currentDialog = null;

        this.createDialogWindow();
        this.setupEventListeners();
    }

    /**
     * Shows dialog with specified NPC
     * @param {NPC} npc - The NPC to start dialog with
     * @param {Object} dialogData - Dialog configuration
     * @param {string} dialogData.text - Initial dialog text
     * @param {Array<Object>} dialogData.options - Dialog response options
     * @returns {void}
     */
    show(npc, dialogData) {
        this.currentNPC = npc;
        this.currentDialog = dialogData;
        this.isVisible = true;
        this.container.style.display = 'flex';
        this.updateDialog();
    }

    /**
     * Updates dialog content and options
     * @private
     */
    updateDialog() {
        if (!this.currentDialog) return;

        this.content.innerHTML = `
            <div class="dialog-text">${this.currentDialog.text}</div>
            <div class="dialog-options">
                ${this.currentDialog.options.map((option, index) => `
                    <button class="dialog-option" data-index="${index}">
                        ${option.text}
                    </button>
                `).join('')}
            </div>
        `;
    }

    /**
     * Handles dialog option selection
     * @param {number} optionIndex - Selected option index
     * @private
     */
    handleOptionSelect(optionIndex) {
        const option = this.currentDialog.options[optionIndex];
        if (option && option.action) {
            option.action(this.currentNPC);
        }
    }

    /**
     * Creates the dialog window DOM elements
     * @private
     */
    createDialogWindow() {
        this.container = UIStyles.createModalWindow({
            className: 'dialog-window',
            width: this.width,
            height: this.height,
            title: 'Dialog',
            onClose: () => this.hide()
        });

        this.content = document.createElement('div');
        this.content.className = 'dialog-content';
        this.content.style.cssText = UIStyles.modalContent;
        this.container.appendChild(this.content);

        document.body.appendChild(this.container);
    }

    /**
     * Sets up event listeners for dialog interactions
     * @private
     */
    setupEventListeners() {
        this.container.addEventListener('click', (e) => {
            const optionButton = e.target.closest('.dialog-option');
            if (optionButton) {
                const optionIndex = parseInt(optionButton.dataset.index, 10);
                this.handleOptionSelect(optionIndex);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    /**
     * Hides the dialog window
     * @returns {void}
     */
    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
        this.currentDialog = null;
        this.currentNPC = null;
    }
}