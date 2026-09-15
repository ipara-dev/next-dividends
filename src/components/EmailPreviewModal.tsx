import React, { useState } from 'react';
import { DividendStock } from '../types';
import { generateThreeDayReminderEmail, generateNewAnnouncementEmail, EmailPayload } from '../utils/emailTemplate';
import { 
  Mail, 
  X, 
  Clock, 
  Sparkles, 
  Send, 
  Check, 
  Copy, 
  Eye, 
  Code
} from 'lucide-react';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStock?: DividendStock;
  allStocks: DividendStock[];
  userEmail: string;
  defaultType?: 'THREE_DAY_REMINDER' | 'NEW_ANNOUNCEMENT';
  onSendTest: (email: string, type: 'THREE_DAY_REMINDER' | 'NEW_ANNOUNCEMENT', ticker?: string) => Promise<void>;
  isSending: boolean;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  isOpen,
  onClose,
  selectedStock,
  allStocks,
  userEmail,
  defaultType = 'THREE_DAY_REMINDER',
  onSendTest,
  isSending
}) => {
  const [alertType, setAlertType] = useState<'THREE_DAY_REMINDER' | 'NEW_ANNOUNCEMENT'>(defaultType);
  const [viewFormat, setViewFormat] = useState<'html' | 'text'>('html');
  const [copied, setCopied] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  // Pick suitable stock for preview
  const urgentStocks = allStocks.filter(s => s.daysUntilExDate === 3);
  const newStocks = allStocks.filter(s => s.isNewAnnouncement);

  const activeStock = selectedStock || (
    alertType === 'THREE_DAY_REMINDER' 
      ? (urgentStocks[0] || allStocks[0])
      : (newStocks[0] || allStocks[0])
  );

  if (!isOpen || !activeStock) return null;

  const emailPayload: EmailPayload = alertType === 'THREE_DAY_REMINDER'
    ? generateThreeDayReminderEmail(activeStock, userEmail)
    : generateNewAnnouncementEmail(activeStock, userEmail);

  const handleCopySubject = () => {
    navigator.clipboard.writeText(emailPayload.subject);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async () => {
    await onSendTest(userEmail, alertType, activeStock.ticker);
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Email Notification Preview</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {activeStock.ticker}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Generated layout for automated CRON email alerts
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

        {/* Sub-toolbar */}
        <div className="px-4 py-2.5 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2.5">
          {/* Template Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs">
            <button
              onClick={() => setAlertType('THREE_DAY_REMINDER')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                alertType === 'THREE_DAY_REMINDER'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="h-3 w-3" />
              <span>3-Day Pre-Ex-Date</span>
            </button>

            <button
              onClick={() => setAlertType('NEW_ANNOUNCEMENT')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                alertType === 'NEW_ANNOUNCEMENT'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              <span>New Announcement</span>
            </button>
          </div>

          {/* HTML vs Plaintext & Send button */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-md p-0.5 text-xs">
              <button
                onClick={() => setViewFormat('html')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                  viewFormat === 'html' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="h-3 w-3" />
                <span>HTML</span>
              </button>
              <button
                onClick={() => setViewFormat('text')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                  viewFormat === 'text' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code className="h-3 w-3" />
                <span>Text</span>
              </button>
            </div>

            <button
              onClick={handleSend}
              disabled={isSending}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs disabled:opacity-50"
            >
              <Send className="h-3 w-3" />
              <span>{isSending ? 'Sending...' : 'Send Test Alert'}</span>
            </button>
          </div>
        </div>

        {/* Email Client Metadata Box */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs space-y-1 font-mono">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <div>
              <span className="font-medium text-slate-400">From: </span>
              <span className="text-slate-700">Next Dividends Alerts &lt;alerts@resend.dev&gt;</span>
            </div>
            <div>
              <span className="font-medium text-slate-400">To: </span>
              <span className="text-blue-700 font-semibold">{userEmail}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-slate-800 text-xs">
            <div className="flex items-center gap-1.5 truncate pr-2">
              <span className="text-slate-400 font-medium shrink-0">Subject: </span>
              <span className="font-bold truncate text-slate-900">{emailPayload.subject}</span>
            </div>
            <button
              onClick={handleCopySubject}
              className="text-[11px] text-slate-500 hover:text-slate-800 shrink-0 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {sentSuccess && (
          <div className="mx-4 mt-2.5 p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            <span>Success: Test alert was delivered to <strong>{userEmail}</strong>!</span>
          </div>
        )}

        {/* Email Content Frame */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100">
          {viewFormat === 'html' ? (
            <div className="max-w-xl mx-auto rounded-lg border border-slate-200 overflow-hidden shadow-xs bg-white">
              <div 
                dangerouslySetInnerHTML={{ __html: emailPayload.html }}
              />
            </div>
          ) : (
            <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-lg p-4 font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
              {emailPayload.text}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Automated daily schedule: 9:00 AM EST via GitHub Actions CRON</span>
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
