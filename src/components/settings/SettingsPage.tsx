import { useState, useRef, useCallback } from 'react';
import { useAppState } from '../../hooks/useAppState';
import { generateId } from '../../utils/dateUtils';
import type { Course, Group, Member } from '../../types';

type SettingsTab = 'period' | 'courses' | 'groups' | 'members' | 'rules' | 'template';

export function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('period');
  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'period', label: '期間' },
    { id: 'courses', label: '講座' },
    { id: 'groups', label: 'グループ' },
    { id: 'members', label: '担当者' },
    { id: 'rules', label: 'ルール' },
    { id: 'template', label: 'テンプレート' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>設定</h1>
        <p>講座・グループ・担当者などのマスタデータを管理します</p>
      </div>
      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'period' && <PeriodEditor />}
      {tab === 'courses' && <CourseEditor />}
      {tab === 'groups' && <GroupEditor />}
      {tab === 'members' && <MemberEditor />}
      {tab === 'rules' && <RulesEditor />}
      {tab === 'template' && <TemplateEditor />}
    </div>
  );
}

function PeriodEditor() {
  const { config, setConfig } = useAppState();
  return (
    <div className="card">
      <div className="card-title">対象期間</div>
      <div className="form-row">
        <div className="form-group">
          <label>開始日</label>
          <input
            type="date"
            value={config.periodStart}
            onChange={(e) =>
              setConfig((c) => ({ ...c, periodStart: e.target.value }))
            }
          />
        </div>
        <div className="form-group">
          <label>終了日</label>
          <input
            type="date"
            value={config.periodEnd}
            onChange={(e) =>
              setConfig((c) => ({ ...c, periodEnd: e.target.value }))
            }
          />
        </div>
      </div>
    </div>
  );
}

function CourseEditor() {
  const { courses, setCourses, courseTargets, setCourseTargets } = useAppState();
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLTableRowElement | null>(null);

  const addCourse = () => {
    const id = generateId();
    setCourses((prev) => [
      ...prev,
      { id, name: '', url: '', externalId: '' },
    ]);
    setCourseTargets((prev) => [...prev, { courseId: id, targetCount: 0 }]);
  };

  const updateCourse = (id: string, patch: Partial<Course>) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  };

  const updateTarget = (courseId: string, patch: Partial<{ targetCount: number; perDay: number | undefined }>) => {
    setCourseTargets((prev) =>
      prev.map((ct) => (ct.courseId === courseId ? { ...ct, ...patch } : ct))
    );
  };

  const removeCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setCourseTargets((prev) => prev.filter((ct) => ct.courseId !== id));
  };

  const getTarget = (courseId: string) =>
    courseTargets.find((ct) => ct.courseId === courseId);

  const handleDragStart = useCallback((e: React.DragEvent<HTMLTableRowElement>, idx: number) => {
    setDragIdx(idx);
    dragNodeRef.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    // Slight delay so the drag ghost shows the row, then fade it
    requestAnimationFrame(() => {
      if (dragNodeRef.current) dragNodeRef.current.classList.add('dnd-dragging');
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverIdx(idx);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === dropIdx) return;
    setCourses((prev) => {
      const next = [...prev];
      const [removed] = next.splice(dragIdx, 1);
      next.splice(dropIdx, 0, removed);
      return next;
    });
  }, [dragIdx, setCourses]);

  const handleDragEnd = useCallback(() => {
    if (dragNodeRef.current) dragNodeRef.current.classList.remove('dnd-dragging');
    setDragIdx(null);
    setOverIdx(null);
    dragNodeRef.current = null;
  }, []);

  // Determine drop indicator position
  const getDropClass = (idx: number) => {
    if (dragIdx === null || overIdx === null || dragIdx === overIdx) return '';
    if (idx === overIdx) {
      return dragIdx < overIdx ? 'dnd-over-below' : 'dnd-over-above';
    }
    return '';
  };

  return (
    <div className="card">
      <div className="card-title">講座一覧</div>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
        ☰ をドラッグして順序を変更できます
      </p>
      <table>
        <thead>
          <tr>
            <th style={{ width: 40 }}></th>
            <th>講座名</th>
            <th>URL</th>
            <th>外部ID</th>
            <th>目標回数</th>
            <th>1日回数</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {courses.map((c, idx) => (
            <tr
              key={c.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              className={`dnd-row ${getDropClass(idx)}`}
            >
              <td>
                <span className="drag-handle" title="ドラッグで並び替え">☰</span>
              </td>
              <td>
                <input
                  className="inline-input"
                  value={c.name}
                  placeholder="講座名"
                  onChange={(e) => updateCourse(c.id, { name: e.target.value })}
                />
              </td>
              <td>
                <input
                  className="inline-input"
                  value={c.url}
                  placeholder="https://..."
                  onChange={(e) => updateCourse(c.id, { url: e.target.value })}
                />
              </td>
              <td>
                <input
                  className="inline-input"
                  value={c.externalId}
                  placeholder="ID"
                  onChange={(e) =>
                    updateCourse(c.id, { externalId: e.target.value })
                  }
                />
              </td>
              <td>
                <input
                  className="inline-input"
                  type="number"
                  min={0}
                  value={getTarget(c.id)?.targetCount ?? 0}
                  onChange={(e) =>
                    updateTarget(c.id, { targetCount: parseInt(e.target.value) || 0 })
                  }
                  style={{ width: 80 }}
                />
              </td>
              <td>
                <input
                  className="inline-input"
                  type="number"
                  min={1}
                  value={getTarget(c.id)?.perDay ?? ''}
                  placeholder="既定"
                  onChange={(e) =>
                    updateTarget(c.id, {
                      perDay: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  style={{ width: 80 }}
                />
              </td>
              <td>
                <button className="btn btn-sm btn-danger" onClick={() => removeCourse(c.id)}>
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 12 }}>
        <button className="btn btn-primary btn-sm" onClick={addCourse}>
          + 講座を追加
        </button>
      </div>
    </div>
  );
}

function GroupEditor() {
  const { groups, setGroups, courses } = useAppState();

  const addGroup = () => {
    setGroups((prev) => [
      ...prev,
      { id: generateId(), name: '', eligibleCourseIds: [], slackChannelId: '' },
    ]);
  };

  const updateGroup = (id: string, patch: Partial<Group>) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...patch } : g))
    );
  };

  const toggleCourse = (groupId: string, courseId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const has = g.eligibleCourseIds.includes(courseId);
        return {
          ...g,
          eligibleCourseIds: has
            ? g.eligibleCourseIds.filter((id) => id !== courseId)
            : [...g.eligibleCourseIds, courseId],
        };
      })
    );
  };

  const removeGroup = (id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <div className="card">
      <div className="card-title">グループ一覧</div>
      <table>
        <thead>
          <tr>
            <th>グループ名</th>
            <th>担当可能講座</th>
            <th>SlackチャンネルID</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <tr key={g.id}>
              <td>
                <input
                  className="inline-input"
                  value={g.name}
                  placeholder="グループ名"
                  onChange={(e) =>
                    updateGroup(g.id, { name: e.target.value })
                  }
                />
              </td>
              <td>
                <div className="checkbox-group">
                  {courses.map((c) => (
                    <label key={c.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={g.eligibleCourseIds.includes(c.id)}
                        onChange={() => toggleCourse(g.id, c.id)}
                      />
                      {c.name || '(未入力)'}
                    </label>
                  ))}
                </div>
              </td>
              <td>
                <input
                  className="inline-input"
                  value={g.slackChannelId}
                  placeholder="C0123456789"
                  onChange={(e) =>
                    updateGroup(g.id, { slackChannelId: e.target.value })
                  }
                />
              </td>
              <td>
                <button className="btn btn-sm btn-danger" onClick={() => removeGroup(g.id)}>
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 12 }}>
        <button className="btn btn-primary btn-sm" onClick={addGroup}>
          + グループを追加
        </button>
      </div>
    </div>
  );
}

function MemberEditor() {
  const { members, setMembers, groups } = useAppState();

  const addMember = () => {
    setMembers((prev) => [
      ...prev,
      {
        id: generateId(),
        name: '',
        groupId: groups[0]?.id ?? '',
        slackUserId: '',
        isActive: true,
      },
    ]);
  };

  const updateMember = (id: string, patch: Partial<Member>) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
    );
  };

  const removeMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="card">
      <div className="card-title">担当者一覧</div>
      <table>
        <thead>
          <tr>
            <th>名前</th>
            <th>グループ</th>
            <th>SlackユーザーID</th>
            <th>月上限</th>
            <th>有効</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id}>
              <td>
                <input
                  className="inline-input"
                  value={m.name}
                  placeholder="担当者名"
                  onChange={(e) =>
                    updateMember(m.id, { name: e.target.value })
                  }
                />
              </td>
              <td>
                <select
                  value={m.groupId}
                  onChange={(e) =>
                    updateMember(m.id, { groupId: e.target.value })
                  }
                  style={{ width: 150 }}
                >
                  <option value="">-- 選択 --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name || '(未入力)'}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  className="inline-input"
                  value={m.slackUserId}
                  placeholder="U0123456789"
                  onChange={(e) =>
                    updateMember(m.id, { slackUserId: e.target.value })
                  }
                />
              </td>
              <td>
                <input
                  className="inline-input"
                  type="number"
                  min={0}
                  value={m.monthlyLimit ?? ''}
                  placeholder="無制限"
                  onChange={(e) =>
                    updateMember(m.id, {
                      monthlyLimit: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  style={{ width: 80 }}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={m.isActive}
                  onChange={(e) =>
                    updateMember(m.id, { isActive: e.target.checked })
                  }
                  style={{ width: 'auto' }}
                />
              </td>
              <td>
                <button className="btn btn-sm btn-danger" onClick={() => removeMember(m.id)}>
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 12 }}>
        <button className="btn btn-primary btn-sm" onClick={addMember}>
          + 担当者を追加
        </button>
      </div>
    </div>
  );
}

function RulesEditor() {
  const { config, setConfig } = useAppState();
  const rules = config.workDesignRules;

  return (
    <div className="card">
      <div className="card-title">作業設計ルール</div>
      <div className="form-row">
        <div className="form-group">
          <label>1人1日あたり合計上限</label>
          <input
            type="number"
            min={1}
            value={rules.maxTotalPerPersonPerDay}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                workDesignRules: {
                  ...c.workDesignRules,
                  maxTotalPerPersonPerDay: parseInt(e.target.value) || 1,
                },
              }))
            }
            style={{ width: 100 }}
          />
        </div>
        <div className="form-group">
          <label>週あたり稼働日数（上限）</label>
          <input
            type="number"
            min={1}
            max={7}
            value={rules.maxDaysPerWeek ?? 3}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                workDesignRules: {
                  ...c.workDesignRules,
                  maxDaysPerWeek: parseInt(e.target.value) || 3,
                },
              }))
            }
            style={{ width: 100 }}
          />
        </div>
      </div>
    </div>
  );
}

function TemplateEditor() {
  const { template, setTemplate } = useAppState();

  return (
    <div className="card">
      <div className="card-title">通知テンプレート</div>
      <div className="form-group">
        <label>冒頭文</label>
        <textarea
          value={template.header}
          onChange={(e) => setTemplate((t) => ({ ...t, header: e.target.value }))}
          rows={3}
        />
      </div>
      <div className="form-group">
        <label>締め文</label>
        <textarea
          value={template.footer}
          onChange={(e) => setTemplate((t) => ({ ...t, footer: e.target.value }))}
          rows={3}
        />
      </div>
      <div className="card-title" style={{ marginTop: 16 }}>プレビュー</div>
      <div className="notification-text">
        {'<@SlackユーザーID>\n'}
        {template.header}
        {'\n'}・講座サンプル（https://example.com）：2回{'\n'}
        {template.footer}
      </div>
    </div>
  );
}
