// components/dashboard/StreakCounter.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  streak: number;
};

export const StreakCounter: React.FC<Props> = ({ streak }) => (
  <View style={styles.container}>
    <Text style={styles.label}>🔥</Text>
    <Text style={styles.number}>{streak}</Text>
  </View>
);


const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
    backgroundColor: '#00BFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  label: {
    color: 'white',
    fontSize: 16,
  },
  number: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
