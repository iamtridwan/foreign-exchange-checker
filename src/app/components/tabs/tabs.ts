import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TabItem {
  id: string;
  label: string;
  badge?: number | string;
  route?: string;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabs.html',
  styleUrl: './tabs.css'
})
export class TabsComponent {
  @Input({ required: true }) tabs: TabItem[] = [];
  @Input({ required: true }) activeId: string = '';
  @Output() tabChange = new EventEmitter<TabItem>();

  public onTabClick(tab: TabItem): void {
    this.tabChange.emit(tab);
  }
}
