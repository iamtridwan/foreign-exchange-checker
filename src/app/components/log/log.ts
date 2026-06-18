import { Component } from '@angular/core';
import { Empty } from '../empty/empty';

@Component({
  selector: 'app-log',
  imports: [Empty],
  templateUrl: './log.html',
  styleUrl: './log.css',
})
export class Log {
  title = "No conversions logged yet"
  description = "Every conversion is recorded here automatically when you tap LOG CONVERSION. Your log is private to this session and this browser."

}
