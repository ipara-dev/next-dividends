import React from 'react';
import { FilterState, TimeframeDays } from '../types';
import { 
  Search, 
  Sparkles, 
  RotateCcw,
  Calendar
} from 'lucide-react';

interface TimeframeSelectorProps {
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  totalResultsCount: number;
  totalTrackedCount: number;
}

const TIMEFRAME_TABS: { days: TimeframeDays; label: string }[] = [
  { days: 1, label: 'Tomorrow (1D)' },
  { days: 7, label: '7 Days' },
  { days: 15, label: '15 Days' },
  { days: 30, label: '30 Days' },
  { days: 60, label: '60 Days' },
  { days: 90, label: 'All (90 Days)' }
];

const SECTORS = [
  'All Sectors',
  'Technology',
  'Healthcare',
  'Financials',
  'Consumer Staples',
  'Energy',
  'Industrials',
  'Utilities',
  'Real Estate',
  'Consumer Discretionary'
];

export const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  filters,
  onFilterChange,
  totalResultsCount,
  totalTrackedCount
}) => {
  const isFiltered = filters.search !== '' || 
    filters.sector !== 'all' || 
    filters.minYield > 0 || 
    filters.onlyTomorrow ||
    filters.onlyNewAnnouncements ||
    filters.timeframe !== 90;

  const handleReset = () => {
    onFilterChange({
      timeframe: 90,
      customDays: 90,
      sector: 'all',
      search: '',
      minYield: 0,
      sortBy: 'exDate',
      sortOrder: 'asc',
      onlyTomorrow: false,
      onlyNewAnnouncements: false
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      
      {/* Top Tab Bar: Dividend.com Style Timeframe Horizon */}
      <div className="border-b border-slate-200 bg-slate-50/80 px-4 pt-2.5 pb-2.5 flex flex-wrap items-center justify-between gap-3">
        
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-600 mr-2 flex items-center gap-1.5 shrink-0">
            <Calendar className="h-3.5 w-3.5 text-blue-600" />
            <span>Ex-Date Window:</span>
          </span>

          {TIMEFRAME_TABS.map((tab) => {
            const isActive = filters.timeframe === tab.days;
            return (
              <button
                key={tab.days}
                id={`tab-timeframe-${tab.days}`}
                onClick={() => onFilterChange({ timeframe: tab.days, customDays: Number(tab.days), onlyTomorrow: tab.days === 1 })}
                className={`relative px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}

          {/* Custom Horizon Input (1 to 90 days) */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <button
              onClick={() => onFilterChange({ timeframe: 'custom' })}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                filters.timeframe === 'custom'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Custom:
            </button>
            <input
              type="number"
              min="1"
              max="90"
              value={filters.customDays}
              onChange={(e) => {
                const val = Math.max(1, Math.min(90, parseInt(e.target.value) || 1));
                onFilterChange({ timeframe: 'custom', customDays: val, onlyTomorrow: false });
              }}
              className="w-14 bg-white border border-slate-200 rounded-md px-1.5 py-1 text-xs text-center font-mono text-slate-800 focus:outline-none focus:border-blue-500"
            />
            <span className="text-xs text-slate-500">days</span>
          </div>
        </div>

        {/* Counter Summary */}
        <div className="text-xs text-slate-500">
          Showing <span className="font-mono font-bold text-slate-900">{totalResultsCount}</span> of <span className="font-mono text-slate-700">{totalTrackedCount}</span> stocks
        </div>
      </div>

      {/* Filter Row: Search & Dropdowns */}
      <div className="p-3 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Search Input */}
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            id="input-search-filter"
            type="text"
            placeholder="Search symbol (e.g. MCD, JNJ, AAPL) or company..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 text-xs"
          />
        </div>

        {/* Filter Controls: Sector, Yield, Sort */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Sector Select */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="select-sector-filter" className="text-slate-500 font-medium">Sector:</label>
            <select
              id="select-sector-filter"
              value={filters.sector}
              onChange={(e) => onFilterChange({ sector: e.target.value })}
              className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 text-xs"
            >
              {SECTORS.map((s) => (
                <option key={s} value={s === 'All Sectors' ? 'all' : s.toLowerCase()}>{s}</option>
              ))}
            </select>
          </div>

          {/* Min Yield Select */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="select-yield-filter" className="text-slate-500 font-medium">Yield:</label>
            <select
              id="select-yield-filter"
              value={filters.minYield}
              onChange={(e) => onFilterChange({ minYield: parseFloat(e.target.value) })}
              className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 text-xs"
            >
              <option value="0">All Yields</option>
              <option value="2">&gt; 2.0%</option>
              <option value="3">&gt; 3.0%</option>
              <option value="4">&gt; 4.0%</option>
              <option value="5">&gt; 5.0%</option>
            </select>
          </div>

          {/* Quick Checkbox: New Announcements */}
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
            <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer hover:text-slate-900 select-none">
              <input
                type="checkbox"
                checked={filters.onlyNewAnnouncements}
                onChange={(e) => onFilterChange({ onlyNewAnnouncements: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer h-3.5 w-3.5"
              />
              <span className="flex items-center gap-1 text-slate-700 font-medium">
                <Sparkles className="h-3 w-3 text-blue-600" />
                New Announcements
              </span>
            </label>
          </div>

          {/* Reset Filters button */}
          {isFiltered && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}

        </div>

      </div>

    </div>
  );
};
