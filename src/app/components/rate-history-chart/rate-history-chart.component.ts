import { Component, Input, OnInit, OnChanges, SimpleChanges, signal, computed, effect, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExchangeRateService } from '../../services/exchange-rate.service';

interface ChartPoint {
  x: number;
  y: number;
  rate: number;
  date: string;
}

@Component({
  selector: 'app-rate-history-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rate-history-chart.component.html',
  styleUrl: './rate-history-chart.component.css'
})
export class RateHistoryChartComponent implements OnInit, OnChanges {
  @Input() base: string = 'USD';
  @Input() symbol: string = 'EUR';

  @ViewChild('chartSvg') chartSvg!: ElementRef<SVGSVGElement>;

  // Constants for SVG viewport size
  private readonly W = 600;
  private readonly H = 200; // vertical span of rate points
  private readonly topOffset = 10;

  // Selected range tab
  public ranges = ['7D', '1M', '3M', '1Y'];
  public selectedRange = signal<string>('1M');

  // Load and error states
  public isLoading = signal<boolean>(false);
  public error = signal<boolean>(false);

  // SVG Chart points array
  public points = signal<ChartPoint[]>([]);

  // Computed paths for SVG rendering
  public linePath = computed(() => {
    const pts = this.points();
    if (pts.length === 0) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  });

  public areaPath = computed(() => {
    const pts = this.points();
    if (pts.length === 0) return '';
    const startX = pts[0].x.toFixed(1);
    const endX = pts[pts.length - 1].x.toFixed(1);
    return `${this.linePath()} L ${endX} 210 L ${startX} 210 Z`;
  });

  // Range-based Stats Signals
  public openRate = signal<number>(0);
  public lastRate = signal<number>(0);
  public changeValue = signal<number>(0);
  public changePercent = signal<number>(0);

  // Active hover/focus inspector values
  public activeRate = signal<number>(0);
  public activeDate = signal<string>('');
  public hoveredIndex = signal<number | null>(null);

  // Bottom text metrics
  public minRateVal = signal<number>(0);
  public maxRateVal = signal<number>(0);
  public oldestDate = signal<string>('');
  public latestDate = signal<string>('');

  constructor(private fxService: ExchangeRateService) {
    // Keep track of input base/symbol changes
    effect(() => {
      // Re-fetch when base or symbol changes
      this.fetchHistory();
    });
  }

  ngOnInit(): void {
    // Initial fetch is triggered via simple inputs trigger
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['base'] || changes['symbol']) {
      this.fetchHistory();
    }
  }

  public setRange(range: string): void {
    this.selectedRange.set(range);
    this.fetchHistory();
  }

  public retryFetch(): void {
    this.fetchHistory();
  }

  private async fetchHistory(): Promise<void> {
    if (!this.base || !this.symbol) return;
    
    this.isLoading.set(true);
    this.error.set(false);
    this.hoveredIndex.set(null);

    // Fallback if base and symbol are identical (1.0 rate)
    if (this.base === this.symbol) {
      const flatData = [];
      const today = new Date();
      for (let i = 10; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        flatData.push({
          date: d.toISOString().split('T')[0],
          rate: 1.0
        });
      }
      this.processChartData(flatData);
      this.isLoading.set(false);
      return;
    }

    try {
      const start = this.getStartDate(this.selectedRange());
      const end = new Date().toISOString().split('T')[0];

      const res = await this.fxService.fetchRateHistory(this.base, this.symbol, start, end);
      
      const ratesObj = res.rates || {};
      const sortedDates = Object.keys(ratesObj).sort();

      if (sortedDates.length === 0) {
        throw new Error('No historical data returned');
      }

      const data = sortedDates.map(date => ({
        date,
        rate: ratesObj[date][this.symbol]
      }));

      this.processChartData(data);
    } catch (e) {
      console.error('Error loading history', e);
      this.error.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  private processChartData(data: { date: string, rate: number }[]): void {
    if (data.length === 0) return;

    // Filter out undefined rates
    const cleanData = data.filter(d => d.rate !== undefined && d.rate !== null);
    if (cleanData.length === 0) return;

    // Calculate rates bounding box
    const rates = cleanData.map(d => d.rate);
    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);
    const rateRange = maxRate - minRate;

    this.minRateVal.set(minRate);
    this.maxRateVal.set(maxRate);

    // Calculate stats
    const open = cleanData[0].rate;
    const last = cleanData[cleanData.length - 1].rate;
    const change = last - open;
    const pctChange = open !== 0 ? (change / open) * 100 : 0;

    this.openRate.set(open);
    this.lastRate.set(last);
    this.changeValue.set(change);
    this.changePercent.set(pctChange);

    // Reset default active rate/date to the latest point
    this.activeRate.set(last);
    this.activeDate.set(cleanData[cleanData.length - 1].date);
    
    this.oldestDate.set(cleanData[0].date);
    this.latestDate.set(cleanData[cleanData.length - 1].date);

    // Map into SVG viewport coordinates (600w x 220h total, with 10px margin top/bottom)
    const chartPoints = cleanData.map((d, i) => {
      const x = cleanData.length > 1 ? (i / (cleanData.length - 1)) * this.W : 0;
      let y = 110; // center vertical line fallback
      if (rateRange > 0) {
        y = 210 - ((d.rate - minRate) / rateRange) * this.H;
      }
      return {
        x,
        y,
        rate: d.rate,
        date: d.date
      };
    });

    this.points.set(chartPoints);
  }

  private getStartDate(range: string): string {
    const d = new Date();
    if (range === '7D') {
      d.setDate(d.getDate() - 7);
    } else if (range === '1M') {
      d.setMonth(d.getMonth() - 1);
    } else if (range === '3M') {
      d.setMonth(d.getMonth() - 3);
    } else if (range === '1Y') {
      d.setFullYear(d.getFullYear() - 1);
    }
    return d.toISOString().split('T')[0];
  }

  // Mouse interactivity triggers
  public onMouseMove(event: MouseEvent): void {
    const svgEl = this.chartSvg.nativeElement;
    const rect = svgEl.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const svgWidth = rect.width;

    const pts = this.points();
    if (pts.length === 0) return;

    // Calculate percentage across the SVG width
    const pct = mouseX / svgWidth;
    let closestIndex = Math.round(pct * (pts.length - 1));
    closestIndex = Math.max(0, Math.min(pts.length - 1, closestIndex));

    this.hoveredIndex.set(closestIndex);
    this.activeRate.set(pts[closestIndex].rate);
    this.activeDate.set(pts[closestIndex].date);
  }

  public onMouseLeave(): void {
    this.hoveredIndex.set(null);
    // Reset to the latest rate/date in the series
    const pts = this.points();
    if (pts.length > 0) {
      const last = pts[pts.length - 1];
      this.activeRate.set(last.rate);
      this.activeDate.set(last.date);
    }
  }

  // Keyboard navigation support for SVG inspection focus
  public onKeyDown(event: KeyboardEvent): void {
    const pts = this.points();
    if (pts.length === 0) return;

    let currentIndex = this.hoveredIndex();
    if (currentIndex === null) {
      currentIndex = pts.length - 1; // Start at the end
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const nextIndex = Math.max(0, currentIndex - 1);
      this.hoveredIndex.set(nextIndex);
      this.activeRate.set(pts[nextIndex].rate);
      this.activeDate.set(pts[nextIndex].date);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      const nextIndex = Math.min(pts.length - 1, currentIndex + 1);
      this.hoveredIndex.set(nextIndex);
      this.activeRate.set(pts[nextIndex].rate);
      this.activeDate.set(pts[nextIndex].date);
    }
  }
}
