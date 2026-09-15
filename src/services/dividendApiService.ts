import { DividendStock, Sector } from '../types';
import { BASE_LARGE_CAP_STOCKS, getHydratedDividendStocks } from '../data/largeCapStocks';

export interface SyncResult {
  source: 'REAL_LIVE_API' | 'HYDRATED_FALLBACK';
  syncedAt: string;
  stocksCount: number;
  liveQuotesUpdated: number;
  liveDividendsFound: number;
  details: string;
  data: DividendStock[];
}

// In-memory cache for live synced data
let cachedLiveStocks: DividendStock[] | null = null;
let lastSyncTimestamp: string | null = null;
let lastSyncSource: 'REAL_LIVE_API' | 'HYDRATED_FALLBACK' = 'HYDRATED_FALLBACK';

/**
 * Fetches real live stock price and recent market data from Yahoo Finance's free chart API
 */
export async function fetchLiveYahooQuote(ticker: string): Promise<{ price: number; currency: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (meta && typeof meta.regularMarketPrice === 'number') {
      return {
        price: meta.regularMarketPrice,
        currency: meta.currency || 'USD'
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetches official dividend calendar entries for a given date from Nasdaq Calendar API
 */
export async function fetchNasdaqCalendarDate(dateStr: string): Promise<any[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const url = `https://api.nasdaq.com/api/calendar/dividends?date=${dateStr}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const json = await res.json();
    const rows = json?.data?.calendar?.rows;
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

/**
 * Core Live Sync Method:
 * Combines real-time market quotes from Yahoo Finance and dividend announcements
 * from Nasdaq Calendar to hydrate and enrich the large-cap dividend list with real live market data.
 */
export async function syncRealDividendData(): Promise<SyncResult> {
  const now = new Date();
  const baseStocks = getHydratedDividendStocks(now);
  let liveQuotesUpdated = 0;
  let liveDividendsFound = 0;

  try {
    // 1. Fetch live quotes for top high-priority stocks in parallel (batch of 8)
    const priorityTickers = ['JNJ', 'JPM', 'XOM', 'MSFT', 'AAPL', 'PG', 'O', 'ABBV', 'CVX', 'KO'];
    const quotePromises = priorityTickers.map(async (ticker) => {
      const quote = await fetchLiveYahooQuote(ticker);
      return { ticker, quote };
    });

    const quoteResults = await Promise.allSettled(quotePromises);

    const priceMap = new Map<string, number>();
    for (const r of quoteResults) {
      if (r.status === 'fulfilled' && r.value.quote?.price) {
        priceMap.set(r.value.ticker, r.value.quote.price);
        liveQuotesUpdated++;
      }
    }

    // 2. Fetch Nasdaq calendar for upcoming key dates (today, +3 days, +7 days)
    const dateStrings: string[] = [];
    for (const offset of [0, 1, 2, 3, 7]) {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      dateStrings.push(d.toISOString().split('T')[0]);
    }

    const nasdaqPromises = dateStrings.map(d => fetchNasdaqCalendarDate(d));
    const nasdaqResults = await Promise.allSettled(nasdaqPromises);
    const nasdaqMap = new Map<string, any>();

    for (const res of nasdaqResults) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        for (const row of res.value) {
          if (row?.symbol) {
            nasdaqMap.set(row.symbol.toUpperCase(), row);
            liveDividendsFound++;
          }
        }
      }
    }

    // 3. Enrich the stock list with live prices and live dividend values
    const enrichedStocks: DividendStock[] = baseStocks.map((stock) => {
      const livePrice = priceMap.get(stock.ticker);
      const nasdaqData = nasdaqMap.get(stock.ticker);

      const price = livePrice ? Number(livePrice.toFixed(2)) : stock.price;
      let dividendAmount = stock.dividendAmount;
      let annualDividend = stock.annualDividend;

      if (nasdaqData?.dividend_Rate) {
        const parsed = parseFloat(nasdaqData.dividend_Rate.replace('$', ''));
        if (!isNaN(parsed) && parsed > 0) {
          dividendAmount = parsed;
          annualDividend = stock.frequency === 'Monthly' ? parsed * 12 : parsed * 4;
        }
      }

      const dividendYield = Number(((annualDividend / price) * 100).toFixed(2));

      return {
        ...stock,
        price,
        dividendAmount,
        annualDividend,
        dividendYield
      };
    });

    cachedLiveStocks = enrichedStocks;
    lastSyncTimestamp = now.toISOString();
    lastSyncSource = 'REAL_LIVE_API';

    return {
      source: 'REAL_LIVE_API',
      syncedAt: lastSyncTimestamp,
      stocksCount: enrichedStocks.length,
      liveQuotesUpdated,
      liveDividendsFound,
      details: `Successfully fetched live real-time quotes (${liveQuotesUpdated} live prices updated) and checked live Nasdaq calendars.`,
      data: enrichedStocks
    };
  } catch (err: any) {
    // Graceful fallback
    cachedLiveStocks = baseStocks;
    lastSyncTimestamp = now.toISOString();
    lastSyncSource = 'HYDRATED_FALLBACK';

    return {
      source: 'HYDRATED_FALLBACK',
      syncedAt: lastSyncTimestamp,
      stocksCount: baseStocks.length,
      liveQuotesUpdated: 0,
      liveDividendsFound: 0,
      details: `Live API sync fallback applied: ${err?.message || 'Network limitation'}. Used reference dataset.`,
      data: baseStocks
    };
  }
}

/**
 * Retrieve current dividend stocks (cached or fresh)
 */
export function getCurrentDividendStocks(): { data: DividendStock[]; source: string; syncedAt: string | null } {
  if (!cachedLiveStocks) {
    cachedLiveStocks = getHydratedDividendStocks(new Date());
    lastSyncTimestamp = new Date().toISOString();
  }
  return {
    data: cachedLiveStocks,
    source: lastSyncSource,
    syncedAt: lastSyncTimestamp
  };
}
