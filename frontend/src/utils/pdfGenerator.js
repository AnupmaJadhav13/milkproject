/**
 * pdfGenerator.js
 * Generates PDF HTML for Farmer-wise and Center-wise (Collection) reports.
 * Format matches the reference image: tabular layout with
 * Date | Code | Name | Shift | Milk | Liter | FAT | SNF | CLR | Rate | Amount | Pouring | Unit
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const n2 = (v) => Number(v || 0).toFixed(2);
const n1 = (v) => Number(v || 0).toFixed(1);
const nInt = (v) => Number(v || 0).toFixed(0);

// ─── Shared CSS ───────────────────────────────────────────────────────────────
const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; padding: 16px; }
  .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
  .org-name { font-size: 18px; font-weight: 900; color: #1a1a1a; }
  .org-address { font-size: 11px; color: #555; margin-top: 2px; }
  .report-title { font-size: 16px; font-weight: 800; color: #2563eb; text-align: right; }
  .divider { border: none; border-top: 2px solid #2563eb; margin: 8px 0 10px 0; }
  .date-range { font-size: 12px; font-weight: 700; margin-bottom: 10px; }
  .date-range span { font-weight: 400; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  thead tr th {
    background: #e8f0fe; color: #1a1a1a; font-size: 10px; font-weight: 700;
    padding: 6px 4px; text-align: center; border: 1px solid #b0c4de;
  }
  tbody tr td {
    padding: 5px 4px; text-align: center; border: 1px solid #d0d8e8;
    font-size: 10px; vertical-align: middle;
  }
  tbody tr:nth-child(even) td { background: #f5f8ff; }
  tbody tr:nth-child(odd) td { background: #ffffff; }
  .td-name { text-align: left; padding-left: 6px; }
  tfoot tr td {
    background: #e8f0fe; font-weight: 800; font-size: 10px;
    padding: 6px 4px; text-align: center; border: 1px solid #b0c4de;
  }
  .summary-section { margin-top: 14px; background: #f0f4ff; border-radius: 6px; padding: 10px 14px; }
  .summary-title { font-size: 12px; font-weight: 800; color: #2563eb; margin-bottom: 8px; }
  .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .summary-item { background: white; border-radius: 4px; padding: 8px; text-align: center; border: 1px solid #d0d8e8; }
  .summary-val { font-size: 14px; font-weight: 800; color: #2563eb; }
  .summary-lbl { font-size: 9px; color: #666; margin-top: 2px; }
  .footer { text-align: center; margin-top: 14px; font-size: 9px; color: #888; border-top: 1px solid #ddd; padding-top: 8px; }
`;


export const generateFarmerReportPDF = (data) => {
  const { farmer, dateRange, summary, reportRows = [] } = data || {};
  const farmerName = farmer?.fullName || '—';
  const farmerCode = farmer?.farmerCode || '—';
  const centerName = farmer?.center?.name || '—';
  const centerAddress = farmer?.center?.village || '';

  const rows = reportRows.map((r, i) => `
    <tr>
      <td>${fmtDate(r.date)}</td>
      <td>${farmerCode}</td>
      <td class="td-name">${farmerName}</td>
      <td>${r.shift === 'Morning' ? 'M' : 'E'}</td>
      <td>${r.animalType === 'Cow' ? 'C' : 'B'}</td>
      <td>${n2(r.milkLiter)}</td>
      <td>${n1(r.fat)}</td>
      <td>${n1(r.snf)}</td>
      <td>0.0</td>
      <td>${n2(r.rate || 0)}</td>
      <td>${n2(r.totalAmount)}</td>
      <td>1</td>
      <td>Ltr</td>
    </tr>`).join('');

  const totalLiters = reportRows.reduce((s, r) => s + Number(r.milkLiter || 0), 0);
  const totalAmt = reportRows.reduce((s, r) => s + Number(r.totalAmount || 0), 0);
  const avgFat = summary?.avgFat || 0;
  const avgSnf = summary?.avgSnf || 0;
  const avgRate = totalLiters > 0 ? (totalAmt / totalLiters) : 0;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>${BASE_CSS}</style></head>
<body>
  <div class="page-header">
    <div>
      <div class="org-name">Sarvasvaa Milk</div>
      <div class="org-address">${centerAddress ? centerAddress + ', ' : ''}${centerName}</div>
    </div>
    <div class="report-title">Collection Report</div>
  </div>
  <hr class="divider"/>
  <div class="date-range">Date: <span>${fmtDate(dateRange?.fromDate)} To ${fmtDate(dateRange?.toDate)}</span></div>

  <table>
    <thead>
      <tr>
        <th>Date</th><th>Code</th><th>Name</th><th>Shift</th><th>Milk</th>
        <th>Liter</th><th>FAT</th><th>SNF</th><th>CLR</th>
        <th>Rate</th><th>Amount</th><th>Pouring</th><th>Unit</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td></td>
        <td>${reportRows.length}</td>
        <td class="td-name">TOTAL</td>
        <td></td><td></td>
        <td>${n2(totalLiters)}</td>
        <td>${n1(avgFat)}</td>
        <td>${n1(avgSnf)}</td>
        <td>0.0</td>
        <td>${n2(avgRate)}</td>
        <td>${n2(totalAmt)}</td>
        <td></td><td></td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">
    Sarvasvaa Milk &bull; ${farmerName} (${farmerCode}) &bull; Generated on ${fmtDate(new Date())}
  </div>
</body>
</html>`;

  return html;
};

// ─── Center-wise Report PDF ───────────────────────────────────────────────────

export const generateCenterReportPDF = (data) => {
  const { center, dateRange, summary, farmerSummary = [] } = data || {};
  const centerName = center?.name || '—';
  const centerAddress = center?.village || '';
  const centerCode = center?.centerCode || '';

  const rows = farmerSummary.map((f, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${f.farmerCode || '—'}</td>
      <td class="td-name">${f.farmerName || '—'}</td>
      <td>${f.totalDays || 0}</td>
      <td>${n2(f.totalLiters)}</td>
      <td>${n1(f.avgFat)}</td>
      <td>${n1(f.avgSnf)}</td>
      <td>0.0</td>
      <td>${n2(f.avgRate || 0)}</td>
      <td>${n2(f.totalAmount)}</td>
    </tr>`).join('');

  const totalLiters = Number(summary?.totalMilkLiters || 0);
  const totalAmt = Number(summary?.totalCollectionAmount || 0);
  const avgFat = Number(summary?.avgFat || 0);
  const avgSnf = Number(summary?.avgSnf || 0);

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>${BASE_CSS}</style></head>
<body>
  <div class="page-header">
    <div>
      <div class="org-name">Sarvasvaa Milk</div>
      <div class="org-address">${centerAddress ? centerAddress + ', ' : ''}${centerName}${centerCode ? ' (' + centerCode + ')' : ''}</div>
    </div>
    <div class="report-title">Collection Report</div>
  </div>
  <hr class="divider"/>
  <div class="date-range">Date: <span>${fmtDate(dateRange?.fromDate)} To ${fmtDate(dateRange?.toDate)}</span></div>

  <table>
    <thead>
      <tr>
        <th>#</th><th>Code</th><th>Name</th><th>Days</th>
        <th>Liter</th><th>FAT</th><th>SNF</th><th>CLR</th>
        <th>Rate</th><th>Amount</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td></td>
        <td>${farmerSummary.length}</td>
        <td class="td-name">TOTAL</td>
        <td>${summary?.totalCollectionEntries || 0}</td>
        <td>${n2(totalLiters)}</td>
        <td>${n1(avgFat)}</td>
        <td>${n1(avgSnf)}</td>
        <td>0.0</td>
        <td></td>
        <td>${n2(totalAmt)}</td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">
    Sarvasvaa Milk &bull; ${centerName} &bull; Generated on ${fmtDate(new Date())}
  </div>
</body>
</html>`;

  return html;
};

// ─── Farmer Self-Report PDF (used in FarmerReportScreen) ─────────────────────

export const generateFarmerSelfReportPDF = ({ entries, summary, user, fromDate, toDate }) => {
  const farmerName = user?.name || '—';
  const farmerCode = user?.farmerCode || '—';
  const centerName = user?.centerName || '—';

  const fmtD = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const rows = entries.map((e, i) => `
    <tr>
      <td>${fmtDate(e.date)}</td>
      <td>${farmerCode}</td>
      <td class="td-name">${farmerName}</td>
      <td>${e.shift === 'Morning' ? 'M' : 'E'}</td>
      <td>${e.animalType === 'Cow' ? 'C' : 'B'}</td>
      <td>${n2(e.quantityLiters)}</td>
      <td>${n1(e.fat)}</td>
      <td>${n1(e.snf)}</td>
      <td>0.0</td>
      <td>${n2(e.ratePerLiter)}</td>
      <td>${n2(e.amountInr)}</td>
      <td>1</td>
      <td>Ltr</td>
    </tr>`).join('');

  const totalLiters = Number(summary?.totalMilkLiters || 0);
  const totalAmt = Number(summary?.totalAmountInr || 0);
  const avgFat = Number(summary?.avgFat || 0);
  const avgSnf = Number(summary?.avgSnf || 0);
  const avgRate = totalLiters > 0 ? (totalAmt / totalLiters) : 0;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>${BASE_CSS}</style></head>
<body>
  <div class="page-header">
    <div>
      <div class="org-name">Sarvasvaa Milk</div>
      <div class="org-address">${centerName}</div>
    </div>
    <div class="report-title">Collection Report</div>
  </div>
  <hr class="divider"/>
  <div class="date-range">Date: <span>${fmtD(fromDate)} To ${fmtD(toDate)}</span></div>

  <table>
    <thead>
      <tr>
        <th>Date</th><th>Code</th><th>Name</th><th>Shift</th><th>Milk</th>
        <th>Liter</th><th>FAT</th><th>SNF</th><th>CLR</th>
        <th>Rate</th><th>Amount</th><th>Pouring</th><th>Unit</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td></td>
        <td>${entries.length}</td>
        <td class="td-name">TOTAL</td>
        <td></td><td></td>
        <td>${n2(totalLiters)}</td>
        <td>${n1(avgFat)}</td>
        <td>${n1(avgSnf)}</td>
        <td>0.0</td>
        <td>${n2(avgRate)}</td>
        <td>${n2(totalAmt)}</td>
        <td></td><td></td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">
    Sarvasvaa Milk &bull; ${farmerName} (${farmerCode}) &bull; Generated on ${fmtDate(new Date())}
  </div>
</body>
</html>`;

  return html;
};

// ─── Print & Share ────────────────────────────────────────────────────────────
/**
 * @param {string} html  - HTML string to render as PDF
 * @param {string} filename - suggested filename (without .pdf)
 * @returns {{ success: boolean, uri?: string, error?: string }}
 */
export const printAndSharePDF = async (html, filename = 'report') => {
  try {
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Report',
        UTI: 'com.adobe.pdf',
      });
    }
    return { success: true, uri };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
