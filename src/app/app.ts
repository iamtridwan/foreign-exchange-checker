import { Component, OnInit, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { Header } from './components/header/header';
// import { CurrencyPickerComponent } from './components/currency-picker/currency-picker.component';
import { ExchangePicker } from './components/exchange-picker/exchange-picker';
import { TabItem, TabsComponent } from './components/tabs/tabs';
// import { RateHistoryChartComponent } from './components/rate-history-chart/rate-history-chart.component';
// import { ExchangeRateService, CurrencyInfo, FavoritePair, ConversionLogEntry } from './services/exchange-rate.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    Header,
    ExchangePicker,
    TabsComponent
    // CurrencyPickerComponent,

    // RateHistoryChartComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private router = inject(Router);
  tabs: TabItem[] = [
    {
      id: 'history',
      label: 'History',
      route: "history",
    },
    {
      id: 'compare',
      label: 'COMPARE',
      route: "compare",
    },
    {
      id: 'favorites',
      label: 'FAVORITES',
      badge: 0,
      route: "favorites"
    },
    {
      id: 'logs',
      label: 'Log',
      badge: 0,
      route: "log"
    },
  ];
  activeTab = 'history';

  public onTabChange(tab: TabItem) {
    this.activeTab = tab.id;
    this.router.navigate([tab.route]);
  }

  // protected readonly title = signal('foreign-exchange-checker');

  // // UI state signals
  // public activeTab = signal<string>('history');
  // public isSendPickerOpen = signal<boolean>(false);
  // public isReceivePickerOpen = signal<boolean>(false);
  // public srAnnouncement = signal<string>('');

  // // Core conversion signals
  // public currencies: CurrencyInfo[] = [];
  // public sendCurrency = signal<string>('USD');
  // public receiveCurrency = signal<string>('EUR');
  // public sendAmount = signal<string>('1000');
  // public receiveAmount = signal<string>('');

  // // Rates mapping signals
  // public ratesMap = signal<{ [key: string]: number }>({});
  // public isLoadingRates = signal<boolean>(false);
  // public ratesError = signal<boolean>(false);

  // // Mapped details
  // public sendCurrencyInfo = computed(() => {
  //   return this.currencies.find(c => c.code === this.sendCurrency()) || { code: 'USD', name: 'US Dollar', flagCode: 'us' };
  // });

  // public receiveCurrencyInfo = computed(() => {
  //   return this.currencies.find(c => c.code === this.receiveCurrency()) || { code: 'EUR', name: 'Euro', flagCode: 'eu' };
  // });

  // public liveRate = computed(() => {
  //   return this.ratesMap()[this.receiveCurrency()] || 0.0;
  // });

  // // Check if active pair is favorited
  // public isFavorited = computed(() => {
  //   const favs = this.fxService.favorites();
  //   const base = this.sendCurrency();
  //   const symbol = this.receiveCurrency();
  //   return favs.some(f => f.base === base && f.symbol === symbol);
  // });

  // Dynamic lists with live rates calculated against USD signal cache
  // public favoritePairsWithRates = computed(() => {
  //   const favs = this.fxService.favorites();
  //   const latestUSD = this.fxService.latestRatesUSD();
  //   const prevUSD = this.fxService.prevRatesUSD();

  //   if (Object.keys(latestUSD).length === 0) return [];

  //   return favs.map(f => {
  //     const rateA = latestUSD[f.base] || 1.0;
  //     const rateB = latestUSD[f.symbol] || 1.0;
  //     const prevRateA = prevUSD[f.base] || 1.0;
  //     const prevRateB = prevUSD[f.symbol] || 1.0;

  //     // Rate A/B is Rate(B)/Rate(A) when base is USD
  //     const currentRate = rateB / rateA;
  //     const prevRate = prevRateB / prevRateA;

  //     const change = currentRate - prevRate;
  //     const changePercent = prevRate !== 0 ? (change / prevRate) * 100 : 0;

  //     const baseInfo = this.currencies.find(c => c.code === f.base);
  //     const symbolInfo = this.currencies.find(c => c.code === f.symbol);

  //     return {
  //       ...f,
  //       rate: currentRate,
  //       change,
  //       changePercent,
  //       isUp: change >= 0,
  //       baseFlag: baseInfo?.flagCode || 'us',
  //       symbolFlag: symbolInfo?.flagCode || 'eu'
  //     };
  //   });
  // });

  // // Multi-currency comparison grid
  // public comparisonGrid = computed(() => {
  //   const base = this.sendCurrency();
  //   const amountVal = Number(this.sendAmount());
  //   const rates = this.ratesMap();
  //   const favs = this.fxService.favorites();

  //   if (isNaN(amountVal) || amountVal <= 0 || Object.keys(rates).length === 0) return [];

  //   return this.currencies
  //     .filter(c => c.code !== base)
  //     .map(c => {
  //       const rate = rates[c.code] || 0.0;
  //       const converted = amountVal * rate;
  //       const isPinned = favs.some(f => f.base === base && f.symbol === c.code);

  //       return {
  //         ...c,
  //         rate,
  //         converted,
  //         isPinned
  //       };
  //     });
  // });

  // constructor(public fxService: ExchangeRateService) {
  //   // React to send currency change to fetch rates
  //   effect(() => {
  //     this.fetchRates();
  //   });

  //   // React to tab change to persist selection
  //   effect(() => {
  //     this.fxService.saveLastTab(this.activeTab());
  //   });
  // }

  ngOnInit(): void {
    // 1. Set initial active tab based on initial URL
    this.updateActiveTab(this.router.url);

    // 2. Subscribe to router events to update active tab on navigation
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updateActiveTab(event.urlAfterRedirects);
    });
  }

  private updateActiveTab(url: string): void {
    const matchedTab = this.tabs.find(tab => tab.route && url.includes(tab.route));
    if (matchedTab) {
      this.activeTab = matchedTab.id;
    } else {
      this.activeTab = 'history';
    }
  }

  // public async fetchRates(): Promise<void> {
  //   const base = this.sendCurrency();
  //   if (!base) return;

  //   this.isLoadingRates.set(true);
  //   this.ratesError.set(false);

  //   try {
  //     const res = await this.fxService.fetchLatestRates(base);
  //     // Frankfurter latest rates do not include the base itself (which is 1.0)
  //     const rates = { ...res.rates, [base]: 1.0 };
  //     this.ratesMap.set(rates);
  //     this.recalculateReceive();
  //   } catch (e) {
  //     console.error('Failed to fetch rates, using static fallback rates', e);
  //     this.ratesError.set(true);
  //     const fallback = this.fxService.getFallbackRates(base);
  //     this.ratesMap.set(fallback);
  //     this.recalculateReceive();
  //   } finally {
  //     this.isLoadingRates.set(false);
  //   }
  // }

  // public onSendAmountChange(val: string): void {
  //   // Normalize format
  //   const cleaned = val.replace(/,/g, '');
  //   this.sendAmount.set(cleaned);
  //   this.recalculateReceive();
  // }

  // public onReceiveAmountChange(val: string): void {
  //   const cleaned = val.replace(/,/g, '');
  //   this.receiveAmount.set(cleaned);
  //   this.recalculateSend();
  // }

  // private recalculateReceive(): void {
  //   const amt = Number(this.sendAmount());
  //   if (isNaN(amt) || this.sendAmount() === '') {
  //     this.receiveAmount.set('');
  //     return;
  //   }
  //   const rate = this.liveRate();
  //   this.receiveAmount.set((amt * rate).toFixed(2));
  // }

  // private recalculateSend(): void {
  //   const amt = Number(this.receiveAmount());
  //   if (isNaN(amt) || this.receiveAmount() === '') {
  //     this.sendAmount.set('');
  //     return;
  //   }
  //   const rate = this.liveRate();
  //   if (rate > 0) {
  //     this.sendAmount.set((amt / rate).toFixed(2));
  //   }
  // }

  // public swapCurrencies(): void {
  //   const tempCurr = this.sendCurrency();
  //   const tempAmt = this.sendAmount();

  //   // Trigger signals
  //   this.sendCurrency.set(this.receiveCurrency());
  //   this.receiveCurrency.set(tempCurr);
  //   this.sendAmount.set(this.receiveAmount());
  //   this.receiveAmount.set(tempAmt);

  //   this.announce(`Swapped currencies. Converter is now set to send ${this.sendCurrency()} and receive ${this.receiveCurrency()}.`);
  // }

  // public toggleFavorite(): void {
  //   const base = this.sendCurrency();
  //   const symbol = this.receiveCurrency();
  //   const favs = [...this.fxService.favorites()];
  //   const index = favs.findIndex(f => f.base === base && f.symbol === symbol);

  //   if (index >= 0) {
  //     favs.splice(index, 1);
  //     this.fxService.saveFavorites(favs);
  //     this.announce(`Removed ${base}/${symbol} from favorites.`);
  //   } else {
  //     favs.push({
  //       id: `${base}-${symbol}`,
  //       base,
  //       symbol
  //     });
  //     this.fxService.saveFavorites(favs);
  //     this.announce(`Added ${base}/${symbol} to favorites.`);
  //   }
  // }

  // public toggleComparisonPin(currCode: string): void {
  //   const base = this.sendCurrency();
  //   const favs = [...this.fxService.favorites()];
  //   const index = favs.findIndex(f => f.base === base && f.symbol === currCode);

  //   if (index >= 0) {
  //     favs.splice(index, 1);
  //     this.fxService.saveFavorites(favs);
  //     this.announce(`Unpinned ${base}/${currCode} from favorites.`);
  //   } else {
  //     favs.push({
  //       id: `${base}-${currCode}`,
  //       base,
  //       symbol: currCode
  //     });
  //     this.fxService.saveFavorites(favs);
  //     this.announce(`Pinned ${base}/${currCode} to favorites.`);
  //   }
  // }

  // public logConversion(): void {
  //   const fromAmt = Number(this.sendAmount());
  //   const toAmt = Number(this.receiveAmount());

  //   if (isNaN(fromAmt) || fromAmt <= 0 || isNaN(toAmt) || toAmt <= 0) {
  //     return;
  //   }

  //   const logs = [...this.fxService.conversionLog()];
  //   const entry: ConversionLogEntry = {
  //     id: Math.random().toString(36).substring(2, 9),
  //     timestamp: Date.now(),
  //     fromCurrency: this.sendCurrency(),
  //     toCurrency: this.receiveCurrency(),
  //     fromAmount: fromAmt,
  //     toAmount: toAmt
  //   };

  //   // Keep up to 50 conversion log entries
  //   logs.unshift(entry);
  //   if (logs.length > 50) logs.pop();

  //   this.fxService.saveConversionLog(logs);
  //   this.announce(`Logged conversion: ${fromAmt.toLocaleString()} ${entry.fromCurrency} converts to ${toAmt.toLocaleString()} ${entry.toCurrency}.`);
  // }

  // public deleteLogEntry(id: string): void {
  //   const logs = this.fxService.conversionLog().filter(l => l.id !== id);
  //   this.fxService.saveConversionLog(logs);
  //   this.announce(`Deleted log entry.`);
  // }

  // public clearLog(): void {
  //   this.fxService.saveConversionLog([]);
  //   this.announce(`Conversion log cleared.`);
  // }

  // public selectTab(tab: string): void {
  //   this.activeTab.set(tab);
  // }

  // public loadFavoritePair(fav: FavoritePair | any): void {
  //   this.sendCurrency.set(fav.base);
  //   this.receiveCurrency.set(fav.symbol);
  //   this.activeTab.set('history');
  //   this.announce(`Loaded favorite pair ${fav.base}/${fav.symbol} into converter.`);
  // }

  // public removeFavoritePair(fav: FavoritePair | any): void {
  //   const logs = this.fxService.favorites().filter(f => f.id !== fav.id);
  //   this.fxService.saveFavorites(logs);
  //   this.announce(`Removed favorite pair ${fav.base}/${fav.symbol}.`);
  // }

  // public selectSendCurrency(code: string): void {
  //   this.sendCurrency.set(code);
  //   this.isSendPickerOpen.set(false);
  //   this.announce(`Selected send currency ${code}.`);
  // }

  // public selectReceiveCurrency(code: string): void {
  //   this.receiveCurrency.set(code);
  //   this.isReceivePickerOpen.set(false);
  //   this.announce(`Selected receive currency ${code}.`);
  // }

  // private announce(message: string): void {
  //   this.srAnnouncement.set(message);
  //   // Clear after screen reader reads it to allow repeat announcements
  //   setTimeout(() => {
  //     this.srAnnouncement.set('');
  //   }, 2000);
  // }

  // public getRelativeTime(timestamp: number): string {
  //   const now = Date.now();
  //   const diff = now - timestamp;
  //   const mins = Math.floor(diff / 60000);
  //   const hours = Math.floor(mins / 60);

  //   if (mins < 1) return 'Just now';
  //   if (mins === 1) return '1 min ago';
  //   if (mins < 60) return `${mins} mins ago`;
  //   if (hours === 1) return '1 hour ago';
  //   return `${hours} hours ago`;
  // }
}

