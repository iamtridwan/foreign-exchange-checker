import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Empty } from '../empty/empty';
import { ExchangeRateService } from '../../services/exchange-rate.service';

@Component({
  selector: 'app-favorites',
  imports: [CommonModule, Empty],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css',
})
export class Favorites {
  private router = inject(Router);
  public title = 'No pinned pairs yet';
  public description = 'Pin a pair to track its rate here. Tap the star icon on any conversion or comparison row.';

  constructor(public fxService: ExchangeRateService) {}

  public unpinFavorite(id: string): void {
    this.fxService.removeFavorite(id);
  }

  public selectFavorite(base: string, symbol: string): void {
    this.fxService.sendCurrency.set(base);
    this.fxService.receiveCurrency.set(symbol);
    this.router.navigate(['/history']);
  }

  public updateThresholdType(id: string, type: 'above' | 'below'): void {
    const fav = this.fxService.favorites().find(f => f.id === id);
    const threshold = fav?.threshold;
    this.fxService.updateFavoriteThreshold(id, threshold, type);
  }

  public updateThresholdValue(id: string, val: string): void {
    const fav = this.fxService.favorites().find(f => f.id === id);
    const type = fav?.thresholdType || 'above';
    const numVal = val ? parseFloat(val) : undefined;
    this.fxService.updateFavoriteThreshold(id, numVal, type);
  }

  public clearThreshold(id: string): void {
    const fav = this.fxService.favorites().find(f => f.id === id);
    const type = fav?.thresholdType || 'above';
    this.fxService.updateFavoriteThreshold(id, undefined, type);
  }
}
