// src/utils/dom.js

export const findNodeByXPath = (xpath) => {
    if (!xpath) {
        console.warn('No XPath provided');
        return null;
    }

    try {
        const result = document.evaluate(
            xpath,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        );
        const node = result.singleNodeValue;

        if (!node || (node.nodeType !== Node.TEXT_NODE && node.nodeType !== Node.ELEMENT_NODE)) {
            console.warn('Invalid node type or missing node for XPath:', xpath);
            return null;
        }

        return node;
    } catch (e) {
        console.warn('XPath evaluation failed:', e, xpath);
        return null;
    }
};

export const createXPathFromNode = (node) => {
    if (!node) {
        console.warn('No node provided to createXPathFromNode');
        return '';
    }

    try {
        let xpath = '';
        const nodeType = node.nodeType;

        // Handle text nodes
        if (nodeType === Node.TEXT_NODE) {
            let textPosition = 1;
            let sibling = node;

            while ((sibling = sibling.previousSibling)) {
                if (sibling.nodeType === Node.TEXT_NODE) {
                    textPosition++;
                }
            }

            xpath = `text()[${textPosition}]`;
            node = node.parentNode;
        }

        // Build the xpath
        while (node && node !== document.documentElement) {
            let nodeName = node.nodeName ? node.nodeName.toLowerCase() : '';
            if (!nodeName) break;

            let position = 1;
            let sibling = node;

            while ((sibling = sibling.previousSibling)) {
                if (sibling.nodeType === Node.ELEMENT_NODE &&
                    sibling.nodeName.toLowerCase() === nodeName) {
                    position++;
                }
            }

            xpath = `/${nodeName}[${position}]${xpath ? '/' + xpath : ''}`;
            node = node.parentNode;
        }

        return `/html${xpath}`;
    } catch (error) {
        console.error('Error creating XPath:', error);
        return '';
    }
};

export const extractTextNodesInRange = (range) => {
    if (!range || !range.commonAncestorContainer) {
        console.warn('Invalid range provided to extractTextNodesInRange');
        return [];
    }

    const textNodes = [];
    try {
        let container = range.commonAncestorContainer;

        // Ensure we have the proper container
        if (container.nodeType === Node.TEXT_NODE) {
            container = container.parentNode;
        }

        if (!container) {
            console.warn('No valid container found for range');
            return [];
        }

        const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function (node) {
                    if (!node || !node.textContent) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    try {
                        const nodeRange = document.createRange();
                        nodeRange.selectNode(node);

                        const isInRange = (
                            (range.compareBoundaryPoints(Range.START_TO_START, nodeRange) <= 0 ||
                                range.intersectsNode(node)) &&
                            (range.compareBoundaryPoints(Range.END_TO_END, nodeRange) >= 0 ||
                                range.intersectsNode(node))
                        );

                        if (isInRange) {
                            const nodeContent = node.textContent;
                            if (!nodeContent || !nodeContent.trim()) {
                                return NodeFilter.FILTER_REJECT;
                            }
                            return NodeFilter.FILTER_ACCEPT;
                        }
                        return NodeFilter.FILTER_REJECT;
                    } catch (error) {
                        console.error('Error in acceptNode:', error);
                        return NodeFilter.FILTER_REJECT;
                    }
                }
            }
        );

        let node;
        while ((node = walker.nextNode())) {
            try {
                if (node && (
                    node === range.startContainer ||
                    node === range.endContainer ||
                    (range.intersectsNode(node) && node.textContent && node.textContent.trim().length > 0)
                )) {
                    textNodes.push(node);
                }
            } catch (error) {
                console.error('Error processing node:', error);
            }
        }

        return textNodes.sort((a, b) => {
            try {
                const position = a.compareDocumentPosition(b);
                return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
            } catch (error) {
                console.error('Error comparing nodes:', error);
                return 0;
            }
        });
    } catch (e) {
        console.error('Error extracting text nodes:', e);
        return [];
    }
};

// Helper function to safely get text content
export const safeGetTextContent = (node) => {
    try {
        return node && node.textContent ? node.textContent.trim() : '';
    } catch (error) {
        console.error('Error getting text content:', error);
        return '';
    }
};