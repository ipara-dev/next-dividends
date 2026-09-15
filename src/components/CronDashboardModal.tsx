import React, { useState } from 'react';
import { CronRunLog } from '../types';
import { 
  Terminal, 
  Play, 
  Copy, 
  Check, 
  X, 
  Clock, 
  FileCode, 
  CheckCircle2, 
  GitBranch,
  Cloud
} from 'lucide-react';

interface CronDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cronHistory: CronRunLog[];
  onTriggerCron: () => Promise<void>;
  isRunningCron: boolean;
}

export const CronDashboardModal: React.FC<CronDashboardModalProps> = ({
  isOpen,
  onClose,
  cronHistory,
  onTriggerCron,
  isRunningCron
}) => {
  const [activeTab, setActiveTab] = useState<'runner' | 'github-workflow' | 'script' | 'vercel'>('runner');
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  const githubWorkflowYaml = `name: Daily Dividend Scraping & Email Alerts

on:
  schedule:
    # Runs at 13:00 UTC (9:00 AM EST) Mon-Fri before US market opening
    - cron: '0 13 * * 1-5'
  workflow_dispatch: # Allows manual trigger from GitHub Actions UI

jobs:
  scrape-and-alert:
    name: Scrape Large-Cap Dividends & Dispatch Alerts
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci || npm install

      - name: Run Daily Dividend Scraper & Email Notification Dispatcher
        env:
          RESEND_API_KEY: \${{ secrets.RESEND_API_KEY }}
          SENDER_EMAIL: \${{ secrets.SENDER_EMAIL || 'onboarding@resend.dev' }}
          MAILING_LIST: \${{ secrets.MAILING_LIST || 'wparajohn@gmail.com' }}
          APP_URL: \${{ secrets.APP_URL }}
        run: npx tsx scripts/scrape-and-alert.ts

      - name: Job Summary
        run: |
          echo "### 🚀 Next Dividends Daily Execution Completed" >> $GITHUB_STEP_SUMMARY
          echo "Processed large-cap stocks, verified 3-day ex-dividend deadlines, and dispatched alert emails." >> $GITHUB_STEP_SUMMARY
`;

  const handleCopyWorkflow = () => {
    navigator.clipboard.writeText(githubWorkflowYaml);
    setCopiedWorkflow(true);
    setTimeout(() => setCopiedWorkflow(false), 2000);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(`curl -X POST https://your-domain.vercel.app/api/cron/run -H "Authorization: Bearer YOUR_CRON_SECRET"`);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Terminal className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>CRON Jobs &amp; GitHub Actions Dashboard</span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  Daily Automation
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Automate market scraping and 3-day ex-date email lists via GitHub Jobs or Vercel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 py-2 border-b border-slate-200 bg-white flex items-center gap-2 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('runner')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'runner'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Play className="h-3 w-3 fill-current" />
            <span>Interactive CRON Runner</span>
          </button>

          <button
            onClick={() => setActiveTab('github-workflow')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'github-workflow'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GitBranch className="h-3.5 w-3.5" />
            <span>GitHub Actions Workflow</span>
          </button>

          <button
            onClick={() => setActiveTab('script')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'script'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>CLI Scraper Script</span>
          </button>

          <button
            onClick={() => setActiveTab('vercel')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'vercel'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Cloud className="h-3.5 w-3.5" />
            <span>Vercel Cron Deployment</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-700">
          
          {/* TAB 1: RUNNER & LOGS */}
          {activeTab === 'runner' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 mb-1">
                    Execute Daily Market Scraper &amp; Notification Pipeline Now
                  </h3>
                  <p className="text-[11px] text-slate-500 max-w-xl">
                    Executes the full pipeline: pulls live quotes from Yahoo Finance and Nasdaq, identifies stocks 3 days from ex-date, scans new announcements, and sends emails.
                  </p>
                </div>
                <button
                  id="btn-trigger-cron-pipeline"
                  onClick={onTriggerCron}
                  disabled={isRunningCron}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs active:scale-95 disabled:opacity-50"
                >
                  <Play className={`h-3.5 w-3.5 fill-current ${isRunningCron ? 'animate-spin' : ''}`} />
                  <span>{isRunningCron ? 'Scraping & Dispatching...' : 'Run Pipeline Now'}</span>
                </button>
              </div>

              {/* Execution History Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-800 text-xs">
                    Recent CRON Executions Log ({cronHistory.length})
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Endpoint: /api/cron/run
                  </span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Trigger Source</th>
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Scraped</th>
                        <th className="py-2.5 px-3">3-Day Alerts</th>
                        <th className="py-2.5 px-3">Dispatched</th>
                        <th className="py-2.5 px-3">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {cronHistory.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium text-[10px]">
                              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                              {log.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-700">
                            {log.trigger}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="py-2.5 px-3 text-slate-900 font-semibold">
                            {log.stocksScraped} stocks
                          </td>
                          <td className="py-2.5 px-3 text-rose-700 font-semibold">
                            {log.threeDayRemindersFound} urgent
                          </td>
                          <td className="py-2.5 px-3 text-blue-700">
                            {log.emailsDispatched} emails
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">
                            {log.executionTimeMs}ms
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GITHUB WORKFLOW */}
          {activeTab === 'github-workflow' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    .github/workflows/daily-dividends.yml
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Runs every business morning at 9:00 AM EST (13:00 UTC) automatically on GitHub Actions
                  </p>
                </div>
                <button
                  onClick={handleCopyWorkflow}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs transition-colors"
                >
                  {copiedWorkflow ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedWorkflow ? 'Copied' : 'Copy YAML'}</span>
                </button>
              </div>

              <pre className="p-3.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                <code>{githubWorkflowYaml}</code>
              </pre>
            </div>
          )}

          {/* TAB 3: CLI SCRIPT */}
          {activeTab === 'script' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Standalone Scraper Script: scripts/scrape-and-alert.ts
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Executes directly from terminal, Docker, or GitHub CI runners
                  </p>
                </div>
                <button
                  onClick={handleCopyScript}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs transition-colors"
                >
                  {copiedScript ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedScript ? 'Copied' : 'Copy cURL'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-800">How to run manually via terminal:</div>
                <div className="p-2 rounded bg-slate-900 text-slate-100 font-mono text-[11px]">
                  <code>npx tsx scripts/scrape-and-alert.ts</code>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VERCEL CRON */}
          {activeTab === 'vercel' && (
            <div className="space-y-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Vercel Serverless Cron Configuration (vercel.json)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Native Vercel cron invoking /api/cron every weekday at market open
                </p>
              </div>

              <pre className="p-3.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
{`{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 13 * * 1-5"
    }
  ]
}`}
              </pre>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
