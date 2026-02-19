import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Separator } from '@components/ui/separator';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@components/ui/alert';

interface FormSectionProps {
  title: string;
  description?: string;
  onSave: () => void;
  onClear: () => void;
  onLoadDefaults?: () => void;
  hasErrors?: boolean;
  errorMessage?: string;
  children: ReactNode;
}

export function FormSection({
  title,
  description,
  onSave,
  onClear,
  onLoadDefaults,
  hasErrors,
  errorMessage,
  children,
}: FormSectionProps) {
  const [showSaved, setShowSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Keyboard shortcut: Ctrl+S or Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!isSaving) {
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSaving]);

  const handleSave = useCallback(() => {
    setIsSaving(true);
    // Call the save handler
    onSave();
    // Simulate save delay and show success badge
    setTimeout(() => {
      setIsSaving(false);
      setShowSaved(true);
      // Auto-hide saved badge after 3 seconds
      setTimeout(() => setShowSaved(false), 3000);
    }, 200);
  }, [onSave]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent>
        {/* Error summary banner */}
        {hasErrors && errorMessage && (
          <div className="mb-4 animate-in fade-in-0 slide-in-from-top-1 duration-200">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          </div>
        )}

        <div className="space-y-4">{children}</div>
      </CardContent>

      <Separator />

      <CardFooter className="flex flex-wrap items-center justify-between gap-3 mt-0">
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving || hasErrors}
            className="relative"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Section'
            )}
          </Button>
          <Button variant="outline" onClick={onClear} disabled={isSaving}>
            Clear Section
          </Button>
          {onLoadDefaults && (
            <Button variant="outline" onClick={onLoadDefaults} disabled={isSaving}>
              Load Defaults
            </Button>
          )}
        </div>
        {showSaved && (
          <Badge
            variant="default"
            className="gap-1 animate-in fade-in-0 slide-in-from-right-4 duration-300 animate-out fade-out-0 slide-out-to-right-4 duration-300"
          >
            <Check className="w-3 h-3" />
            Saved
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}
