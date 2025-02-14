// assets/js/sidepanel/settings-manager.js
import { updateHighlights } from './events.js';
import * as ThemeManager from './theme-manager.js';

export class SettingsManager {
    constructor() {
        this.initializeEventListeners();
        this.loadSettings();
    }

    initializeEventListeners() {
        // Settings toggle
        const settingsButton = document.getElementById('settingsButton');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => this.toggleSettings());
        }

        // Close settings button
        const closeSettings = document.getElementById('close-settings');
        if (closeSettings) {
            closeSettings.addEventListener('click', () => this.toggleSettings());
        }

        // Style buttons
        document.querySelectorAll('.settings-button[data-style]').forEach(button => {
            button.addEventListener('click', (e) => this.updateHighlightStyle(e.currentTarget.dataset.style));
        });

        // Theme buttons
        document.querySelectorAll('.settings-button[data-theme]').forEach(button => {
            button.addEventListener('click', (e) => this.updateHighlightTheme(e.currentTarget.dataset.theme));
        });

        // Extension theme buttons
        document.querySelectorAll('.settings-button[data-extension-theme]').forEach(button => {
            button.addEventListener('click', (e) => this.updateExtensionTheme(e.currentTarget.dataset.extensionTheme));
        });
    }

    toggleSettings() {
        const highlightsContainer = document.getElementById('highlights-container');
        const settingsContainer = document.getElementById('settings-container');

        if (settingsContainer.style.display === 'none') {
            highlightsContainer.style.display = 'none';
            settingsContainer.style.display = 'block';
        } else {
            settingsContainer.style.display = 'none';
            highlightsContainer.style.display = 'block';
            updateHighlights();
        }
    }

    async loadSettings() {
        const settings = await chrome.storage.local.get([
            'defaultHighlightStyle',
            'defaultHighlightTheme'
        ]);

        // Update UI to reflect current settings
        const style = settings.defaultHighlightStyle || 'underline';
        const theme = settings.defaultHighlightTheme || 'light';
        const extensionTheme = ThemeManager.getCurrentTheme();

        this.updateButtonStates('style', style);
        this.updateButtonStates('theme', theme);
        this.updateButtonStates('extension-theme', extensionTheme);
    }

    updateButtonStates(type, value) {
        document.querySelectorAll(`.settings-button[data-${type}]`).forEach(button => {
            button.classList.toggle('active', button.dataset[type] === value);
        });
    }

    async updateExtensionTheme(theme) {
        ThemeManager.setTheme(theme);
        this.updateButtonStates('extension-theme', theme);
    }

    async updateHighlightStyle(style) {
        await chrome.storage.local.set({ defaultHighlightStyle: style });
        this.updateButtonStates('style', style);
    }

    async updateHighlightTheme(theme) {
        await chrome.storage.local.set({ defaultHighlightTheme: theme });
        this.updateButtonStates('theme', theme);
    }
}