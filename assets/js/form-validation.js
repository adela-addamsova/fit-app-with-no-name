/**
 * Replaces the browser's validation bubbles with inline error messages.
 *
 * - data-field marks each field wrapper (label + input + errors)
 * - data-error-required / data-error-pattern on an input override the default messages
 * - data-decimal on an input turns a typed decimal comma into a dot
 */

/**
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} input
 * @returns {string} The message to show for the input's first failed rule
 */
const errorMessage = (input) => {
    const { validity, dataset } = input;

    if (validity.valueMissing) {
        return dataset.errorRequired || 'This field is required.';
    }
    if (validity.patternMismatch) {
        return dataset.errorPattern || 'Check the format of this value.';
    }

    return input.validationMessage;
};

/**
 * Removes error messages.
 *
 * @param {HTMLElement} field
 */
const clearError = (field) => {
    field.classList.remove('invalid');
    field.querySelectorAll(':scope > .error, :scope > ul').forEach((element) => element.remove());
};

/**
 * @param {HTMLElement} field
 * @param {string} message
 */
const showError = (field, message) => {
    const error = document.createElement('p');
    error.className = 'error';
    error.textContent = message;
    field.append(error);
    field.classList.add('invalid');
};

document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.matches('[data-validate]')) {
        return;
    }

    let firstInvalid = null;
    form.querySelectorAll('[data-field]').forEach((field) => {
        const input = field.querySelector('input:not([type="hidden"]), select, textarea');
        if (!input) {
            return;
        }

        clearError(field);
        if (!input.checkValidity()) {
            showError(field, errorMessage(input));
            firstInvalid ??= input;
        }
    });

    if (firstInvalid) {
        event.preventDefault();
        event.stopImmediatePropagation();
        firstInvalid.focus();
    }
}, true);

// Normalize decimal commas and hide the field's error
document.addEventListener('input', (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
        return;
    }

    if (input.matches('[data-decimal]') && input.value.includes(',')) {
        input.value = input.value.replace(/,/g, '.');
    }

    const field = input.closest('[data-field]');
    if (field) {
        clearError(field);
    }
});
