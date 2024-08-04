import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WageCalculator2024 } from './wage-calculator2024.component';

describe('HomeComponent', () => {
  let component: WageCalculator2024;
  let fixture: ComponentFixture<WageCalculator2024>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WageCalculator2024]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WageCalculator2024);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
