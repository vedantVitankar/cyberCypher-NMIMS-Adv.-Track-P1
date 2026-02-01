
'use client';

import { Button } from "@/components/ui/button";

export default function TestConsoleErrorPage() {
  const triggerConsoleError = () => {
    console.error("Test Console Error: This should be logged to tickets");
  };

  const triggerUncaughtException = () => {
    throw new Error("Test Uncaught Exception: This should be logged to tickets");
  };

  const triggerUnhandledRejection = () => {
    new Promise((_, reject) => reject("Test Unhandled Rejection: This should be logged to tickets"));
  };

  return (
    <div className="container mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Test Console Error Logging</h1>
      <div className="flex gap-4">
        <Button onClick={triggerConsoleError} variant="destructive">
          Trigger console.error
        </Button>
        <Button onClick={triggerUncaughtException} variant="destructive">
          Trigger Uncaught Exception
        </Button>
        <Button onClick={triggerUnhandledRejection} variant="destructive">
          Trigger Unhandled Rejection
        </Button>
      </div>
      <p className="text-muted-foreground text-sm mt-4">
        Check the Support Dashboard or Database to see if tickets are created.
      </p>
    </div>
  );
}
