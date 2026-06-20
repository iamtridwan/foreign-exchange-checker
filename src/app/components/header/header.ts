
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExchangeRateService, TickerItem } from '../../services/exchange-rate.service';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})

export class Header implements OnInit {
  public tickerItems = signal<TickerItem[]>([]);
  constructor(private fxService: ExchangeRateService) { }

  public get theme() {
    return this.fxService.theme;
  }

  public setTheme(newTheme: 'light' | 'dark' | 'system'): void {
    this.fxService.setTheme(newTheme);
  }

  async ngOnInit(): Promise<void> {
    try {
      const items = await this.fxService.fetchTickerData();
      this.tickerItems.set(items);
    } catch (e) {
      console.error('Failed to load ticker data', e);
    }
  }
}