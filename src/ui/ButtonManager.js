import { UIButton } from './components/UIButton.js';

/**
 * ButtonManager - Manages all UI buttons in the game
 * This class provides a centralized way to create, access, and manage buttons
 */
export class ButtonManager {
    /**
     * Creates a new ButtonManager
     * @param {Object} game - Game instance
     */
    constructor(game) {
        this.game = game;
        this.buttons = {};
        this.buttonGroups = {};
        this.defaultOptions = {
            type: 'html',
            width: 40,
            height: 40,
            color: '#00FFFF',
            borderColor: '#00FFFF',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            activeColor: 'rgba(0, 128, 0, 0.7)',
            hoverColor: 'rgba(0, 40, 80, 0.9)',
            borderRadius: 8,
            fontSize: 16,
            fontFamily: 'Arial, sans-serif',
            zIndex: 1001,
            visible: true,
            active: false
        };
    }

    /**
     * Creates a new button
     * @param {string} id - Button ID
     * @param {Object} options - Button options
     * @returns {UIButton} The created button
     */
    createButton(id, options = {}) {
        // Merge default options with provided options
        const buttonOptions = {
            ...this.defaultOptions,
            ...options,
            id
        };

        // Create the button
        const button = new UIButton(buttonOptions);
        
        // Store the button
        this.buttons[id] = button;
        
        // Add to group if specified
        if (options.group) {
            this.addToGroup(id, options.group);
        }
        
        return button;
    }

    /**
     * Gets a button by ID
     * @param {string} id - Button ID
     * @returns {UIButton|null} The button or null if not found
     */
    getButton(id) {
        return this.buttons[id] || null;
    }

    /**
     * Adds a button to a group
     * @param {string} buttonId - Button ID
     * @param {string} groupId - Group ID
     */
    addToGroup(buttonId, groupId) {
        const button = this.getButton(buttonId);
        if (!button) {
            console.error(`Button ${buttonId} not found`);
            return;
        }

        if (!this.buttonGroups[groupId]) {
            this.buttonGroups[groupId] = [];
        }

        if (!this.buttonGroups[groupId].includes(buttonId)) {
            this.buttonGroups[groupId].push(buttonId);
        }
    }

    /**
     * Gets all buttons in a group
     * @param {string} groupId - Group ID
     * @returns {UIButton[]} Array of buttons in the group
     */
    getButtonsInGroup(groupId) {
        const buttonIds = this.buttonGroups[groupId] || [];
        return buttonIds.map(id => this.getButton(id)).filter(button => button !== null);
    }

    /**
     * Sets the active state of a button
     * @param {string} id - Button ID
     * @param {boolean} active - Whether the button should be active
     */
    setActive(id, active) {
        const button = this.getButton(id);
        if (button) {
            button.setActive(active);
        }
    }

    /**
     * Sets the active state of a button in a group and deactivates all other buttons in the group
     * @param {string} id - Button ID
     * @param {string} groupId - Group ID
     * @param {boolean} active - Whether the button should be active
     */
    setActiveInGroup(id, groupId, active) {
        const buttons = this.getButtonsInGroup(groupId);
        buttons.forEach(button => {
            button.setActive(button.options.id === id ? active : false);
        });
    }

    /**
     * Shows a button
     * @param {string} id - Button ID
     */
    showButton(id) {
        const button = this.getButton(id);
        if (button) {
            button.show();
        }
    }

    /**
     * Hides a button
     * @param {string} id - Button ID
     */
    hideButton(id) {
        const button = this.getButton(id);
        if (button) {
            button.hide();
        }
    }

    /**
     * Shows all buttons in a group
     * @param {string} groupId - Group ID
     */
    showGroup(groupId) {
        const buttons = this.getButtonsInGroup(groupId);
        buttons.forEach(button => button.show());
    }

    /**
     * Hides all buttons in a group
     * @param {string} groupId - Group ID
     */
    hideGroup(groupId) {
        const buttons = this.getButtonsInGroup(groupId);
        buttons.forEach(button => button.hide());
    }

    /**
     * Creates a row of buttons with consistent spacing
     * @param {Object[]} buttonConfigs - Array of button configurations
     * @param {Object} rowOptions - Options for the row
     * @param {string} rowOptions.group - Group ID for the buttons
     * @returns {UIButton[]} Array of created buttons
     */
    createButtonRow(buttonConfigs, rowOptions = {}) {
        const group = rowOptions.group;

        // Get or create the button container
        let container = document.getElementById('main-ui-buttons-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'main-ui-buttons-container';
            container.className = 'ui-buttons-container';
            document.body.appendChild(container);
        }

        const buttons = [];
        buttonConfigs.forEach((config, index) => {
            const buttonId = config.id || `row-button-${index}`;
            const buttonOptions = {
                ...config,
                group
            };

            const button = this.createButton(buttonId, buttonOptions);
            buttons.push(button);

            // Add button element to container
            container.appendChild(button.element);
        });

        return buttons;
    }

    /**
     * Updates all buttons
     * This method should be called in the game's update loop
     */
    update() {
        // Perform any necessary updates for buttons
        // This could include updating positions, visibility, etc.
    }

    /**
     * Destroys all buttons
     */
    destroy() {
        Object.values(this.buttons).forEach(button => button.destroy());
        this.buttons = {};
        this.buttonGroups = {};
    }
}
