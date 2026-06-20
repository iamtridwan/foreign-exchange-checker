import { Injectable, signal, WritableSignal, computed, effect } from '@angular/core';

export interface CurrencyInfo {
  code: string;
  name: string;
  flagCode: string;
}

export interface TickerItem {
  pair: string;
  rate: number;
  change: number;
  changePercent: number;
  isUp: boolean;
}

export interface FavoritePair {
  id: string; // e.g. "USD-EUR"
  base: string;
  symbol: string;
  threshold?: number;
  thresholdType?: 'above' | 'below';
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info';
}

export interface ConversionLogEntry {
  id: string;
  timestamp: number;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExchangeRateService {
  // Flag code mappings for flagcdn / local flags
  private readonly currencyFlags: { [key: string]: string } = {
    USD: 'us',
    EUR: 'eu',
    GBP: 'gb',
    JPY: 'jp',
    AUD: 'au',
    CAD: 'ca',
    CHF: 'ch',
    CNY: 'cn',
    NZD: 'nz',
    SEK: 'se',
    NOK: 'no',
    DKK: 'dk',
    TRY: 'tr',
    KRW: 'kr',
    SGD: 'sg',
    HKD: 'hk',
    INR: 'in',
    MXN: 'mx',
    ZAR: 'za',
    BRL: 'br',
    PLN: 'pl',
    RON: 'ro',
    BGN: 'bg',
    CZK: 'cz',
    HUF: 'hu',
    IDR: 'id',
    ILS: 'il',
    ISK: 'is',
    MYR: 'my',
    PHP: 'ph',
    THB: 'th',
    AED: 'ae',
    ARS: 'ar',
    BDT: 'bd',
    BHD: 'bh',
    CLP: 'cl',
    COP: 'co',
    EGP: 'eg',
    GHS: 'gh',
    HNL: 'hn',
    HRK: 'hr',
    HTG: 'ht',
    JOD: 'jo',
    KES: 'ke',
    KWD: 'kw',
    LBP: 'lb',
    LKR: 'lk',
    MAD: 'ma',
    NGN: 'ng',
    NPR: 'np',
    OMR: 'om',
    PEN: 'pe',
    PKR: 'pk',
    QAR: 'qa',
    RUB: 'ru',
    SAR: 'sa',
    TWD: 'tw',
    UAH: 'ua',
    VND: 'vn'
  };

  private readonly currencyNames: { [key: string]: string } = {
    USD: 'United States Dollar',
    EUR: 'Euro',
    GBP: 'British Pound Sterling',
    JPY: 'Japanese Yen',
    AUD: 'Australian Dollar',
    CAD: 'Canadian Dollar',
    CHF: 'Swiss Franc',
    CNY: 'Chinese Renminbi Yuan',
    NZD: 'New Zealand Dollar',
    SEK: 'Swedish Krona',
    NOK: 'Norwegian Krone',
    DKK: 'Danish Krone',
    TRY: 'Turkish Lira',
    KRW: 'South Korean Won',
    SGD: 'Singapore Dollar',
    HKD: 'Hong Kong Dollar',
    INR: 'Indian Rupee',
    MXN: 'Mexican Peso',
    ZAR: 'South African Rand',
    BRL: 'Brazilian Real',
    PLN: 'Polish Zloty',
    RON: 'Romanian Leu',
    BGN: 'Bulgarian Lev',
    CZK: 'Czech Koruna',
    HUF: 'Hungarian Forint',
    IDR: 'Indonesian Rupiah',
    ILS: 'Israeli New Shekel',
    ISK: 'Icelandic Krona',
    MYR: 'Malaysian Ringgit',
    PHP: 'Philippine Peso',
    THB: 'Thai Baht',
    AED: 'UAE Dirham',
    ARS: 'Argentine Peso',
    BDT: 'Bangladeshi Taka',
    BHD: 'Bahraini Dinar',
    CLP: 'Chilean Peso',
    COP: 'Colombian Peso',
    EGP: 'Egyptian Pound',
    GHS: 'Ghanaian Cedi',
    HNL: 'Honduran Lempira',
    HRK: 'Croatian Kuna',
    HTG: 'Haitian Gourde',
    JOD: 'Jordanian Dinar',
    KES: 'Kenyan Shilling',
    KWD: 'Kuwaiti Dinar',
    LBP: 'Lebanese Pound',
    LKR: 'Sri Lankan Rupee',
    MAD: 'Moroccan Dirham',
    NGN: 'Nigerian Naira',
    NPR: 'Nepalese Rupee',
    OMR: 'Omani Rial',
    PEN: 'Peruvian Sol',
    PKR: 'Pakistani Rupee',
    QAR: 'Qatar Riyal',
    RUB: 'Russian Ruble',
    SAR: 'Saudi Riyal',
    TWD: 'New Taiwan Dollar',
    UAH: 'Ukrainian Hryvnia',
    VND: 'Vietnamese Dong'
  };

  private readonly frankfurterSupported = new Set([
    'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'NZD', 'SEK',
    'NOK', 'DKK', 'TRY', 'KRW', 'SGD', 'HKD', 'INR', 'MXN', 'ZAR', 'BRL',
    'PLN', 'RON', 'BGN', 'CZK', 'HUF', 'IDR', 'ILS', 'ISK', 'MYR', 'PHP', 'THB'
  ]);

  // State signals
  public favorites: WritableSignal<FavoritePair[]> = signal([]);
  public conversionLog: WritableSignal<ConversionLogEntry[]> = signal([]);
  public lastActiveTab: WritableSignal<string> = signal('history');
  public sendCurrency = signal<string>('USD');
  public receiveCurrency = signal<string>('EUR');
  public sendAmount = signal<string>('1000');
  public theme = signal<'light' | 'dark' | 'system'>('system');
  public toasts = signal<ToastMessage[]>([]);
  private triggeredAlerts = new Set<string>();

  // Cached USD-based rates for global ticker/favorites calculations
  public latestRatesUSD = signal<{ [key: string]: number }>({});
  public prevRatesUSD = signal<{ [key: string]: number }>({});

  public favoritesWithRates = computed(() => {
    const favs = this.favorites();
    const latestUSD = this.latestRatesUSD();
    const prevUSD = this.prevRatesUSD();

    if (Object.keys(latestUSD).length === 0) return [];

    return favs.map(f => {
      const rateA = latestUSD[f.base] || 1.0;
      const rateB = latestUSD[f.symbol] || 1.0;
      const prevRateA = prevUSD[f.base] || rateA;
      const prevRateB = prevUSD[f.symbol] || rateB;

      // Rate A/B is Rate(B)/Rate(A) when base is USD
      const currentRate = rateB / rateA;
      const prevRate = prevRateB / prevRateA;

      const change = currentRate - prevRate;
      const changePercent = prevRate !== 0 ? (change / prevRate) * 100 : 0;

      const baseFlag = this.currencyFlags[f.base] || 'us';
      const symbolFlag = this.currencyFlags[f.symbol] || 'eu';

      return {
        ...f,
        rate: currentRate,
        change,
        changePercent,
        isUp: change >= 0,
        baseFlag,
        symbolFlag
      };
    });
  });

  private mediaQueryListener = (e: MediaQueryListEvent) => {
    if (this.theme() === 'system') {
      this.applyTheme();
    }
  };

  constructor() {
    // Pre-populate with fallback rates so favorites computed signal has values immediately
    this.latestRatesUSD.set(this.getFallbackRates('USD'));
    this.prevRatesUSD.set(this.getFallbackRates('USD'));
    this.loadFromStorage();
    this.applyTheme();

    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', this.mediaQueryListener);
      } else {
        mediaQuery.addListener(this.mediaQueryListener);
      }
    }

    // Check thresholds when favorites or rates change
    effect(() => {
      this.checkThresholds();
    });
  }

  private loadFromStorage(): void {
    try {
      const favs = localStorage.getItem('fx_favorites');
      if (favs) this.favorites.set(JSON.parse(favs));

      const logs = localStorage.getItem('fx_logs');
      if (logs) this.conversionLog.set(JSON.parse(logs));

      const tab = localStorage.getItem('fx_last_tab');
      if (tab) this.lastActiveTab.set(tab);

      const themeVal = localStorage.getItem('fx_theme') as 'light' | 'dark' | 'system' | null;
      if (themeVal) this.theme.set(themeVal);
    } catch (e) {
      console.error('Failed to load from storage', e);
    }
  }

  public saveFavorites(favs: FavoritePair[]): void {
    this.favorites.set(favs);
    localStorage.setItem('fx_favorites', JSON.stringify(favs));
  }

  public removeFavorite(id: string): void {
    const favs = this.favorites().filter(f => f.id !== id);
    this.saveFavorites(favs);
  }

  public saveConversionLog(logs: ConversionLogEntry[]): void {
    this.conversionLog.set(logs);
    localStorage.setItem('fx_logs', JSON.stringify(logs));
  }

  public addConversionLogEntry(fromCurrency: string, toCurrency: string, fromAmount: number, toAmount: number): void {
    const logs = [...this.conversionLog()];
    const entry: ConversionLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      fromCurrency,
      toCurrency,
      fromAmount,
      toAmount
    };
    logs.unshift(entry);
    if (logs.length > 50) logs.pop();
    this.saveConversionLog(logs);
  }

  public deleteConversionLogEntry(id: string): void {
    const logs = this.conversionLog().filter(l => l.id !== id);
    this.saveConversionLog(logs);
  }

  public clearConversionLog(): void {
    this.saveConversionLog([]);
  }

  public saveLastTab(tab: string): void {
    this.lastActiveTab.set(tab);
    localStorage.setItem('fx_last_tab', tab);
  }

  public setTheme(newTheme: 'light' | 'dark' | 'system'): void {
    this.theme.set(newTheme);
    localStorage.setItem('fx_theme', newTheme);
    this.applyTheme();
  }

  public applyTheme(): void {
    const current = this.theme();
    let isLight = false;

    if (current === 'light') {
      isLight = true;
    } else if (current === 'dark') {
      isLight = false;
    } else {
      isLight = typeof window !== 'undefined' && window.matchMedia
        ? !window.matchMedia('(prefers-color-scheme: dark)').matches
        : true;
    }

    if (isLight) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }

  // Get full list of support currencies sorted
  public getSupportedCurrencies(): CurrencyInfo[] {
    return Object.keys(this.currencyNames).map(code => ({
      code,
      name: this.currencyNames[code],
      flagCode: this.currencyFlags[code] || 'us'
    })).sort((a, b) => a.code.localeCompare(b.code));
  }

  // Get local flag image URL from assets
  public getFlagUrl(flagCode: string): string {
    return `images/flags/${flagCode.toLowerCase()}.webp`;
  }

  // Get offline/loading fallback rates for any base currency
  public getFallbackRates(base: string): { [key: string]: number } {
    const usdRates: { [key: string]: number } = {
      USD: 1.0,
      EUR: 0.871922,
      GBP: 0.756016,
      JPY: 161.262861,
      AUD: 1.425738,
      CAD: 1.415087,
      CHF: 0.8068,
      CNY: 6.784364,
      NZD: 1.742016,
      SEK: 9.578776,
      NOK: 9.689639,
      DKK: 6.507902,
      TRY: 46.452725,
      KRW: 1530.435528,
      SGD: 1.29121,
      HKD: 7.837577,
      INR: 94.431191,
      MXN: 17.333485,
      ZAR: 16.4574,
      BRL: 5.155704,
      PLN: 3.711653,
      RON: 4.569495,
      BGN: 1.705329,
      CZK: 21.108383,
      HUF: 306.958291,
      IDR: 17785.842497,
      ILS: 2.95815,
      ISK: 125.66025,
      MYR: 4.133145,
      PHP: 60.742636,
      THB: 32.877552,
      AED: 3.6725,
      ARS: 1460.2498,
      BDT: 122.440896,
      BHD: 0.376,
      CLP: 899.861454,
      COP: 3480.559735,
      EGP: 49.920476,
      GHS: 11.340887,
      HNL: 27.109241,
      HRK: 6.569488,
      HTG: 132.08376,
      JOD: 0.709,
      KES: 129.458977,
      KWD: 0.309765,
      LBP: 89500,
      LKR: 333.788859,
      MAD: 9.308871,
      NGN: 1366.657476,
      NPR: 151.089584,
      OMR: 0.384497,
      PEN: 3.419107,
      PKR: 280.398591,
      QAR: 3.64,
      RUB: 73.337433,
      SAR: 3.75,
      TWD: 31.654113,
      UAH: 44.89037,
      VND: 26472.589057
    };
    
    const baseRateInUSD = usdRates[base] || 1.0;
    const rates: { [key: string]: number } = {};
    for (const code of Object.keys(usdRates)) {
      rates[code] = usdRates[code] / baseRateInUSD;
    }
    return rates;
  }

  // Fetch latest rates with a custom base
  public async fetchLatestRates(base: string): Promise<any> {
    const url = `https://open.er-api.com/v6/latest/${base}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    
    if (data.result !== 'success') {
      throw new Error(`API error! status: ${data.result}`);
    }

    const rates = data.rates || {};
    const finalRates: { [key: string]: number } = {};
    for (const code of Object.keys(rates)) {
      if (code === base) continue;
      finalRates[code] = Number(rates[code].toFixed(5));
    }
    
    return {
      amount: 1.0,
      base: base,
      date: data.time_last_update_utc ? new Date(data.time_last_update_utc).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      rates: finalRates
    };
  }

  // Generate synthetic rates for unsupported pairs to maintain line chart rendering
  public generateMockHistory(base: string, symbol: string, startStr: string, endStr: string): any {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const rates: { [key: string]: { [key: string]: number } } = {};
    
    const baseRateA = this.getFallbackRates('USD')[base] || 1.0;
    const baseRateB = this.getFallbackRates('USD')[symbol] || 1.0;
    let currentRate = baseRateB / baseRateA;

    const current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) { // Skip weekends
        const dateStr = current.toISOString().split('T')[0];
        const fluctuation = (Math.random() - 0.5) * 0.008;
        currentRate = currentRate * (1 + fluctuation);
        rates[dateStr] = { [symbol]: Number(currentRate.toFixed(4)) };
      }
      current.setDate(current.getDate() + 1);
    }

    return {
      amount: 1.0,
      base,
      start_date: startStr,
      end_date: endStr,
      rates
    };
  }

  // Fetch historical rates for chart
  public async fetchRateHistory(base: string, symbol: string, start: string, end: string): Promise<any> {
    const isBaseSupported = this.frankfurterSupported.has(base);
    const isSymbolSupported = this.frankfurterSupported.has(symbol);

    if (!isBaseSupported || !isSymbolSupported) {
      return this.generateMockHistory(base, symbol, start, end);
    }

    const url = `https://api.frankfurter.dev/v1/${start}..${end}?base=${base}&symbols=${symbol}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  }

  // Helper to compute previous business day
  public getPreviousBusinessDay(dateStr: string): string {
    const date = new Date(dateStr);
    const day = date.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
    let daysToSubtract = 1;
    if (day === 1) { // Monday
      daysToSubtract = 3; // Go back to Friday
    } else if (day === 0) { // Sunday
      daysToSubtract = 2; // Go back to Friday
    }
    const prevDate = new Date(date.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);
    return prevDate.toISOString().split('T')[0];
  }

  // Fetch ticker items
  public async fetchTickerData(): Promise<TickerItem[]> {
    // 1. Fetch latest with base USD
    const latestRes = await this.fetchLatestRates('USD');
    const latestRates = { ...latestRes.rates, USD: 1.0 };
    const latestDate = latestRes.date;

    // 2. Fetch prev business day rates with base USD
    const prevDate = this.getPreviousBusinessDay(latestDate);
    let prevRates: { [key: string]: number } = {};
    try {
      const prevRes = await fetch(`https://api.frankfurter.dev/v1/${prevDate}?base=USD`).then(r => r.json());
      prevRates = { ...prevRes.rates, USD: 1.0 };
    } catch (e) {
      console.warn('Could not fetch previous rates, falling back to same rates', e);
      prevRates = { ...latestRates };
    }

    // Cache these rates for global access
    this.latestRatesUSD.set(latestRates);
    this.prevRatesUSD.set(prevRates);

    // Default pairs to track in the ticker
    const pairsToTrack = [
      { base: 'USD', symbol: 'JPY', display: 'USD/JPY' },
      { base: 'GBP', symbol: 'USD', display: 'GBP/USD' },
      { base: 'USD', symbol: 'CHF', display: 'USD/CHF' },
      { base: 'EUR', symbol: 'GBP', display: 'EUR/GBP' },
      { base: 'AUD', symbol: 'USD', display: 'AUD/USD' },
      { base: 'USD', symbol: 'CAD', display: 'USD/CAD' },
      { base: 'EUR', symbol: 'USD', display: 'EUR/USD' },
      { base: 'USD', symbol: 'CNY', display: 'USD/CNY' }
    ];

    const tickerItems: TickerItem[] = [];

    for (const p of pairsToTrack) {
      const latestBaseRate = latestRates[p.base];
      const latestSymbolRate = latestRates[p.symbol];
      const prevBaseRate = prevRates[p.base];
      const prevSymbolRate = prevRates[p.symbol];

      if (latestBaseRate && latestSymbolRate && prevBaseRate && prevSymbolRate) {
        // Rate A/B is rate(B) / rate(A) when base is USD
        const latestRate = latestSymbolRate / latestBaseRate;
        const prevRate = prevSymbolRate / prevBaseRate;

        const change = latestRate - prevRate;
        const changePercent = (change / prevRate) * 100;

        tickerItems.push({
          pair: p.display,
          rate: latestRate,
          change,
          changePercent,
          isUp: change >= 0
        });
      }
    }

    return tickerItems;
  }

  public showToast(title: string, message: string, type: 'success' | 'warning' | 'info' = 'info'): void {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastMessage = { id, title, message, type };
    this.toasts.update(list => [...list, toast]);
    setTimeout(() => {
      this.removeToast(id);
    }, 5000);
  }

  public removeToast(id: string): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  public updateFavoriteThreshold(id: string, threshold: number | undefined, type: 'above' | 'below'): void {
    const list = this.favorites().map(f => {
      if (f.id === id) {
        return { ...f, threshold, thresholdType: type };
      }
      return f;
    });
    this.saveFavorites(list);
  }

  private checkThresholds(): void {
    const favsWithRates = this.favoritesWithRates();
    for (const item of favsWithRates) {
      if (item.threshold !== undefined && item.threshold !== null && item.threshold > 0) {
        const currentRate = item.rate;
        const threshold = item.threshold;
        const type = item.thresholdType || 'above';
        
        let conditionMet = false;
        if (type === 'above' && currentRate > threshold) {
          conditionMet = true;
        } else if (type === 'below' && currentRate < threshold) {
          conditionMet = true;
        }

        if (conditionMet) {
          const alertKey = `${item.id}-${threshold}-${type}-${conditionMet}`;
          if (!this.triggeredAlerts.has(alertKey)) {
            this.triggeredAlerts.add(alertKey);
            this.showToast(
              'Threshold Hit! 🔔',
              `${item.base} to ${item.symbol} is currently ${currentRate.toFixed(4)} (${type === 'above' ? '>' : '<'} ${threshold})`,
              'warning'
            );
          }
        }
      }
    }
  }
}
