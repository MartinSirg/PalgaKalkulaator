import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InferiorCalculatorComponent } from './inferior-calculator.component';

describe('InferiorCalculatorComponent', () => {
  let component: InferiorCalculatorComponent;
  let fixture: ComponentFixture<InferiorCalculatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InferiorCalculatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InferiorCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
