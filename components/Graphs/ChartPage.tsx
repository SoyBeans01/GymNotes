import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';

import WeightChart from './WeightChart';
import GrowthBarChart from './WeightBarChart';

const SCREEN_WIDTH = Dimensions.get('window').width;

const ChartPage = () => {
  return (
    <ScrollView>
    <View style={styles.container}>
        <View style={styles.chartWrapper}>
          <WeightChart />
          <GrowthBarChart />
        </View>
    </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  chartWrapper: {
    width: SCREEN_WIDTH,
    flexGrow: 1,
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
