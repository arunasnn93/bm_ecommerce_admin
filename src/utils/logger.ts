import { ENV, LOG_LEVELS } from '@constants';

// Logger configuration
interface LoggerConfig {
  level: number;
  enableConsole: boolean;
  enableRemote: boolean;
  prefix: string;
}

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: ENV.IS_DEV ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR,
      enableConsole: ENV.IS_DEV,
      enableRemote: ENV.IS_PROD,
      prefix: '[BM-ADMIN]',
      ...config,
    };
  }

  private shouldLog(level: number): boolean {
    return level <= this.config.level;
  }

  private formatMessage(level: string, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const prefix = this.config.prefix;
    return `${prefix} [${timestamp}] [${level}] ${message}${data ? ` | Data: ${JSON.stringify(data)}` : ''}`;
  }

  private log(level: number, levelName: string, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(levelName, message, data);

    if (this.config.enableConsole) {
      switch (level) {
        case LOG_LEVELS.ERROR:
          console.error(formattedMessage);
          break;
        case LOG_LEVELS.WARN:
          console.warn(formattedMessage);
          break;
        case LOG_LEVELS.INFO:
          console.info(formattedMessage);
          break;
        case LOG_LEVELS.DEBUG:
          console.log(formattedMessage);
          break;
      }
    }

    // Remote logging for production (implement as needed)
    if (this.config.enableRemote && level <= LOG_LEVELS.ERROR) {
      this.sendToRemote();
    }
  }

  private sendToRemote(): void {
    // Implement remote logging service (e.g., Sentry, LogRocket, etc.)
    // This is a placeholder for production logging
    try {
      // Example: Send to logging service
      // logService.send({ level, levelName, message, data, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Failed to send log to remote service:', error);
    }
  }

  // Public logging methods
  error(message: string, error?: Error | unknown): void {
    this.log(LOG_LEVELS.ERROR, 'ERROR', message, error);
  }

  warn(message: string, data?: unknown): void {
    this.log(LOG_LEVELS.WARN, 'WARN', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log(LOG_LEVELS.INFO, 'INFO', message, data);
  }

  debug(message: string, data?: unknown): void {
    this.log(LOG_LEVELS.DEBUG, 'DEBUG', message, data);
  }

  // Specialized logging methods
  api = {
    request: (method: string, url: string, data?: unknown) => {
      this.debug(`API Request: ${method} ${url}`, data);
    },
    response: (method: string, url: string, status: number, data?: unknown) => {
      this.debug(`API Response: ${method} ${url} [${status}]`, data);
    },
    error: (method: string, url: string, error: unknown) => {
      this.error(`API Error: ${method} ${url}`, error);
    },
  };

  auth = {
    login: (username: string) => {
      this.info(`User login attempt: ${username}`);
    },
    loginSuccess: (username: string, role: string) => {
      this.info(`User logged in successfully: ${username} [${role}]`);
    },
    loginFailed: (username: string, error: unknown) => {
      this.warn(`Login failed for user: ${username}`, error);
    },
    rateLimitHit: (username: string) => {
      this.warn(`Rate limit hit for user: ${username} - login attempts exceeded`);
    },
    logout: (username?: string) => {
      this.info(`User logged out: ${username || 'unknown'}`);
    },
    tokenRefresh: () => {
      this.debug('Token refreshed');
    },
    tokenExpired: () => {
      this.warn('Token expired');
    },
  };

  navigation = {
    routeChange: (from: string, to: string) => {
      this.debug(`Route change: ${from} -> ${to}`);
    },
    protectedRoute: (route: string, authenticated: boolean) => {
      this.debug(`Protected route access: ${route} [authenticated: ${authenticated}]`);
    },
  };

  form = {
    submit: (formName: string, data?: unknown) => {
      this.debug(`Form submitted: ${formName}`, data);
    },
    validation: (formName: string, errors: unknown) => {
      this.debug(`Form validation errors: ${formName}`, errors);
    },
  };

  state = {
    update: (storeName: string, action: string, newState?: unknown) => {
      this.debug(`State update: ${storeName}.${action}`, newState);
    },
  };

  performance = {
    start: (operation: string) => {
      if (ENV.IS_DEV) {
        console.time(`${this.config.prefix} [PERF] ${operation}`);
      }
    },
    end: (operation: string) => {
      if (ENV.IS_DEV) {
        console.timeEnd(`${this.config.prefix} [PERF] ${operation}`);
      }
    },
    mark: (operation: string, duration: number) => {
      this.debug(`Performance: ${operation} took ${duration}ms`);
    },
  };

  ui = {
    componentMount: (componentName: string, props?: unknown) => {
      this.debug(`Component mounted: ${componentName}`, props);
    },
    componentUnmount: (componentName: string) => {
      this.debug(`Component unmounted: ${componentName}`);
    },
    userAction: (action: string, details?: unknown) => {
      this.info(`User action: ${action}`, details);
    },
  };

  error_boundary = {
    caught: (error: Error, errorInfo: unknown, componentStack?: string) => {
      this.error('Error boundary caught error', {
        error: error.message,
        stack: error.stack,
        errorInfo,
        componentStack,
      });
    },
  };
}

// Create singleton logger instance
export const logger = new Logger();

// Export convenience functions
export const log = {
  error: (message: string, error?: Error | unknown) => logger.error(message, error),
  warn: (message: string, data?: unknown) => logger.warn(message, data),
  info: (message: string, data?: unknown) => logger.info(message, data),
  debug: (message: string, data?: unknown) => logger.debug(message, data),
  api: logger.api,
  auth: logger.auth,
  navigation: logger.navigation,
  form: logger.form,
  state: logger.state,
  performance: logger.performance,
  ui: logger.ui,
  errorBoundary: logger.error_boundary,
};

export default logger;
