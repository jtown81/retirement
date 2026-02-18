import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Alert, AlertDescription } from '@components/ui/alert';
import { FieldGroup } from './FieldGroup';
import type { TSPAccountSnapshot, TSPFundCode, TSPFundAllocation } from '@models/tsp';
import { TSPAccountSnapshotSchema } from '@storage/index';

const FUND_CODES: TSPFundCode[] = [
  'G', 'F', 'C', 'S', 'I',
  'L-Income', 'L2025', 'L2030', 'L2035', 'L2040',
  'L2045', 'L2050', 'L2055', 'L2060', 'L2065',
];

const FUND_LABELS: Record<TSPFundCode, string> = {
  'G': 'G Fund (Government)',
  'F': 'F Fund (Fixed Income)',
  'C': 'C Fund (Common Stock)',
  'S': 'S Fund (Small Cap)',
  'I': 'I Fund (International)',
  'L-Income': 'L Income Fund',
  'L2025': 'L 2025 Fund',
  'L2030': 'L 2030 Fund',
  'L2035': 'L 2035 Fund',
  'L2040': 'L 2040 Fund',
  'L2045': 'L 2045 Fund',
  'L2050': 'L 2050 Fund',
  'L2055': 'L 2055 Fund',
  'L2060': 'L 2060 Fund',
  'L2065': 'L 2065 Fund',
};

interface AddSnapshotModalProps {
  snapshot?: TSPAccountSnapshot | null;
  onSave: (snapshot: TSPAccountSnapshot) => void;
  onCancel: () => void;
}

function makeDefaults(): TSPAccountSnapshot {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    asOf: new Date().toISOString().split('T')[0] as any,
    source: 'manual',
    traditionalBalance: 0,
    rothBalance: 0,
    ytdEmployeeContributions: 0,
    ytdAgencyContributions: 0,
    fundAllocations: FUND_CODES.map(fund => ({
      fund,
      percentTraditional: 100 / FUND_CODES.length,
      percentRoth: 0,
    })),
    notes: '',
  };
}

export function AddSnapshotModal({ snapshot, onSave, onCancel }: AddSnapshotModalProps) {
  const [form, setForm] = useState<TSPAccountSnapshot>(snapshot ?? makeDefaults());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalAllocation = useMemo(() => {
    return form.fundAllocations.reduce((sum, fa) => sum + fa.percentTraditional + fa.percentRoth, 0);
  }, [form.fundAllocations]);

  const allocationError = useMemo(() => {
    const total = totalAllocation;
    if (total < 99.5 || total > 100.5) {
      return `Fund allocation must sum to 100% (currently ${total.toFixed(1)}%)`;
    }
    return '';
  }, [totalAllocation]);

  const handleSave = () => {
    if (allocationError) {
      setErrors({ fundAllocations: allocationError });
      return;
    }

    const result = TSPAccountSnapshotSchema.safeParse(form);
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      setErrors(
        Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0] ?? ''])),
      );
      return;
    }

    setErrors({});
    onSave(result.data);
  };

  const updateFundAllocation = (fund: TSPFundCode, traditional: number, roth: number) => {
    setForm(prev => ({
      ...prev,
      fundAllocations: prev.fundAllocations.map(fa =>
        fa.fund === fund ? { ...fa, percentTraditional: traditional, percentRoth: roth } : fa
      ),
    }));
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{snapshot ? 'Edit' : 'Add'} TSP Snapshot</DialogTitle>
          <DialogDescription>
            Record a point-in-time TSP account snapshot with balances and fund allocation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* ── Basic Info ─────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="As Of Date" htmlFor="asOfDate" error={errors.asOf}>
              <Input
                id="asOfDate"
                type="date"
                value={form.asOf}
                onChange={(e) => setForm(prev => ({ ...prev, asOf: e.target.value as any }))}
              />
            </FieldGroup>

            <FieldGroup label="Source" htmlFor="source" error={errors.source}>
              <select
                id="source"
                value={form.source}
                onChange={(e) => setForm(prev => ({ ...prev, source: e.target.value as any }))}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="manual">Manual Entry</option>
                <option value="tsp-statement">TSP Statement</option>
              </select>
            </FieldGroup>
          </div>

          {/* ── Balances ───────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Traditional Balance ($)" htmlFor="tradBal" error={errors.traditionalBalance}>
              <Input
                id="tradBal"
                type="number"
                min="0"
                step="100"
                value={form.traditionalBalance}
                onChange={(e) => setForm(prev => ({ ...prev, traditionalBalance: Number(e.target.value) }))}
              />
            </FieldGroup>

            <FieldGroup label="Roth Balance ($)" htmlFor="rothBal" error={errors.rothBalance}>
              <Input
                id="rothBal"
                type="number"
                min="0"
                step="100"
                value={form.rothBalance}
                onChange={(e) => setForm(prev => ({ ...prev, rothBalance: Number(e.target.value) }))}
              />
            </FieldGroup>
          </div>

          {/* ── YTD Contributions ──────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="YTD Employee Contributions ($)" htmlFor="ytdEmp" error={errors.ytdEmployeeContributions}>
              <Input
                id="ytdEmp"
                type="number"
                min="0"
                step="100"
                value={form.ytdEmployeeContributions ?? 0}
                onChange={(e) => setForm(prev => ({ ...prev, ytdEmployeeContributions: Number(e.target.value) }))}
              />
            </FieldGroup>

            <FieldGroup label="YTD Agency Contributions ($)" htmlFor="ytdAg" error={errors.ytdAgencyContributions}>
              <Input
                id="ytdAg"
                type="number"
                min="0"
                step="100"
                value={form.ytdAgencyContributions ?? 0}
                onChange={(e) => setForm(prev => ({ ...prev, ytdAgencyContributions: Number(e.target.value) }))}
              />
            </FieldGroup>
          </div>

          {/* ── Fund Allocation ────────────────────────────── */}
          <div>
            <Label className="block mb-2 text-sm font-medium">Fund Allocation (%)</Label>
            {allocationError && (
              <Alert variant="destructive" className="mb-3">
                <AlertDescription className="text-xs">{allocationError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
              {form.fundAllocations.map(fa => (
                <div key={fa.fund} className="flex items-center gap-3 text-sm">
                  <label className="w-20 font-medium">{FUND_LABELS[fa.fund]}</label>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-12 text-right">Trad:</span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={fa.percentTraditional}
                      onChange={(e) => updateFundAllocation(fa.fund, Number(e.target.value), fa.percentRoth)}
                      className="w-16 h-8 text-sm"
                    />
                    <span className="text-xs">%</span>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-12 text-right">Roth:</span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={fa.percentRoth}
                      onChange={(e) => updateFundAllocation(fa.fund, fa.percentTraditional, Number(e.target.value))}
                      className="w-16 h-8 text-sm"
                    />
                    <span className="text-xs">%</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Total allocation: {totalAllocation.toFixed(1)}% (must be ≈100%)
            </p>
          </div>

          {/* ── Notes ─────────────────────────────────────── */}
          <FieldGroup label="Notes (optional)" htmlFor="notes" error={errors.notes}>
            <textarea
              id="notes"
              value={form.notes ?? ''}
              onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm"
              rows={2}
              placeholder="e.g., 'After rebalancing', 'Q1 review', etc."
            />
          </FieldGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {snapshot ? 'Update' : 'Add'} Snapshot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
