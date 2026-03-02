import type {
  Assignment,
  Course,
  Group,
  Member,
  NotificationTemplate,
  SlackNotificationData,
} from '../types';

export function generateAllNotifications(
  assignments: Assignment[],
  members: Member[],
  groups: Group[],
  courses: Course[],
  template: NotificationTemplate
): SlackNotificationData[] {
  // Group assignments by (date, memberId)
  const grouped = new Map<string, Assignment[]>();
  for (const a of assignments) {
    const key = `${a.date}|${a.memberId}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(a);
  }

  const notifications: SlackNotificationData[] = [];

  for (const [key, assigns] of grouped) {
    const [date, memberId] = key.split('|');
    const member = members.find((m) => m.id === memberId);
    if (!member) continue;

    const group = groups.find((g) => g.id === member.groupId);
    if (!group) continue;

    const courseDetails = assigns.map((a) => {
      const course = courses.find((c) => c.id === a.courseId);
      return {
        courseName: course?.name ?? '',
        courseUrl: course?.url ?? '',
        count: a.count,
      };
    });

    const courseLines = courseDetails
      .map((cd) => {
        const urlPart = cd.courseUrl ? `（${cd.courseUrl}）` : '';
        return `・${cd.courseName}${urlPart}：${cd.count}回`;
      })
      .join('\n');

    const mention = member.slackUserId ? `<@${member.slackUserId}>\n` : '';
    const messageText = [mention + template.header, courseLines, template.footer].join(
      '\n'
    );

    notifications.push({
      date,
      memberName: member.name,
      groupName: group.name,
      slackChannelId: group.slackChannelId,
      slackUserId: member.slackUserId,
      messageText,
      courseDetails,
    });
  }

  notifications.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.memberName.localeCompare(b.memberName);
  });

  return notifications;
}
