const TIMEZONE = 'Europe/Berlin';

/**
 * @returns The date of the given number of days ago as "Y-m-d", in the timezone the app runs in
 */
export const daysAgo = (days: number): string => {
    const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return date.toLocaleDateString('sv-SE', { timeZone: TIMEZONE });
};

/**
 * Formats a "Y-m-d" date, read it as UTC.
 */
const format = (ymd: string, options: Intl.DateTimeFormatOptions): string =>
    new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(new Date(`${ymd}T00:00:00Z`));

/** "2026-10-05" → "5 Oct" */
export const shortDate = (ymd: string): string => format(ymd, { day: 'numeric', month: 'short' });

/** "2026-10-05" → "5 October 2026" */
export const longDate = (ymd: string): string => format(ymd, { day: 'numeric', month: 'long', year: 'numeric' });

/** "2026-10-05" → "October 2026" */
export const monthYear = (ymd: string): string => format(ymd, { month: 'long', year: 'numeric' });

/** "2026-10-05" → "Monday 5 October 2026", the label of a calendar day */
export const calendarDay = (ymd: string): string =>
    format(ymd, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
