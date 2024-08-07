import {Routes} from '@angular/router';
import {WageCalculator} from "./wage-calculator/wage-calculator.component";

export const routes: Routes = [
  {path: "**", component: WageCalculator},
];
