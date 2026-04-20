/**
 * C24 SESSION TOKEN SETUP
 *
 * Small inline component shown when Cars24 session token is not configured.
 * Allows user to paste their KAM panel session token to enable lead creation.
 */

import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { toast } from 'sonner';
import { Key, Check, AlertCircle } from 'lucide-react';
import { hasC24SessionToken, setC24SessionToken, getC24SessionToken } from '../../lib/api/c24Api';

interface C24SessionSetupProps {
  onConfigured?: () => void;
}

export function C24SessionSetup({ onConfigured }: C24SessionSetupProps) {
  const [token, setToken] = useState(getC24SessionToken());
  const [saved, setSaved] = useState(hasC24SessionToken());

  const handleSave = () => {
    if (!token.trim()) {
      toast.error('Please enter a valid session token');
      return;
    }
    setC24SessionToken(token.trim());
    setSaved(true);
    toast.success('Cars24 session token saved');
    onConfigured?.();
  };

  if (saved) {
    return (
      <Card className="p-3 bg-green-50 border-green-200">
        <div className="flex items-center gap-2 text-sm text-green-800">
          <Check className="w-4 h-4" />
          <span className="font-medium">Cars24 API connected</span>
          <button
            onClick={() => setSaved(false)}
            className="ml-auto text-xs text-green-600 hover:underline"
          >
            Change
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <div>
          <h4 className="text-sm font-medium text-gray-900">Cars24 Session Required</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            To create leads and book appointments, paste your KAM panel session token below.
            You can find it in your browser's developer tools (Application → Cookies → session_token).
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Session Token</Label>
        <div className="flex gap-2">
          <Input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste session token..."
            className="flex-1"
          />
          <Button onClick={handleSave} size="sm">
            <Key className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      </div>
    </Card>
  );
}
