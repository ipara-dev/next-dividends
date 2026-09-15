import { DividendStock } from '../types';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
  type: 'THREE_DAY_REMINDER' | 'NEW_ANNOUNCEMENT' | 'DAILY_DIGEST';
  stockTicker?: string;
}

export function generateThreeDayReminderEmail(stock: DividendStock, recipientEmail: string): EmailPayload {
  const subject = `⏰ 3-Day Action Alert: ${stock.ticker} Ex-Dividend Date is ${stock.exDividendDate} (${stock.dividendYield}% Yield)`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669, #0d9488); padding: 24px 28px; text-align: left;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: #d1fae5; margin-bottom: 6px;">
                ⚡ URGENT: 3 DAYS BEFORE EX-DATE
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                ${stock.name} (${stock.ticker}) Ex-Dividend Warning
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 14px; color: #a7f3d0;">
                Act within 72 hours to lock in your upcoming dividend payout.
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 28px;">
              <div style="background-color: #0f172a; border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 6px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">
                  <strong style="color: #34d399;">Crucial Rule:</strong> You must purchase shares <em>before</em> market close on the day prior to <strong>${stock.exDividendDate}</strong>. If you buy on or after the ex-dividend date, the dividend goes to the seller.
                </p>
              </div>

              <!-- Metrics Grid -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td width="50%" style="padding: 12px; background-color: #182234; border-radius: 8px; vertical-align: top;">
                    <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Dividend Yield</div>
                    <div style="font-size: 24px; font-weight: 800; color: #10b981; margin-top: 4px;">${stock.dividendYield.toFixed(2)}%</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 2px;">$${stock.annualDividend.toFixed(2)} annual / share</div>
                  </td>
                  <td width="4%"></td>
                  <td width="46%" style="padding: 12px; background-color: #182234; border-radius: 8px; vertical-align: top;">
                    <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Payout Per Share</div>
                    <div style="font-size: 24px; font-weight: 800; color: #f8fafc; margin-top: 4px;">$${stock.dividendAmount.toFixed(4)}</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Frequency: ${stock.frequency}</div>
                  </td>
                </tr>
              </table>

              <!-- Schedule Timeline -->
              <h3 style="font-size: 14px; font-weight: 700; color: #f1f5f9; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">
                Key Dates Schedule
              </h3>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; border-radius: 8px; border: 1px solid #334155; overflow: hidden; margin-bottom: 24px;">
                <tr style="border-bottom: 1px solid #1e293b;">
                  <td style="padding: 12px 16px; font-size: 13px; color: #94a3b8;">⏰ Ex-Dividend Date (Deadline)</td>
                  <td style="padding: 12px 16px; font-size: 14px; font-weight: 700; color: #f43f5e; text-align: right;">${stock.exDividendDate} (In 3 Days)</td>
                </tr>
                <tr style="border-bottom: 1px solid #1e293b;">
                  <td style="padding: 12px 16px; font-size: 13px; color: #94a3b8;">📋 Record Date</td>
                  <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #cbd5e1; text-align: right;">${stock.recordDate}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #94a3b8;">💰 Payment Date (Cash Payout)</td>
                  <td style="padding: 12px 16px; font-size: 14px; font-weight: 700; color: #10b981; text-align: right;">${stock.paymentDate}</td>
                </tr>
              </table>

              <!-- Company Snapshot -->
              <div style="background-color: #182234; padding: 14px; border-radius: 8px; font-size: 13px; color: #cbd5e1; line-height: 1.5; margin-bottom: 24px;">
                <strong>Company Profile:</strong> ${stock.description}<br />
                <span style="color: #64748b; font-size: 12px;">Sector: ${stock.sector} | Market Cap: $${stock.marketCapBillions}B | Dividend Streak: ${stock.growthStreakYears} yrs | Safety Score: ${stock.safetyScore}</span>
              </div>

              <!-- Estimated Cash Table -->
              <div style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px;">Estimated Payout Calculation</div>
              <table width="100%" border="0" cellspacing="0" cellpadding="8" style="background-color: #0f172a; border-radius: 6px; font-size: 12px; color: #94a3b8; margin-bottom: 24px;">
                <tr>
                  <td>Holding 100 shares</td>
                  <td style="text-align: right; color: #f8fafc; font-weight: 600;">$${(stock.dividendAmount * 100).toFixed(2)} cash payout</td>
                </tr>
                <tr>
                  <td>Holding 500 shares</td>
                  <td style="text-align: right; color: #f8fafc; font-weight: 600;">$${(stock.dividendAmount * 500).toFixed(2)} cash payout</td>
                </tr>
                <tr>
                  <td>Holding 1,000 shares</td>
                  <td style="text-align: right; color: #10b981; font-weight: 700;">$${(stock.dividendAmount * 1000).toFixed(2)} cash payout</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px 28px; border-top: 1px solid #334155; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                You received this alert because you subscribed to 3-day ex-dividend warnings for Large-Cap stocks on <strong>${recipientEmail}</strong>.
              </p>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #475569;">
                Automated by GitHub Actions CRON & Large Cap Dividend Radar.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
URGENT: 3 DAYS BEFORE EX-DIVIDEND DATE
${stock.name} (${stock.ticker})

Ex-Dividend Date: ${stock.exDividendDate} (In 3 Days)
Dividend Yield: ${stock.dividendYield.toFixed(2)}%
Payout Per Share: $${stock.dividendAmount.toFixed(4)}
Payment Date: ${stock.paymentDate}

Remember: You must purchase shares prior to ${stock.exDividendDate} to receive this payout.
Sent to ${recipientEmail} by Large Cap Dividend Tracker & Alerts.
  `.trim();

  return {
    to: recipientEmail,
    subject,
    html,
    text,
    type: 'THREE_DAY_REMINDER',
    stockTicker: stock.ticker
  };
}

export function generateNewAnnouncementEmail(stock: DividendStock, recipientEmail: string): EmailPayload {
  const subject = `📢 New Dividend Declared: ${stock.ticker} announced $${stock.dividendAmount.toFixed(4)}/share (${stock.dividendYield.toFixed(2)}% Yield)`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb, #3b82f6); padding: 24px 28px; text-align: left;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: #bfdbfe; margin-bottom: 6px;">
                📢 NEW DIVIDEND ANNOUNCEMENT
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">
                ${stock.name} (${stock.ticker})
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 14px; color: #dbeafe;">
                Fresh declaration detected by daily automated market scraping.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td width="50%" style="padding: 12px; background-color: #182234; border-radius: 8px;">
                    <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Declared Amount</div>
                    <div style="font-size: 22px; font-weight: 800; color: #60a5fa; margin-top: 4px;">$${stock.dividendAmount.toFixed(4)}</div>
                    <div style="font-size: 11px; color: #64748b;">${stock.frequency}</div>
                  </td>
                  <td width="4%"></td>
                  <td width="46%" style="padding: 12px; background-color: #182234; border-radius: 8px;">
                    <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Current Yield</div>
                    <div style="font-size: 22px; font-weight: 800; color: #34d399; margin-top: 4px;">${stock.dividendYield.toFixed(2)}%</div>
                    <div style="font-size: 11px; color: #64748b;">$${stock.annualDividend.toFixed(2)} annual</div>
                  </td>
                </tr>
              </table>

              <table width="100%" border="0" cellspacing="0" cellpadding="10" style="background-color: #0f172a; border-radius: 8px; font-size: 13px; color: #cbd5e1; margin-bottom: 24px;">
                <tr>
                  <td style="color: #94a3b8;">Declaration Date:</td>
                  <td style="text-align: right; font-weight: 600;">${stock.declarationDate}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8;">Ex-Dividend Date:</td>
                  <td style="text-align: right; font-weight: 700; color: #38bdf8;">${stock.exDividendDate} (in ${stock.daysUntilExDate} days)</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8;">Pay Date:</td>
                  <td style="text-align: right; font-weight: 600; color: #10b981;">${stock.paymentDate}</td>
                </tr>
              </table>

              <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 0;">
                You will also receive an automated warning <strong>3 days prior to ${stock.exDividendDate}</strong> so you never miss this distribution.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #0f172a; padding: 16px 28px; border-top: 1px solid #334155; text-align: center; font-size: 11px; color: #64748b;">
              Large Cap Dividend Tracker &bull; Delivered to ${recipientEmail}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
NEW DIVIDEND ANNOUNCED: ${stock.name} (${stock.ticker})
Amount: $${stock.dividendAmount.toFixed(4)} (${stock.frequency})
Dividend Yield: ${stock.dividendYield.toFixed(2)}%
Ex-Dividend Date: ${stock.exDividendDate} (in ${stock.daysUntilExDate} days)
Pay Date: ${stock.paymentDate}
  `.trim();

  return {
    to: recipientEmail,
    subject,
    html,
    text,
    type: 'NEW_ANNOUNCEMENT',
    stockTicker: stock.ticker
  };
}
