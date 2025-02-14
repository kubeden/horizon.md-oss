// src/components/NoteDialog.js
export class NoteDialog {
    constructor() {
        this.currentDialog = null;
    }

    show(mark, highlight, rect) {
        this.remove(); // Remove any existing dialog

        if (!highlight.notes?.length) return;

        const dialog = this._createDialog(highlight, rect);
        document.body.appendChild(dialog);
        this.currentDialog = dialog;

        this._setupEventListeners(mark, dialog);
        this._positionDialog(dialog, rect);
    }

    remove() {
        if (this.currentDialog) {
            this.currentDialog.remove();
            this.currentDialog = null;
        }
    }

    _createDialog(highlight, rect) {
        const dialog = document.createElement('div');
        dialog.className = 'note-dialog';

        if (document.documentElement.classList.contains('dark')) {
            dialog.classList.add('dark');
        }

        const note = highlight.notes[0];
        const timestamp = new Date(note.timestamp).toLocaleDateString();

        dialog.innerHTML = `
            <div class="note-close">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </div>
            <div class="note-content">${note.text}</div>
            <div class="note-timestamp">Added on ${timestamp}</div>
        `;

        return dialog;
    }

    _positionDialog(dialog, rect) {
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const dialogRect = dialog.getBoundingClientRect();

        let top, left;

        // Vertical positioning
        if (rect.top + dialogRect.height + 8 <= viewportHeight) {
            top = rect.bottom + window.scrollY + 8;
        } else if (rect.top - dialogRect.height - 8 >= 0) {
            top = rect.top + window.scrollY - dialogRect.height - 8;
        } else {
            top = window.scrollY + (viewportHeight - dialogRect.height) / 2;
        }

        // Horizontal positioning
        if (rect.left + dialogRect.width + 8 <= viewportWidth) {
            left = rect.left;
        } else {
            left = viewportWidth - dialogRect.width - 8;
        }

        Object.assign(dialog.style, {
            position: 'absolute',
            top: `${top}px`,
            left: `${left}px`,
            zIndex: '2147483647',
            transform: 'translateZ(0)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            maxHeight: '300px',
            overflowY: 'auto'
        });
    }

    _setupEventListeners(mark, dialog) {
        // Close button handler
        dialog.querySelector('.note-close').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.remove();
        });

        // Close on outside click
        setTimeout(() => {
            const handleOutsideClick = (e) => {
                if (!dialog.contains(e.target) && !mark.contains(e.target)) {
                    this.remove();
                    document.removeEventListener('click', handleOutsideClick);
                }
            };
            document.addEventListener('click', handleOutsideClick);
        }, 0);

        // Handle scroll events
        const handleScroll = () => {
            if (dialog) {
                const updatedRect = mark.getBoundingClientRect();
                this._positionDialog(dialog, updatedRect);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        // Cleanup scroll handler when dialog is removed
        const observer = new MutationObserver((mutations) => {
            if (!document.contains(dialog)) {
                window.removeEventListener('scroll', handleScroll);
                observer.disconnect();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }
}