import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Empty } from '../empty/empty';
import { ExchangeRateService } from '../../services/exchange-rate.service';

@Component({
  selector: 'app-favorites',
  imports: [CommonModule, Empty],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css',
})
export class Favorites {
  public title = 'No pinned pairs yet';
  public description = 'Pin a pair to track its rate here. Tap the star icon on any conversion or comparison row.';

  constructor(public fxService: ExchangeRateService) {}

  public unpinFavorite(id: string): void {
    this.fxService.removeFavorite(id);
  }
}
