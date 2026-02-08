/**
 * API Request Logging Utility
 * 
 * Provides structured logging for API routes with request/response tracking.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Log levels
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log entry structure
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  ip?: string;
  userAgent?: string;
  error?: string;
  [key: string]: unknown;
}

/**
 * ANSI color codes for console output
 */
const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
};

/**
 * Format log entry for console output
 */
function formatLogEntry(entry: LogEntry): string {
  const timestamp = `${colors.dim}${entry.timestamp}${colors.reset}`;
  const levelColors: Record<LogLevel, string> = {
    debug: colors.cyan,
    info: colors.blue,
    warn: colors.yellow,
    error: colors.red,
  };
  const levelColor = levelColors[entry.level];
  const level = `${levelColor}[${entry.level.toUpperCase().padEnd(5)}]${colors.reset}`;
  
  let message = `${timestamp} ${level} ${entry.message}`;
  
  if (entry.method && entry.path) {
    const statusColor = entry.statusCode && entry.statusCode >= 400 
      ? colors.red 
      : entry.statusCode && entry.statusCode >= 300 
        ? colors.yellow 
        : colors.green;
    const status = entry.statusCode ? ` ${statusColor}${entry.statusCode}${colors.reset}` : '';
    const duration = entry.durationMs !== undefined 
      ? ` ${colors.cyan}${entry.durationMs}ms${colors.reset}` 
      : '';
    message += ` | ${entry.method} ${entry.path}${status}${duration}`;
  }
  
  if (entry.error) {
    message += `\n  ${colors.red}Error: ${entry.error}${colors.reset}`;
  }
  
  return message;
}

/**
 * Log an entry to the console
 */
function log(entry: LogEntry): void {
  const formatted = formatLogEntry(entry);
  
  switch (entry.level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

/**
 * Extract client IP from request
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnecting = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  if (cfConnecting) {
    return cfConnecting;
  }
  
  return 'unknown';
}

/**
 * API Logger instance
 */
export const apiLogger = {
  debug: (message: string, data?: Record<string, unknown>) => {
    log({
      timestamp: new Date().toISOString(),
      level: 'debug',
      message,
      ...data
    });
  },
  
  info: (message: string, data?: Record<string, unknown>) => {
    log({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      ...data
    });
  },
  
  warn: (message: string, data?: Record<string, unknown>) => {
    log({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      ...data
    });
  },
  
  error: (message: string, error?: Error | unknown, data?: Record<string, unknown>) => {
    log({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      error: error instanceof Error ? error.message : String(error),
      ...data
    });
  },
  
  request: (
    request: NextRequest, 
    statusCode: number, 
    durationMs: number,
    data?: Record<string, unknown>
  ) => {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    log({
      timestamp: new Date().toISOString(),
      level,
      message: 'API Request',
      method: request.method,
      path: new URL(request.url).pathname,
      statusCode,
      durationMs,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      ...data
    });
  }
};

/**
 * Request context for logging
 */
interface RequestContext {
  startTime: number;
  request: NextRequest;
}

/**
 * Start request logging context
 */
export function startRequestLog(request: NextRequest): RequestContext {
  return {
    startTime: Date.now(),
    request
  };
}

/**
 * End request logging and log the request
 */
export function endRequestLog(
  context: RequestContext, 
  statusCode: number,
  additionalData?: Record<string, unknown>
): void {
  const durationMs = Date.now() - context.startTime;
  apiLogger.request(context.request, statusCode, durationMs, additionalData);
}

/**
 * Higher-order function to wrap API route handlers with logging
 * 
 * @example
 * ```typescript
 * export const GET = withLogging(async (request) => {
 *   // Your route handler
 * });
 * ```
 */
export function withLogging<T extends unknown[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
): (request: NextRequest, ...args: T) => Promise<NextResponse> {
  return async (request: NextRequest, ...args: T) => {
    const context = startRequestLog(request);
    
    try {
      const response = await handler(request, ...args);
      endRequestLog(context, response.status);
      return response;
    } catch (error) {
      endRequestLog(context, 500);
      throw error;
    }
  };
}

/**
 * Combined middleware wrapper that applies logging and rate limiting
 * 
 * @example
 * ```typescript
 * export const GET = withApiMiddleware(
 *   async (request) => { ... },
 *   { rateLimit: rateLimitPresets.standard }
 * );
 * ```
 */
interface ApiMiddlewareOptions {
  rateLimit?: import('./rate-limit').RateLimitConfig;
  requireAuth?: boolean;
}

export function withApiMiddleware<T extends unknown[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  options: ApiMiddlewareOptions = {}
): (request: NextRequest, ...args: T) => Promise<NextResponse> {
  return async (request: NextRequest, ...args: T) => {
    const context = startRequestLog(request);
    
    // Apply rate limiting if configured
    if (options.rateLimit) {
      const { checkRateLimit, rateLimitExceededResponse } = await import('./rate-limit');
      const result = checkRateLimit(request, options.rateLimit);
      
      if (!result.success) {
        endRequestLog(context, 429);
        return rateLimitExceededResponse(result, options.rateLimit.message);
      }
    }
    
    // Apply authentication if required
    if (options.requireAuth) {
      const { validateAuth, unauthorizedResponse } = await import('./auth');
      const authResult = validateAuth(request);
      
      if (!authResult.authenticated) {
        endRequestLog(context, 401);
        return unauthorizedResponse(authResult.error);
      }
    }
    
    try {
      const response = await handler(request, ...args);
      endRequestLog(context, response.status);
      return response;
    } catch (error) {
      endRequestLog(context, 500);
      apiLogger.error('Unhandled API error', error);
      throw error;
    }
  };
}
