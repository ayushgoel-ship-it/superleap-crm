import { useState, useEffect, useCallback } from "react";
import {
  AuthProvider,
  useAuth,
} from "./components/auth/AuthProvider";
import { ActivityProvider } from "./contexts/ActivityContext";
import { DesignSystemApp } from "./components/design-system/DesignSystemApp";
import { startAutoRetry } from "./lib/feedbackRetryQueue";
import { FilterProvider } from "./contexts/FilterContext";
import { ActorScopeProvider } from "./lib/auth/useActorScope";
import { AdminPage } from "./navigation";
import type {
  DealersFilterContext,
  LeadsFilterContext,
  PageView,
} from "./lib/shared/appTypes";
import { UserRole } from "./lib/auth/types";
import { BusinessChannel } from "./lib/domain/constants";
import {
  ROUTES,
  Route,
  getDefaultRoute,
  shouldResetNavigationStack,
} from "./navigation";
// Wave 1A: admin pages are wrapped in withRoleGuard at the import site so
// every render path (mobile switch + desktop shell) enforces VIEW_ADMIN_SUMMARY.
import { AdminHomePage as _AdminHomePage } from "./components/admin/AdminHomePage";
import { AdminDealersPage as _AdminDealersPage } from "./components/admin/AdminDealersPage";
import { AdminLeadsPage as _AdminLeadsPage } from "./components/admin/AdminLeadsPage";
import { AdminVCPage as _AdminVCPage } from "./components/admin/AdminVCPage";
import { AdminDCFPage as _AdminDCFPage } from "./components/admin/AdminDCFPage";
import { RoleGuard, withRoleGuard } from "./components/auth/RoleGuard";
const AdminHomePage = withRoleGuard(_AdminHomePage, 'VIEW_ADMIN_SUMMARY');
const AdminDealersPage = withRoleGuard(_AdminDealersPage, 'VIEW_ADMIN_SUMMARY');
const AdminLeadsPage = withRoleGuard(_AdminLeadsPage, 'VIEW_ADMIN_SUMMARY');
const AdminVCPage = withRoleGuard(_AdminVCPage, 'VIEW_ADMIN_SUMMARY');
const AdminDCFPage = withRoleGuard(_AdminDCFPage, 'VIEW_ADMIN_SUMMARY');
import { CallFeedbackPage } from "./components/pages/CallFeedbackPage";
import { VisitFeedbackPage } from "./components/pages/VisitFeedbackPage";
import { IncentiveSimulator } from "./components/pages/IncentiveSimulator";
import { LeadDetailPageV2 } from "./components/pages/LeadDetailPageV2";
import { getAnyLeadById } from "./data/selectors";
import { LeadCreatePage } from "./components/pages/LeadCreatePage";
import { DCFOnboardingPage } from "./components/pages/DCFOnboardingPage";
import { DealerLocationUpdatePage } from "./components/pages/DealerLocationUpdatePage";
import { Monitor, Smartphone } from "lucide-react";
import { Toaster, toast } from "sonner@2.0.3";
import { isProfileComplete } from "./lib/auth/authService";
import { TLDetailPage } from "./components/pages/TLDetailPage";
import { TLLeaderboardPage } from "./components/pages/TLLeaderboardPage";
import { TLIncentiveDashboard } from "./components/pages/TLIncentiveDashboard";
import { TLIncentiveMobile } from "./components/pages/TLIncentiveMobile";
import { HomePage } from "./components/pages/HomePage";
import { DealersPage } from "./components/pages/DealersPage";
import { LeadsPageV3 } from "./components/pages/LeadsPageV3";
import { ActivityPage } from "./components/activity/ActivityPage";
import { NotificationCenterPage } from "./components/pages/NotificationCenterPage";
import { DCFPage } from "./components/pages/DCFPage";
import { DCFDealersListPage } from "./components/pages/DCFDealersListPage";
import { DCFLeadsListPage } from "./components/pages/DCFLeadsListPage";
import { DCFDisbursalsListPage } from "./components/pages/DCFDisbursalsListPage";
import { DCFDealerDetailPage } from "./components/pages/DCFDealerDetailPage";
import { DCFLeadDetailPage } from "./components/pages/DCFLeadDetailPage";
import { DCFDealerOnboardingDetailPage } from "./components/pages/DCFDealerOnboardingDetailPage";
import { PerformancePage } from "./components/pages/PerformancePage";
import { ProductivityDashboard } from "./components/pages/ProductivityDashboard";
import { LeaderboardPage } from "./components/pages/LeaderboardPage";
import { LocationUpdateDemoPage } from "./components/visits/LocationUpdateDemoPage";
import { VisitFeedbackDemo } from "./components/visits/VisitFeedbackDemo";
import { MobileTopBar } from "./components/MobileTopBar";
import { BottomNav } from "./components/BottomNav";
import { LoginPage } from "./components/pages/auth/LoginPage";
import { ForgotPasswordPage } from "./components/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./components/pages/auth/ResetPasswordPage";
import { SignupPage } from "./components/pages/auth/SignupPage";
import { ProfileCompletePage } from "./components/pages/profile/ProfileCompletePage";
import { ProfilePage } from "./components/pages/profile/ProfilePage";
import { ForcePasswordResetScreen } from "./components/auth/ForcePasswordResetScreen";
import { RequireAuth } from "./components/auth/RequireAuth";
import { RequireProfileComplete } from "./components/auth/RequireProfileComplete";
import { AdminApprovalPanel } from "./components/admin/AdminApprovalPanel";
import { AdminDesktopShell } from "./components/admin/desktop/AdminDesktopShell";
import { AdminUsersPage } from "./components/admin/desktop/AdminUsersPage";
import { AdminTargetsPage } from "./components/admin/desktop/AdminTargetsPage";
import { AdminHierarchyPage } from "./components/admin/desktop/AdminHierarchyPage";
import { AdminReportsPage } from "./components/admin/desktop/AdminReportsPage";
import { AdminSettingsPage } from "./components/admin/desktop/AdminSettingsPage";

// Initialize feedback retry queue auto-retry listeners
startAutoRetry();

// Re-export shared types for backward compatibility
// NOTE: Components should import from './lib/shared/appTypes' to avoid circular deps
export type { PageView, UserRole };

function AppContent() {
  const { profile, session, activeActor } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageView>(
    ROUTES.HOME,
  );
  const [userRole, setUserRole] = useState<UserRole>("KAM"); // View-as role (for backward compatibility with pages)
  const [showTLIncentive, setShowTLIncentive] = useState(false);
  const [viewMode, setViewMode] = useState<
    "mobile" | "desktop"
  >("mobile");
  const [dealersFilter, setDealersFilter] = useState<
    string | null
  >(null);
  const [
    dealersNavigationContext,
    setDealersNavigationContext,
  ] = useState<string | null>(null);
  const [dealersFilterContext, setDealersFilterContext] =
    useState<DealersFilterContext | null>(null);
  const [leadsFilterContext, setLeadsFilterContext] =
    useState<LeadsFilterContext | null>(null);

  // Get active role from session (for impersonation)
  const activeRole: UserRole = session?.activeRole
    ? session.activeRole === "ADMIN"
      ? "Admin"
      : session.activeRole
    : profile?.role === "ADMIN"
      ? "Admin"
      : profile?.role === "TL"
        ? "TL"
        : "KAM";

  // Navigation reset key - changes whenever activeRole changes to force re-mount
  const [navigationKey, setNavigationKey] = useState<string>(
    () => {
      const impersonationId = session?.activeActorId || "";
      return `${activeRole}-${impersonationId}`;
    },
  );

  // Reset navigation stack when activeRole changes
  useEffect(() => {
    const impersonationId = session?.activeActorId || "";
    const newKey = `${activeRole}-${impersonationId}`;

    if (newKey !== navigationKey) {
      // Role changed - reset navigation to appropriate home using centralized config
      setNavigationKey(newKey);

      // Use centralized navigation helper to get default route
      const defaultRoute = getDefaultRoute(activeRole);
      setCurrentPage(defaultRoute);

      // Clear all navigation state
      setDealersFilter(null);
      setDealersNavigationContext(null);
      setDealersFilterContext(null);
      setLeadsFilterContext(null);
      setShowTLIncentive(false);
    }
  }, [activeRole, session?.activeActorId, navigationKey]);

  // Sync userRole with activeRole
  useEffect(() => {
    if (activeRole) {
      setUserRole(activeRole);
    }
  }, [activeRole]);

  // Legacy admin-dashboard → admin-home redirect (moved from render to effect to avoid setState-during-render)
  useEffect(() => {
    if (currentPage === "admin-dashboard") {
      setCurrentPage("admin-home");
    }
  }, [currentPage]);

  // Detect Supabase password recovery redirect (hash contains type=recovery)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setCurrentPage('auth-reset-password' as any);
    }
  }, []);

  // DCF navigation states
  const [dcfDealersFilterType, setDcfDealersFilterType] =
    useState<"onboarded" | "leadGiving">("onboarded");
  const [dcfSelectedDealerId, setDcfSelectedDealerId] =
    useState<string>("1");
  const [dcfSelectedLoanId, setDcfSelectedLoanId] =
    useState<string>("DCF-LN-982341");
  const [dcfDateRange, setDcfDateRange] =
    useState<string>("MTD");
  const [dcfCustomFrom, setDcfCustomFrom] = useState<string>("");
  const [dcfCustomTo, setDcfCustomTo] = useState<string>("");

  // Call/Visit Feedback navigation states
  const [selectedCallId, setSelectedCallId] = useState<
    string | null
  >(null);
  const [selectedVisitId, setSelectedVisitId] = useState<
    string | null
  >(null);
  const [feedbackOriginPage, setFeedbackOriginPage] =
    useState<PageView>("dealers");

  // Lead Detail navigation states
  const [selectedLeadId, setSelectedLeadId] = useState<
    string | null
  >(null);
  const [
    selectedDealerForLeadCreate,
    setSelectedDealerForLeadCreate,
  ] = useState<string | null>(null);

  // Dealer-specific navigation states
  const [
    selectedDealerForOnboarding,
    setSelectedDealerForOnboarding,
  ] = useState<string | null>(null);
  const [
    selectedDealerForLocation,
    setSelectedDealerForLocation,
  ] = useState<string | null>(null);

  // Admin navigation states
  const [selectedTLId, setSelectedTLId] =
    useState<string>("tl1");
  const [showTargetsModal, setShowTargetsModal] =
    useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [adminViewMode, setAdminViewMode] = useState<
    "mobile" | "desktop"
  >("mobile");

  // Memoized auth navigation callbacks to prevent useEffect loops
  const handleUnauthenticated = useCallback(() => {
    setCurrentPage("auth-login");
  }, []);

  const handleIncompleteProfile = useCallback(() => {
    setCurrentPage("profile-complete");
  }, []);

  // Auth navigation handlers
  const handleLoginSuccess = (role: string) => {
    // Navigate based on role (handle both 'Admin' and 'ADMIN' variants)
    if (role === "ADMIN" || role === "Admin") {
      setCurrentPage("admin-home");
    } else if (role === "TL") {
      setCurrentPage("home");
      setUserRole("TL");
    } else {
      setCurrentPage("home");
      setUserRole("KAM");
    }
  };

  const handleProfileComplete = () => {
    // Navigate to appropriate home after profile completion
    if (
      profile?.role === "ADMIN" ||
      profile?.role === "Admin"
    ) {
      setCurrentPage("admin-home");
    } else {
      setCurrentPage("home");
    }
  };

  const navigateToDealers = (
    filter?: string,
    context?: string,
    filterContext?: DealersFilterContext,
  ) => {
    setDealersFilter(filter || null);
    setDealersNavigationContext(context || null);
    setDealersFilterContext(filterContext || null);
    setCurrentPage("dealers");
  };

  const navigateToLeads = (
    filterContext?: LeadsFilterContext,
  ) => {
    setLeadsFilterContext(filterContext || null);
    setCurrentPage("leads");
  };

  const navigateToDCFDealers = (
    filterType: "onboarded" | "leadGiving",
  ) => {
    setDcfDealersFilterType(filterType);
    setCurrentPage("dcf-dealers");
  };

  const navigateToDCFLeads = () => {
    setCurrentPage("dcf-leads");
  };

  const navigateToDCFDisbursals = () => {
    setCurrentPage("dcf-disbursals");
  };

  const navigateToDCFDealerDetail = (dealerId: string) => {
    setDcfSelectedDealerId(dealerId);
    setCurrentPage("dcf-dealer-detail");
  };

  const navigateToDCFOnboardingDetail = (dealerId: string) => {
    setDcfSelectedDealerId(dealerId);
    setCurrentPage("dcf-onboarding-detail");
  };

  const navigateBackToDCF = () => {
    setCurrentPage("dcf");
  };

  const setDCFDateRange = (dateRange: string, customFrom?: string, customTo?: string) => {
    setDcfDateRange(dateRange);
    setDcfCustomFrom(customFrom || "");
    setDcfCustomTo(customTo || "");
  };

  const clearDealersContext = () => {
    setDealersNavigationContext(null);
    setDealersFilterContext(null);
  };

  const clearLeadsContext = () => {
    setLeadsFilterContext(null);
  };

  // Feedback navigation handlers
  const navigateToCallFeedback = (callId: string) => {
    setSelectedCallId(callId);
    setFeedbackOriginPage(currentPage);
    setCurrentPage("call-feedback");
  };

  const navigateToVisitFeedback = (visitId: string) => {
    setSelectedVisitId(visitId);
    setFeedbackOriginPage(currentPage);
    setCurrentPage("visit-feedback");
  };

  const handleFeedbackBack = () => {
    // Return to origin page
    setCurrentPage(feedbackOriginPage);
    setSelectedCallId(null);
    setSelectedVisitId(null);
  };

  // Lead Detail navigation handlers
  const navigateToLeadDetail = (leadId: string) => {
    // Detect DCF source so both Leads-route and DCF-route open the same canonical DCF detail
    const lookup = getAnyLeadById(leadId);
    if (lookup?.source === 'dcf') {
      setDcfSelectedLoanId(leadId);
      setFeedbackOriginPage(currentPage);
      setCurrentPage("dcf-lead-detail");
      return;
    }
    setSelectedLeadId(leadId);
    setFeedbackOriginPage(currentPage); // Store origin for back navigation
    setCurrentPage("lead-detail");
  };

  const handleLeadDetailBack = () => {
    // Go back to the origin page (either 'leads' or 'dealers')
    setCurrentPage(feedbackOriginPage);
    setSelectedLeadId(null);
  };

  // Lead Create navigation handlers
  const navigateToLeadCreate = (dealerId: string) => {
    setSelectedDealerForLeadCreate(dealerId);
    setCurrentPage("lead-create");
  };

  const handleLeadCreateBack = () => {
    setCurrentPage("dealers");
    setSelectedDealerForLeadCreate(null);
  };

  const handleLeadCreateSuccess = (leadId: string) => {
    setSelectedDealerForLeadCreate(null);
    // Navigate to the newly created lead detail
    navigateToLeadDetail(leadId);
  };

  // DCF Onboarding navigation handlers
  const navigateToDCFOnboarding = (dealerId: string) => {
    setSelectedDealerForOnboarding(dealerId);
    setCurrentPage("dcf-onboarding");
  };

  const handleDCFOnboardingBack = () => {
    setCurrentPage("dealers");
    setSelectedDealerForOnboarding(null);
  };

  const handleDCFOnboardingComplete = () => {
    setCurrentPage("dealers");
    setSelectedDealerForOnboarding(null);
    toast.success("Dealer onboarded to DCF successfully!");
  };

  // Dealer Location Update navigation handlers
  const navigateToDealerLocationUpdate = (dealerId: string) => {
    setSelectedDealerForLocation(dealerId);
    setCurrentPage("dealer-location-update");
  };

  const handleLocationUpdateBack = () => {
    setCurrentPage("dealers");
    setSelectedDealerForLocation(null);
  };

  const handleLocationUpdateSuccess = () => {
    setCurrentPage("dealers");
    setSelectedDealerForLocation(null);
    toast.success("Location update submitted successfully!");
  };

  // AUTH ROUTES - No guards needed
  if (currentPage === "auth-login") {
    return (
      <>
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onForgotPassword={() =>
            setCurrentPage("auth-forgot-password")
          }
          onSignup={() =>
            setCurrentPage("auth-signup" as any)
          }
        />
        <Toaster position="top-center" />
      </>
    );
  }

  if (currentPage === ("auth-signup" as any)) {
    return (
      <>
        <SignupPage
          onBack={() => setCurrentPage("auth-login")}
        />
        <Toaster position="top-center" />
      </>
    );
  }

  if (currentPage === "auth-forgot-password") {
    return (
      <>
        <ForgotPasswordPage
          onBack={() => setCurrentPage("auth-login")}
          onSuccess={() => setCurrentPage("auth-login")}
        />
        <Toaster position="top-center" />
      </>
    );
  }

  if (currentPage === ("auth-reset-password" as any)) {
    return (
      <>
        <ResetPasswordPage
          onSuccess={() => setCurrentPage("auth-login")}
        />
        <Toaster position="top-center" />
      </>
    );
  }

  // FORCE PASSWORD RESET — must run before any other authed screen
  if (session && profile?.mustResetPassword) {
    return (
      <>
        <ForcePasswordResetScreen
          email={profile.email}
          onComplete={() => window.location.reload()}
        />
        <Toaster position="top-center" />
      </>
    );
  }

  // PROFILE COMPLETE ROUTE - Requires auth but not profile complete
  if (currentPage === "profile-complete") {
    return (
      <RequireAuth
        onUnauthenticated={() => setCurrentPage("auth-login")}
      >
        <>
          <ProfileCompletePage
            onComplete={handleProfileComplete}
          />
          <Toaster position="top-center" />
        </>
      </RequireAuth>
    );
  }

  // PROFILE ROUTE - Requires auth and profile complete
  if (currentPage === "profile") {
    return (
      <RequireAuth
        onUnauthenticated={() => setCurrentPage("auth-login")}
      >
        <RequireProfileComplete
          onIncomplete={() =>
            setCurrentPage("profile-complete")
          }
        >
          <div className="flex flex-col h-screen bg-[#f7f8fa] max-w-md mx-auto">
            <ProfilePage
              onBack={() => setCurrentPage("home")}
              onNavigateToIncentiveSimulator={() =>
                setCurrentPage("incentive-simulator")
              }
              onNavigateToDesignSystem={() =>
                setCurrentPage("design-system" as any)
              }
            />
            <Toaster position="top-center" />
          </div>
        </RequireProfileComplete>
      </RequireAuth>
    );
  }

  // INCENTIVE SIMULATOR ROUTE - Requires auth and profile complete
  if (currentPage === "incentive-simulator") {
    return (
      <RequireAuth
        onUnauthenticated={() => setCurrentPage("auth-login")}
      >
        <RequireProfileComplete
          onIncomplete={() =>
            setCurrentPage("profile-complete")
          }
        >
          <div className="flex flex-col h-screen bg-[#f7f8fa] max-w-md mx-auto">
            <IncentiveSimulator
              onClose={() => setCurrentPage("profile")}
              userRole={activeRole}
            />
            <Toaster position="top-center" />
          </div>
        </RequireProfileComplete>
      </RequireAuth>
    );
  }

  // DESIGN SYSTEM ROUTE - Full-screen standalone page
  if (currentPage === ("design-system" as any)) {
    return (
      <RequireAuth
        onUnauthenticated={() => setCurrentPage("auth-login")}
      >
        <RequireProfileComplete
          onIncomplete={() =>
            setCurrentPage("profile-complete")
          }
        >
          <>
            <DesignSystemApp
              onBack={() => setCurrentPage("home")}
            />
            <Toaster position="top-center" />
          </>
        </RequireProfileComplete>
      </RequireAuth>
    );
  }

  // ALL OTHER ROUTES - Require auth and profile complete
  return (
    <RequireAuth onUnauthenticated={handleUnauthenticated}>
      <RequireProfileComplete
        onIncomplete={handleIncompleteProfile}
      >
        <>
          {/* TL Incentive Special Views */}
          {showTLIncentive && (
            <>
              {viewMode === "desktop" ? (
                <div className="h-screen bg-[#f7f8fa] relative">
                  <TLIncentiveDashboard
                    onBack={() => setShowTLIncentive(false)}
                  />
                  <button
                    onClick={() => setViewMode("mobile")}
                    className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
                    title="Switch to Mobile View"
                  >
                    <Smartphone className="w-6 h-6" />
                  </button>
                  <Toaster position="top-center" />
                </div>
              ) : (
                <div className="flex flex-col h-screen bg-[#f7f8fa] max-w-md mx-auto relative">
                  <TLIncentiveMobile
                    onBack={() => setShowTLIncentive(false)}
                  />
                  <button
                    onClick={() => setViewMode("desktop")}
                    className="fixed bottom-24 right-6 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
                    title="Switch to Desktop View"
                  >
                    <Monitor className="w-5 h-5" />
                  </button>
                  <Toaster position="top-center" />
                </div>
              )}
            </>
          )}

          {/* Desktop Admin Console (Wave 1A: RoleGuard-enforced) */}
          {!showTLIncentive && adminViewMode === 'desktop' && currentPage.startsWith('admin') && (
            <RoleGuard action="VIEW_ADMIN_SUMMARY">
            <AdminDesktopShell
              currentPage={currentPage}
              onNavigate={(page) => setCurrentPage(page as PageView)}
              onSwitchToMobile={() => setAdminViewMode('mobile')}
            >
              {(() => {
                switch (currentPage) {
                  case "admin-home":
                    return <AdminHomePage onNavigate={(page: AdminPage) => setCurrentPage(page as PageView)} onViewTLDetail={(tlId) => { setSelectedTLId(tlId); setCurrentPage("admin-tl-detail" as PageView); }} />;
                  case "admin-tl-detail":
                    return <TLDetailPage tlId={selectedTLId} onBack={() => setCurrentPage("admin-home")} onAdjustTargets={() => setShowTargetsModal(true)} onExport={() => setShowExportModal(true)} onViewKAM={(kamId) => console.log("View KAM:", kamId)} />;
                  case "admin-dealers":
                    return <AdminDealersPage onNavigate={(page: AdminPage) => setCurrentPage(page as PageView)} />;
                  case "admin-leads":
                    return <AdminLeadsPage onNavigate={(page: AdminPage) => setCurrentPage(page as PageView)} />;
                  case "admin-vc":
                    return <AdminVCPage onNavigate={(page: AdminPage) => setCurrentPage(page as PageView)} />;
                  case "admin-dcf":
                    return <AdminDCFPage onNavigate={(page: AdminPage) => setCurrentPage(page as PageView)} />;
                  case "admin-users":
                    return <AdminUsersPage />;
                  case "admin-targets":
                    return <AdminTargetsPage />;
                  case "admin-hierarchy":
                    return <AdminHierarchyPage />;
                  case "admin-reports":
                    return <AdminReportsPage />;
                  case "admin-settings":
                    return <AdminSettingsPage />;
                  case "admin-approvals":
                    return <AdminApprovalPanel onBack={() => setCurrentPage("admin-home")} />;
                  default:
                    return <AdminHomePage onNavigate={(page: AdminPage) => setCurrentPage(page as PageView)} onViewTLDetail={(tlId) => { setSelectedTLId(tlId); setCurrentPage("admin-tl-detail" as PageView); }} />;
                }
              })()}
              <Toaster position="top-center" />
            </AdminDesktopShell>
            </RoleGuard>
          )}

          {/* Main App (Mobile) */}
          {!showTLIncentive && !(adminViewMode === 'desktop' && currentPage.startsWith('admin')) && (
            <div className="flex flex-col h-screen bg-[#f7f8fa] max-w-md mx-auto">
              <MobileTopBar
                currentPage={currentPage}
                userRole={
                  profile?.role === "ADMIN"
                    ? "Admin"
                    : profile?.role === "TL"
                      ? "TL"
                      : "KAM"
                } // Use real role
                onRoleChange={setUserRole} // Keep for demo view-as
                onNavigate={setCurrentPage}
                onProfileClick={() => setCurrentPage("profile")}
              />

              <main className="flex-1 overflow-y-auto pb-20">
                {(() => {
                  switch (currentPage) {
                    case "home":
                      return (
                        <HomePage
                          userRole={userRole}
                          onNavigateToDealers={
                            navigateToDealers
                          }
                          onNavigateToProductivity={() =>
                            setCurrentPage("productivity")
                          }
                        />
                      );
                    case "dealers":
                      return (
                        <DealersPage
                          userRole={userRole}
                          initialFilter={dealersFilter}
                          navigationContext={
                            dealersNavigationContext
                          }
                          onClearContext={clearDealersContext}
                          filterContext={dealersFilterContext}
                          onNavigateToCallFeedback={
                            navigateToCallFeedback
                          }
                          onNavigateToVisitFeedback={
                            navigateToVisitFeedback
                          }
                          onNavigateToLeadDetail={
                            navigateToLeadDetail
                          }
                          onNavigateToLeadCreate={
                            navigateToLeadCreate
                          }
                          onNavigateToDCFOnboarding={
                            navigateToDCFOnboarding
                          }
                          onNavigateToLocationUpdate={
                            navigateToDealerLocationUpdate
                          }
                        />
                      );
                    case "leads":
                      return (
                        <LeadsPageV3
                          userRole={userRole}
                          filterContext={leadsFilterContext}
                          onClearContext={clearLeadsContext}
                          onLeadClick={navigateToLeadDetail}
                        />
                      );
                    case "visits":
                      // Activity rebuild: dispatch to canonical role-aware shells.
                      return (
                        <ActivityPage
                          onNavigateToLocationUpdate={
                            navigateToDealerLocationUpdate
                          }
                          onNavigateToCallFeedback={
                            navigateToCallFeedback
                          }
                          onNavigateToVisitFeedback={
                            navigateToVisitFeedback
                          }
                        />
                      );
                    case "notifications":
                      return (
                        <NotificationCenterPage
                          userRole={userRole}
                        />
                      );
                    case "dcf":
                      return (
                        <DCFPage
                          onNavigateToDealers={
                            navigateToDealers
                          }
                          onNavigateToLeads={navigateToLeads}
                          onNavigate={setCurrentPage}
                          onNavigateToDCFDealers={
                            navigateToDCFDealers
                          }
                          onNavigateToDCFLeads={
                            navigateToDCFLeads
                          }
                          onNavigateToDCFDisbursals={
                            navigateToDCFDisbursals
                          }
                          onNavigateToDCFDealerDetail={
                            navigateToDCFDealerDetail
                          }
                          onNavigateToDCFOnboardingDetail={
                            navigateToDCFOnboardingDetail
                          }
                          onDateRangeChange={setDCFDateRange}
                          userRole={userRole}
                        />
                      );
                    case "dcf-dealers":
                      return (
                        <DCFDealersListPage
                          onBack={navigateBackToDCF}
                          filterType={dcfDealersFilterType}
                          dateRange={dcfDateRange}
                          customFrom={dcfCustomFrom}
                          customTo={dcfCustomTo}
                          onDealerClick={
                            navigateToDCFDealerDetail
                          }
                        />
                      );
                    case "dcf-leads":
                      return (
                        <DCFLeadsListPage
                          onBack={navigateBackToDCF}
                          onLeadClick={(loanId) => {
                            setDcfSelectedLoanId(loanId);
                            setCurrentPage("dcf-lead-detail");
                          }}
                          dateRange={dcfDateRange}
                          customFrom={dcfCustomFrom}
                          customTo={dcfCustomTo}
                        />
                      );
                    case "dcf-disbursals":
                      return (
                        <DCFDisbursalsListPage
                          onBack={navigateBackToDCF}
                          dateRange={dcfDateRange}
                          customFrom={dcfCustomFrom}
                          customTo={dcfCustomTo}
                        />
                      );
                    case "dcf-dealer-detail":
                      return (
                        <DCFDealerDetailPage
                          onBack={navigateBackToDCF}
                          dealerId={dcfSelectedDealerId}
                          dateRange={dcfDateRange}
                          customFrom={dcfCustomFrom}
                          customTo={dcfCustomTo}
                        />
                      );
                    case "dcf-lead-detail":
                      return (
                        <DCFLeadDetailPage
                          loanId={dcfSelectedLoanId}
                          onBack={() =>
                            setCurrentPage(
                              feedbackOriginPage === "leads"
                                ? "leads"
                                : "dcf-leads"
                            )
                          }
                          userRole={activeRole as 'KAM' | 'TL' | 'Admin'}
                        />
                      );
                    case "dcf-onboarding-detail":
                      return (
                        <DCFDealerOnboardingDetailPage
                          onBack={navigateBackToDCF}
                          dealerId={dcfSelectedDealerId}
                        />
                      );
                    case "performance":
                      return (
                        <PerformancePage
                          userRole={userRole}
                          onNavigate={setCurrentPage}
                          onOpenTLIncentive={() =>
                            setShowTLIncentive(true)
                          }
                        />
                      );
                    case "productivity":
                      return (
                        <ProductivityDashboard
                          onBack={() => setCurrentPage("home")}
                        />
                      );
                    case "leaderboard":
                      return (
                        <LeaderboardPage userRole={userRole} />
                      );
                    case "admin-dashboard":
                      // REDIRECT handled by useEffect above — render nothing while redirect fires
                      return null;
                    case "admin-tl-leaderboard":
                      return (
                        <TLLeaderboardPage
                          onViewTLDetail={(tlId) => {
                            setSelectedTLId(tlId);
                            setCurrentPage("admin-tl-detail");
                          }}
                          onBack={() =>
                            setCurrentPage("admin-home")
                          }
                        />
                      );
                    case "admin-tl-detail":
                      return (
                        <TLDetailPage
                          tlId={selectedTLId}
                          onBack={() =>
                            setCurrentPage("admin-home")
                          }
                          onAdjustTargets={() =>
                            setShowTargetsModal(true)
                          }
                          onExport={() =>
                            setShowExportModal(true)
                          }
                          onViewKAM={(kamId) => {
                            console.log("View KAM:", kamId);
                          }}
                        />
                      );
                    case "admin-home":
                      return (
                        <AdminHomePage
                          onNavigate={(page: AdminPage) =>
                            setCurrentPage(page as PageView)
                          }
                          onViewTLDetail={(tlId) => {
                            setSelectedTLId(tlId);
                            setCurrentPage("admin-tl-detail" as PageView);
                          }}
                        />
                      );
                    case "admin-dealers":
                      return (
                        <AdminDealersPage
                          onNavigate={(page: AdminPage) =>
                            setCurrentPage(page as PageView)
                          }
                        />
                      );
                    case "admin-leads":
                      return (
                        <AdminLeadsPage
                          onNavigate={(page: AdminPage) =>
                            setCurrentPage(page as PageView)
                          }
                        />
                      );
                    case "admin-vc":
                      return (
                        <AdminVCPage
                          onNavigate={(page: AdminPage) =>
                            setCurrentPage(page as PageView)
                          }
                        />
                      );
                    case "admin-dcf":
                      return (
                        <AdminDCFPage
                          onNavigate={(page: AdminPage) =>
                            setCurrentPage(page as PageView)
                          }
                        />
                      );
                    case "admin-approvals" as any:
                      return (
                        <AdminApprovalPanel
                          onBack={() => setCurrentPage("admin-home")}
                        />
                      );
                    case "demo-location-update":
                      return <LocationUpdateDemoPage />;
                    case "demo-visit-feedback":
                      return <VisitFeedbackDemo />;
                    case "call-feedback":
                      return selectedCallId ? (
                        <CallFeedbackPage
                          callId={selectedCallId}
                          onBack={handleFeedbackBack}
                        />
                      ) : (
                        <HomePage
                          userRole={userRole}
                          onNavigateToDealers={
                            navigateToDealers
                          }
                        />
                      );
                    case "visit-feedback":
                      return selectedVisitId ? (
                        <VisitFeedbackPage
                          visitId={selectedVisitId}
                          onBack={handleFeedbackBack}
                        />
                      ) : (
                        <HomePage
                          userRole={userRole}
                          onNavigateToDealers={
                            navigateToDealers
                          }
                        />
                      );
                    case "lead-detail":
                      return selectedLeadId ? (
                        <LeadDetailPageV2
                          leadId={selectedLeadId}
                          onBack={handleLeadDetailBack}
                          userRole={userRole}
                        />
                      ) : (
                        <HomePage
                          userRole={userRole}
                          onNavigateToDealers={
                            navigateToDealers
                          }
                        />
                      );
                    case "lead-create":
                      return selectedDealerForLeadCreate ? (
                        <LeadCreatePage
                          dealerId={selectedDealerForLeadCreate}
                          onBack={handleLeadCreateBack}
                          onSuccess={handleLeadCreateSuccess}
                        />
                      ) : (
                        <HomePage
                          userRole={userRole}
                          onNavigateToDealers={
                            navigateToDealers
                          }
                        />
                      );
                    case "dcf-onboarding":
                      return selectedDealerForOnboarding ? (
                        <DCFOnboardingPage
                          dealerId={selectedDealerForOnboarding}
                          onBack={handleDCFOnboardingBack}
                          onComplete={
                            handleDCFOnboardingComplete
                          }
                        />
                      ) : (
                        <HomePage
                          userRole={userRole}
                          onNavigateToDealers={
                            navigateToDealers
                          }
                        />
                      );
                    case "dealer-location-update":
                      return selectedDealerForLocation ? (
                        <DealerLocationUpdatePage
                          dealerId={selectedDealerForLocation}
                          onBack={handleLocationUpdateBack}
                          onSuccess={
                            handleLocationUpdateSuccess
                          }
                        />
                      ) : (
                        <HomePage
                          userRole={userRole}
                          onNavigateToDealers={
                            navigateToDealers
                          }
                        />
                      );
                    default:
                      return (
                        <HomePage
                          userRole={userRole}
                          onNavigateToDealers={
                            navigateToDealers
                          }
                        />
                      );
                  }
                })()}
              </main>

              {/* Bottom Navigation — unified component for all roles */}
              <BottomNav
                currentPage={currentPage}
                onNavigate={setCurrentPage}
                userRole={activeRole}
              />

              {/* View Mode Toggle for Admin Dashboard */}
              {currentPage.startsWith("admin-") && (
                <button
                  onClick={() =>
                    setAdminViewMode(
                      adminViewMode === "desktop"
                        ? "mobile"
                        : "desktop",
                    )
                  }
                  className="fixed bottom-24 right-6 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
                  title={`Switch to ${adminViewMode === "desktop" ? "Mobile" : "Desktop"} View`}
                >
                  {adminViewMode === "desktop" ? (
                    <Smartphone className="w-5 h-5" />
                  ) : (
                    <Monitor className="w-5 h-5" />
                  )}
                </button>
              )}

              <Toaster position="top-center" />
            </div>
          )}
        </>
      </RequireProfileComplete>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ActorScopeProvider>
        <ActivityProvider>
          <FilterProvider>
            <AppContent />
          </FilterProvider>
        </ActivityProvider>
      </ActorScopeProvider>
    </AuthProvider>
  );
}