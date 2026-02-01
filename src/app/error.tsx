
'use client';

import { useEffect } from 'react';
import { logErrorToTicketSystem } from '@/lib/error-logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to the support ticket system automatically
    logErrorToTicketSystem(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-neutral-900 border-red-900/30">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <CardTitle className="text-xl text-neutral-100">Something went wrong!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-neutral-400 text-sm">
            We've automatically logged a support ticket for this issue. Our AI agents will analyze it shortly.
          </p>
          <div className="bg-neutral-950 p-3 rounded text-left overflow-auto max-h-32 border border-neutral-800">
             <code className="text-xs text-red-400 font-mono break-all">
               {error.message || 'Unknown error occurred'}
             </code>
          </div>
          <div className="pt-2">
            <Button 
              onClick={() => reset()} 
              className="bg-orange-600 hover:bg-orange-700 text-white w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
