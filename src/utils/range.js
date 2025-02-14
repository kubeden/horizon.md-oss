// src/utils/range.js
import { createXPathFromNode, safeGetTextContent } from './dom';

export const validateRangeContent = (range, expectedText) => {
    if (!range || !expectedText) {
        console.warn('Invalid input to validateRangeContent');
        return false;
    }

    try {
        const actualText = range.toString().trim();
        if (!actualText) return false;

        const normalizedActual = actualText.replace(/\s+/g, ' ');
        const normalizedExpected = expectedText.trim().replace(/\s+/g, ' ');

        if (normalizedActual === normalizedExpected) return true;
        if (normalizedActual.includes(normalizedExpected)) return true;
        if (normalizedExpected.includes(normalizedActual)) return true;

        return false;
    } catch (e) {
        console.error('Error validating range content:', e);
        return false;
    }
};

export const serializeRange = (range) => {
    if (!range) return null;

    const content = range.toString().trim();
    if (!content) return null;

    try {
        // Get ancestor element that fully contains the range
        let container = range.commonAncestorContainer;
        if (container.nodeType === Node.TEXT_NODE) {
            container = container.parentNode;
        }

        // Create serialized data
        const serialized = {
            text: content,
            // Store the full HTML content of the container for context
            containerHTML: container.innerHTML,
            // Store the starting position of the selection within the container
            textOffset: findTextOffset(range.startContainer, container, range.startOffset),
            // Store the length of the selected text
            textLength: content.length
        };

        return serialized;
    } catch (error) {
        console.error('Error serializing range:', error);
        return null;
    }
};

export const deserializeRange = (serialized, container) => {
    if (!serialized || !container) return null;

    try {
        // Find all text nodes in the container
        const textNodes = [];
        const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        // Find the correct text nodes and offsets
        let currentOffset = 0;
        let startNode = null, endNode = null;
        let startOffset = 0, endOffset = 0;

        for (const node of textNodes) {
            const nodeLength = node.textContent.length;

            // Check if this node contains the start of the range
            if (currentOffset <= serialized.textOffset &&
                serialized.textOffset < currentOffset + nodeLength) {
                startNode = node;
                startOffset = serialized.textOffset - currentOffset;
            }

            // Check if this node contains the end of the range
            if (currentOffset <= serialized.textOffset + serialized.textLength &&
                serialized.textOffset + serialized.textLength <= currentOffset + nodeLength) {
                endNode = node;
                endOffset = serialized.textOffset + serialized.textLength - currentOffset;
                break;
            }

            currentOffset += nodeLength;
        }

        if (!startNode || !endNode) return null;

        // Create and return the range
        const range = document.createRange();
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);

        return range;
    } catch (error) {
        console.error('Error deserializing range:', error);
        return null;
    }
};

// Helper function to find text offset within container
const findTextOffset = (node, container, offset) => {
    let currentOffset = 0;
    const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    let currentNode;
    while (currentNode = walker.nextNode()) {
        if (currentNode === node) {
            return currentOffset + offset;
        }
        currentOffset += currentNode.textContent.length;
    }
    return offset;
};