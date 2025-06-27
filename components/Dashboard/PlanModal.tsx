import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';

interface Exercise {
  name: string;
  done: boolean;
}

export interface WorkoutPlan {
  isGymDay: boolean;
  workoutType: string;
  exercises: Exercise[];
  notes: string;
}

interface PlanModalProps {
  visible: boolean;
  onClose: () => void;
  date: string;
  plan?: WorkoutPlan;              // optional incoming plan for that date
  onSave: (plan: WorkoutPlan) => void;  // callback to save changes
}

const DEFAULT_EXERCISES = [
  { name: 'Bench Press', done: false },
  { name: 'Deadlift', done: false },
  { name: 'Squat', done: false },
];

const PlanModal = ({ visible, onClose, date, plan, onSave }: PlanModalProps) => {
  const [isGymDay, setIsGymDay] = useState(true);
  const [workoutType, setWorkoutType] = useState('');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>(DEFAULT_EXERCISES);

  // Load plan into state when modal opens or plan changes
  useEffect(() => {
    if (plan) {
      setIsGymDay(plan.isGymDay);
      setWorkoutType(plan.workoutType);
      setNotes(plan.notes);
      setExercises(plan.exercises.length ? plan.exercises : DEFAULT_EXERCISES);
    } else {
      // Reset to defaults if no plan
      setIsGymDay(true);
      setWorkoutType('');
      setNotes('');
      setExercises(DEFAULT_EXERCISES);
    }
  }, [plan, visible]);

  const toggleExercise = (index: number) => {
    const updated = [...exercises];
    updated[index].done = !updated[index].done;
    setExercises(updated);
  };

  const handleSave = () => {
    const updatedPlan: WorkoutPlan = {
      isGymDay,
      workoutType,
      exercises,
      notes,
    };
    onSave(updatedPlan);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Workout Plan for {date}</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Gym Day:</Text>
            <Switch value={isGymDay} onValueChange={setIsGymDay} />
          </View>

          <TextInput
            placeholder="Workout Type (e.g. Push, Pull)"
            value={workoutType}
            onChangeText={setWorkoutType}
            style={styles.input}
            placeholderTextColor="#888"
          />

          <Text style={styles.label}>Exercises:</Text>
          <ScrollView style={{ maxHeight: 120 }}>
            {exercises.map((ex, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => toggleExercise(i)}
                style={styles.exerciseItem}
              >
                <Text style={[styles.exerciseText, ex.done && styles.checked]}>
                  {ex.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TextInput
            placeholder="Notes..."
            value={notes}
            onChangeText={setNotes}
            multiline
            style={[styles.input, { height: 80 }]}
            placeholderTextColor="#888"
          />

          <View style={styles.buttonsRow}>
            <TouchableOpacity onPress={onClose} style={[styles.btn, styles.cancelBtn]}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={[styles.btn, styles.saveBtn]}>
              <Text style={styles.btnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modal: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00BFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    color: '#ccc',
    marginRight: 8,
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  exerciseItem: {
    paddingVertical: 4,
  },
  exerciseText: {
    color: '#fff',
  },
  checked: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btn: {
    padding: 10,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#555',
  },
  saveBtn: {
    backgroundColor: '#00BFFF',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default PlanModal;