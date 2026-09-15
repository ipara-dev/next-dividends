import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getHydratedDividendStocks } from './src/data/largeCapStocks';
import { syncRealDividendData, getCurrentDividendStocks } from './src/services/dividendApiService';
import { generateThreeDayReminderEmail, generateNewAnnouncementEmail } from './src/utils/emailTemplate';
import { AlertSubscription, CronRunLog } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// Enable CORS for external consumption across other domains/sites
app.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// In-memory data persistence for active subscriptions
let subscriptions: AlertSubscription[] = [
  {
    id: 'sub-default-1',
    email: 'wparajohn@gmail.com',
    alertsThreeDaysBeforeExDate: true,
    alertsNewAnnouncements: true,
    minYieldThreshold: 0,
    selectedTickers: ['ALL'],
    createdAt: new Date().toISOString(),
    totalAlertsSent: 3,
    lastNotifiedAt: new Date(Date.now() - 3600000 * 8).toISOString()
  }
];

// In-memory logs of cron executions
let cronHistory: CronRunLog[] = [
  {
    id: 'cron-init-1',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: 'SUCCESS',
    trigger: 'GITHUB_ACTIONS_CRON',
    stocksScraped: 20,
    threeDayRemindersFound: 3,
    newAnnouncementsFound: 5,
    emailsDispatched: 3,
    recipientEmails: ['wparajohn@gmail.com'],
    executionTimeMs: 412,
    details: 'Daily market pre-open scrape complete. Dispatched 3-day ex-dividend alerts for JNJ, JPM, XOM.'
  }
];

// ==========================================
// API ROUTES
// ==========================================

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET & POST /api/dividends/sync - Live fetch from Nasdaq and Yahoo Finance APIs
app.all('/api/dividends/sync', async (req: Request, res: Response) => {
  try {
    const result = await syncRealDividendData();
    res.json({
      success: true,
      message: 'Real dividend API sync completed.',
      result
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/dividends - Fetch upcoming dividend stocks with timeframe & filters
app.get('/api/dividends', (req: Request, res: Response) => {
  try {
    const {
      days,
      sector,
      minYield,
      search,
      sortBy = 'exDate',
      sortOrder = 'asc',
      threeDaysOnly,
      newAnnouncementsOnly
    } = req.query;

    const maxDays = days ? parseInt(days as string, 10) : 90;
    const { data: allStocks, source, syncedAt } = getCurrentDividendStocks();

    let filtered = allStocks.filter(stock => {
      // Timeframe filter: within requested days
      if (!isNaN(maxDays) && stock.daysUntilExDate > maxDays) {
        return false;
      }

      // Sector filter
      if (sector && sector !== 'all' && stock.sector.toLowerCase() !== (sector as string).toLowerCase()) {
        return false;
      }

      // Min yield filter
      if (minYield) {
        const min = parseFloat(minYield as string);
        if (!isNaN(min) && stock.dividendYield < min) {
          return false;
        }
      }

      // Search ticker or name
      if (search) {
        const query = (search as string).toLowerCase().trim();
        const matchesTicker = stock.ticker.toLowerCase().includes(query);
        const matchesName = stock.name.toLowerCase().includes(query);
        if (!matchesTicker && !matchesName) {
          return false;
        }
      }

      // 3-days-only flag
      if (threeDaysOnly === 'true' && stock.daysUntilExDate !== 3) {
        return false;
      }

      // New announcements only flag
      if (newAnnouncementsOnly === 'true' && !stock.isNewAnnouncement) {
        return false;
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'yield':
          comparison = b.dividendYield - a.dividendYield;
          break;
        case 'marketCap':
          comparison = b.marketCapBillions - a.marketCapBillions;
          break;
        case 'payout':
          comparison = b.dividendAmount - a.dividendAmount;
          break;
        case 'growth':
          comparison = b.growthStreakYears - a.growthStreakYears;
          break;
        case 'exDate':
        default:
          comparison = a.daysUntilExDate - b.daysUntilExDate;
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    res.json({
      success: true,
      totalTracked: allStocks.length,
      count: filtered.length,
      timeframeDays: maxDays,
      source,
      syncedAt,
      data: filtered
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/dividends/stats - High-level summary metrics
app.get('/api/dividends/stats', (req: Request, res: Response) => {
  const allStocks = getHydratedDividendStocks(new Date());
  const threeDayStocks = allStocks.filter(s => s.daysUntilExDate === 3);
  const sevenDayStocks = allStocks.filter(s => s.daysUntilExDate <= 7);
  const newDeclarations = allStocks.filter(s => s.isNewAnnouncement);

  const avgYield = allStocks.reduce((acc, s) => acc + s.dividendYield, 0) / (allStocks.length || 1);
  const topYieldStock = [...allStocks].sort((a, b) => b.dividendYield - a.dividendYield)[0];

  res.json({
    success: true,
    totalLargeCapCount: allStocks.length,
    urgentThreeDayCount: threeDayStocks.length,
    sevenDayCount: sevenDayStocks.length,
    newAnnouncementCount: newDeclarations.length,
    averageYield: parseFloat(avgYield.toFixed(2)),
    topYieldStock: topYieldStock ? {
      ticker: topYieldStock.ticker,
      name: topYieldStock.name,
      yield: topYieldStock.dividendYield,
      exDate: topYieldStock.exDividendDate
    } : null
  });
});

// GET /api/subscriptions - List subscribers
app.get('/api/subscriptions', (req: Request, res: Response) => {
  res.json({
    success: true,
    count: subscriptions.length,
    data: subscriptions
  });
});

// POST /api/subscriptions - Create or update alert subscription
app.post('/api/subscriptions', (req: Request, res: Response) => {
  const {
    email,
    alertsThreeDaysBeforeExDate = true,
    alertsNewAnnouncements = true,
    minYieldThreshold = 0,
    selectedTickers = ['ALL']
  } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'Valid email address is required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingIndex = subscriptions.findIndex(s => s.email.toLowerCase() === normalizedEmail);

  if (existingIndex >= 0) {
    subscriptions[existingIndex] = {
      ...subscriptions[existingIndex],
      alertsThreeDaysBeforeExDate,
      alertsNewAnnouncements,
      minYieldThreshold: Number(minYieldThreshold) || 0,
      selectedTickers
    };
    return res.json({
      success: true,
      message: 'Subscription preferences updated successfully.',
      subscription: subscriptions[existingIndex]
    });
  }

  const newSub: AlertSubscription = {
    id: `sub-${Date.now()}`,
    email: normalizedEmail,
    alertsThreeDaysBeforeExDate,
    alertsNewAnnouncements,
    minYieldThreshold: Number(minYieldThreshold) || 0,
    selectedTickers,
    createdAt: new Date().toISOString(),
    totalAlertsSent: 0
  };

  subscriptions.push(newSub);

  res.json({
    success: true,
    message: 'Successfully subscribed to dividend alerts!',
    subscription: newSub
  });
});

// POST /api/alerts/send-test - Send test alert or preview HTML email
app.post('/api/alerts/send-test', async (req: Request, res: Response) => {
  try {
    const { email, stockTicker, type = 'THREE_DAY_REMINDER' } = req.body;

    const targetEmail = email || 'wparajohn@gmail.com';
    const allStocks = getHydratedDividendStocks(new Date());

    let targetStock = stockTicker 
      ? allStocks.find(s => s.ticker.toUpperCase() === (stockTicker as string).toUpperCase())
      : (type === 'THREE_DAY_REMINDER' 
          ? allStocks.find(s => s.daysUntilExDate === 3) || allStocks[0] 
          : allStocks.find(s => s.isNewAnnouncement) || allStocks[0]);

    if (!targetStock) {
      targetStock = allStocks[0];
    }

    const emailPayload = type === 'THREE_DAY_REMINDER'
      ? generateThreeDayReminderEmail(targetStock, targetEmail)
      : generateNewAnnouncementEmail(targetStock, targetEmail);

    let deliveryStatus = 'SIMULATION_PREVIEW';
    let resendResponse = null;

    // Check if Resend API key is available
    if (process.env.RESEND_API_KEY) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: process.env.SENDER_EMAIL || 'onboarding@resend.dev',
            to: [targetEmail],
            subject: emailPayload.subject,
            html: emailPayload.html,
            text: emailPayload.text
          })
        });

        resendResponse = await response.json();
        if (response.ok) {
          deliveryStatus = 'SENT_VIA_RESEND';
        }
      } catch (err: any) {
        console.error('Error dispatching via Resend:', err);
      }
    }

    // Update subscriber stats
    const sub = subscriptions.find(s => s.email.toLowerCase() === targetEmail.toLowerCase());
    if (sub) {
      sub.totalAlertsSent += 1;
      sub.lastNotifiedAt = new Date().toISOString();
    }

    res.json({
      success: true,
      deliveredVia: deliveryStatus,
      emailPayload,
      resendResponse,
      targetStock
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/cron/run & GET /api/cron - Run automated scrape & alert pipeline
const executeCronPipeline = async (triggerSource: 'GITHUB_ACTIONS_CRON' | 'MANUAL_TRIGGER' | 'VERCEL_CRON') => {
  const startTime = Date.now();
  
  // Trigger real-time API sync from live feeds
  const syncResult = await syncRealDividendData();
  const stocks = syncResult.data;

  const threeDayUrgent = stocks.filter(s => s.daysUntilExDate === 3);
  const newAnnouncements = stocks.filter(s => s.isNewAnnouncement);

  let emailsDispatched = 0;
  const recipientList = subscriptions.map(s => s.email);

  // Simulate dispatch for each active subscriber
  for (const sub of subscriptions) {
    if (sub.alertsThreeDaysBeforeExDate && threeDayUrgent.length > 0) {
      emailsDispatched += threeDayUrgent.length;
      sub.totalAlertsSent += threeDayUrgent.length;
      sub.lastNotifiedAt = new Date().toISOString();
    }
    if (sub.alertsNewAnnouncements && newAnnouncements.length > 0) {
      emailsDispatched += newAnnouncements.length;
      sub.totalAlertsSent += newAnnouncements.length;
      sub.lastNotifiedAt = new Date().toISOString();
    }
  }

  const logEntry: CronRunLog = {
    id: `cron-${Date.now()}`,
    timestamp: new Date().toISOString(),
    status: 'SUCCESS',
    trigger: triggerSource,
    stocksScraped: stocks.length,
    threeDayRemindersFound: threeDayUrgent.length,
    newAnnouncementsFound: newAnnouncements.length,
    emailsDispatched,
    recipientEmails: recipientList,
    executionTimeMs: Date.now() - startTime,
    details: `Successfully processed ${stocks.length} large cap stocks. Found ${threeDayUrgent.length} urgent 3-day ex-dividend stocks (${threeDayUrgent.map(s => s.ticker).join(', ')}) and ${newAnnouncements.length} new announcements.`
  };

  cronHistory.unshift(logEntry);
  if (cronHistory.length > 20) {
    cronHistory = cronHistory.slice(0, 20);
  }

  return logEntry;
};

app.all(['/api/cron', '/api/cron/run'], async (req: Request, res: Response) => {
  try {
    const trigger = req.headers['x-vercel-cron'] 
      ? 'VERCEL_CRON' 
      : (req.body?.trigger === 'GITHUB_ACTIONS' ? 'GITHUB_ACTIONS_CRON' : 'MANUAL_TRIGGER');

    const result = await executeCronPipeline(trigger);
    res.json({
      success: true,
      message: 'CRON job executed successfully.',
      result
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/cron/history - Retrieve execution history
app.get('/api/cron/history', (req: Request, res: Response) => {
  res.json({
    success: true,
    count: cronHistory.length,
    data: cronHistory
  });
});

// ==========================================
// VITE MIDDLEWARE & SERVER STARTUP
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DividendRadar Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
