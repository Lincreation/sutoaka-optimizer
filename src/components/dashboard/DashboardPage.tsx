import { useMemo } from 'react';
import { useAppState } from '../../hooks/useAppState';
import {
  calcMemberMetrics,
  calcCourseMetrics,
  calcGroupMetrics,
} from '../../utils/metricsCalculator';

export function DashboardPage() {
  const { currentPlan, members, groups, courses, courseTargets } = useAppState();

  const memberMetrics = useMemo(
    () =>
      currentPlan
        ? calcMemberMetrics(currentPlan.assignments, members, groups)
        : [],
    [currentPlan, members, groups]
  );

  const courseMetrics = useMemo(
    () =>
      currentPlan
        ? calcCourseMetrics(
            currentPlan.assignments,
            courses,
            courseTargets,
            groups
          )
        : [],
    [currentPlan, courses, courseTargets, groups]
  );

  const groupMetrics = useMemo(
    () =>
      currentPlan
        ? calcGroupMetrics(currentPlan.assignments, members, groups)
        : [],
    [currentPlan, members, groups]
  );

  if (!currentPlan) {
    return (
      <div>
        <div className="page-header">
          <h1>ダッシュボード</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-text">
            まず「割り当て実行」を行ってください
          </div>
        </div>
      </div>
    );
  }

  const totalAssigned = currentPlan.assignments.reduce(
    (s, a) => s + a.count,
    0
  );
  const totalTarget = courseTargets.reduce((s, ct) => s + ct.targetCount, 0);
  const errorCount = currentPlan.diagnostics.filter(
    (d) => d.level === 'error'
  ).length;
  const warningCount = currentPlan.diagnostics.filter(
    (d) => d.level === 'warning'
  ).length;

  return (
    <div>
      <div className="page-header">
        <h1>ダッシュボード</h1>
        <p>
          生成日時:{' '}
          {new Date(currentPlan.generatedAt).toLocaleString('ja-JP')}
        </p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-value">{totalAssigned}</div>
          <div className="metric-label">合計割り当て回数</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{totalTarget}</div>
          <div className="metric-label">合計目標回数</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            {totalTarget > 0
              ? Math.round((totalAssigned / totalTarget) * 100)
              : 0}
            %
          </div>
          <div className="metric-label">全体達成率</div>
        </div>
        <div className="metric-card">
          <div className="metric-value" style={{ color: errorCount > 0 ? 'var(--color-error)' : warningCount > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
            {errorCount > 0 ? `${errorCount}件` : warningCount > 0 ? `${warningCount}件` : 'OK'}
          </div>
          <div className="metric-label">
            {errorCount > 0 ? 'エラー' : warningCount > 0 ? '警告' : '問題なし'}
          </div>
        </div>
      </div>

      {/* Course metrics */}
      <div className="card">
        <div className="card-title">講座別メトリクス</div>
        <table>
          <thead>
            <tr>
              <th>講座名</th>
              <th>担当グループ</th>
              <th>目標</th>
              <th>割当</th>
              <th>残数</th>
              <th>達成率</th>
            </tr>
          </thead>
          <tbody>
            {courseMetrics.map((cm) => (
              <tr key={cm.courseId}>
                <td>{cm.courseName}</td>
                <td>{cm.eligibleGroupNames.join(', ')}</td>
                <td>{cm.targetCount}</td>
                <td>{cm.assignedCount}</td>
                <td>
                  {cm.remainingCount > 0 ? (
                    <span style={{ color: 'var(--color-error)' }}>
                      {cm.remainingCount}
                    </span>
                  ) : (
                    0
                  )}
                </td>
                <td>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div className="progress-bar" style={{ width: 80 }}>
                      <div
                        className={`progress-fill ${cm.achievementPercent >= 100 ? 'complete' : ''}`}
                        style={{
                          width: `${Math.min(100, cm.achievementPercent)}%`,
                        }}
                      />
                    </div>
                    {cm.achievementPercent}%
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Member metrics */}
      <div className="card">
        <div className="card-title">担当者別メトリクス</div>
        <table>
          <thead>
            <tr>
              <th>担当者</th>
              <th>グループ</th>
              <th>合計回数</th>
              <th>稼働日数</th>
              <th>1日平均</th>
              <th>月上限</th>
              <th>状態</th>
            </tr>
          </thead>
          <tbody>
            {memberMetrics.map((mm) => (
              <tr key={mm.memberId}>
                <td>{mm.memberName}</td>
                <td>{mm.groupName}</td>
                <td>{mm.totalAssignments}</td>
                <td>{mm.workingDaysAssigned}</td>
                <td>{mm.dailyAverage}</td>
                <td>{mm.monthlyLimit ?? '−'}</td>
                <td>
                  {mm.warnings.length > 0 ? (
                    <span className="badge badge-warning">
                      {mm.warnings[0]}
                    </span>
                  ) : (
                    <span className="badge badge-success">OK</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Group metrics */}
      <div className="card">
        <div className="card-title">グループ別メトリクス</div>
        <table>
          <thead>
            <tr>
              <th>グループ</th>
              <th>メンバー数</th>
              <th>総負荷</th>
              <th>1人平均</th>
              <th>最多</th>
              <th>最少</th>
              <th>偏り</th>
            </tr>
          </thead>
          <tbody>
            {groupMetrics.map((gm) => (
              <tr key={gm.groupId}>
                <td>{gm.groupName}</td>
                <td>{gm.memberCount}</td>
                <td>{gm.totalLoad}</td>
                <td>{gm.perMemberAverage}</td>
                <td>{gm.maxLoad}</td>
                <td>{gm.minLoad}</td>
                <td>
                  {gm.spread > 1 ? (
                    <span className="badge badge-warning">{gm.spread}</span>
                  ) : (
                    <span className="badge badge-success">{gm.spread}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
