import AsyncStorage from '@react-native-async-storage/async-storage';
import { Exercise } from './types';

/**
 * Given a date string (YYYY-MM-DD), return the Monday of that week.
 */
const getMonday = (dateStr: string): string => {
  // Parse dateStr as UTC midnight
  const [year, month, day] = dateStr.split('-').map(Number);
  // Month is 0-indexed in Date.UTC
  const dateUtc = new Date(Date.UTC(year, month - 1, day));

  const dayOfWeek = dateUtc.getUTCDay(); // Sunday=0, Monday=1, ...
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // days to Monday
  
  // Calculate Monday date in UTC
  const mondayUtc = new Date(dateUtc);
  mondayUtc.setUTCDate(dateUtc.getUTCDate() + diff);

  // Format YYYY-MM-DD from UTC date parts
  const yyyy = mondayUtc.getUTCFullYear();
  const mm = String(mondayUtc.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(mondayUtc.getUTCDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Save a new weight entry under the week it was recorded (grouped by Monday).
 */
export const saveWeights = async (
  exercise: string,
  dateStr: string,   // e.g. '2025-06-23'
  weight: number
) => {
  try {
    const mondayKey = getMonday(dateStr);
    const existing = await AsyncStorage.getItem('exerciseWeights');
    const parsed: Record<string, Record<string, number>> = existing
      ? JSON.parse(existing)
      : {};

    if (!parsed[mondayKey]) {
      parsed[mondayKey] = {};
    }

    parsed[mondayKey][exercise] = weight;

    await AsyncStorage.setItem('exerciseWeights', JSON.stringify(parsed));
  } catch (e) {
    console.error('Failed to save weights', e);
  }
};

/**
 * Load all stored weights, grouped by week and exercise.
 */
export const loadWeights = async (): Promise<Record<string, Record<string, number>>> => {
  try {
    const data = await AsyncStorage.getItem('exerciseWeights');
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error('Failed to load weights', e);
    return {};
  }
};

export const loadUnit = async (): Promise<'lbs' | 'kg'> => {
  try {
    const unit = await AsyncStorage.getItem('unit');
    return unit === 'kg' || unit === 'lbs' ? unit : 'lbs';
  } catch (e) {
    console.error('Failed to load unit', e);
    return 'lbs';
  }
};

export const saveExercises = async (exercises: Exercise[]) => {
  try {
    await AsyncStorage.setItem('exercises', JSON.stringify(exercises));
  } catch (e) {
    console.error('Failed to save exercises', e);
  }
};

export const loadExercises = async (): Promise<Exercise[]> => {
  try {
    const data = await AsyncStorage.getItem('exercises');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load exercises', e);
    return [];
  }
};

//Saves the log for the charts
// utils/transformWeights.ts
export const getExerciseHistory = (
  weightsByDate: Record<string, Record<string, number>>,
  exerciseId: string
): { label: string; value: number }[] => {
  const sortedDates = Object.keys(weightsByDate).sort();
  const history: { label: string; value: number }[] = [];

  for (const date of sortedDates) {
    const weight = weightsByDate[date][exerciseId];
    if (weight !== undefined) {
      history.push({
        label: date.slice(5), // show MM-DD
        value: weight,
      });
    }
  }

  return history;
};

export const getExerciseMonthlyHistory = (
  all: Record<string, Record<string, number>>,
  exerciseId: string
): { label: string; value: number }[] => {
  // 1. Flatten into array of { date, weight }
  const entries: { date: string; weight: number }[] = [];
  for (const [monday, exMap] of Object.entries(all)) {
    if (exerciseId in exMap) {
      entries.push({ date: monday, weight: exMap[exerciseId] });
    }
  }
  // 2. Sort ascending by date
  entries.sort((a, b) => a.date.localeCompare(b.date));

  // 3. Group by 'YYYY-MM', keeping only the last entry in each month
  const lastPerMonth: Record<string, { date: string; weight: number }> = {};
  for (const e of entries) {
    const monthKey = e.date.slice(0, 7);            // 'YYYY-MM'
    // each time we see a later date in same month, overwrite
    lastPerMonth[monthKey] = e;
  }

  // 4. Build result array, sorted by monthKey
  return Object.entries(lastPerMonth)
    .sort(([m1], [m2]) => m1.localeCompare(m2))
    .map(([monthKey, { weight }]) => ({
      label: monthKey.slice(5),    // '06', '07', etc.
      value: weight,
    }));
};

const DAILY_KEY = 'exerciseWeightsDaily';

export const saveDailyWeight = async (
  exerciseId: string,
  dateStr: string,
  weight: number
) => {
  try {
    const raw = await AsyncStorage.getItem(DAILY_KEY);
    const all: Record<string, Record<string, number>> = raw
      ? JSON.parse(raw)
      : {};
    if (!all[dateStr]) all[dateStr] = {};
    all[dateStr][exerciseId] = weight;
    await AsyncStorage.setItem(DAILY_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('saveDailyWeight failed', e);
  }
};

/**
 * Load the raw daily weights map: { 'YYYY-MM-DD': { exerciseId: weight, … }, … }
 */
export const loadDailyWeights = async (): Promise<
  Record<string, Record<string, number>>
> => {
  try {
    const raw = await AsyncStorage.getItem(DAILY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const getExerciseDailyHistory = (
  allDaily: Record<string, Record<string, number>>,
  exerciseId: string,
  days: number = 6
): { label: string; value: number }[] => {
  const result: { label: string; value: number }[] = [];
  let lastValue = 0;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split('T')[0];     // YYYY-MM-DD
    const entry = allDaily[iso]?.[exerciseId];
    if (entry !== undefined) {
      lastValue = entry;
    }
    const label = iso.slice(8);                    // day-of-month "DD"
    result.push({ label, value: lastValue });
  }

  return result;
};
