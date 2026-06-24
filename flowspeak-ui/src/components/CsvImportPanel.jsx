import React, { useCallback, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileUp, Upload, X, AlertTriangle, Database, ArrowRight } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_ENDPOINT || '';
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

// Extracted purely functional logic outside the component to prevent re-creation on render
const parseCsvPreview = (text) => {
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
};

const annotateRows = (rows, errors = [], createdCount = 0, updatedCount = 0) => {
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
};

const validateFile = (f) => {
  if (!f) return 'No file selected.';
  if (!f.name.toLowerCase().endsWith('.csv')) return 'Only .csv files are accepted.';
  if (f.size > MAX_SIZE) return 'File exceeds the 2 MB limit.';
  return null;
};

export default function CsvImportPanel() {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [annotatedRows, setAnnotatedRows] = useState([]);
  const [error, setError] = useState('');
  
  const inputRef = useRef(null);

  const loadPreview = useCallback(async (f) => {
    try {
      const text = await f.text();
      const { rows } = parseCsvPreview(text);
      setPreviewRows(rows);
    } catch (err) {
      console.error('Failed to parse CSV preview:', err);
      setPreviewRows([]);
      setError('Failed to read the file contents.');
    }
  }, []);

  const handleFile = useCallback((f) => {
    if (!f) return;
    const validationError = validateFile(f);
    
    if (validationError) {
      setError(validationError);
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
  }, [loadPreview]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) handleFile(droppedFile);
  }, [handleFile]);

  const handleDragEvents = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragOver(true);
    } else if (e.type === 'dragleave') {
      setDragOver(false);
    }
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
        throw new Error(body.message || `Import failed with status: ${resp.status}`);
      }
      
      setResult(body);
      setAnnotatedRows(annotateRows(previewRows, body.errors || [], body.createdCount || 0, body.updatedCount || 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during import.');
    } finally {
      setUploading(false);
    }
  };

  const clear = useCallback(() => {
    setFile(null);
    setResult(null);
    setPreviewRows([]);
    setAnnotatedRows([]);
    setError('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  const displayRows = annotatedRows.length > 0 ? annotatedRows : previewRows;

  return (
    <div className="h-full overflow-y-auto p-8 space-y-8 custom-scrollbar bg-[#0B0F19] text-slate-200">
      
      {/* Header Section */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-emerald-400/80">
          <Database className="h-3.5 w-3.5" />
          <p className="text-[10px] font-mono uppercase tracking-[0.35em]">Data Ingestion</p>
        </div>
        <h2 className="text-xl font-semibold text-white tracking-tight">CSV Product Validator</h2>
      </div>

      {/* Modernized Dropzone */}
      <div
        onDragEnter={handleDragEvents}
        onDragOver={handleDragEvents}
        onDragLeave={handleDragEvents}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-12 transition-all duration-300 ease-out
          flex flex-col items-center justify-center min-h-60 group
          ${
            dragOver
              ? 'border-emerald-500 bg-emerald-500/5 shadow-[0_0_32px_rgba(16,185,129,0.12)] scale-[1.01]'
              : 'border-slate-800 bg-[#131926] hover:border-slate-600 hover:bg-[#161d2d] hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)]'
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            // Reset value so selecting the exact same file twice still triggers the onChange event
            e.target.value = '';
          }}
        />
        <div className={`p-4 rounded-full mb-4 transition-all duration-300 ${
          dragOver ? 'bg-emerald-500/10 text-emerald-400 scale-110' : 'bg-slate-900 text-slate-500 group-hover:text-slate-400 group-hover:scale-105'
        }`}>
          <Upload className="h-8 w-8" />
        </div>
        <p className="text-sm text-slate-200 font-medium font-mono tracking-wide">
          Drop CSV matrix here or <span className="text-emerald-400 underline decoration-emerald-400/30 underline-offset-4 group-hover:text-emerald-300">browse</span>
        </p>
        <p className="text-[10px] text-slate-500 mt-3 font-mono uppercase tracking-[0.15em] border border-slate-800/60 rounded px-2.5 py-1 bg-slate-900/40">
          SKU · Name · Price · Stock · Max 2 MB
        </p>
      </div>

      {/* File Selected Banner */}
      {file && (
        <div className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-linear-to-r from-[#131926] to-[#0B0F19] px-5 py-4 shadow-lg shadow-black/20">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <FileUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-white font-mono font-medium">{file.name}</p>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                <span>{(file.size / 1024).toFixed(1)} KB</span>
                <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                <span className="text-emerald-500/80 font-semibold">{previewRows.length} rows detected</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={clear}
              className="text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 p-2 rounded-lg transition-colors"
              title="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={upload}
              disabled={uploading || previewRows.length === 0}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-slate-950 text-xs font-mono font-bold px-5 py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer disabled:cursor-not-allowed"
            >
              {uploading ? 'PROCESSING...' : 'EXECUTE IMPORT'}
              {!uploading && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="p-1 rounded-full bg-red-500/10 shrink-0">
            <AlertCircle className="h-4 w-4 text-red-400" />
          </div>
          <div className="mt-0.5">
            <h4 className="text-xs font-mono font-semibold text-red-400 uppercase tracking-wider">Import Error</h4>
            <p className="text-xs font-mono text-red-300/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {result && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="p-1 rounded-full bg-emerald-500/10 shrink-0">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-0.5 w-full">
            <h4 className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">Execution Complete</h4>
            <div className="mt-2 flex items-center flex-wrap gap-4 text-xs font-mono">
              <span className="text-slate-300"><strong className="text-white">{result.totalProcessed ?? 0}</strong> Processed</span>
              <span className="w-1 h-1 rounded-full bg-slate-700 hidden sm:block"></span>
              <span className="text-emerald-300/80"><strong className="text-emerald-400">{result.createdCount ?? 0}</strong> Created</span>
              <span className="w-1 h-1 rounded-full bg-slate-700 hidden sm:block"></span>
              <span className="text-blue-300/80"><strong className="text-blue-400">{result.updatedCount ?? 0}</strong> Updated</span>
              {Boolean(result.errorsCount > 0) && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-700 hidden sm:block"></span>
                  <span className="text-red-300/80"><strong className="text-red-400">{result.errorsCount}</strong> Errors</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Data Grid */}
      {displayRows.length > 0 && (
        <div className="rounded-xl border border-slate-800/80 bg-[#131926] shadow-xl overflow-hidden flex flex-col animate-in fade-in duration-500">
          <div className="px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/50 flex justify-between items-center">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${result ? 'bg-emerald-500' : 'bg-blue-500'} ${uploading ? 'animate-pulse' : ''}`} />
              {result ? 'Execution Results Data Matrix' : 'Pre-flight Data Matrix'}
            </h4>
            <span className="text-[10px] font-mono text-slate-500">{displayRows.length} Rows</span>
          </div>
          
          <div className="overflow-x-auto max-h-100 custom-scrollbar relative">
            <table className="w-full text-xs font-mono text-left whitespace-nowrap">
              <thead className="sticky top-0 bg-[#131926] text-slate-500 border-b border-slate-800/80 z-10 shadow-sm">
                <tr>
                  <th className="py-3 px-5 text-[10px] uppercase tracking-wider font-semibold w-16">#</th>
                  <th className="py-3 px-5 text-[10px] uppercase tracking-wider font-semibold">SKU</th>
                  <th className="py-3 px-5 text-[10px] uppercase tracking-wider font-semibold">Name</th>
                  <th className="py-3 px-5 text-[10px] uppercase tracking-wider font-semibold text-right">Price</th>
                  <th className="py-3 px-5 text-[10px] uppercase tracking-wider font-semibold text-right">Stock</th>
                  <th className="py-3 px-5 text-[10px] uppercase tracking-wider font-semibold w-48">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {displayRows.map((row) => (
                  <tr
                    key={`row-${row.rowNum}`}
                    className={`group transition-colors hover:bg-white/2 ${
                      row.status === 'sku_conflict' ? 'bg-amber-500/2' :
                      row.status === 'error' ? 'bg-red-500/2' : ''
                    }`}
                  >
                    <td className="py-3 px-5 text-slate-600 font-medium">{row.rowNum}</td>
                    <td className="py-3 px-5 text-slate-300 font-semibold">{row.sku}</td>
                    <td className="py-3 px-5 text-slate-400 group-hover:text-slate-300 transition-colors">{row.name}</td>
                    <td className="py-3 px-5 text-right text-slate-400">{row.price}</td>
                    <td className="py-3 px-5 text-right text-slate-400">{row.stock}</td>
                    <td className="py-3 px-5">
                      
                      {row.status === 'sku_conflict' && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                          <AlertTriangle className="h-3 w-3" />
                          Conflict: Soft-Deleted
                        </span>
                      )}
                      
                      {row.status === 'error' && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full border border-red-400/20 truncate max-w-55" title={row.error}>
                          <X className="h-3 w-3 shrink-0" />
                          {row.error}
                        </span>
                      )}
                      
                      {row.status === 'created' && !row.error && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          CREATED
                        </span>
                      )}

                      {row.status === 'updated' && !row.error && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded-full border border-blue-400/20">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                          UPDATED
                        </span>
                      )}

                      {(row.status === 'ok' || !row.status) && !row.error && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-full border border-slate-700/50">
                          <div className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                          {row.status === 'ok' ? 'READY' : 'PENDING'}
                        </span>
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