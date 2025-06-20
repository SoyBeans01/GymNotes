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

type Exercise = {
  id: string;
  name: string;
};

type WeightsMap = {
  [key: string]: number;
};

const EXERCISES: Exercise[] = [
  { id: '1', name: 'Bench Press' },
  { id: '2', name: 'Squat' },
  { id: '3', name: 'Deadlift' },
  { id: '4', name: 'Shoulder Press' },
  { id: '5', name: 'Barbell Row' },
];

const STEP_VALUES = Array.from({ length: 81 }, (_, i) => i * 2.5);
const ITEM_WIDTH = 90;
const SCREEN_WIDTH = Dimensions.get('window').width;

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ExerciseList: React.FC = () => {
  const [weights, setWeights] = useState<WeightsMap>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const flatListRefs = useRef<Record<string, FlatList<number> | null>>({});

  useEffect(() => {
    const loadWeights = async () => {
      const stored = await AsyncStorage.getItem('exerciseWeights');
      if (stored) setWeights(JSON.parse(stored));
    };
    loadWeights();
  }, []);

  useEffect(() => {
    // Scroll to selected weight when weights or expanded change
    EXERCISES.forEach((exercise) => {
      if (expanded[exercise.id]) {
        const selectedIndex = STEP_VALUES.indexOf(weights[exercise.id] ?? 0);
        const ref = flatListRefs.current[exercise.id];
        if (ref && selectedIndex >= 0) {
          const centerOffset = selectedIndex * ITEM_WIDTH;
          ref.scrollToOffset({
            offset: centerOffset,
            animated: false,
          });
        }
      }
    });
  }, [weights, expanded]);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleScrollEnd = (exerciseId: string) => (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const centerIndex = Math.round(offsetX / ITEM_WIDTH);
    const newValue = STEP_VALUES[centerIndex];
    if (newValue !== weights[exerciseId]) {
      const updated = { ...weights, [exerciseId]: newValue };
      setWeights(updated);
      AsyncStorage.setItem('exerciseWeights', JSON.stringify(updated));
    }
  };

  const renderStep = (exerciseId: string, value: number) => {
    const isSelected = weights[exerciseId] === value;
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
    return (
      <View style={styles.exerciseContainer}>
        <TouchableOpacity
          style={styles.exerciseHeader}
          onPress={() => toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.exerciseName}>{item.name}</Text>
          <Text style={styles.weightDisplay}>{weights[item.id] ?? 0} lbs</Text>
        </TouchableOpacity>

        {isExpanded && (
          <FlatList
            data={STEP_VALUES}
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
