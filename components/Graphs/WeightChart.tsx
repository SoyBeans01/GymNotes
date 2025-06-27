import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-gifted-charts';
import { Picker } from '@react-native-picker/picker';
import { getExerciseHistory, loadUnit, getExerciseMonthlyHistory, getExerciseDailyHistory, loadDailyWeights } from '../utils/Storage';
import { Exercise } from '../utils/types'; // Adjust path if needed


interface ExerciseOption {
  id: string;
  name: string;
}

const WeightChart = () => {
  const [chartData, setChartData] = useState<{ label: string; value: number }[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [exerciseOptions, setExerciseOptions] = useState<ExerciseOption[]>([]);

  const SCREEN_WIDTH = Dimensions.get('window').width;
  const chartPadding = 66;
  const chartWidth = SCREEN_WIDTH - (chartPadding * 2);

  const [mode, setMode] = useState<'weeks' | 'months' | 'daily'>('weeks');

  const [unit, setUnit] = useState<'lbs' | 'kg'>('lbs'); // default fallback

  useEffect(() => {
    const fetchUnit = async () => {
      const savedUnit = await loadUnit();
      setUnit(savedUnit);
    };
    fetchUnit();
  }, []);

  // Load available exercises and match them with weights
  useFocusEffect(
    useCallback(() => {
      const loadExerciseOptions = async () => {
        try {
          const weightsRaw = await AsyncStorage.getItem('exerciseWeights');
          const exRaw = await AsyncStorage.getItem('exercises');
          if (!exRaw) return;

          const allExercises: Exercise[] = JSON.parse(exRaw);
          const weightsByDate: Record<string, Record<string, number>> = weightsRaw
            ? (JSON.parse(weightsRaw) as Record<string, Record<string, number>>)
            : {};

          // if you only want those with history:
          const usedIds = new Set<string>();
          Object.values(weightsByDate).forEach(e =>
            Object.keys(e).forEach(id => usedIds.add(id))
          );
          const filtered = allExercises.filter(ex => usedIds.has(ex.id));

          // OR to show every exercise:
          // const filtered = allExercises;

          setExerciseOptions(
            filtered.map(ex => ({ id: ex.id, name: ex.name || 'Unnamed' }))
          );
          if (!selectedExerciseId && filtered.length) {
            setSelectedExerciseId(filtered[0].id);
          }
        } catch (e) {
          console.error('Failed to load exercises', e);
        }
      };

      loadExerciseOptions();
    }, [selectedExerciseId])  // you can omit selectedExerciseId if you don't want it
  );

  // Update chart when selected exercise changes
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadChart = async () => {
        const raw = await AsyncStorage.getItem('exerciseWeights');
        const all = raw ? JSON.parse(raw) : {};
        if (!selectedExerciseId) {
          if (isActive) setChartData([]);
          return;
        }

        let history;
        if (mode === 'weeks') {
          history = getExerciseHistory(all, selectedExerciseId);
        } else if (mode === 'months') {
          history = getExerciseMonthlyHistory(all, selectedExerciseId);
        } else {
          history = getExerciseDailyHistory(all, selectedExerciseId, 6);
        }

        if (isActive) setChartData(history);
      };

      loadChart();

      // cleanup in case the screen loses focus before load finishes:
      return () => {
        isActive = false;
      };
    }, [selectedExerciseId, mode])
  );


  const maxWeight = Math.max(...chartData.map((d) => d.value), 0);
  const { step, roundedMax, sections } = getStepSizeAndMax(maxWeight, unit);
  const visibleChartData = mode === 'weeks'
    ? chartData.slice(-6)
    : chartData;

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
        <View style={styles.chartTitleRow}>
          <Text style={styles.chartTitle}>
            {mode === 'weeks' ? '6 Week Progress'
              : mode === 'months'
                ? 'Monthly Progress'
                : '6 Day Progress'}
          </Text>

          <Picker
            selectedValue={mode}
            onValueChange={(value) => setMode(value)}
            style={styles.modePicker}
            dropdownIconColor="#fff"
          >
            <Picker.Item label="Daily" value="daily" />
            <Picker.Item label="Weeks" value="weeks" />
            <Picker.Item label="Months" value="months" />
          </Picker>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>

          <Text style={{ color: '#ccc', marginLeft: 16, writingDirection: 'ltr', transform: [{ rotate: '-90deg' }] }}>
            {unit.toUpperCase()}
          </Text>

          {/* Chart itself */}
          <LineChart
            data={visibleChartData}
            width={chartWidth}
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
            //isAnimated
            //animateOnDataChange

            maxValue={roundedMax}
          />
        </View>

        {/* X-axis label */}
        <Text style={{ color: '#ccc', marginTop: 4 }}>
          {mode === 'weeks' ? 'Weeks'
            : mode === 'months'
              ? 'Months'
              : 'Days'}
        </Text>
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
    fontSize: 24,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  picker: {
    color: '#fff',
    backgroundColor: '#222',
    marginBottom: 16,
  },
  chartTitle: {
    color: '#fff',
    fontSize: 24,
    marginVertical: 16,
  },
  arrowsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  arrow: {
    fontSize: 24,
    color: '#aaa',
    marginHorizontal: 20,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginLeft: 48,
    marginTop: 16,
  },

  modePicker: {
    color: '#fff',
    backgroundColor: '#222',
    width: 200,
    height: 36,
  },
});

export default WeightChart;
