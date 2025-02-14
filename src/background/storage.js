// src/background/storage.js
export const createStorageAdapter = () => ({
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
});