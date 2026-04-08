/**
 * IMPERSONATION BANNER
 * 
 * Persistent banner shown at top of screen when Admin is impersonating.
 * Must be visible on all pages, all tabs.
 */

import { AlertCircle, X } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { Button } from '../ui/button';

export function ImpersonationBanner() {
  const { isImpersonating, session, activeActor, clearImpersonation } = useAuth();
  
  if (!isImpersonating || !activeActor) {
    return null;
  }

  // Use rich impersonation metadata from session if available, else fall back to activeActor
  const impersonation = session?.impersonation;
  const targetName = impersonation?.targetName || activeActor.name;
  const targetRole = impersonation?.targetRole || activeActor.role;
  
  const formatDuration = () => {
    if (!impersonation?.startedAt) return '';
    
    const startTime = new Date(impersonation.startedAt).getTime();
    const now = Date.now();
    const duration = Math.floor((now - startTime) / 1000 / 60); // minutes
    
    if (duration < 1) return 'just now';
    if (duration === 1) return '1 minute ago';
    if (duration < 60) return `${duration} minutes ago`;
    
    const hours = Math.floor(duration / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };
  
  const durationText = formatDuration();
  
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white shadow-lg">
      <div className="container mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <AlertCircle className="size-5 flex-shrink-0" />

          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm min-w-0">
            <span className="font-semibold hidden sm:inline">Viewing as:</span>
            <span className="font-semibold sm:hidden">As:</span>
            <span className="truncate">{targetName}</span>
            <span className="opacity-75 flex-shrink-0">({targetRole})</span>
            {durationText && (
              <span className="opacity-60 text-xs ml-2 hidden md:inline">
                Started {durationText}
              </span>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={clearImpersonation}
          className="text-white hover:bg-amber-600 hover:text-white flex-shrink-0 px-2 sm:px-3"
          aria-label="Return to Admin"
        >
          <X className="size-4 sm:mr-1" />
          <span className="hidden sm:inline">Return to Admin</span>
        </Button>
      </div>
    </div>
  );
}

/**
 * Spacer to push content below banner when impersonating
 */
export function ImpersonationBannerSpacer() {
  const { isImpersonating } = useAuth();
  
  if (!isImpersonating) {
    return null;
  }
  
  return <div className="h-10" />;
}
