import { useState } from 'react';
import { X } from 'lucide-react';
import { ImpersonationTarget } from '../../lib/auth/types';
import { getImpersonationTargets } from '../../lib/auth/impersonationTargets';

interface ImpersonationPickerProps {
  onSelect: (role: 'KAM' | 'TL', actorId: string) => void;
  onClose: () => void;
}

export function ImpersonationPicker({ onSelect, onClose }: ImpersonationPickerProps) {
  const [selectedRole, setSelectedRole] = useState<'KAM' | 'TL'>('KAM');
  const [selectedActorId, setSelectedActorId] = useState<string>('');

  const targets = getImpersonationTargets(selectedRole);

  const handleSwitch = () => {
    if (selectedActorId) {
      onSelect(selectedRole, selectedActorId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

      {/* Bottom Sheet */}
      <div className="relative w-full bg-white rounded-t-2xl shadow-xl max-h-[80vh] overflow-hidden flex flex-col animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900">Impersonate User</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Role Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Role
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedRole('KAM');
                  setSelectedActorId('');
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  selectedRole === 'KAM'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                KAM
              </button>
              <button
                onClick={() => {
                  setSelectedRole('TL');
                  setSelectedActorId('');
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  selectedRole === 'TL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                TL
              </button>
            </div>
          </div>

          {/* User Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select {selectedRole}
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {targets.map((target) => (
                <button
                  key={target.userId}
                  onClick={() => setSelectedActorId(target.userId)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    selectedActorId === target.userId
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{target.name}</div>
                    {target.city && (
                      <div className="text-sm text-gray-500">{target.city}</div>
                    )}
                  </div>
                  {selectedActorId === target.userId && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={handleSwitch}
            disabled={!selectedActorId}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Switch to {selectedRole}
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
