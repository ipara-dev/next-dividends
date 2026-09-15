export type DividendFrequency = 'Quarterly' | 'Monthly' | 'Semi-Annual' | 'Annual';

export type Sector = 
  | 'Technology'
  | 'Healthcare'
  | 'Financials'
  | 'Consumer Staples'
  | 'Energy'
  | 'Industrials'
  | 'Utilities'
  | 'Real Estate'
  | 'Consumer Discretionary';

export interface DividendStock {
  id: string;
  ticker: string;
  name: string;
  sector: Sector;
  price: number;
  marketCapBillions: number;
  dividendAmount: number; // payout per share per period
  annualDividend: number; // annualized payout
  dividendYield: number; // percentage, e.g. 3.45%
  payoutRatio: number; // percentage of earnings, e.g. 48%
  frequency: DividendFrequency;
  exDividendDate: string; // ISO format: YYYY-MM-DD
  recordDate: string; // ISO format: YYYY-MM-DD
  paymentDate: string; // ISO format: YYYY-MM-DD
  declarationDate: string; // ISO format: YYYY-MM-DD
  daysUntilExDate: number; // Calculated relative to current date
  isThreeDaysAway: boolean; // Exactly 3 days before ex-dividend date
  isNewAnnouncement: boolean; // Declared within the past 48 hours
  growthStreakYears: number; // e.g. 25 years (Aristocrat)
  safetyScore: 'A+' | 'A' | 'B+' | 'B' | 'C';
  description: string;
}

export interface AlertSubscription {
  id: string;
  email: string;
  alertsThreeDaysBeforeExDate: boolean;
  alertsNewAnnouncements: boolean;
  minYieldThreshold: number; // e.g. 0%, 2%, 3%, 4%
  selectedTickers: string[]; // empty or ['ALL'] means all large cap stocks
  createdAt: string;
  lastNotifiedAt?: string;
  totalAlertsSent: number;
}

export interface CronRunLog {
  id: string;
  timestamp: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  trigger: 'GITHUB_ACTIONS_CRON' | 'MANUAL_TRIGGER' | 'VERCEL_CRON';
  stocksScraped: number;
  threeDayRemindersFound: number;
  newAnnouncementsFound: number;
  emailsDispatched: number;
  recipientEmails: string[];
  executionTimeMs: number;
  details: string;
}

export type TimeframeDays = 1 | 7 | 15 | 30 | 60 | 90 | 'custom';

export interface FilterState {
  timeframe: TimeframeDays;
  customDays: number;
  sector: string;
  search: string;
  minYield: number;
  sortBy: 'exDate' | 'yield' | 'marketCap' | 'payout' | 'growth';
  sortOrder: 'asc' | 'desc';
  onlyTomorrow?: boolean;
  onlyNewAnnouncements: boolean;
}
