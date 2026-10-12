/**
 * On scroll adds the .pinned class to the page header (data-sticky-header) which switches on its glass background.
 */

/**
 * @param {HTMLElement} header
 * @returns {boolean} True while the header sits at its sticky position with content scrolling under it
 */
const isPinned = (header) => {
    const stickyTop = parseFloat(getComputedStyle(header).top);
    const hasScrolled = window.scrollY > 0;

    return hasScrolled && header.getBoundingClientRect().top <= stickyTop + 1;
};

const updateStickyHeader = () => {
    const header = document.querySelector('[data-sticky-header]');
    if (header) {
        header.classList.toggle('pinned', isPinned(header));
    }
};

window.addEventListener('scroll', updateStickyHeader, { passive: true });

document.addEventListener('turbo:load', updateStickyHeader);
document.addEventListener('turbo:render', updateStickyHeader);
