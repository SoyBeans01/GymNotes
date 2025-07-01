// components/dashboard/WeeklySummary.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  favoriteExercise: string;
  consistency: number;   // as %
  totalWeight: number;    // e.g. total lbs lifted
};

export const WeeklySummary: React.FC<Props> = ({
  favoriteExercise,
  consistency,
  totalWeight,
}) => (
  <View style={styles.container}>
    <View style={styles.row}>
      <Text style={styles.label}>Favorite Exercise:</Text>
      <Text style={styles.value}>{favoriteExercise}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Consistency:</Text>
      <Text style={styles.value}>{consistency}%</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Total Weight:</Text>
      <Text style={styles.value}>{totalWeight.toLocaleString()} lbs</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { marginVertical: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  label: { color: '#ccc' },
  value: { color: '#fff', fontWeight: 'bold' },
});
