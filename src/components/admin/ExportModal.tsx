import { useState } from 'react';
import { X, Download, FileText, CheckCircle2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport?: (exportConfig: ExportConfig) => void;
  exportType?: 'TL_SUMMARY' | 'TL_DETAILED' | 'CALLS_VISITS';
}

export interface ExportConfig {
  type: 'TL_SUMMARY' | 'TL_DETAILED' | 'CALLS_VISITS';
  columns: string[];
  filters: {
    timePeriod?: string;
    region?: string;
    tlId?: string;
  };
}

const TL_SUMMARY_COLUMNS = [
  { id: 'name', label: 'TL Name', default: true },
  { id: 'region', label: 'Region', default: true },
  { id: 'kamCount', label: 'KAM Count', default: true },
  { id: 'stockins', label: 'Stock-ins (Actual/Target)', default: true },
  { id: 'stockinsAchievement', label: 'Stock-ins Achievement %', default: true },
  { id: 'dcfCount', label: 'DCF Count', default: true },
  { id: 'dcfValue', label: 'DCF Value (₹)', default: true },
  { id: 'inputScore', label: 'Avg Input Score', default: true },
  { id: 'i2si', label: 'I2SI %', default: true },
  { id: 'productiveVisits', label: 'Productive Visits %', default: true },
  { id: 'productiveCalls', label: 'Productive Calls %', default: true },
];

const TL_DETAILED_COLUMNS = [
  { id: 'tlName', label: 'TL Name', default: true },
  { id: 'kamName', label: 'KAM Name', default: true },
  { id: 'region', label: 'Region', default: true },
  { id: 'stockins', label: 'Stock-ins', default: true },
  { id: 'dcf', label: 'DCF Disbursals', default: true },
  { id: 'inputScore', label: 'Input Score', default: true },
  { id: 'i2si', label: 'I2SI %', default: true },
  { id: 'productiveVisits', label: 'Productive Visits %', default: true },
  { id: 'productiveCalls', label: 'Productive Calls %', default: true },
  { id: 'totalVisits', label: 'Total Visits', default: false },
  { id: 'totalCalls', label: 'Total Calls', default: false },
];

const CALLS_VISITS_COLUMNS = [
  { id: 'name', label: 'Name', default: true },
  { id: 'role', label: 'Role (TL/KAM)', default: true },
  { id: 'region', label: 'Region', default: true },
  { id: 'totalVisits', label: 'Total Visits', default: true },
  { id: 'productiveVisits', label: 'Productive Visits', default: true },
  { id: 'productiveVisitsPercent', label: 'Productive Visits %', default: true },
  { id: 'totalCalls', label: 'Total Calls', default: true },
  { id: 'productiveCalls', label: 'Productive Calls', default: true },
  { id: 'productiveCallsPercent', label: 'Productive Calls %', default: true },
];

export function ExportModal({ isOpen, onClose, onExport, exportType = 'TL_SUMMARY' }: ExportModalProps) {
  const [selectedType, setSelectedType] = useState(exportType);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    getDefaultColumns(exportType)
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  function getDefaultColumns(type: string) {
    const columnSets = {
      TL_SUMMARY: TL_SUMMARY_COLUMNS,
      TL_DETAILED: TL_DETAILED_COLUMNS,
      CALLS_VISITS: CALLS_VISITS_COLUMNS,
    };
    const columns = columnSets[type as keyof typeof columnSets] || TL_SUMMARY_COLUMNS;
    return columns.filter((col) => col.default).map((col) => col.id);
  }

  if (!isOpen) return null;

  const getCurrentColumns = () => {
    switch (selectedType) {
      case 'TL_DETAILED':
        return TL_DETAILED_COLUMNS;
      case 'CALLS_VISITS':
        return CALLS_VISITS_COLUMNS;
      default:
        return TL_SUMMARY_COLUMNS;
    }
  };

  const handleToggleColumn = (columnId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleExport = () => {
    setIsExporting(true);
    
    // Simulate export process
    setTimeout(() => {
      const exportConfig: ExportConfig = {
        type: selectedType,
        columns: selectedColumns,
        filters: {
          timePeriod: 'MTD',
          region: 'All',
        },
      };

      onExport?.(exportConfig);
      setIsExporting(false);
      setExportComplete(true);

      // Auto-close after showing success
      setTimeout(() => {
        setExportComplete(false);
        onClose();
      }, 2000);
    }, 1500);
  };

  if (exportComplete) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-8 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <h3 className="text-lg text-gray-900 mb-2">Export Complete!</h3>
          <p className="text-sm text-gray-600">
            Your CSV file has been downloaded successfully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg text-gray-900">Export Data</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Export Type */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Export Type</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="exportType"
                  value="TL_SUMMARY"
                  checked={selectedType === 'TL_SUMMARY'}
                  onChange={(e) => {
                    setSelectedType(e.target.value as any);
                    setSelectedColumns(getDefaultColumns(e.target.value));
                  }}
                />
                <div className="flex-1">
                  <div className="text-sm text-gray-900">TL Summary</div>
                  <div className="text-xs text-gray-600">
                    High-level metrics for each Team Lead
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="exportType"
                  value="TL_DETAILED"
                  checked={selectedType === 'TL_DETAILED'}
                  onChange={(e) => {
                    setSelectedType(e.target.value as any);
                    setSelectedColumns(getDefaultColumns(e.target.value));
                  }}
                />
                <div className="flex-1">
                  <div className="text-sm text-gray-900">TL Detailed (KAM-wise)</div>
                  <div className="text-xs text-gray-600">
                    Detailed breakdown with individual KAM metrics
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="exportType"
                  value="CALLS_VISITS"
                  checked={selectedType === 'CALLS_VISITS'}
                  onChange={(e) => {
                    setSelectedType(e.target.value as any);
                    setSelectedColumns(getDefaultColumns(e.target.value));
                  }}
                />
                <div className="flex-1">
                  <div className="text-sm text-gray-900">Calls & Visits Summary</div>
                  <div className="text-xs text-gray-600">
                    Activity metrics by Region/TL/KAM
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Column Selection */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Select Columns ({selectedColumns.length} selected)
            </label>
            <div className="border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
              <div className="space-y-2">
                {getCurrentColumns().map((column) => (
                  <label
                    key={column.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(column.id)}
                      onChange={() => handleToggleColumn(column.id)}
                    />
                    <span className="text-sm text-gray-900">{column.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Export Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm text-gray-900 mb-2">Export Preview</h3>
            <div className="space-y-1 text-xs text-gray-600">
              <div>Format: CSV (Comma-separated values)</div>
              <div>Columns: {selectedColumns.length}</div>
              <div>Current Filters: MTD, All Regions</div>
              <div className="text-gray-500 italic mt-2">
                Tip: Open the exported file in Excel or Google Sheets for analysis
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            disabled={isExporting || selectedColumns.length === 0}
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download CSV
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
