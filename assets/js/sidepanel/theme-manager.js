// assets/js/sidepanel/themeManager.js
export let currentTheme = null;

export function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getCurrentTheme() {
    return localStorage.getItem('theme') || getSystemTheme();
}

export function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeToggleIcon(theme);
}

export function updateHeaderLogo() {
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const logoPath = chrome.runtime.getURL(`/images/icon16${isDarkMode ? '-dark' : ''}.png`);
    const header = document.querySelector('.app-title');
    if (header) {
        header.innerHTML = `
            <img src="${logoPath}" alt="Horizon.md logo" class="app-logo">
            <span class="title-horizon">Horizon.md</span>
        `;
    }
}

export function updateThemeToggleIcon(theme) {
    const button = document.getElementById('themeToggle');
    if (!button) return;

    button.innerHTML = theme === 'dark' ? `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
    ` : `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
    `;

    updateHeaderLogo();
}

export function initializeTheme() {
    const theme = getCurrentTheme();
    setTheme(theme);
    updateHeaderLogo();

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
        });
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
}