import {Routes} from '@angular/router';
import {WageCalculator} from "./wage-calculator/wage-calculator.component";
import {InferiorCalculatorComponent} from "./inferior-calculator/inferior-calculator.component";

export const routes: Routes = [
  {path: "matu", component: WageCalculator},
  {path: "frants", component: InferiorCalculatorComponent},
  {path: "**", component: WageCalculator},
];
