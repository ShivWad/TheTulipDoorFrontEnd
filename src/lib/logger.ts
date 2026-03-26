/**
 * Logging Utilities
 * 
 * Provides structured logging using Pino logger with:
 * - Console output in development (pretty-printed)
 * - File output in production (daily rotation)
 * - Specialized log functions for different use cases
 * 
 * Features:
 * - logApiRequest: Track API endpoint calls
 * - logUserAction: Track user actions (e.g., "user_created", "subscription_paused")
 * - logSecurity: Track security events (e.g., "failed_login", "unauthorized_access")
 * 
 * Log files are stored in /logs directory with format: app-YYYY-MM-DD.log
 * 
 * @see https://getpino.io/
 */

import { pino } from 'pino';
import path from 'path';
import fs from 'fs';

/** Environment flag for development mode */
const isDevelopment = process.env.NODE_ENV === 'development';

/** Directory for log files */
const logDir = path.join(process.cwd(), 'logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Generate log filename for current date
 * Format: app-YYYY-MM-DD.log
 */
const getLogFile = () => {
  const date = new Date().toISOString().split('T')[0];
  return path.join(logDir, `app-${date}.log`);
};

/** Current log file path */
let currentLogFile = getLogFile();

/** Write stream for current log file */
let currentStream: fs.WriteStream = fs.createWriteStream(currentLogFile, { flags: 'a' });

/**
 * Get or create new log stream for today's date
 * Creates new file and stream when date changes (daily rotation)
 */
const getStream = () => {
  const newLogFile = getLogFile();
  if (newLogFile !== currentLogFile) {
    currentStream.end();
    currentLogFile = newLogFile;
    currentStream = fs.createWriteStream(currentLogFile, { flags: 'a' });
  }
  return currentStream;
};

/**
 * Main logger instance
 * - Development: Pretty console output with colors
 * - Production: Silent (no console), writes to file
 */
const logger = pino({
  level: 'debug',
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

// Production-specific setup
if (!isDevelopment) {
  // Check for new day every minute
  setInterval(() => {
    getStream();
  }, 60000);

  // Graceful shutdown on SIGTERM/SIGINT
  process.on('SIGTERM', () => {
    currentStream.end();
    process.exit(0);
  });
  process.on('SIGINT', () => {
    currentStream.end();
    process.exit(0);
  });
}

/**
 * Log an API request
 * 
 * @param method - HTTP method (GET, POST, etc.)
 * @param reqPath - Request path/endpoint
 * @param statusCode - HTTP response status code
 * @param duration - Request duration in milliseconds
 * @param userId - Optional user ID making the request
 * 
 * Log levels:
 * - error: 5xx status codes
 * - warn: 4xx status codes
 * - info: 2xx status codes
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

  // In production, also write to file
  if (!isDevelopment) {
    getStream().write(JSON.stringify({ ...logData, timestamp: new Date().toISOString() }) + '\n');
  }
};

/**
 * Log a user action
 * 
 * @param userId - ID of the user performing the action
 * @param action - Action name (e.g., "user_created", "subscription_paused")
 * @param metadata - Additional context about the action
 * 
 * Used for audit trails and analytics
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

  // In production, also write to file
  if (!isDevelopment) {
    getStream().write(JSON.stringify({ ...logData, timestamp: new Date().toISOString() }) + '\n');
  }
};

/**
 * Log a security event
 * 
 * @param event - Security event type (e.g., "failed_login", "unauthorized_access")
 * @param details - Details about the security event
 * 
 * Always logged at warn level for visibility
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

  // In production, also write to file
  if (!isDevelopment) {
    getStream().write(JSON.stringify({ ...logData, timestamp: new Date().toISOString() }) + '\n');
  }
};

/** Default logger export for general logging */
export default logger;
