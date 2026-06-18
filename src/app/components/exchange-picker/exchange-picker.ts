import { Component, OnInit, signal, computed, effect, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExchangeRateService, CurrencyInfo } from '../../services/exchange-rate.service';

@Component({
  selector: 'app-exchange-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exchange-picker.html',
  styleUrl: './exchange-picker.css',
})
export class ExchangePicker implements OnInit {
  // Picker visibility and search
  public isSendPickerOpen = signal<boolean>(false);
  public isReceivePickerOpen = signal<boolean>(false);
  public searchQuery = signal<string>('');

  // Active converter variables
  public sendCurrency!: WritableSignal<string>;
  public receiveCurrency!: WritableSignal<string>;
  public sendAmount = signal<string>('1000');
  public receiveAmount = signal<string>('');

  // Rates mapping
  public ratesMap = signal<{ [key: string]: number }>({});
  public isLoading = signal<boolean>(false);
  public isError = signal<boolean>(false);

  // Mapped list from service
  public currenciesList: CurrencyInfo[] = [];

  // Popular codes: USD, EUR, GBP (as seen in design)
  private readonly popularCodes = new Set(['USD', 'EUR', 'GBP']);

  // Send Currency Info
  public sendCurrencyInfo = computed(() => {
    return this.currenciesList.find(c => c.code === this.sendCurrency()) || { code: 'USD', name: 'US Dollar', flagCode: 'us' };
  });

  // Receive Currency Info
  public receiveCurrencyInfo = computed(() => {
    return this.currenciesList.find(c => c.code === this.receiveCurrency()) || { code: 'EUR', name: 'Euro', flagCode: 'eu' };
  });

  // Live exchange rate
  public liveRate = computed(() => {
    return this.ratesMap()[this.receiveCurrency()] || 0.0;
  });

  // Check if active pair is favorited
  public isFavorited = computed(() => {
    const favs = this.fxService.favorites();
    const base = this.sendCurrency();
    const symbol = this.receiveCurrency();
    return favs.some(f => f.base === base && f.symbol === symbol);
  });

  // Filtered popular list based on search query
  public filteredPopular = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.currenciesList.filter(c => this.popularCodes.has(c.code));
    if (!q) return list;
    return list.filter(c => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  });

  // Filtered other currencies list based on search query
  public filteredOthers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.currenciesList.filter(c => !this.popularCodes.has(c.code));
    if (!q) return list;
    return list.filter(c => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  });

  constructor(public fxService: ExchangeRateService) {
    this.sendCurrency = this.fxService.sendCurrency;
    this.receiveCurrency = this.fxService.receiveCurrency;
    // Re-fetch rates automatically whenever base currency changes
    effect(() => {
      this.fetchRates();
    });
  }

  ngOnInit(): void {
    this.currenciesList = this.fxService.getSupportedCurrencies();
    // Pre-populate with fallback rates
    this.ratesMap.set(this.fxService.getFallbackRates(this.sendCurrency()));
    this.fetchRates();
  }

  public async fetchRates(): Promise<void> {
    const base = this.sendCurrency();
    if (!base) return;

    this.isLoading.set(true);
    this.isError.set(false);

    try {
      const res = await this.fxService.fetchLatestRates(base);
      const rates = { ...res.rates, [base]: 1.0 };
      this.ratesMap.set(rates);
      this.recalculateReceive();
    } catch (e) {
      console.warn('API error, falling back to static offline rates', e);
      this.isError.set(true);
      const fallback = this.fxService.getFallbackRates(base);
      this.ratesMap.set(fallback);
      this.recalculateReceive();
    } finally {
      this.isLoading.set(false);
    }
  }

  public onSendAmountChange(val: string): void {
    const cleaned = val.replace(/,/g, '');
    this.sendAmount.set(cleaned);
    this.recalculateReceive();
  }

  public onReceiveAmountChange(val: string): void {
    const cleaned = val.replace(/,/g, '');
    this.receiveAmount.set(cleaned);
    this.recalculateSend();
  }

  private recalculateReceive(): void {
    const amt = Number(this.sendAmount());
    if (isNaN(amt) || this.sendAmount() === '') {
      this.receiveAmount.set('');
      return;
    }
    this.receiveAmount.set((amt * this.liveRate()).toFixed(2));
  }

  private recalculateSend(): void {
    const amt = Number(this.receiveAmount());
    if (isNaN(amt) || this.receiveAmount() === '') {
      this.sendAmount.set('');
      return;
    }
    const rate = this.liveRate();
    if (rate > 0) {
      this.sendAmount.set((amt / rate).toFixed(2));
    }
  }

  public swapCurrencies(): void {
    const tempCurr = this.sendCurrency();
    const tempAmt = this.sendAmount();

    this.sendCurrency.set(this.receiveCurrency());
    this.receiveCurrency.set(tempCurr);
    this.sendAmount.set(this.receiveAmount());
    this.receiveAmount.set(tempAmt);
  }

  public toggleSendPicker(): void {
    this.isSendPickerOpen.update(v => !v);
    this.isReceivePickerOpen.set(false);
    this.searchQuery.set('');
  }

  public toggleReceivePicker(): void {
    this.isReceivePickerOpen.update(v => !v);
    this.isSendPickerOpen.set(false);
    this.searchQuery.set('');
  }

  public selectSendCurrency(code: string): void {
    this.sendCurrency.set(code);
    this.isSendPickerOpen.set(false);
    this.searchQuery.set('');
  }

  public selectReceiveCurrency(code: string): void {
    this.receiveCurrency.set(code);
    this.isReceivePickerOpen.set(false);
    this.searchQuery.set('');
  }

  public toggleFavorite(): void {
    // Will implement functionality later
  }

  public logConversion(): void {
    // Will implement functionality later
  }
}
