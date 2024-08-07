import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WageCalculator } from './wage-calculator.component';

describe('HomeComponent', () => {
  let component: WageCalculator;
  let fixture: ComponentFixture<WageCalculator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WageCalculator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WageCalculator);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
