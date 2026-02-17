import type { UserRole } from '../../lib/shared/appTypes';
import { useState } from 'react';
import { Users, User, ChevronDown } from 'lucide-react';

interface ViewModeSelectorProps {
  userRole: UserRole;
  onRoleChange?: (role: UserRole) => void;
  showKAMSelector?: boolean;
}

export function ViewModeSelector({ userRole, onRoleChange, showKAMSelector = true }: ViewModeSelectorProps) {
  const [selectedKAM, setSelectedKAM] = useState('all');
  const [showKAMDropdown, setShowKAMDropdown] = useState(false);

  const kams = [
    { id: 'all', name: 'All KAMs' },
    { id: 'kam1', name: 'Rajesh Kumar' },
    { id: 'kam2', name: 'Priya Sharma' },
    { id: 'kam3', name: 'Amit Patel' },
    { id: 'kam4', name: 'Sneha Verma' },
    { id: 'kam5', name: 'Vikram Singh' },
  ];

  if (userRole !== 'TL') {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200 p-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Users className="w-3 h-3" />
          <span>TL View</span>
        </div>
        
        {showKAMSelector && (
          <>
            <div className="h-4 w-px bg-gray-300" />
            <div className="relative flex-1">
              <button
                onClick={() => setShowKAMDropdown(!showKAMDropdown)}
                className="w-full px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm flex items-center justify-between"
              >
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {kams.find(k => k.id === selectedKAM)?.name}
                </span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showKAMDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {kams.map((kam) => (
                    <button
                      key={kam.id}
                      onClick={() => {
                        setSelectedKAM(kam.id);
                        setShowKAMDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-50 ${
                        selectedKAM === kam.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      {kam.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}