// utils/weights.ts

export const roundToNearest = (value: number, step: number): number =>
  Math.round(value / step) * step;

export const lbsToKgRounded = (lbs: number): number =>
  Math.round(lbs / 2.20462);

export const kgToLbsRounded = (kg: number): number =>
  roundToNearest(kg * 2.20462, 2.5);

export const getStepValues = (
  currentDisplayWeight: number = 0,
  unit: 'lbs' | 'kg' = 'lbs'
): number[] => {
  const buffer = unit === 'kg' ? 25 : 50;
  const step = unit === 'kg' ? 1 : 2.5;
  const maxLimit = unit === 'kg' ? 206 : 1000;

  const min = Math.max(0, currentDisplayWeight - buffer);
  const max = Math.min(currentDisplayWeight + buffer, maxLimit);

  const steps: number[] = [];
  for (let i = min; i <= max; i += step) {
    steps.push(parseFloat(i.toFixed(1)));
  }
  if (steps.length === 0) steps.push(0);
  return steps;
};
