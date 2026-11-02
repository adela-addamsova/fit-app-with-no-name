/**
 * Fills the delete dialog with the entry of the clicked delete button:
 * - data-delete-entry="<id>" and data-delete-label="<text>" on the button
 * - data-delete-id (hidden input) and data-delete-label (text) in the dialog
 */

document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-delete-entry]');
    if (!button) {
        return;
    }

    const dialog = document.getElementById(button.dataset.dialogOpen);
    if (!dialog) {
        return;
    }

    dialog.querySelector('[data-delete-id]').value = button.dataset.deleteEntry;
    dialog.querySelector('[data-delete-label]').textContent = button.dataset.deleteLabel;
});
