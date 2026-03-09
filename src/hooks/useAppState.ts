import { createContext, useContext, useMemo } from 'react';
import type {
  Course,
  CourseTarget,
  Group,
  Member,
  AllocationConfig,
  NotificationTemplate,
  MonthlyPlan,
} from '../types';
import { useLocalStorage } from './useLocalStorage';
import { DEFAULT_CONFIG, DEFAULT_TEMPLATE, DEFAULT_MEMBERS, DEFAULT_COURSES, DEFAULT_COURSE_TARGETS, DEFAULT_GROUPS } from '../constants/defaults';
import { allocate } from '../utils/allocationEngine';

export interface AppActions {
  courses: Course[];
  setCourses: (v: Course[] | ((p: Course[]) => Course[])) => void;
  courseTargets: CourseTarget[];
  setCourseTargets: (v: CourseTarget[] | ((p: CourseTarget[]) => CourseTarget[])) => void;
  groups: Group[];
  setGroups: (v: Group[] | ((p: Group[]) => Group[])) => void;
  members: Member[];
  setMembers: (v: Member[] | ((p: Member[]) => Member[])) => void;
  config: AllocationConfig;
  setConfig: (v: AllocationConfig | ((p: AllocationConfig) => AllocationConfig)) => void;
  template: NotificationTemplate;
  setTemplate: (v: NotificationTemplate | ((p: NotificationTemplate) => NotificationTemplate)) => void;
  currentPlan: MonthlyPlan | null;
  setCurrentPlan: (v: MonthlyPlan | null) => void;
  planHistory: MonthlyPlan[];
  setPlanHistory: (v: MonthlyPlan[] | ((p: MonthlyPlan[]) => MonthlyPlan[])) => void;
  runAllocation: () => MonthlyPlan;
}

const AppStateContext = createContext<AppActions | null>(null);

export const AppStateProvider = AppStateContext.Provider;

/** Migrate members loaded from localStorage: fill missing slackName from defaults */
function migrateMembersSlackName(members: Member[]): Member[] {
  let changed = false;
  const migrated = members.map((m) => {
    if (m.slackName === undefined || m.slackName === null) {
      const def = DEFAULT_MEMBERS.find((d) => d.id === m.id);
      changed = true;
      return { ...m, slackName: def?.slackName ?? '' };
    }
    return m;
  });
  return changed ? migrated : members;
}

export function useAppStateValue(): AppActions {
  const [courses, setCourses] = useLocalStorage<Course[]>('courses', DEFAULT_COURSES);
  const [courseTargets, setCourseTargets] = useLocalStorage<CourseTarget[]>('courseTargets', DEFAULT_COURSE_TARGETS);
  const [groups, setGroups] = useLocalStorage<Group[]>('groups', DEFAULT_GROUPS);
  const [members, setMembers] = useLocalStorage<Member[]>('members', DEFAULT_MEMBERS, migrateMembersSlackName);
  const [config, setConfig] = useLocalStorage<AllocationConfig>('config', DEFAULT_CONFIG);
  const [template, setTemplate] = useLocalStorage<NotificationTemplate>('template', DEFAULT_TEMPLATE);
  const [currentPlan, setCurrentPlan] = useLocalStorage<MonthlyPlan | null>('currentPlan', null);
  const [planHistory, setPlanHistory] = useLocalStorage<MonthlyPlan[]>('planHistory', []);

  return useMemo(
    () => ({
      courses,
      setCourses,
      courseTargets,
      setCourseTargets,
      groups,
      setGroups,
      members,
      setMembers,
      config,
      setConfig,
      template,
      setTemplate,
      currentPlan,
      setCurrentPlan,
      planHistory,
      setPlanHistory,
      runAllocation: () => {
        const plan = allocate(courses, courseTargets, groups, members, config);
        setCurrentPlan(plan);
        // Save to history (max 10, newest first)
        setPlanHistory((prev) => [plan, ...prev].slice(0, 10));
        return plan;
      },
    }),
    [courses, setCourses, courseTargets, setCourseTargets, groups, setGroups, members, setMembers, config, setConfig, template, setTemplate, currentPlan, setCurrentPlan, planHistory, setPlanHistory]
  );
}

export function useAppState(): AppActions {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
