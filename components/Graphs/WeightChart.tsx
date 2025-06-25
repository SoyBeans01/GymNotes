import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-gifted-charts';
import { Picker } from '@react-native-picker/picker';
import { getExerciseHistory, loadUnit } from '../utils/Storage';
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
  const sixWeekChartData = chartData.slice(-6);

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



  // ------------------ TEMPORARY TESTING FUNCTION ------------------
// ------------------ TEMPORARY TESTING FUNCTION ------------------
const addFakeDataPoint = async () => {
   if (!selectedExerciseId) return;

  // Create new data point - e.g. new week label + random value or incremental value
  const newLabel = chartData.length > 0
    ? `Week ${chartData.length + 1}`
    : 'Week 1';
  const newValue = chartData.length > 0
    ? chartData[chartData.length - 1].value + 5
    : 10;

  // New data point with hideDataPoint false so it shows on the chart
  const newPoint = { label: newLabel, value: newValue, hideDataPoint: false };

  // Updated data array
  const updatedChartData = [...chartData, newPoint];

  // Update the state to immediately show new point
  setChartData(updatedChartData);

  try {
    // Load all weights from AsyncStorage
    const weightsDataRaw = await AsyncStorage.getItem('exerciseWeights');
    const weightsData = weightsDataRaw ? JSON.parse(weightsDataRaw) : {};

    // Here, you would save by date. For this temp example, you might fake a date label:
    // You can replace with your real date system or key
    const fakeDate = "CDE";

    // Update the data for this exercise for this date
    if (!weightsData[fakeDate]) weightsData[fakeDate] = {};
    weightsData[fakeDate][selectedExerciseId] = newValue;

    // Save updated weights back
    await AsyncStorage.setItem('exerciseWeights', JSON.stringify(weightsData));
  } catch (e) {
    console.error('Failed to save test data point', e);
  }
};
// ---------------------------------------------------------------

// ---------------------------------------------------------------




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
        <Text style={styles.chartTitle}>6 Week Progress</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>

          <Text style={{ color: '#ccc', marginLeft: 16, writingDirection: 'ltr', transform: [{ rotate: '-90deg' }] }}>
            {unit.toUpperCase()}
          </Text>

          {/* Chart itself */}
          <LineChart
            data={sixWeekChartData}
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
        <Text style={{ color: '#ccc', marginTop: 4 }}>Weeks</Text>
      </View>

      {/* ------------------ TEMPORARY TEST BUTTON ------------------ */}
<TouchableOpacity style={styles.testButton} onPress={addFakeDataPoint}>
  <Text style={styles.testButtonText}>Add Test Data Point</Text>
</TouchableOpacity>
{/* ----------------------------------------------------------- */}
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



  testButton: {
  alignSelf: 'center',
  backgroundColor: '#444',
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderRadius: 6,
  marginBottom: 12,
},
testButtonText: {
  color: '#fff',
  fontSize: 16,
},
});

export default WeightChart;
