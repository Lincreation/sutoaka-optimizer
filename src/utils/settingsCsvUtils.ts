import type { Course, CourseTarget, Group, Member } from '../types';
import { generateId } from './dateUtils';

// ─── CSV Parser (RFC 4180) ────────────────────────────────────

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    const row: string[] = [];
    while (i < len) {
      if (text[i] === '"') {
        // Quoted field
        i++; // skip opening quote
        let val = '';
        while (i < len) {
          if (text[i] === '"') {
            if (i + 1 < len && text[i + 1] === '"') {
              val += '"';
              i += 2;
            } else {
              i++; // skip closing quote
              break;
            }
          } else {
            val += text[i];
            i++;
          }
        }
        row.push(val);
      } else {
        // Unquoted field
        let val = '';
        while (i < len && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') {
          val += text[i];
          i++;
        }
        row.push(val);
      }

      if (i < len && text[i] === ',') {
        i++; // skip comma
      } else {
        break; // end of row
      }
    }
    // Skip line endings
    if (i < len && text[i] === '\r') i++;
    if (i < len && text[i] === '\n') i++;

    // Skip empty trailing rows
    if (row.length > 0 && !(row.length === 1 && row[0] === '')) {
      rows.push(row);
    }
  }
  return rows;
}

function toCsvRow(values: string[]): string {
  return values.map((v) => {
    if (v.includes(',') || v.includes('"') || v.includes('\n')) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  }).join(',');
}

function buildCsv(headers: string[], rows: string[][]): string {
  return [toCsvRow(headers), ...rows.map(toCsvRow)].join('\n');
}

function downloadCsvFile(csv: string, filename: string): void {
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── EXPORT ───────────────────────────────────────────────────

const MEMBER_HEADERS = ['名前', 'グループ名', 'SlackユーザーID', 'Slack表示名', '月間上限', 'アクティブ'];
const COURSE_HEADERS = ['講座名', 'URL', '外部ID', '目標回数', '1日回数'];
const GROUP_HEADERS = ['グループ名', 'SlackチャンネルID', '担当可能講座'];

export function exportMembersCsv(members: Member[], groups: Group[]): void {
  const rows = members.map((m) => {
    const group = groups.find((g) => g.id === m.groupId);
    return [
      m.name,
      group?.name ?? '',
      m.slackUserId,
      m.slackName ?? '',
      m.monthlyLimit != null ? String(m.monthlyLimit) : '',
      m.isActive ? 'TRUE' : 'FALSE',
    ];
  });
  const csv = buildCsv(MEMBER_HEADERS, rows);
  downloadCsvFile(csv, `members_${Date.now()}.csv`);
}

export function exportCoursesCsv(courses: Course[], courseTargets: CourseTarget[]): void {
  const rows = courses.map((c) => {
    const target = courseTargets.find((ct) => ct.courseId === c.id);
    return [
      c.name,
      c.url,
      c.externalId,
      String(target?.targetCount ?? 0),
      target?.perDay != null ? String(target.perDay) : '',
    ];
  });
  const csv = buildCsv(COURSE_HEADERS, rows);
  downloadCsvFile(csv, `courses_${Date.now()}.csv`);
}

export function exportGroupsCsv(groups: Group[], courses: Course[]): void {
  const rows = groups.map((g) => {
    const courseNames = g.eligibleCourseIds
      .map((cid) => courses.find((c) => c.id === cid)?.name ?? '')
      .filter(Boolean)
      .join('|');
    return [g.name, g.slackChannelId, courseNames];
  });
  const csv = buildCsv(GROUP_HEADERS, rows);
  downloadCsvFile(csv, `groups_${Date.now()}.csv`);
}

// ─── IMPORT ───────────────────────────────────────────────────

export type CsvType = 'members' | 'courses' | 'groups' | 'unknown';

/** Detect CSV type by header row */
export function detectCsvType(text: string): CsvType {
  const cleaned = text.replace(/^\uFEFF/, ''); // strip BOM
  const rows = parseCsv(cleaned);
  if (rows.length === 0) return 'unknown';
  const header = rows[0].map((h) => h.trim());

  if (header.includes('名前') && header.includes('グループ名')) return 'members';
  if (header.includes('講座名') && header.includes('URL')) return 'courses';
  if (header.includes('グループ名') && header.includes('SlackチャンネルID')) return 'groups';
  return 'unknown';
}

export function importMembersCsv(
  text: string,
  groups: Group[]
): { members: Member[]; warnings: string[] } {
  const cleaned = text.replace(/^\uFEFF/, '');
  const rows = parseCsv(cleaned);
  if (rows.length < 2) return { members: [], warnings: ['データ行がありません'] };

  const warnings: string[] = [];
  const members: Member[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = row[0]?.trim() ?? '';
    if (!name) continue;

    const groupName = row[1]?.trim() ?? '';
    const group = groups.find((g) => g.name === groupName);
    if (groupName && !group) {
      warnings.push(`行${i + 1}: グループ「${groupName}」が見つかりません`);
    }

    members.push({
      id: generateId(),
      name,
      groupId: group?.id ?? '',
      slackUserId: row[2]?.trim() ?? '',
      slackName: row[3]?.trim() ?? '',
      monthlyLimit: row[4]?.trim() ? parseInt(row[4].trim()) || undefined : undefined,
      isActive: row[5]?.trim().toUpperCase() !== 'FALSE',
    });
  }

  return { members, warnings };
}

export function importCoursesCsv(
  text: string
): { courses: Course[]; courseTargets: CourseTarget[]; warnings: string[] } {
  const cleaned = text.replace(/^\uFEFF/, '');
  const rows = parseCsv(cleaned);
  if (rows.length < 2) return { courses: [], courseTargets: [], warnings: ['データ行がありません'] };

  const warnings: string[] = [];
  const courses: Course[] = [];
  const courseTargets: CourseTarget[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = row[0]?.trim() ?? '';
    if (!name) continue;

    const id = generateId();
    courses.push({
      id,
      name,
      url: row[1]?.trim() ?? '',
      externalId: row[2]?.trim() ?? '',
    });

    const targetCount = parseInt(row[3]?.trim() ?? '0') || 0;
    const perDayStr = row[4]?.trim() ?? '';
    const perDay = perDayStr ? parseInt(perDayStr) || undefined : undefined;

    courseTargets.push({ courseId: id, targetCount, perDay });
  }

  return { courses, courseTargets, warnings };
}

export function importGroupsCsv(
  text: string,
  courses: Course[]
): { groups: Group[]; warnings: string[] } {
  const cleaned = text.replace(/^\uFEFF/, '');
  const rows = parseCsv(cleaned);
  if (rows.length < 2) return { groups: [], warnings: ['データ行がありません'] };

  const warnings: string[] = [];
  const groups: Group[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = row[0]?.trim() ?? '';
    if (!name) continue;

    const courseNamesStr = row[2]?.trim() ?? '';
    const courseNames = courseNamesStr ? courseNamesStr.split('|').map((n) => n.trim()) : [];
    const eligibleCourseIds: string[] = [];

    for (const cn of courseNames) {
      const found = courses.find((c) => c.name === cn);
      if (found) {
        eligibleCourseIds.push(found.id);
      } else {
        warnings.push(`行${i + 1}: 講座「${cn}」が見つかりません`);
      }
    }

    groups.push({
      id: generateId(),
      name,
      slackChannelId: row[1]?.trim() ?? '',
      eligibleCourseIds,
    });
  }

  return { groups, warnings };
}
