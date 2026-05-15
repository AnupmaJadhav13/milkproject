import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const DAIRY_NAME = 'Sarvasvaa Milk';

// ─── HTML helpers ────────────────────────────────────────────────────────────

const baseStyles = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1A2B28; background: #fff; }
    .header { background: #2C7A6E; color: white; padding: 20px 24px; }
    .header h1 { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
    .header p { font-size: 12px; opacity: 0.85; }
    .meta-row { display: flex; justify-content: space-between; padding: 12px 24px; background: #F4F7F6; border-bottom: 1px solid #D9E8E5; }
    .meta-item { text-align: center; }
    .meta-label { font-size: 10px; color: #7A9690; text-transform: uppercase; letter-spacing: 0.5px; }
    .meta-value { font-size: 14px; font-weight: 700; color: #1A2B28; margin-top: 2px; }
    .section { padding: 16px 24px; }
    .section-title { font-size: 13px; font-weight: 700; color: #2C7A6E; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; border-bottom: 2px solid #CCEAE4; padding-bottom: 4px; }
    .summary-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
    .summary-box { flex: 1; min-width: 120px; background: #E6F3F1; border-radius: 8px; padding: 10px 12px; }
    .summary-box .label { font-size: 10px; color: #2C7A6E; text-transform: uppercase; }
    .summary-box .value { font-size: 16px; font-weight: 800; color: #1A2B28; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #2C7A6E; color: white; padding: 8px 6px; text-align: left; font-size: 10px; text-transform: uppercase; }
    td { padding: 7px 6px; border-bottom: 1px solid #ECF2F1; }
    tr:nth-child(even) td { background: #F8FAFA; }
    .total-row td { font-weight: 700; background: #E6F3F1; border-top: 2px solid #2C7A6E; }
    .footer { padding: 20px 24px; border-top: 2px solid #D9E8E5; margin-top: 16px; }
    .sig-row { display: flex; justify-content: space-between; margin-top: 40px; }
    .sig-box { text-align: center; width: 160px; }
    .sig-line { border-top: 1px solid #1A2B28; padding-top: 6px; font-size: 11px; color: #7A9690; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; }
    .badge-green { background: #E6F5EF; color: #22896B; }
    .badge-orange { background: #FEF4E6; color: #C87A1B; }
    .badge-red { background: #FDECEB; color: #C0392B; }
  </style>
`;

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const formatNum = (n, d = 2) => Number(n || 0).toFixed(d);

// ─── Center Report PDF ────────────────────────────────────────────────────────

export const generateCenterReportPDF = async (reportData) => {
  const { center, dateRange, summary, farmerSummary } = reportData;

  const farmerRows = (farmerSummary || []).map((f, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${f.farmerCode || '—'}</td>
      <td>${f.farmerName || '—'}</td>
      <td>${formatNum(f.totalLiters)} L</td>
      <td>${formatNum(f.avgFat, 1)}</td>
      <td>${formatNum(f.avgSnf, 1)}</td>
      <td>${f.totalDays || 0}</td>
      <td>${formatINR(f.totalAmount)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8">${baseStyles}</head>
    <body>
      <div class="header">
        <h1>${DAIRY_NAME}</h1>
        <p>Collection Center Report · Generated on ${new Date().toLocaleDateString('en-IN')}</p>
      </div>

      <div class="meta-row">
        <div class="meta-item">
          <div class="meta-label">Center</div>
          <div class="meta-value">${center?.name || '—'}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Center Code</div>
          <div class="meta-value">${center?.centerCode || '—'}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">From</div>
          <div class="meta-value">${dateRange?.fromDate || '—'}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">To</div>
          <div class="meta-value">${dateRange?.toDate || '—'}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Summary</div>
        <div class="summary-grid">
          <div class="summary-box">
            <div class="label">Total Farmers</div>
            <div class="value">${summary?.totalFarmers || 0}</div>
          </div>
          <div class="summary-box">
            <div class="label">Total Milk</div>
            <div class="value">${formatNum(summary?.totalMilkLiters)} L</div>
          </div>
          <div class="summary-box">
            <div class="label">Avg FAT</div>
            <div class="value">${formatNum(summary?.avgFat, 1)}</div>
          </div>
          <div class="summary-box">
            <div class="label">Avg SNF</div>
            <div class="value">${formatNum(summary?.avgSnf, 1)}</div>
          </div>
          <div class="summary-box">
            <div class="label">Total Entries</div>
            <div class="value">${summary?.totalCollectionEntries || 0}</div>
          </div>
          <div class="summary-box">
            <div class="label">Total Amount</div>
            <div class="value">${formatINR(summary?.totalCollectionAmount)}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Farmer-wise Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Code</th>
              <th>Farmer Name</th>
              <th>Total Milk</th>
              <th>Avg FAT</th>
              <th>Avg SNF</th>
              <th>Days</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${farmerRows}
            <tr class="total-row">
              <td colspan="3">TOTAL</td>
              <td>${formatNum(summary?.totalMilkLiters)} L</td>
              <td>${formatNum(summary?.avgFat, 1)}</td>
              <td>${formatNum(summary?.avgSnf, 1)}</td>
              <td>${summary?.totalCollectionEntries || 0}</td>
              <td>${formatINR(summary?.totalCollectionAmount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p style="font-size:11px;color:#7A9690;">This is a computer-generated report. ${DAIRY_NAME} · ${new Date().toLocaleString('en-IN')}</p>
        <div class="sig-row">
          <div class="sig-box">
            <div class="sig-line">Collection Head Signature</div>
          </div>
          <div class="sig-box">
            <div class="sig-line">Admin Signature</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
};

// ─── Farmer Report PDF ────────────────────────────────────────────────────────

export const generateFarmerReportPDF = async (reportData) => {
  const { farmer, dateRange, summary, reportRows } = reportData;

  const tableRows = (reportRows || []).map((r, i) => `
    <tr>
      <td>${r.date}</td>
      <td>${r.shift}</td>
      <td>${r.animalType}</td>
      <td>${formatNum(r.milkLiter)} L</td>
      <td>${formatNum(r.fat, 1)}</td>
      <td>${formatNum(r.snf, 1)}</td>
      <td>${formatINR(r.milkRate)}/L</td>
      <td>${formatINR(r.totalAmount)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8">${baseStyles}</head>
    <body>
      <div class="header">
        <h1>${DAIRY_NAME}</h1>
        <p>Farmer Milk Collection Report · Generated on ${new Date().toLocaleDateString('en-IN')}</p>
      </div>

      <div class="meta-row">
        <div class="meta-item">
          <div class="meta-label">Farmer</div>
          <div class="meta-value">${farmer?.fullName || '—'}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Farmer Code</div>
          <div class="meta-value">${farmer?.farmerCode || '—'}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Center</div>
          <div class="meta-value">${farmer?.center?.name || '—'}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Animal Type</div>
          <div class="meta-value">${farmer?.animalType || '—'}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Period</div>
          <div class="meta-value">${dateRange?.fromDate} – ${dateRange?.toDate}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Summary</div>
        <div class="summary-grid">
          <div class="summary-box">
            <div class="label">Milk Days</div>
            <div class="value">${summary?.totalMilkDays || 0}</div>
          </div>
          <div class="summary-box">
            <div class="label">Total Milk</div>
            <div class="value">${formatNum(summary?.totalMilkLiters)} L</div>
          </div>
          <div class="summary-box">
            <div class="label">Avg FAT</div>
            <div class="value">${formatNum(summary?.avgFat, 1)}</div>
          </div>
          <div class="summary-box">
            <div class="label">Avg SNF</div>
            <div class="value">${formatNum(summary?.avgSnf, 1)}</div>
          </div>
          <div class="summary-box">
            <div class="label">Morning</div>
            <div class="value">${summary?.morningEntries || 0}</div>
          </div>
          <div class="summary-box">
            <div class="label">Evening</div>
            <div class="value">${summary?.eveningEntries || 0}</div>
          </div>
          <div class="summary-box">
            <div class="label">Total Amount</div>
            <div class="value">${formatINR(summary?.totalAmount)}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Daily Collection Records</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Shift</th>
              <th>Animal</th>
              <th>Milk (L)</th>
              <th>FAT</th>
              <th>SNF</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            <tr class="total-row">
              <td colspan="3">TOTAL</td>
              <td>${formatNum(summary?.totalMilkLiters)} L</td>
              <td>${formatNum(summary?.avgFat, 1)}</td>
              <td>${formatNum(summary?.avgSnf, 1)}</td>
              <td>—</td>
              <td>${formatINR(summary?.totalAmount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p style="font-size:11px;color:#7A9690;">This is a computer-generated report. ${DAIRY_NAME} · ${new Date().toLocaleString('en-IN')}</p>
        <div class="sig-row">
          <div class="sig-box">
            <div class="sig-line">Farmer Signature</div>
          </div>
          <div class="sig-box">
            <div class="sig-line">Admin Signature</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
};

// ─── Print & Share ────────────────────────────────────────────────────────────

export const printAndSharePDF = async (html, filename = 'report') => {
  try {
    const { uri } = await Print.printToFileAsync({ html, base64: false });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share ${filename}`,
        UTI: 'com.adobe.pdf'
      });
    } else {
      await Print.printAsync({ uri });
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};
