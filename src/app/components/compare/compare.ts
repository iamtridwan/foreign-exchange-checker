import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Empty } from '../empty/empty';
import { ExchangeRateService } from '../../services/exchange-rate.service';

@Component({
  selector: 'app-compare',
  imports: [CommonModule, Empty],
  templateUrl: './compare.html',
  styleUrl: './compare.css',
})
export class Compare {
  private router = inject(Router);
  public title = 'No comparison available';
  public description = 'Enter an amount in SEND above to see what your money is worth in other currencies.';

  public isAmountEmpty = computed(() => {
    const amt = this.fxService.sendAmount();
    return !amt || isNaN(Number(amt)) || Number(amt) <= 0;
  });

  public compareGrid = computed(() => {
    const base = this.fxService.sendCurrency();
    const amountVal = Number(this.fxService.sendAmount());
    const latestUSD = this.fxService.latestRatesUSD();
    const favs = this.fxService.favorites();

    if (isNaN(amountVal) || amountVal <= 0 || Object.keys(latestUSD).length === 0) {
      return [];
    }

    // Dynamic 8 targets: GBP, JPY, CHF, CAD, AUD, INR, CNY, BDT.
    // If the base currency matches one of them, replace it with USD (or EUR if base is USD).
    const defaultTargets = ['GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'INR', 'CNY', 'BDT'];
    const idx = defaultTargets.indexOf(base);
    if (idx >= 0) {
      const fallback = base === 'USD' ? 'EUR' : 'USD';
      defaultTargets[idx] = fallback;
    }

    const currenciesList = this.fxService.getSupportedCurrencies();

    return defaultTargets.map(code => {
      const info = currenciesList.find(c => c.code === code) || {
        code,
        name: code === 'GBP' ? 'British Pound' : code === 'JPY' ? 'Japanese Yen' : code,
        flagCode: code.toLowerCase()
      };

      const rateA = latestUSD[base] || 1.0;
      const rateB = latestUSD[code] || 1.0;

      // Rate base -> code is rate(code) / rate(base) when base is USD
      const rate = rateB / rateA;
      const converted = amountVal * rate;
      const isPinned = favs.some(f => f.base === base && f.symbol === code);

      return {
        code,
        name: info.name,
        flagCode: info.flagCode,
        rate,
        converted,
        isPinned
      };
    });
  });

  constructor(public fxService: ExchangeRateService) {}

  public togglePin(symbol: string): void {
    const base = this.fxService.sendCurrency();
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

  public getDecimalFormat(code: string): string {
    return (code === 'JPY' || code === 'BDT' || code === 'KRW' || code === 'VND' || code === 'IDR' || code === 'LBP' || code === 'HUF')
      ? '1.0-0'
      : '1.2-2';
  }

  public selectComparison(baseCode: string, targetCode: string): void {
    this.fxService.sendCurrency.set(baseCode);
    this.fxService.receiveCurrency.set(targetCode);
    this.router.navigate(['/history']);
  }
}
