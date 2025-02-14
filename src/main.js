// src/main.js
import { StorageService } from './services/StorageService';
import { HighlightService } from './services/HighlightService';
import { NotificationService } from './services/NotificationService';
import { HighlightOverlay } from './components/HighlightOverlay';
import { NoteDialog } from './components/NoteDialog';
import { createHighlightStyles } from './styles/highlight-styles';
import { debounce } from './utils/debounce';

class HorizonHighlighter {
    constructor() {
        // Initialize services
        this.storageService = new StorageService();
        // this.highlightService = new HighlightService(this.storageService);
        this.highlightService = new HighlightService(this.storageService, {
            cleanupInterval: 10 * 60 * 1000, // 10 minutes
            maxAge: 15 * 60 * 1000, // 15 minutes
            autoCleanup: true
        });


        this.notificationService = new NotificationService();
        this.noteDialog = new NoteDialog();
        this.highlightOverlay = new HighlightOverlay(
            this.highlightService,
            this.notificationService,
            this.noteDialog
        );

        // Initialize state
        this.observer = null;

        // Setup
        this.initializeStyles();
        this.setupMessageListeners();
        this.setupMutationObserver();
        this.checkPendingScroll();
    }

    initializeStyles() {
        document.head.appendChild(createHighlightStyles());
    }

    setupMessageListeners() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            // Handle ping messages first
            if (request.action === "ping") {
                sendResponse({ status: "alive" });
                return true;
            }

            // Handle all other messages
            (async () => {
                try {
                    let response;

                    switch (request.action) {
                        case 'updateHighlightTheme':
                            await this.handleThemeUpdate(request);
                            response = { success: true };
                            break;

                        case 'updateHighlightStyle':
                            await this.handleStyleUpdate(request);
                            response = { success: true };
                            break;

                        case 'addHorizonHighlight':
                            const addResult = await this.handleAddHighlight();
                            response = { success: !!addResult };
                            break;

                        case 'scrollToHighlightGroup':
                            const scrollSuccess = await this.highlightOverlay.scrollToHighlightGroup(request.highlightGroup);
                            response = {
                                success: scrollSuccess,
                                error: scrollSuccess ? null : 'Failed to scroll to highlight'
                            };
                            break;

                        default:
                            response = {
                                success: false,
                                error: `Unknown action: ${request.action}`
                            };
                    }

                    sendResponse(response);
                } catch (error) {
                    console.error('Error handling message:', error);
                    sendResponse({
                        success: false,
                        error: error.message || 'Unknown error occurred'
                    });
                }
            })();

            // Return true to indicate we will send a response asynchronously
            return true;
        });
    }

    async handleStyleUpdate(request) {
        await this.highlightOverlay.updateHighlightStyle(
            request.highlightId,
            request.oldStyle,
            request.style
        );
    }

    // Update these handler methods to not use sendResponse directly
    async handleThemeUpdate(request) {
        const marks = document.querySelectorAll(
            `.horizon-highlight[data-highlight-id="${request.highlightId}"]`
        );
        marks.forEach(mark => mark.dataset.theme = request.theme);
        await this.highlightService.updateHighlightTheme(request.highlightId, request.theme);
    }

    async handleAddHighlight() {
        const selection = window.getSelection();
        if (!selection.rangeCount) {
            this.notificationService.showNotification(
                'Unable to create highlight. Please try selecting the text again.',
                false,
                true
            );
            return false;
        }

        try {
            const range = selection.getRangeAt(0);
            const highlightId = await this.highlightOverlay.createHighlightOverlay(range);

            if (highlightId) {
                this.notificationService.showNotification('Highlight saved!');
                return true;
            } else {
                this.notificationService.showNotification(
                    'Unable to create highlight. This might be due to complex text selection.',
                    false,
                    true
                );
                return false;
            }
        } catch (error) {
            this.notificationService.showNotification(
                'Something went wrong while saving your highlight.',
                false,
                true
            );
            console.error('Error applying highlight:', error);
            throw error;
        }
    }

    async handleScrollToHighlight(request, sendResponse) {
        try {
            await this.highlightOverlay.scrollToHighlightGroup(request.highlightGroup);
            sendResponse({ success: true });
        } catch (error) {
            console.error('Error scrolling to highlight:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    setupMutationObserver() {
        // Debounce the restoration to prevent multiple rapid updates
        const debouncedRestore = debounce(() => {
            if (!this.highlightOverlay.restorationInProgress) {
                this.highlightOverlay.restoreHighlights();
            }
        }, 500);

        this.observer = new MutationObserver((mutations) => {
            // Skip if mutations only affect our own highlight elements
            if (this.isHighlightMutation(mutations)) return;

            // Check for meaningful DOM changes
            const hasRelevantChanges = mutations.some(mutation =>
                this.isRelevantMutation(mutation)
            );

            if (hasRelevantChanges && !this.highlightOverlay.restorationInProgress) {
                requestAnimationFrame(debouncedRestore);
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true
        });
    }

    isHighlightMutation(mutations) {
        return mutations.every(mutation => {
            const isHighlightElement = mutation.target.classList?.contains('horizon-highlight') ||
                mutation.target.classList?.contains('note-dialog') ||
                mutation.target.classList?.contains('note-indicator');
            const isHighlightParent = mutation.target.querySelector?.('.horizon-highlight, .note-dialog, .note-indicator');
            return isHighlightElement || isHighlightParent;
        });
    }

    isRelevantMutation(mutation) {
        return mutation.addedNodes.length > 0 && Array.from(mutation.addedNodes).some(node =>
            node.nodeType === Node.ELEMENT_NODE &&
            !node.classList?.contains('horizon-highlight') &&
            !node.classList?.contains('note-dialog') &&
            !node.classList?.contains('note-indicator')
        );
    }

    async checkPendingScroll() {
        const [pendingScroll, highlights] = await Promise.all([
            this.storageService.get('pendingScrollHighlight'),
            this.storageService.get('highlights')
        ]);

        if (pendingScroll) {
            setTimeout(() => {
                const highlightGroup = (highlights || [])
                    .find(h => h.id === pendingScroll);

                if (highlightGroup) {
                    this.highlightOverlay.scrollToHighlightGroup(highlightGroup);
                }
                this.storageService.remove('pendingScrollHighlight');
            }, 1000);
        }
    }
}

// Initialize the highlighter when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new HorizonHighlighter());
} else {
    new HorizonHighlighter();
}