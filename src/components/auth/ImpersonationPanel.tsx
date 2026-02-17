/**
 * IMPERSONATION PANEL
 * 
 * Admin-only UI to select and impersonate TL or KAM
 * Should appear in Admin Home or admin layout
 */

import { useState } from 'react';
import { Users, UserCheck } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { toast } from 'sonner@2.0.3';
import { getImpersonationTargets } from '../../lib/auth/impersonationTargets';

export function ImpersonationPanel() {
  const { profile, activeActor, canImpersonate: canImpersonateFlag, setImpersonation, isImpersonating } = useAuth();
  
  const [targetType, setTargetType] = useState<'TL' | 'KAM'>('TL');
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  
  // Only show for Admin users
  if (!canImpersonateFlag) {
    return null;
  }
  
  const targets = getImpersonationTargets(targetType);
  
  const handleImpersonate = () => {
    if (!selectedTarget) {
      toast.error('Please select a user to impersonate');
      return;
    }
    
    const target = targets.find(t => t.userId === selectedTarget);
    if (target) {
      setImpersonation(targetType, target.userId);
      toast.success(`Now impersonating ${target.name} as ${targetType}`);
    }
  };
  
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="size-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Impersonate User</h3>
      </div>
      
      {isImpersonating ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-amber-800">
            <UserCheck className="size-4" />
            <span className="text-sm font-medium">
              Currently impersonating {activeActor?.name} ({activeActor?.role}) - Exit first to switch users
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Target Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Impersonate As
            </label>
            <Select value={targetType} onValueChange={(v) => {
              setTargetType(v as 'TL' | 'KAM');
              setSelectedTarget(''); // Reset selection when type changes
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TL">Team Lead (TL)</SelectItem>
                <SelectItem value="KAM">Key Account Manager (KAM)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Target User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select {targetType}
            </label>
            <Select value={selectedTarget} onValueChange={setSelectedTarget}>
              <SelectTrigger>
                <SelectValue placeholder={`Choose a ${targetType}`} />
              </SelectTrigger>
              <SelectContent>
                {targets.map(target => (
                  <SelectItem key={target.userId} value={target.userId}>
                    {target.name} {target.city ? `(${target.city})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Impersonate Button */}
          <Button
            onClick={handleImpersonate}
            disabled={!selectedTarget}
            className="w-full"
          >
            <Users className="size-4 mr-2" />
            Start Impersonation
          </Button>
        </div>
      )}
    </Card>
  );
}
