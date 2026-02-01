
'use client';

import { useEffect } from 'react';
import { logErrorToTicketSystem } from '@/lib/error-logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logErrorToTicketSystem(error);
  }, [error]);

  return (
    <html>
      <body className="bg-black text-white antialiased min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full p-6 text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-red-500">Critical System Error</h2>
            <p className="text-neutral-400">
              A critical error prevented the application from loading. A high-priority support ticket has been created.
            </p>
          </div>
          
          <div className="bg-neutral-900 p-4 rounded border border-neutral-800 text-left overflow-auto max-h-40">
            <code className="text-xs text-red-400 font-mono">
              {error.message}
            </code>
          </div>

          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded font-medium transition-colors"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
