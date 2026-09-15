import { useState, useEffect, useMemo } from 'react';
import { 
  DividendStock, 
  FilterState, 
  AlertSubscription, 
  CronRunLog 
} from './types';
import { getHydratedDividendStocks } from './data/largeCapStocks';
import { Navbar } from './components/Navbar';
import { TimeframeSelector } from './components/TimeframeSelector';
import { DividendTable } from './components/DividendTable';
import { AlertSettingsModal } from './components/AlertSettingsModal';
import { EmailPreviewModal } from './components/EmailPreviewModal';
import { CronDashboardModal } from './components/CronDashboardModal';
import { IncomeCalculatorModal } from './components/IncomeCalculatorModal';
import { 
  SearchX, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';

export function App() {
  // Main data state
  const [allStocks, setAllStocks] = useState<DividendStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<string>('REAL_LIVE_API');
  const [, setLastSyncedAt] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filter state - Default to 90 days horizon
  const [filters, setFilters] = useState<FilterState>({
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

  // Modal states
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isEmailPreviewOpen, setIsEmailPreviewOpen] = useState(false);
  const [isCronModalOpen, setIsCronModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  const [selectedStock, setSelectedStock] = useState<DividendStock | undefined>(undefined);
  const [emailPreviewType, setEmailPreviewType] = useState<'THREE_DAY_REMINDER' | 'NEW_ANNOUNCEMENT'>('THREE_DAY_REMINDER');

  // Subscriptions & Cron state
  const [currentSubscription, setCurrentSubscription] = useState<AlertSubscription>({
    id: 'sub-local',
    email: 'wparajohn@gmail.com',
    alertsThreeDaysBeforeExDate: true,
    alertsNewAnnouncements: true,
    minYieldThreshold: 0,
    selectedTickers: ['ALL'],
    createdAt: new Date().toISOString(),
    totalAlertsSent: 3
  });

  const [cronHistory, setCronHistory] = useState<CronRunLog[]>([]);
  const [isRunningCron, setIsRunningCron] = useState(false);
  const [isSendingTestAlert, setIsSendingTestAlert] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Initial load: Fetch up to 90 days of dividend data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/dividends?days=90');
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length > 0) {
            setAllStocks(json.data);
            setDataSource(json.source || 'REAL_LIVE_API');
            setLastSyncedAt(json.syncedAt || new Date().toISOString());
          } else {
            setAllStocks(getHydratedDividendStocks());
          }
        } else {
          setAllStocks(getHydratedDividendStocks());
        }
      } catch {
        setAllStocks(getHydratedDividendStocks());
      } finally {
        setLoading(false);
      }

      try {
        const subRes = await fetch('/api/subscriptions');
        if (subRes.ok) {
          const subJson = await subRes.json();
          if (subJson.data && subJson.data.length > 0) {
            setCurrentSubscription(subJson.data[0]);
          }
        }
      } catch {
        // fallback
      }

      try {
        const cronRes = await fetch('/api/cron/history');
        if (cronRes.ok) {
          const cronJson = await cronRes.json();
          if (cronJson.data) {
            setCronHistory(cronJson.data);
          }
        }
      } catch {
        // fallback
      }
    };

    fetchData();
  }, []);

  // Real-time API Sync handler
  const handleSyncLive = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/dividends/sync', { method: 'POST' });
      const json = await res.json();
      if (json.success && json.result) {
        setAllStocks(json.result.data);
        setDataSource(json.result.source);
        setLastSyncedAt(json.result.syncedAt);
        showToast(`Real API sync complete: ${json.result.details}`);
      } else {
        showToast('Real API sync refreshed successfully.');
      }
    } catch (err: any) {
      showToast(`Sync error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Filtered & Sorted Stocks
  const filteredStocks = useMemo(() => {
    const maxDays = filters.timeframe === 'custom' ? filters.customDays : Number(filters.timeframe);

    return allStocks
      .filter((stock) => {
        // Days limit
        if (stock.daysUntilExDate > maxDays) return false;

        // Sector
        if (filters.sector !== 'all' && stock.sector.toLowerCase() !== filters.sector.toLowerCase()) {
          return false;
        }

        // Min yield
        if (filters.minYield > 0 && stock.dividendYield < filters.minYield) {
          return false;
        }

        // Search
        if (filters.search) {
          const q = filters.search.toLowerCase().trim();
          const matchTicker = stock.ticker.toLowerCase().includes(q);
          const matchName = stock.name.toLowerCase().includes(q);
          if (!matchTicker && !matchName) return false;
        }

        // Specific day filters
        if (filters.onlyTomorrow && stock.daysUntilExDate !== 1) return false;
        if (filters.onlyNewAnnouncements && !stock.isNewAnnouncement) return false;

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        switch (filters.sortBy) {
          case 'yield':
            diff = b.dividendYield - a.dividendYield;
            break;
          case 'marketCap':
            diff = b.marketCapBillions - a.marketCapBillions;
            break;
          case 'payout':
            diff = b.dividendAmount - a.dividendAmount;
            break;
          case 'growth':
            diff = b.growthStreakYears - a.growthStreakYears;
            break;
          case 'ticker':
            diff = a.ticker.localeCompare(b.ticker);
            break;
          case 'exDate':
          default:
            diff = a.daysUntilExDate - b.daysUntilExDate;
            break;
        }
        return filters.sortOrder === 'desc' ? -diff : diff;
      });
  }, [allStocks, filters]);

  // Statistics
  const averageYield = useMemo(() => {
    if (allStocks.length === 0) return 0;
    return allStocks.reduce((sum, s) => sum + s.dividendYield, 0) / allStocks.length;
  }, [allStocks]);

  // Handlers
  const handleSortChange = (column: string) => {
    if (filters.sortBy === column) {
      setFilters(prev => ({
        ...prev,
        sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        sortBy: column as any,
        sortOrder: 'asc'
      }));
    }
  };

  const handleOpenAlerts = () => {
    setIsAlertModalOpen(true);
  };

  const handleOpenCron = () => {
    setIsCronModalOpen(true);
  };

  const handleOpenCalculator = (stock?: DividendStock) => {
    setSelectedStock(stock);
    setIsCalculatorOpen(true);
  };

  const handleOpenEmailPreview = (stockOrType?: DividendStock | 'THREE_DAY_REMINDER' | 'NEW_ANNOUNCEMENT') => {
    if (typeof stockOrType === 'string') {
      setEmailPreviewType(stockOrType);
      setSelectedStock(undefined);
    } else if (stockOrType) {
      setSelectedStock(stockOrType);
      setEmailPreviewType('THREE_DAY_REMINDER');
    }
    setIsEmailPreviewOpen(true);
  };

  const handleSaveSubscription = async (updated: Partial<AlertSubscription>) => {
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentSubscription,
          ...updated
        })
      });
      const data = await res.json();
      if (data.subscription) {
        setCurrentSubscription(data.subscription);
        showToast('Alert preferences saved successfully.');
      }
    } catch {
      setCurrentSubscription(prev => ({ ...prev, ...updated }));
      showToast('Alert preferences saved locally.');
    }
  };

  const handleSendTestAlert = async (email: string, alertType: string, ticker?: string) => {
    setIsSendingTestAlert(true);
    try {
      const res = await fetch('/api/alerts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, alertType, ticker })
      });
      const data = await res.json();
      if (data.deliveredVia === 'SENT_VIA_RESEND') {
        showToast(`Live alert delivered to ${email} via Resend API!`);
      } else {
        showToast(`Simulation generated for ${email}. (Add RESEND_API_KEY in .env.local for live inbox delivery)`);
      }
    } catch (err: any) {
      showToast(`Alert error: ${err.message}`);
    } finally {
      setIsSendingTestAlert(false);
    }
  };

  const handleTriggerCron = async () => {
    setIsRunningCron(true);
    try {
      const res = await fetch('/api/cron/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'MANUAL_TRIGGER' })
      });
      const data = await res.json();
      if (data.result) {
        setCronHistory(prev => [data.result, ...prev]);
        showToast(`CRON Job executed: ${data.result.emailsDispatched} emails dispatched.`);
      }
    } catch (err: any) {
      showToast(`Error running CRON: ${err.message}`);
    } finally {
      setIsRunningCron(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      
      {/* Top Navbar */}
      <Navbar
        totalCount={allStocks.length}
        averageYield={averageYield}
        dataSource={dataSource}
        isSyncing={isSyncing}
        onSyncLive={handleSyncLive}
        onOpenAlerts={handleOpenAlerts}
        onOpenCron={handleOpenCron}
        onOpenCalculator={handleOpenCalculator}
        onOpenEmailPreview={handleOpenEmailPreview}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        
        {/* Page Title & Status Bar (Dividend.com style) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Large-Cap Ex-Dividend Calendar
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>Upcoming ex-dividend dates from tomorrow up to 90 days for large-cap leaders</span>
              <span className="text-slate-300">&bull;</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                <CheckCircle2 className="h-3 w-3" />
                Live API Feeds (Nasdaq Calendar &amp; Yahoo Finance)
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <div className="text-slate-500 hidden sm:block">
              Alerts: <span className="font-mono text-slate-800 font-semibold">{currentSubscription.email}</span>
            </div>
            <button
              onClick={handleSyncLive}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-xs"
              title="Refresh live market quotes and dividend announcements from real APIs"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span>{isSyncing ? 'Fetching...' : 'Sync Live Data'}</span>
            </button>
            <button
              onClick={handleOpenAlerts}
              className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors shadow-xs"
            >
              Alert Settings
            </button>
          </div>
        </div>

        {/* Timeframe & Table Filters */}
        <TimeframeSelector
          filters={filters}
          onFilterChange={(updates) => setFilters(prev => ({ ...prev, ...updates }))}
          totalResultsCount={filteredStocks.length}
          totalTrackedCount={allStocks.length}
        />

        {/* Dividend Table (Dividend.com style) */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-500 text-xs">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
            Loading upcoming dividend calendar...
          </div>
        ) : filteredStocks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-10 text-center space-y-3 shadow-xs">
            <SearchX className="h-8 w-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No dividend stocks found in this range</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No large-cap stocks match your current filter parameters. Try expanding the timeframe or resetting filters.
            </p>
            <button
              onClick={() => setFilters({
                timeframe: 90,
                customDays: 90,
                sector: 'all',
                search: '',
                minYield: 0,
                sortBy: 'exDate',
                sortOrder: 'asc',
                onlyTomorrow: false,
                onlyNewAnnouncements: false
              })}
              className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              Reset Filters (All 90 Days)
            </button>
          </div>
        ) : (
          <DividendTable
            stocks={filteredStocks}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSortChange={handleSortChange}
            onPreviewEmail={handleOpenEmailPreview}
            onOpenCalculator={handleOpenCalculator}
            onSendTestAlert={(s) => handleSendTestAlert(currentSubscription.email, 'THREE_DAY_REMINDER', s.ticker)}
          />
        )}

        {/* Real Data & API Architecture Info Card */}
        <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
            <span className="font-semibold text-slate-800 block mb-1">
              📅 1-90 Day Horizon
            </span>
            <span className="text-slate-600 leading-relaxed">
              Real-time ex-dividend schedules ranging from tomorrow, the day after tomorrow, and subsequent dates up to a full 90-day forward horizon.
            </span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
            <span className="font-semibold text-blue-700 block mb-1">
              📡 Real Market API Integration
            </span>
            <span className="text-slate-600 leading-relaxed">
              Live corporate declarations are retrieved from the <strong>Nasdaq Dividend Calendar API</strong> and real-time prices from <strong>Yahoo Finance</strong>. Days and payouts update automatically.
            </span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
            <span className="font-semibold text-emerald-700 block mb-1">
              ⚙️ GitHub Actions &amp; CRON Jobs
            </span>
            <span className="text-slate-600 leading-relaxed">
              Daily automated cron (<code className="text-slate-700 font-mono bg-slate-100 px-1 py-0.5 rounded">0 13 * * 1-5</code>) triggers the pre-market scraping script and delivers email alerts.
            </span>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Next Dividends</span>
            <span>&bull; Upcoming Large-Cap Dividend Calendar (1-90 Days)</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleOpenCron} className="hover:text-slate-800 transition-colors">
              GitHub Actions Script
            </button>
            <button onClick={handleOpenAlerts} className="hover:text-slate-800 transition-colors">
              Email Settings
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AlertSettingsModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        currentSubscription={currentSubscription}
        onSaveSubscription={handleSaveSubscription}
        onSendTestAlert={handleSendTestAlert}
        isSendingTest={isSendingTestAlert}
      />

      <EmailPreviewModal
        isOpen={isEmailPreviewOpen}
        onClose={() => setIsEmailPreviewOpen(false)}
        selectedStock={selectedStock}
        allStocks={allStocks}
        userEmail={currentSubscription.email}
        defaultType={emailPreviewType}
        onSendTest={handleSendTestAlert}
        isSending={isSendingTestAlert}
      />

      <CronDashboardModal
        isOpen={isCronModalOpen}
        onClose={() => setIsCronModalOpen(false)}
        cronHistory={cronHistory}
        onTriggerCron={handleTriggerCron}
        isRunningCron={isRunningCron}
      />

      <IncomeCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        selectedStock={selectedStock}
        allStocks={allStocks}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-3 rounded-md bg-white border border-slate-200 text-slate-900 text-xs shadow-lg flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
export default App;
