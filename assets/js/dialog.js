/**
 * Opens and closes <dialog> elements as modals, controlled by HTML attributes:
 * - data-dialog-open="<id>" on a button opens the dialog with that id
 * - data-dialog-close on a button closes the dialog it is in
 * - data-open-on-load on a dialog opens it after the page loads (form came back with errors)
 * Esc closing is built into the browser.
 */

/**
 * Opens the dialog as a modal (backdrop, page behind blocked).
 *
 * @param {HTMLDialogElement} dialog
 */
const openDialog = (dialog) => {
    if (!dialog.open) {
        dialog.showModal();
    }
};

const reopenDialogsWithErrors = () => {
    document.querySelectorAll('dialog[data-open-on-load]').forEach(openDialog);
};

const closeAllDialogs = () => {
    document.querySelectorAll('dialog[open]').forEach((dialog) => dialog.close());
};

// Handle all dialogs in the page
document.addEventListener('click', (event) => {
    const openButton = event.target.closest('[data-dialog-open]');
    if (openButton) {
        const dialog = document.getElementById(openButton.dataset.dialogOpen);
        if (dialog) {
            openDialog(dialog);
        }

        return;
    }

    const closeButton = event.target.closest('[data-dialog-close]');
    if (closeButton) {
        closeButton.closest('dialog')?.close();

        return;
    }

    if (event.target instanceof HTMLDialogElement) {
        event.target.close();
    }
});

document.addEventListener('turbo:load', reopenDialogsWithErrors);
document.addEventListener('turbo:render', reopenDialogsWithErrors);

// Close dialogs before Turbo snapshots the page
document.addEventListener('turbo:before-cache', closeAllDialogs);
