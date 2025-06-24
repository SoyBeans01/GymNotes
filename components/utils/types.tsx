// exercises/types.ts

export interface Exercise {
  id: string;
  name: string;
  category: 'Back' | 'Biceps' | 'Chest' | 'Triceps' | 'Shoulders' | 'Core' | 'Quadriceps' | 'Hamstrings' | 'Calves' | 'Glutes' | 'Other'
}

export interface WeightsMap {
  [key: string]: number;
}

export interface ExpandedMap {
  [key: string]: boolean;
}

export type Unit = 'lbs' | 'kg';