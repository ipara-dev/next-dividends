import React, { useState } from 'react';
import { DividendStock } from '../types';
import { 
  Calendar,
  Mail, 
  Calculator, 
  Sparkles, 
  Award,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
  ChevronDown,
  ChevronUp,
  Check,
  Share2
} from 'lucide-react';

interface DividendTableProps {
  stocks: DividendStock[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (column: string) => void;
  onPreviewEmail: (stock: DividendStock) => void;
  onOpenCalculator: (stock: DividendStock) => void;
  onSendTestAlert: (stock: DividendStock) => void;
}

export const DividendTable: React.FC<DividendTableProps> = ({
  stocks,
  sortBy,
  sortOrder,
  onSortChange,
  onPreviewEmail,
  onOpenCalculator,
}) => {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  const handleCopy = (stock: DividendStock, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `${stock.ticker} (${stock.name}) - Ex-Date: ${stock.exDividendDate} (in ${stock.daysUntilExDate}d) | Yield: ${stock.dividendYield}% | Payout: $${stock.dividendAmount} | Pay Date: ${stock.paymentDate}`;
    navigator.clipboard.writeText(text);
    setCopiedId(stock.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey) {
      return <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60 ml-1 inline" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="h-3 w-3 text-blue-600 ml-1 inline" />
      : <ArrowDown className="h-3 w-3 text-blue-600 ml-1 inline" />;
  };

  const formatDaysCountdown = (days: number) => {
    if (days === 1) {
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] border border-emerald-200">
          Tomorrow
        </span>
      );
    }
    if (days === 2) {
      return (
        <span className="inline-flex items-center gap-1 font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] border border-blue-200">
          In 2 days
        </span>
      );
    }
    return <span className="text-slate-500 font-mono text-[10px]">in {days} days</span>;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider select-none">
              <th 
                onClick={() => onSortChange('ticker')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900"
              >
                <span>Symbol &amp; Company</span>
                {renderSortIcon('ticker')}
              </th>
              
              <th className="py-3 px-3">
                Sector
              </th>

              <th 
                onClick={() => onSortChange('exDate')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900"
              >
                <span>Ex-Dividend Date</span>
                {renderSortIcon('exDate')}
              </th>

              <th 
                onClick={() => onSortChange('yield')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900"
              >
                <span>Yield</span>
                {renderSortIcon('yield')}
              </th>

              <th 
                onClick={() => onSortChange('payout')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900"
              >
                <span>Payout / Share</span>
                {renderSortIcon('payout')}
              </th>

              <th className="py-3 px-3">
                Record Date
              </th>

              <th className="py-3 px-3">
                Payment Date
              </th>

              <th 
                onClick={() => onSortChange('marketCap')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900"
              >
                <span>Market Cap</span>
                {renderSortIcon('marketCap')}
              </th>

              <th 
                onClick={() => onSortChange('growth')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900"
              >
                <span>Streak</span>
                {renderSortIcon('growth')}
              </th>

              <th className="py-3 px-4 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stocks.map((stock) => {
              const isExpanded = expandedRowId === stock.id;

              return (
                <React.Fragment key={stock.id}>
                  <tr 
                    onClick={() => toggleRow(stock.id)}
                    className={`transition-colors cursor-pointer ${
                      isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Symbol & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm tracking-tight">
                          {stock.ticker}
                        </span>
                        {stock.isNewAnnouncement && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium text-[10px] flex items-center gap-0.5">
                            <Sparkles className="h-2.5 w-2.5 text-blue-600" />
                            New
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                        {stock.name}
                      </div>
                    </td>

                    {/* Sector */}
                    <td className="py-3 px-3 text-slate-600 text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                        {stock.sector}
                      </span>
                    </td>

                    {/* Ex-Dividend Date & Countdown */}
                    <td className="py-3 px-3">
                      <div className="font-mono font-semibold text-slate-800">
                        {stock.exDividendDate}
                      </div>
                      <div className="mt-0.5">
                        {formatDaysCountdown(stock.daysUntilExDate)}
                      </div>
                    </td>

                    {/* Dividend Yield */}
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-emerald-700 text-sm">
                        {stock.dividendYield.toFixed(2)}%
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        ${stock.annualDividend.toFixed(2)}/yr
                      </div>
                    </td>

                    {/* Payout Per Share */}
                    <td className="py-3 px-3 font-mono text-slate-800">
                      <div>${stock.dividendAmount.toFixed(4)}</div>
                      <div className="text-[10px] text-slate-500">{stock.frequency}</div>
                    </td>

                    {/* Record Date */}
                    <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                      {stock.recordDate}
                    </td>

                    {/* Payment Date */}
                    <td className="py-3 px-3 font-mono text-slate-800 font-medium text-[11px]">
                      {stock.paymentDate}
                    </td>

                    {/* Market Cap */}
                    <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                      ${stock.marketCapBillions}B
                    </td>

                    {/* Dividend Streak */}
                    <td className="py-3 px-3">
                      {stock.growthStreakYears >= 25 ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold" title={`${stock.growthStreakYears} years consecutive dividend increases`}>
                          <Award className="h-3 w-3 text-amber-600" />
                          {stock.growthStreakYears}y King
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px]">
                          {stock.growthStreakYears} yrs
                        </span>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onPreviewEmail(stock)}
                          className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-medium transition-colors flex items-center gap-1 border border-slate-200"
                          title="Preview the email alert"
                        >
                          <Mail className="h-3 w-3 text-blue-600" />
                          <span className="hidden sm:inline">Preview Alert</span>
                        </button>

                        <button
                          onClick={() => onOpenCalculator(stock)}
                          className="p-1 rounded-md bg-white hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition-colors border border-slate-200"
                          title="Calculate Payout"
                        >
                          <Calculator className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleCopy(stock, e)}
                          className="p-1 rounded-md bg-white hover:bg-slate-100 text-slate-600 transition-colors border border-slate-200"
                          title="Copy Row Data"
                        >
                          {copiedId === stock.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Share2 className="h-3.5 w-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => toggleRow(stock.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 transition-colors"
                          title={isExpanded ? 'Collapse Details' : 'Expand Details'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expandable Row Detail */}
                  {isExpanded && (
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <td colSpan={10} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          {/* Col 1: Description & Safety */}
                          <div>
                            <div className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                              <Info className="h-3.5 w-3.5 text-slate-500" />
                              <span>About {stock.name}</span>
                            </div>
                            <p className="text-slate-600 text-[11px] leading-relaxed">
                              {stock.description}
                            </p>
                            <div className="mt-2 text-[11px] text-slate-500">
                              Current Market Price: <span className="font-mono text-slate-900 font-bold">${stock.price.toFixed(2)}</span> &bull; Dividend Safety: <span className="font-mono text-emerald-700 font-bold">{stock.safetyScore}</span>
                            </div>
                          </div>

                          {/* Col 2: Payout Breakdown */}
                          <div className="bg-white p-3 rounded-md border border-slate-200">
                            <div className="font-semibold text-slate-800 mb-2">
                              Estimated Cash Distribution
                            </div>
                            <div className="space-y-1 font-mono text-[11px]">
                              <div className="flex justify-between text-slate-600">
                                <span>100 Shares:</span>
                                <span className="text-slate-900 font-semibold">${(stock.dividendAmount * 100).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>500 Shares:</span>
                                <span className="text-slate-900 font-semibold">${(stock.dividendAmount * 500).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>1,000 Shares:</span>
                                <span className="text-emerald-700 font-bold">${(stock.dividendAmount * 1000).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Col 3: Ex-Date Action Requirement */}
                          <div className="p-3 rounded-md border bg-white border-slate-200">
                            <div className="font-semibold mb-1 flex items-center gap-1.5 text-slate-800">
                              <Calendar className="h-3.5 w-3.5 text-blue-600" />
                              <span>Ex-Dividend Cutoff Rule</span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              To receive this payout, you must execute your purchase <strong>before {stock.exDividendDate}</strong>. Trades placed on or after the ex-date are not eligible for this dividend payment.
                            </p>
                            <div className="mt-2.5 flex items-center gap-2">
                              <button
                                onClick={() => onPreviewEmail(stock)}
                                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px] transition-colors"
                              >
                                View Email Alert
                              </button>
                              <button
                                onClick={() => onOpenCalculator(stock)}
                                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] transition-colors"
                              >
                                Calculate Payout
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
