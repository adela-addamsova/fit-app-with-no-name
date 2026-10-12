/**
 * Inline month calendar for picking a date. The chosen day is written as "Y-m-d"
 * into the hidden input inside the element marked with data-datepicker.
 */

// Parse and format dates

/**
 * @param {number} number
 * @returns {string} The number with a leading zero if needed 5 → "05"
 */
const twoDigits = (number) => String(number).padStart(2, '0');

/**
 * Formats a date as "Y-m-d" (e.g. "2026-10-05")
 * @param {Date} date
 * @returns {string}
 */
const toYmd = (date) => {
    const year = date.getFullYear();
    const month = twoDigits(date.getMonth() + 1);
    const day = twoDigits(date.getDate());

    return `${year}-${month}-${day}`;
};

/**
 * Turns a "Y-m-d" string back into a date at local midnight.
 *
 * @param {string} ymd
 * @returns {Date}
 */
const parseYmd = (ymd) => {
    const [year, month, day] = ymd.split('-').map(Number);

    return new Date(year, month - 1, day);
};

/**
 * @param {Date} date
 * @returns {Date} The 1st day of the same month
 */
const firstOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

/**
 * Starts calendar week from Monday
 *
 * @param {Date} date
 * @returns {number}
 */
const weekdayFromMonday = (date) => (date.getDay() + 6) % 7;

// English format
const monthTitle = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });
const longDate = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Redraws the month title, the next-month arrow and the day buttons.
 *
 * @param {HTMLElement} datepicker
 */
const renderCalendar = (datepicker) => {
    const input = datepicker.querySelector('[data-date-input]');
    const selected = input.value;
    const today = toYmd(new Date());
    const shownMonth = parseYmd(datepicker.dataset.shownMonth);

    datepicker.querySelector('[data-date-title]').textContent = monthTitle.format(shownMonth);
    datepicker.querySelector('[data-date-nav="1"]').disabled = toYmd(shownMonth) >= toYmd(firstOfMonth(new Date()));

    const cells = [];
    const emptyCellsBeforeFirstDay = weekdayFromMonday(shownMonth);
    for (let i = 0; i < emptyCellsBeforeFirstDay; i++) {
        cells.push(document.createElement('span'));
    }

    const daysInMonth = new Date(shownMonth.getFullYear(), shownMonth.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(shownMonth.getFullYear(), shownMonth.getMonth(), day);
        const ymd = toYmd(date);
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = String(day);
        button.dataset.date = ymd;
        button.setAttribute('aria-label', longDate.format(date));
        button.setAttribute('aria-pressed', String(ymd === selected));
        button.classList.toggle('selected', ymd === selected);
        button.classList.toggle('today', ymd === today);
        button.disabled = ymd > today;
        cells.push(button);
    }

    datepicker.querySelector('[data-date-grid]').replaceChildren(...cells);
};

/**
 * Prepares every datepicker on the page.
 */
const initDatepickers = () => {
    document.querySelectorAll('[data-datepicker]').forEach((datepicker) => {
        const input = datepicker.querySelector('[data-date-input]');
        if (!input.value) {
            input.value = toYmd(new Date());
        }
        datepicker.dataset.shownMonth = toYmd(firstOfMonth(parseYmd(input.value)));
        renderCalendar(datepicker);
    });
};

document.addEventListener('click', (event) => {
    const datepicker = event.target.closest('[data-datepicker]');
    if (!datepicker) {
        return;
    }

    const arrow = event.target.closest('[data-date-nav]');
    if (arrow) {
        const shownMonth = parseYmd(datepicker.dataset.shownMonth);
        shownMonth.setMonth(shownMonth.getMonth() + Number(arrow.dataset.dateNav));
        datepicker.dataset.shownMonth = toYmd(shownMonth);
        renderCalendar(datepicker);

        return;
    }

    const dayButton = event.target.closest('[data-date]');
    if (dayButton) {
        datepicker.querySelector('[data-date-input]').value = dayButton.dataset.date;
        renderCalendar(datepicker);
    }
});

document.addEventListener('turbo:load', initDatepickers);
document.addEventListener('turbo:render', initDatepickers);
