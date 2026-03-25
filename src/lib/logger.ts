import { pino } from 'pino';
import path from 'path';
import fs from 'fs';

const isDevelopment = process.env.NODE_ENV === 'development';
const logDir = path.join(process.cwd(), 'logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const getLogFile = () => {
  const date = new Date().toISOString().split('T')[0];
  return path.join(logDir, `app-${date}.log`);
};

let currentLogFile = getLogFile();
let currentStream: fs.WriteStream = fs.createWriteStream(currentLogFile, { flags: 'a' });

const getStream = () => {
  const newLogFile = getLogFile();
  if (newLogFile !== currentLogFile) {
    currentStream.end();
    currentLogFile = newLogFile;
    currentStream = fs.createWriteStream(currentLogFile, { flags: 'a' });
  }
  return currentStream;
};

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

if (!isDevelopment) {
  setInterval(() => {
    getStream();
  }, 60000);

  process.on('SIGTERM', () => {
    currentStream.end();
    process.exit(0);
  });
  process.on('SIGINT', () => {
    currentStream.end();
    process.exit(0);
  });
}

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

  if (!isDevelopment) {
    getStream().write(JSON.stringify({ ...logData, timestamp: new Date().toISOString() }) + '\n');
  }
};

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

  if (!isDevelopment) {
    getStream().write(JSON.stringify({ ...logData, timestamp: new Date().toISOString() }) + '\n');
  }
};

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

  if (!isDevelopment) {
    getStream().write(JSON.stringify({ ...logData, timestamp: new Date().toISOString() }) + '\n');
  }
};

export default logger;
