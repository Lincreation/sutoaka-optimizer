import { useMemo, useState } from 'react';
import { useAppState } from '../../hooks/useAppState';
import { generateAllNotifications } from '../../utils/notificationGenerator';
import { copyTableToClipboard, tsvForDownload, downloadTsv, csvForDownload, downloadCsv, downloadGroupCsvs, copyToClipboard } from '../../utils/exportUtils';
import { formatJapaneseDate } from '../../utils/dateUtils';

export function NotificationsPage() {
  const { currentPlan, members, groups, courses, template } = useAppState();
  const [toast, setToast] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const notifications = useMemo(() => {
    if (!currentPlan) return [];
    return generateAllNotifications(
      currentPlan.assignments,
      members,
      groups,
      courses,
      template
    );
  }, [currentPlan, members, groups, courses, template]);

  const dates = useMemo(
    () => [...new Set(notifications.map((n) => n.date))].sort(),
    [notifications]
  );

  const groupNames = useMemo(
    () => [...new Set(notifications.map((n) => n.groupName))].sort(),
    [notifications]
  );

  const filtered = useMemo(() => {
    let result = notifications;
    if (selectedDate) result = result.filter((n) => n.date === selectedDate);
    if (selectedGroup) result = result.filter((n) => n.groupName === selectedGroup);
    return result;
  }, [notifications, selectedDate, selectedGroup]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const handleCopy = (text: string) => {
    copyToClipboard(text)
      .then(() => showToast('コピーしました'))
      .catch(() => showToast('コピーに失敗しました'));
  };

  const handleCopyAllFiltered = () => {
    const combined = filtered
      .map(
        (n) =>
          `【${formatJapaneseDate(n.date)} — ${n.memberName}（${n.groupName}）】\n${n.messageText}`
      )
      .join('\n\n---\n\n');
    handleCopy(combined);
  };

  /** Copy as HTML table — Sheets preserves newlines via <br> */
  const handleCopyTsv = () => {
    copyTableToClipboard(filtered)
      .then(() => showToast('コピーしました'))
      .catch(() => showToast('コピーに失敗しました'));
  };

  /** TSV: download as file (preserves newlines via quoting) */
  const handleDownloadTsv = () => {
    const tsv = tsvForDownload(filtered);
    downloadTsv(tsv, `notifications_${Date.now()}.tsv`);
    showToast('TSVファイルをダウンロードしました');
  };

  /** CSV: download as file for Google Sheets import */
  const handleDownloadCsv = () => {
    const csv = csvForDownload(filtered);
    downloadCsv(csv, `notifications_${Date.now()}.csv`);
    showToast('CSVファイルをダウンロードしました');
  };

  /** CSV: download per-group CSVs + combined CSV */
  const handleDownloadGroupCsvs = () => {
    downloadGroupCsvs(notifications);
    const groupCount = new Set(notifications.map((n) => n.groupName)).size;
    showToast(`全体＋${groupCount}グループのCSVをダウンロードしました`);
  };

  if (!currentPlan) {
    return (
      <div>
        <div className="page-header"><h1>通知データ</h1></div>
        <div className="empty-state">
          <div className="empty-state-icon">📨</div>
          <div className="empty-state-text">まず「割り当て実行」を行ってください</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>通知データ</h1>
        <p>Slack通知用のデータをプレビュー・エクスポートできます</p>
      </div>

      {/* Filters */}
      <div className="action-bar" style={{ flexWrap: 'wrap' }}>
        <select
          value={selectedGroup ?? ''}
          onChange={(e) => setSelectedGroup(e.target.value || null)}
          style={{ width: 160 }}
        >
          <option value="">全グループ</option>
          {groupNames.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select
          value={selectedDate ?? ''}
          onChange={(e) => setSelectedDate(e.target.value || null)}
          style={{ width: 180 }}
        >
          <option value="">全日付</option>
          {dates.map((d) => (
            <option key={d} value={d}>
              {formatJapaneseDate(d)}
            </option>
          ))}
        </select>
      </div>

      {/* Export bar */}
      <div className="action-bar" style={{ flexWrap: 'wrap' }}>
        <button className="btn btn-primary btn-sm" onClick={handleCopyTsv}>
          📋 スプシ用コピー（TSV）
        </button>
        <button className="btn btn-sm" onClick={handleDownloadCsv}>
          📥 CSVダウンロード
        </button>
        <button className="btn btn-primary btn-sm" onClick={handleDownloadGroupCsvs}>
          📦 グループ別CSV一括DL
        </button>
        <button className="btn btn-sm" onClick={handleDownloadTsv}>
          💾 TSVダウンロード
        </button>
        <button className="btn btn-sm" onClick={handleCopyAllFiltered}>
          📝 表示中を全てコピー
        </button>
      </div>

      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
        {filtered.length}件の通知データ
        {(selectedDate || selectedGroup) && (
          <span>（全{notifications.length}件中）</span>
        )}
      </div>

      {filtered.map((n, i) => (
        <div key={i} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <strong>{formatJapaneseDate(n.date)}</strong> — {n.memberName}
              <span className="badge badge-info" style={{ marginLeft: 8 }}>{n.groupName}</span>
            </div>
            <button className="btn btn-sm" onClick={() => handleCopy(n.messageText)}>
              コピー
            </button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
            Ch: {n.slackChannelId} / User: {n.slackUserId}
          </div>
          <div className="notification-text">{n.messageText}</div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-text">条件に一致する通知がありません</div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
