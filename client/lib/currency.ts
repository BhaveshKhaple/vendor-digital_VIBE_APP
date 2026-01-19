/**
 * Currency formatting utilities for Indian Rupees (₹)
 */

export const CURRENCY_SYMBOL = '₹';
export const CURRENCY_LOCALE = 'en-IN';

/**
 * Format a number as Indian Rupees
 * @param value - The numeric value to format
 * @param showSign - Whether to show + or - sign
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, showSign: boolean = false): string {
    const absValue = Math.abs(value);
    const formatted = absValue.toLocaleString(CURRENCY_LOCALE, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });

    if (showSign) {
        const sign = value >= 0 ? '+' : '-';
        return `${sign}${CURRENCY_SYMBOL}${formatted}`;
    }

    return `${CURRENCY_SYMBOL}${formatted}`;
}

/**
 * Format currency with sign prefix
 */
export function formatCurrencyWithSign(value: number): string {
    return formatCurrency(value, true);
}
