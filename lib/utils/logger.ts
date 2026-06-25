/**
 * Custom Logger Utility
 * 
 * A simple logger that only outputs in development mode.
 * In production, all logging is disabled to improve performance and security.
 * 
 * Console calls can block execution when DevTools is closed in some browsers.
 * This logger uses setTimeout to ensure logging never blocks the main thread.
 * 
 * Usage:
 *   import logger from '@/lib/utils/logger';
 *   
 *   logger.log('Regular log message', data);
 *   logger.info('Info message', data);
 *   logger.warn('Warning message', data);
 *   logger.error('Error message', error);
 */

// Detect if we're in production
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Logger object with methods that mirror console API
 * All console calls are wrapped in setTimeout(0) to prevent blocking
 */
const logger = {
  /**
   * Standard logging - equivalent to console.log
   */
  log: (...args: unknown[]): void => {
    if (!isProduction) {
      setTimeout(() => console.log(...args), 0);
    }
  },

  /**
   * Informational messages - equivalent to console.info
   */
  info: (...args: unknown[]): void => {
    if (!isProduction) {
      setTimeout(() => console.info(...args), 0);
    }
  },

  /**
   * Warning messages - equivalent to console.warn
   */
  warn: (...args: unknown[]): void => {
    if (!isProduction) {
      setTimeout(() => console.warn(...args), 0);
    }
  },

  /**
   * Error messages - equivalent to console.error
   */
  error: (...args: unknown[]): void => {
    if (!isProduction) {
      setTimeout(() => console.error(...args), 0);
    }
  },
};

export default logger;
