import { Users, Package } from 'lucide-react';

interface LeadSourceCardProps {
  sellerCount: number;
  sellerPercentage: number;
  inventoryCount: number;
  inventoryPercentage: number;
  totalLeads: number;
  onFilterBySeller?: () => void;
  onFilterByInventory?: () => void;
  viewMode?: 'desktop' | 'mobile';
}

export function LeadSourceCard({
  sellerCount,
  sellerPercentage,
  inventoryCount,
  inventoryPercentage,
  totalLeads,
  onFilterBySeller,
  onFilterByInventory,
  viewMode = 'desktop',
}: LeadSourceCardProps) {
  if (viewMode === 'mobile') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-xs uppercase tracking-wide text-gray-600 mb-3">Lead Source</div>
        
        <div className="space-y-3">
          {/* Seller */}
          <button
            onClick={onFilterBySeller}
            className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg text-left hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-900">Seller</span>
              </div>
              <span className="text-lg text-blue-700">{sellerPercentage}%</span>
            </div>
            <div className="text-xs text-blue-600">{sellerCount} leads</div>
          </button>

          {/* Inventory */}
          <button
            onClick={onFilterByInventory}
            className="w-full p-3 bg-purple-50 border border-purple-200 rounded-lg text-left hover:bg-purple-100 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-purple-900">Inventory</span>
              </div>
              <span className="text-lg text-purple-700">{inventoryPercentage}%</span>
            </div>
            <div className="text-xs text-purple-600">{inventoryCount} leads</div>
          </button>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600 text-center">
          Total: {totalLeads} leads
        </div>
      </div>
    );
  }

  // Desktop view
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-xs uppercase tracking-wide text-gray-600 mb-3">Lead Source</div>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Seller */}
        <button
          onClick={onFilterBySeller}
          className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-left hover:bg-blue-100 transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-blue-900">Seller</span>
          </div>
          <div className="text-2xl text-blue-700 mb-1">{sellerPercentage}%</div>
          <div className="text-xs text-blue-600">{sellerCount} leads</div>
        </button>

        {/* Inventory */}
        <button
          onClick={onFilterByInventory}
          className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-left hover:bg-purple-100 transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-purple-900">Inventory</span>
          </div>
          <div className="text-2xl text-purple-700 mb-1">{inventoryPercentage}%</div>
          <div className="text-xs text-purple-600">{inventoryCount} leads</div>
        </button>
      </div>

      <div className="pt-3 border-t border-gray-200 text-xs text-gray-600 text-center">
        Total: {totalLeads} leads in selected period
      </div>
    </div>
  );
}
