/**
 * SUPERLEAP CORE SYSTEM - Design Tokens Documentation
 * Phase 4 - Color, Typography, Spacing, Radius tokens
 */

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1 rounded hover:bg-slate-100 transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
    </button>
  );
}

function ColorSwatch({ name, hex, cssVar, className }: { name: string; hex: string; cssVar: string; className?: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`w-10 h-10 rounded-xl border border-slate-200 flex-shrink-0 ${className || ''}`} style={{ backgroundColor: hex }} />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-slate-800">{name}</div>
        <div className="text-[11px] text-slate-400 font-mono">{hex}</div>
      </div>
      <div className="flex items-center gap-1">
        <code className="text-[10px] text-slate-400 font-mono">{cssVar}</code>
        <CopyButton text={cssVar} />
      </div>
    </div>
  );
}

function TokenSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-[15px] font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">{title}</h3>
      {children}
    </div>
  );
}

export function CoreSystemPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-[20px] font-bold text-slate-900 mb-1">SuperLeap Core System</h2>
        <p className="text-[13px] text-slate-500">
          Foundation design tokens powering every screen. All tokens use the <code className="text-indigo-600 bg-indigo-50 px-1 rounded">--sl-*</code> namespace.
        </p>
      </div>

      {/* 1) Color System */}
      <div className="card-premium p-5">
        <h3 className="text-[17px] font-bold text-slate-900 mb-5">1. Color System</h3>

        <TokenSection title="Primary Palette">
          <div className="space-y-1">
            <ColorSwatch name="Primary/50" hex="#eef2ff" cssVar="--sl-primary-50" />
            <ColorSwatch name="Primary/100" hex="#e0e7ff" cssVar="--sl-primary-100" />
            <ColorSwatch name="Primary/500" hex="#6366f1" cssVar="--sl-primary-500" />
            <ColorSwatch name="Primary/600" hex="#4f46e5" cssVar="--sl-primary-600" />
            <ColorSwatch name="Primary/700" hex="#4338ca" cssVar="--sl-primary-700" />
          </div>
          <div className="mt-3 p-3 bg-indigo-50 rounded-xl text-[12px] text-indigo-700">
            Primary/600 is the main action color. Use /700 for hover. /50 for light bg tint.
          </div>
        </TokenSection>

        <TokenSection title="Neutral Palette (Slate)">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <ColorSwatch name="Neutral/900" hex="#0f172a" cssVar="--sl-neutral-900" />
            <ColorSwatch name="Neutral/800" hex="#1e293b" cssVar="--sl-neutral-800" />
            <ColorSwatch name="Neutral/700" hex="#334155" cssVar="--sl-neutral-700" />
            <ColorSwatch name="Neutral/600" hex="#475569" cssVar="--sl-neutral-600" />
            <ColorSwatch name="Neutral/500" hex="#64748b" cssVar="--sl-neutral-500" />
            <ColorSwatch name="Neutral/400" hex="#94a3b8" cssVar="--sl-neutral-400" />
            <ColorSwatch name="Neutral/300" hex="#cbd5e1" cssVar="--sl-neutral-300" />
            <ColorSwatch name="Neutral/200" hex="#e2e8f0" cssVar="--sl-neutral-200" />
            <ColorSwatch name="Neutral/100" hex="#f1f5f9" cssVar="--sl-neutral-100" />
            <ColorSwatch name="Neutral/50" hex="#f8fafc" cssVar="--sl-neutral-50" />
          </div>
          <div className="mt-3 p-3 bg-slate-50 rounded-xl text-[12px] text-slate-600 border border-slate-100">
            Unified to Slate only. Remove all <code className="bg-white px-1 rounded">gray-*</code> references.
          </div>
        </TokenSection>

        <TokenSection title="Background Tokens">
          <div className="space-y-1">
            <ColorSwatch name="Background/App" hex="#f7f8fa" cssVar="--sl-bg-app" />
            <ColorSwatch name="Background/Card" hex="#ffffff" cssVar="--sl-bg-card" />
            <ColorSwatch name="Background/Elevated" hex="#ffffff" cssVar="--sl-bg-elevated" />
          </div>
        </TokenSection>

        <TokenSection title="Semantic Colors">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <ColorSwatch name="Success" hex="#16a34a" cssVar="--sl-success" />
            <ColorSwatch name="Success/Light" hex="#f0fdf4" cssVar="--sl-success-light" />
            <ColorSwatch name="Warning" hex="#f59e0b" cssVar="--sl-warning" />
            <ColorSwatch name="Warning/Light" hex="#fffbeb" cssVar="--sl-warning-light" />
            <ColorSwatch name="Error" hex="#dc2626" cssVar="--sl-error" />
            <ColorSwatch name="Error/Light" hex="#fef2f2" cssVar="--sl-error-light" />
            <ColorSwatch name="Info" hex="#2563eb" cssVar="--sl-info" />
            <ColorSwatch name="Info/Light" hex="#eff6ff" cssVar="--sl-info-light" />
          </div>
        </TokenSection>
      </div>

      {/* 2) Radius Tokens */}
      <div className="card-premium p-5">
        <h3 className="text-[17px] font-bold text-slate-900 mb-5">2. Radius Tokens</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { name: 'Card', value: '16px', tw: 'rounded-2xl', cssVar: '--sl-radius-card' },
            { name: 'Button', value: '12px', tw: 'rounded-xl', cssVar: '--sl-radius-button' },
            { name: 'Chip', value: '999px', tw: 'rounded-full', cssVar: '--sl-radius-chip' },
            { name: 'Modal', value: '20px', tw: 'rounded-[20px]', cssVar: '--sl-radius-modal' },
            { name: 'Input', value: '10px', tw: 'rounded-[10px]', cssVar: '--sl-radius-input' },
          ].map(r => (
            <div key={r.name} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-12 h-12 bg-indigo-100 border-2 border-indigo-300"
                  style={{ borderRadius: r.value === '999px' ? '999px' : r.value }}
                />
                <div>
                  <div className="text-[13px] font-semibold text-slate-800">Radius/{r.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{r.value}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <code className="text-[10px] text-slate-400 font-mono">{r.cssVar}</code>
                <code className="text-[10px] text-indigo-500 font-mono">{r.tw}</code>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3) Typography Scale */}
      <div className="card-premium p-5">
        <h3 className="text-[17px] font-bold text-slate-900 mb-5">3. Typography Scale</h3>
        <p className="text-[12px] text-slate-500 mb-4">All mapped to Inter / SF Pro Display. Only 8 sizes allowed. Removes arbitrary pixel sizes.</p>

        <div className="space-y-3">
          {[
            { name: 'Heading/24', size: '1.5rem', px: '24px', weight: '700', cssVar: '--sl-heading-24', sample: 'Dashboard Overview' },
            { name: 'Heading/20', size: '1.25rem', px: '20px', weight: '700', cssVar: '--sl-heading-20', sample: 'Section Title' },
            { name: 'Text/17', size: '1.0625rem', px: '17px', weight: '600', cssVar: '--sl-text-17', sample: 'Card Header' },
            { name: 'Text/15', size: '0.9375rem', px: '15px', weight: '500', cssVar: '--sl-text-15', sample: 'Body Large Text' },
            { name: 'Text/14', size: '0.875rem', px: '14px', weight: '400', cssVar: '--sl-text-14', sample: 'Default body text for general use' },
            { name: 'Text/13', size: '0.8125rem', px: '13px', weight: '500', cssVar: '--sl-text-13', sample: 'Metric labels and descriptions' },
            { name: 'Text/12', size: '0.75rem', px: '12px', weight: '500', cssVar: '--sl-text-12', sample: 'Chip and badge labels' },
            { name: 'Text/11', size: '0.6875rem', px: '11px', weight: '600', cssVar: '--sl-text-11', sample: 'MICRO CAPTION / OVERLINE' },
          ].map(t => (
            <div key={t.name} className="flex items-center gap-4 py-2 border-b border-slate-50">
              <div className="w-28 flex-shrink-0">
                <div className="text-[12px] font-semibold text-indigo-600">{t.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">{t.px}</div>
              </div>
              <div className="flex-1" style={{ fontSize: t.size, fontWeight: Number(t.weight), lineHeight: 1.4 }}>
                {t.sample}
              </div>
              <div className="flex items-center gap-1">
                <code className="text-[10px] text-slate-400 font-mono">{t.cssVar}</code>
                <CopyButton text={t.cssVar} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4) Spacing Scale */}
      <div className="card-premium p-5">
        <h3 className="text-[17px] font-bold text-slate-900 mb-5">4. Spacing Scale</h3>
        <p className="text-[12px] text-slate-500 mb-4">Consistent 4px base grid. Only 7 values allowed.</p>

        <div className="space-y-3">
          {[
            { name: 'space-1', value: '4px', tw: 'p-1 / gap-1' },
            { name: 'space-2', value: '8px', tw: 'p-2 / gap-2' },
            { name: 'space-3', value: '12px', tw: 'p-3 / gap-3' },
            { name: 'space-4', value: '16px', tw: 'p-4 / gap-4' },
            { name: 'space-5', value: '20px', tw: 'p-5 / gap-5' },
            { name: 'space-6', value: '24px', tw: 'p-6 / gap-6' },
            { name: 'space-8', value: '32px', tw: 'p-8 / gap-8' },
          ].map(s => (
            <div key={s.name} className="flex items-center gap-3">
              <div className="w-20 flex-shrink-0">
                <code className="text-[11px] text-slate-500 font-mono">--sl-{s.name}</code>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <div className="h-4 bg-indigo-200 rounded-sm" style={{ width: s.value }} />
                <span className="text-[12px] text-slate-600 font-semibold">{s.value}</span>
              </div>
              <code className="text-[10px] text-indigo-500 font-mono">{s.tw}</code>
            </div>
          ))}
        </div>
      </div>

      {/* 5) Shadow Tokens */}
      <div className="card-premium p-5">
        <h3 className="text-[17px] font-bold text-slate-900 mb-5">5. Shadow Tokens</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { name: 'Card', cssVar: '--sl-shadow-card', style: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)' },
            { name: 'Card Hover', cssVar: '--sl-shadow-card-hover', style: '0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)' },
            { name: 'Dropdown', cssVar: '--sl-shadow-dropdown', style: '0 4px 16px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)' },
            { name: 'Modal', cssVar: '--sl-shadow-modal', style: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)' },
          ].map(sh => (
            <div key={sh.name} className="text-center">
              <div
                className="w-full h-16 bg-white rounded-2xl mb-2 border border-slate-100"
                style={{ boxShadow: sh.style }}
              />
              <div className="text-[12px] font-semibold text-slate-700">{sh.name}</div>
              <code className="text-[10px] text-slate-400 font-mono">{sh.cssVar}</code>
            </div>
          ))}
        </div>
      </div>

      {/* 6) Z-Index Scale */}
      <div className="card-premium p-5">
        <h3 className="text-[17px] font-bold text-slate-900 mb-5">6. Z-Index Scale</h3>
        <div className="space-y-2">
          {[
            { name: 'Sticky', value: 40, cssVar: '--sl-z-sticky', usage: 'Bottom nav, sticky headers' },
            { name: 'Dropdown', value: 50, cssVar: '--sl-z-dropdown', usage: 'Popovers, dropdown menus' },
            { name: 'Modal Overlay', value: 60, cssVar: '--sl-z-modal-overlay', usage: 'bg-black/50 backdrop' },
            { name: 'Modal', value: 70, cssVar: '--sl-z-modal', usage: 'Modal content panels' },
            { name: 'Toast', value: 80, cssVar: '--sl-z-toast', usage: 'Sonner notifications' },
          ].map(z => (
            <div key={z.name} className="flex items-center gap-3 py-1.5 border-b border-slate-50">
              <div className="w-12 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-[12px] font-bold text-indigo-700">
                {z.value}
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-slate-800">{z.name}</div>
                <div className="text-[11px] text-slate-400">{z.usage}</div>
              </div>
              <code className="text-[10px] text-slate-400 font-mono">{z.cssVar}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
