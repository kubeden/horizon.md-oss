// src/services/HighlightService.js

export class HighlightService {
    constructor(storageService, config = {}) {
        this.counter = 0;
        this.storageService = storageService;
        this.config = {
            cleanupInterval: config.cleanupInterval || 5 * 60 * 1000, // 5 minutes
            maxAge: config.maxAge || 5 * 60 * 1000, // 5 minutes
            autoCleanup: config.autoCleanup !== false // true by default
        };

        if (this.config.autoCleanup) {
            this.initializeCleanup();
        }
    }

    generateHighlightId() {
        return `highlight-${Date.now()}-${this.counter++}`;
    }

    async saveHighlight(highlightData) {
        console.log('Saving highlight:', highlightData);

        try {
            const settings = await chrome.storage.local.get([
                'defaultHighlightStyle',
                'defaultHighlightTheme'
            ]);

            const enrichedHighlightData = {
                ...highlightData,
                style: settings.defaultHighlightStyle || 'underline',
                theme: settings.defaultHighlightTheme || 'light'
            };

            const highlights = await this.storageService.get('highlights') || [];
            highlights.push(enrichedHighlightData);

            await this.storageService.set('highlights', highlights);

            // Notify extension about the update
            await this._sendRuntimeMessage({
                action: "highlightsUpdated",
                highlights
            });

            await this._sendRuntimeMessage({
                action: "openSidebar"
            });

            return highlightData;
        } catch (error) {
            console.error('Error saving highlight:', error);
            throw error;
        }
    }

    async updateHighlight(highlightId, updates) {
        try {
            const highlights = await this.storageService.get('highlights') || [];
            const highlightIndex = highlights.findIndex(h => h.id === highlightId);

            if (highlightIndex === -1) return false;

            const highlight = highlights[highlightIndex];
            highlights[highlightIndex] = {
                ...highlight,
                ...updates,
                updated_at: new Date().toISOString()
            };

            await this.storageService.set('highlights', highlights);

            await this._sendRuntimeMessage({
                action: "highlightsUpdated",
                highlights
            });

            return true;
        } catch (error) {
            console.error('Error updating highlight:', error);
            return false;
        }
    }

    async deleteHighlight(highlightId) {
        try {
            const highlights = await this.storageService.get('highlights') || [];
            const updatedHighlights = highlights.filter(h => h.id !== highlightId);

            await this.storageService.set('highlights', updatedHighlights);

            await this._sendRuntimeMessage({
                action: "highlightsUpdated",
                highlights: updatedHighlights
            });

            return true;
        } catch (error) {
            console.error('Error deleting highlight:', error);
            return false;
        }
    }

    async getHighlightsForCurrentPage() {
        try {
            const highlights = await this.storageService.get('highlights') || [];
            return highlights.filter(h => h.url === window.location.href);
        } catch (error) {
            console.error('Error getting highlights:', error);
            return [];
        }
    }

    async _sendRuntimeMessage(message) {
        return new Promise((resolve) => {
            try {
                chrome.runtime.sendMessage(message, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log('Runtime message error:', chrome.runtime.lastError);
                        resolve(null);
                    } else {
                        resolve(response);
                    }
                });
            } catch (error) {
                console.log('Error sending message:', error);
                resolve(null);
            }
        });
    }

    async updateHighlightTheme(highlightId, theme) {
        return this.updateHighlight(highlightId, { theme });
    }

    async updateHighlightStyle(highlightId, style) {
        return this.updateHighlight(highlightId, { style });
    }

    async getHighlight(highlightId) {
        try {
            const highlights = await this.storageService.get('highlights') || [];
            return highlights.find(h => h.id === highlightId);
        } catch (error) {
            console.error('Error getting highlight:', error);
            return null;
        }
    }

    initializeCleanup() {
        // Clean up immediately on initialization
        this.cleanupPendingScrolls();

        // Start the cleanup interval
        this.cleanupInterval = setInterval(() => {
            this.cleanupPendingScrolls();
        }, this.config.cleanupInterval);
    }

    stopCleanupInterval() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    async cleanupPendingScrolls() {
        try {
            const data = await this.storageService.getMultiple([
                'pendingScrollHighlight',
                'pendingScrollTimestamp'
            ]);

            if (data.pendingScrollTimestamp) {
                const age = Date.now() - data.pendingScrollTimestamp;
                if (age > this.config.maxAge) {
                    await this.storageService.removeMultiple([
                        'pendingScrollHighlight',
                        'pendingScrollTimestamp'
                    ]);
                    console.log('Cleaned up old pending scroll data');

                    // Notify about the cleanup
                    await this._sendRuntimeMessage({
                        action: "pendingScrollsCleanup",
                        timestamp: Date.now()
                    });
                }
            }
        } catch (error) {
            console.error('Error cleaning up pending scrolls:', error);
        }
    }

    // Helper method to force immediate cleanup
    async forceCleanup() {
        await this.cleanupPendingScrolls();
    }

    // Add this method to handle both saving highlight and setting pending scroll
    async saveHighlightWithPendingScroll(highlightData) {
        const savedHighlight = await this.saveHighlight(highlightData);

        // Set the pending scroll with timestamp
        await this.storageService.set('pendingScrollHighlight', savedHighlight.id);
        await this.storageService.set('pendingScrollTimestamp', Date.now());

        return savedHighlight;
    }

    // Add a method to check if there's a valid pending scroll
    async checkPendingScroll() {
        const data = await this.storageService.getMultiple([
            'pendingScrollHighlight',
            'pendingScrollTimestamp'
        ]);

        if (!data.pendingScrollHighlight || !data.pendingScrollTimestamp) {
            return null;
        }

        const age = Date.now() - data.pendingScrollTimestamp;
        if (age > this.config.maxAge) {
            await this.cleanupPendingScrolls();
            return null;
        }

        return data.pendingScrollHighlight;
    }






    // video highlight
    async saveVideoHighlight(videoData) {
        try {
            const highlightData = {
                id: this.generateHighlightId(),
                type: 'video',
                url: window.location.href,
                timestamp: Date.now(),
                videoData: {
                    videoId: videoData.videoId,
                    title: videoData.title,
                    startTime: videoData.startTime,
                    endTime: videoData.endTime,
                    thumbnailUrl: videoData.thumbnailUrl
                },
                theme: 'light', // Default theme
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const highlights = await this.storageService.get('highlights') || [];
            highlights.push(highlightData);

            await this.storageService.set('highlights', highlights);

            // Notify extension about the update
            await this._sendRuntimeMessage({
                action: "highlightsUpdated",
                highlights
            });

            // Open sidebar
            await this._sendRuntimeMessage({
                action: "openSidebar"
            });

            return highlightData;
        } catch (error) {
            console.error('Error saving video highlight:', error);
            throw error;
        }
    }

    async getVideoHighlights(videoId) {
        try {
            const highlights = await this.storageService.get('highlights') || [];
            return highlights.filter(h =>
                h.type === 'video' &&
                h.videoData?.videoId === videoId
            );
        } catch (error) {
            console.error('Error getting video highlights:', error);
            return [];
        }
    }

    async updateVideoHighlight(highlightId, updates) {
        try {
            const highlights = await this.storageService.get('highlights') || [];
            const index = highlights.findIndex(h => h.id === highlightId);

            if (index === -1 || highlights[index].type !== 'video') {
                return false;
            }

            highlights[index] = {
                ...highlights[index],
                videoData: {
                    ...highlights[index].videoData,
                    ...updates
                },
                updated_at: new Date().toISOString()
            };

            await this.storageService.set('highlights', highlights);

            await this._sendRuntimeMessage({
                action: "highlightsUpdated",
                highlights
            });

            return true;
        } catch (error) {
            console.error('Error updating video highlight:', error);
            return false;
        }
    }

    async deleteVideoHighlight(highlightId) {
        return this.deleteHighlight(highlightId);
    }

    // Helper method to get current video details
    async getCurrentVideoDetails() {
        try {
            const url = window.location.href;
            const videoId = new URLSearchParams(url.split('?')[1]).get('v');

            if (!videoId) return null;

            const videoElement = document.querySelector('video');
            const titleElement = document.querySelector('.ytp-title-link');

            return {
                videoId,
                title: titleElement?.textContent || 'Untitled Video',
                currentTime: videoElement?.currentTime || 0,
                thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
            };
        } catch (error) {
            console.error('Error getting video details:', error);
            return null;
        }
    }
}