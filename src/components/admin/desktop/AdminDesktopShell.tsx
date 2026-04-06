import { useState } from 'react';
import {
  LayoutDashboard, Users, Target, GitBranch, Store, FileText, Phone,
  IndianRupee, Download, Settings, ScrollText, ChevronLeft, ChevronRight,
  LogOut, Smartphone
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  group: 'operations' | 'management';
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'admin-home', label: 'Overview', icon: LayoutDashboard, group: 'operations' },
  { id: 'admin-dealers', label: 'Dealers', icon: Store, group: 'operations' },
  { id: 'admin-leads', label: 'Leads', icon: FileText, group: 'operations' },
  { id: 'admin-vc', label: 'Activity', icon: Phone, group: 'operations' },
  { id: 'admin-dcf', label: 'DCF', icon: IndianRupee, group: 'operations' },
  { id: 'admin-users', label: 'Users', icon: Users, group: 'management' },
  { id: 'admin-targets', label: 'Targets', icon: Target, group: 'management' },
  { id: 'admin-hierarchy', label: 'Hierarchy', icon: GitBranch, group: 'management' },
  { id: 'admin-reports', label: 'Reports', icon: Download, group: 'management' },
  { id: 'admin-settings', label: 'Settings', icon: Settings, group: 'management' },
];

interface AdminDesktopShellProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onSwitchToMobile: () => void;
  children: React.ReactNode;
}

export function AdminDesktopShell({ currentPage, onNavigate, onSwitchToMobile, children }: AdminDesktopShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { profile, logout } = useAuth();

  const opsItems = NAV_ITEMS.filter(i => i.group === 'operations');
  const mgmtItems = NAV_ITEMS.filter(i => i.group === 'management');
  const activeItem = NAV_ITEMS.find(i => i.id === currentPage);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-56'} flex flex-col bg-white border-r border-slate-200 transition-all duration-200 flex-shrink-0`}>
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-slate-100">
          {!collapsed && <span className="text-sm font-bold text-indigo-600 tracking-tight">SuperLeap Admin</span>}
          {collapsed && <span className="text-sm font-bold text-indigo-600">SL</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          <div className="px-2 mb-1">
            {!collapsed && <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">Operations</p>}
            {opsItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button key={item.id} onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5
                    ${isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>

          <div className="mx-3 my-2 border-t border-slate-100" />

          <div className="px-2">
            {!collapsed && <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">Management</p>}
            {mgmtItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button key={item.id} onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5
                    ${isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-100 p-2 space-y-1">
          <button onClick={onSwitchToMobile}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700">
            <Smartphone className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Phone Mode</span>}
          </button>
          <button onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-50">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-slate-200 flex-shrink-0">
          <div>
            <h1 className="text-base font-semibold text-slate-800">{activeItem?.label || 'Admin'}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-700">{profile?.name || 'Admin'}</p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>
            <button onClick={logout} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
