import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';

interface Exercise {
  id: string;
  name: string;
}

interface WeightsMap {
  [key: string]: number;
}

interface ExerciseLog {
  [exerciseId: string]: {
    [label: string]: number;
  };
}

const EXERCISES: Exercise[] = [
  { id: '1', name: 'Bench Press' },
  { id: '2', name: 'Squat' },
  { id: '3', name: 'Deadlift' },
  { id: '4', name: 'Shoulder Press' },
  { id: '5', name: 'Barbell Row' },
];

const screenWidth = Dimensions.get('window').width;

const convertWeight = (weightLbs: number, toUnit: 'lbs' | 'kg') => {
  return toUnit === 'kg' ? Math.round(weightLbs / 2.20462) : weightLbs;
};

const GraphsScreen: React.FC = () => {
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog>({});
  const [unit, setUnit] = useState<'lbs' | 'kg'>('lbs');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(EXERCISES[0].id);
  const [loading, setLoading] = useState(true);
  const tickCount = useRef(0);

  useFocusEffect(
  React.useCallback(() => {
    const loadData = async () => {
      try {
        const logsRaw = await AsyncStorage.getItem('exerciseLogs');
        const unitRaw = await AsyncStorage.getItem('unit');
        if (logsRaw) setExerciseLogs(JSON.parse(logsRaw));
        if (unitRaw === 'kg' || unitRaw === 'lbs') setUnit(unitRaw);
      } catch (e) {
        console.error('Failed to load logs or unit', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [])
);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        tickCount.current += 1;

        const weightsRaw = await AsyncStorage.getItem('exerciseWeights');
        const logsRaw = await AsyncStorage.getItem('exerciseLogs');

        const weights: WeightsMap = weightsRaw ? JSON.parse(weightsRaw) : {};
        const logs: ExerciseLog = logsRaw ? (JSON.parse(logsRaw) as ExerciseLog) : {};

        const label = `T+${tickCount.current * 30}s`;

        EXERCISES.forEach((ex) => {
          if (!logs[ex.id]) logs[ex.id] = {};
          logs[ex.id][label] = weights[ex.id] ?? 0;
        });

        setExerciseLogs({ ...logs });
        await AsyncStorage.setItem('exerciseLogs', JSON.stringify(logs));
      } catch (e) {
        console.error('Simulation update failed', e);
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#00BFFF" />
      </View>
    );
  }

  const selectedExercise = EXERCISES.find(e => e.id === selectedExerciseId);
  const logs = exerciseLogs[selectedExerciseId];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Exercise Progress ({unit.toUpperCase()})</Text>

      <Picker
        selectedValue={selectedExerciseId}
        onValueChange={(itemValue: string) => setSelectedExerciseId(itemValue)}
        style={styles.picker}
        dropdownIconColor="white"
      >
        {EXERCISES.map((exercise) => (
          <Picker.Item key={exercise.id} label={exercise.name} value={exercise.id} />
        ))}
      </Picker>

      {logs && Object.keys(logs).length > 0 ? (
        <View style={styles.chartContainer}>
          <Text style={styles.exerciseName}>{selectedExercise?.name}</Text>

          <LineChart
            data={{
              labels: Object.keys(logs).sort().map(label => label.replace('T+', '').replace('s', 's')),
              datasets: [{
                data: Object.keys(logs).sort().map(label =>
                  convertWeight(logs[label], unit)
                ),
              }],
            }}
            width={screenWidth - 30}
            height={220}
            yAxisSuffix={` ${unit}`}
            chartConfig={{
              backgroundColor: '#111',
              backgroundGradientFrom: '#111',
              backgroundGradientTo: '#111',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(0,191,255,${opacity})`,
              labelColor: () => '#ccc',
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#00BFFF',
              },
            }}
            bezier={false}
            style={styles.chart}
          />
        </View>
      ) : (
        <Text style={styles.noData}>No data for this exercise.</Text>
      )}
    </ScrollView>
  );
};

export default GraphsScreen;

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
  chartContainer: {
    marginBottom: 40,
  },
  exerciseName: {
    fontSize: 18,
    color: '#00BFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  noData: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  chart: {
    borderRadius: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  picker: {
    color: 'white',
    backgroundColor: '#222',
    marginBottom: 20,
  },
});
