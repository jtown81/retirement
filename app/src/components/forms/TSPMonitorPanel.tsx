import { useState } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, TSPAccountSnapshotSchema } from '@storage/index';
import { FieldGroup } from './FieldGroup';
import { FormSection } from './FormSection';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Alert, AlertDescription } from '@components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import { Trash2, Edit2, Upload, Plus, TrendingUp } from 'lucide-react';
import { AddSnapshotModal } from './AddSnapshotModal';
import { TSPImportModal } from './TSPImportModal';
import type { TSPAccountSnapshot } from '@models/tsp';

function formatUSD(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function formatAllocation(snapshot: TSPAccountSnapshot): string {
  if (snapshot.fundAllocations.length === 0) return 'Not set';
  const summary = snapshot.fundAllocations
    .filter(fa => fa.percentage > 0)
    .map(fa => `${fa.fund} ${Math.round(fa.percentage)}%`)
    .join(' / ');
  return summary || 'Not set';
}

export function TSPMonitorPanel() {
  const [snapshots, saveSnapshots, removeSnapshots] = useLocalStorage(
    STORAGE_KEYS.TSP_SNAPSHOTS,
    TSPAccountSnapshotSchema as any, // Array of snapshots
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingSnapshot, setEditingSnapshot] = useState<TSPAccountSnapshot | null>(null);

  const snapshotList: TSPAccountSnapshot[] = Array.isArray(snapshots) ? snapshots : [];
  const sorted = [...snapshotList].sort((a, b) => new Date(b.asOf).getTime() - new Date(a.asOf).getTime());
  const latestSnapshot = sorted[0] ?? null;

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this snapshot? This cannot be undone.')) {
      const updated = snapshotList.filter(s => s.id !== id);
      saveSnapshots(updated);
    }
  };

  const handleSave = () => {
    // This is called by FormSection's Save button — no-op, snapshots auto-save via modals
  };

  const handleClear = () => {
    if (window.confirm('Clear all TSP snapshots? This cannot be undone.')) {
      removeSnapshots();
    }
  };

  return (
    <>
      <FormSection
        title="TSP Balance History & Fund Allocation"
        description="Track your TSP balances over time and record fund allocations across G/F/C/S/I/L funds."
        onSave={handleSave}
        onClear={handleClear}
      >
        {latestSnapshot && (
          <Alert className="border-primary/30 bg-primary/5">
            <TrendingUp className="w-4 h-4 text-primary" />
            <AlertDescription className="text-sm">
              <span className="font-medium">Projection source:</span> most recent snapshot (
              {latestSnapshot.asOf}) — Traditional{' '}
              {formatUSD(latestSnapshot.traditionalBalance)}, Roth{' '}
              {formatUSD(latestSnapshot.rothBalance)} — is used as the starting balance for
              all Dashboard projections.
            </AlertDescription>
          </Alert>
        )}

        {snapshotList.length === 0 ? (
          <Alert>
            <AlertDescription>
              No TSP snapshots recorded yet. Record your first balance below to enable tracking.
              Without a snapshot, projections use the balance entered in FERS Estimate.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>As Of</TableHead>
                  <TableHead className="text-right">Traditional</TableHead>
                  <TableHead className="text-right">Roth</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Fund Allocation</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((snapshot) => {
                  const total = snapshot.traditionalBalance + snapshot.rothBalance;
                  return (
                    <TableRow key={snapshot.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {snapshot.asOf}
                          {snapshot.id === latestSnapshot?.id && (
                            <Badge variant="default" className="text-xs">Active</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">{formatUSD(snapshot.traditionalBalance)}</TableCell>
                      <TableCell className="text-right text-sm">{formatUSD(snapshot.rothBalance)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatUSD(total)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatAllocation(snapshot)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={snapshot.source === 'import' ? 'default' : 'secondary'} className="text-xs">
                          {snapshot.source === 'manual' ? 'Manual' : snapshot.source === 'import' ? 'CSV Import' : 'Statement'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setEditingSnapshot(snapshot); setShowAddModal(true); }}
                            className="p-1 hover:bg-muted rounded"
                            title="Edit snapshot"
                          >
                            <Edit2 className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDelete(snapshot.id)}
                            className="p-1 hover:bg-destructive/10 rounded"
                            title="Delete snapshot"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex gap-2 mt-6">
          <Button
            onClick={() => setShowAddModal(true)}
            variant="outline"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Snapshot Manually
          </Button>
          <Button
            onClick={() => setShowImportModal(true)}
            variant="outline"
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Import TSP CSV
          </Button>
        </div>
      </FormSection>

      {/* Modals */}
      {showAddModal && (
        <AddSnapshotModal
          snapshot={editingSnapshot}
          onSave={(snapshot) => {
            const updated = editingSnapshot
              ? snapshotList.map(s => s.id === editingSnapshot.id ? snapshot : s)
              : [...snapshotList, snapshot];
            saveSnapshots(updated);
            setShowAddModal(false);
            setEditingSnapshot(null);
          }}
          onCancel={() => {
            setShowAddModal(false);
            setEditingSnapshot(null);
          }}
        />
      )}

      {showImportModal && (
        <TSPImportModal
          onImport={(snapshot) => {
            saveSnapshots([...snapshotList, snapshot]);
            setShowImportModal(false);
          }}
          onCancel={() => setShowImportModal(false)}
        />
      )}
    </>
  );
}
