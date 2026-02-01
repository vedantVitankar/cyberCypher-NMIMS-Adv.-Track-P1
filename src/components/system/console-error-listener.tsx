
'use client';

import { useEffect, useRef } from 'react';
import { logErrorToTicketSystem } from '@/lib/error-logger';

export default function ConsoleErrorListener() {
  const initialized = useRef(false);
  // Use a ref to track reported errors to avoid duplicates/loops in a single session
  const reportedErrors = useRef(new Set<string>());

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // 1. Listen for uncaught exceptions
    const handleWindowError = (event: ErrorEvent) => {
      const errorKey = event.message + (event.filename || '');
      if (reportedErrors.current.has(errorKey)) return;
      reportedErrors.current.add(errorKey);

      logErrorToTicketSystem(event.error || new Error(event.message), null, {
        source: 'uncaught_exception',
        type: 'Uncaught Exception',
      });
    };

    // 2. Listen for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      let error = event.reason;
      if (!(error instanceof Error)) {
        error = new Error(typeof error === 'string' ? error : 'Unhandled Promise Rejection');
      }

      const errorKey = error.message;
      if (reportedErrors.current.has(errorKey)) return;
      reportedErrors.current.add(errorKey);

      logErrorToTicketSystem(error, null, {
        source: 'unhandled_rejection',
        type: 'Unhandled Promise Rejection',
      });
    };

    // 3. Intercept console.error
    // Save original console.error
    const originalConsoleError = console.error;
    
    // Override
    console.error = (...args: any[]) => {
      // Call original first so we don't break local debugging
      originalConsoleError.apply(console, args);

      try {
        // Construct an error message from args
        const message = args.map(arg => 
          arg instanceof Error ? arg.message : 
          typeof arg === 'object' ? JSON.stringify(arg) : 
          String(arg)
        ).join(' ');

        const errorKey = message;
        
        // Prevent infinite loops if logErrorToTicketSystem fails and logs to console
        if (reportedErrors.current.has(errorKey)) return;
        reportedErrors.current.add(errorKey);

        // Don't report our own fallback error messages
        if (message.includes('Failed to send error report')) return;

        // Create error object
        const firstError = args.find(arg => arg instanceof Error);
        const errorToReport = firstError || new Error(message);

        logErrorToTicketSystem(errorToReport, { args }, {
          source: 'console_error',
          type: 'Console Error',
        });
      } catch (e) {
        // Failsafe: if our interceptor crashes, just use original console
        originalConsoleError('Error in console.error interceptor:', e);
      }
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      console.error = originalConsoleError;
    };
  }, []);

  return null;
}
