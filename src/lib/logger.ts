/**
 * Logging Utilities
 * 
 * Provides structured logging using Pino logger.
 * In development: pretty-printed console output
 * In production: JSON output to stdout (Vercel captures this automatically)
 * 
 * Features:
 * - logApiRequest: Track API endpoint calls
 * - logUserAction: Track user actions (e.g., "user_created", "subscription_paused")
 * - logSecurity: Track security events (e.g., "failed_login", "unauthorized_access")
 * 
 * @see https://getpino.io/
 */

import { pino } from 'pino';

/** Environment flag for development mode */
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Main logger instance
 * - Development: Pretty console output with colors
 * - Production: JSON output to stdout (Vercel captures this)
 */
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

/**
 * Log an API request
 */
export const logApiRequest = (
  method: string,
  reqPath: string,
  statusCode: number,
  duration: number,
  userId?: string
) => {
  const logData = {
    type: 'api_request',
    method,
    path: reqPath,
    statusCode,
    duration: `${duration}ms`,
    userId: userId || 'anonymous',
  };

  if (statusCode >= 500) {
    logger.error(logData);
  } else if (statusCode >= 400) {
    logger.warn(logData);
  } else {
    logger.info(logData);
  }
};

/**
 * Log a user action
 */
export const logUserAction = (
  userId: string,
  action: string,
  metadata?: Record<string, unknown>
) => {
  const logData = {
    type: 'user_action',
    userId,
    action,
    ...metadata,
  };

  logger.info(logData);
};

/**
 * Log a security event
 */
export const logSecurity = (
  event: string,
  details: Record<string, unknown>
) => {
  const logData = {
    type: 'security',
    event,
    ...details,
  };

  logger.warn(logData);
};

/** Default logger export for general logging */
export default logger;
