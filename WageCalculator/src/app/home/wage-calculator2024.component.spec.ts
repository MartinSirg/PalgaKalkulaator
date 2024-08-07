import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Calculator2024 } from './wage-calculator2024.component';

describe('HomeComponent', () => {
  let component: Calculator2024;
  let fixture: ComponentFixture<Calculator2024>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Calculator2024]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Calculator2024);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
