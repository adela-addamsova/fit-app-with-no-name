/**
 * Resizable sidebar: drag its right edge (data-sidebar-resizer) to change width. Double-click resets to the default width.
 *
 * The width lives in the --sidebar-width CSS variable on <html>, and is remembered in localStorage.
 */

import { tryStorage } from './storage.js';

const MIN_WIDTH = 192;
const MAX_WIDTH = 352;
const STORAGE_KEY = 'sidebar-width';
const HANDLE = '[data-sidebar-resizer]';

const html = document.documentElement;

/**
 * Sets the sidebar width, kept between MIN_WIDTH and MAX_WIDTH.
 *
 * @param {number} pixels
 */
const setWidth = (pixels) => {
    const width = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(pixels)));
    html.style.setProperty('--sidebar-width', `${width}px`);
};

const saveWidth = () => {
    tryStorage(() => localStorage.setItem(STORAGE_KEY, html.style.getPropertyValue('--sidebar-width')));
};

/**
 * Back to the default width from the SCSS.
 */
const resetWidth = () => {
    html.style.removeProperty('--sidebar-width');
    tryStorage(() => localStorage.removeItem(STORAGE_KEY));
};

// Dragging with mouse, pen or touch
document.addEventListener('pointerdown', (event) => {
    const handle = event.target.closest(HANDLE);
    if (!handle || event.button !== 0) {
        return;
    }

    event.preventDefault();
    handle.setPointerCapture(event.pointerId);
    document.body.classList.add('resizing');

    const onMove = (moveEvent) => setWidth(moveEvent.clientX);
    const onEnd = () => {
        handle.removeEventListener('pointermove', onMove);
        document.body.classList.remove('resizing');
        saveWidth();
    };

    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onEnd, { once: true });
    handle.addEventListener('pointercancel', onEnd, { once: true });
});

document.addEventListener('dblclick', (event) => {
    if (event.target.closest(HANDLE)) {
        resetWidth();
    }
});
