// components/dashboard/MusclePieChart.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

type Slice = { label: string; value: number; color: string };

type Props = {
  data: Slice[];
  radius?: number;
};

export const MusclePieChart: React.FC<Props> = ({ data, radius = 75 }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Top Muscles</Text>
    <PieChart
      data={data}
      radius={radius}
      donut
      showText
      textColor="white"
      textSize={18}
      showTextBackground
      textBackgroundRadius={8}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { marginVertical: 12, alignItems: 'center' },
  title: { color: '#00BFFF', fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
});
