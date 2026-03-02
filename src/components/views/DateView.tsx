import { useMemo } from 'react';
import { useAppState } from '../../hooks/useAppState';
import { formatJapaneseDate } from '../../utils/dateUtils';

export function DateView() {
  const { currentPlan, members, groups, courses, template } = useAppState();

  const dateGroups = useMemo(() => {
    if (!currentPlan) return [];
    const map = new Map<
      string,
      Map<string, { courseId: string; count: number }[]>
    >();

    for (const a of currentPlan.assignments) {
      if (!map.has(a.date)) map.set(a.date, new Map());
      const dateMap = map.get(a.date)!;
      if (!dateMap.has(a.memberId)) dateMap.set(a.memberId, []);
      dateMap.get(a.memberId)!.push({ courseId: a.courseId, count: a.count });
    }

    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, memberMap]) => ({
        date,
        members: [...memberMap.entries()].map(([memberId, courseAssigns]) => {
          const member = members.find((m) => m.id === memberId);
          const group = groups.find((g) => g.id === member?.groupId);
          const courseLines = courseAssigns.map((ca) => {
            const course = courses.find((c) => c.id === ca.courseId);
            return `・${course?.name ?? ''}（${course?.url ?? ''}）：${ca.count}回`;
          });
          return {
            memberId,
            memberName: member?.name ?? '',
            groupName: group?.name ?? '',
            messagePreview: [template.header, ...courseLines, template.footer].join(
              '\n'
            ),
            totalCount: courseAssigns.reduce((s, ca) => s + ca.count, 0),
          };
        }),
      }));
  }, [currentPlan, members, groups, courses, template]);

  if (!currentPlan) {
    return (
      <div>
        <div className="page-header">
          <h1>日付別表示</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-text">
            まず「割り当て実行」を行ってください
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>日付別表示</h1>
        <p>日付ごとの担当者と依頼内容を確認できます</p>
      </div>
      {dateGroups.map((dg) => (
        <div key={dg.date} className="date-card">
          <div className="date-header">{formatJapaneseDate(dg.date)}</div>
          {dg.members.map((m) => (
            <div key={m.memberId} className="member-block">
              <div className="member-block-name">
                {m.memberName}
                <span className="member-block-group">（{m.groupName}）</span>
                <span className="badge badge-info" style={{ marginLeft: 8 }}>
                  {m.totalCount}回
                </span>
              </div>
              <div className="notification-text">{m.messagePreview}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
