/**
 * Theme switch (data-theme-set buttons): "light" or "dark". The choice is set as data-theme on <html>
 * and remembered in localStorage. Until a choice is made, the CSS follows the operating system.
 */

import { tryStorage } from './storage.js';

const STORAGE_KEY = 'theme';

const html = document.documentElement;
const systemDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

/**
 * @returns {'light'|'dark'} The remembered choice, or the operating system's setting if there is none
 */
const currentTheme = () => {
    const saved = tryStorage(() => localStorage.getItem(STORAGE_KEY), null);
    if (saved === 'light' || saved === 'dark') {
        return saved;
    }

    return systemDarkScheme.matches ? 'dark' : 'light';
};

/**
 * Highlights the switch button of the given theme.
 *
 * @param {'light'|'dark'} theme
 */
const markActive = (theme) => {
    document.querySelectorAll('[data-theme-set]').forEach((button) => {
        const isActive = button.dataset.themeSet === theme;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });
};

/**
 * Applies and remembers the theme.
 *
 * @param {'light'|'dark'} theme
 */
const applyTheme = (theme) => {
    html.dataset.theme = theme;
    tryStorage(() => localStorage.setItem(STORAGE_KEY, theme));
    markActive(theme);

    document.dispatchEvent(new Event('themechange'));
};

document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-theme-set]');
    if (button) {
        applyTheme(button.dataset.themeSet);
    }
});

systemDarkScheme.addEventListener('change', () => markActive(currentTheme()));

document.addEventListener('turbo:load', () => markActive(currentTheme()));
