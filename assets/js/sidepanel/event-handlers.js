// assets/js/sidepanel/event-handlers.js
import { updateHighlights } from './events.js';
import { saveHighlightTheme } from './highlight-manager.js';
import { saveNote, deleteNote } from './note-manager.js';

// Modified showInlineNoteEditor function
// Modified showInlineNoteEditor function
function showInlineNoteEditor(highlightId, noteIndex = null, noteText = '') {
    console.log('Showing note editor for highlight:', highlightId); // Debug log

    // Remove any existing editors
    document.querySelectorAll('.inline-note-editor').forEach(editor => editor.remove());

    const highlight = document.querySelector(`[data-highlight-id="${highlightId}"]`);
    if (!highlight) {
        console.error('Could not find highlight element:', highlightId);
        return;
    }

    const addButton = highlight.querySelector('.add-note-button');
    const notesContainer = highlight.querySelector('.notes-container');
    if (!notesContainer) {
        console.error('Could not find notes container');
        return;
    }

    const noteContainer = document.createElement('div');
    noteContainer.className = 'inline-note-editor';
    noteContainer.innerHTML = `
        <textarea class="note-textarea" placeholder="Enter your note here...">${noteText}</textarea>
        <div class="note-actions">
            <button class="action-button cancel">Cancel</button>
            <button class="action-button save">Save</button>
        </div>
    `;

    // Position the note editor
    if (noteIndex !== null) {
        const noteElement = highlight.querySelector(`[data-note-index="${noteIndex}"]`);
        if (noteElement) {
            noteElement.style.display = 'none';
            noteElement.after(noteContainer);
        } else {
            notesContainer.insertBefore(noteContainer, addButton);
        }
    } else {
        notesContainer.insertBefore(noteContainer, addButton);
    }

    // Hide the add button if it exists
    if (addButton) {
        addButton.style.display = 'none';
    }

    const textarea = noteContainer.querySelector('textarea');
    textarea.focus();

    // Cancel button handler
    noteContainer.querySelector('.cancel').addEventListener('click', () => {
        if (noteIndex !== null) {
            const noteElement = highlight.querySelector(`[data-note-index="${noteIndex}"]`);
            if (noteElement) {
                noteElement.style.display = '';
            }
        }
        if (addButton) {
            addButton.style.display = '';
        }
        noteContainer.remove();
    });

    // Save button handler
    noteContainer.querySelector('.save').addEventListener('click', async () => {
        const newText = textarea.value.trim();
        if (newText) {
            try {
                await saveNote(highlightId, newText, noteIndex);

                if (noteIndex !== null) {
                    const noteElement = highlight.querySelector(`[data-note-index="${noteIndex}"]`);
                    if (noteElement) {
                        noteElement.style.display = '';
                    }
                }
                if (addButton) {
                    addButton.style.display = '';
                }
                noteContainer.remove();
            } catch (error) {
                console.error('Error saving note:', error);
            }
        }
    });

    // Keyboard shortcuts
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            noteContainer.querySelector('.save').click();
        } else if (e.key === 'Escape') {
            noteContainer.querySelector('.cancel').click();
        }
    });
}

function showTitleEditor(highlightId, currentTitle) {
    const titleElement = document.querySelector(`[data-highlight-id="${highlightId}"] .highlight-title`);
    if (!titleElement) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'title-editor';
    input.value = currentTitle;
    input.style.width = '100%';
    input.style.padding = '4px 8px';
    input.style.border = '1px solid var(--border-color)';
    input.style.borderRadius = '4px';
    input.style.fontSize = '16px';

    titleElement.style.display = 'none';
    titleElement.parentNode.insertBefore(input, titleElement);
    input.focus();
    input.select();

    function saveTitle(newTitle) {
        chrome.storage.local.get(['highlights'], function (result) {
            const highlights = result.highlights || [];
            const highlightIndex = highlights.findIndex(h => h.id === highlightId);

            if (highlightIndex !== -1) {
                highlights[highlightIndex].title = newTitle;
                chrome.storage.local.set({ highlights }, function () {
                    updateHighlights();
                });
            }
        });
    }

    input.addEventListener('blur', () => {
        const newTitle = input.value.trim() || titleElement.textContent;
        saveTitle(newTitle);
        input.remove();
        titleElement.style.display = '';
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            input.blur();
        } else if (e.key === 'Escape') {
            input.remove();
            titleElement.style.display = '';
        }
    });
}

function showDeleteHighlightConfirmation(highlightId, highlightItem) {
    console.log('Showing delete confirmation for highlight ID:', highlightId); // Debug log
    if (!highlightItem) return;

    // Remove any existing confirmation dialogs
    document.querySelectorAll('.delete-confirmation').forEach(dialog => dialog.remove());

    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'delete-confirmation';
    confirmDialog.innerHTML = `
        <div class="delete-confirmation-content">
            <h3>Delete Highlight?</h3>
            <p>This action cannot be undone.</p>
            <div class="delete-confirmation-actions">
                <button class="cancel-delete">Cancel</button>
                <button class="confirm-delete">Delete</button>
            </div>
        </div>
    `;

    highlightItem.appendChild(confirmDialog);

    confirmDialog.querySelector('.cancel-delete').addEventListener('click', () => {
        confirmDialog.remove();
    });

    confirmDialog.querySelector('.confirm-delete').addEventListener('click', () => {
        deleteHighlight(highlightId, highlightItem);
    });
}

function deleteHighlight(highlightId, highlightCard) {
    console.log('Attempting to delete highlight:', highlightId); // Debug

    chrome.storage.local.get(['highlights'], function (result) {
        const highlights = result.highlights || [];
        console.log('Before deletion:', highlights.length);

        const updatedHighlights = highlights.filter(h => {
            const currentId = typeof h.id === 'object' ?
                `highlight-${h.timestamp}` :
                h.id;
            return currentId !== highlightId;
        });

        console.log('After deletion:', updatedHighlights.length);

        chrome.storage.local.set({ highlights: updatedHighlights }, function () {
            if (chrome.runtime.lastError) {
                console.error('Error deleting highlight:', chrome.runtime.lastError);
                return;
            }

            if (highlightCard) {
                highlightCard.style.transition = 'all 0.3s ease-out';
                highlightCard.style.opacity = '0';
                highlightCard.style.maxHeight = '0';
                highlightCard.style.margin = '0';
                highlightCard.style.padding = '0';

                setTimeout(() => {
                    highlightCard.remove();
                    updateHighlights();
                }, 300);
            } else {
                updateHighlights();
            }
        });
    });
}

export function attachEventListeners() {
    // Delete highlight button handler
    document.querySelectorAll('.delete-highlight-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            let target = e.target.closest('.delete-highlight-button');
            if (!target) return;

            const highlightId = target.dataset.highlightId;
            const highlightItem = target.closest('.highlight-item');

            console.log('Delete clicked:', { highlightId, highlightItem }); // Debug

            if (!highlightId || !highlightItem) {
                console.error('Missing highlight information');
                return;
            }

            showDeleteHighlightConfirmation(highlightId, highlightItem);
        });
    });


    // Title click handler
    document.querySelectorAll('.highlight-title').forEach(title => {
        title.addEventListener('click', (e) => {
            const highlightId = e.target.closest('.highlight-item').dataset.highlightId;
            showTitleEditor(highlightId, e.target.textContent);
        });
    });

    // Add note buttons
    document.querySelectorAll('.add-note-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const highlightId = e.currentTarget.dataset.highlightId;
            console.log('Add note clicked for highlight:', highlightId);

            if (!highlightId) {
                console.error('No highlight ID found for note button');
                return;
            }

            showInlineNoteEditor(highlightId);
        });
    });

    // Edit note handler
    document.querySelectorAll('.edit-note').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const { highlightId, noteIndex, noteText } = e.currentTarget.dataset;
            console.log('Edit note clicked:', { highlightId, noteIndex, noteText });

            if (!highlightId || noteIndex === undefined) {
                console.error('Missing highlight ID or note index');
                return;
            }

            showInlineNoteEditor(highlightId, parseInt(noteIndex), noteText);
        });
    });

    // Delete note handler
    document.querySelectorAll('.delete-note').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const { highlightId, noteIndex } = e.currentTarget.dataset;
            if (!highlightId || noteIndex === undefined) return;

            const noteElement = e.currentTarget.closest('.note');
            if (!noteElement) return;

            // Create inline confirmation
            const confirmationDiv = document.createElement('div');
            confirmationDiv.className = 'delete-confirmation';
            confirmationDiv.innerHTML = `
                <span style="margin-right: 10px;">Delete this note?</span>
                <div class="confirmation-actions">
                    <button class="action-button cancel">Cancel</button>
                    <button class="action-button confirm">Delete</button>
                </div>
            `;

            // Style the confirmation div
            Object.assign(confirmationDiv.style, {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px',
                backgroundColor: 'var(--background-color)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                marginTop: '8px'
            });

            // Hide the note content
            noteElement.style.display = 'none';
            noteElement.after(confirmationDiv);

            // Handle cancel
            confirmationDiv.querySelector('.cancel').addEventListener('click', () => {
                noteElement.style.display = '';
                confirmationDiv.remove();
            });

            // Handle confirm
            confirmationDiv.querySelector('.confirm').addEventListener('click', async () => {
                try {
                    await deleteNote(highlightId, parseInt(noteIndex));
                    confirmationDiv.remove();
                } catch (error) {
                    console.error('Error deleting note:', error);
                    noteElement.style.display = '';
                    confirmationDiv.remove();
                }
            });
        });
    });

    // Theme toggle buttons
    document.querySelectorAll('.theme-toggle').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const highlightId = button.dataset.highlightId;
            const currentTheme = button.dataset.currentTheme;
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';

            button.dataset.currentTheme = newTheme;
            button.innerHTML = newTheme === 'dark' ?
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>' :
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';

            saveHighlightTheme(highlightId, newTheme);
        });
    });

    // Highlight link clicks

    document.querySelectorAll('.highlight-source a').forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const highlightId = e.target.closest('.highlight-item').dataset.highlightId;
            const url = e.target.href;

            try {
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                const currentTab = tabs[0];

                if (!currentTab) {
                    console.error('No active tab found');
                    return;
                }

                if (currentTab.url === url) {
                    // Same URL - try to scroll
                    const result = await chrome.storage.local.get(['highlights']);
                    const highlights = result.highlights || [];
                    const highlightGroup = highlights.find(h => h.id === highlightId);

                    if (!highlightGroup) {
                        console.error('Highlight not found:', highlightId);
                        return;
                    }

                    try {
                        // First, check if we can establish connection with the tab
                        await chrome.tabs.sendMessage(currentTab.id, { action: "ping" });

                        // If ping succeeds, send the scroll message
                        await chrome.tabs.sendMessage(currentTab.id, {
                            action: "scrollToHighlightGroup",
                            highlightGroup: highlightGroup
                        });
                    } catch (error) {
                        console.log('Content script not ready, injecting it...');

                        // Try to inject the content script
                        try {
                            await chrome.scripting.executeScript({
                                target: { tabId: currentTab.id },
                                files: ['content-script.js']  // Adjust this path to match your content script
                            });

                            // Wait a bit for the script to initialize
                            await new Promise(resolve => setTimeout(resolve, 100));

                            // Try sending the message again
                            await chrome.tabs.sendMessage(currentTab.id, {
                                action: "scrollToHighlightGroup",
                                highlightGroup: highlightGroup
                            });
                        } catch (injectionError) {
                            console.error('Failed to inject content script:', injectionError);
                        }
                    }
                } else {
                    // Different URL - store the highlight ID and navigate
                    await chrome.storage.local.set({
                        pendingScrollHighlight: highlightId,
                        pendingScrollTimestamp: Date.now() // Add timestamp for cleanup
                    });
                    await chrome.tabs.update(currentTab.id, { url: url });
                }
            } catch (error) {
                console.error('Error handling highlight link click:', error);
            }
        });
    });

    // In attachEventListeners() in index.js, update the style toggle handler
    document.querySelectorAll('.style-toggle').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const highlightId = button.dataset.highlightId;
            const currentStyle = button.dataset.currentStyle;
            const newStyle = currentStyle === 'underline' ? 'background' : 'underline';

            button.dataset.currentStyle = newStyle;
            button.innerHTML = newStyle === 'background' ?
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3z M7 7h10 M7 12h10 M7 17h10"></path></svg>' :
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 18h16 M9 12h6 M7 14l2-4 M15 14l2-4 M11 12l1-2 M13 12l-1-2"></path></svg>';

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "updateHighlightStyle",
                        highlightId: highlightId,
                        oldStyle: currentStyle,
                        style: newStyle
                    }).then(() => {
                        updateHighlights();
                    }).catch(() => {
                        console.log('Tab was closed or became unavailable');
                    });
                }
            });
        });
    });
}