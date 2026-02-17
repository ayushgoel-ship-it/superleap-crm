/**
 * DealerMapView — Canvas-based proximity map with colored dealer markers.
 *
 * Since real map tiles (Google Maps/Leaflet) may not be available in the preview
 * environment, this uses a canvas-based relative-position view:
 *   - User at center
 *   - Dealers plotted by relative bearing/distance
 *   - Color-coded markers (green/red/amber/blue)
 *   - Tap a marker to see bottom sheet with dealer details
 */

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { X, MapPin, ChevronRight, Navigation, AlertTriangle, Locate } from 'lucide-react';
import type { DealerWithDistance, UserLocation } from './visitHelpers';
import { formatDistance, dealerInitials } from './visitHelpers';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface DealerMapViewProps {
  dealers: DealerWithDistance[];
  userLocation: UserLocation | null;
  onStartVisit: (dealerId: string, dealerName: string) => void;
  onFillFeedback: (visitId: string) => void;
}

interface MarkerHit {
  dealer: DealerWithDistance;
  x: number;
  y: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const MARKER_COLORS: Record<string, { fill: string; border: string; bg: string }> = {
  green: { fill: '#10b981', border: '#059669', bg: 'bg-emerald-500' },
  red: { fill: '#ef4444', border: '#dc2626', bg: 'bg-rose-500' },
  amber: { fill: '#f59e0b', border: '#d97706', bg: 'bg-amber-500' },
  blue: { fill: '#3b82f6', border: '#2563eb', bg: 'bg-blue-500' },
};

const MARKER_RADIUS = 14;
const MAX_VIEW_KM = 15; // maximum radius shown on map

// ═══════════════════════════════════════════════════════════════════════════
// CANVAS RENDERER
// ═══════════════════════════════════════════════════════════════════════════

function drawMap(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dealers: DealerWithDistance[],
  userLoc: UserLocation | null,
  dpr: number,
): MarkerHit[] {
  const cx = width / 2;
  const cy = height / 2;
  const mapRadius = Math.min(cx, cy) - 30;

  // Clear
  ctx.clearRect(0, 0, width * dpr, height * dpr);
  ctx.save();
  ctx.scale(dpr, dpr);

  // Background
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, mapRadius + 20);
  gradient.addColorStop(0, '#f0f4ff');
  gradient.addColorStop(0.5, '#e8ecf4');
  gradient.addColorStop(1, '#dde3ef');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Distance rings
  const rings = [2, 5, 10, 15];
  rings.forEach((km) => {
    const r = (km / MAX_VIEW_KM) * mapRadius;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Label
    ctx.fillStyle = 'rgba(100, 116, 139, 0.6)';
    ctx.font = '10px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${km} km`, cx + r - 4, cy - 4);
  });

  // User dot at center
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#4f46e5';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(79, 70, 229, 0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Pulse
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(79, 70, 229, 0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // User label
  ctx.fillStyle = '#4f46e5';
  ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('You', cx, cy + 24);

  // Dealer markers
  const hits: MarkerHit[] = [];

  if (userLoc) {
    dealers.forEach((dealer) => {
      if (dealer.distanceKm == null || !dealer.latitude || !dealer.longitude) return;

      const clampedKm = Math.min(dealer.distanceKm, MAX_VIEW_KM);
      const distRatio = clampedKm / MAX_VIEW_KM;

      // Calculate angle from user to dealer
      const dLng = dealer.longitude - userLoc.lng;
      const dLat = dealer.latitude - userLoc.lat;
      const angle = Math.atan2(dLng, dLat); // North = 0, East = PI/2

      const mx = cx + distRatio * mapRadius * Math.sin(angle);
      const my = cy - distRatio * mapRadius * Math.cos(angle);

      const color = MARKER_COLORS[dealer.markerColor] || MARKER_COLORS.blue;

      // Shadow
      ctx.beginPath();
      ctx.arc(mx, my + 2, MARKER_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fill();

      // Marker circle
      ctx.beginPath();
      ctx.arc(mx, my, MARKER_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = color.fill;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Initials
      const initials = dealerInitials(dealer.name);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initials, mx, my);

      hits.push({ dealer, x: mx, y: my });
    });
  }

  ctx.restore();
  return hits;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function DealerMapView({ dealers, userLocation, onStartVisit, onFillFeedback }: DealerMapViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedDealer, setSelectedDealer] = useState<DealerWithDistance | null>(null);
  const [hitAreas, setHitAreas] = useState<MarkerHit[]>([]);
  const [canvasSize, setCanvasSize] = useState({ w: 360, h: 380 });

  const nearbyCount = useMemo(
    () => dealers.filter((d) => d.distanceKm != null && d.distanceKm <= 2).length,
    [dealers],
  );

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setCanvasSize({ w: width, h: Math.min(380, Math.max(280, width * 0.85)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.w * dpr;
    canvas.height = canvasSize.h * dpr;
    canvas.style.width = `${canvasSize.w}px`;
    canvas.style.height = `${canvasSize.h}px`;
    const hits = drawMap(ctx, canvasSize.w, canvasSize.h, dealers, userLocation, dpr);
    setHitAreas(hits);
  }, [canvasSize, dealers, userLocation]);

  // Handle canvas tap
  const handleCanvasTap = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const tapX = e.clientX - rect.left;
      const tapY = e.clientY - rect.top;

      const hit = hitAreas.find(
        (h) => Math.hypot(h.x - tapX, h.y - tapY) <= MARKER_RADIUS + 6,
      );
      setSelectedDealer(hit?.dealer || null);
    },
    [hitAreas],
  );

  return (
    <div ref={containerRef} className="space-y-2">
      {/* Top overlay */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
            <Locate className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <span className="text-[12px] font-semibold text-slate-700">
            {nearbyCount} dealer{nearbyCount !== 1 ? 's' : ''} within 2km
          </span>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-2">
          {[
            { color: 'bg-emerald-500', label: 'Recent' },
            { color: 'bg-rose-500', label: '30d+' },
            { color: 'bg-amber-500', label: 'Pending' },
            { color: 'bg-blue-500', label: 'Nearby' },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-1 text-[9px] text-slate-500">
              <span className={`w-2 h-2 rounded-full ${l.color}`} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasTap}
          className="cursor-pointer block"
        />
      </div>

      {/* Bottom sheet for selected dealer */}
      {selectedDealer && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-4 space-y-3
                        animate-fade-in">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h4 className="text-[14px] font-semibold text-slate-900 truncate">
                {selectedDealer.name}
              </h4>
              <span className="text-[11px] text-slate-400">{selectedDealer.code}</span>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  {formatDistance(selectedDealer.distanceKm)}
                </span>
                <span>
                  {selectedDealer.lastVisitDaysAgo === 0
                    ? 'Visited today'
                    : selectedDealer.lastVisitDaysAgo < 999
                      ? `Last visit: ${selectedDealer.lastVisitDaysAgo}d ago`
                      : 'Never visited'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedDealer(null)}
              className="p-1 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Feedback pending flag */}
          {selectedDealer.feedbackPending && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span className="text-[11px] font-medium text-amber-700">Feedback pending</span>
            </div>
          )}

          {/* CTA */}
          <div className="flex gap-2">
            {selectedDealer.feedbackPending && selectedDealer.lastVisitObj ? (
              <button
                onClick={() => {
                  onFillFeedback(selectedDealer.lastVisitObj!.id);
                  setSelectedDealer(null);
                }}
                className="flex-1 py-2.5 bg-amber-500 text-white text-[12px] font-semibold rounded-xl
                           hover:bg-amber-600 active:scale-[0.98] transition-all"
              >
                Fill Feedback
              </button>
            ) : null}
            <button
              onClick={() => {
                onStartVisit(selectedDealer.id, selectedDealer.name);
                setSelectedDealer(null);
              }}
              className="flex-1 py-2.5 bg-indigo-600 text-white text-[12px] font-semibold rounded-xl
                         hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              Start Visit
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
