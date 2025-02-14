// src/background/context-menu.js
export class ContextMenuService {
    setupContextMenu() {
        chrome.contextMenus.removeAll(() => {
            // Text highlighting context menu
            chrome.contextMenus.create({
                id: "addHorizonHighlight",
                title: "Add Horizon Highlight",
                contexts: ["selection"]
            });

            chrome.contextMenus.create({
                id: "addHorizonNote",
                title: "Add Horizon Note",
                contexts: ["selection"]
            });

            // Video highlighting context menu
            chrome.contextMenus.create({
                id: "separator-1",
                type: "separator",
                contexts: ["all"]
            });

            chrome.contextMenus.create({
                id: "startVideoHighlight",
                title: "Start Video Highlight (or press [)",
                contexts: ["video"],
                documentUrlPatterns: ["*://*.youtube.com/*"]
            });

            chrome.contextMenus.create({
                id: "endVideoHighlight",
                title: "End Video Highlight (or press ])",
                contexts: ["video"],
                documentUrlPatterns: ["*://*.youtube.com/*"]
            });

            chrome.contextMenus.create({
                id: "cancelVideoHighlight",
                title: "Cancel Video Highlight (or press ESC)",
                contexts: ["video"],
                documentUrlPatterns: ["*://*.youtube.com/*"]
            });
        });
    }

    async handleContextMenuClick(info, tab) {
        if (!tab.id) return;

        switch (info.menuItemId) {
            case 'startVideoHighlight':
            case 'endVideoHighlight':
            case 'cancelVideoHighlight':
                await this._handleVideoAction(info.menuItemId, tab.id);
                break;

            case 'addHorizonHighlight':
            case 'addHorizonNote':
                await this._handleTextAction(info, tab.id);
                break;
        }
    }

    async _handleVideoAction(action, tabId) {
        try {
            const message = {
                action: action,
                timestamp: Date.now()
            };

            await chrome.tabs.sendMessage(tabId, message);
        } catch (error) {
            console.error('Error handling video action:', error);
        }
    }

    async _handleTextAction(info, tabId) {
        try {
            await chrome.tabs.sendMessage(tabId, {
                action: info.menuItemId,
                text: info.selectionText
            });
        } catch (error) {
            console.error('Error handling text action:', error);
        }
    }
}