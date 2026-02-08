/**
 * API Authentication Middleware
 * 
 * Provides simple API key-based authentication that can be extended later.
 * In production, this should be replaced with proper session-based auth (e.g., NextAuth.js)
 */

import { NextRequest, NextResponse } from 'next/server';

// API key from environment variable - in production, use a proper auth system
const API_KEY = process.env.API_KEY;
const AUTH_ENABLED = process.env.API_AUTH_ENABLED === 'true';

/**
 * Authentication result
 */
export interface AuthResult {
  authenticated: boolean;
  error?: string;
  userId?: string;
}

/**
 * Validate API request authentication
 * 
 * Supports two modes:
 * 1. API key via X-API-Key header
 * 2. Bearer token via Authorization header (for future extension)
 * 
 * @param request - The Next.js request object
 * @returns Authentication result with status and optional user ID
 */
export function validateAuth(request: NextRequest): AuthResult {
  // If auth is disabled, allow all requests (development mode)
  if (!AUTH_ENABLED) {
    return { authenticated: true, userId: 'dev-user' };
  }

  // Check for API key in header
  const apiKey = request.headers.get('X-API-Key');
  if (apiKey) {
    if (API_KEY && apiKey === API_KEY) {
      return { authenticated: true, userId: 'api-user' };
    }
    return { authenticated: false, error: 'Invalid API key' };
  }

  // Check for Bearer token (for future OAuth/JWT support)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    // In the future, validate JWT or session token here
    // For now, treat it as an API key
    if (API_KEY && token === API_KEY) {
      return { authenticated: true, userId: 'bearer-user' };
    }
    return { authenticated: false, error: 'Invalid bearer token' };
  }

  return { authenticated: false, error: 'Authentication required' };
}

/**
 * Higher-order function to wrap API route handlers with authentication
 * 
 * @example
 * ```typescript
 * export const GET = withAuth(async (request, context) => {
 *   // Your authenticated route handler
 * });
 * ```
 */
export function withAuth<T extends unknown[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
): (request: NextRequest, ...args: T) => Promise<NextResponse> {
  return async (request: NextRequest, ...args: T) => {
    const authResult = validateAuth(request);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { 
          success: false, 
          error: authResult.error || 'Unauthorized',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }
    
    return handler(request, ...args);
  };
}

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return NextResponse.json(
    { 
      success: false, 
      error: message,
      code: 'UNAUTHORIZED'
    },
    { status: 401 }
  );
}
