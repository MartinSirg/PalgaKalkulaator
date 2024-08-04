import {ChangeDetectionStrategy, Component, computed} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {toSignal} from "@angular/core/rxjs-interop";
import {startWith} from "rxjs";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './wage-calculator2024.component.html',
  styleUrl: './wage-calculator2024.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WageCalculator2024 {
  wageForm = new FormGroup({
    grossPay: new FormControl<number>(0),
    thirdPillarAmount: new FormControl<number>(0),
    retirementFeePercentage: new FormControl<number>(2),
  })

  wageFormValue = toSignal(this.wageForm.valueChanges.pipe(startWith(this.wageForm.value)))

  wageResult = computed(() => {
    let grossPay = this.wageFormValue()?.grossPay ?? 0;
    if (grossPay < 0) grossPay = 0;
    const retirementFeePercentage = this.wageFormValue()?.retirementFeePercentage ?? 2;
    const thirdPillarAmount = this.wageFormValue()?.thirdPillarAmount ?? 0;

    return getWageComposition2024(grossPay, retirementFeePercentage, thirdPillarAmount);
  });
}

const UNEMPLOYMENT_FEE_MULTIPLIER = 1.6 / 100; // 1.6%
const INCOME_TAX_MULTIPLIER = 20 / 100; // 20%
const MAX_TAX_FREE_THIRD_PILLAR_AMOUNT = 500;

/**
 *
 * @param grossPay
 * @param secondPillarPercentage II samba kogumispensioni töötaja protsent (0%, 2%, 4%, 6%)
 * @param thirdPillarAmount
 */
function getWageComposition2024(grossPay: number, secondPillarPercentage: number, thirdPillarAmount: number) {
  const secondPillarMultiplier = secondPillarPercentage > 0 ? secondPillarPercentage / 100 : 0;
  const taxFreeThirdPillarAmount = thirdPillarAmount > MAX_TAX_FREE_THIRD_PILLAR_AMOUNT
    ? MAX_TAX_FREE_THIRD_PILLAR_AMOUNT
    : thirdPillarAmount;

  const taxFreeAmount = getTaxFreeAmount(grossPay);
  const unemploymentFee = grossPay * UNEMPLOYMENT_FEE_MULTIPLIER;
  const secondPillarAmount = grossPay * secondPillarMultiplier;

  let taxableAmount = grossPay - taxFreeAmount - unemploymentFee - secondPillarAmount - taxFreeThirdPillarAmount;
  if (taxableAmount < 0) taxableAmount = 0;

  const incomeTax = taxableAmount * INCOME_TAX_MULTIPLIER;
  //TODO: fix third pillar amount can be so large that net pay is negative
  const netPay = grossPay - incomeTax - unemploymentFee - secondPillarAmount - thirdPillarAmount

  return {
    taxFreeAmount: taxFreeAmount.toFixed(2),
    unemploymentFee: unemploymentFee.toFixed(2),
    secondPillarAmount: secondPillarAmount.toFixed(2),
    thirdPillarAmount: thirdPillarAmount.toFixed(2),
    incomeTax: incomeTax.toFixed(2),
    netPay: netPay.toFixed(2),
    checkSum: (netPay + incomeTax + unemploymentFee + secondPillarAmount + thirdPillarAmount).toFixed(2),
    netPayPercentage: getPercentageOfGross(netPay, grossPay),
    unemploymentFeePercentage: getPercentageOfGross(unemploymentFee, grossPay),
    secondPillarPercentage: getPercentageOfGross(secondPillarAmount, grossPay),
    thirdPillarPercentage: getPercentageOfGross(thirdPillarAmount, grossPay),
    incomeTaxPercentage: getPercentageOfGross(incomeTax, grossPay),
  }
}

function getTaxFreeAmount(grossPay: number) {
  const TAX_FREE_GAP_START = 1200;
  const TAX_FREE_GAP_END = 2100;
  const MAX_TAX_FREE_AMOUNT = 654;

  if (grossPay > TAX_FREE_GAP_END) {
    return 0;
  }
  if (grossPay < TAX_FREE_GAP_START) {
    return MAX_TAX_FREE_AMOUNT;
  }
  return MAX_TAX_FREE_AMOUNT - MAX_TAX_FREE_AMOUNT / 900 * (grossPay - TAX_FREE_GAP_START)
}

function getPercentageOfGross(amount: number, grossPay: number) {
  if (grossPay === 0 || amount === 0) return "0.00%"
  return `${(amount * 100 / grossPay).toFixed(2)}%`
}
