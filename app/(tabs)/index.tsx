import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  LayoutAnimation,
  UIManager,
  Platform,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

const router = useRouter();

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

const lbsToKgRounded = (lbs: number): number =>
  Math.round(lbs / 2.20462);

const kgToLbsRounded = (kg: number): number =>
  roundToNearest(kg * 2.20462, 2.5);

const getStepValues = (currentDisplayWeight: number = 0, unit: 'lbs' | 'kg' = 'lbs'): number[] => {
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

const ExerciseList: React.FC = () => {
  const [weights, setWeights] = useState<WeightsMap>({});
  const [expanded, setExpanded] = useState<ExpandedMap>({});
  const [unit, setUnit] = useState<'lbs' | 'kg'>('lbs');
  const [editMode, setEditMode] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([
    { id: '1', name: 'Bench Press' },
    { id: '2', name: 'Squat' },
    { id: '3', name: 'Deadlift' },
    { id: '4', name: 'Shoulder Press' },
    { id: '5', name: 'Barbell Row' },
  ]);
  const flatListRefs = useRef<Record<string, FlatList<number> | null>>({});

  // Load weights and unit from AsyncStorage on screen focus
  useFocusEffect(
    useCallback(() => {
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
    }, [])
  );

  // Scroll weight sliders to saved weight on changes
  useEffect(() => {
    exercises.forEach((exercise) => {
      if (expanded[exercise.id]) {
        const currentWeightLbs = weights[exercise.id] ?? 0;
        const displayWeight = unit === 'kg'
          ? lbsToKgRounded(currentWeightLbs)
          : currentWeightLbs;
        const stepValues = getStepValues(displayWeight, unit);
        const selectedIndex = stepValues.indexOf(displayWeight);
        const ref = flatListRefs.current[exercise.id];
        if (ref && selectedIndex >= 0) {
          ref.scrollToOffset({ offset: selectedIndex * ITEM_WIDTH, animated: false });
        }
      }
    });
  }, [weights, expanded, unit, exercises]);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // When slider stops scrolling, save selected weight
  const handleScrollEnd = (exerciseId: string) => (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    try {
      const offsetX = event.nativeEvent.contentOffset.x;
      const currentWeightLbs = weights[exerciseId] ?? 0;
      const displayWeight = unit === 'kg'
        ? lbsToKgRounded(currentWeightLbs)
        : currentWeightLbs;
      const stepValues = getStepValues(displayWeight, unit);
      const centerIndex = Math.round(offsetX / ITEM_WIDTH);
      const selectedDisplayWeight = stepValues[centerIndex] ?? stepValues[0];

      let newValueLbs = unit === 'kg'
        ? kgToLbsRounded(selectedDisplayWeight)
        : roundToNearest(selectedDisplayWeight, 2.5);

      if (newValueLbs !== currentWeightLbs) {
        Haptics.selectionAsync();
        const updated = { ...weights, [exerciseId]: newValueLbs };
        setWeights(updated);
        AsyncStorage.setItem('exerciseWeights', JSON.stringify(updated)).catch((e) => {
          console.error('Failed to save weight', e);
        });
      }
    } catch (e) {
      console.error('Error in handleScrollEnd:', e);
    }
  };

  // Add new exercise with empty name
  const handleAddExercise = () => {
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: '',
    };
    setExercises(prev => [...prev, newExercise]);
  };

  // Update exercise name on edit
  const handleNameChange = (id: string, newName: string) => {
    setExercises(prev =>
      prev.map(ex => (ex.id === id ? { ...ex, name: newName } : ex))
    );
  };

  // Delete exercise and remove weight
  const handleDeleteExercise = (id: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== id));
    setWeights(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  // Render each weight step in the slider
  const renderStep = (exerciseId: string, value: number) => {
    const currentWeightLbs = weights[exerciseId] ?? 0;
    const selectedDisplay = unit === 'kg'
      ? lbsToKgRounded(currentWeightLbs)
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

  // Render each exercise row
  const renderExercise = ({ item }: { item: Exercise }) => {
    const isExpanded = expanded[item.id];
    const currentWeightLbs = weights[item.id] ?? 0;
    const displayWeight = unit === 'kg'
      ? lbsToKgRounded(currentWeightLbs)
      : currentWeightLbs;
    const stepValues = getStepValues(displayWeight, unit);

    return (
      <View style={styles.exerciseContainer}>
        <View style={styles.exerciseHeader}>
          <Pressable onPress={() => toggleExpand(item.id)} style={{ flex: 1 }}>
            {editMode ? (
              <TextInput
                style={styles.exerciseNameInput}
                value={item.name}
                onChangeText={(text) => handleNameChange(item.id, text)}
                placeholder="Enter exercise name"
                placeholderTextColor="#777"
              />
            ) : (
              <Text style={styles.exerciseName}>{item.name || 'Unnamed Exercise'}</Text>
            )}
          </Pressable>

          <Text style={styles.weightDisplay}>
            {displayWeight} {unit.toUpperCase()}
          </Text>

          {editMode && (
            <TouchableOpacity onPress={() => handleDeleteExercise(item.id)} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>❌</Text>
            </TouchableOpacity>
          )}
        </View>

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

      <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/settings')}>
        <Text style={{ color: 'white' }}>⚙</Text>
      </TouchableOpacity>

      <FlatList
        data={exercises}
        renderItem={renderExercise}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 30 }}
      />

      <View style={styles.footerButtons}>
        <TouchableOpacity style={styles.addExerciseButton} onPress={handleAddExercise}>
          <Text style={styles.addExerciseButtonText}>+ Add Exercise</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.editModeButton} onPress={() => setEditMode(prev => !prev)}>
          <Text style={styles.editButtonText}>{editMode ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>
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
  exerciseNameInput: {
    fontSize: 20,
    color: 'white',
    fontWeight: '600',
    borderBottomWidth: 1,
    borderColor: '#888',
    paddingVertical: 2,
  },
  weightDisplay: {
    fontSize: 22,
    color: '#00BFFF',
    fontWeight: 'bold',
    marginHorizontal: 10,
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
  settingsButton: {
    backgroundColor: '#7a7a7a',
    paddingHorizontal: 10,
    padding: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 60,
    right: 20,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  addExerciseButton: {
    backgroundColor: '#00BFFF',
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  addExerciseButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  editModeButton: {
    backgroundColor: '#444',
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
  },
  deleteButton: {
    marginLeft: 10,
    backgroundColor: '#ff5555',
    padding: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
  },
});
