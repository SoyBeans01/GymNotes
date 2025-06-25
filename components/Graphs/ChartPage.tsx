import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';

import WeightChart from './WeightChart';
import BodyChart from './BodyChart';
import CardioChart from './CardioChart';

const SCREEN_WIDTH = Dimensions.get('window').width;

const ChartPage = () => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.chartWrapper}>
          <WeightChart />
        </View>
        <View style={styles.chartWrapper}>
          <BodyChart />
        </View>
        <View style={styles.chartWrapper}>
          <CardioChart />
        </View>
      </ScrollView>

      {/* Optional arrows below the scroll view */}
      <View style={styles.arrowsContainer}>
        <Text style={styles.arrow}>⬅️</Text>
        <Text style={styles.arrow}>➡️</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  chartWrapper: {
    width: SCREEN_WIDTH,
  },
  arrowsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  arrow: {
    fontSize: 24,
    color: '#aaa',
    marginHorizontal: 20,
  },
});

export default ChartPage;
