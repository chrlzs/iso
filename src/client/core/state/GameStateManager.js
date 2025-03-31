/**
 * Manages game states and state transitions
 * @class GameStateManager
 */
export class GameStateManager {
    /**
     * Creates a new GameStateManager instance
     * @param {GameInstance} game - Reference to game instance
     */
    constructor(game) {
        this.game = game;
        this.states = new Map();
        this.currentState = null;
        this.previousState = null;

        this.registerDefaultStates();
    }

    /**
     * Registers default game states
     * @private
     */
    registerDefaultStates() {
        this.registerState('loading', {
            enter: () => {
                console.log('Entering loading state');
                this.game.uiManager.showWindow('loadingScreen');
            },
            exit: () => {
                this.game.uiManager.hideWindow('loadingScreen');
            },
            update: (deltaTime) => {
                // Check loading progress
                if (this.game.assetsLoaded) {
                    this.transition('playing');
                }
            }
        });

        this.registerState('playing', {
            enter: () => {
                console.log('Entering playing state');
                this.game.start();
            },
            exit: () => {
                this.game.stop();
            },
            update: (deltaTime) => {
                this.game.update(deltaTime);
            }
        });

        this.registerState('paused', {
            enter: () => {
                console.log('Game paused');
                this.game.uiManager.showWindow('pauseMenu');
            },
            exit: () => {
                this.game.uiManager.hideWindow('pauseMenu');
            },
            update: () => {
                // Minimal updates while paused
            }
        });
    }

    /**
     * Registers a new game state
     * @param {string} name - State identifier
     * @param {Object} state - State configuration
     * @param {Function} state.enter - Called when entering state
     * @param {Function} state.exit - Called when exiting state
     * @param {Function} state.update - Called during state update
     */
    registerState(name, state) {
        this.states.set(name, state);
    }

    /**
     * Transitions to a new state
     * @param {string} newState - State to transition to
     * @returns {boolean} True if transition was successful
     */
    transition(newState) {
        const nextState = this.states.get(newState);
        if (!nextState) {
            console.error(`Invalid state: ${newState}`);
            return false;
        }

        if (this.currentState) {
            this.states.get(this.currentState).exit?.();
            this.previousState = this.currentState;
        }

        this.currentState = newState;
        nextState.enter?.();
        return true;
    }

    /**
     * Updates current state
     * @param {number} deltaTime - Time elapsed since last update
     */
    update(deltaTime) {
        const state = this.states.get(this.currentState);
        if (state?.update) {
            state.update(deltaTime);
        }
    }

    /**
     * Returns to previous state
     * @returns {boolean} True if successful
     */
    returnToPrevious() {
        if (this.previousState) {
            return this.transition(this.previousState);
        }
        return false;
    }
}
