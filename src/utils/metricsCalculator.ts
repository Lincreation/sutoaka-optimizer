import type {
  Assignment,
  Course,
  CourseTarget,
  Group,
  Member,
  MemberMetrics,
  CourseMetrics,
  GroupMetrics,
} from '../types';

export function calcMemberMetrics(
  assignments: Assignment[],
  members: Member[],
  groups: Group[]
): MemberMetrics[] {
  return members
    .filter((m) => m.isActive)
    .map((member) => {
      const mine = assignments.filter((a) => a.memberId === member.id);
      const total = mine.reduce((s, a) => s + a.count, 0);
      const dates = new Set(mine.map((a) => a.date));
      const workDays = dates.size;
      const group = groups.find((g) => g.id === member.groupId);
      const warnings: string[] = [];

      if (member.monthlyLimit && total > member.monthlyLimit) {
        warnings.push(
          `月上限${member.monthlyLimit}回を超過（${total}回）`
        );
      }

      return {
        memberId: member.id,
        memberName: member.name,
        groupName: group?.name ?? '',
        totalAssignments: total,
        workingDaysAssigned: workDays,
        dailyAverage: workDays > 0 ? Math.round((total / workDays) * 10) / 10 : 0,
        monthlyLimit: member.monthlyLimit,
        warnings,
      };
    });
}

export function calcCourseMetrics(
  assignments: Assignment[],
  courses: Course[],
  courseTargets: CourseTarget[],
  groups: Group[]
): CourseMetrics[] {
  return courseTargets.map((ct) => {
    const course = courses.find((c) => c.id === ct.courseId);
    const assigned = assignments
      .filter((a) => a.courseId === ct.courseId)
      .reduce((s, a) => s + a.count, 0);
    const eligible = groups
      .filter((g) => g.eligibleCourseIds.includes(ct.courseId))
      .map((g) => g.name);

    return {
      courseId: ct.courseId,
      courseName: course?.name ?? '',
      targetCount: ct.targetCount,
      assignedCount: assigned,
      remainingCount: Math.max(0, ct.targetCount - assigned),
      achievementPercent:
        ct.targetCount > 0
          ? Math.round((assigned / ct.targetCount) * 100)
          : 0,
      eligibleGroupNames: eligible,
    };
  });
}

export function calcGroupMetrics(
  assignments: Assignment[],
  members: Member[],
  groups: Group[]
): GroupMetrics[] {
  return groups.map((group) => {
    const groupMembers = members.filter(
      (m) => m.groupId === group.id && m.isActive
    );
    const memberLoads = groupMembers.map((m) =>
      assignments
        .filter((a) => a.memberId === m.id)
        .reduce((s, a) => s + a.count, 0)
    );
    const total = memberLoads.reduce((s, v) => s + v, 0);
    const max = memberLoads.length > 0 ? Math.max(...memberLoads) : 0;
    const min = memberLoads.length > 0 ? Math.min(...memberLoads) : 0;

    return {
      groupId: group.id,
      groupName: group.name,
      memberCount: groupMembers.length,
      totalLoad: total,
      perMemberAverage:
        groupMembers.length > 0
          ? Math.round((total / groupMembers.length) * 10) / 10
          : 0,
      maxLoad: max,
      minLoad: min,
      spread: max - min,
    };
  });
}
