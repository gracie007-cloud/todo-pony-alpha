/**
 * Query Parameters Utility
 * 
 * Build query strings from objects with proper encoding.
 */

/**
 * Build a query string from an object
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item !== undefined && item !== null && item !== '') {
            searchParams.append(key, String(item));
          }
        });
      } else if (typeof value === 'boolean') {
        searchParams.append(key, value ? 'true' : 'false');
      } else if (value instanceof Date) {
        searchParams.append(key, value.toISOString());
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Parse a query string into an object
 */
export function parseQueryString(queryString: string): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {};
  const searchParams = new URLSearchParams(queryString);
  
  searchParams.forEach((value, key) => {
    const existing = params[key];
    if (existing) {
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        params[key] = [existing, value];
      }
    } else {
      params[key] = value;
    }
  });
  
  return params;
}

/**
 * Merge query parameters
 */
export function mergeQueryParams(
  base: Record<string, unknown>,
  ...others: Record<string, unknown>[]
): Record<string, unknown> {
  return others.reduce(
    (acc, params) => ({ ...acc, ...params }),
    { ...base }
  );
}

/**
 * Remove undefined and null values from params
 */
export function cleanParams(params: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      cleaned[key] = value;
    }
  });
  
  return cleaned;
}

export default {
  buildQueryString,
  parseQueryString,
  mergeQueryParams,
  cleanParams,
};
