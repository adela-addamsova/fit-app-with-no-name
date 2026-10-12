/**
 * Runs a localStorage action without failing when storage is unavailable.
 *
 * @template Result
 * @param {() => Result} action
 * @param {Result} [fallback]
 * @returns {Result}
 */
export const tryStorage = (action, fallback) => {
    try {
        return action();
    } catch {
        return fallback;
    }
};
