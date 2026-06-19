import { Injectable, signal, WritableSignal, computed } from '@angular/core';

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
      const prevRateA = prevUSD[f.base] || 1.0;
      const prevRateB = prevUSD[f.symbol] || 1.0;

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

  constructor() {
    // Pre-populate with fallback rates so favorites computed signal has values immediately
    this.latestRatesUSD.set(this.getFallbackRates('USD'));
    this.prevRatesUSD.set(this.getFallbackRates('USD'));
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const favs = localStorage.getItem('fx_favorites');
      if (favs) this.favorites.set(JSON.parse(favs));

      const logs = localStorage.getItem('fx_logs');
      if (logs) this.conversionLog.set(JSON.parse(logs));

      const tab = localStorage.getItem('fx_last_tab');
      if (tab) this.lastActiveTab.set(tab);
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
      EUR: 0.8625,
      GBP: 0.7458,
      JPY: 160.31,
      AUD: 1.4164,
      CAD: 1.4012,
      CHF: 0.7931,
      CNY: 6.7595,
      NZD: 1.7213,
      SEK: 9.3961,
      NOK: 9.4970,
      DKK: 6.4489,
      TRY: 46.3170,
      KRW: 1517.08,
      SGD: 1.2834,
      HKD: 7.8355,
      INR: 94.53,
      MXN: 17.2105,
      ZAR: 16.2217,
      BRL: 5.0840,
      PLN: 3.6589,
      RON: 4.5138,
      BGN: 1.7825,
      CZK: 20.833,
      HUF: 301.68,
      IDR: 17803,
      ILS: 2.9207,
      ISK: 124.58,
      MYR: 4.0680,
      PHP: 60.4380,
      THB: 32.6150,
      AED: 3.6725,
      ARS: 900.50,
      BDT: 117.50,
      BHD: 0.3760,
      CLP: 925.00,
      COP: 4150.00,
      EGP: 47.80,
      GHS: 11.20,
      HNL: 24.70,
      HRK: 7.02,
      HTG: 132.50,
      JOD: 0.7090,
      KES: 129.00,
      KWD: 0.3070,
      LBP: 89500.00,
      LKR: 302.00,
      MAD: 9.95,
      NGN: 1505.00,
      NPR: 133.50,
      OMR: 0.3845,
      PEN: 3.75,
      PKR: 278.50,
      QAR: 3.64,
      RUB: 89.50,
      SAR: 3.75,
      TWD: 32.40,
      UAH: 40.50,
      VND: 25450.00
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
    const isSupported = this.frankfurterSupported.has(base);
    const apiBase = isSupported ? base : 'USD';
    
    const url = `https://api.frankfurter.dev/v1/latest?base=${apiBase}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    
    const allRatesUSD = this.getFallbackRates('USD');
    
    if (apiBase === 'USD') {
      for (const code of Object.keys(data.rates)) {
        allRatesUSD[code] = data.rates[code];
      }
    } else {
      const usdInBase = data.rates['USD'] || (1.0 / (allRatesUSD[apiBase] || 1.0));
      allRatesUSD['USD'] = 1.0;
      for (const code of Object.keys(data.rates)) {
        if (code === 'USD') continue;
        allRatesUSD[code] = data.rates[code] / usdInBase;
      }
      allRatesUSD[apiBase] = 1.0 / usdInBase;
    }
    
    const targetBaseRateInUSD = allRatesUSD[base] || 1.0;
    const finalRates: { [key: string]: number } = {};
    for (const code of Object.keys(allRatesUSD)) {
      if (code === base) continue;
      finalRates[code] = Number((allRatesUSD[code] / targetBaseRateInUSD).toFixed(5));
    }
    
    return {
      amount: 1.0,
      base: base,
      date: data.date || new Date().toISOString().split('T')[0],
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
}
