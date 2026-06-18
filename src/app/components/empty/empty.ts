import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty',
  imports: [],
  // inputs: ['title', 'description'],
  templateUrl: './empty.html',
  styleUrl: './empty.css',
})
export class Empty {

  title = input<string>();
  description = input<string>();

}
