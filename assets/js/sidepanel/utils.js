// /assets/js/sidepanel/utils.js
export function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(diff / (60 * 60 * 1000));
        if (hours === 0) {
            const minutes = Math.floor(diff / (60 * 1000));
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        }
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }

    if (diff < 7 * 24 * 60 * 60 * 1000) {
        return date.toLocaleDateString('en-US', { weekday: 'long' });
    }

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

export function formatUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname + urlObj.pathname;
    } catch (e) {
        return url;
    }
}

export function getCombinedHighlightContent(highlight) {
    if (!highlight.range) return 'No content';
    const text = highlight.range.text || 'No content';
    return text.length > 255 ? text.slice(0, 255) + '...' : text;
}

// Add to utils.js
export function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// First, let's modify utils.js by adding this new function to the existing exports to get the favicon URL
export function getFaviconUrl(url) {
    try {
        const urlObj = new URL(url);
        return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=16`;
    } catch (e) {
        return null;
    }
}