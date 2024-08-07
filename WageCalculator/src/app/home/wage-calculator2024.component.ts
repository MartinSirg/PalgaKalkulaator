import {ChangeDetectionStrategy, Component, computed} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {toSignal} from "@angular/core/rxjs-interop";
import {startWith} from "rxjs";
import {DecimalPipe, NgIf} from "@angular/common";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    DecimalPipe,
    FormsModule
  ],
  templateUrl: './wage-calculator2024.component.html',
  styleUrl: './wage-calculator2024.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Calculator2024 {
  useMaxPension: boolean = false;
  wageForm = new FormGroup({
    grossPay: new FormControl<number>(0),
    thirdPillarAmount: new FormControl<number>(0, Validators.max(500)),
    secondPillarPercentage: new FormControl<number>(2),
    defenceTaxPercentage: new FormControl<number>(0),
    incomeTaxPercentage: new FormControl<number>(20),
    useIncomeTaxFreeMinimum: new FormControl<boolean>(false),
    useIncomeTaxCurve: new FormControl<boolean>(true),
    incomeTaxFreeMinimum: new FormControl<number>(0),
  })

  wageFormValue = toSignal(this.wageForm.valueChanges.pipe(startWith(this.wageForm.value)))

  wageResult = computed(() => {
    let grossPay = this.wageFormValue()?.grossPay ?? 0;
    if (grossPay < 0) grossPay = 0;
    const retirementFeePercentage = this.wageFormValue()?.secondPillarPercentage ?? 2;
    const incomeTaxPercentage = this.wageFormValue()?.incomeTaxPercentage ?? 20;
    const thirdPillarAmount = this.wageFormValue()?.thirdPillarAmount ?? 0;
    const useIncomeTaxCurve = this.wageFormValue()?.useIncomeTaxCurve ?? false;
    const useIncomeTaxFreeMinimum = this.wageFormValue()?.useIncomeTaxFreeMinimum ?? false;
    const incomeTaxFreeMinimum = this.wageFormValue()?.incomeTaxFreeMinimum ?? 0;
    const defenceTaxPercentage = this.wageFormValue()?.defenceTaxPercentage ?? 0;


    return getWageComposition2024(grossPay, retirementFeePercentage, thirdPillarAmount, useIncomeTaxFreeMinimum, incomeTaxPercentage, incomeTaxFreeMinimum, useIncomeTaxCurve, defenceTaxPercentage);
  });

  set2024TaxPreset() {
    const currentSecondPillarPercentage  = this.wageForm.controls.secondPillarPercentage.value ?? 2;
    let secondPillarPercentage = 0;

    if (this.useMaxPension) secondPillarPercentage = 2;
    else if (currentSecondPillarPercentage > 2) secondPillarPercentage = 2;
    else secondPillarPercentage = currentSecondPillarPercentage;

    this.wageForm.patchValue({
      incomeTaxPercentage: 20,
      defenceTaxPercentage: 0,
      useIncomeTaxCurve: true,
      thirdPillarAmount: this.useMaxPension ? 500 : this.wageForm.controls.thirdPillarAmount.value,
      incomeTaxFreeMinimum: 654,
      secondPillarPercentage: secondPillarPercentage
    });
  }

  set2025TaxPreset() {
    this.wageForm.patchValue({
      incomeTaxPercentage: 22,
      defenceTaxPercentage: 0,
      useIncomeTaxCurve: true,
      secondPillarPercentage: this.useMaxPension ? 6 : this.wageForm.controls.secondPillarPercentage.value,
      thirdPillarAmount: this.useMaxPension ? 500 : this.wageForm.controls.thirdPillarAmount.value,
      incomeTaxFreeMinimum: 700,
    });
  }

  set2026TaxPreset() {
    this.wageForm.patchValue({
      incomeTaxPercentage: 22,
      defenceTaxPercentage: 2,
      useIncomeTaxCurve: false,
      useIncomeTaxFreeMinimum: true,
      secondPillarPercentage: this.useMaxPension ? 6 : this.wageForm.controls.secondPillarPercentage.value,
      thirdPillarAmount: this.useMaxPension ? 500 : this.wageForm.controls.thirdPillarAmount.value,
      incomeTaxFreeMinimum: 700,
    });
  }
}

const UNEMPLOYMENT_FEE_MULTIPLIER = 1.6 / 100; // 1.6%
const SECOND_PILLAR_NATIONAL_MULTIPLIER = 4 / 100; // 4%

type WageResultError = { type: "error"; errorReason: string };

type WageResultSuccess = {
  checkSum: number;
  defenceTax: number
  defenceTaxPercentage: number
  incomeTax: number;
  incomeTaxFreeAmount: number;
  incomeTaxPercentage: number
  netPay: number
  netPayPercentage: number;
  secondPillarEmployeeAmount: number;
  secondPillarEmployeePercentage: number;
  secondPillarNationalAmount: number;
  secondPillarNationalPercentage: number;
  thirdPillarAmount: number;
  thirdPillarPercentage: number;
  thirdPillarTaxFreeAmount: number;
  totalPensionContributionAmount: number;
  totalPensionContributionPercentage: number;
  type: "success";
  unemploymentFee: number;
  unemploymentFeePercentage: number;
};

/**
 *
 * @param grossPay
 * @param secondPillarPercentage II samba kogumispensioni töötaja protsent (0%, 2%, 4%, 6%)
 * @param thirdPillarAmount III samba kogumispensioni sissemakse otse palgast
 * @param useIncomeTaxFreeMinimum Kasuta tulumaksuvbaba miinimumi maksusoodustust
 */
function getWageComposition2024(
  grossPay: number,
  secondPillarPercentage: number,
  thirdPillarAmount: number,
  useIncomeTaxFreeMinimum: boolean,
  incomeTaxPercentage: number,
  incomeTaxFreeMinimum: number,
  useIncomeTaxCurve: boolean,
  defenceTaxPercentage: number
): WageResultSuccess | WageResultError {
  const incomeTaxMultiplier = incomeTaxPercentage > 0 ? incomeTaxPercentage / 100 : 0;
  const defenceTaxMultiplier = defenceTaxPercentage > 0 ? defenceTaxPercentage / 100 : 0;
  const secondPillarMultiplier = secondPillarPercentage > 0 ? secondPillarPercentage / 100 : 0;
  const thirdPillarTaxFreeAmount = getThirdPillarTaxFreeAmount(grossPay, thirdPillarAmount);
  if (thirdPillarAmount > thirdPillarTaxFreeAmount) {
    thirdPillarAmount = thirdPillarTaxFreeAmount; //Don't allow bigger payments than tax free amount (current behaviour)
  }

  const incomeTaxFreeAmount = getIncomeTaxFreeAmount(grossPay, useIncomeTaxFreeMinimum, useIncomeTaxCurve, incomeTaxFreeMinimum);
  const unemploymentFee = grossPay * UNEMPLOYMENT_FEE_MULTIPLIER;
  const secondPillarAmount = grossPay * secondPillarMultiplier;
  const secondPillarNationalAmount = secondPillarPercentage > 0 ? grossPay * SECOND_PILLAR_NATIONAL_MULTIPLIER : 0;

  //ASSUMPTION: defence tax is calculated after unemployment insurance and pension deductions
  let defenceTaxableAmount = grossPay - unemploymentFee - secondPillarAmount - thirdPillarTaxFreeAmount;
  let incomeTaxableAmount = grossPay - unemploymentFee - secondPillarAmount - thirdPillarTaxFreeAmount - incomeTaxFreeAmount;
  if (incomeTaxableAmount < 0) incomeTaxableAmount = 0;
  if (defenceTaxableAmount < 0) defenceTaxableAmount = 0;

  const incomeTax = incomeTaxableAmount * incomeTaxMultiplier;
  const defenceTax = defenceTaxableAmount * defenceTaxMultiplier;
  const netPay = grossPay - unemploymentFee - secondPillarAmount - thirdPillarAmount - defenceTax - incomeTax;
  if (netPay < 0) {
    return {type: 'error', errorReason: "Net pay is less than 0"};
  }

  return {
    checkSum: (netPay + incomeTax + unemploymentFee + secondPillarAmount + thirdPillarAmount + defenceTax),
    defenceTax: defenceTax,
    defenceTaxPercentage: getPercentageOfGross(defenceTax, grossPay),
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

function getIncomeTaxFreeAmount(grossPay: number, useIncomeTaxFreeMinimum: boolean, useIncomeTaxCurve: boolean, incomeTaxFreeMinimum: number) {
  const TAX_FREE_GAP_START = 1200;
  const TAX_FREE_GAP_END = 2100;

  if (!useIncomeTaxFreeMinimum) {
    return 0
  }
  if (!useIncomeTaxCurve) {
    return incomeTaxFreeMinimum;
  }

  if (grossPay > TAX_FREE_GAP_END) {
    return 0;
  }
  if (grossPay < TAX_FREE_GAP_START) {
    return incomeTaxFreeMinimum;
  }
  return incomeTaxFreeMinimum - incomeTaxFreeMinimum / 900 * (grossPay - TAX_FREE_GAP_START)
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
