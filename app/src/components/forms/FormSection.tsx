import { useState, useEffect, type ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Separator } from '@components/ui/separator';
import { Check } from 'lucide-react';

interface FormSectionProps {
  title: string;
  description?: string;
  onSave: () => void;
  onClear: () => void;
  onLoadDefaults?: () => void;
  children: ReactNode;
}

export function FormSection({ title, description, onSave, onClear, onLoadDefaults, children }: FormSectionProps) {
  const [showSaved, setShowSaved] = useState(false);

  const handleSave = () => {
    onSave();
    setShowSaved(true);
    // Auto-hide after 2 seconds
    setTimeout(() => setShowSaved(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent>
        <div className="space-y-4">{children}</div>
      </CardContent>

      <Separator />

      <CardFooter className="flex items-center justify-between gap-3 mt-0">
        <div className="flex gap-3">
          <Button onClick={handleSave}>Save Section</Button>
          <Button variant="outline" onClick={onClear}>
            Clear Section
          </Button>
          {onLoadDefaults && (
            <Button variant="outline" onClick={onLoadDefaults}>
              Load Defaults
            </Button>
          )}
        </div>
        {showSaved && (
          <Badge className="animate-in fade-in-0 slide-in-from-right-2 duration-200">
            <Check className="w-3 h-3 mr-1" />
            Saved
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}
