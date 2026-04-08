/**
 * ActivityPage — top-level Activity entry point. Dispatches by role to the
 * canonical KAM/TL/Admin shells of the rebuilt module.
 *
 * Realtime + refresh remain delegated to ActivityContext (already role-aware
 * via useKamScope -> userId in the provider effect).
 */

import { useAuth } from '../auth/AuthProvider';
import { KAMActivityShell } from './KAMActivityShell';
import { TLActivityShell } from './TLActivityShell';
import { AdminActivityShell } from './AdminActivityShell';

interface Props {
  onNavigateToCallFeedback?: (callId: string) => void;
  onNavigateToVisitFeedback?: (visitId: string) => void;
  onNavigateToLocationUpdate?: (dealerId: string) => void;
}

export function ActivityPage(props: Props) {
  const { activeActor } = useAuth();
  const role = (activeActor?.role || 'KAM').toUpperCase();

  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return (
      <AdminActivityShell
        onNavigateToCallFeedback={props.onNavigateToCallFeedback}
        onNavigateToVisitFeedback={props.onNavigateToVisitFeedback}
      />
    );
  }
  if (role === 'TL') {
    return (
      <TLActivityShell
        onNavigateToCallFeedback={props.onNavigateToCallFeedback}
        onNavigateToVisitFeedback={props.onNavigateToVisitFeedback}
      />
    );
  }
  return (
    <KAMActivityShell
      onNavigateToCallFeedback={props.onNavigateToCallFeedback}
      onNavigateToVisitFeedback={props.onNavigateToVisitFeedback}
    />
  );
}
