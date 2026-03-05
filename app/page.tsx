'use client';

import { useState, useCallback, useRef } from 'react';

type FileState = {
  file: File | null;
  name: string;
  status: 'empty' | 'ready' | 'processing' | 'done' | 'error';
};

type LineItem = {
  lineNumber: number;
  partNumber: string;
  description: string;
  quantity: number | string;
  unitPrice: number | string;
  total: number | string;
  uom?: string;
};

type ComparisonRow = {
  status: 'match' | 'mismatch' | 'warning' | 'missing_from_entry' | 'extra_in_entry';
  customerItem: LineItem | null;
  entryItem: LineItem | null;
  issues: string[];
};

type ComparisonResult = {
  summary: {
    totalCustomerItems: number;
    totalEntryItems: number;
    matches: number;
    warnings: number;
    errors: number;
    missing: number;
    extras: number;
  };
  headerComparison: {
    field: string;
    customerValue: string;
    entryValue: string;
    match: boolean;
  }[];
  lineItems: ComparisonRow[];
  recommendations: string[];
  overallStatus: 'pass' | 'review' | 'fail';
};

function UploadZone({
  label,
  sublabel,
  fileState,
  onFile,
  accent,
}: {
  label: string;
  sublabel: string;
  fileState: FileState;
  onFile: (f: File) => void;
  accent: string;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f && f.type === 'application/pdf') onFile(f);
    },
    [onFile]
  );

  const accentStyles: Record<string, { border: string; bg: string; icon: string }> = {
    blue: { border: 'border-blue-300', bg: 'bg-blue-50', icon: 'text-blue-500' },
    amber: { border: 'border-amber-300', bg: 'bg-amber-50', icon: 'text-amber-500' },
  };

  const s = accentStyles[accent] || accentStyles.blue;

  return (
    <div
      className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer
        ${dragOver ? `${s.border} ${s.bg} scale-[1.01]` : fileState.file ? `${s.border} ${s.bg}` : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />

      {fileState.file ? (
        <div className="space-y-2">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${s.bg}`}>
            <svg className={`w-5 h-5 ${s.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">{fileState.name}</span>
          </div>
          <p className="text-xs text-gray-400">Click or drop to replace</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>
          </div>
          <p className="text-xs text-gray-300">PDF only</p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ComparisonResult['overallStatus'] }) {
  const config = {
    pass: { label: 'ALL CLEAR', bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
    review: { label: 'NEEDS REVIEW', bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
    fail: { label: 'DISCREPANCIES FOUND', bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide ${c.bg} ${c.text}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function ResultRow({ row, index }: { row: ComparisonRow; index: number }) {
  const [open, setOpen] = useState(false);

  const statusConfig: Record<string, { bg: string; border: string; icon: string; iconColor: string }> = {
    match: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '✓', iconColor: 'text-emerald-600' },
    mismatch: { bg: 'bg-red-50', border: 'border-red-200', icon: '✕', iconColor: 'text-red-600' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: '⚠', iconColor: 'text-amber-600' },
    missing_from_entry: { bg: 'bg-red-50', border: 'border-red-200', icon: '−', iconColor: 'text-red-600' },
    extra_in_entry: { bg: 'bg-blue-50', border: 'border-blue-200', icon: '+', iconColor: 'text-blue-600' },
  };

  const s = statusConfig[row.status] || statusConfig.warning;
  const item = row.customerItem || row.entryItem;

  return (
    <div className={`animate-in`} style={{ animationDelay: `${index * 50}ms`, opacity: 0 }}>
      <div
        className={`rounded-lg border ${s.border} ${s.bg} p-3 cursor-pointer transition-all hover:shadow-sm`}
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <span className={`text-lg font-bold ${s.iconColor} w-6 text-center`}>{s.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-gray-800">
                {item?.partNumber || 'N/A'}
              </span>
              <span className="text-xs text-gray-400 truncate">{item?.description || ''}</span>
            </div>
            {row.issues.length > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">{row.issues[0]}{row.issues.length > 1 ? ` +${row.issues.length - 1} more` : ''}</p>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {row.customerItem && <span>Qty: {row.customerItem.quantity}</span>}
            <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {open && (
          <div className="mt-3 pt-3 border-t border-gray-200/50 grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Customer PO</p>
              {row.customerItem ? (
                <div className="space-y-1 text-gray-700">
                  <p><span className="text-gray-400">Part:</span> {row.customerItem.partNumber}</p>
                  <p><span className="text-gray-400">Desc:</span> {row.customerItem.description}</p>
                  <p><span className="text-gray-400">Qty:</span> {row.customerItem.quantity} {row.customerItem.uom || ''}</p>
                  <p><span className="text-gray-400">Unit $:</span> {row.customerItem.unitPrice}</p>
                  <p><span className="text-gray-400">Total:</span> {row.customerItem.total}</p>
                </div>
              ) : (
                <p className="text-gray-400 italic">Not found</p>
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Entered Order</p>
              {row.entryItem ? (
                <div className="space-y-1 text-gray-700">
                  <p><span className="text-gray-400">Part:</span> {row.entryItem.partNumber}</p>
                  <p><span className="text-gray-400">Desc:</span> {row.entryItem.description}</p>
                  <p><span className="text-gray-400">Qty:</span> {row.entryItem.quantity} {row.entryItem.uom || ''}</p>
                  <p><span className="text-gray-400">Unit $:</span> {row.entryItem.unitPrice}</p>
                  <p><span className="text-gray-400">Total:</span> {row.entryItem.total}</p>
                </div>
              ) : (
                <p className="text-gray-400 italic">Not found</p>
              )}
            </div>
            {row.issues.length > 0 && (
              <div className="col-span-2 mt-1">
                <p className="font-semibold text-gray-500 mb-1 uppercase tracking-wider">Issues</p>
                <ul className="space-y-0.5">
                  {row.issues.map((issue, i) => (
                    <li key={i} className="text-gray-600">• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [customerFile, setCustomerFile] = useState<FileState>({ file: null, name: '', status: 'empty' });
  const [entryFile, setEntryFile] = useState<FileState>({ file: null, name: '', status: 'empty' });
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  const handleCompare = async () => {
    if (!customerFile.file || !entryFile.file) return;

    setLoading(true);
    setError('');
    setResult(null);
    setProgress('Reading PDFs...');

    try {
      const toBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

      setProgress('Converting documents...');
      const [customerB64, entryB64] = await Promise.all([
        toBase64(customerFile.file),
        toBase64(entryFile.file),
      ]);

      setProgress('AI is analyzing both orders...');

      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerPdf: customerB64,
          entryPdf: entryB64,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      setProgress('Building comparison...');
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const handleReset = () => {
    setCustomerFile({ file: null, name: '', status: 'empty' });
    setEntryFile({ file: null, name: '', status: 'empty' });
    setResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                OrderBot
              </h1>
            </div>
          </div>
          {result && (
            <button
              onClick={handleReset}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              New comparison
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {!result ? (
          /* Upload Section */
          <div className="animate-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Compare Orders
              </h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Upload the customer&apos;s purchase order and your entered order. AI will check every line item for discrepancies.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <UploadZone
                label="Customer Purchase Order"
                sublabel="The original PO from your customer"
                fileState={customerFile}
                onFile={(f) => setCustomerFile({ file: f, name: f.name, status: 'ready' })}
                accent="blue"
              />
              <UploadZone
                label="Entered Order"
                sublabel="Your order as entered in the system"
                fileState={entryFile}
                onFile={(f) => setEntryFile({ file: f, name: f.name, status: 'ready' })}
                accent="amber"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleCompare}
              disabled={!customerFile.file || !entryFile.file || loading}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                customerFile.file && entryFile.file && !loading
                  ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-md hover:shadow-lg active:scale-[0.99]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {progress}
                </span>
              ) : (
                'Compare Orders'
              )}
            </button>

            <p className="text-center text-xs text-gray-400 mt-3">
              Powered by Claude AI — checks part numbers, quantities, pricing, and more
            </p>
          </div>
        ) : (
          /* Results Section */
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="animate-in bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
                  Comparison Results
                </h3>
                <StatusBadge status={result.overallStatus} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                {[
                  { label: 'Matches', val: result.summary.matches, color: 'text-emerald-600' },
                  { label: 'Warnings', val: result.summary.warnings, color: 'text-amber-600' },
                  { label: 'Errors', val: result.summary.errors, color: 'text-red-600' },
                  { label: 'Missing', val: result.summary.missing, color: 'text-red-600' },
                  { label: 'Extras', val: result.summary.extras, color: 'text-blue-600' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-gray-50 rounded-lg p-3">
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.val}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Header Comparison */}
            {result.headerComparison.length > 0 && (
              <div className="animate-in animate-in-delay-1 bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Order Header</h4>
                <div className="divide-y divide-gray-100">
                  {result.headerComparison.map((h, i) => (
                    <div key={i} className="flex items-center py-2 text-sm gap-3">
                      <span className={`w-5 text-center ${h.match ? 'text-emerald-500' : 'text-red-500'}`}>
                        {h.match ? '✓' : '✕'}
                      </span>
                      <span className="text-gray-500 w-32 flex-shrink-0">{h.field}</span>
                      <span className="text-gray-700 flex-1 font-mono text-xs">{h.customerValue}</span>
                      {!h.match && (
                        <>
                          <span className="text-gray-300">→</span>
                          <span className="text-red-600 flex-1 font-mono text-xs">{h.entryValue}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Line Items */}
            <div className="animate-in animate-in-delay-2">
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Line Items</h4>
              <div className="space-y-2">
                {result.lineItems.map((row, i) => (
                  <ResultRow key={i} row={row} index={i} />
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="animate-in animate-in-delay-3 bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Recommended Actions</h4>
                <div className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-2 text-sm text-gray-600">
                      <span className="text-gray-400 flex-shrink-0">{i + 1}.</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
