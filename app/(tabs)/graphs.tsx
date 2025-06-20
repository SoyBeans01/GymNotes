import React, { useEffect, useState } from 'react';
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

interface ExerciseLog {
  [exerciseId: string]: {
    [weekISO: string]: number;
  };
}

interface Exercise {
  id: string;
  name: string;
}

const EXERCISES: Exercise[] = [
  { id: '1', name: 'Bench Press' },
  { id: '2', name: 'Squat' },
  { id: '3', name: 'Deadlift' },
  { id: '4', name: 'Shoulder Press' },
  { id: '5', name: 'Barbell Row' },
];

const screenWidth = Dimensions.get('window').width;

const GraphsScreen: React.FC = () => {
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const raw = await AsyncStorage.getItem('exerciseLogs');
        if (raw) {
          setExerciseLogs(JSON.parse(raw));
        }
      } catch (e) {
        console.error('Failed to load logs', e);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#00BFFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Weekly Progress</Text>

      {EXERCISES.map((exercise) => {
        const logs = exerciseLogs[exercise.id];
        if (!logs || Object.keys(logs).length === 0) {
          return (
            <View key={exercise.id} style={styles.chartContainer}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.noData}>No data available.</Text>
            </View>
          );
        }

        const sortedWeeks = Object.keys(logs).sort();
        const weights = sortedWeeks.map((week) => logs[week]);

        return (
          <View key={exercise.id} style={styles.chartContainer}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>

            <LineChart
              data={{
                labels: sortedWeeks.map((w) => w.slice(5)), // e.g. 'W23'
                datasets: [{ data: weights }],
              }}
              width={screenWidth - 30}
              height={220}
              yAxisSuffix=" lb"
              yAxisInterval={1}
              chartConfig={{
                backgroundColor: '#111',
                backgroundGradientFrom: '#111',
                backgroundGradientTo: '#111',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(0, 191, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: '#00BFFF',
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>
        );
      })}
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
    fontSize: 26,
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
  },
  noData: {
    color: '#888',
    fontStyle: 'italic',
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
});
