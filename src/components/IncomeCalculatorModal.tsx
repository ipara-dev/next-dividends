import React, { useState } from 'react';
import { DividendStock } from '../types';
import { 
  Calculator, 
  DollarSign, 
  X, 
  AlertCircle
} from 'lucide-react';

interface IncomeCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStock?: DividendStock;
  allStocks: DividendStock[];
}

export const IncomeCalculatorModal: React.FC<IncomeCalculatorModalProps> = ({
  isOpen,
  onClose,
  selectedStock,
  allStocks
}) => {
  const [ticker, setTicker] = useState(selectedStock?.ticker || (allStocks[0]?.ticker ?? 'JNJ'));
  const [calculationMode, setCalculationMode] = useState<'shares' | 'dollars'>('shares');
  const [sharesInput, setSharesInput] = useState<number>(100);
  const [dollarsInput, setDollarsInput] = useState<number>(10000);

  if (!isOpen) return null;

  const currentStock = allStocks.find(s => s.ticker === ticker) || allStocks[0];
  if (!currentStock) return null;

  const totalShares = calculationMode === 'shares' 
    ? sharesInput 
    : Math.floor(dollarsInput / (currentStock.price || 1));

  const upcomingPayoutCash = totalShares * currentStock.dividendAmount;
  const annualIncomeCash = totalShares * currentStock.annualDividend;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Dividend Payout Calculator
              </h2>
              <p className="text-[11px] text-slate-500">
                Estimate payout cash before the ex-dividend date
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

        {/* Body */}
        <div className="p-4 space-y-3.5 text-xs text-slate-700">
          {/* Select Stock */}
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
              Large-Cap Stock
            </label>
            <select
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 text-xs"
            >
              {allStocks.map((s) => (
                <option key={s.ticker} value={s.ticker}>
                  {s.ticker} - {s.name} ({s.dividendYield}% Yield | Ex-Date in {s.daysUntilExDate}d)
                </option>
              ))}
            </select>
          </div>

          {/* Mode Switcher */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                Investment Input
              </span>
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-md p-0.5">
                <button
                  type="button"
                  onClick={() => setCalculationMode('shares')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    calculationMode === 'shares' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-slate-600'
                  }`}
                >
                  By Shares
                </button>
                <button
                  type="button"
                  onClick={() => setCalculationMode('dollars')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    calculationMode === 'dollars' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-slate-600'
                  }`}
                >
                  By Dollar $
                </button>
              </div>
            </div>

            {calculationMode === 'shares' ? (
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="10"
                  value={sharesInput}
                  onChange={(e) => setSharesInput(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[11px]">
                  shares (~${(sharesInput * currentStock.price).toLocaleString()})
                </span>
              </div>
            ) : (
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="number"
                  min="100"
                  step="500"
                  value={dollarsInput}
                  onChange={(e) => setDollarsInput(Math.max(10, parseInt(e.target.value) || 10))}
                  className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* Results Card */}
          <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <div className="text-[10px] uppercase text-slate-500 font-semibold">
                  Upcoming Payout ({currentStock.frequency})
                </div>
                <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">
                  ${upcomingPayoutCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase text-slate-500 font-semibold">
                  Payment Date
                </div>
                <div className="font-mono text-slate-800 font-semibold mt-0.5 text-xs">
                  {currentStock.paymentDate}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
              <div>
                <span>Annualized: </span>
                <strong className="text-slate-900 font-mono">
                  ${annualIncomeCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>
              <div>
                <span>Yield: </span>
                <strong className="text-emerald-700 font-mono font-semibold">
                  {currentStock.dividendYield.toFixed(2)}%
                </strong>
              </div>
            </div>
          </div>

          {/* Ex-Date Warning */}
          <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-800">
            <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Ex-Dividend Cutoff: {currentStock.exDividendDate}</strong> (in {currentStock.daysUntilExDate} days). Purchase before this date to qualify for the <span className="font-mono font-semibold">${upcomingPayoutCash.toFixed(2)}</span> cash distribution.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
