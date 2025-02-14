export const createHighlightStyles = () => {
    const style = document.createElement('style');
    style.textContent = `

        .horizon-highlight {
            color: unset;
        }
            
        .horizon-highlight[data-theme=dark] {
            background: transparent !important;
            border-bottom: 2px dashed white;
        }

        .horizon-highlight[data-theme=light] {
            background: transparent !important;
            border-bottom: 2px dashed gray;
        }
    
        .horizon-highlight-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 2147483646;
        }

        .horizon-highlight-group {
            position: absolute;
            top: 0;
            left: 0;
            pointer-events: auto;
            cursor: pointer;
        }

        .horizon-highlight-overlay {
            position: absolute;
            background-color: transparent;
            mix-blend-mode: multiply;
            border-radius: 2px;
            transition: all 0.2s ease;
        }

        .horizon-highlight-group:hover .horizon-highlight-overlay {
            background-color: transparent;
        }

        @keyframes highlightPulse {
            0% { 
                transform: scale(1); 
                box-shadow: 0 0 0 0 rgba(33, 150, 243, 0); 
            }
            20% { 
                transform: scale(1.02); 
                box-shadow: 0 0 0 4px rgba(33, 150, 243, 0.4); 
            }
            100% { 
                transform: scale(1); 
                box-shadow: 0 0 0 0 rgba(33, 150, 243, 0); 
            }
        }

        .note-indicator {
            position: absolute;
            background: rgba(33, 150, 243, 0.9);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
            z-index: 2147483647;
            font-family: system-ui, -apple-system, sans-serif;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .note-dialog {
            position: fixed;
            background: white;
            border-radius: 8px;
            padding: 16px;
            min-width: 200px;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 2147483647;
            font-family: system-ui, -apple-system, sans-serif;
            pointer-events: auto;
            animation: fadeIn 0.2s ease;
        }

        .horizon-note-dialog {
            position: absolute;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 1rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            min-width: 300px;
            max-width: 500px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .horizon-note-dialog.active {
            pointer-events: all;
            opacity: 1;
        }

        @media (prefers-color-scheme: dark) {
            .horizon-highlight-overlay {
                background-color: rgba(255, 255, 255, 0.2);
            }

            .horizon-highlight-group:hover .horizon-highlight-overlay {
                background-color: rgba(255, 255, 255, 0.3);
            }

            .note-dialog {
                background: #1a1a1a;
                color: #e4e4e4;
            }
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    return style;
};