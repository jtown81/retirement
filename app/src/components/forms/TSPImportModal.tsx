import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Alert, AlertDescription } from '@components/ui/alert';
import { Badge } from '@components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import { AlertCircle, Upload } from 'lucide-react';
import { parseTSPCSV, extractSnapshotFromRows } from '@modules/tsp/import';
import type { TSPAccountSnapshot, TSPTransactionRow, TSPImportError } from '@models/tsp';

interface TSPImportModalProps {
  onImport: (snapshot: TSPAccountSnapshot) => void;
  onCancel: () => void;
}

export function TSPImportModal({ onImport, onCancel }: TSPImportModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'confirm'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [rows, setRows] = useState<TSPTransactionRow[]>([]);
  const [error, setError] = useState<TSPImportError | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

    try {
      const text = await selectedFile.text();
      setFileContent(text);

      const result = parseTSPCSV(text);
      if ('type' in result) {
        // Error
        setError(result);
        setStep('upload');
      } else {
        // Success
        setRows(result);
        setStep('preview');
      }
    } catch (err) {
      setError({
        type: 'parse-error',
        message: `Failed to read file: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
      setStep('upload');
    }
  };

  const handleConfirmImport = () => {
    if (rows.length === 0) {
      setError({ type: 'validation-error', message: 'No valid transactions found in CSV' });
      return;
    }

    const snapshot = extractSnapshotFromRows(rows);
    const newSnapshot: TSPAccountSnapshot = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      asOf: snapshot.asOf,
      source: 'import',
      traditionalBalance: snapshot.traditionalBalance,
      rothBalance: snapshot.rothBalance,
      fundAllocations: [
        { fund: 'G', percentage: 20 },
        { fund: 'F', percentage: 20 },
        { fund: 'C', percentage: 30 },
        { fund: 'S', percentage: 15 },
        { fund: 'I', percentage: 15 },
        { fund: 'L2050', percentage: 0 },
        { fund: 'L2055', percentage: 0 },
        { fund: 'L2060', percentage: 0 },
        { fund: 'L2065', percentage: 0 },
        { fund: 'L2045', percentage: 0 },
        { fund: 'L2040', percentage: 0 },
        { fund: 'L2035', percentage: 0 },
        { fund: 'L2030', percentage: 0 },
        { fund: 'L2025', percentage: 0 },
        { fund: 'L-Income', percentage: 0 },
      ],
      notes: `Imported from ${file?.name} on ${new Date().toISOString().split('T')[0]}`,
    };

    onImport(newSnapshot);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-3xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import TSP Account Activity CSV</DialogTitle>
          <DialogDescription>
            Download your account activity from TSP.gov and import it here to create a balance snapshot.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold">{error.message}</div>
                  {error.row && <div className="text-xs mt-1">Error at row {error.row}</div>}
                  <div className="text-xs mt-2">
                    Expected CSV format: "Date,Transaction Description,Fund,Source,Amount,Share Price,Shares,Running Balance"
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertDescription className="text-sm">
                <strong>How to export from TSP.gov:</strong>
                <ol className="list-decimal list-inside space-y-1 mt-2 text-xs">
                  <li>Log in to your TSP account at tsp.gov</li>
                  <li>Go to "Account Activity" or "Account Statements"</li>
                  <li>Select date range and download as CSV</li>
                  <li>Upload the file below</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-input"
              />
              <label htmlFor="csv-input" className="cursor-pointer">
                <div className="flex justify-center mb-2">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="text-sm font-medium">Click to select CSV file</div>
                <div className="text-xs text-muted-foreground mt-1">or drag and drop</div>
              </label>
            </div>
          </div>
        )}

        {step === 'preview' && rows.length > 0 && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription className="text-sm">
                Found <strong>{rows.length}</strong> transactions in your CSV.
                Latest balance: <strong>${rows[rows.length - 1]?.runningBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}</strong>
              </AlertDescription>
            </Alert>

            <div>
              <h4 className="text-sm font-medium mb-2">Preview (first 10 rows)</h4>
              <div className="border rounded overflow-x-auto">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Fund</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 10).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell className="max-w-xs truncate">{row.description}</TableCell>
                        <TableCell>
                          {row.fund ? (
                            <Badge variant="outline" className="text-xs">{row.fund}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{row.source}</TableCell>
                        <TableCell className="text-right">
                          {row.amount >= 0 ? '+' : ''}${row.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${row.runningBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {rows.length > 10 && (
                <p className="text-xs text-muted-foreground mt-2">
                  ... and {rows.length - 10} more transactions
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {step === 'upload' && (
            <Button disabled>
              Next
            </Button>
          )}
          {step === 'preview' && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setFileContent('');
                  setRows([]);
                  setError(null);
                  setStep('upload');
                }}
              >
                Choose Different File
              </Button>
              <Button onClick={handleConfirmImport}>
                Create Snapshot from Latest Balance
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
