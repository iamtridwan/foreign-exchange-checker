import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Empty } from '../empty/empty';
import { ExchangeRateService } from '../../services/exchange-rate.service';

@Component({
  selector: 'app-log',
  imports: [CommonModule, Empty],
  templateUrl: './log.html',
  styleUrl: './log.css',
})
export class Log {
  public title = 'No conversions logged yet';
  public description = 'Every conversion is recorded here automatically when you tap LOG CONVERSION. Your log is private to this session and this browser.';
  
  // Dropdown visibility
  public isExportDropdownOpen = signal<boolean>(false);

  constructor(public fxService: ExchangeRateService) {}

  public toggleExportDropdown(): void {
    this.isExportDropdownOpen.update(v => !v);
  }

  public getRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);

    if (mins < 60) {
      return `${Math.max(1, mins)}M`;
    }
    if (hours < 24) {
      return `${hours}H`;
    }

    const date = new Date(timestamp);
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    return `${day} ${month}`;
  }

  public deleteEntry(id: string): void {
    this.fxService.deleteConversionLogEntry(id);
  }

  public clearAll(): void {
    this.fxService.clearConversionLog();
  }

  public exportCSV(): void {
    const logs = this.fxService.conversionLog();
    if (logs.length === 0) return;

    const headers = ['#', 'Date & Time', 'From Currency', 'From Amount', 'To Currency', 'To Amount', 'Rate'];
    const rows = logs.map((entry, idx) => {
      const dateStr = new Date(entry.timestamp).toISOString();
      const rate = entry.fromAmount !== 0 ? (entry.toAmount / entry.fromAmount).toFixed(6) : '0.000000';
      return [
        idx + 1,
        `"${dateStr}"`,
        `"${entry.fromCurrency}"`,
        entry.fromAmount,
        `"${entry.toCurrency}"`,
        entry.toAmount,
        rate
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fx_checker_conversions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.fxService.showToast('Export Success', 'CSV log file downloaded successfully.', 'success');
  }

  public exportPDF(): void {
    const logs = this.fxService.conversionLog();
    if (logs.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.fxService.showToast('Export Error', 'Could not open print window. Please allow popups for this site.', 'warning');
      return;
    }

    const title = 'FX Checker - Conversion Log Export';
    const dateStr = new Date().toLocaleString();

    let tableRows = '';
    logs.forEach((entry, idx) => {
      const rowDate = new Date(entry.timestamp).toLocaleString();
      const rate = entry.fromAmount !== 0 ? (entry.toAmount / entry.fromAmount).toFixed(4) : '0.0000';
      tableRows += `
        <tr>
          <td>${idx + 1}</td>
          <td>${rowDate}</td>
          <td>${entry.fromCurrency}</td>
          <td class="text-right font-mono">${entry.fromAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td>${entry.toCurrency}</td>
          <td class="text-right font-mono highlight">${entry.toAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td class="text-right font-mono text-muted">${rate}</td>
        </tr>
      `;
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            background-color: #ffffff;
            margin: 0;
            padding: 40px;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 24px;
            margin-bottom: 32px;
          }

          .brand {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.025em;
            color: #0f172a;
          }

          .brand span {
            color: #84cc16; /* lime-500 */
          }

          .meta {
            text-align: right;
            font-size: 13px;
            color: #64748b;
          }

          .meta-title {
            font-size: 14px;
            font-weight: 600;
            color: #334155;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          h1 {
            font-size: 20px;
            font-weight: 700;
            color: #1e293b;
            margin-top: 0;
            margin-bottom: 8px;
            letter-spacing: -0.02em;
          }

          .summary {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 32px;
            display: flex;
            gap: 40px;
          }

          .summary-item {
            display: flex;
            flex-direction: column;
          }

          .summary-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            margin-bottom: 4px;
            font-weight: 600;
          }

          .summary-value {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }

          th {
            background-color: #f1f5f9;
            font-weight: 600;
            text-align: left;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #475569;
            padding: 12px 16px;
            border-bottom: 2px solid #cbd5e1;
          }

          td {
            padding: 12px 16px;
            font-size: 13px;
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
          }

          .text-right {
            text-align: right;
          }

          .font-mono {
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
          }

          .highlight {
            font-weight: 700;
            color: #047857; /* emerald-700 */
          }

          .text-muted {
            color: #64748b;
          }

          .footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 16px;
            margin-top: 40px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
          }

          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">FX <span>Checker</span></div>
            <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Travel Expense & Conversion History Log</div>
          </div>
          <div class="meta">
            <div class="meta-title">Report Generated</div>
            <div>${dateStr}</div>
          </div>
        </div>

        <h1>Conversion History Log</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 0; margin-bottom: 24px;">
          A record of foreign currency exchanges logged during your active session.
        </p>

        <div class="summary">
          <div class="summary-item">
            <span class="summary-label">Total Conversions</span>
            <span class="summary-value">${logs.length}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Report Period</span>
            <span class="summary-value">Active Session</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%">#</th>
              <th style="width: 25%">Date & Time</th>
              <th style="width: 15%">From Currency</th>
              <th style="width: 15%" class="text-right">From Amount</th>
              <th style="width: 15%">To Currency</th>
              <th style="width: 15%" class="text-right">To Amount</th>
              <th style="width: 10%" class="text-right">Rate</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="footer">
          This document is generated automatically by FX Checker. All conversion records are private to this session.
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
    
    this.fxService.showToast('Export Success', 'PDF print view opened.', 'success');
  }
}
