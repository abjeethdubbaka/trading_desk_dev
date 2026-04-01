export const STEP_1_CHECKS = ['smoothVWAPPullback', 'controlledRedCandles', 'holdsAboveVWAP', 'lowerWicksDipBuyers'];
export const STEP_2_CHECKS = ['tightRange3to6Candles', 'volumeDriesUp', 'higherLowsForming', 'vwapSlopesUpward'];
export const STEP_3_CHECKS = ['breakAboveBaseHigh', 'volumeIncreases', 'vwapRising'];

export function getAutoSetupGrade(breakoutChecklist = {}) {
  const step1 = breakoutChecklist?.step1 || {};
  const step2 = breakoutChecklist?.step2 || {};
  const step3 = breakoutChecklist?.step3 || {};

  const yesCount = [
    ...STEP_1_CHECKS.map((key) => !!step1[key]),
    ...STEP_2_CHECKS.map((key) => !!step2[key]),
    ...STEP_3_CHECKS.map((key) => !!step3[key]),
  ].filter(Boolean).length;

  const step1Passed = STEP_1_CHECKS.every((key) => !!step1[key]);
  const step2Passed = STEP_2_CHECKS.every((key) => !!step2[key]);
  const step3Passed = STEP_3_CHECKS.every((key) => !!step3[key]);
  const passedSteps = [step1Passed, step2Passed, step3Passed].filter(Boolean).length;

  if (yesCount === 11) return 'A+';
  if (passedSteps === 3 && yesCount >= 9) return 'A';
  if (passedSteps === 2) return 'B';
  if (passedSteps === 1) return 'C';
  return 'D';
}

