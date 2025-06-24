import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Picker } from '@react-native-picker/picker';
import { getExerciseHistory, loadUnit } from '../utils/Storage';
import { Exercise } from '../utils/types'; // Adjust path if needed

interface ExerciseOption {
  id: string;
  name: string;
}

const ChartWithDropdown = () => {
  const [chartData, setChartData] = useState<{ label: string; value: number }[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [exerciseOptions, setExerciseOptions] = useState<ExerciseOption[]>([]);

  const [unit, setUnit] = useState<'lbs' | 'kg'>('lbs'); // default fallback

  useEffect(() => {
    const fetchUnit = async () => {
      const savedUnit = await loadUnit();
      setUnit(savedUnit);
    };
    fetchUnit();
  }, []);

  // Load available exercises and match them with weights
  useEffect(() => {
    const loadExerciseOptions = async () => {
      try {
        const weightsData = await AsyncStorage.getItem('exerciseWeights');
        const exercisesData = await AsyncStorage.getItem('exercises');

        if (!weightsData || !exercisesData) return;

        const weightsByDate: Record<string, Record<string, number>> = JSON.parse(weightsData);
        const exercises: Exercise[] = JSON.parse(exercisesData);

        // Collect all exercise IDs from weights
        const usedExerciseIds = new Set<string>();
        Object.values(weightsByDate).forEach((entry) => {
          Object.keys(entry).forEach((id) => usedExerciseIds.add(id));
        });

        // Filter and map to display names
        const filtered = exercises
          .filter((ex) => usedExerciseIds.has(ex.id))
          .map((ex) => ({ id: ex.id, name: ex.name || 'Unnamed' }));

        setExerciseOptions(filtered);
        if (filtered.length > 0) setSelectedExerciseId(filtered[0].id);
      } catch (e) {
        console.error('Failed to load chart data', e);
      }
    };

    loadExerciseOptions();
  }, []);

  // Update chart when selected exercise changes
  useFocusEffect(
    useCallback(() => {
      const loadChart = async () => {
        try {
          const weightsData = await AsyncStorage.getItem('exerciseWeights');
          const exercisesData = await AsyncStorage.getItem('exercises');

          if (!weightsData || !exercisesData) return;

          const weightsByDate: Record<string, Record<string, number>> = JSON.parse(weightsData);
          const exercises: Exercise[] = JSON.parse(exercisesData);

          const usedExerciseIds = new Set<string>();
          Object.values(weightsByDate).forEach((entry) => {
            Object.keys(entry).forEach((id) => usedExerciseIds.add(id));
          });

          const filtered = exercises
            .filter((ex) => usedExerciseIds.has(ex.id))
            .map((ex) => ({ id: ex.id, name: ex.name || 'Unnamed' }));

          setExerciseOptions(filtered);

          const selectedId = selectedExerciseId || (filtered.length > 0 ? filtered[0].id : '');
          setSelectedExerciseId(selectedId);

          if (selectedId) {
            const history = getExerciseHistory(weightsByDate, selectedId);
            setChartData(history);
          } else {
            setChartData([]);
          }

        } catch (e) {
          console.error('Failed to refresh chart data', e);
        }
      };

      loadChart();
    }, [selectedExerciseId])
  );

  const maxWeight = Math.max(...chartData.map((d) => d.value), 0);
  const { step, roundedMax, sections } = getStepSizeAndMax(maxWeight, unit);

  function getStepSizeAndMax(
    maxValue: number,
    unit: 'lbs' | 'kg'
  ): { step: number; roundedMax: number; sections: number } {
    let step = 10; // default

    if (unit === 'lbs') {
      if (maxValue < 15) step = 2.5;
      else if (maxValue < 50) step = 5;
      else if (maxValue < 135) step = 10;
      else if (maxValue < 225) step = 25;
      else if (maxValue < 315) step = 50;
      else step = 100;
    } else {
      // kg
      if (maxValue < 7) step = 1;
      else if (maxValue < 23) step = 2.5;
      else if (maxValue < 61) step = 5;
      else if (maxValue < 102) step = 10;
      else if (maxValue < 143) step = 20;
      else step = 50;
    }

    // Round maxValue **up** to nearest multiple of step
    const roundedMax = Math.ceil(maxValue / step) * step;

    // Calculate sections = how many steps fit in roundedMax
    const sections = roundedMax / step;

    return { step, roundedMax, sections };
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weight Progression</Text>

      <Picker
        selectedValue={selectedExerciseId}
        onValueChange={(value) => setSelectedExerciseId(value)}
        style={styles.picker}
        dropdownIconColor="#fff"
      >
        {exerciseOptions.map(({ id, name }) => (
          <Picker.Item key={id} label={name} value={id} />
        ))}
      </Picker>

      <View style={{ alignItems: 'center' }}>
        {/* Y-axis label */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: '#ccc', marginLeft: 16, writingDirection: 'ltr', transform: [{ rotate: '-90deg' }] }}>
            {unit.toUpperCase()}
          </Text>

          {/* Chart itself */}
          <LineChart
            data={chartData}
            spacing={44}
            thickness={3}
            color="#00BFFF"
            hideDataPoints={false}
            dataPointsColor="#00BFFF"
            textColor="#FFF"
            yAxisColor="#888"
            xAxisColor="#888"
            xAxisLabelTextStyle={{ color: '#ccc' }}
            yAxisTextStyle={{ color: '#ccc' }}
            noOfSections={sections}
            isAnimated
            animateOnDataChange
            curved
            //maxValue={Math.max(...chartData.map((d) => d.value), 0) + 10}
            maxValue={roundedMax}
          />
        </View>

        {/* X-axis label */}
        <Text style={{ color: '#ccc', marginTop: 4 }}>Weeks</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  picker: {
    color: '#fff',
    backgroundColor: '#222',
    marginBottom: 16,
  },
});

export default ChartWithDropdown;
