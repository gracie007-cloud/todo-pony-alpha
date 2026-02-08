/**
 * API Client
 * 
 * Provides fetch wrappers for making API requests with proper error handling.
 */

const API_BASE = '/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
  count?: number;
}

export interface ApiError extends Error {
  status?: number;
  details?: unknown;
}

/**
 * Create an API error with additional context
 */
function createApiError(message: string, status?: number, details?: unknown): ApiError {
  const error: ApiError = new Error(message);
  error.status = status;
  error.details = details;
  return error;
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw createApiError(
        data.error || `HTTP error! status: ${response.status}`,
        response.status,
        data.details
      );
    }

    return data as ApiResponse<T>;
  } catch (error) {
    if ((error as ApiError).status) {
      throw error;
    }
    throw createApiError(
      error instanceof Error ? error.message : 'Network error occurred'
    );
  }
}

/**
 * GET request
 */
export async function get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
  let url = endpoint;
  
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    url = `${endpoint}?${searchParams.toString()}`;
  }
  
  return fetchApi<T>(url, { method: 'GET' });
}

/**
 * POST request
 */
export async function post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT request
 */
export async function put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PATCH request
 */
export async function patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request
 */
export async function del<T>(endpoint: string): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, { method: 'DELETE' });
}

/**
 * API client object with all methods
 */
export const api = {
  get,
  post,
  put,
  patch,
  del,
};

export default api;
