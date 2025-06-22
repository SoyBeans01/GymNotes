// ExerciseList.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Dimensions,
  LayoutAnimation,
  UIManager,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

const router = useRouter();

interface Exercise {
  id: string;
  name: string;
}

interface WeightsMap {
  [key: string]: number;
}

const ITEM_WIDTH = 90;
const SCREEN_WIDTH = Dimensions.get('window').width;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const roundToNearest = (value: number, step: number) => Math.round(value / step) * step;
const lbsToKgRounded = (lbs: number): number => Math.round(lbs / 2.20462);
const kgToLbsRounded = (kg: number): number => roundToNearest(kg * 2.20462, 2.5);

const getStepValues = (currentWeight: number = 0, unit: 'lbs' | 'kg' = 'lbs'): number[] => {
  const buffer = unit === 'kg' ? 25 : 50;
  const step = unit === 'kg' ? 1 : 2.5;
  const maxLimit = unit === 'kg' ? 206 : 1000;
  const min = Math.max(0, currentWeight - buffer);
  const max = Math.min(currentWeight + buffer, maxLimit);
  const steps = [];
  for (let i = min; i <= max; i += step) {
    steps.push(parseFloat(i.toFixed(1)));
  }
  return steps.length > 0 ? steps : [0];
};

const ExerciseList: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [weights, setWeights] = useState<WeightsMap>({});
  const [editMode, setEditMode] = useState(false);
  const [unit, setUnit] = useState<'lbs' | 'kg'>('lbs');

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const storedExercises = await AsyncStorage.getItem('exerciseList');
          if (storedExercises) setExercises(JSON.parse(storedExercises));

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

  useEffect(() => {
    AsyncStorage.setItem('exerciseList', JSON.stringify(exercises));
  }, [exercises]);

  const handleAddExercise = () => {
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: '',
    };
    setExercises((prev) => [...prev, newExercise]);
  };

  const handleDeleteExercise = (id: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== id));
    const updatedWeights = { ...weights };
    delete updatedWeights[id];
    setWeights(updatedWeights);
    AsyncStorage.setItem('exerciseWeights', JSON.stringify(updatedWeights));
  };

  const handleNameChange = (id: string, newName: string) => {
    setExercises((prev) => prev.map((e) => (e.id === id ? { ...e, name: newName } : e)));
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Exercise>) => {
    const currentWeight = weights[item.id] ?? 0;
    return (
      <View style={[styles.exerciseRow, isActive && styles.activeRow]}>
        {editMode && (
          <TouchableOpacity onPressIn={drag} style={styles.dragHandle}>
            <Ionicons name="menu" size={24} color="#ccc" />
          </TouchableOpacity>
        )}

        {editMode ? (
          <TextInput
            value={item.name}
            onChangeText={(text) => handleNameChange(item.id, text)}
            style={styles.nameInput}
            placeholder="Exercise Name"
            placeholderTextColor="#666"
          />
        ) : (
          <Text style={styles.exerciseName}>{item.name}</Text>
        )}

        <Text style={styles.weightDisplay}>{currentWeight} {unit}</Text>

        {editMode && (
          <TouchableOpacity onPress={() => handleDeleteExercise(item.id)} style={styles.deleteButton}>
            <Text style={{ color: 'white' }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.header}>Your Exercises</Text>

        <DraggableFlatList
          data={exercises}
          onDragEnd={({ data }) => setExercises(data)}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />

        <View style={styles.footerButtons}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddExercise}>
            <Text style={styles.addButtonText}>+ Add Exercise</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.editButton} onPress={() => setEditMode((prev) => !prev)}>
            <Text style={styles.editButtonText}>{editMode ? 'Done' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GestureHandlerRootView>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  activeRow: {
    backgroundColor: '#333',
  },
  dragHandle: {
    marginRight: 10,
  },
  nameInput: {
    flex: 1,
    fontSize: 18,
    color: 'white',
    borderBottomWidth: 1,
    borderColor: '#555',
  },
  exerciseName: {
    flex: 1,
    fontSize: 18,
    color: 'white',
  },
  weightDisplay: {
    color: '#00BFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginHorizontal: 10,
  },
  deleteButton: {
    padding: 5,
    backgroundColor: '#f55',
    borderRadius: 6,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  addButton: {
    backgroundColor: '#00BFFF',
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#444',
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
  },
});
