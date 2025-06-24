import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Picker } from '@react-native-picker/picker';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Mock saved weight progression per exercise
const mockExerciseData: Record<string, { label: string; value: number; dataPointText: string }[]> = {
  'Dumbbell Curls': [
    { label: 'W1', value: 20, dataPointText: '20 lbs' },
    { label: 'W2', value: 22.5, dataPointText: '22.5 lbs' },
    { label: 'W3', value: 25, dataPointText: '25 lbs' },
  ],
  'Bench Press': [
    { label: 'W1', value: 135, dataPointText: '135 lbs' },
    { label: 'W2', value: 145, dataPointText: '145 lbs' },
    { label: 'W3', value: 150, dataPointText: '150 lbs' },
  ],
  'Deadlift': [
    { label: 'W1', value: 200, dataPointText: '200 lbs' },
    { label: 'W2', value: 215, dataPointText: '215 lbs' },
    { label: 'W3', value: 225, dataPointText: '225 lbs' },
  ],
};

const ChartWithDropdown = () => {
  const [selectedExercise, setSelectedExercise] = useState('Dumbbell Curls');

  const chartData = mockExerciseData[selectedExercise] || [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weight Progression</Text>

      <Picker
        selectedValue={selectedExercise}
        onValueChange={(itemValue) => setSelectedExercise(itemValue)}
        style={styles.picker}
        dropdownIconColor="#fff"
      >
        {Object.keys(mockExerciseData).map((exercise) => (
          <Picker.Item key={exercise} label={exercise} value={exercise} />
        ))}
      </Picker>

      <LineChart
        data={chartData}
        spacing={44}
        thickness={3}
        color="#00BFFF"
        hideDataPoints={false}
        dataPointsColor="#FFD700"
        textColor="#FFF"
        yAxisColor="#888"
        xAxisColor="#888"
        xAxisLabelTextStyle={{ color: '#ccc' }}
        yAxisTextStyle={{ color: '#ccc' }}
        noOfSections={4}
        isAnimated
        animateOnDataChange
        curved
        maxValue={Math.max(...chartData.map((d) => d.value)) + 10}
      />
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
