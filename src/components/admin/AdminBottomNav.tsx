/**
 * @deprecated Phase 2 — Use <BottomNav userRole="Admin" /> from /components/BottomNav.tsx instead.
 * This file is retained only for reference. It must NOT be imported anywhere.
 * The AdminPage type is now exported from /navigation/routes.ts and /navigation/index.ts.
 */

import { Route, getBottomNavTabs, getActiveNavTab } from '../../navigation';

/** @deprecated — import from '../../navigation' instead */
export type AdminPage = 'admin-home' | 'admin-dealers' | 'admin-leads' | 'admin-vc' | 'admin-dcf';

interface AdminBottomNavProps {
  currentPage: Route | AdminPage;
  onNavigate: (page: Route) => void;
}

/** @deprecated — use <BottomNav userRole="Admin" /> */
export function AdminBottomNav({ currentPage, onNavigate }: AdminBottomNavProps) {
  const navItems = getBottomNavTabs('Admin');
  const activeTab = getActiveNavTab(currentPage);

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40">
      <div className="h-6 bg-gradient-to-t from-white/85 to-transparent pointer-events-none" />
      <div className="glass-nav border-t border-slate-200/60 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl min-w-[56px] min-h-[44px]
                  transition-all duration-200 active:scale-95
                  ${isActive ? '' : 'text-slate-400'}
                `}
              >
                {isActive && (
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-1 rounded-full bg-indigo-600 animate-scale-in" />
                )}
                <Icon
                  className={`w-[22px] h-[22px] transition-colors duration-200
                    ${isActive ? 'text-indigo-600' : 'text-slate-400'}
                  `}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                <span className={`text-[10px] font-medium transition-colors duration-200
                  ${isActive ? 'text-indigo-600' : 'text-slate-400'}
                `}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
