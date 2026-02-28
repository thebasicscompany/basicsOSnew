import type { FallbackProps } from "react-error-boundary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertCircle, RotateCcw } from "lucide-react";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return String(error ?? "Unknown error");
}

/**
 * Fallback UI for react-error-boundary. Shows error message, optional stack in dev,
 * and Try again / Go back actions.
 */
export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const message = getErrorMessage(error);

  return (
    <div className="flex flex-col items-center gap-6 p-8 max-w-xl mx-auto" role="alert">
      <Alert variant="destructive" className="w-full">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription className="mt-2">{message}</AlertDescription>
      </Alert>

      {import.meta.env.DEV && error instanceof Error && error.stack && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="stack">
            <AccordionTrigger>Stack trace</AccordionTrigger>
            <AccordionContent>
              <pre className="text-xs overflow-auto whitespace-pre-wrap bg-muted p-3 rounded-md">
                {error.stack}
              </pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => window.history.back()}>
          Go back
        </Button>
        <Button onClick={resetErrorBoundary} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}
