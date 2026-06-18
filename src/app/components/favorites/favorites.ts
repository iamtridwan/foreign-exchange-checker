import { Component } from '@angular/core';
import { Empty } from '../empty/empty';

@Component({
  selector: 'app-favorites',
  imports: [Empty],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css',
})
export class Favorites {
  title = "No pinned pairs yet"
  description = "Pin a pair to track its rate here. Tap the star icon on any conversion or comparison row."

}
