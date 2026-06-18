import { Component, Input, Output, EventEmitter, OnInit, signal, computed, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyInfo, ExchangeRateService } from '../../services/exchange-rate.service';

@Component({
  selector: 'app-currency-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './currency-picker.component.html',
  styleUrl: './currency-picker.component.css'
})
export class CurrencyPickerComponent implements OnInit, AfterViewInit {
  @Input() selectedCurrency: string = '';
  @Input() currencies: CurrencyInfo[] = [];

  @Output() select = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('modalContainer') modalContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('listContainer') listContainer!: ElementRef<HTMLDivElement>;

  public searchQuery: string = '';
  public focusedIndex: number = -1;

  // List of popular currency codes
  private readonly popularCodes = new Set(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF']);

  constructor(public fxService: ExchangeRateService) {}

  ngOnInit(): void {
    // Reset focused index
    this.focusedIndex = -1;
  }

  ngAfterViewInit(): void {
    // Focus search input automatically on open
    setTimeout(() => {
      this.searchInput.nativeElement.focus();
    }, 50);
  }

  // Split currencies into Popular and Others
  public popularList = computed(() => {
    return this.currencies.filter(c => this.popularCodes.has(c.code));
  });

  public othersList = computed(() => {
    return this.currencies.filter(c => !this.popularCodes.has(c.code));
  });

  // Filter lists based on search query
  public filteredPopular = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.popularList();
    return this.popularList().filter(c => 
      c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  });

  public filteredOthers = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.othersList();
    return this.othersList().filter(c => 
      c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  });

  // Combine lists for flattened keyboard navigation index
  public getFlatFilteredList(): CurrencyInfo[] {
    return [...this.filteredPopular(), ...this.filteredOthers()];
  }

  public onSearchChange(): void {
    this.focusedIndex = -1; // Reset highlight when query changes
  }

  public isItemFocused(index: number): boolean {
    return this.focusedIndex === index;
  }

  public selectCurrency(code: string): void {
    this.select.emit(code);
  }

  public onBackdropClick(event: MouseEvent): void {
    // Close only when clicking the backdrop overlay
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  public onKeyDown(event: KeyboardEvent): void {
    const flatList = this.getFlatFilteredList();
    
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close.emit();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (flatList.length > 0) {
        this.focusedIndex = (this.focusedIndex + 1) % flatList.length;
        this.scrollToFocusedItem();
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (flatList.length > 0) {
        this.focusedIndex = (this.focusedIndex - 1 + flatList.length) % flatList.length;
        this.scrollToFocusedItem();
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.focusedIndex >= 0 && this.focusedIndex < flatList.length) {
        this.selectCurrency(flatList[this.focusedIndex].code);
      } else if (flatList.length > 0) {
        // If nothing highlighted but user pressed Enter, select first matching item
        this.selectCurrency(flatList[0].code);
      }
    }
  }

  private scrollToFocusedItem(): void {
    setTimeout(() => {
      const listEl = this.listContainer.nativeElement;
      const buttons = listEl.querySelectorAll('button');
      if (this.focusedIndex >= 0 && this.focusedIndex < buttons.length) {
        const targetBtn = buttons[this.focusedIndex] as HTMLButtonElement;
        // Check if item is outside container viewport, if so scroll to it
        const listTop = listEl.scrollTop;
        const listBottom = listTop + listEl.clientHeight;
        const btnTop = targetBtn.offsetTop - listEl.offsetTop;
        const btnBottom = btnTop + targetBtn.clientHeight;

        if (btnTop < listTop) {
          listEl.scrollTop = btnTop;
        } else if (btnBottom > listBottom) {
          listEl.scrollTop = btnBottom - listEl.clientHeight;
        }
      }
    });
  }
}
