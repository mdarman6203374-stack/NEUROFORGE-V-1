import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Database,
  Download,
  FileSpreadsheet,
  KeyRound,
  RefreshCw,
  Search,
  Table2,
  Columns3,
  AlertCircle,
} from 'lucide-react';
import {
  CsvTableDef,
  CsvTier,
  buildZipArchive,
  serializeTableToCsv,
} from '../utils/databaseCsvEngine';
import {
  LiveDatabaseCollectionResult,
  collectLiveNormalizedDatabaseTables,
} from '../utils/browserDbCollector';
import { useAuth } from '../firebase/authContext';
import {
  Language,
  SchedulePace,
  StreakState,
  StudyReminderConfig,
} from '../types';

interface DatabaseCsvCenterViewProps {
  language: Language;
  pace: SchedulePace;
  completedConcepts: string[];
  completedDays: number[];
  streakState: StreakState;
  reminderConfig?: StudyReminderConfig;
}

const TIER_FILTERS: Array<{ id: 'all' | CsvTier; label: string }> = [
  { id: 'all', label: 'All Tables' },
  { id: 'firestore', label: 'Firestore Backend' },
  { id: 'activity', label: 'User Activity' },
  { id: 'curriculum', label: 'Curriculum' },
  { id: 'schema', label: 'Schema Dictionary' },
];

const ROWS_PER_PAGE = 40;

export const DatabaseCsvCenterView: React.FC<DatabaseCsvCenterViewProps> = ({
  language,
  pace,
  completedConcepts,
  completedDays,
  streakState,
  reminderConfig,
}) => {
  const { dbMode, user } = useAuth();
  const isHinglish = language === 'hinglish';

  const [snapshot, setSnapshot] = useState<LiveDatabaseCollectionResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tierFilter, setTierFilter] = useState<'all' | CsvTier>('all');
  const [tableSearch, setTableSearch] = useState<string>('');
  const [selectedTableName, setSelectedTableName] = useState<string>('users');
  const [inspectorMode, setInspectorMode] = useState<'data' | 'schema'>('data');
  const [rowSearch, setRowSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [includeBom, setIncludeBom] = useState<boolean>(true);
  const [copiedTable, setCopiedTable] = useState<boolean>(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const loadTables = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await collectLiveNormalizedDatabaseTables({
        dbMode,
        pace,
        language,
        completedConcepts,
        completedDays,
        streakState,
        reminderConfig,
      });
      setSnapshot(result);
    } finally {
      setIsLoading(false);
    }
  }, [dbMode, pace, language, completedConcepts, completedDays, streakState, reminderConfig]);

  useEffect(() => {
    void loadTables();
  }, [loadTables]);

  const allTables: CsvTableDef[] = snapshot?.tables || [];

  const filteredTables = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return allTables.filter((t) => {
      if (tierFilter !== 'all' && t.tier !== tierFilter) return false;
      if (!q) return true;
      return (
        t.tableName.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.columns.some((c) => c.name.toLowerCase().includes(q))
      );
    });
  }, [allTables, tierFilter, tableSearch]);

  const activeTable = useMemo(() => {
    return (
      allTables.find((t) => t.tableName === selectedTableName) ||
      filteredTables[0] ||
      allTables[0] ||
      null
    );
  }, [allTables, filteredTables, selectedTableName]);

  const filteredRows = useMemo(() => {
    if (!activeTable) return [];
    const q = rowSearch.trim().toLowerCase();
    if (!q) return activeTable.rows;
    return activeTable.rows.filter((row) =>
      activeTable.columns.some((col) =>
        String(row[col.name] ?? '')
          .toLowerCase()
          .includes(q)
      )
    );
  }, [activeTable, rowSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * ROWS_PER_PAGE;
    return filteredRows.slice(start, start + ROWS_PER_PAGE);
  }, [filteredRows, safePage]);

  const handleSelectTable = (name: string) => {
    setSelectedTableName(name);
    setRowSearch('');
    setPage(1);
  };

  const triggerBlobDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSingleCsv = (tbl: CsvTableDef) => {
    const csv = serializeTableToCsv(tbl.columns, tbl.rows, includeBom);
    triggerBlobDownload(
      new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
      tbl.fileName
    );
    setDownloadNotice(
      isHinglish
        ? `${tbl.fileName} download ho gaya (${tbl.rows.length} rows).`
        : `Downloaded ${tbl.fileName} (${tbl.rows.length} rows).`
    );
    setTimeout(() => setDownloadNotice(null), 3000);
  };

  const handleCopyCsv = (tbl: CsvTableDef) => {
    const csv = serializeTableToCsv(tbl.columns, tbl.rows, false);
    navigator.clipboard?.writeText(csv);
    setCopiedTable(true);
    setTimeout(() => setCopiedTable(false), 1800);
  };

  const handleDownloadAllZip = (onlyFiltered = false) => {
    const targetTables = onlyFiltered ? filteredTables : allTables;
    if (targetTables.length === 0) return;

    const files = targetTables.map((tbl) => ({
      path: tbl.folder ? `${tbl.folder}/${tbl.fileName}` : tbl.fileName,
      content: serializeTableToCsv(tbl.columns, tbl.rows, includeBom),
    }));

    const zipBytes = buildZipArchive(files);
    const blob = new Blob([zipBytes.buffer as ArrayBuffer], { type: 'application/zip' });
    const dateStamp = new Date().toISOString().split('T')[0];
    triggerBlobDownload(
      blob,
      `TensorPlay_Database_CSVs_${onlyFiltered ? tierFilter : 'all'}_${dateStamp}.zip`
    );
    setDownloadNotice(
      isHinglish
        ? `${targetTables.length} separate CSV tables ZIP archive mein download ho gayi!`
        : `Exported ${targetTables.length} separate CSV tables in ZIP archive.`
    );
    setTimeout(() => setDownloadNotice(null), 3500);
  };

  const totalRowsAcrossAll = useMemo(
    () => allTables.reduce((sum, t) => sum + t.rows.length, 0),
    [allTables]
  );

  return (
    <div className="space-y-6">
      {/* Console Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
              <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                1NF Normalized Relational Export
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{allTables.length} CSV Tables</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{totalRowsAcrossAll} Live Rows</span>
              <span aria-hidden="true">·</span>
              <span>
                {snapshot?.firestoreStatus === 'live-firestore'
                  ? `Firestore Live (${user?.email || 'Authenticated'})`
                  : 'Local Mirror + Curriculum'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isHinglish
                ? 'Database Tables & CSV Export Center'
                : 'Backend Database CSV Export Center'}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
              {isHinglish
                ? 'Firebase Firestore collections, browser study logs aur AI curriculum ko alag-alag normalized 1NF CSV table files mein inspect aur download karein.'
                : 'Inspect and download every Firestore collection, browser activity log, and curriculum dataset as separate 1st-Normal-Form CSV table files linked by primary and foreign keys.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void loadTables()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownloadAllZip(false)}
              disabled={isLoading || allTables.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Download All CSVs (.zip)</span>
            </button>
          </div>
        </div>

        {/* Tier Filter Bar & Status Line */}
        <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70">
            {TIER_FILTERS.map((tf) => {
              const active = tierFilter === tf.id;
              return (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => setTierFilter(tf.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeBom}
                onChange={(e) => setIncludeBom(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Excel UTF-8 BOM</span>
            </label>

            {downloadNotice && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {downloadNotice}
              </span>
            )}
          </div>
        </div>

        {snapshot?.firestoreNotice && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{snapshot.firestoreNotice}</span>
          </div>
        )}
      </div>

      {/* Main Split Console: Table Catalog (Left) + Data Grid / Schema Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Table Catalog */}
        <aside className="lg:col-span-4 xl:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 space-y-3 lg:sticky lg:top-20">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Filter tables or columns..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          <div className="space-y-1 max-h-[66vh] overflow-y-auto pr-1">
            {isLoading && allTables.length === 0 ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
                />
              ))
            ) : filteredTables.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
                No tables match your filter.
              </p>
            ) : (
              filteredTables.map((tbl) => {
                const isSelected = activeTable?.tableName === tbl.tableName;
                return (
                  <button
                    key={tbl.tableName}
                    type="button"
                    onClick={() => handleSelectTable(tbl.tableName)}
                    className={`w-full text-left px-3 py-2 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-700 text-indigo-900 dark:text-indigo-100'
                        : 'bg-slate-50/60 dark:bg-slate-900/50 border-slate-200/70 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-mono font-semibold truncate">
                        {tbl.fileName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {tbl.tier} · {tbl.columns.length} cols
                      </div>
                    </div>
                    <span className="text-[11px] font-mono tabular-nums font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                      {tbl.rows.length}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {tierFilter !== 'all' && filteredTables.length > 0 && (
            <button
              type="button"
              onClick={() => handleDownloadAllZip(true)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span>Export {filteredTables.length} Filtered (.zip)</span>
            </button>
          )}
        </aside>

        {/* Right Workspace: Selected Table Data Preview & Schema */}
        <section className="lg:col-span-8 xl:col-span-9 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 overflow-hidden">
          {!activeTable ? (
            <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              Select a table from the catalog to inspect rows and download CSV.
            </div>
          ) : (
            <>
              {/* Active Table Toolbar */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                      <span>{activeTable.folder ? `${activeTable.folder}/${activeTable.fileName}` : activeTable.fileName}</span>
                      <span aria-hidden="true">·</span>
                      <span>PK: {activeTable.primaryKey}</span>
                      <span aria-hidden="true">·</span>
                      <span>{activeTable.sourceLabel}</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="font-mono truncate">{activeTable.tableName}</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                      {activeTable.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyCsv(activeTable)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {copiedTable ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedTable ? 'Copied' : 'Copy CSV'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadSingleCsv(activeTable)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download {activeTable.fileName}</span>
                    </button>
                  </div>
                </div>

                {/* View Mode Toggle + Row Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 self-start">
                    <button
                      type="button"
                      onClick={() => setInspectorMode('data')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                        inspectorMode === 'data'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Table2 className="w-3.5 h-3.5" />
                      <span className="tabular-nums">Data Rows ({filteredRows.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectorMode('schema')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                        inspectorMode === 'schema'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Columns3 className="w-3.5 h-3.5" />
                      <span className="tabular-nums">Schema Columns ({activeTable.columns.length})</span>
                    </button>
                  </div>

                  {inspectorMode === 'data' && (
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={rowSearch}
                        onChange={(e) => {
                          setRowSearch(e.target.value);
                          setPage(1);
                        }}
                        placeholder="Search rows in this table..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Inspector Content */}
              {inspectorMode === 'schema' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        <th className="py-2.5 px-4 font-semibold">#</th>
                        <th className="py-2.5 px-4 font-semibold">Column Name</th>
                        <th className="py-2.5 px-4 font-semibold">Type</th>
                        <th className="py-2.5 px-4 font-semibold">Key</th>
                        <th className="py-2.5 px-4 font-semibold">References</th>
                        <th className="py-2.5 px-4 font-semibold">Nullable</th>
                        <th className="py-2.5 px-4 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                      {activeTable.columns.map((col, idx) => (
                        <tr
                          key={col.name}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                        >
                          <td className="py-2.5 px-4 font-mono tabular-nums text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {col.name}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                            {col.type}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-semibold whitespace-nowrap">
                            {col.keyType ? (
                              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                <KeyRound className="w-3 h-3" />
                                {col.keyType}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {col.references || '-'}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                            {col.nullable ? 'YES' : 'NOT NULL'}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                            {col.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {isHinglish
                      ? 'Is table mein abhi 0 live records hain.'
                      : 'This table currently has 0 live records.'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    {isHinglish
                      ? 'Aap phir bhi "Download ' +
                        activeTable.fileName +
                        '" par click karke header-only relational CSV template download kar sakte hain.'
                      : `You can still click Download ${activeTable.fileName} to export the exact normalized CSV header template for database import.`}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto max-h-[58vh]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3 font-mono text-[11px] font-semibold text-slate-400 tabular-nums border-r border-slate-200/70 dark:border-slate-800">
                            #
                          </th>
                          {activeTable.columns.map((col) => (
                            <th
                              key={col.name}
                              className="py-2.5 px-3 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap"
                              title={`${col.type}${col.keyType ? ` (${col.keyType})` : ''} — ${col.description}`}
                            >
                              {col.name}
                              {col.keyType && (
                                <span className="ml-1 text-[10px] text-amber-600 dark:text-amber-400">
                                  [{col.keyType}]
                                </span>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                        {pagedRows.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                          >
                            <td className="py-2 px-3 font-mono tabular-nums text-[11px] text-slate-400 border-r border-slate-200/60 dark:border-slate-800">
                              {(safePage - 1) * ROWS_PER_PAGE + rIdx + 1}
                            </td>
                            {activeTable.columns.map((col) => {
                              const rawVal = row[col.name];
                              const isNumeric =
                                col.type === 'INTEGER' || col.type === 'FLOAT';
                              const isEmpty =
                                rawVal === null || rawVal === undefined || rawVal === '';
                              return (
                                <td
                                  key={col.name}
                                  className={`py-2 px-3 max-w-[280px] truncate ${
                                    isNumeric
                                      ? 'font-mono tabular-nums text-right text-slate-800 dark:text-slate-200'
                                      : 'text-slate-700 dark:text-slate-300'
                                  }`}
                                  title={isEmpty ? '' : String(rawVal)}
                                >
                                  {isEmpty ? (
                                    <span className="font-mono text-[10px] text-slate-400">
                                      NULL
                                    </span>
                                  ) : (
                                    String(rawVal)
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-mono tabular-nums">
                        Page {safePage} of {totalPages} · {filteredRows.length} rows
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={safePage <= 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Prev</span>
                        </button>
                        <button
                          type="button"
                          disabled={safePage >= totalPages}
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 cursor-pointer"
                        >
                          <span>Next</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};
