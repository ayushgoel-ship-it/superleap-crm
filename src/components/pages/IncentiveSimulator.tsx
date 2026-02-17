import { KAMIncentiveSimulator } from './KAMIncentiveSimulator';
import { TLIncentiveSimulator } from './TLIncentiveSimulator';

interface IncentiveSimulatorProps {
  onClose: () => void;
  userRole?: 'KAM' | 'TL' | 'Admin';
}

export function IncentiveSimulator({ onClose, userRole = 'TL' }: IncentiveSimulatorProps) {
  // Route to appropriate simulator based on role
  if (userRole === 'KAM') {
    return <KAMIncentiveSimulator onClose={onClose} />;
  }
  
  // TL/Admin gets TL simulator
  return <TLIncentiveSimulator onClose={onClose} />;
}
