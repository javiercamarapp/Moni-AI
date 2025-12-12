/**
 * Cache Service for localStorage persistence
 * 
 * Provides user-scoped caching with TTL validation.
 * Cache invalidates on login and transaction changes.
 */

// Default TTL: 24 hours
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
// Short TTL for frequently changing data: 1 hour
const SHORT_TTL_MS = 60 * 60 * 1000;

const CACHE_PREFIX = 'moni_cache';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

/**
 * Get current user ID from Supabase session stored in localStorage
 */
const getCurrentUserId = (): string | null => {
    try {
        const supabaseAuthKey = Object.keys(localStorage).find(key =>
            key.startsWith('sb-') && key.includes('auth-token')
        );

        if (!supabaseAuthKey) return null;

        const authData = localStorage.getItem(supabaseAuthKey);
        if (!authData) return null;

        const parsed = JSON.parse(authData);
        return parsed?.user?.id || null;
    } catch {
        return null;
    }
};

/**
 * Build cache key with user scope
 */
const buildCacheKey = (key: string, userId?: string): string => {
    const uid = userId || getCurrentUserId();
    if (!uid) return `${CACHE_PREFIX}_${key}`;
    return `${CACHE_PREFIX}_${uid}_${key}`;
};

/**
 * Get cached data from localStorage
 * Returns null if cache is expired or doesn't exist
 */
export const getCache = <T>(key: string, userId?: string): T | null => {
    try {
        const cacheKey = buildCacheKey(key, userId);
        const stored = localStorage.getItem(cacheKey);

        if (!stored) return null;

        const entry: CacheEntry<T> = JSON.parse(stored);
        const now = Date.now();

        // Check if cache is expired
        if (now - entry.timestamp > entry.ttl) {
            localStorage.removeItem(cacheKey);
            return null;
        }

        return entry.data;
    } catch (error) {
        console.warn('Cache read error:', error);
        return null;
    }
};

/**
 * Set data in localStorage cache
 */
export const setCache = <T>(
    key: string,
    data: T,
    ttl: number = DEFAULT_TTL_MS,
    userId?: string
): void => {
    try {
        const cacheKey = buildCacheKey(key, userId);
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl,
        };
        localStorage.setItem(cacheKey, JSON.stringify(entry));
    } catch (error) {
        console.warn('Cache write error:', error);
        // If localStorage is full, try to clear old cache entries
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            clearExpiredCache();
        }
    }
};

/**
 * Remove specific cache entry
 */
export const removeCache = (key: string, userId?: string): void => {
    const cacheKey = buildCacheKey(key, userId);
    localStorage.removeItem(cacheKey);
};

/**
 * Invalidate all cache for current user
 * Called on login, logout, or transaction changes
 */
export const invalidateAllCache = (userId?: string): void => {
    const uid = userId || getCurrentUserId();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
            // If userId provided, only remove that user's cache
            if (uid && key.includes(uid)) {
                keysToRemove.push(key);
            } else if (!uid) {
                // No userId, remove all cache entries
                keysToRemove.push(key);
            }
        }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`Cache invalidated: ${keysToRemove.length} entries removed`);
};

/**
 * Clear expired cache entries
 */
export const clearExpiredCache = (): void => {
    const keysToCheck: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
            keysToCheck.push(key);
        }
    }

    const now = Date.now();
    let cleared = 0;

    keysToCheck.forEach(key => {
        try {
            const stored = localStorage.getItem(key);
            if (stored) {
                const entry = JSON.parse(stored);
                if (now - entry.timestamp > entry.ttl) {
                    localStorage.removeItem(key);
                    cleared++;
                }
            }
        } catch {
            // Invalid entry, remove it
            localStorage.removeItem(key);
            cleared++;
        }
    });

    console.log(`Cleared ${cleared} expired cache entries`);
};

// Cache key constants for consistent usage
export const CACHE_KEYS = {
    BUDGETS: 'budgets',
    CATEGORIES: 'categories',
    MONTHLY_EXPENSES: 'monthlyExpenses',
    TRANSACTIONS: 'transactions',
    SCORE_MONI: 'scoreMoni',
    NET_WORTH: 'netWorth',
    GOALS: 'goals',
    MONTHLY_TOTALS: 'monthlyTotals',
    BANK_CONNECTIONS: 'bankConnections',
    ACCOUNTS_LIST: 'accountsList',
    TOP_CATEGORIES: 'topCategories',
} as const;

// TTL constants
export const CACHE_TTL = {
    DEFAULT: DEFAULT_TTL_MS,
    SHORT: SHORT_TTL_MS,
    // Transactions change frequently
    TRANSACTIONS: SHORT_TTL_MS,
    // Monthly expenses might change
    MONTHLY_DATA: SHORT_TTL_MS,
    // Static data can last longer
    CATEGORIES: DEFAULT_TTL_MS,
    BUDGETS: DEFAULT_TTL_MS,
} as const;
