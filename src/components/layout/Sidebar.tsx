import type { PageId } from '../../types';

const NAV_ITEMS: { id: PageId; label: string; sub?: boolean }[] = [
  { id: 'dashboard', label: 'ダッシュボード' },
  { id: 'settings', label: '設定' },
  { id: 'allocation', label: '割り当て実行' },
  { id: 'view-date', label: '日付別' },
  { id: 'view-group', label: 'グループ別' },
  { id: 'view-person', label: '担当者別' },
  { id: 'view-course', label: '講座別' },
  { id: 'notifications', label: '通知データ' },
];

interface Props {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export function Sidebar({ currentPage, onNavigate }: Props) {
  return (
    <nav className="sidebar">
      <div className="sidebar-title">講座割り振りツール</div>
      <ul className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <li key={item.id}>
            <button
              className={`sidebar-item ${item.sub ? 'sidebar-sub' : ''} ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
