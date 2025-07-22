/**
 * OPTIMIZED: Simple cache utility for API responses
 * Reduces unnecessary API calls and improves performance
 */

const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const cacheManager = {
    /**
     * Get cached data if still valid
     */
    get: (key) => {
        const cached = cache.get(key);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
        cache.delete(key);
        return null;
    },

    /**
     * Store data in cache
     */
    set: (key, data) => {
        cache.set(key, {
            data,
            timestamp: Date.now()
        });
    },

    /**
     * Clear cache for specific key or pattern
     */
    clear: (keyPattern) => {
        if (keyPattern) {
            for (const key of cache.keys()) {
                if (key.includes(keyPattern)) {
                    cache.delete(key);
                }
            }
        } else {
            cache.clear();
        }
    },

    /**
     * Generate cache key for leave requests
     */
    generateLeaveKey: (page, pageSize, filters) => {
        return `leave_${page}_${pageSize}_${JSON.stringify(filters)}`;
    },

    /**
     * Generate cache key for leave balance
     */
    generateBalanceKey: () => {
        return 'leave_balance';
    }
};

export default cacheManager;
