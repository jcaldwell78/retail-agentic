/**
 * Error Tracking and Monitoring Utility
 *
 * Provides structured error logging and tracking for the admin web app.
 * Can be integrated with services like Sentry, LogRocket, or custom logging endpoints.
 */

export interface ErrorContext {
  userId?: string;
  tenantId?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
  component?: string;
  action?: string;
  [key: string]: any;
}

export interface ErrorReport {
  message: string;
  stack?: string;
  level: 'error' | 'warning' | 'info';
  context?: ErrorContext;
}

class ErrorTracker {
  private isProduction: boolean;
  private endpoint?: string;
  private maxErrors: number = 100;
  private errorBuffer: ErrorReport[] = [];
  private flushInterval: number = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.isProduction = import.meta.env.PROD;
    this.endpoint = import.meta.env.VITE_ERROR_TRACKING_ENDPOINT;

    // Set up global error handlers
    this.setupGlobalHandlers();

    // Set up periodic flushing
    if (this.endpoint) {
      this.startPeriodicFlush();
    }
  }

  /**
   * Set up global error and rejection handlers
   */
  private setupGlobalHandlers(): void {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        url: window.location.href,
        component: 'window',
        action: 'uncaught_error',
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        {
          url: window.location.href,
          component: 'window',
          action: 'unhandled_rejection',
        }
      );
    });
  }

  /**
   * Start periodic flushing of error buffer to server
   */
  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Capture an error with context
   */
  captureError(error: Error, context?: ErrorContext): void {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      level: 'error',
      context: {
        ...context,
        url: context?.url || window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
    };

    this.addToBuffer(errorReport);

    // Log to console in development
    if (!this.isProduction) {
      console.error('Error captured:', errorReport);
    }
  }

  /**
   * Capture a warning
   */
  captureWarning(message: string, context?: ErrorContext): void {
    const errorReport: ErrorReport = {
      message,
      level: 'warning',
      context: {
        ...context,
        url: context?.url || window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
    };

    this.addToBuffer(errorReport);

    if (!this.isProduction) {
      console.warn('Warning captured:', errorReport);
    }
  }

  /**
   * Capture an info message
   */
  captureInfo(message: string, context?: ErrorContext): void {
    const errorReport: ErrorReport = {
      message,
      level: 'info',
      context: {
        ...context,
        url: context?.url || window.location.href,
        timestamp: new Date().toISOString(),
      },
    };

    this.addToBuffer(errorReport);

    if (!this.isProduction) {
      console.info('Info captured:', errorReport);
    }
  }

  /**
   * Add error to buffer
   */
  private addToBuffer(errorReport: ErrorReport): void {
    this.errorBuffer.push(errorReport);

    // Prevent buffer from growing too large
    if (this.errorBuffer.length > this.maxErrors) {
      this.errorBuffer.shift();
    }

    // Flush immediately for critical errors in production
    if (this.isProduction && errorReport.level === 'error') {
      this.flush();
    }
  }

  /**
   * Flush error buffer to server
   */
  async flush(): Promise<void> {
    if (!this.endpoint || this.errorBuffer.length === 0) {
      return;
    }

    const errors = [...this.errorBuffer];
    this.errorBuffer = [];

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ errors }),
      });
    } catch (error) {
      // Failed to send errors to server, add them back to buffer
      console.error('Failed to send errors to tracking endpoint:', error);
      this.errorBuffer.unshift(...errors);
    }
  }

  /**
   * Set user context for error tracking
   */
  setUser(userId: string, tenantId?: string): void {
    // Store in session/local storage or as class property
    sessionStorage.setItem('error_tracker_user_id', userId);
    if (tenantId) {
      sessionStorage.setItem('error_tracker_tenant_id', tenantId);
    }
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    sessionStorage.removeItem('error_tracker_user_id');
    sessionStorage.removeItem('error_tracker_tenant_id');
  }

  /**
   * Track a page view
   */
  trackPageView(pageName: string, properties?: Record<string, any>): void {
    this.captureInfo(`Page view: ${pageName}`, {
      component: 'navigation',
      action: 'page_view',
      ...properties,
    });
  }

  /**
   * Track a custom event
   */
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    this.captureInfo(`Event: ${eventName}`, {
      action: 'custom_event',
      ...properties,
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metricName: string, value: number, unit: string = 'ms'): void {
    this.captureInfo(`Performance: ${metricName}`, {
      action: 'performance_metric',
      metric: metricName,
      value,
      unit,
    });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// Create singleton instance
const errorTracker = new ErrorTracker();

// Export convenience methods
export const captureError = (error: Error, context?: ErrorContext) =>
  errorTracker.captureError(error, context);

export const captureWarning = (message: string, context?: ErrorContext) =>
  errorTracker.captureWarning(message, context);

export const captureInfo = (message: string, context?: ErrorContext) =>
  errorTracker.captureInfo(message, context);

export const setUser = (userId: string, tenantId?: string) =>
  errorTracker.setUser(userId, tenantId);

export const clearUser = () => errorTracker.clearUser();

export const trackPageView = (pageName: string, properties?: Record<string, any>) =>
  errorTracker.trackPageView(pageName, properties);

export const trackEvent = (eventName: string, properties?: Record<string, any>) =>
  errorTracker.trackEvent(eventName, properties);

export const trackPerformance = (metricName: string, value: number, unit?: string) =>
  errorTracker.trackPerformance(metricName, value, unit);

export default errorTracker;
