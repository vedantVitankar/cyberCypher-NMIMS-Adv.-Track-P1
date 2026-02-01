
/**
 * Logs an error to the server-side ticket system.
 * This is useful for catching client-side errors and ensuring they are recorded.
 */
export async function logErrorToTicketSystem(
  error: Error | string, 
  errorInfo?: any,
  options: { source?: string; type?: string } = {}
) {
  if (typeof window === 'undefined') {
    // Server-side logging
    console.error('Server-side error:', error);
    return;
  }

  // Normalize error
  const normalizedError = error instanceof Error ? error : new Error(String(error));
  const { source = 'client_manual', type = 'System Error' } = options;

  try {
    await fetch('/api/system/log-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: {
          message: normalizedError.message,
          stack: normalizedError.stack,
          name: normalizedError.name,
        },
        errorInfo,
        url: window.location.href,
        source,
        type,
      }),
    });
  } catch (loggingError) {
    // Fallback if logging fails
    console.error('Failed to send error report to server:', loggingError);
  }
}
