/**
 * SUPERLEAP DESIGN SYSTEM - Phase 4 + Phase 5
 * Main container with tab navigation across 10 design system pages.
 *
 * Phase 4 Pages:
 *   1) Core System (tokens)
 *   2) Components
 *   3) Filter System
 *   4) Role Parity
 *   5) Legacy Preview
 *
 * Phase 5 Pages:
 *   6) Motion System
 *   7) Interaction States
 *   8) Filter Interaction
 *   9) Component States
 *  10) UX Enhancements
 */

import { useState } from 'react';
import {
  ArrowLeft, Palette, Layers, SlidersHorizontal, GitCompare, Archive,
  Clapperboard, MousePointerClick, ListFilter, Package, FlaskConical,
} from 'lucide-react';
import { CoreSystemPage } from './CoreSystemPage';
import { ComponentsPage } from './ComponentsPage';
import { FilterSystemPage } from './FilterSystemPage';
import { RoleParityPage } from './RoleParityPage';
import { LegacyPreviewPage } from './LegacyPreviewPage';
import { MotionSystemPage } from './MotionSystemPage';
import { InteractionStatesPage } from './InteractionStatesPage';
import { FilterInteractionPage } from './FilterInteractionPage';
import { ComponentStatesPage } from './ComponentStatesPage';
import { UXEnhancementsPage } from './UXEnhancementsPage';

type DSPage =
  | 'core' | 'components' | 'filters' | 'parity' | 'legacy'
  | 'motion' | 'interactions' | 'filter-ux' | 'comp-states' | 'ux-enhance';

type TabGroup = {
  label: string;
  tabs: { id: DSPage; label: string; icon: typeof Palette; emoji: string }[];
};

const TAB_GROUPS: TabGroup[] = [
  {
    label: 'Phase 4',
    tabs: [
      { id: 'core', label: 'Core System', icon: Palette, emoji: '\ud83e\udde0' },
      { id: 'components', label: 'Components', icon: Layers, emoji: '\ud83e\udde9' },
      { id: 'filters', label: 'Filter System', icon: SlidersHorizontal, emoji: '\ud83d\udd0e' },
      { id: 'parity', label: 'Role Parity', icon: GitCompare, emoji: '\ud83e\uddea' },
      { id: 'legacy', label: 'Legacy Preview', icon: Archive, emoji: '\ud83d\uddc2\ufe0f' },
    ],
  },
  {
    label: 'Phase 5',
    tabs: [
      { id: 'motion', label: 'Motion System', icon: Clapperboard, emoji: '\ud83c\udfac' },
      { id: 'interactions', label: 'Interaction States', icon: MousePointerClick, emoji: '\ud83e\udde0' },
      { id: 'filter-ux', label: 'Filter Interaction', icon: ListFilter, emoji: '\ud83c\udf9b\ufe0f' },
      { id: 'comp-states', label: 'Component States', icon: Package, emoji: '\ud83d\udce6' },
      { id: 'ux-enhance', label: 'UX Enhancements', icon: FlaskConical, emoji: '\ud83e\uddea' },
    ],
  },
];

const ALL_TABS = TAB_GROUPS.flatMap(g => g.tabs);

interface DesignSystemAppProps {
  onBack: () => void;
}

export function DesignSystemApp({ onBack }: DesignSystemAppProps) {
  const [activePage, setActivePage] = useState<DSPage>('core');

  const activeTab = ALL_TABS.find(t => t.id === activePage)!;
  const activePhase = TAB_GROUPS.find(g => g.tabs.some(t => t.id === activePage))?.label || 'Phase 4';

  return (
    <div className="flex flex-col h-screen bg-[#f7f8fa] max-w-md mx-auto">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 pt-3 pb-0 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <div className="text-[15px] font-bold text-slate-900">SuperLeap Design System</div>
            <div className="text-[11px] text-slate-400">{activePhase} — Tokens, Components, Motion & Interaction</div>
          </div>
        </div>

        {/* Tab Groups */}
        <div className="space-y-0.5 -mx-1 px-1 pb-0">
          {TAB_GROUPS.map(group => (
            <div key={group.label}>
              <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest px-1 mb-0.5">{group.label}</div>
              <div className="flex gap-0.5 overflow-x-auto scrollbar-hide pb-0.5">
                {group.tabs.map(tab => {
                  const isActive = activePage === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActivePage(tab.id)}
                      className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-t-lg text-[11px] font-medium transition-all whitespace-nowrap
                        ${isActive
                          ? 'bg-[#f7f8fa] text-indigo-700 border-t-2 border-x border-indigo-500 border-x-slate-200'
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                        }
                      `}
                    >
                      <tab.icon className="w-3 h-3" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.emoji}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-5">
        {activePage === 'core' && <CoreSystemPage />}
        {activePage === 'components' && <ComponentsPage />}
        {activePage === 'filters' && <FilterSystemPage />}
        {activePage === 'parity' && <RoleParityPage />}
        {activePage === 'legacy' && <LegacyPreviewPage />}
        {activePage === 'motion' && <MotionSystemPage />}
        {activePage === 'interactions' && <InteractionStatesPage />}
        {activePage === 'filter-ux' && <FilterInteractionPage />}
        {activePage === 'comp-states' && <ComponentStatesPage />}
        {activePage === 'ux-enhance' && <UXEnhancementsPage />}
      </main>

      {/* Footer */}
      <div className="bg-white border-t border-slate-100 px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>SuperLeap CRM v5.0 Design System</span>
          <span>{activePhase} — {activeTab.label}</span>
        </div>
      </div>
    </div>
  );
}
