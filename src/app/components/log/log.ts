import { Component } from '@angular/core';
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

  constructor(public fxService: ExchangeRateService) {}

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
}
