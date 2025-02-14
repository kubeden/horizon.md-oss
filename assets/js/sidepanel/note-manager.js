// assets/js/sidepanel/note-manager.js
import { updateHighlights } from './events.js';

export async function saveNote(highlightId, noteText, noteIndex = null) {
    try {
        console.log('Saving note for highlight:', highlightId); // Debug log

        const result = await chrome.storage.local.get(['highlights']);
        const highlights = result.highlights || [];

        console.log('All highlights:', highlights); // Debug log

        // Find the highlight, accounting for different ID formats
        const highlightIndex = highlights.findIndex(h => {
            const currentId = typeof h.id === 'object' ?
                `highlight-${h.timestamp}` :
                h.id;
            return currentId === highlightId;
        });

        console.log('Found highlight at index:', highlightIndex); // Debug log

        if (highlightIndex === -1) {
            throw new Error('Highlight not found');
        }

        const highlight = highlights[highlightIndex];
        const notes = Array.isArray(highlight.notes) ? highlight.notes : [];

        const newNote = {
            id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: noteText,
            timestamp: Date.now()
        };

        if (noteIndex !== null && noteIndex >= 0 && notes[noteIndex]) {
            // Update existing note
            notes[noteIndex] = {
                ...notes[noteIndex],
                text: noteText,
                updatedAt: Date.now()
            };
        } else {
            // Add new note
            notes.push(newNote);
        }

        highlights[highlightIndex] = {
            ...highlight,
            notes
        };

        await chrome.storage.local.set({ highlights });
        console.log('Note saved successfully'); // Debug log
        await updateHighlights();
        return true;
    } catch (error) {
        console.error('Error in saveNote:', error); // Debug log
        throw error;
    }
}

export async function deleteNote(highlightId, noteIndex) {
    try {
        const { highlights } = await chrome.storage.local.get(['highlights']);
        const updatedHighlights = highlights.map(highlight => {
            const currentId = typeof highlight.id === 'object' ?
                `highlight-${highlight.timestamp}` :
                highlight.id;

            if (currentId === highlightId) {
                const notes = [...(highlight.notes || [])];
                notes.splice(noteIndex, 1);
                return { ...highlight, notes };
            }
            return highlight;
        });

        await chrome.storage.local.set({ highlights: updatedHighlights });
        await updateHighlights();
        return true;
    } catch (error) {
        console.error('Error deleting note:', error);
        throw error;
    }
}