// exercises/WeightSlider.tsx
import React, { useEffect, useRef } from 'react';
import {
  FlatList,
  Text,
  View,
  Dimensions,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { WeightsMap, Unit } from '../utils/types';
import { saveWeights } from '../utils/Storage';


const ITEM_WIDTH = 90;
const SCREEN_WIDTH = Dimensions.get('window').width;

const roundToNearest = (value: number, step: number) =>
  Math.round(value / step) * step;

const lbsToKgRounded = (lbs: number): number =>
  Math.round(lbs / 2.20462);

const kgToLbsRounded = (kg: number): number =>
  roundToNearest(kg * 2.20462, 2.5);

const getStepValues = (currentDisplayWeight: number = 0, unit: Unit = 'lbs'): number[] => {
  const buffer = unit === 'kg' ? 25 : 50;
  const step = unit === 'kg' ? 1 : 2.5;
  const maxLimit = unit === 'kg' ? 206 : 1000;

  const min = Math.max(0, currentDisplayWeight - buffer);
  const max = Math.min(currentDisplayWeight + buffer, maxLimit);

  const steps = [];
  for (let i = min; i <= max; i += step) {
    steps.push(parseFloat(i.toFixed(1)));
  }
  if (steps.length === 0) steps.push(0);
  return steps;
};

interface WeightSliderProps {
  exerciseId: string;
  unit: Unit;
  weights: WeightsMap;
  setWeights: (weights: WeightsMap) => void;
}

export const WeightSlider: React.FC<WeightSliderProps> = ({
  exerciseId,
  unit,
  weights,
  setWeights,
}) => {
  const flatListRef = useRef<FlatList<number>>(null);

  const currentWeightLbs = weights[exerciseId] ?? 0;
  const displayWeight = unit === 'kg' ? lbsToKgRounded(currentWeightLbs) : currentWeightLbs;
  const stepValues = getStepValues(displayWeight, unit);
  const selectedIndex = stepValues.indexOf(displayWeight);

  useEffect(() => {
    if (flatListRef.current && selectedIndex >= 0) {
      flatListRef.current.scrollToOffset({ offset: selectedIndex * ITEM_WIDTH, animated: false });
    }
  }, [selectedIndex]);

  const handleScrollEnd = async (event: NativeSyntheticEvent<NativeScrollEvent>) => {
  const offsetX = event.nativeEvent.contentOffset.x;
  const centerIndex = Math.round(offsetX / ITEM_WIDTH);

  const isOutOfBounds = centerIndex < 0 || centerIndex >= stepValues.length;
  const clampedIndex = Math.max(0, Math.min(centerIndex, stepValues.length - 1));

  if (isOutOfBounds && flatListRef.current) {
    // Snap back to closest valid index if scrolled out of bounds
    flatListRef.current.scrollToOffset({
      offset: clampedIndex * ITEM_WIDTH,
      animated: true,
    });
    return; // Exit early, no weight update
  }

  const selectedDisplayWeight = stepValues[clampedIndex];

  const newValueLbs = unit === 'kg'
    ? kgToLbsRounded(selectedDisplayWeight)
    : roundToNearest(selectedDisplayWeight, 2.5);

  if (newValueLbs !== currentWeightLbs) {
    Haptics.selectionAsync();
    const updated = { ...weights, [exerciseId]: newValueLbs };
    setWeights(updated);
    const today = new Date().toISOString().split('T')[0];
    try {
      await saveWeights(exerciseId, today, newValueLbs);
    } catch (e) {
      console.error('Failed to save weight', e);
    }
  }
};
  return (
    <FlatList
      data={stepValues}
      keyExtractor={(val) => val.toString()}
      horizontal
      showsHorizontalScrollIndicator={false}
      renderItem={({ item: val }) => {
        const isSelected = displayWeight === val;
        return (
          <View style={styles.stepWrapper}>
            <Text style={[styles.stepText, isSelected && styles.selectedStep]}>{val}</Text>
          </View>
        );
      }}
      contentContainerStyle={{ paddingHorizontal: SCREEN_WIDTH / 2 - ITEM_WIDTH / 2 }}
      ref={flatListRef}
      snapToInterval={ITEM_WIDTH}
      decelerationRate="fast"
      onMomentumScrollEnd={handleScrollEnd}
      getItemLayout={(_, index) => ({
        length: ITEM_WIDTH,
        offset: ITEM_WIDTH * index,
        index,
      })}
      style={{ marginTop: 10, height: 50 }}
    />
  );
};

const styles = StyleSheet.create({
  stepWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: ITEM_WIDTH,
    height: 50,
  },
  stepText: {
    fontSize: 24,
    color: '#aaa',
  },
  selectedStep: {
    fontSize: 32,
    color: '#00BFFF',
    fontWeight: 'bold',
  },
});