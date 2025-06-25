// BodyChart.tsx or CardioChart.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CardioChart = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>This is the Cardio Chart</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 18,
  },
});

export default CardioChart;
