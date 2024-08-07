import {ChangeDetectionStrategy, Component, computed} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {toSignal} from "@angular/core/rxjs-interop";
import {startWith} from "rxjs";
import {DecimalPipe, NgIf} from "@angular/common";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    DecimalPipe
  ],
  templateUrl: './wage-calculator2024.component.html',
  styleUrl: './wage-calculator2024.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WageCalculator2024 {
  wageForm = new FormGroup({
    grossPay: new FormControl<number>(0),
    thirdPillarAmount: new FormControl<number>(0, Validators.max(500)),
    retirementFeePercentage: new FormControl<number>(2),
    useIncomeTaxFreeMinimum: new FormControl<boolean>(false)
  })

  wageFormValue = toSignal(this.wageForm.valueChanges.pipe(startWith(this.wageForm.value)))

  wageResult = computed(() => {
    let grossPay = this.wageFormValue()?.grossPay ?? 0;
    if (grossPay < 0) grossPay = 0;
    const retirementFeePercentage = this.wageFormValue()?.retirementFeePercentage ?? 2;
    const thirdPillarAmount = this.wageFormValue()?.thirdPillarAmount ?? 0;
    const useIncomeTaxFreeMinimum = this.wageFormValue()?.useIncomeTaxFreeMinimum ?? false;

    return getWageComposition2024(grossPay, retirementFeePercentage, thirdPillarAmount, useIncomeTaxFreeMinimum);
  });
}

const UNEMPLOYMENT_FEE_MULTIPLIER = 1.6 / 100; // 1.6%
const INCOME_TAX_MULTIPLIER = 20 / 100; // 20%
const SECOND_PILLAR_NATIONAL_MULTIPLIER = 4 / 100; // 4%

type WageResultError = { type: "error"; errorReason: string };

type WageResultSuccess = {
  secondPillarEmployeeAmount: number;
  secondPillarNationalAmount: number
  secondPillarNationalPercentage: number
  secondPillarEmployeePercentage: number;
  thirdPillarAmount: number;
  totalPensionContributionAmount: number
  totalPensionContributionPercentage: number
  unemploymentFeePercentage: number;
  thirdPillarTaxFreeAmount: number;
  incomeTaxFreeAmount: number;
  type: "success";
  netPay: number;
  netPayPercentage: number;
  unemploymentFee: number;
  incomeTaxPercentage: number;
  incomeTax: number;
  checkSum: number;
  thirdPillarPercentage: number
};

/**
 *
 * @param grossPay
 * @param secondPillarPercentage II samba kogumispensioni töötaja protsent (0%, 2%, 4%, 6%)
 * @param thirdPillarAmount III samba kogumispensioni sissemakse otse palgast
 * @param useIncomeTaxFreeMinimum Kasuta tulumaksuvbaba miinimumi maksusoodustust
 */
function getWageComposition2024(grossPay: number, secondPillarPercentage: number, thirdPillarAmount: number, useIncomeTaxFreeMinimum: boolean): WageResultSuccess | WageResultError {

  const secondPillarMultiplier = secondPillarPercentage > 0 ? secondPillarPercentage / 100 : 0;
  const thirdPillarTaxFreeAmount = getThirdPillarTaxFreeAmount(grossPay, thirdPillarAmount);
  if (thirdPillarAmount > thirdPillarTaxFreeAmount) {
    thirdPillarAmount = thirdPillarTaxFreeAmount; //Don't allow bigger payments than tax free amount (current behaviour)
  }

  const incomeTaxFreeAmount = getIncomeTaxFreeAmount(grossPay, useIncomeTaxFreeMinimum);
  const unemploymentFee = grossPay * UNEMPLOYMENT_FEE_MULTIPLIER;
  const secondPillarAmount = grossPay * secondPillarMultiplier;
  const secondPillarNationalAmount = secondPillarPercentage > 0 ? grossPay * SECOND_PILLAR_NATIONAL_MULTIPLIER : 0;

  let incomeTaxableAmount = grossPay - incomeTaxFreeAmount - unemploymentFee - secondPillarAmount - thirdPillarTaxFreeAmount;
  if (incomeTaxableAmount < 0) incomeTaxableAmount = 0;

  const incomeTax = incomeTaxableAmount * INCOME_TAX_MULTIPLIER;
  const netPay = grossPay - incomeTax - unemploymentFee - secondPillarAmount - thirdPillarAmount
  if (netPay < 0) {
    return {type: 'error', errorReason: "Net pay is less than 0"};
  }

  return {
    checkSum: (netPay + incomeTax + unemploymentFee + secondPillarAmount + thirdPillarAmount),
    incomeTax: incomeTax,
    incomeTaxFreeAmount: incomeTaxFreeAmount,
    incomeTaxPercentage: getPercentageOfGross(incomeTax, grossPay),
    netPay: netPay,
    netPayPercentage: getPercentageOfGross(netPay, grossPay),
    secondPillarNationalAmount: secondPillarNationalAmount,
    secondPillarNationalPercentage: getPercentageOfGross(secondPillarNationalAmount, grossPay),
    secondPillarEmployeeAmount: secondPillarAmount,
    secondPillarEmployeePercentage: getPercentageOfGross(secondPillarAmount, grossPay),
    thirdPillarAmount: thirdPillarAmount,
    thirdPillarPercentage: getPercentageOfGross(thirdPillarAmount, grossPay),
    thirdPillarTaxFreeAmount: thirdPillarTaxFreeAmount,
    totalPensionContributionAmount: (secondPillarAmount + thirdPillarAmount + secondPillarNationalAmount),
    totalPensionContributionPercentage: getPercentageOfGross(secondPillarAmount + thirdPillarAmount + secondPillarNationalAmount, grossPay),
    type: "success",
    unemploymentFee: unemploymentFee,
    unemploymentFeePercentage: getPercentageOfGross(unemploymentFee, grossPay),
  }
}

function getIncomeTaxFreeAmount(grossPay: number, useIncomeTaxFreeMinimum: boolean) {
  const TAX_FREE_GAP_START = 1200;
  const TAX_FREE_GAP_END = 2100;
  const MAX_TAX_FREE_AMOUNT = 654;

  if (!useIncomeTaxFreeMinimum) {
    return 0
  }

  if (grossPay > TAX_FREE_GAP_END) {
    return 0;
  }
  if (grossPay < TAX_FREE_GAP_START) {
    return MAX_TAX_FREE_AMOUNT;
  }
  return MAX_TAX_FREE_AMOUNT - MAX_TAX_FREE_AMOUNT / 900 * (grossPay - TAX_FREE_GAP_START)
}

function getThirdPillarTaxFreeAmount(grossPay: number, thirdPillarAmount: number) {
  let maxTaxFreeAmount = grossPay * 0.15;
  if (maxTaxFreeAmount > 500) maxTaxFreeAmount = 500;

  if (thirdPillarAmount >= maxTaxFreeAmount) {
    return maxTaxFreeAmount;
  } else {
    return thirdPillarAmount;
  }
}

function getPercentageOfGross(amount: number, grossPay: number) {
  if (grossPay === 0 || amount === 0) return 0;
  return amount * 100 / grossPay
}
