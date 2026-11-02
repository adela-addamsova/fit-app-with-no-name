import type { Locator, Page } from '@playwright/test';

/**
 * The DeleteDialog component that confirms deleting an item.
 */
export class DeleteDialog {
    readonly dialog: Locator;
    readonly title: Locator;
    readonly label: Locator;
    readonly confirm: Locator;
    readonly cancel: Locator;

    constructor(private readonly page: Page, type: string) {
        this.dialog = page.locator(`#delete-${type}`);
        this.title = this.dialog.getByRole('heading');
        this.label = this.dialog.locator('[data-delete-label]');
        this.confirm = this.dialog.getByRole('button', { name: 'Delete' });
        this.cancel = this.dialog.getByRole('button', { name: 'Cancel' });
    }

    /**
     * Clicks the delete button of the item.
     */
    async openFor(label: string): Promise<void> {
        await this.page.getByRole('button', { name: `Delete ${label}` }).click();
    }
}
