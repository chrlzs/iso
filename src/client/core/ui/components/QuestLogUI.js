/**
 * Manages and displays quest information and progress
 * @class QuestLogUI
 * @extends UIComponent
 */
export class QuestLogUI {
    /**
     * Creates a new QuestLogUI instance
     * @param {GameInstance} game - Reference to game instance
     * @param {Object} [options={}] - Configuration options
     * @param {number} [options.width=400] - Width of quest log window
     * @param {number} [options.height=600] - Height of quest log window
     */
    constructor(game, options = {}) {
        this.game = game;
        this.width = options.width || 400;
        this.height = options.height || 600;
        this.isVisible = false;
        this.quests = [];

        this.createQuestLog();
        this.setupEventListeners();
    }

    /**
     * Creates the quest log window
     * @private
     */
    createQuestLog() {
        this.container = document.createElement('div');
        this.container.className = 'quest-log';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${this.width}px;
            height: ${this.height}px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #fff;
            border-radius: 8px;
            display: none;
            flex-direction: column;
            padding: 20px;
            z-index: 1000;
        `;

        this.title = document.createElement('h2');
        this.title.textContent = 'Quest Log';
        this.title.style.cssText = `
            color: #fff;
            text-align: center;
            margin-bottom: 20px;
        `;
        this.container.appendChild(this.title);

        this.questList = document.createElement('div');
        this.questList.className = 'quest-list';
        this.questList.style.cssText = `
            flex: 1;
            overflow-y: auto;
            color: #fff;
        `;
        this.container.appendChild(this.questList);

        document.body.appendChild(this.container);
    }

    /**
     * Sets up event listeners for quest log interactions
     * @private
     */
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    /**
     * Updates quest progress indicators
     * @param {Object} quest - Quest data to update
     * @returns {void}
     */
    updateQuestProgress(quest) {
        const questElement = this.questList.querySelector(`[data-id="${quest.id}"]`);
        if (!questElement) return;

        const progressElement = questElement.querySelector('.quest-progress');
        if (progressElement) {
            progressElement.textContent = `Progress: ${quest.progress}/${quest.total}`;
        }
    }

    /**
     * Adds a new quest to the log
     * @param {Object} questData - Quest configuration
     * @param {string} questData.id - Quest identifier
     * @param {string} questData.title - Quest title
     * @param {string} questData.description - Quest description
     * @param {Object[]} questData.objectives - Quest objectives
     * @returns {void}
     */
    addQuest(questData) {
        this.quests.push(questData);

        const questElement = document.createElement('div');
        questElement.className = 'quest-item';
        questElement.dataset.id = questData.id;
        questElement.style.cssText = `
            margin-bottom: 15px;
            padding: 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
        `;

        const title = document.createElement('h3');
        title.textContent = questData.title;
        title.style.cssText = `
            margin: 0;
            color: #00f2ff;
        `;
        questElement.appendChild(title);

        const description = document.createElement('p');
        description.textContent = questData.description;
        description.style.cssText = `
            margin: 5px 0;
            color: #fff;
        `;
        questElement.appendChild(description);

        const progress = document.createElement('p');
        progress.className = 'quest-progress';
        progress.textContent = `Progress: ${questData.progress || 0}/${questData.total || 0}`;
        progress.style.cssText = `
            margin: 5px 0;
            color: #fff;
        `;
        questElement.appendChild(progress);

        this.questList.appendChild(questElement);
    }

    /**
     * Shows the quest log
     * @returns {void}
     */
    show() {
        this.isVisible = true;
        this.container.style.display = 'flex';
    }

    /**
     * Hides the quest log
     * @returns {void}
     */
    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
    }
}