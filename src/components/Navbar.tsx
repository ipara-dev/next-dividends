import React from 'react';
import { 
  Bell, 
  Terminal, 
  Calculator, 
  RefreshCw,
  Calendar
} from 'lucide-react';

interface NavbarProps {
  urgentCount?: number;
  totalCount: number;
  averageYield: number;
  dataSource: string;
  isSyncing: boolean;
  onSyncLive: () => void;
  onOpenAlerts: () => void;
  onOpenCron: () => void;
  onOpenCalculator: (stock?: any) => void;
  onOpenEmailPreview?: (type: 'THREE_DAY_REMINDER' | 'NEW_ANNOUNCEMENT') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  totalCount,
  averageYield,
  dataSource,
  isSyncing,
  onSyncLive,
  onOpenAlerts,
  onOpenCron,
  onOpenCalculator,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 gap-4">
          
          {/* Brand Name */}
          <div className="flex items-center gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight">
                  Next Dividends
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  Large Cap (Up to 90 Days)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                Ex-Dividend Calendar &bull; Daily Announcements &bull; Automated Notifications
              </p>
            </div>
          </div>

          {/* Key Metric Info */}
          <div className="hidden lg:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span>Dividends Tracked:</span>
              <span className="font-semibold text-slate-900">{totalCount}</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600">
              <span>Avg Yield:</span>
              <span className="font-semibold text-emerald-700">{averageYield.toFixed(2)}%</span>
            </div>

            {/* Live Data Sync Button & Status */}
            <button
              onClick={onSyncLive}
              disabled={isSyncing}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors border ${
                dataSource === 'REAL_LIVE_API'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title="Click to fetch live prices and announcements from Yahoo Finance and Nasdaq"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span>{isSyncing ? 'Syncing...' : dataSource === 'REAL_LIVE_API' ? 'Live API Connected' : 'Sync Live API'}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="btn-open-calculator"
              onClick={() => onOpenCalculator()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium transition-colors shadow-xs"
              title="Dividend Income Calculator"
            >
              <Calculator className="h-3.5 w-3.5 text-slate-600" />
              <span className="hidden sm:inline">Calculator</span>
            </button>

            <button
              id="btn-open-cron"
              onClick={onOpenCron}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium transition-colors shadow-xs"
              title="GitHub Actions CRON & Scripts"
            >
              <Terminal className="h-3.5 w-3.5 text-slate-600" />
              <span className="hidden sm:inline">CRON &amp; GitHub</span>
            </button>

            <button
              id="btn-open-alerts"
              onClick={onOpenAlerts}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Alerts Setup</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
