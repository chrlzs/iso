import { PIXI } from '../utils/PixiWrapper.js';

/**
 * DayNightCycle - Manages the day/night cycle in the game
 */
export class DayNightCycle {
    /**
     * Creates a new day/night cycle
     * @param {Object} options - Cycle options
     * @param {number} options.dayDuration - Duration of a full day in seconds (default: 600)
     * @param {number} options.startTime - Starting time of day in hours (0-24, default: 12)
     * @param {number} options.timeScale - Time scale multiplier (default: 1)
     */
    constructor(options = {}) {
        // Cycle properties
        this.dayDuration = options.dayDuration || 600; // 10 minutes per day by default
        this.timeScale = options.timeScale || 1;
        this.paused = false;

        // Time tracking
        this.time = (options.startTime || 12) * 3600; // Convert hours to seconds
        this.day = 1;

        // Lighting properties
        this.ambientLight = { r: 1, g: 1, b: 1 };
        this.sunColor = { r: 1, g: 0.9, b: 0.7 };
        this.moonColor = { r: 0.6, g: 0.6, b: 1 };

        // Overlay for day/night effect
        this.overlay = null;

        // Event callbacks
        this.onTimeChange = null;
        this.onDayChange = null;
        this.onSunrise = null;
        this.onSunset = null;
        this.onMidnight = null;
        this.onNoon = null;

        // Time thresholds for events (in hours)
        this.sunriseTime = 6;  // 6 AM
        this.sunsetTime = 18;  // 6 PM
        this.noonTime = 12;    // 12 PM
        this.midnightTime = 0; // 12 AM

        // Event tracking
        this.lastHour = this.getHours();
        this.lastDay = this.day;

        // Initialize lighting
        this.updateLighting();
    }

    /**
     * Creates an overlay for the day/night effect
     * @param {PIXI.Container} container - Container to add the overlay to
     * @param {number} width - Overlay width
     * @param {number} height - Overlay height
     */
    createOverlay(container, width, height) {
        if (!container) return;

        // Create overlay graphics
        this.overlay = new PIXI.Graphics();
        this.overlay.beginFill(0x000000);
        this.overlay.drawRect(0, 0, width, height);
        this.overlay.endFill();
        this.overlay.alpha = 0;

        // Add to container (on top)
        container.addChild(this.overlay);

        // Update lighting
        this.updateLighting();
    }

    /**
     * Updates the day/night cycle
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (this.paused) return;

        // Update time
        const prevTime = this.time;
        this.time += deltaTime * this.timeScale;

        // Wrap time to keep it within a day
        if (this.time >= 86400) { // 24 hours * 60 minutes * 60 seconds
            this.time -= 86400;
            this.day++;
        }

        // Check for day change
        if (this.day !== this.lastDay) {
            if (this.onDayChange) {
                this.onDayChange(this.day, this.lastDay);
            }
            this.lastDay = this.day;
        }

        // Get current hour
        const currentHour = this.getHours();

        // Check for hour change
        if (Math.floor(currentHour) !== Math.floor(this.lastHour)) {
            // Hour changed
            if (this.onTimeChange) {
                this.onTimeChange(currentHour, this.getMinutes());
            }

            // Check for specific times
            const hourInt = Math.floor(currentHour);

            if (hourInt === this.sunriseTime && this.onSunrise) {
                this.onSunrise();
            } else if (hourInt === this.sunsetTime && this.onSunset) {
                this.onSunset();
            } else if (hourInt === this.noonTime && this.onNoon) {
                this.onNoon();
            } else if (hourInt === this.midnightTime && this.onMidnight) {
                this.onMidnight();
            }

            this.lastHour = currentHour;
        }

        // Update lighting if time changed significantly
        if (Math.abs(this.time - prevTime) > 1) {
            this.updateLighting();
        }
    }

    /**
     * Updates the lighting based on the current time
     */
    updateLighting() {
        // Calculate time of day factor (0 = midnight, 0.5 = noon, 1 = midnight)
        const timeOfDay = this.time / 86400;

        // Calculate sun position (0 = horizon, 1 = zenith, -1 = nadir)
        const sunPosition = Math.sin((timeOfDay * 2 - 0.5) * Math.PI);

        // Calculate ambient light intensity
        let ambientIntensity;

        if (sunPosition > 0) {
            // Day time
            ambientIntensity = 0.8 + sunPosition * 0.2;

            // Sunrise/sunset tint
            const sunriseSunsetFactor = Math.pow(1 - Math.min(1, Math.abs(sunPosition) * 5), 2);

            this.ambientLight.r = Math.min(1, ambientIntensity + sunriseSunsetFactor * 0.2);
            this.ambientLight.g = Math.min(1, ambientIntensity + sunriseSunsetFactor * 0.1);
            this.ambientLight.b = Math.min(1, ambientIntensity - sunriseSunsetFactor * 0.1);
        } else {
            // Night time
            ambientIntensity = 0.2 + Math.abs(sunPosition) * 0.1;

            this.ambientLight.r = ambientIntensity * 0.6;
            this.ambientLight.g = ambientIntensity * 0.6;
            this.ambientLight.b = ambientIntensity * 1;
        }

        // Update overlay if available
        if (this.overlay) {
            // Calculate darkness (0 = full daylight, 1 = full night)
            const darkness = Math.max(0, Math.min(0.7, 0.7 - sunPosition * 0.7));

            // Set overlay alpha and color
            this.overlay.alpha = darkness;

            // Tint overlay based on time of day
            if (sunPosition > 0) {
                // Day to sunset
                const sunsetFactor = Math.pow(1 - Math.min(1, sunPosition * 5), 2);
                const tint = PIXI.utils.rgb2hex([
                    1,
                    0.8 + sunsetFactor * 0.1,
                    0.6 + sunsetFactor * 0.2
                ]);
                this.overlay.tint = tint;
            } else {
                // Night
                const nightFactor = Math.abs(sunPosition);
                const tint = PIXI.utils.rgb2hex([
                    0.6 - nightFactor * 0.2,
                    0.6 - nightFactor * 0.2,
                    0.8
                ]);
                this.overlay.tint = tint;
            }
        }
    }

    /**
     * Resizes the overlay
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resizeOverlay(width, height) {
        if (!this.overlay) return;

        this.overlay.clear();
        this.overlay.beginFill(0x000000);
        this.overlay.drawRect(0, 0, width, height);
        this.overlay.endFill();
    }

    /**
     * Gets the current hour (0-24)
     * @returns {number} Current hour
     */
    getHours() {
        return (this.time / 3600) % 24;
    }

    /**
     * Gets the current minute (0-59)
     * @returns {number} Current minute
     */
    getMinutes() {
        return Math.floor((this.time % 3600) / 60);
    }

    /**
     * Gets the current second (0-59)
     * @returns {number} Current second
     */
    getSeconds() {
        return Math.floor(this.time % 60);
    }

    /**
     * Gets the formatted time string (HH:MM)
     * @returns {string} Formatted time
     */
    getTimeString() {
        const hours = Math.floor(this.getHours());
        const minutes = Math.floor(this.getMinutes());

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    /**
     * Gets the time of day description
     * @returns {string} Time of day description
     */
    getTimeOfDayName() {
        const hours = this.getHours();

        if (hours >= 5 && hours < 8) return 'Dawn';
        if (hours >= 8 && hours < 12) return 'Morning';
        if (hours >= 12 && hours < 14) return 'Noon';
        if (hours >= 14 && hours < 17) return 'Afternoon';
        if (hours >= 17 && hours < 20) return 'Evening';
        if (hours >= 20 && hours < 22) return 'Dusk';
        return 'Night';
    }

    /**
     * Checks if it's currently daytime
     * @returns {boolean} Whether it's daytime
     */
    isDaytime() {
        const hours = this.getHours();
        return hours >= this.sunriseTime && hours < this.sunsetTime;
    }

    /**
     * Checks if it's currently nighttime
     * @returns {boolean} Whether it's nighttime
     */
    isNighttime() {
        return !this.isDaytime();
    }

    /**
     * Sets the time of day
     * @param {number} hours - Hours (0-24)
     * @param {number} minutes - Minutes (0-59)
     * @param {number} seconds - Seconds (0-59)
     */
    setTime(hours, minutes = 0, seconds = 0) {
        this.time = (hours * 3600) + (minutes * 60) + seconds;

        // Update lighting
        this.updateLighting();

        // Update last hour
        this.lastHour = this.getHours();
    }

    /**
     * Sets the day
     * @param {number} day - Day number
     */
    setDay(day) {
        this.day = Math.max(1, day);
        this.lastDay = this.day;
    }

    /**
     * Sets the time scale
     * @param {number} scale - Time scale multiplier
     */
    setTimeScale(scale) {
        this.timeScale = Math.max(0, scale);
    }

    /**
     * Pauses the day/night cycle
     */
    pause() {
        this.paused = true;
    }

    /**
     * Resumes the day/night cycle
     */
    resume() {
        this.paused = false;
    }

    /**
     * Toggles the day/night cycle pause state
     * @returns {boolean} New pause state
     */
    togglePause() {
        this.paused = !this.paused;
        return this.paused;
    }

    /**
     * Gets the ambient light color
     * @returns {Object} RGB color object
     */
    getAmbientLight() {
        return { ...this.ambientLight };
    }

    /**
     * Gets the ambient light color as a hex value
     * @returns {number} Hex color
     */
    getAmbientLightHex() {
        return PIXI.utils.rgb2hex([
            this.ambientLight.r,
            this.ambientLight.g,
            this.ambientLight.b
        ]);
    }
}
