/**
 * @file src/lib/auditLog.ts
 * @description Safe local audit log tracking user events without storing image data.
 */

import { AuditLogEntry } from '../types';
import { getStorageItem, setStorageItem } from './storage';

const AUDIT_KEY = 'audit_log';

/**
 * Appends a new entry to the user audit log.
 * @param userEmail - Email of active session.
 * @param action - Human readable action key.
 * @param details - Operational details (no image data).
 */
export async function logAuditEvent(
  userEmail: string,
  action: string,
  details: string
): Promise<void> {
  try {
    const list = (await getStorageItem<AuditLogEntry[]>(AUDIT_KEY)) || [];
    const entry: AuditLogEntry = {
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      userEmail,
      action,
      details,
    };
    list.unshift(entry);
    if (list.length > 1000) {
      list.length = 1000;
    }
    await setStorageItem(AUDIT_KEY, list);
  } catch {
    // Fail silently in memory
  }
}

/**
 * Retrieves the current audit log entries.
 * @returns Array of AuditLogEntry items.
 */
export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  return (await getStorageItem<AuditLogEntry[]>(AUDIT_KEY)) || [];
}

/**
 * Exports the audit log to a CSV string.
 * @param logs - Array of AuditLogEntry items.
 * @returns Formatted CSV content string.
 */
export function exportAuditCsv(logs: AuditLogEntry[]): string {
  const header = ['ID', 'Timestamp', 'Date UTC', 'User', 'Action', 'Details'];
  const rows = logs.map((log) => [
    log.id,
    log.timestamp,
    new Date(log.timestamp).toISOString(),
    `"${log.userEmail.replace(/"/g, '""')}"`,
    `"${log.action.replace(/"/g, '""')}"`,
    `"${log.details.replace(/"/g, '""')}"`,
  ]);
  return [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Triggers a client-side download of a CSV file.
 * @param csvContent - String CSV data.
 * @param filename - File name for download.
 */
export function downloadCsvFile(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
