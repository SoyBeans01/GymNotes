import { Image } from 'expo-image';
import { Platform, StyleSheet, Text, View, SafeAreaView, ScrollView } from 'react-native';

import ExerciseList from '@/components/ExerciseList';
export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeContainer}>
        <View style={styles.container}>
          <Text style={styles.text}> HELLOW </Text>
        </View>
      
        <ExerciseList />




    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: 'red',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'pink',
  },
  text: {
    color: 'white',
    fontSize: 16,
  }
});
