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
  public sendAmount!: WritableSignal<string>;

  // Computed Receive Amount based on Send Amount and Live Rate
  public receiveAmount = computed(() => {
    const amt = Number(this.sendAmount());
    if (isNaN(amt) || this.sendAmount() === '') {
      return '';
    }
    return (amt * this.liveRate()).toFixed(2);
  });

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
    this.sendAmount = this.fxService.sendAmount;
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
    } catch (e) {
      console.warn('API error, falling back to static offline rates', e);
      this.isError.set(true);
      const fallback = this.fxService.getFallbackRates(base);
      this.ratesMap.set(fallback);
    } finally {
      this.isLoading.set(false);
    }
  }

  public onSendAmountChange(val: string): void {
    let cleaned = val.replace(/,/g, '').replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    this.sendAmount.set(cleaned);
  }

  public formatWithCommas(val: string): string {
    if (!val) return '';
    const clean = val.replace(/,/g, '');
    const parts = clean.split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;
  }

  public onKeydown(event: KeyboardEvent): void {
    const allowedKeys = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End',
      'Enter', 'Escape', 'a', 'c', 'v', 'x'
    ];
    const isCtrl = event.ctrlKey || event.metaKey;

    if (allowedKeys.includes(event.key) || (isCtrl && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase()))) {
      return;
    }

    if (event.key === '.') {
      const val = (event.target as HTMLInputElement).value;
      if (val.includes('.')) {
        event.preventDefault();
      }
      return;
    }

    if (!/[0-9]/.test(event.key)) {
      event.preventDefault();
    }
  }

  public onPaste(event: ClipboardEvent): void {
    const data = event.clipboardData?.getData('text') || '';
    const clean = data.replace(/,/g, '');
    if (!/^[0-9]*\.?[0-9]*$/.test(clean)) {
      event.preventDefault();
    }
  }

  public getFontSizeClass(amount: string): string {
    const formatted = this.formatWithCommas(amount);
    const len = formatted ? formatted.length : 0;
    if (len <= 8) return 'text-32';
    if (len <= 12) return 'text-24';
    if (len <= 16) return 'text-16';
    return 'text-12';
  }



  public swapCurrencies(): void {
    const tempCurr = this.sendCurrency();
    const tempAmt = this.receiveAmount();

    this.sendCurrency.set(this.receiveCurrency());
    this.receiveCurrency.set(tempCurr);
    this.sendAmount.set(tempAmt);
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
    const base = this.sendCurrency();
    const symbol = this.receiveCurrency();
    const favs = [...this.fxService.favorites()];
    const index = favs.findIndex(f => f.base === base && f.symbol === symbol);

    if (index >= 0) {
      favs.splice(index, 1);
    } else {
      favs.push({
        id: `${base}-${symbol}`,
        base,
        symbol
      });
    }
    this.fxService.saveFavorites(favs);
  }

  public logConversion(): void {
    const fromAmt = Number(this.sendAmount());
    const toAmt = Number(this.receiveAmount());

    if (isNaN(fromAmt) || fromAmt <= 0 || isNaN(toAmt) || toAmt <= 0) {
      return;
    }

    this.fxService.addConversionLogEntry(
      this.sendCurrency(),
      this.receiveCurrency(),
      fromAmt,
      toAmt
    );
  }
}
