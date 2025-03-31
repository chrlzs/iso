/**
 * Manages game settings and configuration interface
 * @class SettingsUI
 * @extends UIComponent
 */
export class SettingsUI {
    /**
     * Creates a new SettingsUI instance
     * @param {GameInstance} game - Reference to game instance
     * @param {Object} [options={}] - Configuration options
     * @param {number} [options.width=500] - Width of settings window
     * @param {number} [options.height=400] - Height of settings window
     */
    constructor(game, options = {}) {
        this.game = game;
        this.width = options.width || 500;
        this.height = options.height || 400;
        this.isVisible = false;

        this.createSettingsWindow();
        this.setupEventListeners();
    }

    /**
     * Creates the settings window DOM elements
     * @private
     */
    createSettingsWindow() {
        this.container = document.createElement('div');
        this.container.className = 'settings-window';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${this.width}px;
            height: ${this.height}px;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #00f2ff;
            border-radius: 8px;
            padding: 20px;
            display: none;
            z-index: 1000;
        `;

        this.createSettingsSections();
        document.body.appendChild(this.container);
    }

    /**
     * Creates individual settings sections
     * @private
     */
    createSettingsSections() {
        const sections = [
            {
                title: 'Graphics',
                settings: [
                    { type: 'checkbox', id: 'showFPS', label: 'Show FPS' },
                    { type: 'range', id: 'brightness', label: 'Brightness', min: 0, max: 100 },
                    { type: 'checkbox', id: 'shadows', label: 'Enable Shadows' }
                ]
            },
            {
                title: 'Audio',
                settings: [
                    { type: 'range', id: 'masterVolume', label: 'Master Volume', min: 0, max: 100 },
                    { type: 'range', id: 'musicVolume', label: 'Music Volume', min: 0, max: 100 },
                    { type: 'range', id: 'sfxVolume', label: 'Effects Volume', min: 0, max: 100 }
                ]
            },
            {
                title: 'Controls',
                settings: [
                    { type: 'checkbox', id: 'invertY', label: 'Invert Y-Axis' },
                    { type: 'range', id: 'mouseSensitivity', label: 'Mouse Sensitivity', min: 1, max: 10 }
                ]
            }
        ];

        sections.forEach(section => {
            const sectionElement = this.createSection(section);
            this.container.appendChild(sectionElement);
        });

        // Add save and cancel buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
        `;

        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        saveButton.onclick = () => this.saveSettings();

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.onclick = () => this.hide();

        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(saveButton);
        this.container.appendChild(buttonContainer);
    }

    /**
     * Creates a settings section
     * @param {Object} section - Section configuration
     * @returns {HTMLElement} The created section element
     * @private
     */
    createSection(section) {
        const sectionElement = document.createElement('div');
        sectionElement.className = 'settings-section';
        
        const title = document.createElement('h3');
        title.textContent = section.title;
        sectionElement.appendChild(title);

        section.settings.forEach(setting => {
            const settingElement = this.createSettingElement(setting);
            sectionElement.appendChild(settingElement);
        });

        return sectionElement;
    }

    /**
     * Creates a setting input element
     * @param {Object} setting - Setting configuration
     * @returns {HTMLElement} The created setting element
     * @private
     */
    createSettingElement(setting) {
        const container = document.createElement('div');
        container.className = 'setting-item';
        
        const label = document.createElement('label');
        label.textContent = setting.label;
        container.appendChild(label);

        const input = document.createElement('input');
        input.type = setting.type;
        input.id = setting.id;
        
        if (setting.type === 'range') {
            input.min = setting.min;
            input.max = setting.max;
            input.value = this.getSavedSetting(setting.id, setting.min);
        } else if (setting.type === 'checkbox') {
            input.checked = this.getSavedSetting(setting.id, false);
        }

        container.appendChild(input);
        return container;
    }

    /**
     * Gets a saved setting value
     * @param {string} key - Setting key
     * @param {*} defaultValue - Default value if setting not found
     * @returns {*} Setting value
     * @private
     */
    getSavedSetting(key, defaultValue) {
        const settings = JSON.parse(localStorage.getItem('gameSettings') || '{}');
        return settings[key] ?? defaultValue;
    }

    /**
     * Saves current settings
     * @private
     */
    saveSettings() {
        const settings = {};
        this.container.querySelectorAll('input').forEach(input => {
            settings[input.id] = input.type === 'checkbox' ? input.checked : input.value;
        });
        localStorage.setItem('gameSettings', JSON.stringify(settings));
        this.hide();
        this.game.applySettings(settings);
    }

    /**
     * Shows the settings window
     * @returns {void}
     */
    show() {
        this.isVisible = true;
        this.container.style.display = 'block';
    }

    /**
     * Hides the settings window
     * @returns {void}
     */
    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
    }
}
