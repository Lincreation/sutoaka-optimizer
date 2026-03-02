import { useState } from 'react';
import type { PageId } from './types';
import { AppStateProvider, useAppStateValue } from './hooks/useAppState';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { AllocationPage } from './components/allocation/AllocationPage';
import { DateView } from './components/views/DateView';
import { GroupView } from './components/views/GroupView';
import { PersonView } from './components/views/PersonView';
import { CourseView } from './components/views/CourseView';
import { NotificationsPage } from './components/notifications/NotificationsPage';

function AppContent() {
  const [page, setPage] = useState<PageId>('dashboard');

  return (
    <div className="app-shell">
      <Sidebar currentPage={page} onNavigate={setPage} />
      <main className="main-content">
        {page === 'dashboard' && <DashboardPage />}
        {page === 'settings' && <SettingsPage />}
        {page === 'allocation' && <AllocationPage onNavigate={setPage} />}
        {page === 'view-date' && <DateView />}
        {page === 'view-group' && <GroupView />}
        {page === 'view-person' && <PersonView />}
        {page === 'view-course' && <CourseView />}
        {page === 'notifications' && <NotificationsPage />}
      </main>
    </div>
  );
}

export default function App() {
  const appState = useAppStateValue();

  return (
    <AppStateProvider value={appState}>
      <AppContent />
    </AppStateProvider>
  );
}
