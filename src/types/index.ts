export interface Course {
  id: string;
  name: string;
  url: string;
  externalId: string;
}

export interface CourseTarget {
  courseId: string;
  targetCount: number;
  perDay?: number;
}

export interface Group {
  id: string;
  name: string;
  eligibleCourseIds: string[];
  slackChannelId: string;
}

export interface Member {
  id: string;
  name: string;
  groupId: string;
  slackUserId: string;
  slackName: string;
  monthlyLimit?: number;
  isActive: boolean;
}

export interface WorkDesignRules {
  defaultPerDay: number;
  maxTotalPerPersonPerDay: number;
  maxDaysPerWeek: number;
}

export interface AllocationConfig {
  periodStart: string;
  periodEnd: string;
  workDesignRules: WorkDesignRules;
}

export interface NotificationTemplate {
  header: string;
  footer: string;
}

export interface Assignment {
  memberId: string;
  courseId: string;
  date: string;
  count: number;
}

export interface Diagnostic {
  level: 'error' | 'warning' | 'info';
  ruleType: 'hard' | 'soft' | 'work_design';
  message: string;
  context?: {
    memberId?: string;
    courseId?: string;
    date?: string;
    actual?: number;
    limit?: number;
  };
}

export interface MonthlyPlan {
  id: string;
  config: AllocationConfig;
  assignments: Assignment[];
  generatedAt: string;
  diagnostics: Diagnostic[];
}

export interface SlackNotificationData {
  date: string;
  memberName: string;
  groupName: string;
  slackChannelId: string;
  slackUserId: string;
  messageText: string;
  courseDetails: Array<{
    courseName: string;
    courseUrl: string;
    count: number;
  }>;
}

export interface MemberMetrics {
  memberId: string;
  memberName: string;
  groupName: string;
  totalAssignments: number;
  workingDaysAssigned: number;
  dailyAverage: number;
  monthlyLimit?: number;
  warnings: string[];
}

export interface CourseMetrics {
  courseId: string;
  courseName: string;
  targetCount: number;
  assignedCount: number;
  remainingCount: number;
  achievementPercent: number;
  eligibleGroupNames: string[];
}

export interface GroupMetrics {
  groupId: string;
  groupName: string;
  memberCount: number;
  totalLoad: number;
  perMemberAverage: number;
  maxLoad: number;
  minLoad: number;
  spread: number;
}

export interface AppState {
  courses: Course[];
  courseTargets: CourseTarget[];
  groups: Group[];
  members: Member[];
  config: AllocationConfig;
  template: NotificationTemplate;
  currentPlan: MonthlyPlan | null;
  planHistory: MonthlyPlan[];
}

export type PageId =
  | 'dashboard'
  | 'settings'
  | 'allocation'
  | 'view-date'
  | 'view-group'
  | 'view-person'
  | 'view-course'
  | 'notifications';
