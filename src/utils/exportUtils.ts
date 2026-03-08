import type { SlackNotificationData } from '../types';

export function exportNotificationsAsJson(
  notifications: SlackNotificationData[]
): void {
  const blob = new Blob([JSON.stringify(notifications, null, 2)], {
    type: 'application/json',
  });
  downloadBlob(blob, `notifications_${Date.now()}.json`);
}

const COLUMNS = ['日付', '担当者', 'グループ', 'SlackチャンネルID', 'SlackユーザーID', 'メッセージ本文'];

function rowValues(n: SlackNotificationData): string[] {
  return [n.date, n.memberName, n.groupName, n.slackChannelId, n.slackUserId, n.messageText];
}

/**
 * Copy as HTML table to clipboard.
 * Google Sheets recognizes HTML tables and preserves newlines via <br>.
 */
export function copyTableToClipboard(
  notifications: SlackNotificationData[]
): Promise<void> {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const headerRow = COLUMNS.map((c) => `<th>${esc(c)}</th>`).join('');
  const bodyRows = notifications.map((n) => {
    const vals = rowValues(n);
    const cells = vals.map((v) => `<td>${esc(v).replace(/\n/g, '<br>')}</td>`).join('');
    return `<tr>${cells}</tr>`;
  }).join('');
  const html = `<table><tr>${headerRow}</tr>${bodyRows}</table>`;

  // Also build plain-text TSV as fallback
  const textHeader = COLUMNS.join('\t');
  const textRows = notifications.map((n) => {
    const vals = rowValues(n);
    return vals.map((v) => v.replace(/\t/g, ' ').replace(/\n/g, ' ')).join('\t');
  }).join('\n');
  const plainText = textHeader + '\n' + textRows;

  // Use Clipboard API write() with both HTML and plain text
  if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
    const item = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([plainText], { type: 'text/plain' }),
    });
    return navigator.clipboard.write([item]);
  }

  // Fallback: copy plain text via textarea
  return copyToClipboard(plainText);
}

/**
 * TSV for file download. Uses double-quote wrapping to preserve newlines in Sheets import.
 */
export function tsvForDownload(
  notifications: SlackNotificationData[]
): string {
  const header = COLUMNS.join('\t');
  const rows = notifications.map((n) => {
    const vals = rowValues(n);
    return vals.map((v) => {
      if (v.includes('\n') || v.includes('\t') || v.includes('"')) {
        return `"${v.replace(/"/g, '""')}"`;
      }
      return v;
    }).join('\t');
  }).join('\n');
  return header + '\n' + rows;
}

export function downloadTsv(tsv: string, filename: string): void {
  const bom = '\uFEFF';
  const blob = new Blob([bom + tsv], { type: 'text/tab-separated-values;charset=utf-8' });
  downloadBlob(blob, filename);
}

/**
 * CSV for file download. Same structure as TSV but comma-separated.
 * RFC 4180 compliant with double-quote wrapping.
 */
export function csvForDownload(
  notifications: SlackNotificationData[]
): string {
  const header = COLUMNS.join(',');
  const rows = notifications.map((n) => {
    const vals = rowValues(n);
    return vals.map((v) => {
      if (v.includes('\n') || v.includes(',') || v.includes('"')) {
        return `"${v.replace(/"/g, '""')}"`;
      }
      return v;
    }).join(',');
  }).join('\n');
  return header + '\n' + rows;
}

export function downloadCsv(csv: string, filename: string): void {
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, filename);
}

/**
 * Group notifications by groupName and produce per-group CSVs + a combined CSV.
 * Returns an array of { groupName, csv } objects.
 */
export function csvsByGroup(
  notifications: SlackNotificationData[]
): { groupName: string; csv: string }[] {
  const groupMap = new Map<string, SlackNotificationData[]>();
  for (const n of notifications) {
    if (!groupMap.has(n.groupName)) groupMap.set(n.groupName, []);
    groupMap.get(n.groupName)!.push(n);
  }

  // Sort each group's notifications by date
  const results: { groupName: string; csv: string }[] = [];
  const sortedGroupNames = [...groupMap.keys()].sort();
  for (const groupName of sortedGroupNames) {
    const items = groupMap.get(groupName)!;
    items.sort((a, b) => a.date.localeCompare(b.date));
    results.push({ groupName, csv: csvForDownload(items) });
  }
  return results;
}

/**
 * Download all group CSVs + a combined all-data CSV as individual files.
 * Each file is timestamped and named by group.
 */
export function downloadGroupCsvs(
  notifications: SlackNotificationData[]
): void {
  const ts = Date.now();

  // 1. Combined all-data CSV (sorted by date)
  const sorted = [...notifications].sort((a, b) => a.date.localeCompare(b.date));
  const allCsv = csvForDownload(sorted);
  downloadCsv(allCsv, `notifications_全体_${ts}.csv`);

  // 2. Per-group CSVs
  const groups = csvsByGroup(notifications);
  for (const { groupName, csv } of groups) {
    downloadCsv(csv, `notifications_${groupName}_${ts}.csv`);
  }
}

/** Copy text to clipboard. Uses textarea fallback first for max compatibility. */
export function copyToClipboard(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (ok) {
        resolve();
        return;
      }
    } catch {
      document.body.removeChild(textarea);
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(resolve, reject);
    } else {
      reject(new Error('Clipboard not available'));
    }
  });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
