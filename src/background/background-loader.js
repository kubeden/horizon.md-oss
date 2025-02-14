// Create storage adapter for service worker context
const storageAdapter = {
    getItem: async (key) => {
        const result = await chrome.storage.local.get(key);
        return result[key] || null;
    },
    setItem: async (key, value) => {
        await chrome.storage.local.set({ [key]: value });
    },
    removeItem: async (key) => {
        await chrome.storage.local.remove(key);
    }
};

// Ensure we respond to extension messages
self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
});

// Import and initialize background script
import('./background.js')
    .then(() => {
        console.log('Background script loaded successfully');
    })
    .catch(err => {
        console.error('Failed to load background script:', err);
    });

// Keep service worker alive
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'KEEP_ALIVE') {
        console.log('Keeping service worker alive');
    }
});