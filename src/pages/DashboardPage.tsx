/**
 * @file src/pages/DashboardPage.tsx
 * @description Central clinical screening dashboard showing aggregate metrics, Recharts, and quick actions.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  ScanEye,
  Database,
  Download,
  Trash2,
  Sparkles,
  Zap,
  Activity,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
} from 'recharts';
import {
  getHistory,
  computeDashboardStats,
  exportHistoryCsv,
  loadSampleHistory,
  clearHistory,
  DashboardStats,
} from '../lib/history';
import { downloadCsvFile } from '../lib/auditLog';
import { HistoryItem } from '../types';
import { useApp } from '../context/AppContext';

export const DashboardPage: React.FC = () => {
  const { bank } = useApp();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<DashboardStats>(() => computeDashboardStats([]));
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const h = await getHistory();
      setHistory(h);
      setStats(computeDashboardStats(h));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCsv = () => {
    const csv = exportHistoryCsv(history);
    downloadCsvFile(csv, `scankavach-history-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear screening history from this device?')) {
      await clearHistory();
      await loadData();
    }
  };

  const handleLoadSample = async () => {
    await loadSampleHistory();
    await loadData();
  };

  const reviewThresh = bank?.reviewThreshold ?? 0.35;
  const referThresh = bank?.referThreshold ?? 0.65;
  const meetsUnder1s = stats.avgLatencyMs > 0 && stats.avgLatencyMs < 1000;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Screening & Anomaly Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Overview of client-side medical scan screening telemetry and calibrated reference status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/analyze"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <ScanEye className="w-4 h-4" />
            Analyze Scan
          </Link>
          <button
            onClick={handleExportCsv}
            disabled={history.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
            title="Load synthetic sample screening history"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Load Sample Data (Synthetic)
          </button>
          {history.length > 0 && (
            <button
              onClick={handleClear}
              className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800 rounded-lg border border-slate-700 transition-colors"
              title="Clear History"
              aria-label="Clear History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Primary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Total Scans</div>
          <div className="mt-1 text-2xl font-bold text-slate-100">{stats.totalScans}</div>
          <div className="mt-1 text-[11px] text-teal-400">On-device screenings</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Normal Baselines</div>
          <div className="mt-1 text-2xl font-bold text-teal-400">{stats.normalCount}</div>
          <div className="mt-1 text-[11px] text-slate-500">Within reference limits</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Flagged for Review</div>
          <div className="mt-1 text-2xl font-bold text-amber-400">{stats.reviewCount}</div>
          <div className="mt-1 text-[11px] text-amber-500/80">{stats.borderlineCount} borderline</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Clinical Referrals</div>
          <div className="mt-1 text-2xl font-bold text-rose-400">{stats.referCount}</div>
          <div className="mt-1 text-[11px] text-rose-500/80">&gt; 99th percentile</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 col-span-2 lg:col-span-1">
          <div className="text-xs font-medium text-slate-400">Stopped by Gate</div>
          <div className="mt-1 text-2xl font-bold text-slate-300">{stats.stoppedByGate}</div>
          <div className="mt-1 text-[11px] text-slate-500">Blur, color, or low contrast</div>
        </div>
      </div>

      {/* Performance Panel & Reference Bank Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Performance & Latency */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-400" />
                Inference Latency & Efficiency
              </span>
              {meetsUnder1s && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                  <Zap className="w-3 h-3" />
                  Meets under-1s target
                </span>
              )}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-800/60 rounded-lg p-2.5">
                <div className="text-xs text-slate-400">Avg Scan Time</div>
                <div className="text-lg font-bold text-teal-300 mt-0.5">
                  {stats.avgLatencyMs > 0 ? `${stats.avgLatencyMs} ms` : '—'}
                </div>
              </div>
              <div className="bg-slate-800/60 rounded-lg p-2.5">
                <div className="text-xs text-slate-400">Target</div>
                <div className="text-lg font-bold text-slate-200 mt-0.5">&lt; 1,000 ms</div>
              </div>
              <div className="bg-slate-800/60 rounded-lg p-2.5">
                <div className="text-xs text-slate-400">Data Transfer</div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">0 KB (Local)</div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            All tensor operations run on the device GPU via WebGL with CPU fallback. No network round-trips.
          </p>
        </div>

        {/* Bank Health */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Database className="w-4 h-4 text-teal-400" />
                Active Memory Bank Status
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  bank
                    ? 'bg-teal-950/60 text-teal-300 border-teal-800/60'
                    : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                }`}
              >
                {bank ? 'Calibrated' : 'Setup Required'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-800/60 rounded-lg p-2.5">
                <div className="text-xs text-slate-400">Healthy Scans</div>
                <div className="text-lg font-bold text-slate-100 mt-0.5">
                  {bank?.totalNormals ?? 0}
                </div>
              </div>
              <div className="bg-slate-800/60 rounded-lg p-2.5">
                <div className="text-xs text-slate-400">Stored Patches</div>
                <div className="text-lg font-bold text-teal-400 mt-0.5">
                  {bank?.patches?.length ?? 0}
                </div>
              </div>
              <div className="bg-slate-800/60 rounded-lg p-2.5">
                <div className="text-xs text-slate-400">Review (95th%)</div>
                <div className="text-lg font-bold text-amber-400 mt-0.5">
                  {bank ? bank.reviewThreshold.toFixed(2) : '—'}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {bank ? `Created: ${new Date(bank.createdAt).toLocaleDateString()}` : 'No reference bank loaded'}
            </span>
            <Link to="/bank" className="text-teal-400 hover:text-teal-300 font-medium">
              Manage Bank &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      {history.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Chart 1: Verdict Distribution Donut */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-slate-200 mb-2">Verdict Distribution</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.verdictDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {stats.verdictDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-xs mt-2">
              {stats.verdictDistribution.map((d) => (
                <span key={d.name} className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name}: {d.value}
                </span>
              ))}
            </div>
          </div>

          {/* Chart 2: Recent 30 Anomaly Scores with Threshold Lines */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-slate-200 mb-2">Recent Scan Scores vs Thresholds</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.last30Scores} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="index" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <ReferenceLine y={reviewThresh} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Review', fill: '#f59e0b', fontSize: 10 }} />
                  <ReferenceLine y={referThresh} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Refer', fill: '#ef4444', fontSize: 10 }} />
                  <Line type="monotone" dataKey="score" stroke="#0d9488" strokeWidth={2} dot={{ r: 3, fill: '#14b8a6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Dotted lines represent calibrated 95th (amber) and 99th (red) percentiles.
            </p>
          </div>
        </div>
      )}

      {/* Recent Activity Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            Recent Screening Activity
          </h2>
          <span className="text-xs text-slate-400">Last {Math.min(10, history.length)} events</span>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No screening scans processed yet. Click &quot;Analyze Scan&quot; or &quot;Load Sample Data&quot; to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">File</th>
                  <th className="px-4 py-2.5">Verdict</th>
                  <th className="px-4 py-2.5">Anomaly Score</th>
                  <th className="px-4 py-2.5">Finding Suggestion</th>
                  <th className="px-4 py-2.5 text-right">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {history.slice(0, 10).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-2.5 text-slate-400">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-200 truncate max-w-[140px]">
                      {item.fileName}
                    </td>
                    <td className="px-4 py-2.5">
                      {!item.gatePassed ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                          Gate Stopped
                        </span>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.verdict === 'Normal'
                              ? 'bg-teal-950 text-teal-300 border border-teal-800'
                              : item.verdict === 'Review'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {item.verdict}
                          {item.isBorderline ? ' (Borderline)' : ''}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {item.gatePassed ? item.score.toFixed(3) : '—'}
                    </td>
                    <td className="px-4 py-2.5 truncate max-w-[180px] text-slate-400">
                      {item.suggestedFinding || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-400">
                      {item.latencyMs} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
