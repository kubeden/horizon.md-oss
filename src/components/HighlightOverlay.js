// src/components/HighlightOverlay.js

export class HighlightOverlay {
    constructor(highlightService, notificationService, noteDialog) {
        if (!window.CSS?.highlights || !window.Highlight) {
            throw new Error('Highlight API not supported in this browser');
        }

        this.highlightService = highlightService;
        this.notificationService = notificationService;
        this.noteDialog = noteDialog;
        this.restorationInProgress = false;
        this.highlightMap = new Map(); // Store both individual and theme highlights
        this._initializeStyles();
    }

    _initializeStyles() {
        if (!document.getElementById('horizon-highlight-styles')) {
            const style = document.createElement('style');
            style.id = 'horizon-highlight-styles';
            style.textContent = `
                ::highlight(horizon-light-underline) {
                    text-decoration: underline;
                    text-decoration-color: rgba(187, 187, 187, 0.8);
                    text-decoration-thickness: 2px;
                    text-decoration-style: dotted;
                    text-underline-offset: 5px;
                }
                
                ::highlight(horizon-dark-underline) {
                    text-decoration: underline;
                    text-decoration-color: rgba(128, 128, 128, 0.5);
                    text-decoration-thickness: 2px;
                    text-decoration-style: dotted;
                    text-underline-offset: 5px;
                }
    
                ::highlight(horizon-light-background) {
                    background-color: rgba(193, 193, 193, 0.3);
                    border-radius: 2px;
                }
                
                ::highlight(horizon-dark-background) {
                    background-color: rgba(186, 186, 186, 0.28);
                    border-radius: 2px;
                }
    
                ::highlight(horizon-attention) {
                    background: rgba(255, 255, 0, 0.3);
                }
            `;
            document.head.appendChild(style);
        }
    }

    _ensureThemeHighlight(theme, style) {
        const key = `theme:${theme}-${style}`;
        if (!this.highlightMap.has(key)) {
            const highlight = new Highlight();
            this.highlightMap.set(key, highlight);
            CSS.highlights.set(`horizon-${theme}-${style}`, highlight);
        }
        return this.highlightMap.get(key);
    }

    async createHighlightOverlay(range, theme = 'light', style = 'underline') {
        if (!range || !range.commonAncestorContainer) {
            console.warn('Invalid range provided');
            return null;
        }

        const highlightData = {
            id: this.highlightService.generateHighlightId(),
            title: document.title,
            body: this._getNormalizedText(range),
            url: window.location.href,
            theme,
            style,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            rangeInfo: this._serializeRange(range)
        };

        try {
            const success = await this._applyHighlight(range, highlightData);
            if (!success) {
                console.warn('Failed to apply highlight');
                return null;
            }

            await this.highlightService.saveHighlight(highlightData);
            return highlightData.id;
        } catch (error) {
            console.error('Error creating highlight:', error);
            return null;
        }
    }

    _getNormalizedText(range) {
        return range.toString().replace(/\s+/g, ' ').trim();
    }

    _applyHighlight(range, highlightData) {
        try {
            // Remove any existing highlight for this range
            const existingKey = Array.from(this.highlightMap.keys())
                .find(key => key === highlightData.id);
            if (existingKey) {
                const existing = this.highlightMap.get(existingKey);
                if (existing?.highlight) {
                    existing.highlight.delete(range);
                }
                this.highlightMap.delete(existingKey);
            }

            // Create new highlight
            const highlight = new Highlight();
            highlight.add(range);

            // Store in map
            this.highlightMap.set(highlightData.id, {
                highlight,
                range: range.cloneRange(),
                theme: highlightData.theme,
                style: highlightData.style
            });

            // Add to theme-style highlight
            const themeStyleHighlight = this._ensureThemeHighlight(
                highlightData.theme,
                highlightData.style
            );
            themeStyleHighlight.add(range);

            return true;
        } catch (error) {
            console.error('Error applying highlight:', error);
            return false;
        }
    }

    async restoreHighlights() {
        if (this.restorationInProgress) return;
        this.restorationInProgress = true;

        try {
            this._removeExistingHighlights();
            const highlights = await this.highlightService.getHighlightsForCurrentPage() || [];

            for (const highlight of highlights) {
                let range = null;

                // Try deserialization first
                if (highlight.rangeInfo) {
                    range = this._deserializeRange(highlight.rangeInfo);
                }

                // Fallback to text search
                if (!range && highlight.body) {
                    range = this._findTextRange(highlight.body);
                }

                if (range) {
                    const theme = highlight.theme || 'light';
                    const style = highlight.style || 'underline';

                    // Create individual highlight
                    const highlightInstance = new Highlight();
                    highlightInstance.add(range);

                    // Store in map
                    this.highlightMap.set(highlight.id, {
                        highlight: highlightInstance,
                        range: range.cloneRange(),
                        theme,
                        style
                    });

                    // Add to theme-style highlight
                    const themeStyleHighlight = this._ensureThemeHighlight(theme, style);
                    themeStyleHighlight.add(range);
                }
            }
        } catch (error) {
            console.error('Error restoring highlights:', error);
        } finally {
            this.restorationInProgress = false;
        }
    }

    _removeExistingHighlights() {
        // Clear CSS highlights
        for (const key of CSS.highlights.keys()) {
            if (key.startsWith('horizon-')) {
                CSS.highlights.delete(key);
            }
        }

        // Clear highlight map
        this.highlightMap.clear();
    }

    async scrollToHighlightGroup(highlightGroup) {
        if (!highlightGroup?.id) {
            console.warn('Invalid highlight provided for scrolling');
            return false;
        }

        try {
            const storedData = this.highlightMap.get(highlightGroup.id);
            if (!storedData) {
                const success = await this._restoreSingleHighlight(highlightGroup);
                if (!success) {
                    console.warn('Could not restore highlight for scrolling');
                    return false;
                }
                const restoredData = this.highlightMap.get(highlightGroup.id);
                if (!restoredData?.range) {
                    return false;
                }
            }

            const { range } = this.highlightMap.get(highlightGroup.id);
            if (!range?.commonAncestorContainer) {
                console.warn('Invalid range for scrolling');
                return false;
            }

            const element = this._getElementFromNode(range.commonAncestorContainer);
            const scrollMargin = 200;
            const rect = element.getBoundingClientRect();
            const absoluteTop = window.pageYOffset + rect.top - scrollMargin;

            // Try different scrolling methods
            await this._tryScrollMethods(range, absoluteTop, scrollMargin);

            // Add attention animation regardless of scroll success
            await new Promise(resolve => setTimeout(resolve, 100));

            // Remove any existing attention highlight
            CSS.highlights.delete('horizon-attention');

            // Add attention animation
            const attentionHighlight = new Highlight();
            attentionHighlight.add(range);
            CSS.highlights.set('horizon-attention', attentionHighlight);

            // Keep the attention highlight visible longer
            setTimeout(() => {
                CSS.highlights.delete('horizon-attention');
            }, 1000);

            return true;
        } catch (error) {
            console.error('Error scrolling to highlight:', error);
            return false;
        }
    }

    // Updated _getScrollableParent to handle text nodes
    _getScrollableParent(node) {
        const element = this._getElementFromNode(node);
        if (!element) return document.body;

        const style = window.getComputedStyle(element);
        const excludeStaticParent = style.position === "absolute";
        const overflowRegex = /(auto|scroll)/;

        if (style.position === "fixed") return document.body;

        for (let parent = element.parentElement; parent; parent = parent.parentElement) {
            const style = window.getComputedStyle(parent);
            if (excludeStaticParent && style.position === "static") continue;

            if (overflowRegex.test(style.overflow + style.overflowY)) return parent;
        }

        return document.body;
    }

    // Helper method to get the element node from a node
    _getElementFromNode(node) {
        return node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    }

    // Updated _isElementInViewport to handle text nodes
    _isElementInViewport(node) {
        const element = this._getElementFromNode(node);
        if (!element) return false;

        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;

        return (
            rect.bottom > 0 &&
            rect.right > 0 &&
            rect.top < windowHeight &&
            rect.left < windowWidth
        );
    }

    // Method to try different scrolling approaches
    async _tryScrollMethods(range, absoluteTop, scrollMargin) {
        const element = this._getElementFromNode(range.commonAncestorContainer);

        const createScrollEndPromise = (target) => {
            return new Promise((resolve) => {
                let lastScrollTop = target === document ?
                    (window.pageYOffset || document.documentElement.scrollTop) :
                    target.scrollTop;
                let scrollTimeout;

                const handleScroll = () => {
                    clearTimeout(scrollTimeout);

                    scrollTimeout = setTimeout(() => {
                        const currentScrollTop = target === document ?
                            (window.pageYOffset || document.documentElement.scrollTop) :
                            target.scrollTop;

                        if (currentScrollTop === lastScrollTop) {
                            target.removeEventListener('scroll', handleScroll);
                            resolve();
                        }
                        lastScrollTop = currentScrollTop;
                    }, 20); // Reduced from 50ms to 20ms for quicker detection
                };

                target.addEventListener('scroll', handleScroll, { passive: true });

                // Failsafe: resolve after 300ms if scroll doesn't complete
                setTimeout(() => {
                    target.removeEventListener('scroll', handleScroll);
                    resolve();
                }, 300); // Reduced from 1000ms to 300ms

                // Initial check in case scroll happens very quickly
                handleScroll();
            });
        };

        const verifyScroll = () => {
            const rect = element.getBoundingClientRect();
            return Math.abs(rect.top - scrollMargin) < 10;
        };

        // Method 1: window.scrollTo
        try {
            const rect = element.getBoundingClientRect();
            const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
            const targetTop = currentScroll + rect.top - scrollMargin;

            const scrollPromise = createScrollEndPromise(document);

            window.scrollTo({
                top: targetTop,
                behavior: 'smooth'
            });

            console.log("scrolled Method 1");
            await scrollPromise;

            if (verifyScroll()) {
                return true;
            }
        } catch (e) {
            console.warn('window.scrollTo failed:', e);
        }

        // Method 2: scrollIntoView
        try {
            const scrollPromise = createScrollEndPromise(document);

            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            await scrollPromise;

            if (scrollMargin) {
                const marginScrollPromise = createScrollEndPromise(document);
                window.scrollBy({
                    top: -scrollMargin,
                    behavior: 'smooth'
                });
                await marginScrollPromise;
            }

            console.log("scrolled Method 2");
            if (verifyScroll()) {
                return true;
            }
        } catch (e) {
            console.warn('scrollIntoView failed:', e);
        }

        // Method 3: scrollable parent
        try {
            const scrollableParent = this._getScrollableParent(range.commonAncestorContainer);
            const rect = element.getBoundingClientRect();
            const parentRect = scrollableParent.getBoundingClientRect();

            const relativeTop = rect.top - parentRect.top;
            const targetTop = scrollableParent.scrollTop + relativeTop - scrollMargin;

            const scrollPromise = createScrollEndPromise(scrollableParent);

            scrollableParent.scrollTo({
                top: targetTop,
                behavior: 'smooth'
            });

            console.log("scrolled Method 3");
            await scrollPromise;

            if (verifyScroll()) {
                return true;
            }
        } catch (e) {
            console.warn('Scrollable parent scroll failed:', e);
        }

        return this._isElementInViewport(range.commonAncestorContainer);
    }

    async _restoreSingleHighlight(highlight) {
        try {
            let range = null;

            // Try deserialization first
            if (highlight.rangeInfo) {
                range = this._deserializeRange(highlight.rangeInfo);
            }

            // Fallback to text search
            if (!range && highlight.body) {
                range = this._findTextRange(highlight.body);
            }

            if (!range) {
                return false;
            }

            const theme = highlight.theme || 'light';
            const style = highlight.style || 'underline';

            // Create individual highlight
            const highlightInstance = new Highlight();
            highlightInstance.add(range);

            // Store in map
            this.highlightMap.set(highlight.id, {
                highlight: highlightInstance,
                range: range.cloneRange(),
                theme,
                style
            });

            // Add to theme-style highlight
            const themeStyleHighlight = this._ensureThemeHighlight(theme, style);
            themeStyleHighlight.add(range);

            return true;
        } catch (error) {
            console.error('Error restoring single highlight:', error);
            return false;
        }
    }

    async updateHighlightTheme(highlightId, oldTheme, newTheme) {
        try {
            const storedData = this.highlightMap.get(highlightId);
            if (!storedData) {
                console.warn('Highlight not found');
                return false;
            }

            const { range } = storedData;

            // Remove from old theme
            const oldThemeHighlight = this.highlightMap.get(`theme:${oldTheme}`);
            if (oldThemeHighlight) {
                oldThemeHighlight.delete(range);
            }

            // Add to new theme
            const newThemeHighlight = this._ensureThemeHighlight(newTheme);
            newThemeHighlight.add(range);

            // Update stored data
            storedData.theme = newTheme;

            // Update in storage
            const highlightData = await this.highlightService.getHighlight(highlightId);
            if (highlightData) {
                highlightData.theme = newTheme;
                highlightData.updated_at = new Date().toISOString();
                await this.highlightService.updateHighlight(highlightData);
            }

            return true;
        } catch (error) {
            console.error('Error updating highlight theme:', error);
            return false;
        }
    }

    async updateHighlightStyle(highlightId, oldStyle, newStyle) {
        try {
            const storedData = this.highlightMap.get(highlightId);
            if (!storedData) {
                console.warn('Highlight not found');
                return false;
            }

            const { range, theme } = storedData;

            // Store the current state of all highlights
            const currentHighlights = new Map();
            for (const [key, value] of this.highlightMap.entries()) {
                if (value.range && value.theme && value.style) {
                    currentHighlights.set(key, {
                        range: value.range.cloneRange(),
                        theme: value.theme,
                        style: value.style
                    });
                }
            }

            // Update the style for the target highlight
            storedData.style = newStyle;

            // Clear all existing highlights
            this._removeExistingHighlights();

            // Reapply all highlights with updated styles
            for (const [key, value] of currentHighlights.entries()) {
                const style = key === highlightId ? newStyle : value.style;
                const highlight = new Highlight();
                highlight.add(value.range);

                this.highlightMap.set(key, {
                    highlight,
                    range: value.range.cloneRange(),
                    theme: value.theme,
                    style
                });

                const themeStyleHighlight = this._ensureThemeHighlight(value.theme, style);
                themeStyleHighlight.add(value.range);
            }

            // Update in storage service
            await this.highlightService.updateHighlightStyle(highlightId, newStyle);

            return true;
        } catch (error) {
            console.error('Error updating highlight style:', error);
            return false;
        }
    }

    // Keep your existing range serialization and restoration methods
    _serializeRange(range) {
        return {
            start: this._getNodePath(range.startContainer, range.startOffset),
            end: this._getNodePath(range.endContainer, range.endOffset)
        };
    }

    _getNodePath(node, offset) {
        const path = [];
        let currentNode = node;
        let childIndex = -1;

        if (node.nodeType === Node.TEXT_NODE) {
            childIndex = Array.from(node.parentNode.childNodes).indexOf(node);
            currentNode = node.parentNode;
        }

        while (currentNode && currentNode !== document.documentElement) {
            const parent = currentNode.parentNode;
            if (!parent) break;

            const siblings = Array.from(parent.childNodes)
                .filter(n => n.nodeType === Node.ELEMENT_NODE);
            const index = siblings.indexOf(currentNode);

            if (index > -1) {
                path.unshift(index);
            }
            currentNode = parent;
        }

        return {
            path,
            offset,
            nodeType: node.nodeType,
            childIndex: childIndex > -1 ? childIndex : undefined
        };
    }

    _deserializeRange(rangeInfo) {
        try {
            const getNode = (info) => {
                let node = document.documentElement;

                for (const index of info.path) {
                    const children = Array.from(node.childNodes)
                        .filter(n => n.nodeType === Node.ELEMENT_NODE);
                    node = children[index];
                    if (!node) return null;
                }

                if (info.nodeType === Node.TEXT_NODE && typeof info.childIndex === 'number') {
                    const textNode = Array.from(node.childNodes)[info.childIndex];
                    return textNode?.nodeType === Node.TEXT_NODE ? textNode : null;
                }

                return node;
            };

            const startContainer = getNode(rangeInfo.start);
            const endContainer = getNode(rangeInfo.end);

            if (!startContainer || !endContainer) return null;

            const range = document.createRange();
            range.setStart(startContainer, rangeInfo.start.offset);
            range.setEnd(endContainer, rangeInfo.end.offset);
            return range;
        } catch (error) {
            console.warn('Range deserialization failed:', error);
            return null;
        }
    }

    _findTextRange(text) {
        if (!text) return null;

        const normalizedSearchText = text.trim().replace(/\s+/g, ' ');
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Skip empty nodes and those within existing highlights
                    if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
                    if (node.parentElement?.classList?.contains('horizon-highlight')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        let node;
        let currentRange = document.createRange();
        let currentText = '';
        let nodes = [];

        // Collect text nodes until we have enough content
        while ((node = walker.nextNode())) {
            nodes.push(node);
            currentText += node.textContent;

            // Normalize the accumulated text
            const normalizedText = currentText.replace(/\s+/g, ' ').trim();

            // Check if we have a match
            const startPos = normalizedText.indexOf(normalizedSearchText);
            if (startPos !== -1) {
                // Found a potential match, now create the exact range
                let currentPos = 0;
                let startNode = null;
                let startOffset = 0;
                let endNode = null;
                let endOffset = 0;
                let textBeforeMatch = normalizedText.substring(0, startPos);
                let matchLength = normalizedSearchText.length;

                // Find start position
                for (let i = 0; i < nodes.length; i++) {
                    let nodeText = nodes[i].textContent;
                    let nodeLength = nodeText.length;

                    if (!startNode && currentPos + nodeLength > textBeforeMatch.length) {
                        startNode = nodes[i];
                        startOffset = textBeforeMatch.length - currentPos;
                        if (currentPos + nodeLength >= textBeforeMatch.length + matchLength) {
                            endNode = nodes[i];
                            endOffset = startOffset + matchLength;
                            break;
                        }
                    } else if (startNode && !endNode) {
                        if (currentPos + nodeLength >= textBeforeMatch.length + matchLength) {
                            endNode = nodes[i];
                            endOffset = textBeforeMatch.length + matchLength - currentPos;
                            break;
                        }
                    }
                    currentPos += nodeLength;
                }

                if (startNode && endNode) {
                    try {
                        const range = document.createRange();
                        range.setStart(startNode, startOffset);
                        range.setEnd(endNode, endOffset);

                        // Verify the range content matches our search text
                        if (range.toString().replace(/\s+/g, ' ').trim() === normalizedSearchText) {
                            return range;
                        }
                    } catch (e) {
                        console.warn('Invalid range creation attempt:', e);
                    }
                }
            }

            // Limit the buffer size to avoid memory issues
            if (currentText.length > normalizedSearchText.length * 3) {
                nodes.shift();
                currentText = nodes.map(n => n.textContent).join('');
            }
        }

        return null;
    }
}