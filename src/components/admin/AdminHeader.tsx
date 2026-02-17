import { useState } from 'react';
import { ChevronDown, X, AlertCircle, UserCog } from 'lucide-react';

export type AdminTab = 'home' | 'dealers' | 'leads' | 'visits' | 'calls' | 'dcf' | 'performance' | 'targets';

interface AdminHeaderProps {
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  selectedTL: string | 'all';
  onTLChange: (tlId: string) => void;
  isImpersonating: boolean;
  onToggleImpersonation: () => void;
  viewMode?: 'desktop' | 'mobile';
}

const mockTLs = [
  { id: 'all', name: 'All TLs', region: '' },
  { id: 'tl1', name: 'Nikhil Verma', region: 'North' },
  { id: 'tl2', name: 'Seema Rao', region: 'West' },
  { id: 'tl3', name: 'Harsh Gupta', region: 'East' },
  { id: 'tl4', name: 'Priya Sharma', region: 'South' },
  { id: 'tl5', name: 'Rajesh Kumar', region: 'NCR' },
];

export function AdminHeader({
  currentTab,
  onTabChange,
  selectedTL,
  onTLChange,
  isImpersonating,
  onToggleImpersonation,
  viewMode = 'desktop',
}: AdminHeaderProps) {
  const [showTLDropdown, setShowTLDropdown] = useState(false);

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'dealers', label: 'Dealers' },
    { id: 'leads', label: 'Leads' },
    { id: 'visits', label: 'Visits' },
    { id: 'calls', label: 'Calls' },
    { id: 'dcf', label: 'DCF' },
    { id: 'performance', label: 'Performance' },
    { id: 'targets', label: 'Targets' },
  ];

  const selectedTLData = mockTLs.find((tl) => tl.id === selectedTL) || mockTLs[0];
  const canImpersonate = selectedTL !== 'all';

  if (viewMode === 'mobile') {
    return (
      <div className="bg-white border-b border-gray-200">
        {/* Impersonation Banner */}
        {isImpersonating && selectedTL !== 'all' && (
          <div className="bg-orange-500 text-white px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <UserCog className="w-4 h-4" />
              <span>Acting as: {selectedTLData.name}</span>
            </div>
            <button
              onClick={onToggleImpersonation}
              className="text-sm underline"
            >
              Exit
            </button>
          </div>
        )}

        {/* TL Selector */}
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <button
              onClick={() => setShowTLDropdown(!showTLDropdown)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-left flex items-center justify-between"
            >
              <div>
                <div className="text-xs text-gray-500">Team Lead</div>
                <div className="text-gray-900">{selectedTLData.name}</div>
              </div>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showTLDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                {mockTLs.map((tl) => (
                  <button
                    key={tl.id}
                    onClick={() => {
                      onTLChange(tl.id);
                      setShowTLDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 ${
                      selectedTL === tl.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="text-sm text-gray-900">{tl.name}</div>
                    {tl.region && <div className="text-xs text-gray-600">{tl.region}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Act as TL button */}
          {canImpersonate && (
            <button
              onClick={onToggleImpersonation}
              className={`w-full mt-2 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 ${
                isImpersonating
                  ? 'bg-orange-500 text-white'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              <UserCog className="w-4 h-4" />
              {isImpersonating ? 'Exit Impersonation' : 'Act as TL'}
            </button>
          )}

          {/* Status badge */}
          {selectedTL !== 'all' && !isImpersonating && (
            <div className="mt-2 text-xs text-gray-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Viewing as Admin → TL-scoped
            </div>
          )}
        </div>

        {/* Tab Navigation - Horizontal Scroll */}
        <div className="overflow-x-auto">
          <div className="flex px-2 py-2 gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
                  currentTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Desktop view
  return (
    <div className="bg-white border-b border-gray-200">
      {/* Impersonation Banner */}
      {isImpersonating && selectedTL !== 'all' && (
        <div className="bg-orange-500 text-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCog className="w-5 h-5" />
            <div>
              <div className="font-medium">You are acting as: {selectedTLData.name}</div>
              <div className="text-xs opacity-90">
                All actions will be performed as this TL (mock mode)
              </div>
            </div>
          </div>
          <button
            onClick={onToggleImpersonation}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Exit to Admin
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl text-gray-900">Admin Dashboard</h1>

          <div className="flex items-center gap-3">
            {/* TL Selector */}
            <div className="relative">
              <button
                onClick={() => setShowTLDropdown(!showTLDropdown)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm flex items-center gap-2 min-w-[200px] justify-between"
              >
                <div className="text-left">
                  <div className="text-xs text-gray-500">Team Lead</div>
                  <div className="text-gray-900">{selectedTLData.name}</div>
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showTLDropdown && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 min-w-[250px] max-h-80 overflow-y-auto">
                  {mockTLs.map((tl) => (
                    <button
                      key={tl.id}
                      onClick={() => {
                        onTLChange(tl.id);
                        setShowTLDropdown(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                        selectedTL === tl.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="text-sm text-gray-900">{tl.name}</div>
                      {tl.region && <div className="text-xs text-gray-600">{tl.region}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Act as TL button */}
            {canImpersonate && (
              <button
                onClick={onToggleImpersonation}
                className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
                  isImpersonating
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                <UserCog className="w-4 h-4" />
                {isImpersonating ? 'Exit Impersonation' : 'Act as TL'}
              </button>
            )}
          </div>
        </div>

        {/* Status badge */}
        {selectedTL !== 'all' && !isImpersonating && (
          <div className="mt-2 text-xs text-gray-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Viewing as Admin → TL-scoped data
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="px-6">
        <div className="flex gap-1 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-3 text-sm relative ${
                currentTab === tab.id
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {currentTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
