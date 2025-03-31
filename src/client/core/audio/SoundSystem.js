/**
 * Manages game audio, sound effects, and music playback
 * @class SoundSystem
 */
export class SoundSystem {
    /**
     * Creates a new SoundSystem instance
     * @param {GameInstance} game - Reference to game instance
     * @param {Object} [options={}] - Sound configuration options
     * @param {number} [options.masterVolume=1] - Master volume multiplier
     * @param {number} [options.musicVolume=0.7] - Music volume multiplier
     * @param {number} [options.sfxVolume=1] - Sound effects volume multiplier
     */
    constructor(game, options = {}) {
        this.game = game;
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.context.createGain();
        this.musicGain = this.context.createGain();
        this.sfxGain = this.context.createGain();
        
        // Connect gain nodes
        this.musicGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        this.masterGain.connect(this.context.destination);

        // Initialize volumes
        this.setMasterVolume(options.masterVolume ?? 1);
        this.setMusicVolume(options.musicVolume ?? 0.7);
        this.setSFXVolume(options.sfxVolume ?? 1);

        // Track loaded sounds
        this.sounds = new Map();
        this.music = new Map();
        this.currentMusic = null;
    }

    /**
     * Loads a sound effect
     * @async
     * @param {string} id - Sound identifier
     * @param {string} url - Sound file URL
     * @returns {Promise<AudioBuffer>} Loaded sound buffer
     */
    async loadSound(id, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
            this.sounds.set(id, audioBuffer);
            return audioBuffer;
        } catch (error) {
            console.error(`Failed to load sound ${id}:`, error);
            throw error;
        }
    }

    /**
     * Plays a sound effect
     * @param {string} id - Sound identifier
     * @param {Object} [options={}] - Playback options
     * @param {number} [options.volume=1] - Individual sound volume
     * @param {boolean} [options.loop=false] - Whether to loop the sound
     * @returns {AudioBufferSourceNode} The sound source node
     */
    playSound(id, options = {}) {
        const buffer = this.sounds.get(id);
        if (!buffer) {
            console.warn(`Sound ${id} not found`);
            return null;
        }

        const source = this.context.createBufferSource();
        source.buffer = buffer;
        source.loop = options.loop ?? false;

        // Create individual gain for this sound
        const gainNode = this.context.createGain();
        gainNode.gain.value = options.volume ?? 1;
        
        source.connect(gainNode);
        gainNode.connect(this.sfxGain);
        source.start(0);

        return source;
    }

    /**
     * Sets master volume
     * @param {number} level - Volume level (0-1)
     */
    setMasterVolume(level) {
        this.masterGain.gain.value = Math.max(0, Math.min(1, level));
    }

    /**
     * Sets music volume
     * @param {number} level - Volume level (0-1)
     */
    setMusicVolume(level) {
        this.musicGain.gain.value = Math.max(0, Math.min(1, level));
    }

    /**
     * Sets sound effects volume
     * @param {number} level - Volume level (0-1)
     */
    setSFXVolume(level) {
        this.sfxGain.gain.value = Math.max(0, Math.min(1, level));
    }

    /**
     * Plays background music
     * @param {string} id - Music track identifier
     * @param {Object} [options={}] - Playback options
     */
    playMusic(id, options = {}) {
        if (this.currentMusic) {
            this.stopMusic();
        }

        const music = this.music.get(id);
        if (!music) {
            console.warn(`Music track ${id} not found`);
            return;
        }

        const source = this.context.createBufferSource();
        source.buffer = music;
        source.loop = true;
        source.connect(this.musicGain);
        source.start(0);

        this.currentMusic = source;
    }

    /**
     * Stops current background music
     */
    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic = null;
        }
    }

    /**
     * Pauses all audio playback
     */
    pause() {
        this.context.suspend();
    }

    /**
     * Resumes audio playback
     */
    resume() {
        this.context.resume();
    }
}
