import { useMemo } from 'react';
import { useAppState } from '../../hooks/useAppState';
import { calcGroupMetrics } from '../../utils/metricsCalculator';

export function GroupView() {
  const { currentPlan, members, groups, courses, courseTargets } = useAppState();

  const groupData = useMemo(() => {
    if (!currentPlan) return [];
    const metrics = calcGroupMetrics(currentPlan.assignments, members, groups);

    return groups.map((group) => {
      const gm = metrics.find((m) => m.groupId === group.id);
      const groupMembers = members.filter(
        (m) => m.groupId === group.id && m.isActive
      );
      const groupCourseIds = group.eligibleCourseIds;
      const groupCourses = groupCourseIds.map((cid) => {
        const course = courses.find((c) => c.id === cid);
        const target = courseTargets.find((ct) => ct.courseId === cid);
        const assigned = currentPlan.assignments
          .filter((a) => a.courseId === cid)
          .reduce((s, a) => s + a.count, 0);
        return {
          name: course?.name ?? '',
          target: target?.targetCount ?? 0,
          assigned,
        };
      });

      const memberLoads = groupMembers.map((m) => ({
        name: m.name,
        total: currentPlan.assignments
          .filter((a) => a.memberId === m.id)
          .reduce((s, a) => s + a.count, 0),
      }));

      return { group, metrics: gm, groupCourses, memberLoads };
    });
  }, [currentPlan, members, groups, courses, courseTargets]);

  if (!currentPlan) {
    return (
      <div>
        <div className="page-header"><h1>グループ別表示</h1></div>
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-text">まず「割り当て実行」を行ってください</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>グループ別表示</h1>
        <p>グループごとの負荷と進捗を確認できます</p>
      </div>
      {groupData.map(({ group, metrics, groupCourses, memberLoads }) => (
        <div key={group.id} className="card">
          <div className="card-title">{group.name}</div>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-value">{metrics?.totalLoad ?? 0}</div>
              <div className="metric-label">総負荷（回）</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{metrics?.memberCount ?? 0}</div>
              <div className="metric-label">メンバー数</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{metrics?.perMemberAverage ?? 0}</div>
              <div className="metric-label">1人平均</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{metrics?.spread ?? 0}</div>
              <div className="metric-label">偏り（差）</div>
            </div>
          </div>

          <h4 style={{ marginBottom: 8 }}>講座別進捗</h4>
          <table>
            <thead>
              <tr><th>講座</th><th>目標</th><th>割当</th><th>達成率</th></tr>
            </thead>
            <tbody>
              {groupCourses.map((gc) => (
                <tr key={gc.name}>
                  <td>{gc.name}</td>
                  <td>{gc.target}</td>
                  <td>{gc.assigned}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar" style={{ width: 100 }}>
                        <div
                          className={`progress-fill ${gc.target > 0 && gc.assigned >= gc.target ? 'complete' : ''}`}
                          style={{ width: `${gc.target > 0 ? Math.min(100, (gc.assigned / gc.target) * 100) : 0}%` }}
                        />
                      </div>
                      {gc.target > 0 ? Math.round((gc.assigned / gc.target) * 100) : 0}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4 style={{ marginTop: 16, marginBottom: 8 }}>メンバー別負荷</h4>
          <table>
            <thead>
              <tr><th>担当者</th><th>合計回数</th></tr>
            </thead>
            <tbody>
              {memberLoads.map((ml) => (
                <tr key={ml.name}>
                  <td>{ml.name}</td>
                  <td>{ml.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
