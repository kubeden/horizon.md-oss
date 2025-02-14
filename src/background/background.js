// src/background/background.js
import { ContextMenuService } from './context-menu';

class BackgroundService {
    constructor() {
        this.setupServices();
        this.setupListeners();
    }

    setupServices() {
        this.contextMenuService = new ContextMenuService();
    }

    setupListeners() {
        // Handle extension installation
        chrome.runtime.onInstalled.addListener(() => {
            chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
            this.contextMenuService.setupContextMenu();
        });

        // Handle context menu clicks
        chrome.contextMenus.onClicked.addListener(async (info, tab) => {
            if (tab.id) {
                chrome.tabs.sendMessage(tab.id, {
                    action: info.menuItemId,
                    text: info.selectionText
                }, response => {
                    if (chrome.runtime.lastError) {
                        console.error('Message error:', chrome.runtime.lastError.message);
                    } else {
                        console.log('Action completed, response:', response);
                    }
                });
            }
        });
    }
}

// Initialize the background service
new BackgroundService();