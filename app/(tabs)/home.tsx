import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

interface Exercise {
  id: string;
  name: string;
}

interface WeightsMap {
  [key: string]: number;
}

interface ExpandedMap {
  [key: string]: boolean;
}

const EXERCISES: Exercise[] = [
  { id: '1', name: 'Bench Press' },
  { id: '2', name: 'Squat' },
  { id: '3', name: 'Deadlift' },
  { id: '4', name: 'Shoulder Press' },
  { id: '5', name: 'Barbell Row' },
];

const ITEM_WIDTH = 90;
const SCREEN_WIDTH = Dimensions.get('window').width;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  try {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  } catch (e) {
    console.warn('LayoutAnimation not supported');
  }
}

const roundToNearest = (value: number, step: number) =>
  Math.round(value / step) * step;

const getStepValues = (currentDisplayWeight: number = 0, unit: 'lbs' | 'kg' = 'lbs'): number[] => {
  const buffer = unit === 'kg' ? 25 : 50;
  const step = unit === 'kg' ? 1 : 2.5;
  const maxLimit = unit === 'kg' ? 206 : 1000;

  // Ensure min and max are valid numbers
  const min = Math.max(0, currentDisplayWeight - buffer);
  const max = Math.min(currentDisplayWeight + buffer, maxLimit);

  const steps = [];
  // If min > max (edge case), fallback to at least one value
  if (min > max) {
    steps.push(min);
    return steps;
  }

  for (let i = min; i <= max; i += step) {
    steps.push(parseFloat(i.toFixed(1)));
  }
  // If somehow empty, push default 0
  if (steps.length === 0) steps.push(0);
  return steps;
};

const ExerciseList: React.FC = () => {
  const [weights, setWeights] = useState<WeightsMap>({});
  const [expanded, setExpanded] = useState<ExpandedMap>({});
  const [unit, setUnit] = useState<'lbs' | 'kg'>('lbs');
  const flatListRefs = useRef<Record<string, FlatList<number> | null>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedWeights = await AsyncStorage.getItem('exerciseWeights');
        if (storedWeights) setWeights(JSON.parse(storedWeights));

        const storedUnit = await AsyncStorage.getItem('unit');
        if (storedUnit === 'kg' || storedUnit === 'lbs') setUnit(storedUnit);
      } catch (e) {
        console.error('Failed to load data', e);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    EXERCISES.forEach((exercise) => {
      if (expanded[exercise.id]) {
        const currentWeightLbs = weights[exercise.id] ?? 0;
        const displayWeight = unit === 'kg'
          ? Math.round(currentWeightLbs / 2.20462) // ROUND to whole kg here too
          : currentWeightLbs;
        const stepValues = getStepValues(displayWeight, unit);
        const selectedIndex = stepValues.indexOf(displayWeight);
        const ref = flatListRefs.current[exercise.id];
        if (ref && selectedIndex >= 0) {
          ref.scrollToOffset({ offset: selectedIndex * ITEM_WIDTH, animated: false });
        }
      }
    });
  }, [weights, expanded, unit]);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleUnit = async () => {
    const newUnit = unit === 'lbs' ? 'kg' : 'lbs';

    // Convert and round all weights on toggle
    const newWeights: WeightsMap = {};
    for (const key in weights) {
      const weight = weights[key];

      if (newUnit === 'kg') {
        const converted = weight / 2.20462;
        newWeights[key] = Math.round(converted);  // <-- round to whole kg
      } else {
        const converted = weight * 2.20462;
        newWeights[key] = roundToNearest(converted, 2.5); // round to nearest 2.5 lbs
      }
    }

    setUnit(newUnit);
    setWeights(newWeights);

    try {
      await AsyncStorage.setItem('unit', newUnit);
      await AsyncStorage.setItem('exerciseWeights', JSON.stringify(newWeights));
    } catch (e) {
      console.error('Failed to save unit or weights', e);
    }
  };

  const handleScrollEnd = (exerciseId: string) => (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    try {
      const offsetX = event.nativeEvent.contentOffset.x;
      const currentWeightLbs = weights[exerciseId] ?? 0;

      const displayWeight = unit === 'kg'
        ? Math.round(currentWeightLbs / 2.20462)
        : currentWeightLbs;

      const stepValues = getStepValues(displayWeight, unit);

      if (!stepValues || stepValues.length === 0) {
        console.warn(`No step values for exercis ${exerciseId}`);
        return;
      }

      const centerIndex = Math.round(offsetX / ITEM_WIDTH);
      const selectedDisplayWeight = stepValues[centerIndex] ?? stepValues[0];

      if (selectedDisplayWeight === undefined) {
        console.warn('Selected display weight is undefined, fallback to 0');
        return;
      }

      const newValueLbs = unit === 'kg'
        ? selectedDisplayWeight * 2.20462
        : selectedDisplayWeight;

      // Ensure newValueLbs is a valid number before calling toFixed
      if (typeof newValueLbs !== 'number' || isNaN(newValueLbs)) {
        console.warn('newValueLbs is not a number:', newValueLbs);
        return;
      }

      const rounded = parseFloat(newValueLbs.toFixed(1));

      if (rounded !== currentWeightLbs) {
        Haptics.selectionAsync();
        const updated = { ...weights, [exerciseId]: rounded };
        setWeights(updated);
        AsyncStorage.setItem('exerciseWeights', JSON.stringify(updated)).catch((e) => {
          console.error('Failed to save weight', e);
        });
      }
    } catch (e) {
      console.error('Error in handleScrollEnd:', e);
    }
  };


  const renderStep = (exerciseId: string, value: number) => {
    const currentWeightLbs = weights[exerciseId] ?? 0;
    const selectedDisplay = unit === 'kg'
      ? Math.round(currentWeightLbs / 2.20462)
      : currentWeightLbs;

    const isSelected = selectedDisplay === value;
    return (
      <View style={styles.stepWrapper}>
        <Text style={[styles.stepText, isSelected && styles.selectedStep]}>
          {value}
        </Text>
      </View>
    );
  };

  const renderExercise = ({ item }: { item: Exercise }) => {
    const isExpanded = expanded[item.id];
    const currentWeightLbs = weights[item.id] ?? 0;
    const displayWeight = unit === 'kg'
      ? Math.round(currentWeightLbs / 2.20462)
      : currentWeightLbs;
    const stepValues = getStepValues(displayWeight, unit);

    //Weekly Logs
    const getWeekISO = (date: Date): string => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const janFirst = new Date(d.getFullYear(), 0, 1);
      const days = Math.floor((d.getTime() - janFirst.getTime()) / (24 * 60 * 60 * 1000));
      const week = Math.ceil((days + janFirst.getDay() + 1) / 7);
      return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
    };

    const logWeeklyProgress = async (exerciseId: string, weight: number) => {
      const week = getWeekISO(new Date());
      const existingRaw = await AsyncStorage.getItem('exerciseLogs');
      const logs = existingRaw ? JSON.parse(existingRaw) : {};

      if (!logs[exerciseId]) logs[exerciseId] = {};
      logs[exerciseId][week] = weight;

      await AsyncStorage.setItem('exerciseLogs', JSON.stringify(logs));
    };

    return (
      <View style={styles.exerciseContainer}>
        <TouchableOpacity
          style={styles.exerciseHeader}
          onPress={() => toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.exerciseName}>{item.name}</Text>
          <Text style={styles.weightDisplay}>
            {displayWeight} {unit.toUpperCase()}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <FlatList
            data={stepValues}
            keyExtractor={(val) => val.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item: val }) => renderStep(item.id, val)}
            contentContainerStyle={{
              paddingHorizontal: SCREEN_WIDTH / 2 - ITEM_WIDTH / 2,
            }}
            ref={(ref) => {
              flatListRefs.current[item.id] = ref;
            }}
            snapToInterval={ITEM_WIDTH}
            decelerationRate="fast"
            onMomentumScrollEnd={handleScrollEnd(item.id)}
            getItemLayout={(_, index) => ({
              length: ITEM_WIDTH,
              offset: ITEM_WIDTH * index,
              index,
            })}
            style={styles.slider}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Gym Exercises</Text>

      <TouchableOpacity onPress={toggleUnit} style={styles.unitToggle}>
        <Text style={styles.unitToggleText}>
          Toggle Unit: {unit === 'lbs' ? 'LBS' : 'KG'}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={EXERCISES}
        renderItem={renderExercise}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </View>
  );
};

export default ExerciseList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    paddingTop: 60,
    paddingHorizontal: 15,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  unitToggle: {
    backgroundColor: '#00BFFF',
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 20,
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  unitToggleText: {
    color: '#111',
    fontSize: 16,
    fontWeight: 'bold',
  },
  exerciseContainer: {
    marginBottom: 30,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  exerciseName: {
    fontSize: 20,
    color: 'white',
    fontWeight: '600',
  },
  weightDisplay: {
    fontSize: 22,
    color: '#00BFFF',
    fontWeight: 'bold',
  },
  slider: {
    marginTop: 10,
    height: 50,
  },
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