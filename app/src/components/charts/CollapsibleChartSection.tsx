'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@components/ui/collapsible';
import { Separator } from '@components/ui/separator';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS } from '@storage/schema';
import { ChartVisibilitySchema } from '@storage/zod-schemas';

interface CollapsibleChartSectionProps {
  id: string;
  title: string;
  description: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function CollapsibleChartSection({
  id,
  title,
  description,
  defaultOpen = true,
  children,
}: CollapsibleChartSectionProps) {
  const [chartVisibility, setChartVisibility] = useLocalStorage(
    STORAGE_KEYS.CHART_VISIBILITY,
    ChartVisibilitySchema,
  );

  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Sync with localStorage on mount and when chartVisibility changes
  useEffect(() => {
    if (chartVisibility !== null && id in chartVisibility) {
      setIsOpen(chartVisibility[id]);
    }
  }, [chartVisibility, id]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    const updated = { ...(chartVisibility ?? {}), [id]: open };
    setChartVisibility(updated);
  };

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
            <CollapsibleTrigger asChild>
              <button
                className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded hover:bg-muted transition-colors"
                aria-label={isOpen ? 'Collapse section' : 'Expand section'}
              >
                <ChevronDown
                  className="h-5 w-5 text-muted-foreground transition-transform duration-200"
                  style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              {children}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </section>
      <Separator />
    </>
  );
}
