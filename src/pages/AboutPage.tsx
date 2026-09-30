/**
 * @file src/pages/AboutPage.tsx
 * @description About ScanKavach, automated in-browser self-test suite, and audit log manager.
 */

import React, { useState, useEffect } from 'react';
import {
  Info,
  CheckCircle2,
  Play,
  Trash2,
  Download,
  AlertTriangle,
  History,
} from 'lucide-react';
import { getAuditLogs, exportAuditCsv, downloadCsvFile } from '../lib/auditLog';
import { evaluateSafetyGate } from '../lib/gate';
import { computeImageScore, computePatchDistances } from '../lib/scorer';
import { determineVerdict } from '../lib/verdict';
import { fuse } from '../lib/fusion';
import { generateExplanationSentence } from '../lib/explain';
import { AuditLogEntry } from '../types';

interface SelfTestResult {
  name: string;
  passed: boolean;
  details: string;
}

export const AboutPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [testResults, setTestResults] = useState<SelfTestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const loadLogs = async () => {
    const list = await getAuditLogs();
    setLogs(list);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleRunSelfTest = async () => {
    setIsRunningTests(true);
    const results: SelfTestResult[] = [];

    // Test 1: Safety Gate color photo reject
    try {
      const gateRes = evaluateSafetyGate({ contrastStd: 0.1, blurVariance: 30, colorDiff: 25, meanIntensity: 0.5 });
      results.push({
        name: 'Gate: Color Photo Rejection',
        passed: !gateRes.passed && gateRes.reason?.includes('colour') === true,
        details: gateRes.reason || 'Rejected as expected',
      });
    } catch {
      results.push({ name: 'Gate: Color Photo Rejection', passed: false, details: 'Threw error' });
    }

    // Test 2: Scorer calculation
    try {
      const pDists = computePatchDistances([[1, 2], [3, 4]], [[1, 2], [0, 0]]);
      const sc = computeImageScore(pDists);
      results.push({
        name: 'Scorer: Patch Distance Computation',
        passed: sc >= 0,
        details: `Calculated score: ${sc.toFixed(3)}`,
      });
    } catch {
      results.push({ name: 'Scorer: Patch Distance Computation', passed: false, details: 'Failed' });
    }

    // Test 3: Calibrated Verdict
    try {
      const verd = determineVerdict(0.75, 0.4, 0.7, [0.1, 0.2, 0.3]);
      results.push({
        name: 'Verdict: Refer Classification',
        passed: verd.verdict === 'Refer',
        details: `Verdict mapped to ${verd.verdict}`,
      });
    } catch {
      results.push({ name: 'Verdict: Refer Classification', passed: false, details: 'Failed' });
    }

    // Test 4: Explanation Sentence
    try {
      const sent = generateExplanationSentence([0.8, 0.2], 0.5, false);
      results.push({
        name: 'Explain: Spatial 3x3 Sentence',
        passed: sent.includes('of the image') && !sent.includes('lung'),
        details: sent,
      });
    } catch {
      results.push({ name: 'Explain: Spatial 3x3 Sentence', passed: false, details: 'Failed' });
    }

    // Test 5: Fusion Consistency
    try {
      const fused = fuse('Review', false, { Pneumonia: 0.85, Normal: 0.15 });
      results.push({
        name: 'Fusion: Suggested Condition',
        passed: fused.fusionVerdict === 'Suggested-condition',
        details: fused.message,
      });
    } catch {
      results.push({ name: 'Fusion: Suggested Condition', passed: false, details: 'Failed' });
    }

    setTestResults(results);
    setIsRunningTests(false);
  };

  const handleExportAudit = () => {
    const csv = exportAuditCsv(logs);
    downloadCsvFile(csv, `scankavach-audit-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleClearAllData = async () => {
    if (
      window.confirm(
        'WARNING: This will remove all local accounts, reference banks, models, and history from IndexedDB on this browser. Continue?'
      )
    ) {
      if (typeof window !== 'undefined' && window.indexedDB) {
        window.indexedDB.deleteDatabase('scankavach_db');
      }
      sessionStorage.clear();
      localStorage.clear();
      alert('Local data cleared. Reloading page.');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <Info className="w-6 h-6 text-teal-400" />
          About ScanKavach
        </h1>
        <p className="text-sm text-slate-400">
          Shielding clinical workflows with label-free anomaly screening on local client devices.
        </p>
      </div>

      {/* Self-Test Runner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">
              Client-Side Sanity &amp; Integrity Self-Test
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Validates gate logic, patch scorer, verdict mapping, explanation grammar, and decision fusion in this browser.
            </p>
          </div>
          <button
            onClick={handleRunSelfTest}
            disabled={isRunningTests}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Play className="w-4 h-4" />
            {isRunningTests ? 'Running Checks...' : 'Run Self-Test'}
          </button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            {testResults.map((t, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs"
              >
                <div className="flex items-center gap-2">
                  {t.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                  <span className="font-medium text-slate-200">{t.name}</span>
                </div>
                <span className="text-slate-400 truncate max-w-[200px]">{t.details}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <History className="w-4 h-4 text-teal-400" />
            Security &amp; Operational Audit Log
          </h2>
          <button
            onClick={handleExportAudit}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export scankavach-audit.csv
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">No audit events recorded yet.</div>
        ) : (
          <div className="overflow-x-auto max-h-60">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider sticky top-0">
                <tr>
                  <th className="px-4 py-2">Timestamp</th>
                  <th className="px-4 py-2">Action</th>
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.slice(0, 50).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-2 text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2 font-mono text-teal-400 font-semibold">{log.action}</td>
                    <td className="px-4 py-2 text-slate-300 truncate max-w-[120px]">{log.userEmail}</td>
                    <td className="px-4 py-2 text-slate-400">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Danger Zone: Clear Local Data */}
      <div className="p-5 rounded-xl bg-rose-950/20 border border-rose-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-rose-300 uppercase tracking-wider block">
            Reset Application Storage
          </span>
          <p className="text-xs text-rose-400/80 mt-0.5">
            Erase all reference banks, trained models, screening histories, and audit records from this browser.
          </p>
        </div>
        <button
          onClick={handleClearAllData}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Clear All Local Data
        </button>
      </div>
    </div>
  );
};
