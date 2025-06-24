// exercises/CategoryGroup.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation } from 'react-native';
import { Exercise, Unit, WeightsMap } from '../utils/types';
import { ExerciseItem } from './ExerciseItem';

interface CategoryGroupProps {
  title: string;
  exercises: Exercise[];
  expanded: boolean;
  toggleExpand: () => void;
  editMode: boolean;
  weights: WeightsMap;
  unit: Unit;
  setWeights: (weights: WeightsMap) => void;
  expandedMap: { [key: string]: boolean };
  onToggleExercise: (id: string) => void;
  onNameChange: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export const CategoryGroup: React.FC<CategoryGroupProps> = ({
  title,
  exercises,
  expanded,
  toggleExpand,
  editMode,
  weights,
  unit,
  setWeights,
  expandedMap,
  onToggleExercise,
  onNameChange,
  onDelete,
}) => {
  return (
    <View style={{ marginBottom: 10 }}>
      <Pressable onPress={toggleExpand} style={styles.categoryHeader}>
        <Text style={styles.categoryTitle}>{title}</Text>
        <Text style={styles.categoryToggle}>{expanded ? '▾' : '▸'}</Text>
      </Pressable>

      {expanded && exercises.map((exercise) => (
        <ExerciseItem
          key={exercise.id}
          item={exercise}
          expanded={!!expandedMap[exercise.id]}
          editMode={editMode}
          weights={weights}
          unit={unit}
          setWeights={setWeights}
          onToggleExpand={onToggleExercise}
          onNameChange={onNameChange}
          onDelete={onDelete}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#222',
    padding: 10,
    borderRadius: 6,
  },
  categoryTitle: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  categoryToggle: {
    fontSize: 20,
    color: '#aaa',
  },
});
