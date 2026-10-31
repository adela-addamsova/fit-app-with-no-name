/**
 * Replaces the browser's validation bubbles with inline error messages.
 *
 * - data-field marks each field wrapper (label + input + errors)
 * - data-error-required / data-error-pattern on an input override the default messages
 * - data-decimal on an input turns a typed decimal comma into a dot and removes anything but digits and dots
 *
 * Closing a dialog empties its form, so it opens clean next time.
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

    const input = field.querySelector('[aria-invalid]');
    if (input) {
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
    }
};

/**
 * Shows the message under the field and links it to the input for screen readers.
 *
 * @param {HTMLElement} field
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} input
 * @param {string} message
 */
const showError = (field, input, message) => {
    const error = document.createElement('p');
    error.id = `${input.id}-error`;
    error.className = 'error';
    error.setAttribute('role', 'alert');
    error.textContent = message;
    field.append(error);
    field.classList.add('invalid');

    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', error.id);
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
            showError(field, input, errorMessage(input));
            firstInvalid ??= input;
        }
    });

    if (firstInvalid) {
        event.preventDefault();
        event.stopImmediatePropagation();
        firstInvalid.focus();
    }
}, true);

/**
 * Empties the form's fields and removes all its errors.
 *
 * @param {HTMLFormElement} form
 */
const resetForm = (form) => {
    form.querySelectorAll(':scope > ul').forEach((element) => element.remove());

    form.querySelectorAll('[data-field]').forEach((field) => {
        clearError(field);

        const input = field.querySelector('input:not([type="hidden"]), textarea');
        if (input) {
            input.value = '';
        }
    });
};

document.addEventListener('close', (event) => {
    if (event.target instanceof HTMLDialogElement) {
        event.target.querySelectorAll('form[data-validate]').forEach(resetForm);
    }
}, true);

// Keep decimal inputs to digits and dots, and hide the field's error
document.addEventListener('input', (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
        return;
    }

    if (input.matches('[data-decimal]')) {
        const decimal = input.value.replace(/,/g, '.').replace(/[^0-9.]/g, '');

        if (decimal !== input.value) {
            input.value = decimal;
        }
    }

    const field = input.closest('[data-field]');
    if (field) {
        clearError(field);
    }
});
