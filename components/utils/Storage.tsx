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


