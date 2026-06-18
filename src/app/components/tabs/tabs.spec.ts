import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabsComponent, TabItem } from './tabs';

describe('TabsComponent', () => {
  let component: TabsComponent;
  let fixture: ComponentFixture<TabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.tabs = [];
    component.activeId = '';
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render input tabs', () => {
    const testTabs: TabItem[] = [
      { id: 'tab1', label: 'Tab 1' },
      { id: 'tab2', label: 'Tab 2', badge: 5 }
    ];
    component.tabs = testTabs;
    component.activeId = 'tab1';
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent?.trim()).toContain('Tab 1');
    expect(buttons[1].textContent?.trim()).toContain('Tab 2');
    
    const badge = compiled.querySelector('span.bg-secondary-dark');
    expect(badge?.textContent?.trim()).toBe('5');
  });

  it('should emit tabChange on click', () => {
    const testTab: TabItem = { id: 'tab1', label: 'Tab 1' };
    component.tabs = [testTab];
    component.activeId = 'tab1';
    fixture.detectChanges();

    let emittedTab: TabItem | undefined;
    component.tabChange.subscribe((tab) => emittedTab = tab);

    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button');
    button?.click();

    expect(emittedTab).toEqual(testTab);
  });
});
