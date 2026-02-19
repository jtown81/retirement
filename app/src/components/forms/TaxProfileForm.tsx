import { useState } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, TaxProfileSchema } from '@storage/index';
import { FederalDeductionsSubForm } from './tax/FederalDeductionsSubForm';
import { StateResidencySubForm } from './tax/StateResidencySubForm';
import { IrmaaSettingsSubForm } from './tax/IrmaaSettingsSubForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';

export function TaxProfileForm() {
  const [activeSubTab, setActiveSubTab] = useState('federal');
  const [storedConfig] = useLocalStorage(STORAGE_KEYS.TAX_PROFILE, TaxProfileSchema);

  return (
    <div className="space-y-4">
      {/* Sub-tabs for tax settings */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Tax Profile</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your federal and state tax settings, deduction strategy, and Medicare IRMAA surcharge modeling.
          </p>
        </div>

        <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none bg-muted p-0 h-auto">
            <TabsTrigger value="federal" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Federal Deductions
            </TabsTrigger>
            <TabsTrigger value="state" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              State Residency
            </TabsTrigger>
            <TabsTrigger value="irmaa" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Medicare IRMAA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="federal" className="p-6 border-none">
            <FederalDeductionsSubForm />
          </TabsContent>
          <TabsContent value="state" className="p-6 border-none">
            <StateResidencySubForm />
          </TabsContent>
          <TabsContent value="irmaa" className="p-6 border-none">
            <IrmaaSettingsSubForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
