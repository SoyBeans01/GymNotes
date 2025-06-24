// exercises/ExerciseItem.tsx
import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Pressable } from 'react-native';
import { Exercise, Unit, WeightsMap } from '../utils/types';
import { WeightSlider } from './WeightSlider';
import { WeightInputModal } from './WeightInputModal';
import { useState } from 'react';
import { saveWeights } from '../utils/Storage';

interface ExerciseItemProps {
  item: Exercise;
  expanded: boolean;
  unit: Unit;
  weights: WeightsMap;
  editMode: boolean;
  onToggleExpand: (id: string) => void;
  onNameChange: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  setWeights: (weights: WeightsMap) => void;
}

export const ExerciseItem: React.FC<ExerciseItemProps> = ({
  item,
  expanded,
  unit,
  weights,
  editMode,
  onToggleExpand,
  onNameChange,
  onDelete,
  setWeights,
}) => {
  const currentWeightLbs = weights[item.id] ?? 0;
  const displayWeight = unit === 'kg'
    ? Math.round(currentWeightLbs / 2.20462)
    : currentWeightLbs;

  const [modalVisible, setModalVisible] = useState(false);
  const [weightInput, setWeightInput] = useState('');

  return (
    <View style={styles.exerciseContainer}>
      <View style={styles.exerciseHeader}>
        <Pressable onPress={() => onToggleExpand(item.id)} style={{ flex: 1 }}>
          {editMode ? (
            <TextInput
              style={styles.exerciseNameInput}
              value={item.name}
              onChangeText={(text) => onNameChange(item.id, text)}
              placeholder="Enter exercise name"
              placeholderTextColor="#777"
            />
          ) : (
            <Text style={styles.exerciseName}>{item.name || 'Unnamed Exercise'}</Text>
          )}
        </Pressable>

        <TouchableOpacity onLongPress={() => {
          setWeightInput(String(displayWeight));
          setModalVisible(true);
        }}>
          <Text style={styles.weightDisplay}>
            {displayWeight} {unit.toUpperCase()}
          </Text>
        </TouchableOpacity>

        {editMode && (
          <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>❌</Text>
          </TouchableOpacity>
        )}
      </View>

      {expanded && (
        <WeightSlider
          exerciseId={item.id}
          unit={unit}
          weights={weights}
          setWeights={setWeights}
        />
      )}

      <WeightInputModal
        visible={modalVisible}
        value={weightInput}
        setValue={setWeightInput}
        onClose={() => setModalVisible(false)}
        onSave={(newWeight) => {
          setWeights({ ...weights, [item.id]: newWeight });
          saveWeights({ ...weights, [item.id]: newWeight });
          setModalVisible(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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