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
  lazyMount?: boolean;
  children: React.ReactNode;
}

export function CollapsibleChartSection({
  id,
  title,
  description,
  defaultOpen = true,
  lazyMount = false,
  children,
}: CollapsibleChartSectionProps) {
  const [chartVisibility, setChartVisibility] = useLocalStorage(
    STORAGE_KEYS.CHART_VISIBILITY,
    ChartVisibilitySchema,
  );

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [hasOpened, setHasOpened] = useState(defaultOpen);

  // Sync with localStorage on mount and when chartVisibility changes
  useEffect(() => {
    if (chartVisibility !== null && id in chartVisibility) {
      setIsOpen(chartVisibility[id]);
    }
  }, [chartVisibility, id]);

  const handleOpenChange = (open: boolean) => {
    if (open) setHasOpened(true);
    setIsOpen(open);
    const updated = { ...(chartVisibility ?? {}), [id]: open };
    setChartVisibility(updated);
  };

  return (
    <>
      <section className="space-y-4">
        <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
          <CollapsibleTrigger asChild>
            <button
              className="flex w-full items-start justify-between gap-4 text-left cursor-pointer hover:bg-muted/50 rounded-lg transition-colors p-1 -mx-1"
              aria-label={isOpen ? 'Collapse section' : 'Expand section'}
            >
              <div className="flex-1 mt-1">
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                {description && (
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                )}
              </div>
              <ChevronDown
                className="h-5 w-5 text-muted-foreground transition-transform duration-200 shrink-0 mt-1"
                style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            {(!lazyMount || hasOpened) && children}
          </CollapsibleContent>
        </Collapsible>
      </section>
      <Separator />
    </>
  );
}
