import { Menu, Bell, Search, User, Trophy, BarChart3, Home, Users as UsersIcon, FileText, Car, Sparkles, ShieldAlert, X, ChevronRight } from 'lucide-react';
import type { UserRole, PageView } from '../lib/shared/appTypes';
import { useState } from 'react';
import { useAuth } from './auth/AuthProvider';
import { ImpersonationPicker } from './auth/ImpersonationPicker';
import { toast } from 'sonner@2.0.3';

interface MobileTopBarProps {
  currentPage: PageView;
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onNavigate?: (page: PageView) => void;
  onProfileClick?: () => void;
}

export function MobileTopBar({ currentPage, userRole, onRoleChange, onNavigate, onProfileClick }: MobileTopBarProps) {
  const { profile, activeActor, isImpersonating, canImpersonate: canImpersonateFlag, setImpersonation, clearImpersonation } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showImpersonationPicker, setShowImpersonationPicker] = useState(false);

  const pageTitle: Partial<Record<PageView, string>> = {
    home: 'SuperLeap',
    dealers: 'Dealers',
    leads: 'Leads',
    visits: 'Activity',
    notifications: 'Inbox',
    dcf: 'DCF Loans',
    'dcf-dealers': 'DCF Dealers',
    'dcf-leads': 'DCF Leads',
    'dcf-disbursals': 'DCF Disbursals',
    'dcf-dealer-detail': 'Dealer Detail',
    'dcf-lead-detail': 'DCF Lead Detail',
    'dcf-onboarding-detail': 'Dealer Onboarding',
    'dcf-onboarding': 'DCF Onboarding',
    'dcf-onboarding-form': 'DCF Onboarding',
    performance: 'Performance',
    productivity: 'Productivity',
    leaderboard: 'Leaderboard',
    'incentive-simulator': 'Incentive Simulator',
    'lead-detail': 'Lead Detail',
    'lead-create': 'Create Lead',
    'call-feedback': 'Call Feedback',
    'visit-feedback': 'Visit Feedback',
    'visit-detail': 'Visit Detail',
    'call-detail': 'Call Detail',
    'tl-call-detail': 'Call Review',
    'visit-checkin': 'Visit Check-in',
    'dealer-location-update': 'Location Update',
    'admin-dashboard': 'Admin Dashboard',
    'admin-tl-leaderboard': 'TL Leaderboard',
    'admin-tl-detail': 'TL Detail',
    'admin-home': 'Admin Home',
    'admin-dealers': 'Admin Dealers',
    'admin-leads': 'Admin Leads',
    'admin-vc': 'Admin V/C',
    'admin-dcf': 'Admin DCF',
    'demo-location-update': 'Location Update Demo',
    'demo-visit-feedback': 'Visit Feedback Demo',
    'auth-login': 'Login',
    'auth-forgot-password': 'Forgot Password',
    'profile': 'Profile',
    'profile-complete': 'Complete Profile',
  };

  const handleNavigate = (page: PageView) => {
    if (onNavigate) {
      onNavigate(page);
      setShowMenu(false);
    }
  };

  const handleImpersonationSelect = (targetRole: 'KAM' | 'TL', actorId: string) => {
    setImpersonation(targetRole, actorId);
    toast.success(`Now viewing as ${targetRole}`);
    if (targetRole === 'KAM') {
      onRoleChange('KAM');
      handleNavigate('home');
    } else {
      onRoleChange('TL');
      handleNavigate('home');
    }
  };

  const handleStopImpersonation = () => {
    clearImpersonation();
    toast.success('Stopped impersonation');
    onRoleChange('Admin');
    handleNavigate('admin-home'); // Changed from 'admin-dashboard'
  };

  const isRoleAllowed = (role: UserRole): boolean => {
    if (!profile) return false;
    if (profile.role === 'ADMIN' || profile.role === 'Admin') return true;
    if (profile.role === 'KAM') return role === 'KAM';
    if (profile.role === 'TL') return role === 'TL' || role === 'KAM';
    return false;
  };

  const isHomePage = currentPage === 'home';
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const firstName = (profile?.name || 'User').split(' ')[0];

  return (
    <>
      {/* Premium Top Bar */}
      <div className="glass-nav sticky top-0 z-40 border-b border-slate-200/60">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMenu(true)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100
                           active:scale-95 transition-all duration-150"
              >
                <Menu className="w-[18px] h-[18px] text-slate-700" />
              </button>
              <div>
                {isHomePage ? (
                  <>
                    <p className="text-[11px] text-slate-500 font-medium">{greeting}</p>
                    <h1 className="text-[17px] font-bold text-slate-900 tracking-tight leading-tight">
                      {firstName}
                    </h1>
                  </>
                ) : (
                  <h1 className="text-[17px] font-semibold text-slate-900 tracking-tight">
                    {pageTitle[currentPage] || 'SuperLeap'}
                  </h1>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onNavigate && onNavigate('notifications')}
                className="relative w-10 h-10 flex items-center justify-center rounded-xl
                           hover:bg-slate-100 active:scale-95 transition-all duration-150"
              >
                <Bell className="w-[18px] h-[18px] text-slate-600" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
              </button>
            </div>
          </div>

          {/* Impersonation Badge */}
          {isImpersonating && activeActor && (
            <div className="mt-2.5 flex items-center gap-2.5 px-3 py-2 bg-amber-50 border border-amber-200/80 rounded-xl animate-scale-in">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-amber-900">
                  Viewing as {activeActor.name}
                </div>
                <div className="text-[10px] text-amber-700 mt-0.5">{activeActor.role}</div>
              </div>
              <button
                onClick={handleStopImpersonation}
                className="text-xs font-semibold text-amber-700 hover:text-amber-900 px-2 py-1 rounded-lg
                           hover:bg-amber-100 transition-colors min-h-[32px]"
              >
                Exit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Side Menu Overlay */}
      {showMenu && (
        <div className="fixed inset-0 z-50 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-[340px] bg-white shadow-2xl flex flex-col animate-slide-up"
               style={{ animationDuration: '0.3s' }}>
            {/* User Profile Section */}
            <div className="p-5 bg-gradient-to-br from-indigo-600 to-indigo-700">
              <button onClick={() => setShowMenu(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (onProfileClick) { onProfileClick(); setShowMenu(false); }
                }}
                className="w-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden ring-2 ring-white/30">
                    {profile?.photoDataUrl ? (
                      <img src={profile.photoDataUrl} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-white font-semibold">{profile?.name || 'User'}</div>
                    <div className="text-sm text-indigo-200">
                      {profile?.role || 'KAM'} {profile?.city && `\u2022 ${profile.city}`}
                    </div>
                  </div>
                </div>
              </button>

              {/* View As Controls */}
              <div className="flex gap-2">
                {(['KAM', 'TL', 'Admin'] as UserRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      if (isRoleAllowed(role)) {
                        if ((profile?.role === 'ADMIN' || profile?.role === 'Admin') && role !== 'Admin') {
                          setShowImpersonationPicker(true);
                        } else if (role === 'Admin' && isImpersonating) {
                          handleStopImpersonation();
                        } else {
                          onRoleChange(role);
                          if (role === 'Admin') handleNavigate('admin-home');
                          else setShowMenu(false);
                        }
                      }
                    }}
                    disabled={!isRoleAllowed(role)}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150
                      ${userRole === role
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : isRoleAllowed(role)
                        ? 'bg-white/15 text-white hover:bg-white/25'
                        : 'bg-white/5 text-white/30 cursor-not-allowed'
                      }
                    `}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="flex-1 overflow-y-auto py-3 px-3">
              <div className="space-y-0.5">
                {[
                  { page: 'home' as PageView, label: 'Home', icon: Home },
                  { page: 'performance' as PageView, label: 'Performance', icon: BarChart3 },
                  { page: 'leaderboard' as PageView, label: 'Leaderboard', icon: Trophy },
                  { page: 'dealers' as PageView, label: 'Dealers', icon: UsersIcon },
                  { page: 'leads' as PageView, label: 'Leads', icon: FileText },
                  { page: 'visits' as PageView, label: 'Activity', icon: Car },
                  { page: 'dcf' as PageView, label: 'DCF Loans', icon: FileText },
                ].map(({ page, label, icon: Icon }) => (
                  <button
                    key={page}
                    onClick={() => handleNavigate(page)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-150
                      ${currentPage === page
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                    <ChevronRight className={`w-4 h-4 ml-auto transition-opacity ${currentPage === page ? 'text-indigo-400' : 'text-slate-300'}`} />
                  </button>
                ))}

                <div className="pt-4 mt-3 border-t border-slate-100">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">
                    Demo
                  </div>
                  {[
                    { page: 'demo-location-update' as PageView, label: 'Location Update' },
                    { page: 'demo-visit-feedback' as PageView, label: 'Visit Feedback' },
                  ].map(({ page, label }) => (
                    <button
                      key={page}
                      onClick={() => handleNavigate(page)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                        transition-all duration-150
                        ${currentPage === page
                          ? 'bg-violet-50 text-violet-700'
                          : 'text-slate-500 hover:bg-slate-50'
                        }
                      `}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Impersonation Picker Modal */}
      {showImpersonationPicker && (
        <ImpersonationPicker
          onSelect={handleImpersonationSelect}
          onClose={() => setShowImpersonationPicker(false)}
        />
      )}
    </>
  );
}