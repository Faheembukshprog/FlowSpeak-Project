import React, { useCallback, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileUp, Upload, X, AlertTriangle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_ENDPOINT || '';
const MAX_SIZE = 2 * 1024 * 1024;

function parseCsvPreview(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else current += c;
    }
    fields.push(current.trim());
    return fields;
  };

  const first = parseLine(lines[0]);
  const isHeader = first[0]?.toLowerCase() === 'sku' || first[0]?.toLowerCase() === 'name';
  const headers = isHeader ? first : ['SKU', 'Name', 'Price', 'Stock'];
  const dataLines = isHeader ? lines.slice(1) : lines;

  const rows = dataLines.map((line, idx) => {
    const fields = parseLine(line);
    return {
      rowNum: idx + 1 + (isHeader ? 1 : 0),
      sku: (fields[0] || '').trim().toUpperCase(),
      name: (fields[1] || '').trim(),
      price: (fields[2] || '').trim(),
      stock: (fields[3] || '').trim(),
    };
  }).filter((r) => r.sku || r.name);

  return { headers, rows };
}

function annotateRows(rows, errors = [], createdCount = 0, updatedCount = 0) {
  const errorMap = {};
  errors.forEach((err) => {
    const match = err.match(/Row (\d+):/);
    if (match) errorMap[parseInt(match[1], 10)] = err;
  });

  let created = 0;
  let updated = 0;

  return rows.map((row) => {
    const err = errorMap[row.rowNum];
    if (err) {
      const isSkuConflict = err.toLowerCase().includes('deleted product') || err.toLowerCase().includes('soft-deleted');
      return { ...row, status: isSkuConflict ? 'sku_conflict' : 'error', error: err };
    }
    if (created < createdCount) {
      created++;
      return { ...row, status: 'created' };
    }
    if (updated < updatedCount) {
      updated++;
      return { ...row, status: 'updated' };
    }
    return { ...row, status: 'ok' };
  });
}

export default function CsvImportPanel() {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [annotatedRows, setAnnotatedRows] = useState([]);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const validateFile = (f) => {
    if (!f) return 'No file selected.';
    if (!f.name.toLowerCase().endsWith('.csv')) return 'Only .csv files are accepted.';
    if (f.size > MAX_SIZE) return 'File exceeds the 2 MB limit.';
    return null;
  };

  const loadPreview = async (f) => {
    try {
      const text = await f.text();
      const { rows } = parseCsvPreview(text);
      setPreviewRows(rows);
    } catch {
      setPreviewRows([]);
    }
  };

  const handleFile = (f) => {
    const err = validateFile(f);
    if (err) {
      setError(err);
      setFile(null);
      setResult(null);
      setPreviewRows([]);
      setAnnotatedRows([]);
      return;
    }
    setError('');
    setFile(f);
    setResult(null);
    setAnnotatedRows([]);
    loadPreview(f);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, []);

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setResult(null);
    setAnnotatedRows([]);
    try {
      const form = new FormData();
      form.append('file', file);
      const resp = await fetch(`${API_BASE}/api/products/import`, {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(body.message || `Import failed (${resp.status})`);
      }
      setResult(body);
      setAnnotatedRows(annotateRows(previewRows, body.errors || [], body.createdCount || 0, body.updatedCount || 0));
    } catch (err) {
      setError(err.message || 'Import failed.');
    } finally {
      setUploading(false);
    }
  };

  const clear = () => {
    setFile(null);
    setResult(null);
    setPreviewRows([]);
    setAnnotatedRows([]);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const displayRows = annotatedRows.length > 0 ? annotatedRows : previewRows;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#0B0F19]">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-slate-500">Data Ingestion</p>
        <h2 className="text-sm font-semibold text-slate-200 mt-1">CSV Product Validator</h2>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all duration-200 ${
          dragOver
            ? 'border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_24px_rgba(16,185,129,0.08)] scale-[1.005]'
            : 'border-slate-700/80 bg-[#151B2B] hover:border-slate-500/60'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Upload className={`h-10 w-10 mx-auto mb-4 transition-colors ${dragOver ? 'text-emerald-400' : 'text-slate-500'}`} />
        <p className="text-sm text-slate-300 font-medium font-mono">Drop CSV matrix here or click to browse</p>
        <p className="text-[10px] text-slate-600 mt-2 font-mono uppercase tracking-wider">SKU · Name · Price · Stock · Max 2 MB</p>
      </div>

      {file && (
        <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-[#151B2B] px-4 py-3">
          <div className="flex items-center gap-3">
            <FileUp className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-sm text-white font-mono">{file.name}</p>
              <p className="text-[10px] font-mono text-slate-500">{(file.size / 1024).toFixed(1)} KB · {previewRows.length} rows detected</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={upload}
              disabled={uploading}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-mono font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {uploading ? 'Importing...' : 'Execute Import'}
            </button>
            <button type="button" onClick={clear} className="text-slate-500 hover:text-white p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs font-mono text-red-300">{error}</p>
        </div>
      )}

      {result && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs font-mono text-emerald-200">
            <p className="font-semibold uppercase tracking-wider">Import complete</p>
            <p className="mt-1 text-emerald-300/80">
              {result.totalProcessed} processed · {result.createdCount} created · {result.updatedCount} updated
              {result.errorsCount > 0 && ` · ${result.errorsCount} errors`}
            </p>
          </div>
        </div>
      )}

      {displayRows.length > 0 && (
        <div className="rounded-xl border border-slate-800/80 bg-[#151B2B] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800/80 bg-[#0F1423]">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
              {result ? 'Execution Results Grid' : 'Preview Grid'}
            </h4>
          </div>
          <div className="overflow-x-auto max-h-80 custom-scrollbar">
            <table className="w-full text-xs font-mono">
              <thead className="sticky top-0 bg-[#151B2B] text-slate-500 border-b border-slate-800/80">
                <tr>
                  <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wider font-normal">#</th>
                  <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wider font-normal">SKU</th>
                  <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wider font-normal">Name</th>
                  <th className="text-right py-2.5 px-4 text-[10px] uppercase tracking-wider font-normal">Price</th>
                  <th className="text-right py-2.5 px-4 text-[10px] uppercase tracking-wider font-normal">Stock</th>
                  <th className="text-left py-2.5 px-4 text-[10px] uppercase tracking-wider font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row) => (
                  <tr
                    key={row.rowNum}
                    className={`border-b border-slate-800/40 ${
                      row.status === 'sku_conflict' ? 'bg-amber-500/5' :
                      row.status === 'error' ? 'bg-red-500/5' :
                      row.status === 'created' || row.status === 'updated' ? 'bg-emerald-500/[0.03]' : ''
                    }`}
                  >
                    <td className="py-2 px-4 text-slate-600">{row.rowNum}</td>
                    <td className="py-2 px-4 text-slate-300">{row.sku}</td>
                    <td className="py-2 px-4 text-slate-300">{row.name}</td>
                    <td className="py-2 px-4 text-right text-slate-400">{row.price}</td>
                    <td className="py-2 px-4 text-right text-slate-400">{row.stock}</td>
                    <td className="py-2 px-4">
                      {row.status === 'sku_conflict' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded">
                          <AlertTriangle className="h-3 w-3" />
                          [SKU Conflict: Soft-Deleted Record Found]
                        </span>
                      )}
                      {row.status === 'error' && (
                        <span className="text-[10px] text-red-400 truncate block max-w-[200px]" title={row.error}>{row.error}</span>
                      )}
                      {(row.status === 'created' || row.status === 'updated' || row.status === 'ok') && !row.error && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          {row.status === 'created' ? 'CREATED' : row.status === 'updated' ? 'UPDATED' : 'READY'}
                        </span>
                      )}
                      {!row.status && (
                        <span className="text-[10px] text-slate-600">PENDING</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
