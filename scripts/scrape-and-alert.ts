/**
 * Large Cap Dividend Scraper & Alert Dispatcher Script
 * Designed to run via GitHub Actions CRON (daily) or Vercel Cron.
 *
 * Usage:
 *   npx tsx scripts/scrape-and-alert.ts
 *
 * Environment variables:
 *   RESEND_API_KEY: (Optional) API key for sending real emails via Resend
 *   SENDER_EMAIL:   (Optional) Sender email address (default: alerts@resend.dev)
 *   MAILING_LIST:   (Optional) Comma-separated emails to receive alerts
 *   APP_URL:        (Optional) Hosted application URL
 */

import { syncRealDividendData } from '../src/services/dividendApiService';
import { generateThreeDayReminderEmail, generateNewAnnouncementEmail } from '../src/utils/emailTemplate';

async function runScraperAndAlerter() {
  console.log('=====================================================');
  console.log('🚀 STARTING NEXT DIVIDENDS DAILY SCRAPER & ALERTER JOB');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log('=====================================================');

  // Pull real live data from Nasdaq and Yahoo Finance APIs
  console.log('📡 Contacting live market feeds (Nasdaq Calendar & Yahoo Finance)...');
  const syncResult = await syncRealDividendData();
  const stocks = syncResult.data;
  console.log(`📊 Scraped ${stocks.length} large-cap dividend stocks from market feeds (${syncResult.source}).`);
  console.log(`ℹ️ Live Sync Details: ${syncResult.details}`);

  // 1. Identify stocks with ex-dividend date exactly 3 days away
  const threeDayUrgent = stocks.filter(s => s.daysUntilExDate === 3);
  console.log(`\n🎯 3-DAY EX-DIVIDEND WARNING TARGETS: found ${threeDayUrgent.length} stocks:`);
  threeDayUrgent.forEach(s => {
    console.log(`  👉 [${s.ticker}] ${s.name} - Ex-Date: ${s.exDividendDate} | Yield: ${s.dividendYield}% | Payout: $${s.dividendAmount}`);
  });

  // 2. Identify new dividend announcements (declared in past 48h)
  const newAnnouncements = stocks.filter(s => s.isNewAnnouncement);
  console.log(`\n📢 NEW DIVIDEND ANNOUNCEMENTS (Past 48h): found ${newAnnouncements.length} stocks:`);
  newAnnouncements.forEach(s => {
    console.log(`  👉 [${s.ticker}] ${s.name} - Declared: ${s.declarationDate} | Ex-Date: ${s.exDividendDate} | Yield: ${s.dividendYield}%`);
  });

  // 3. Mailing List resolution
  const envMailingList = process.env.MAILING_LIST 
    ? process.env.MAILING_LIST.split(',').map(e => e.trim()).filter(Boolean)
    : ['wparajohn@gmail.com']; // default target

  console.log(`\n📬 Target Mailing List Recipients (${envMailingList.length}):`, envMailingList);

  const resendApiKey = process.env.RESEND_API_KEY;
  let emailsSentCount = 0;

  for (const recipient of envMailingList) {
    // A. Send 3-day reminder warnings
    for (const stock of threeDayUrgent) {
      const email = generateThreeDayReminderEmail(stock, recipient);
      console.log(`\n✉️ Dispatching 3-Day Warning: "${email.subject}" -> ${recipient}`);

      if (resendApiKey) {
        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
              from: process.env.SENDER_EMAIL || 'onboarding@resend.dev',
              to: [recipient],
              subject: email.subject,
              html: email.html,
              text: email.text
            })
          });
          const result = await res.json();
          console.log(`   ✅ Sent via Resend API:`, result);
          emailsSentCount++;
        } catch (err) {
          console.error(`   ❌ Failed sending via Resend:`, err);
        }
      } else {
        console.log(`   ℹ️ [DRY RUN / SIMULATION]: RESEND_API_KEY not set. Email payload generated successfully.`);
        emailsSentCount++;
      }
    }

    // B. Send new announcement alerts
    for (const stock of newAnnouncements) {
      const email = generateNewAnnouncementEmail(stock, recipient);
      console.log(`\n✉️ Dispatching New Announcement Alert: "${email.subject}" -> ${recipient}`);

      if (resendApiKey) {
        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
              from: process.env.SENDER_EMAIL || 'onboarding@resend.dev',
              to: [recipient],
              subject: email.subject,
              html: email.html,
              text: email.text
            })
          });
          const result = await res.json();
          console.log(`   ✅ Sent via Resend API:`, result);
          emailsSentCount++;
        } catch (err) {
          console.error(`   ❌ Failed sending via Resend:`, err);
        }
      } else {
        console.log(`   ℹ️ [DRY RUN / SIMULATION]: RESEND_API_KEY not set. Email payload generated successfully.`);
        emailsSentCount++;
      }
    }
  }

  console.log('\n=====================================================');
  console.log(`🎉 SCRAPING & MAILING CRON COMPLETE`);
  console.log(`📈 Total Stocks Tracked: ${stocks.length}`);
  console.log(`⏰ 3-Day Warnings: ${threeDayUrgent.length}`);
  console.log(`📢 New Declarations: ${newAnnouncements.length}`);
  console.log(`📧 Total Alert Actions: ${emailsSentCount}`);
  console.log('=====================================================');
}

// Execute script if called directly
runScraperAndAlerter().catch((error) => {
  console.error('Fatal Error in scraper script:', error);
  process.exit(1);
});
