// New ExerciseList.tsx (Main Entry)
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExerciseCategoryGroup } from './ExerciseCategoryGroup';
import { AddExerciseModal } from './AddExerciseModal';

const EXERCISE_KEY = 'userExercises';

export default function ExerciseList() {
  const [exercises, setExercises] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(EXERCISE_KEY);
      if (stored) setExercises(JSON.parse(stored));
    })();
  }, []);

  const saveExercises = async (updated) => {
    setExercises(updated);
    await AsyncStorage.setItem(EXERCISE_KEY, JSON.stringify(updated));
  };

  const handleAddExercise = (name, category) => {
    const updated = [...exercises, { id: Date.now().toString(), name, category, weight: 0 }];
    saveExercises(updated);
    setModalVisible(false);
  };

  const grouped = exercises.reduce((acc, cur) => {
    if (!acc[cur.category]) acc[cur.category] = [];
    acc[cur.category].push(cur);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <FlatList
        data={Object.entries(grouped)}
        keyExtractor={([category]) => category}
        renderItem={({ item: [category, items] }) => (
          <ExerciseCategoryGroup
            category={category}
            exercises={items}
            onUpdate={saveExercises}
          />
        )}
      />

      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
        <Text style={styles.addText}>+ Add Exercise</Text>
      </TouchableOpacity>

      <AddExerciseModal
        visible={modalVisible}
        categories={[...new Set(exercises.map(e => e.category))]}
        onAdd={handleAddExercise}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 16 },
  addButton: {
    backgroundColor: '#00BFFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  addText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
