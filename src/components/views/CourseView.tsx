import { useMemo, useState } from 'react';
import { useAppState } from '../../hooks/useAppState';
import { formatJapaneseDate } from '../../utils/dateUtils';

type ViewMode = 'table' | 'calendar';

export function CourseView() {
  const { currentPlan, courses, courseTargets, members, groups } = useAppState();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);

  const courseData = useMemo(() => {
    if (!currentPlan) return [];

    return courses.map((course) => {
      const target = courseTargets.find((ct) => ct.courseId === course.id);
      const assignments = currentPlan.assignments.filter((a) => a.courseId === course.id);

      // Group by member
      const memberMap = new Map<string, { total: number; dates: { date: string; count: number }[] }>();
      for (const a of assignments) {
        if (!memberMap.has(a.memberId)) {
          memberMap.set(a.memberId, { total: 0, dates: [] });
        }
        const entry = memberMap.get(a.memberId)!;
        entry.total += a.count;
        entry.dates.push({ date: a.date, count: a.count });
      }

      for (const entry of memberMap.values()) {
        entry.dates.sort((a, b) => a.date.localeCompare(b.date));
      }

      const memberList = [...memberMap.entries()].map(([memberId, data]) => {
        const member = members.find((m) => m.id === memberId);
        const group = member ? groups.find((g) => g.id === member.groupId) : null;
        return {
          memberId,
          memberName: member?.name ?? '不明',
          groupName: group?.name ?? '',
          total: data.total,
          dates: data.dates,
        };
      }).sort((a, b) => b.total - a.total);

      // Group by date for calendar view
      const dateMap = new Map<string, { memberId: string; memberName: string; count: number }[]>();
      for (const a of assignments) {
        if (!dateMap.has(a.date)) dateMap.set(a.date, []);
        const member = members.find((m) => m.id === a.memberId);
        dateMap.get(a.date)!.push({
          memberId: a.memberId,
          memberName: member?.name ?? '不明',
          count: a.count,
        });
      }
      // Sort members within each date by name
      for (const list of dateMap.values()) {
        list.sort((a, b) => a.memberName.localeCompare(b.memberName));
      }

      const totalAssigned = assignments.reduce((sum, a) => sum + a.count, 0);

      return {
        courseId: course.id,
        courseName: course.name,
        targetCount: target?.targetCount ?? 0,
        perDay: target?.perDay,
        assignedCount: totalAssigned,
        memberList,
        dateMap,
      };
    }).filter((c) => c.targetCount > 0 || c.assignedCount > 0);
  }, [currentPlan, courses, courseTargets, members, groups]);

  // Compute period month range
  const monthRange = useMemo(() => {
    if (!currentPlan) return null;
    const start = new Date(currentPlan.config.periodStart + 'T00:00:00');
    const end = new Date(currentPlan.config.periodEnd + 'T00:00:00');
    const startYear = start.getFullYear();
    const startMonth = start.getMonth();
    const endYear = end.getFullYear();
    const endMonth = end.getMonth();
    const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth);
    return { startYear, startMonth, totalMonths };
  }, [currentPlan]);

  // Build calendar grid info from plan period + offset
  const calendarInfo = useMemo(() => {
    if (!currentPlan || !monthRange) return null;
    const start = new Date(currentPlan.config.periodStart + 'T00:00:00');
    const end = new Date(currentPlan.config.periodEnd + 'T00:00:00');

    const displayDate = new Date(monthRange.startYear, monthRange.startMonth + calendarMonthOffset, 1);
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();

    // Build full month grid (always show complete month)
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
    const startDow = firstOfMonth.getDay(); // 0=Sun

    // Period date set for highlighting
    const periodDates = new Set<string>();
    const cur = new Date(start);
    while (cur <= end) {
      const iso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
      periodDates.add(iso);
      cur.setDate(cur.getDate() + 1);
    }

    // Build cells
    const cells: { day: number; iso: string; inPeriod: boolean }[] = [];
    // Leading empty cells
    for (let i = 0; i < startDow; i++) {
      cells.push({ day: 0, iso: '', inPeriod: false });
    }
    for (let d = 1; d <= lastOfMonth.getDate(); d++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, iso, inPeriod: periodDates.has(iso) });
    }

    return {
      year,
      month: month + 1,
      cells,
      dayNames: ['日', '月', '火', '水', '木', '金', '土'],
      canPrev: true,
      canNext: true,
    };
  }, [currentPlan, monthRange, calendarMonthOffset]);

  if (!currentPlan) {
    return (
      <div>
        <div className="page-header"><h1>講座別表示</h1></div>
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <div className="empty-state-text">まず「割り当て実行」を行ってください</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>講座別表示</h1>
        <p>講座ごとの担当者と割り当て状況を確認できます</p>
      </div>

      {/* View mode toggle */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button
          className={`tab-btn ${viewMode === 'calendar' ? 'active' : ''}`}
          onClick={() => setViewMode('calendar')}
        >
          📅 カレンダー
        </button>
        <button
          className={`tab-btn ${viewMode === 'table' ? 'active' : ''}`}
          onClick={() => setViewMode('table')}
        >
          📋 テーブル
        </button>
      </div>

      {courseData.map((course) => (
        <div key={course.courseId} className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="card-title" style={{ margin: 0 }}>{course.courseName}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {course.perDay && (
                <span className="badge badge-info">1日{course.perDay}回</span>
              )}
              <span className={`badge ${course.assignedCount >= course.targetCount ? 'badge-success' : 'badge-warning'}`}>
                {course.assignedCount} / {course.targetCount}回
              </span>
            </div>
          </div>

          {viewMode === 'calendar' && calendarInfo ? (
            <CourseCalendar
              calendarInfo={calendarInfo}
              dateMap={course.dateMap}
              onPrev={() => setCalendarMonthOffset((o) => o - 1)}
              onNext={() => setCalendarMonthOffset((o) => o + 1)}
            />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>担当者</th>
                  <th>グループ</th>
                  <th style={{ textAlign: 'right' }}>割り当て回数</th>
                </tr>
              </thead>
              <tbody>
                {course.memberList.map((m) => {
                  const key = `${course.courseId}|${m.memberId}`;
                  const isExpanded = expandedKey === key;
                  return (
                    <tr key={m.memberId} style={{ cursor: 'pointer' }} onClick={() => setExpandedKey(isExpanded ? null : key)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: 'var(--color-primary)', fontSize: 12 }}>{isExpanded ? '▼' : '▶'}</span>
                          <span style={{ fontWeight: 600 }}>{m.memberName}</span>
                        </div>
                        {isExpanded && (
                          <div style={{ marginTop: 8, marginLeft: 18 }}>
                            <table style={{ fontSize: 13 }}>
                              <thead>
                                <tr>
                                  <th style={{ padding: '4px 12px 4px 0' }}>日付</th>
                                  <th style={{ padding: '4px 0', textAlign: 'right' }}>回数</th>
                                </tr>
                              </thead>
                              <tbody>
                                {m.dates.map((d) => (
                                  <tr key={d.date} style={{ background: 'transparent' }}>
                                    <td style={{ padding: '3px 12px 3px 0', whiteSpace: 'nowrap' }}>
                                      {formatJapaneseDate(d.date)}
                                    </td>
                                    <td style={{ padding: '3px 0', textAlign: 'right' }}>
                                      {d.count}回
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                      <td style={{ verticalAlign: 'top' }}>{m.groupName}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, verticalAlign: 'top' }}>
                        {m.total}回
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}

/** Per-course calendar component */
function CourseCalendar({
  calendarInfo,
  dateMap,
  onPrev,
  onNext,
}: {
  calendarInfo: {
    year: number;
    month: number;
    cells: { day: number; iso: string; inPeriod: boolean }[];
    dayNames: string[];
    canPrev: boolean;
    canNext: boolean;
  };
  dateMap: Map<string, { memberId: string; memberName: string; count: number }[]>;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <button
          className="btn btn-secondary"
          style={{ padding: '2px 10px', fontSize: 14, minWidth: 0 }}
          onClick={onPrev}
          disabled={!calendarInfo.canPrev}
        >
          ◀
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
          {calendarInfo.year}年{calendarInfo.month}月
        </span>
        <button
          className="btn btn-secondary"
          style={{ padding: '2px 10px', fontSize: 14, minWidth: 0 }}
          onClick={onNext}
          disabled={!calendarInfo.canNext}
        >
          ▶
        </button>
      </div>
      <div className="course-cal-grid">
        {/* Day name headers */}
        {calendarInfo.dayNames.map((dn, i) => (
          <div key={`h${i}`} className="course-cal-header" style={{
            color: i === 0 ? 'var(--color-error)' : i === 6 ? 'var(--color-primary)' : undefined,
          }}>
            {dn}
          </div>
        ))}

        {/* Calendar cells */}
        {calendarInfo.cells.map((cell, i) => {
          if (cell.day === 0) {
            return <div key={`e${i}`} className="course-cal-cell course-cal-empty" />;
          }

          const entries = dateMap.get(cell.iso) ?? [];
          const totalCount = entries.reduce((s, e) => s + e.count, 0);
          const hasAssignments = entries.length > 0;
          const dow = new Date(cell.iso + 'T00:00:00').getDay();
          const isSun = dow === 0;
          const isSat = dow === 6;

          return (
            <div
              key={cell.iso}
              className={`course-cal-cell ${!cell.inPeriod ? 'course-cal-outside' : ''} ${hasAssignments ? 'course-cal-active' : ''}`}
            >
              <div className="course-cal-day" style={{
                color: isSun ? 'var(--color-error)' : isSat ? 'var(--color-primary)' : undefined,
              }}>
                {cell.day}
              </div>
              {hasAssignments && (
                <div className="course-cal-entries">
                  {entries.map((e) => {
                    // Show last name only to save space
                    const shortName = e.memberName.split(/\s+/)[0];
                    return (
                      <div key={e.memberId} className="course-cal-entry">
                        <span className="course-cal-name">{shortName}</span>
                        <span className="course-cal-count">{e.count}</span>
                      </div>
                    );
                  })}
                  {entries.length > 1 && (
                    <div className="course-cal-total">計{totalCount}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
