import { Component } from '@angular/core';
import { Empty } from '../empty/empty';

@Component({
  selector: 'app-compare',
  imports: [Empty],
  templateUrl: './compare.html',
  styleUrl: './compare.css',
})
export class Compare {
  title = "No comparison available"
  description = "Enter an amount in SEND above to see what your money is worth in other currencies."

}
