/**
 * Applies the saved sidebar width and theme before the page is first drawn.
 */
try {
    const sidebarWidth = localStorage.getItem('sidebar-width');
    if (sidebarWidth) {
        document.documentElement.style.setProperty('--sidebar-width', sidebarWidth);
    }

    const theme = localStorage.getItem('theme');
    if (theme === 'light' || theme === 'dark') {
        document.documentElement.dataset.theme = theme;
    }
} catch {
    // apply CSS default
}
