// assets/js/sidepanel/index.js
import * as ThemeManager from './theme-manager.js';
import { State, updateState } from './state.js';
import { formatDate, formatUrl, formatTime, getCombinedHighlightContent } from './utils.js';
import { attachEventListeners } from './event-handlers.js';
import { updateHighlights } from './events.js';
import { getFaviconUrl } from './utils.js';
import { SettingsManager } from './settings-manager.js';

export function renderHighlights(highlightsToShow) {
    const container = document.getElementById('highlights-container');

    if (highlightsToShow.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <div class="empty-state-text">
                    ${State.currentTab === 'page'
                ? 'No highlights on this page yet.<br>Select some text and right-click to add highlights!'
                : State.currentSearchQuery
                    ? 'No highlights found matching your search.'
                    : 'No highlights yet. Start highlighting to see them here!'}
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = highlightsToShow
        .sort((a, b) => b.timestamp - a.timestamp)
        .map((highlight, index) => {
            const highlightId = typeof highlight.id === 'object' ?
                `highlight-${highlight.timestamp}` :
                highlight.id;

            const content = highlight.body || highlight.text || 'No content';
            const highlightNumber = highlightsToShow.length - index;
            const title = highlight.title || `Highlight #${highlightNumber}`;

            if (highlight.type === 'video') {
                return `
                    <div class="highlight-item" data-highlight-id="${highlightId}">
                        <div class="highlight-header">
                            <h2 class="highlight-title" title="Click to edit title">
                                ${highlight.title || `Highlight #${highlightNumber}`}
                            </h2>
                            <button class="delete-highlight-button" title="Delete highlight" data-highlight-id="${highlightId}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 6h18"></path>
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                        <div class="highlight-video-preview">
                            <img 
                                src="${highlight.videoData.thumbnailUrl}" 
                                alt="Video thumbnail"
                                class="video-thumbnail"
                                style="width: 100%; border-radius: 4px; height: 100%;"
                            />
                            <div class="video-timestamp">
                                ${formatTime(highlight.videoData.startTime)} - ${formatTime(highlight.videoData.endTime)}
                            </div>
                        </div>
                        <div class="highlight-meta">
                            <div class="highlight-source">
                                <img 
                                    src="${getFaviconUrl(highlight.url)}" 
                                    alt="YouTube" 
                                    class="site-favicon"
                                    style="width: 16px; height: 16px; margin-right: 6px; vertical-align: middle;"
                                    onerror="this.style.display='none'"
                                />
                                <a href="${highlight.url}&t=${Math.floor(highlight.videoData.startTime)}" 
                                   title="Open video at timestamp"
                                   class="video-link"
                                   data-highlight-id="${highlightId}"
                                   data-start-time="${highlight.videoData.startTime}"
                                   data-end-time="${highlight.videoData.endTime}">
                                    ${formatUrl(highlight.url)}
                                </a>
                            </div>
                            <div class="highlight-time">
                                ${formatDate(highlight.timestamp)}
                            </div>
                        </div>
                        <div class="notes-container">
                            ${(highlight.notes || []).map((note, index) => `
                                <div class="note" data-note-index="${index}">
                                    <div class="note-text">${note.text}</div>
                                    <div class="note-meta">
                                        Created: ${formatDate(note.timestamp)}
                                        ${note.updatedAt ? `<br>Updated: ${formatDate(note.updatedAt)}` : ''}
                                    </div>
                                    <div class="note-actions">
                                        <button class="action-button edit-note" 
                                            data-highlight-id="${highlightId}" 
                                            data-note-index="${index}" 
                                            data-note-text="${note.text.replace(/"/g, '&quot;')}">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                        <button class="action-button delete-note" 
                                            data-highlight-id="${highlightId}" 
                                            data-note-index="${index}">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                            <button class="add-note-button" data-highlight-id="${highlightId}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Add note
                            </button>
                        </div>
                    </div>
                `;
            }

            // Your existing rendering logic here, but without auth-specific elements
            return `
            <div class="highlight-item" data-highlight-id="${highlightId}">
                <div class="highlight-header">
                    <h2 class="highlight-title" title="Click to edit title">
                        ${title}
                    </h2>
                    <button class="delete-highlight-button" title="Delete highlight" data-highlight-id="${highlightId}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
                <div class="highlight-text">
                    ${content}
                </div>
                <div class="highlight-meta">
                    <div class="highlight-source">
                        <img 
                            src="${getFaviconUrl(highlight.url)}" 
                            alt="Site favicon" 
                            class="site-favicon"
                            style="width: 16px; height: 16px; margin-right: 6px; vertical-align: middle;"
                            onerror="this.style.display='none'"
                        />
                        <a href="${highlight.url}" title="${highlight.url}" target="_blank">
                            ${formatUrl(highlight.url)}
                        </a>
                        <button class="theme-toggle" title="Toggle highlight theme" data-highlight-id="${highlight.id}" data-current-theme="${highlight.theme || 'light'}">
                            ${highlight.theme === 'dark' ?
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>' :
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>'}
                        </button>
                        <button class="style-toggle" title="Toggle highlight style" data-highlight-id="${highlight.id}" data-current-style="${highlight.style || 'underline'}">
                            ${highlight.style === 'background' ?
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3z M7 7h10 M7 12h10 M7 17h10"></path></svg>' :
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 18h16 M9 12h6 M7 14l2-4 M15 14l2-4 M11 12l1-2 M13 12l-1-2"></path></svg>'}
                        </button>
                    </div>
                    <div class="highlight-time">
                        ${formatDate(highlight.created_at)}
                    </div>
                </div>
                <div class="notes-container">
                    ${(highlight.notes || []).map((note, index) => `
                        <div class="note" data-note-index="${index}">
                            <div class="note-text">${note.text}</div>
                            <div class="note-meta">
                                Created: ${formatDate(note.timestamp)}
                                ${note.updatedAt ? `<br>Updated: ${formatDate(note.updatedAt)}` : ''}
                            </div>
                            <div class="note-actions">
                                <button class="action-button edit-note" 
                                    data-highlight-id="${highlightId}" 
                                    data-note-index="${index}" 
                                    data-note-text="${note.text.replace(/"/g, '&quot;')}">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                </button>
                                <button class="action-button delete-note" 
                                    data-highlight-id="${highlightId}" 
                                    data-note-index="${index}">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                    <button class="add-note-button" data-highlight-id="${highlightId}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add note
                    </button>
                </div>
            </div>
            `;
        }).join('');

    attachEventListeners();
}

// Add styles for video highlights
const style = document.createElement('style');
style.textContent = `
    .highlight-video-preview {
        position: relative;
        margin: 8px 0;
    }
    
    .video-timestamp {
        position: absolute;
        bottom: 8px;
        right: 8px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
    }
    
    .video-thumbnail {
        transition: transform 0.2s ease;
    }
    
    .video-thumbnail:hover {
        transform: scale(1.02);
    }
`;
document.head.appendChild(style);

function initializeEventListeners() {
    // Tab switching
    document.querySelectorAll('[data-tab]').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('[data-tab]').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            updateState({ currentTab: tab.dataset.tab });
            updateHighlights();
        });
    });

    // Search functionality
    const searchInput = document.querySelector('.search-input');
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            updateState({ searchQuery: e.target.value.trim() });
            updateHighlights();
        }, 300);
    });

    // Filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            updateState({ filter: chip.dataset.filter || chip.textContent.toLowerCase().replace(' ', '-') });
            updateHighlights();
        });
    });
}

// Update your event listeners to handle video links
function attachVideoEventListeners() {
    document.querySelectorAll('.video-link').forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();

            const startTime = parseFloat(link.dataset.startTime);
            const endTime = parseFloat(link.dataset.endTime);
            const url = new URL(link.href);

            // Set the correct timestamp in the URL
            url.searchParams.set('t', Math.floor(startTime));

            try {
                // Get current tab
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                const currentTab = tabs[0];

                if (currentTab.url === url.toString()) {
                    // If we're already on the correct video, just seek to the time
                    chrome.tabs.sendMessage(currentTab.id, {
                        action: 'seekToTime',
                        startTime,
                        endTime
                    });
                } else {
                    // Navigate to the video at the correct time
                    chrome.tabs.update(currentTab.id, { url: url.toString() });
                }
            } catch (error) {
                console.error('Error handling video link click:', error);
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function () {
    ThemeManager.initializeTheme();
    initializeEventListeners();
    attachVideoEventListeners();
    updateHighlights();
    new SettingsManager();
});

// Listen for tab changes
chrome.tabs.onActivated.addListener(updateHighlights);
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        updateHighlights();
    }
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.highlights) {
        updateHighlights();
    }
});