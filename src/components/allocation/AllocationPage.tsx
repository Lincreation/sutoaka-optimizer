import { useState, useMemo } from 'react';
import { useAppState } from '../../hooks/useAppState';
import { getWorkingDays } from '../../utils/dateUtils';
import type { PageId, Diagnostic } from '../../types';

interface Props {
  onNavigate: (page: PageId) => void;
}

export function AllocationPage({ onNavigate }: Props) {
  const {
    courses,
    courseTargets,
    groups,
    members,
    config,
    currentPlan,
    runAllocation,
  } = useAppState();

  const [justCompleted, setJustCompleted] = useState(false);
  const [showInfoDiags, setShowInfoDiags] = useState(false);

  const activeMembers = members.filter((m) => m.isActive);
  const workingDays = getWorkingDays(config.periodStart, config.periodEnd);
  const canRun = courses.length > 0 && activeMembers.length > 0 && workingDays.length > 0;

  const totalTarget = courseTargets.reduce((s, ct) => s + ct.targetCount, 0);

  const handleRun = () => {
    runAllocation();
    setJustCompleted(true);
    setShowInfoDiags(false);
  };

  const completionMetrics = useMemo(() => {
    if (!currentPlan) return null;
    const totalAssigned = currentPlan.assignments.reduce((s, a) => s + a.count, 0);
    const achievementPercent = totalTarget > 0 ? Math.round((totalAssigned / totalTarget) * 100) : 100;
    const uniqueMembers = new Set(currentPlan.assignments.map((a) => a.memberId)).size;
    const uniqueDays = new Set(currentPlan.assignments.map((a) => a.date)).size;
    return { totalAssigned, achievementPercent, uniqueMembers, uniqueDays };
  }, [currentPlan, totalTarget]);

  const groupedDiagnostics = useMemo(() => {
    if (!currentPlan) return { errors: [], warnings: [], infos: [] };
    const errors: Diagnostic[] = [];
    const warnings: Diagnostic[] = [];
    const infos: Diagnostic[] = [];
    for (const d of currentPlan.diagnostics) {
      if (d.level === 'error') errors.push(d);
      else if (d.level === 'warning') warnings.push(d);
      else infos.push(d);
    }
    return { errors, warnings, infos };
  }, [currentPlan]);

  return (
    <div>
      <div className="page-header">
        <h1>割り当て実行</h1>
        <p>設定内容に基づいて割り振りを自動生成します</p>
      </div>

      {/* Success banner */}
      {justCompleted && currentPlan && completionMetrics && (
        <div className="success-banner">
          <div className="success-banner-title">割り当て完了!</div>
          <div className="success-banner-detail">
            {completionMetrics.totalAssigned}回の割り当てを生成しました（目標達成率: {completionMetrics.achievementPercent}%）
          </div>
        </div>
      )}

      {/* Completion metrics */}
      {justCompleted && currentPlan && completionMetrics && (
        <>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-value">{completionMetrics.totalAssigned}</div>
              <div className="metric-label">合計割り当て回数</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{completionMetrics.achievementPercent}%</div>
              <div className="metric-label">目標達成率</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{completionMetrics.uniqueMembers}</div>
              <div className="metric-label">担当者数</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{completionMetrics.uniqueDays}</div>
              <div className="metric-label">稼働日数</div>
            </div>
          </div>

          <div className="action-bar" style={{ marginBottom: 24 }}>
            <button className="btn btn-sm" onClick={() => onNavigate('view-date')}>
              日付別で確認
            </button>
            <button className="btn btn-sm" onClick={() => onNavigate('view-person')}>
              担当者別で確認
            </button>
            <button className="btn btn-sm" onClick={() => onNavigate('notifications')}>
              通知データを見る
            </button>
          </div>
        </>
      )}

      <div className="card">
        <div className="card-title">実行前チェック</div>
        <table>
          <tbody>
            <tr>
              <td>期間</td>
              <td>
                {config.periodStart} 〜 {config.periodEnd}（{workingDays.length}日間）
              </td>
            </tr>
            <tr>
              <td>講座数</td>
              <td>{courses.length}件</td>
            </tr>
            <tr>
              <td>合計目標回数</td>
              <td>{totalTarget}回</td>
            </tr>
            <tr>
              <td>グループ数</td>
              <td>{groups.length}件</td>
            </tr>
            <tr>
              <td>有効担当者数</td>
              <td>{activeMembers.length}人</td>
            </tr>
            <tr>
              <td>1日基準回数</td>
              <td>講座別設定</td>
            </tr>
            <tr>
              <td>1人1日合計上限</td>
              <td>{config.workDesignRules.maxTotalPerPersonPerDay}回</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="action-bar">
        <button
          className="btn btn-primary"
          disabled={!canRun}
          onClick={handleRun}
        >
          {currentPlan ? '再実行' : '割り当て実行'}
        </button>
        {!canRun && (
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
            講座・担当者・期間を設定してください
          </span>
        )}
      </div>

      {currentPlan && (
        <>
          <div className="card">
            <div className="card-title">実行結果サマリー</div>
            <p style={{ fontSize: 14, marginBottom: 8 }}>
              生成日時: {new Date(currentPlan.generatedAt).toLocaleString('ja-JP')}
            </p>
            <p style={{ fontSize: 14 }}>
              割り当て件数: {currentPlan.assignments.length}件 / 合計{' '}
              {currentPlan.assignments.reduce((s, a) => s + a.count, 0)}回
            </p>
          </div>

          {/* Diagnostics with grouping */}
          {currentPlan.diagnostics.length > 0 && (
            <div className="card">
              <div className="card-title">診断結果</div>

              {/* Summary badges */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                {groupedDiagnostics.errors.length > 0 && (
                  <span className="badge badge-error">
                    エラー: {groupedDiagnostics.errors.length}件
                  </span>
                )}
                {groupedDiagnostics.warnings.length > 0 && (
                  <span className="badge badge-warning">
                    注意: {groupedDiagnostics.warnings.length}件
                  </span>
                )}
                {groupedDiagnostics.infos.length > 0 && (
                  <span className="badge badge-success">
                    OK: {groupedDiagnostics.infos.length}件
                  </span>
                )}
              </div>

              {/* Errors */}
              {groupedDiagnostics.errors.map((d, i) => (
                <div key={`e${i}`} className="diagnostic diagnostic-error">
                  <span className="diag-label">[エラー]</span> {d.message}
                </div>
              ))}

              {/* Warnings */}
              {groupedDiagnostics.warnings.map((d, i) => (
                <div key={`w${i}`} className="diagnostic diagnostic-warning">
                  <span className="diag-label">[注意]</span> {d.message}
                </div>
              ))}

              {/* Info (collapsible) */}
              {groupedDiagnostics.infos.length > 0 && (
                <>
                  <button
                    className="btn btn-sm"
                    style={{ marginTop: 8, marginBottom: 8 }}
                    onClick={() => setShowInfoDiags(!showInfoDiags)}
                  >
                    {showInfoDiags ? '成功メッセージを隠す' : `成功メッセージを表示（${groupedDiagnostics.infos.length}件）`}
                  </button>
                  {showInfoDiags &&
                    groupedDiagnostics.infos.map((d, i) => (
                      <div key={`i${i}`} className="diagnostic diagnostic-info">
                        <span className="diag-label">[OK]</span> {d.message}
                      </div>
                    ))}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
