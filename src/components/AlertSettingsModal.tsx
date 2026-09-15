import React, { useState } from 'react';
import { AlertSubscription } from '../types';
import { 
  Bell, 
  Clock, 
  Sparkles, 
  Check, 
  X, 
  Mail
} from 'lucide-react';

interface AlertSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubscription?: AlertSubscription;
  onSaveSubscription: (sub: Partial<AlertSubscription>) => Promise<boolean>;
  onSendTestAlert: (email: string, type: 'THREE_DAY_REMINDER' | 'NEW_ANNOUNCEMENT') => Promise<void>;
  isSendingTest: boolean;
}

export const AlertSettingsModal: React.FC<AlertSettingsModalProps> = ({
  isOpen,
  onClose,
  currentSubscription,
  onSaveSubscription,
  onSendTestAlert,
  isSendingTest
}) => {
  const [email, setEmail] = useState(currentSubscription?.email || 'wparajohn@gmail.com');
  const [alertsThreeDaysBeforeExDate, setAlertsThreeDaysBeforeExDate] = useState(
    currentSubscription?.alertsThreeDaysBeforeExDate ?? true
  );
  const [alertsNewAnnouncements, setAlertsNewAnnouncements] = useState(
    currentSubscription?.alertsNewAnnouncements ?? true
  );
  const [minYieldThreshold, setMinYieldThreshold] = useState(
    currentSubscription?.minYieldThreshold ?? 0
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testSentSuccess, setTestSentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setIsSaving(true);
    const success = await onSaveSubscription({
      email,
      alertsThreeDaysBeforeExDate,
      alertsNewAnnouncements,
      minYieldThreshold: Number(minYieldThreshold)
    });
    setIsSaving(false);
    if (success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handleTriggerTest = async (type: 'THREE_DAY_REMINDER' | 'NEW_ANNOUNCEMENT') => {
    if (!email) return;
    await onSendTestAlert(email, type);
    setTestSentSuccess(true);
    setTimeout(() => setTestSentSuccess(false), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Dividend Email Alert Setup
              </h2>
              <p className="text-[11px] text-slate-500">
                Automated 3-day ex-dividend and announcement alerts
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

        {/* Modal Body / Form */}
        <form onSubmit={handleSave} className="p-4 space-y-4 text-xs text-slate-700">
          
          {/* Email input with quick prefill */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Recipient Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                id="input-alert-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full pl-9 pr-24 py-2 bg-white border border-slate-200 rounded-md text-slate-800 text-xs focus:outline-none focus:border-blue-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setEmail('wparajohn@gmail.com')}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[10px] font-medium text-blue-700 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                Use My Email
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Alerts are sent to this address via scheduled daily CRON jobs.
            </p>
          </div>

          {/* Core Notification Rules */}
          <div className="space-y-2.5">
            <span className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              Alert Triggers &amp; Schedules
            </span>

            {/* Trigger 1: 3 Days Before Ex-Date */}
            <div 
              onClick={() => setAlertsThreeDaysBeforeExDate(!alertsThreeDaysBeforeExDate)}
              className={`p-3 rounded-md border cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                alertsThreeDaysBeforeExDate
                  ? 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-200'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className={`mt-0.5 p-1 rounded ${alertsThreeDaysBeforeExDate ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>3 Days Before Ex-Dividend Date</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-600 text-white uppercase">
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Sends a reminder 72 hours before the ex-dividend cutoff date to ensure you purchase shares in time.
                  </p>
                </div>
              </div>
              <div className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center border transition-colors ${
                alertsThreeDaysBeforeExDate ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {alertsThreeDaysBeforeExDate && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
            </div>

            {/* Trigger 2: New Dividend Announcements */}
            <div 
              onClick={() => setAlertsNewAnnouncements(!alertsNewAnnouncements)}
              className={`p-3 rounded-md border cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                alertsNewAnnouncements
                  ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-200'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className={`mt-0.5 p-1 rounded ${alertsNewAnnouncements ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    New Dividend Announcements
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Notifies you when a large-cap company announces fresh dividend payouts or dividend hikes.
                  </p>
                </div>
              </div>
              <div className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center border transition-colors ${
                alertsNewAnnouncements ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {alertsNewAnnouncements && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
            </div>
          </div>

          {/* Minimum Yield Filter */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                Minimum Dividend Yield Filter
              </label>
              <span className="font-mono text-xs font-bold text-emerald-700">
                {minYieldThreshold === 0 ? 'All Yields' : `>= ${minYieldThreshold}% Yield`}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[0, 2, 3, 4].map((thresh) => (
                <button
                  type="button"
                  key={thresh}
                  onClick={() => setMinYieldThreshold(thresh)}
                  className={`py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                    minYieldThreshold === thresh
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {thresh === 0 ? 'All' : `>${thresh}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Test Trigger Section */}
          <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                Dispatch Test Notification
              </span>
              <span className="text-[11px] text-slate-500">
                Verify template delivery
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-test-send-3day"
                disabled={isSendingTest}
                onClick={() => handleTriggerTest('THREE_DAY_REMINDER')}
                className="flex-1 py-1.5 px-2.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <Clock className="h-3 w-3 text-rose-600" />
                <span>Test 3-Day Alert Email</span>
              </button>

              <button
                type="button"
                id="btn-test-send-announcement"
                disabled={isSendingTest}
                onClick={() => handleTriggerTest('NEW_ANNOUNCEMENT')}
                className="flex-1 py-1.5 px-2.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className="h-3 w-3 text-blue-600" />
                <span>Test Announcement Email</span>
              </button>
            </div>

            {testSentSuccess && (
              <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Test alert generated! Check preview or mailbox.</span>
              </div>
            )}
          </div>

          {/* Modal Footer / Save */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
            {savedSuccess ? (
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" />
                <span>Preferences Saved!</span>
              </span>
            ) : (
              <span className="text-[11px] text-slate-500">
                Target: <code className="text-slate-800 font-mono">{email}</code>
              </span>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                id="btn-save-subscription"
                disabled={isSaving}
                className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
