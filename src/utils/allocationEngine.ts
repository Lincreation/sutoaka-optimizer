import type {
  Course,
  CourseTarget,
  Group,
  Member,
  AllocationConfig,
  Assignment,
  Diagnostic,
  MonthlyPlan,
} from '../types';
import { getWorkingDays, getWeekBuckets, generateId } from './dateUtils';

export function allocate(
  courses: Course[],
  courseTargets: CourseTarget[],
  groups: Group[],
  members: Member[],
  config: AllocationConfig
): MonthlyPlan {
  const diagnostics: Diagnostic[] = [];
  const allAssignments: Assignment[] = [];
  const activeMembers = members.filter((m) => m.isActive);
  const workingDays = getWorkingDays(config.periodStart, config.periodEnd);

  if (workingDays.length === 0) {
    diagnostics.push({
      level: 'error',
      ruleType: 'hard',
      message: '稼働日が0日です。期間設定を確認してください。',
    });
    return makePlan(config, [], diagnostics);
  }

  // Step 1: Build eligibility map (courseId -> memberId[])
  const eligibilityMap = new Map<string, string[]>();
  for (const ct of courseTargets) {
    const course = courses.find((c) => c.id === ct.courseId);
    if (!course) continue;

    const group = groups.find((g) => g.eligibleCourseIds.includes(ct.courseId));
    if (!group) {
      diagnostics.push({
        level: 'error',
        ruleType: 'hard',
        message: `「${course.name}」を担当できるグループがありません。`,
        context: { courseId: ct.courseId },
      });
      continue;
    }

    const eligible = activeMembers
      .filter((m) => m.groupId === group.id)
      .map((m) => m.id);

    if (eligible.length === 0) {
      diagnostics.push({
        level: 'error',
        ruleType: 'hard',
        message: `「${course.name}」（${group.name}）の担当可能メンバーが0人です。`,
        context: { courseId: ct.courseId },
      });
      continue;
    }

    eligibilityMap.set(ct.courseId, eligible);
  }

  // Step 2: Build per-course perDay map (needed before quota distribution)
  const { defaultPerDay, maxTotalPerPersonPerDay } = config.workDesignRules;
  const maxDaysPerWeek = config.workDesignRules.maxDaysPerWeek ?? 3;

  const perDayMap = new Map<string, number>();
  for (const ct of courseTargets) {
    perDayMap.set(ct.courseId, ct.perDay ?? defaultPerDay);
  }

  // Step 3: Compute per-member quotas using SLOT-based distribution
  // Instead of distributing raw target counts (which causes compound overshoot
  // when each member independently rounds up to perDay multiples),
  // we first compute total slots = ceil(target / perDay), distribute slots
  // among members, then convert back: memberQuota = slots × perDay.
  // Example: target=50, perDay=3 → totalSlots=ceil(50/3)=17
  //   12 members → 5 members get 2 slots (6 each), 7 get 1 slot (3 each)
  //   Total = 5×6 + 7×3 = 51 ✓  (not 72)
  const memberQuotas = new Map<string, Map<string, number>>();
  for (const m of activeMembers) {
    memberQuotas.set(m.id, new Map());
  }

  let courseIdx = 0;
  for (const ct of courseTargets) {
    const eligible = eligibilityMap.get(ct.courseId);
    if (!eligible || eligible.length === 0) continue;

    const perDay = perDayMap.get(ct.courseId) ?? defaultPerDay;
    const totalSlots = Math.ceil(ct.targetCount / perDay);
    const baseSlots = Math.floor(totalSlots / eligible.length);
    const remainderSlots = totalSlots % eligible.length;

    // Rotate which members get the extra slot per course to avoid
    // always giving remainders to the first members (causes compound bias).
    // Course 0: members [0,1,...] get extra. Course 1: members [1,2,...] etc.
    const offset = courseIdx % eligible.length;

    for (let i = 0; i < eligible.length; i++) {
      const memberId = eligible[i];
      const rotatedI = (i - offset + eligible.length) % eligible.length;
      const slots = baseSlots + (rotatedI < remainderSlots ? 1 : 0);
      memberQuotas.get(memberId)!.set(ct.courseId, slots * perDay);
    }
    courseIdx++;
  }

  const weekBuckets = getWeekBuckets(workingDays);

  // Step 4: Feasibility check (renumbered)
  for (const ct of courseTargets) {
    const eligible = eligibilityMap.get(ct.courseId);
    if (!eligible || eligible.length === 0) continue;

    const course = courses.find((c) => c.id === ct.courseId)!;
    const perDay = perDayMap.get(ct.courseId)!;
    const perMemberQuota = Math.ceil(ct.targetCount / eligible.length);
    const neededDays = Math.ceil(perMemberQuota / perDay);
    const maxAvailDays = weekBuckets.reduce(
      (sum, week) => sum + Math.min(week.length, maxDaysPerWeek),
      0
    );

    if (neededDays > maxAvailDays) {
      diagnostics.push({
        level: 'warning',
        ruleType: 'work_design',
        message: `「${course.name}」: 1人${perMemberQuota}回÷1日${perDay}回=${neededDays}日必要 > 週${maxDaysPerWeek}日制約での最大${maxAvailDays}日。`,
        context: {
          courseId: ct.courseId,
          actual: neededDays,
          limit: maxAvailDays,
        },
      });
    }
  }

  // Step 5: For each member, pick working days and pack courses
  let memberIdx = 0;
  for (const [memberId, quotas] of memberQuotas) {
    if (quotas.size === 0) continue;

    const memberAssignments = packIntoWorkingDays(
      quotas,
      workingDays,
      weekBuckets,
      perDayMap,
      maxTotalPerPersonPerDay,
      maxDaysPerWeek,
      memberIdx
    );
    memberIdx++;

    for (const [date, courseMap] of memberAssignments) {
      for (const [courseId, count] of courseMap) {
        if (count > 0) {
          allAssignments.push({ memberId, courseId, date, count });
        }
      }
    }
  }

  // Step 6: Validate and generate diagnostics
  validateAssignments(
    allAssignments,
    courseTargets,
    courses,
    activeMembers,
    groups,
    diagnostics
  );

  return makePlan(config, allAssignments, diagnostics);
}

/**
 * Compute minimum working days using first-fit-decreasing bin packing.
 * Each "bin" is one day with capacity = maxPerDay.
 * Each "item" is one day-slot for a course (perDay units).
 * Constraint: items from the same course cannot share a bin.
 */
function computeMinDaysBinPack(
  quotas: Map<string, number>,
  perDayMap: Map<string, number>,
  maxPerDay: number
): number {
  const items: { courseId: string; perDay: number }[] = [];
  for (const [courseId, quota] of quotas) {
    if (quota <= 0) continue;
    const perDay = Math.min(perDayMap.get(courseId) ?? 2, maxPerDay);
    const slots = Math.ceil(quota / perDay);
    for (let i = 0; i < slots; i++) {
      items.push({ courseId, perDay });
    }
  }
  if (items.length === 0) return 0;

  // Sort largest first for better packing
  items.sort((a, b) => b.perDay - a.perDay);

  const bins: { remaining: number; courses: Set<string> }[] = [];
  for (const item of items) {
    let placed = false;
    for (const bin of bins) {
      if (bin.remaining >= item.perDay && !bin.courses.has(item.courseId)) {
        bin.remaining -= item.perDay;
        bin.courses.add(item.courseId);
        placed = true;
        break;
      }
    }
    if (!placed) {
      bins.push({
        remaining: maxPerDay - item.perDay,
        courses: new Set([item.courseId]),
      });
    }
  }
  return bins.length;
}

/**
 * Working-days-first algorithm:
 *
 * 1. Calculate total quota → minimum working days needed (via bin packing)
 * 2. Distribute working days evenly across weeks (respecting maxDaysPerWeek)
 * 3. Pack course assignments into chosen working days
 */
function packIntoWorkingDays(
  quotas: Map<string, number>,
  workingDays: string[],
  weekBuckets: string[][],
  perDayMap: Map<string, number>,
  maxPerDay: number,
  maxDaysPerWeek: number,
  memberIndex: number
): Map<string, Map<string, number>> {
  // Merge short edge weeks (1-2 days) with their neighbor to avoid
  // concentrating all members onto the same 1-2 dates at month boundaries.
  // E.g., if March 1 (Sun) is alone in its ISO week, merge it into the next week.
  const mergedBuckets = mergeShortEdgeBuckets(weekBuckets, 3);

  // Calculate minimum working days via bin-packing simulation.
  // Courses with the same perDay can't always share a day (e.g. two courses
  // with perDay=3 need 6 > maxPerDay=5), so simple capacity division
  // underestimates the actual days needed, causing excessive expansion.
  const minDays = computeMinDaysBinPack(quotas, perDayMap, maxPerDay);
  if (minDays === 0) return new Map();

  // Max available days from week constraints (using merged buckets)
  const weekSizes = mergedBuckets.map((w) => Math.min(w.length, maxDaysPerWeek));
  const maxAvailDays = weekSizes.reduce((a, b) => a + b, 0);

  // Actual working days needed (clamped)
  const targetDays = Math.min(Math.max(minDays, 1), maxAvailDays);

  // Distribute targetDays across weeks, with member-specific offset for day spread
  const selectedDays = selectWorkingDays(mergedBuckets, weekSizes, targetDays, memberIndex);

  // Pack courses into selected days (with expansion from full pool if needed)
  return packCourses(selectedDays, quotas, perDayMap, maxPerDay, workingDays);
}

/**
 * Select `targetDays` working days distributed evenly across weeks.
 * Within each week, pick days spread across the week.
 * `memberOffset` shifts which days are picked so different members use different weekdays.
 */
function selectWorkingDays(
  weekBuckets: string[][],
  weekSizes: number[],
  targetDays: number,
  memberOffset: number
): string[] {
  const numWeeks = weekBuckets.length;
  if (numWeeks === 0) return [];

  // Distribute targetDays across weeks as evenly as possible
  const perWeek = new Array(numWeeks).fill(0);
  let remaining = targetDays;

  // Round-robin: give each week days proportionally, capped at weekSizes
  const basePerWeek = Math.floor(targetDays / numWeeks);
  let extraDays = targetDays - basePerWeek * numWeeks;

  for (let w = 0; w < numWeeks; w++) {
    perWeek[w] = Math.min(basePerWeek, weekSizes[w]);
  }

  // Distribute extra days — rotate starting week by memberOffset
  // so different members' assignments land in different weeks of the month
  for (let j = 0; j < numWeeks && extraDays > 0; j++) {
    const w = (j + memberOffset) % numWeeks;
    const canAdd = weekSizes[w] - perWeek[w];
    if (canAdd > 0) {
      perWeek[w]++;
      extraDays--;
    }
  }

  // If still short (some weeks were too small), fill from remaining weeks
  remaining = targetDays - perWeek.reduce((a, b) => a + b, 0);
  for (let j = 0; j < numWeeks && remaining > 0; j++) {
    const w = (j + memberOffset) % numWeeks;
    const canAdd = weekSizes[w] - perWeek[w];
    if (canAdd > 0) {
      const add = Math.min(canAdd, remaining);
      perWeek[w] += add;
      remaining -= add;
    }
  }

  // Within each week, pick days evenly spread with member-specific rotation
  const selected: string[] = [];
  for (let w = 0; w < numWeeks; w++) {
    const days = weekBuckets[w];
    const pick = perWeek[w];
    if (pick === 0) continue;
    if (pick >= days.length) {
      selected.push(...days);
    } else {
      // Pick days using modular step for perfectly even distribution across members.
      const offset = memberOffset % days.length;
      const step = Math.max(1, Math.ceil(days.length / pick));
      const picked: string[] = [];
      for (let i = 0; i < pick; i++) {
        const idx = (offset + i * step) % days.length;
        picked.push(days[idx]);
      }
      // Sort chronologically before adding
      picked.sort();
      selected.push(...picked);
    }
  }

  return selected;
}

/**
 * Merge short edge week buckets (first/last) with their neighbor.
 * If the first or last bucket has fewer than `minSize` days, merge it
 * into the adjacent bucket. This prevents bottleneck dates at month
 * boundaries (e.g., a lone Sunday 3/1 becoming a 1-day "week").
 */
function mergeShortEdgeBuckets(buckets: string[][], minSize: number): string[][] {
  if (buckets.length <= 1) return buckets;

  const result = buckets.map((b) => [...b]);

  // Merge first bucket if too short
  if (result.length > 1 && result[0].length < minSize) {
    result[1] = [...result[0], ...result[1]];
    result.shift();
  }

  // Merge last bucket if too short
  if (result.length > 1 && result[result.length - 1].length < minSize) {
    result[result.length - 2] = [...result[result.length - 2], ...result[result.length - 1]];
    result.pop();
  }

  return result;
}

/**
 * Pack course assignments into the selected working days.
 * Each day gets up to maxPerDay total assignments.
 * Each course gets its perDay amount per day it appears.
 * If capacity is insufficient, expands into additional days from allWorkingDays.
 */
function packCourses(
  selectedDays: string[],
  quotas: Map<string, number>,
  perDayMap: Map<string, number>,
  maxPerDay: number,
  allWorkingDays: string[]
): Map<string, Map<string, number>> {
  const result = new Map<string, Map<string, number>>();
  for (const day of selectedDays) {
    result.set(day, new Map());
  }

  const courseList = [...quotas.entries()]
    .filter(([, q]) => q > 0)
    .sort((a, b) => b[1] - a[1]);

  const remainingQuota = new Map<string, number>();
  for (const [cid, q] of courseList) {
    remainingQuota.set(cid, q);
  }

  const dayCapacity = new Map<string, number>();
  for (const day of selectedDays) {
    dayCapacity.set(day, maxPerDay);
  }

  // Day index map for distance calculations
  const dayIndex = new Map<string, number>();
  selectedDays.forEach((d, i) => dayIndex.set(d, i));

  // Track assigned day indices per course (for max-distance spread)
  const assignedIndices = new Map<string, number[]>();
  for (const [cid] of courseList) {
    assignedIndices.set(cid, []);
  }

  // Round-robin: each round, each course picks 1 day using max-distance heuristic.
  // This ensures all courses get fair access to well-spread days instead of
  // earlier courses monopolizing the best positions.
  let madeProgress = true;
  while (madeProgress) {
    madeProgress = false;
    for (let ci = 0; ci < courseList.length; ci++) {
      const [courseId] = courseList[ci];
      const rem = remainingQuota.get(courseId)!;
      if (rem <= 0) continue;
      const perDay = perDayMap.get(courseId) ?? 2;
      const assigned = assignedIndices.get(courseId)!;

      // Find days with enough capacity not yet used by this course
      const available = selectedDays.filter((day) => {
        if (dayCapacity.get(day)! < perDay) return false;
        return !result.get(day)!.has(courseId);
      });

      if (available.length === 0) continue;

      // Pick the day that maximizes minimum distance from already-assigned days.
      // This naturally spreads assignments across the entire month.
      let bestDay: string;
      if (assigned.length === 0) {
        // First pick: stagger starting position by course index
        const offset = Math.floor((ci * available.length) / courseList.length);
        bestDay = available[offset];
      } else {
        bestDay = available[0];
        let bestScore = -1;
        for (const day of available) {
          const idx = dayIndex.get(day)!;
          const minDist = Math.min(...assigned.map((ai) => Math.abs(idx - ai)));
          if (minDist > bestScore) {
            bestScore = minDist;
            bestDay = day;
          }
        }
      }

      // Assign full perDay
      result.get(bestDay)!.set(courseId, perDay);
      dayCapacity.set(bestDay, dayCapacity.get(bestDay)! - perDay);
      remainingQuota.set(courseId, rem - perDay);
      assigned.push(dayIndex.get(bestDay)!);
      madeProgress = true;
    }
  }

  // Sweep: remaining quota into any day with capacity (full perDay only)
  for (const [courseId] of courseList) {
    let rem = remainingQuota.get(courseId)!;
    if (rem <= 0) continue;
    const perDay = perDayMap.get(courseId) ?? 2;

    for (const day of selectedDays) {
      if (rem <= 0) break;
      const cap = dayCapacity.get(day)!;
      if (cap < perDay) continue;
      const dayMap = result.get(day)!;
      dayMap.set(courseId, (dayMap.get(courseId) ?? 0) + perDay);
      dayCapacity.set(day, cap - perDay);
      rem -= perDay;
    }
    remainingQuota.set(courseId, rem);
  }

  // Expansion: add days from full pool if still needed.
  // Pick expansion days that maximize distance from existing selected days
  // to avoid piling onto early dates like 3/1.
  const anyRemaining = [...remainingQuota.values()].some((r) => r > 0);
  if (anyRemaining) {
    const extraDays = allWorkingDays.filter((d) => !result.has(d));
    // Build index for distance calculations
    const allDayIndex = new Map<string, number>();
    allWorkingDays.forEach((d, i) => allDayIndex.set(d, i));
    const usedIndices = selectedDays.map((d) => allDayIndex.get(d)!);

    while ([...remainingQuota.values()].some((r) => r > 0) && extraDays.length > 0) {
      // Pick the extra day that maximizes minimum distance from used days
      let bestIdx = 0;
      let bestScore = -1;
      for (let i = 0; i < extraDays.length; i++) {
        const di = allDayIndex.get(extraDays[i])!;
        const minDist = Math.min(...usedIndices.map((ui) => Math.abs(di - ui)));
        if (minDist > bestScore) {
          bestScore = minDist;
          bestIdx = i;
        }
      }
      const day = extraDays.splice(bestIdx, 1)[0];
      result.set(day, new Map());
      dayCapacity.set(day, maxPerDay);
      usedIndices.push(allDayIndex.get(day)!);

      for (const [courseId] of courseList) {
        const rem = remainingQuota.get(courseId)!;
        if (rem <= 0) continue;
        const perDay = perDayMap.get(courseId) ?? 2;
        const cap = dayCapacity.get(day)!;
        if (cap < perDay) continue;
        result.get(day)!.set(courseId, perDay);
        dayCapacity.set(day, cap - perDay);
        remainingQuota.set(courseId, rem - perDay);
      }
    }
  }

  return result;
}

function validateAssignments(
  assignments: Assignment[],
  courseTargets: CourseTarget[],
  courses: Course[],
  members: Member[],
  groups: Group[],
  diagnostics: Diagnostic[]
): void {
  // Check course target achievement
  for (const ct of courseTargets) {
    const course = courses.find((c) => c.id === ct.courseId);
    if (!course) continue;

    const assigned = assignments
      .filter((a) => a.courseId === ct.courseId)
      .reduce((sum, a) => sum + a.count, 0);

    if (assigned < ct.targetCount) {
      diagnostics.push({
        level: 'warning',
        ruleType: 'soft',
        message: `「${course.name}」の目標${ct.targetCount}回に対して${assigned}回のみ割り当て（不足: ${ct.targetCount - assigned}回）`,
        context: {
          courseId: ct.courseId,
          actual: assigned,
          limit: ct.targetCount,
        },
      });
    } else {
      diagnostics.push({
        level: 'info',
        ruleType: 'soft',
        message: `「${course.name}」の目標${ct.targetCount}回を達成（${assigned}回割り当て）`,
        context: { courseId: ct.courseId },
      });
    }
  }

  // Check member monthly limits
  for (const member of members) {
    if (!member.monthlyLimit) continue;

    const total = assignments
      .filter((a) => a.memberId === member.id)
      .reduce((sum, a) => sum + a.count, 0);

    if (total > member.monthlyLimit) {
      const group = groups.find((g) => g.id === member.groupId);
      diagnostics.push({
        level: 'warning',
        ruleType: 'soft',
        message: `${member.name}さん（${group?.name ?? ''}）の月合計${total}回が上限${member.monthlyLimit}回を超えています。`,
        context: {
          memberId: member.id,
          actual: total,
          limit: member.monthlyLimit,
        },
      });
    }
  }

  // Check per-member balance within each course
  for (const ct of courseTargets) {
    const course = courses.find((c) => c.id === ct.courseId);
    if (!course) continue;

    const group = groups.find((g) => g.eligibleCourseIds.includes(ct.courseId));
    if (!group) continue;

    const memberTotals = new Map<string, number>();
    for (const a of assignments) {
      if (a.courseId !== ct.courseId) continue;
      memberTotals.set(a.memberId, (memberTotals.get(a.memberId) ?? 0) + a.count);
    }

    const values = [...memberTotals.values()];
    if (values.length < 2) continue;

    const max = Math.max(...values);
    const min = Math.min(...values);
    if (max - min > 1) {
      diagnostics.push({
        level: 'warning',
        ruleType: 'soft',
        message: `「${course.name}」の担当者間で偏りがあります（最多: ${max}回、最少: ${min}回、差: ${max - min}回）`,
        context: { courseId: ct.courseId },
      });
    }
  }
}

function makePlan(
  config: AllocationConfig,
  assignments: Assignment[],
  diagnostics: Diagnostic[]
): MonthlyPlan {
  return {
    id: generateId(),
    config,
    assignments,
    generatedAt: new Date().toISOString(),
    diagnostics,
  };
}
