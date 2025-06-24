// exercises/ExerciseList.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CategoryGroup } from './ExerciseCategories';
import { Exercise, ExpandedMap, Unit, WeightsMap } from '../utils/types';
import { saveExercises, loadExercises } from '../utils/Storage';
import { DEFAULT_EXERCISES } from '@/constants/DefaultExercises';
import { AddExerciseModal } from './AddExerciseModal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const initialCategories = ['Back', 'Biceps', 'Chest', 'Triceps', 'Shoulders', 'Core', 'Quadriceps', 'Hamstrings', 'Calves', 'Glutes', 'Other'] as const;

export const ExerciseList: React.FC = () => {
  const router = useRouter();

  const [weights, setWeights] = useState<WeightsMap>({});
  const [expanded, setExpanded] = useState<ExpandedMap>({});
  const [unit, setUnit] = useState<Unit>('lbs');
  const [editMode, setEditMode] = useState(false);
  const [categoryExpanded, setCategoryExpanded] = useState<Record<string, boolean>>({
    Cardio: false,
    Back: false,
    Biceps: false,
    Chest: false,
    Triceps: false,
    Shoulders: false,
    Core: false,
    Quadriceps: false,
    Hamstrings: false,
    Calves: false,
    Glutes: false,
    Other: false,
  });

  const [addModalVisible, setAddModalVisible] = useState(false);

  const [exercises, setExercises] = useState<Exercise[]>(DEFAULT_EXERCISES);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const storedWeights = await AsyncStorage.getItem('exerciseWeights');
          if (storedWeights) setWeights(JSON.parse(storedWeights));

          const storedUnit = await AsyncStorage.getItem('unit');
          if (storedUnit === 'kg' || storedUnit === 'lbs') setUnit(storedUnit);

          const savedExercises = await loadExercises();
          if (savedExercises.length > 0) {
            setExercises(savedExercises);
          } else {
            setExercises(DEFAULT_EXERCISES);
            await saveExercises(DEFAULT_EXERCISES); // ← important!
          }
        } catch (e) {
          console.error('Failed to load data', e);
        }
      };
      loadData();
    }, [])
  );

  const handleAddExercise = async () => {
    setCategoryExpanded(prev => ({
      ...prev,
      Other: true,
    }));
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: '',
      category: 'Other',
    };
    setExercises(prev => {
      const updated = [...prev, newExercise];
      saveExercises(updated); // no await needed inside setState
      return updated;
    });
  };

  const handleNameChange = (id: string, newName: string) => {
    setExercises(prev => {
      const updated = prev.map(ex => (ex.id === id ? { ...ex, name: newName } : ex));
      saveExercises(updated);
      return updated;
    });
  };

  const handleDeleteExercise = (id: string) => {
    setExercises(prev => {
      const updated = prev.filter(ex => ex.id !== id);
      saveExercises(updated);
      return updated;
    });
  };

  const toggleCategory = (cat: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCategoryExpanded(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleExerciseExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const groupedExercises = exercises.reduce<Record<string, Exercise[]>>((acc, ex) => {
    if (!acc[ex.category]) acc[ex.category] = [];
    acc[ex.category].push(ex);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Gym Exercises</Text>

      <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/settings')}>
        <Text style={{ color: 'white' }}>⚙</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {initialCategories.map((category) => (
          <CategoryGroup
            key={category}
            title={category.charAt(0).toUpperCase() + category.slice(1)}
            exercises={groupedExercises[category] || []}
            expanded={categoryExpanded[category]}
            toggleExpand={() => toggleCategory(category)}
            editMode={editMode}
            weights={weights}
            unit={unit}
            setWeights={setWeights}
            expandedMap={expanded}
            onToggleExercise={toggleExerciseExpand}
            onNameChange={handleNameChange}
            onDelete={handleDeleteExercise}
          />
        ))}
      </ScrollView>

      <View style={styles.footerButtons}>
        <TouchableOpacity style={styles.addExerciseButton} onPress={() => setAddModalVisible(true)}>
          <Text style={styles.addExerciseButtonText}>+ Add Exercise</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.editModeButton} onPress={() => setEditMode(prev => !prev)}>
          <Text style={styles.editButtonText}>{editMode ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>
      <AddExerciseModal
        visible={addModalVisible}
        categories={initialCategories as unknown as string[]}
        onClose={() => setAddModalVisible(false)}
        onAdd={(name, category) => {
          const newExercise: Exercise = {
            id: Date.now().toString(),
            name,
            category: category as Exercise['category'],
          };
          setExercises(prev => {
            const updated = [...prev, newExercise];
            saveExercises(updated);
            return updated;
          });

          setCategoryExpanded(prev => ({
            ...prev,
            [category]: true,
          }));

          setAddModalVisible(false);
        }}
      />
    </View>
  );
};

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
    marginBottom: 8,
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
});

export default ExerciseList;
