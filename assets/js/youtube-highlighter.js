// YouTube Video Highlighter
(function () {
    class YouTubeHighlighter {
        constructor() {
            this.state = {
                isSelecting: false,
                startTime: null,
                endTime: null,
                video: null
            };

            this.controls = null;
            this.initialized = false;
            this.setupNotificationStyles();
        }

        // In youtube-highlighter.js, update the notification methods:

        setupNotificationStyles() {
            if (!document.getElementById('horizon-notification-styles')) {
                const style = document.createElement('style');
                style.id = 'horizon-notification-styles';
                style.textContent = `
            .horizon-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px;
                background-color: white;
                color: #2C3E50;
                border-radius: 12px;
                z-index: 2147483647;
                font-family: system-ui, -apple-system, sans-serif;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
                opacity: 0;
                transform: translateY(-8px);
                display: flex;
                align-items: center;
                gap: 12px;
                min-width: 300px;
                max-width: 400px;
                border: 1px solid rgba(0, 0, 0, 0.06);
                -webkit-font-smoothing: antialiased;
            }

            @media (prefers-color-scheme: dark) {
                .horizon-notification {
                    background-color: #2A2A2A;
                    color: #E4E4E4;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }
            }

            .horizon-notification.show {
                opacity: 1;
                transform: translateY(0);
            }

            .notification-close {
                background: none;
                border: none;
                padding: 4px;
                cursor: pointer;
                opacity: 0.5;
                color: inherit;
                transition: opacity 0.2s ease;
                position: absolute;
                top: 8px;
                right: 8px;
            }

            .notification-close:hover {
                opacity: 1;
            }

            .notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: rgba(0, 0, 0, 0.06);
                border-radius: 0 0 12px 12px;
                overflow: hidden;
            }

            @media (prefers-color-scheme: dark) {
                .notification-progress {
                    background: rgba(255, 255, 255, 0.1);
                }
            }

            .progress-bar {
                height: 100%;
                width: 100%;
                background: #2196F3;
                transform-origin: left;
            }

            @media (prefers-color-scheme: dark) {
                .progress-bar {
                    background: #4A9EFF;
                }
            }

            @keyframes notificationProgress {
                from { transform: scaleX(1); }
                to { transform: scaleX(0); }
            }
        `;
                document.head.appendChild(style);
            }
        }

        initialize() {
            console.log('Initializing YouTube Highlighter...');

            if (!window.location.href.includes('youtube.com/watch') || this.initialized) {
                console.log('Not a YouTube watch page or already initialized');
                return;
            }

            // Wait for video element to be ready
            const checkForVideo = setInterval(() => {
                this.state.video = document.querySelector('video');
                if (this.state.video) {
                    clearInterval(checkForVideo);
                    console.log('Video element found, completing initialization');
                    this.createControls();
                    this.setupEventListeners();
                    this.initialized = true;
                    this.showNotification('Press [ to start video highlight, ] to end, ESC to cancel');
                }
            }, 1000);

            // Clear interval after 10 seconds to prevent infinite checking
            setTimeout(() => clearInterval(checkForVideo), 10000);
        }

        createControls() {
            this.controls = document.createElement('div');
            this.controls.className = 'horizon-video-controls';
            this.controls.innerHTML = `
                <div class="horizon-timestamp">
                    <span class="horizon-start-time">0:00</span>
                    <span> - </span>
                    <span class="horizon-end-time">0:00</span>
                </div>
                <button class="horizon-save-highlight">Save</button>
                <button class="horizon-cancel">Cancel</button>
            `;

            // Apply styles
            Object.assign(this.controls.style, {
                display: 'none',
                position: 'absolute',
                bottom: '40px',
                right: '10px',
                background: 'rgba(0, 0, 0, 0.8)',
                padding: '8px 12px',
                borderRadius: '4px',
                color: 'white',
                fontSize: '13px',
                zIndex: '1000',
                gap: '8px',
                alignItems: 'center'
            });

            // Style buttons
            this.controls.querySelectorAll('button').forEach(button => {
                Object.assign(button.style, {
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                });
            });

            const saveButton = this.controls.querySelector('.horizon-save-highlight');
            Object.assign(saveButton.style, {
                background: '#2196F3',
                color: 'white'
            });

            const cancelButton = this.controls.querySelector('.horizon-cancel');
            Object.assign(cancelButton.style, {
                background: 'transparent',
                border: '1px solid #999',
                color: '#999'
            });

            const videoContainer = document.querySelector('.html5-video-player');
            if (videoContainer) {
                videoContainer.appendChild(this.controls);
            }
        }

        setupEventListeners() {
            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if (e.key === '[' && this.state.video.currentTime > 0) {
                    this.startHighlight();
                } else if (e.key === ']' && this.state.isSelecting) {
                    this.endHighlight();
                } else if (e.key === 'Escape' && this.state.isSelecting) {
                    this.cancelHighlight();
                }
            });

            // Button click handlers
            if (this.controls) {
                this.controls.querySelector('.horizon-save-highlight').addEventListener('click', () => this.saveHighlight());
                this.controls.querySelector('.horizon-cancel').addEventListener('click', () => this.cancelHighlight());
            }

            // Listen for extension messages
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                if (message.action === 'startVideoHighlight') {
                    this.startHighlight();
                } else if (message.action === 'endVideoHighlight') {
                    this.endHighlight();
                } else if (message.action === 'cancelVideoHighlight') {
                    this.cancelHighlight();
                } else if (message.action === 'seekToTime') {
                    if (this.state.video) {
                        this.state.video.currentTime = message.startTime;
                        this.state.video.play();

                        // Optional: Highlight the video duration
                        const highlightDuration = message.endTime - message.startTime;
                        if (highlightDuration > 0) {
                            setTimeout(() => {
                                this.showNotification('End of highlighted section');
                            }, highlightDuration * 1000);
                        }
                    }
                    sendResponse({ success: true });
                }
                sendResponse({ success: true });
            });
        }

        startHighlight() {
            this.state = {
                ...this.state,
                isSelecting: true,
                startTime: this.state.video.currentTime,
                endTime: null
            };

            this.updateControlsDisplay();
            this.showNotification('Started video highlight. Press ] to end selection.');
        }

        endHighlight() {
            this.state.endTime = this.state.video.currentTime;
            if (this.state.endTime <= this.state.startTime) {
                this.showNotification('End time must be after start time', 'error');
                return;
            }
            this.updateControlsDisplay();
        }

        updateControlsDisplay() {
            if (!this.controls) return;

            const { startTime, endTime, isSelecting } = this.state;

            if (!isSelecting) {
                this.controls.style.display = 'none';
                return;
            }

            this.controls.style.display = 'flex';
            this.controls.querySelector('.horizon-start-time').textContent = this.formatTime(startTime);
            this.controls.querySelector('.horizon-end-time').textContent = endTime ? this.formatTime(endTime) : '--:--';
        }

        cancelHighlight() {
            this.state = {
                ...this.state,
                isSelecting: false,
                startTime: null,
                endTime: null
            };
            this.updateControlsDisplay();
        }

        // Update the saveHighlight method to include better data:
        async saveHighlight() {
            const { startTime, endTime } = this.state;
            if (!startTime || !endTime || startTime >= endTime) {
                this.showNotification('Invalid time selection', 'error');
                return;
            }

            try {
                const videoId = new URLSearchParams(window.location.href.split('?')[1]).get('v');
                const videoTitle = document.querySelector('.ytp-title-link')?.textContent ||
                    document.querySelector('.title.ytd-video-primary-info-renderer')?.textContent ||
                    'Untitled Video';

                const highlightData = {
                    id: this.generateHighlightId(),
                    url: window.location.href,
                    timestamp: Date.now(),
                    type: 'video',
                    title: videoTitle,
                    body: `Video highlight: ${this.formatTime(startTime)} - ${this.formatTime(endTime)}`,
                    videoData: {
                        videoId,
                        title: videoTitle,
                        startTime,
                        endTime,
                        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
                    },
                    theme: 'light',
                    notes: [] // Initialize empty notes array
                };

                const result = await chrome.storage.local.get(['highlights']);
                const highlights = result.highlights || [];
                highlights.push(highlightData);

                await chrome.storage.local.set({ highlights });
                this.showNotification('Video highlight saved!');
                this.cancelHighlight();
            } catch (error) {
                console.error('Error saving highlight:', error);
                this.showNotification('Failed to save highlight', 'error');
            }
        }

        formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }

        generateHighlightId() {
            return `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        showNotification(message, type = 'info', duration = 5000) {
            const notification = document.createElement('div');
            notification.className = 'horizon-notification';

            const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const iconPath = isDarkMode ? 'icon16-dark.png' : 'icon16.png';
            const iconURL = chrome.runtime.getURL(`images/${iconPath}`);

            notification.innerHTML = `
                <img src="${iconURL}" alt="Horizon" style="width: 24px; height: 24px; margin: 4px;">
                <div style="flex: 1;">
                    <div style="font-size: 14px; font-weight: 600; line-height: 1.4;">${message}</div>
                </div>
                <button class="notification-close">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div class="notification-progress">
                    <div class="progress-bar"></div>
                </div>
            `;

            document.body.appendChild(notification);

            // Set up event listeners
            const closeButton = notification.querySelector('.notification-close');
            let timeoutId;
            let isPaused = false;

            const removeNotification = () => {
                notification.classList.remove('show');
                clearTimeout(timeoutId);
                setTimeout(() => notification.remove(), 300);
            };

            closeButton.addEventListener('click', removeNotification);

            // Handle hover pause
            notification.addEventListener('mouseenter', () => {
                isPaused = true;
                const progressBar = notification.querySelector('.progress-bar');
                if (progressBar) {
                    progressBar.style.animationPlayState = 'paused';
                }
            });

            notification.addEventListener('mouseleave', () => {
                isPaused = false;
                const progressBar = notification.querySelector('.progress-bar');
                if (progressBar) {
                    progressBar.style.animationPlayState = 'running';
                }
            });

            // Show notification with animation
            requestAnimationFrame(() => {
                notification.classList.add('show');
                const progressBar = notification.querySelector('.progress-bar');
                progressBar.style.animation = `notificationProgress ${duration}ms linear forwards`;
            });

            // Set up auto-remove
            timeoutId = setTimeout(removeNotification, duration);

            return notification;
        }
    }

    // Initialize the highlighter
    const youtubeHighlighter = new YouTubeHighlighter();

    // Initialize when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => youtubeHighlighter.initialize());
    } else {
        youtubeHighlighter.initialize();
    }

    // Re-initialize when navigating between videos (YouTube is a SPA)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(() => youtubeHighlighter.initialize(), 1000);
        }
    }).observe(document, { subtree: true, childList: true });

})();