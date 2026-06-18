import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExchangePicker } from './exchange-picker';

describe('ExchangePicker', () => {
  let component: ExchangePicker;
  let fixture: ComponentFixture<ExchangePicker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExchangePicker]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExchangePicker);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
