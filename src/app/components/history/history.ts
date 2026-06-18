import { Component, inject } from '@angular/core';
import { ExchangeRateService } from '../../services/exchange-rate.service';
import { RateHistoryChartComponent } from '../rate-history-chart/rate-history-chart.component';

@Component({
  selector: 'app-history',
  imports: [RateHistoryChartComponent],
  templateUrl: './history.html',
  styleUrl: './history.css',
})
export class History {
  public fxService = inject(ExchangeRateService);

  title = "No chart data available"
  description = "We couldn't load rate history for USD/EUR right now. This usually clears up in a minute."
}
