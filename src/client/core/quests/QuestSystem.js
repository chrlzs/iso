/**
 * Manages quest tracking, progression, and rewards
 * @class QuestSystem
 */
export class QuestSystem {
    /**
     * Creates a new QuestSystem instance
     * @param {GameInstance} game - Reference to game instance
     * @param {Object} [options={}] - Configuration options
     */
    constructor(game, options = {}) {
        this.game = game;
        this.activeQuests = new Map();
        this.completedQuests = new Set();
        this.questLog = this.game.uiManager.getComponent('questLogUI');
    }

    /**
     * Starts a new quest
     * @param {Object} questData - Quest configuration
     * @param {string} questData.id - Unique quest identifier
     * @param {string} questData.title - Quest title
     * @param {string} questData.description - Quest description
     * @param {Object[]} questData.objectives - Quest objectives
     * @param {Object} questData.rewards - Quest completion rewards
     * @returns {boolean} True if quest was started successfully
     */
    startQuest(questData) {
        if (this.activeQuests.has(questData.id) || this.completedQuests.has(questData.id)) {
            return false;
        }

        const quest = {
            ...questData,
            progress: 0,
            completed: false,
            started: Date.now()
        };

        this.activeQuests.set(questData.id, quest);
        this.questLog?.addQuest(quest);

        // Notify player
        this.game.notificationSystem?.show({
            message: `New quest started: ${quest.title}`,
            type: 'info'
        });

        return true;
    }

    /**
     * Updates quest progress
     * @param {string} questId - Quest identifier
     * @param {number} progress - Progress to add
     * @returns {boolean} True if update was successful
     */
    updateQuestProgress(questId, progress) {
        const quest = this.activeQuests.get(questId);
        if (!quest) return false;

        quest.progress = Math.min(quest.objectives.total, quest.progress + progress);
        this.questLog?.updateQuestProgress(quest);

        // Check for completion
        if (quest.progress >= quest.objectives.total) {
            this.completeQuest(questId);
        }

        return true;
    }

    /**
     * Completes a quest and awards rewards
     * @param {string} questId - Quest identifier
     * @returns {boolean} True if quest was completed successfully
     */
    completeQuest(questId) {
        const quest = this.activeQuests.get(questId);
        if (!quest || quest.completed) return false;

        quest.completed = true;
        quest.completedDate = Date.now();

        // Award rewards
        if (quest.rewards) {
            this.awardQuestRewards(quest.rewards);
        }

        // Move to completed quests
        this.activeQuests.delete(questId);
        this.completedQuests.add(questId);

        // Notify player
        this.game.notificationSystem?.show({
            message: `Quest completed: ${quest.title}`,
            type: 'success'
        });

        return true;
    }

    /**
     * Awards quest rewards to player
     * @param {Object} rewards - Reward configuration
     * @private
     */
    awardQuestRewards(rewards) {
        if (rewards.eth) {
            this.game.player.inventory.eth += rewards.eth;
        }

        if (rewards.items) {
            rewards.items.forEach(item => {
                this.game.player.inventory.addItem(item);
            });
        }

        if (rewards.experience) {
            this.game.player.addExperience?.(rewards.experience);
        }
    }
}
