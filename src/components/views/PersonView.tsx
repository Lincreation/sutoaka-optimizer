import { useMemo, useState } from 'react';
import { useAppState } from '../../hooks/useAppState';
import { formatJapaneseDate } from '../../utils/dateUtils';
import { calcMemberMetrics } from '../../utils/metricsCalculator';

type ViewMode = 'table' | 'calendar';

const DAY_HEADERS = ['日', '月', '火', '水', '木', '金', '土'];

export function PersonView() {
  const { currentPlan, members, groups, courses, config } = useAppState();
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const personData = useMemo(() => {
    if (!currentPlan) return [];
    const metrics = calcMemberMetrics(currentPlan.assignments, members, groups);

    return members
      .filter((m) => m.isActive)
      .map((member) => {
        const mm = metrics.find((x) => x.memberId === member.id);
        const group = groups.find((g) => g.id === member.groupId);

        // Build schedule: date -> courseAssigns
        const schedule = new Map<string, { courseName: string; count: number }[]>();
        for (const a of currentPlan.assignments) {
          if (a.memberId !== member.id) continue;
          if (!schedule.has(a.date)) schedule.set(a.date, []);
          const course = courses.find((c) => c.id === a.courseId);
          schedule.get(a.date)!.push({
            courseName: course?.name ?? '',
            count: a.count,
          });
        }

        return {
          member,
          groupName: group?.name ?? '',
          metrics: mm,
          schedule: [...schedule.entries()].sort(([a], [b]) =>
            a.localeCompare(b)
          ),
          scheduleMap: schedule,
        };
      });
  }, [currentPlan, members, groups, courses]);

  const calendarData = useMemo(() => {
    // Build calendar grid for the period month
    const startDate = new Date(config.periodStart + 'T00:00:00');
    const year = startDate.getFullYear();
    const month = startDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const cells: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    return { year, month, cells };
  }, [config.periodStart]);

  if (!currentPlan) {
    return (
      <div>
        <div className="page-header"><h1>担当者別表示</h1></div>
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <div className="empty-state-text">まず「割り当て実行」を行ってください</div>
        </div>
      </div>
    );
  }

  const formatDateKey = (year: number, month: number, day: number): string => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  return (
    <div>
      <div className="page-header">
        <h1>担当者別表示</h1>
        <p>個人の月間スケジュールと偏りを確認できます</p>
      </div>

      <div className="tabs" style={{ marginBottom: 16 }}>
        <button
          className={`tab-btn ${viewMode === 'table' ? 'active' : ''}`}
          onClick={() => setViewMode('table')}
        >
          テーブル表示
        </button>
        <button
          className={`tab-btn ${viewMode === 'calendar' ? 'active' : ''}`}
          onClick={() => setViewMode('calendar')}
        >
          カレンダー表示
        </button>
      </div>

      {personData.map(({ member, groupName, metrics, schedule, scheduleMap }) => (
        <div key={member.id} className="card">
          <div className="card-title">
            {member.name}
            <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)', marginLeft: 8 }}>
              ({groupName})
            </span>
            {metrics?.warnings.map((w, i) => (
              <span key={i} className="badge badge-warning" style={{ marginLeft: 8 }}>
                {w}
              </span>
            ))}
          </div>

          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-value">{metrics?.totalAssignments ?? 0}</div>
              <div className="metric-label">合計回数</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{metrics?.workingDaysAssigned ?? 0}</div>
              <div className="metric-label">稼働日数</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{metrics?.dailyAverage ?? 0}</div>
              <div className="metric-label">1日平均</div>
            </div>
          </div>

          {viewMode === 'table' ? (
            <table>
              <thead>
                <tr><th>日付</th><th>講座</th><th>合計</th></tr>
              </thead>
              <tbody>
                {schedule.map(([date, assigns]) => (
                  <tr key={date}>
                    <td>{formatJapaneseDate(date)}</td>
                    <td>
                      {assigns.map((a, i) => (
                        <span key={i}>
                          {a.courseName}:{a.count}回
                          {i < assigns.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </td>
                    <td>{assigns.reduce((s, a) => s + a.count, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="calendar-grid">
              {DAY_HEADERS.map((h) => (
                <div key={h} className="calendar-header-cell">{h}</div>
              ))}
              {calendarData.cells.map((day, idx) => {
                if (day === null) {
                  return <div key={idx} className="calendar-cell empty" />;
                }
                const dateKey = formatDateKey(calendarData.year, calendarData.month, day);
                const assigns = scheduleMap.get(dateKey);
                const total = assigns?.reduce((s, a) => s + a.count, 0) ?? 0;
                const loadClass = total === 0 ? '' : total <= 2 ? 'load-1' : total <= 4 ? 'load-2' : 'load-3';

                return (
                  <div key={idx} className={`calendar-cell ${loadClass}`}>
                    <div className="calendar-day-num">{day}</div>
                    {assigns?.map((a, i) => (
                      <div key={i} className="calendar-course-line" title={a.courseName}>
                        {a.courseName.slice(0, 4)}:{a.count}
                      </div>
                    ))}
                    {total > 0 && (
                      <div className="calendar-total">計{total}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
