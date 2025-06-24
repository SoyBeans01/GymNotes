import AsyncStorage from '@react-native-async-storage/async-storage';
import { Exercise } from './types';

export const saveWeights = async (weights: Record<string, number>) => {
  try {
    await AsyncStorage.setItem('exerciseWeights', JSON.stringify(weights));
  } catch (e) {
    console.error('Failed to save weights', e);
  }
};

export const loadWeights = async (): Promise<Record<string, number>> => {
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
export const saveLog = async (weights: Record<string, number>) => {
  try {
    await AsyncStorage.setItem('exerciseWeights', JSON.stringify(weights));
  } catch (e) {
    console.error('Failed to save weights', e);
  }
};

