/**
 * UI component for running performance tests
 */
import PerformanceTest from '../../utils/PerformanceTest.js';

class PerformanceTestUI {
    /**
     * Creates a new performance test UI
     * @param {Object} gameInstance - Game instance to test
     */
    constructor(gameInstance) {
        this.gameInstance = gameInstance;
        this.performanceTest = new PerformanceTest(gameInstance);
        this.container = null;
        this.isVisible = false;
        this.testDuration = 30; // Default test duration in seconds
    }
    
    /**
     * Initializes the UI
     */
    init() {
        // Create container
        this.container = document.createElement('div');
        this.container.className = 'performance-test-ui';
        this.container.style.position = 'fixed';
        this.container.style.top = '10px';
        this.container.style.right = '10px';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.container.style.color = 'white';
        this.container.style.padding = '10px';
        this.container.style.borderRadius = '5px';
        this.container.style.zIndex = '1000';
        this.container.style.display = 'none';
        
        // Create content
        this.container.innerHTML = `
            <h3 style="margin: 0 0 10px 0;">Performance Test</h3>
            <div style="margin-bottom: 10px;">
                <label for="test-duration">Duration (seconds):</label>
                <input type="number" id="test-duration" value="${this.testDuration}" min="5" max="300" style="width: 60px;">
            </div>
            <button id="start-test" style="margin-right: 5px;">Start Test</button>
            <button id="cancel-test" disabled>Cancel</button>
            <div id="test-status" style="margin-top: 10px; font-size: 12px;"></div>
        `;
        
        // Add to document
        document.body.appendChild(this.container);
        
        // Add event listeners
        const durationInput = document.getElementById('test-duration');
        const startButton = document.getElementById('start-test');
        const cancelButton = document.getElementById('cancel-test');
        const statusDiv = document.getElementById('test-status');
        
        durationInput.addEventListener('change', (e) => {
            this.testDuration = parseInt(e.target.value, 10);
        });
        
        startButton.addEventListener('click', async () => {
            startButton.disabled = true;
            cancelButton.disabled = false;
            statusDiv.textContent = `Running test for ${this.testDuration} seconds...`;
            
            try {
                const profileData = await this.performanceTest.runFor(this.testDuration);
                
                // Update status with results
                statusDiv.innerHTML = `
                    Test complete!<br>
                    Average FPS: ${profileData.fps.average.toFixed(2)}<br>
                    Min FPS: ${profileData.fps.min.toFixed(2)}<br>
                    Max FPS: ${profileData.fps.max.toFixed(2)}<br>
                    FPS Stability: ${profileData.fps.stdDev.toFixed(2)}<br>
                    ${profileData.memory ? `Memory Growth: ${profileData.memory.growthMB.toFixed(2)} MB` : ''}
                `;
            } catch (error) {
                statusDiv.textContent = `Error: ${error.message}`;
            } finally {
                startButton.disabled = false;
                cancelButton.disabled = true;
            }
        });
        
        cancelButton.addEventListener('click', () => {
            this.performanceTest.cancel();
            startButton.disabled = false;
            cancelButton.disabled = true;
            statusDiv.textContent = 'Test cancelled.';
        });
        
        // Add keyboard shortcut (Ctrl+Shift+P)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                this.toggle();
            }
        });
    }
    
    /**
     * Shows the UI
     */
    show() {
        if (!this.container) {
            this.init();
        }
        
        this.container.style.display = 'block';
        this.isVisible = true;
    }
    
    /**
     * Hides the UI
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
        
        this.isVisible = false;
    }
    
    /**
     * Toggles the UI visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}

export default PerformanceTestUI;
