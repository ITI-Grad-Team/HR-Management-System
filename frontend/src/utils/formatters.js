// Utility functions for formatting data in the application

/**
 * Formats time string to HH:MM format (24-hour)
 * @param {string} timeString - Time string in HH:MM:SS format
 * @returns {string} - Formatted time in HH:MM format or default value
 */
export const formatTime = (timeString, defaultValue = '--') => {
    if (!timeString) return defaultValue;

    try {
        // Handle both "HH:MM:SS" and "HH:MM:SS.ffffff" formats
        const timeParts = timeString.split(':');
        if (timeParts.length >= 2) {
            const hours = timeParts[0].padStart(2, '0');
            const minutes = timeParts[1].padStart(2, '0');
            return `${hours}:${minutes}`;
        }
        return defaultValue;
    } catch {
        return defaultValue;
    }
};

/**
 * Converts decimal hours to HH:MM format
 * @param {number} decimalHours - Hours in decimal format (e.g., 1.5 for 1 hour 30 minutes)
 * @param {string} defaultValue - Default value if input is null/undefined/0
 * @returns {string} - Formatted time in HH:MM format or default value
 */
export const formatHoursToTime = (decimalHours, defaultValue = '--') => {
    if (!decimalHours || decimalHours === 0) return defaultValue;

    try {
        const hours = Math.floor(decimalHours);
        const minutes = Math.round((decimalHours - hours) * 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } catch {
        return defaultValue;
    }
};

/**
 * Formats numeric values with appropriate defaults
 * @param {number|string} value - The value to format
 * @param {string} defaultValue - Default value if input is null/undefined
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted value or default
 */
export const formatNumber = (value, defaultValue = '0', decimals = 2) => {
    if (value === null || value === undefined || value === '') return defaultValue;

    const num = parseFloat(value);
    if (isNaN(num)) return defaultValue;

    return decimals > 0 ? num.toFixed(decimals) : Math.round(num).toString();
};

/**
 * Formats text values with appropriate defaults
 * @param {string} value - The value to format
 * @param {string} defaultValue - Default value if input is null/undefined/empty
 * @returns {string} - Formatted value or default
 */
export const formatText = (value, defaultValue = '--') => {
    if (!value || value.trim() === '') return defaultValue;
    return value;
};

/**
 * Formats status values with proper capitalization
 * @param {string} status - Status value
 * @returns {string} - Formatted status
 */
export const formatStatus = (status) => {
    if (!status) return '--';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};
