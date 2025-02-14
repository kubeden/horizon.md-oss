export class StorageService {
    async get(key) {
        return new Promise((resolve) => {
            chrome.storage.local.get([key], (result) => {
                resolve(result[key]);
            });
        });
    }

    async set(key, value) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [key]: value }, resolve);
        });
    }

    async remove(key) {
        return new Promise((resolve) => {
            chrome.storage.local.remove(key, resolve);
        });
    }

    async getMultiple(keys) {
        return new Promise((resolve) => {
            chrome.storage.local.get(keys, resolve);
        });
    }

    async removeMultiple(keys) {
        return new Promise((resolve) => {
            chrome.storage.local.remove(keys, resolve);
        });
    }
}